<script lang="ts">
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import { headsUpEngine, type GameState } from '$lib/headsUpHoldemEngine';
  import { gameState, currentOpponent, incrementWins, getEntryCost, getReward, getStreakBonus, canAffordEntry } from '$lib/headsUpHoldemStore';
  import { aceTokens, formatNumber } from '$lib/stores';
  import { cpuManager } from '$lib/headsUpHoldemAI';

  let showGame = false;
  let raiseAmount = 10;
  let matchStarted = false;
  let entryCost = 0;
  let opponentWins = 0;
  let currentState: GameState | null = null;

  function startGame() {
    const currentOpp = $currentOpponent;
    if (!currentOpp) return;

    entryCost = getEntryCost(currentOpp.tier);
    
    if (!canAffordEntry(currentOpp.tier)) {
      alert('Not enough Ace Tokens to enter this match!');
      return;
    }

    // Deduct entry fee
    aceTokens.update(tokens => tokens - entryCost);
    
    showGame = true;
    matchStarted = true;
    headsUpEngine.startHand();
    cpuManager.initializeAI();
    
    // Get current wins for streak bonus calculation
    opponentWins = $gameState.wins?.[currentOpp.id] || 0;
    
    // Force update of current state to show action buttons immediately
    currentState = headsUpEngine.getCurrentState();
    
    // Debug: Log the game state to ensure it's properly initialized
    console.log('Game started with state:', currentState);
    console.log('Can player act?', headsUpEngine.canPlayerAct());
    console.log('Action options:', headsUpEngine.getActionOptions());
  }

  function handleAction(action: string) {
    switch (action) {
      case 'fold':
        headsUpEngine.playerFold();
        break;
      case 'call':
        headsUpEngine.playerCall();
        break;
      case 'check':
        headsUpEngine.playerCheck();
        break;
      case 'raise':
        headsUpEngine.playerRaise(raiseAmount);
        break;
      case 'allin':
        headsUpEngine.playerAllIn();
        break;
    }
    
    // After player action, CPU responds
    setTimeout(() => {
      cpuManager.makeCPUAction();
      
      // Check if game is over and handle rewards
      setTimeout(() => {
        const state = headsUpEngine.getCurrentState();
        if (state.gameOver && matchStarted) {
          handleGameEnd(state);
        }
      }, 500);
    }, 1000);
  }

  function handleGameEnd(state: GameState) {
    const currentOpp = $currentOpponent;
    if (!currentOpp) return;

    if (state.winner === 'player') {
      // Player won
      const baseReward = getReward(currentOpp.tier);
      const streakBonus = getStreakBonus(opponentWins + 1);
      const totalReward = baseReward + streakBonus;
      
      aceTokens.update(tokens => tokens + totalReward);
      incrementWins(currentOpp.id);
      
      alert(`Victory! You won ${totalReward} Ace Tokens (Base: ${baseReward}, Streak Bonus: ${streakBonus})`);
    } else {
      // Player lost
      alert('Defeat! Better luck next time.');
    }
    
    matchStarted = false;
  }

  function newHand() {
    // Check if player can afford entry again
    const currentOpp = $currentOpponent;
    if (!currentOpp) return;

    if (!canAffordEntry(currentOpp.tier)) {
      alert('Not enough Ace Tokens to enter this match!');
      showGame = false;
      goto('/shop');
      return;
    }

    headsUpEngine.startHand();
    cpuManager.initializeAI();
    matchStarted = true;
  }

  function goBack() {
    showGame = false;
    goto('/shop');
  }

  // Reactive statement to update current state
  $: if (showGame) {
    currentState = headsUpEngine.getCurrentState();
  }
</script>

{#if showGame}
  <div class="poker-table">
    <!-- Table Header -->
    <div class="table-header">
      <button class="back-btn" on:click={goBack}>← Back to Ladder</button>
      <div class="game-info">
        <h2 class="game-title">Heads-Up Hold'em</h2>
        <div class="opponent-challenge">
          <span class="challenge-text">Challenge:</span>
          <div class="opponent-chip">
            <span class="opponent-name">{$currentOpponent?.name}</span>
            <div class="difficulty-stars">
              {#each Array($currentOpponent?.difficultyStars || 0) as _, i}
                <span class="star">★</span>
              {/each}
            </div>
          </div>
        </div>
      </div>
      <div class="stacks-display">
        <div class="cpu-stack-container">
          <div class="stack-label">CPU Stack</div>
          <div class="chip-stack">{currentState?.cpuStack || 0}</div>
        </div>
        <div class="player-stack-container">
          <div class="stack-label">Your Stack</div>
          <div class="chip-stack">{currentState?.playerStack || 0}</div>
        </div>
      </div>
    </div>

    <!-- Poker Table Layout -->
    <div class="table-layout">
      <!-- CPU Area (Top of Table) -->
      <div class="cpu-position">
        <div class="cpu-avatar">
          <div class="avatar-icon">🤖</div>
          <div class="cpu-name">{$currentOpponent?.name}</div>
        </div>
        
        <div class="cpu-cards-area">
          {#each currentState?.cpuCards || [] as card}
            <div class="card-back">🂠</div>
          {/each}
        </div>

        <div class="cpu-action-display">
          {#if currentState?.cpuAction}
            <div class="action-pulse">
              <span class="action-badge">{currentState.cpuAction}</span>
            </div>
          {/if}
        </div>
      </div>

      <!-- Community Cards Area (Center) -->
      <div class="community-area">
        <div class="pot-display">
          <div class="pot-icon">💰</div>
          <div class="pot-amount">Pot: {currentState?.pot || 0}</div>
        </div>
        
        <div class="community-cards">
          {#each currentState?.communityCards || [] as card, index}
            <div class="community-card" class:revealed={card !== '🂠'}>
              {card}
            </div>
          {/each}
        </div>
        
        <div class="blinds-display">
          <span class="blind-label">Blinds:</span>
          <span class="blind-values">{currentState?.smallBlind || 0} / {currentState?.bigBlind || 0}</span>
        </div>
      </div>

      <!-- Player Area (Bottom of Table) -->
      <div class="player-position">
        <div class="player-action-display">
          {#if currentState?.playerAction}
            <div class="action-pulse">
              <span class="action-badge">{currentState.playerAction}</span>
            </div>
          {/if}
        </div>

        <div class="player-cards-area">
          {#each currentState?.playerCards || [] as card}
            <div class="player-card">{card}</div>
          {/each}
        </div>

        <div class="player-controls">
          <div class="phase-indicator">Phase: {currentState?.phase || 'pre-flop'}</div>
          
          {#if currentState?.gameOver}
            <div class="game-result">
              <h3 class="result-title">Hand Complete!</h3>
              <p class="winner-text">Winner: {currentState.winner || 'Unknown'}</p>
              <button class="new-hand-btn" on:click={newHand}>Deal New Hand</button>
            </div>
          {:else if headsUpEngine.canPlayerAct()}
            <div class="action-controls">
              <div class="betting-controls">
                {#each headsUpEngine.getActionOptions() as action}
                  {#if action === 'raise'}
                    <div class="raise-section">
                      <div class="raise-label">Raise Amount</div>
                      <div class="raise-input">
                        <input type="range" 
                               min="{currentState?.bigBlind || 1}" 
                               max="{currentState?.playerStack || 100}" 
                               bind:value={raiseAmount} 
                               class="bet-slider" />
                        <div class="raise-display">Raise: {raiseAmount}</div>
                      </div>
                    </div>
                  {:else}
                    <button class="action-button {action}" on:click={() => handleAction(action)}>
                      {action.toUpperCase()}
                    </button>
                  {/if}
                {/each}
              </div>
            </div>
          {/if}
        </div>
      </div>
    </div>
  </div>
{:else}
  <div class="game-start-screen">
    <div class="start-overlay">
      <h2 class="start-title">Heads-Up Hold'em Challenge</h2>
      <p class="start-subtitle">Ready to test your skills against the best?</p>
      <button class="start-game-btn" on:click={startGame}>
        <span class="btn-text">Start Challenge</span>
        <span class="btn-decor">♠️</span>
      </button>
    </div>
  </div>
{/if}

<style>
  /* Poker Table Theme */
  .poker-table {
    min-height: 100vh;
    background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
    color: #ffffff;
    padding: 1rem;
    position: relative;
    overflow: hidden;
    box-sizing: border-box;
  }

  /* Table Header */
  .table-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 1rem;
    padding: 1rem;
    background: rgba(0, 0, 0, 0.3);
    border-radius: 12px;
    border: 1px solid rgba(245, 197, 66, 0.3);
    backdrop-filter: blur(10px);
  }

  .back-btn {
    background: rgba(255, 255, 255, 0.1);
    border: 1px solid rgba(255, 255, 255, 0.3);
    color: white;
    padding: 0.5rem 1rem;
    border-radius: 8px;
    cursor: pointer;
    font-weight: 700;
    transition: all 0.3s ease;
  }

  .back-btn:hover {
    background: rgba(255, 255, 255, 0.2);
    transform: translateY(-2px);
  }

  .game-info {
    text-align: center;
    flex: 1;
  }

  .game-title {
    font-size: 1.5rem;
    font-weight: 800;
    color: #F5C542;
    margin: 0 0 0.5rem 0;
    text-shadow: 0 2px 4px rgba(0, 0, 0, 0.5);
  }

  .opponent-challenge {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 1rem;
  }

  .challenge-text {
    font-size: 0.9rem;
    color: #ccc;
    font-weight: 600;
  }

  .opponent-chip {
    background: linear-gradient(145deg, #2a2a4e, #353560);
    border: 2px solid rgba(245, 197, 66, 0.5);
    border-radius: 20px;
    padding: 0.5rem 1rem;
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }

  .opponent-name {
    font-weight: 700;
    color: #F5C542;
  }

  .difficulty-stars {
    display: flex;
    gap: 2px;
  }

  .star {
    color: #F5C542;
    font-size: 0.8rem;
  }

  .stacks-display {
    display: flex;
    gap: 1rem;
  }

  .cpu-stack-container, .player-stack-container {
    background: rgba(0, 0, 0, 0.3);
    border: 1px solid rgba(255, 255, 255, 0.2);
    border-radius: 8px;
    padding: 0.5rem 1rem;
    text-align: center;
  }

  .stack-label {
    font-size: 0.7rem;
    color: #888;
    text-transform: uppercase;
    letter-spacing: 1px;
  }

  .chip-stack {
    font-size: 1.2rem;
    font-weight: 800;
    color: #F5C542;
  }

  /* Table Layout */
  .table-layout {
    display: grid;
    grid-template-rows: 1fr 2fr 1fr;
    gap: 1rem;
    min-height: 400px;
    max-height: calc(100vh - 200px);
    position: relative;
    overflow-y: auto;
    overflow-x: hidden;
  }

  /* CPU Position (Top) */
  .cpu-position {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: flex-end;
    padding: 2rem;
  }

  .cpu-avatar {
    text-align: center;
    margin-bottom: 1rem;
  }

  .avatar-icon {
    font-size: 3rem;
    margin-bottom: 0.5rem;
    filter: drop-shadow(0 0 10px rgba(245, 197, 66, 0.5));
  }

  .cpu-name {
    font-size: 1.2rem;
    font-weight: 700;
    color: #fff;
  }

  .cpu-cards-area {
    display: flex;
    gap: 1rem;
    margin-bottom: 1rem;
  }

  .card-back {
    width: 60px;
    height: 80px;
    background: linear-gradient(145deg, #333, #444);
    color: #fff;
    border-radius: 12px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 2rem;
    border: 3px solid #555;
    box-shadow: 0 4px 15px rgba(0, 0, 0, 0.5);
    position: relative;
    overflow: hidden;
  }

  .card-back::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: radial-gradient(circle at center, rgba(255, 255, 255, 0.1) 0%, transparent 70%);
    pointer-events: none;
  }

  .cpu-action-display {
    min-height: 2rem;
  }

  /* Community Area (Center) */
  .community-area {
    background: linear-gradient(145deg, #0f3460, #16213e);
    border-radius: 20px;
    padding: 2rem;
    border: 3px solid #2a2a4e;
    box-shadow: 0 0 30px rgba(37, 99, 235, 0.3) inset;
    position: relative;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
  }

  .community-area::before {
    content: '';
    position: absolute;
    top: -10px;
    left: -10px;
    right: -10px;
    bottom: -10px;
    background: linear-gradient(45deg, transparent, rgba(245, 197, 66, 0.1), transparent);
    border-radius: 25px;
    z-index: -1;
  }

  .pot-display {
    display: flex;
    align-items: center;
    gap: 1rem;
    margin-bottom: 2rem;
    background: rgba(0, 0, 0, 0.3);
    padding: 1rem 2rem;
    border-radius: 25px;
    border: 2px solid rgba(255, 140, 0, 0.5);
  }

  .pot-icon {
    font-size: 2rem;
  }

  .pot-amount {
    font-size: 1.5rem;
    font-weight: 800;
    color: #FF8C00;
    text-shadow: 0 2px 4px rgba(0, 0, 0, 0.5);
  }

  .community-cards {
    display: flex;
    gap: 1rem;
    margin-bottom: 2rem;
  }

  .community-card {
    width: 70px;
    height: 90px;
    background: white;
    color: black;
    border-radius: 12px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 2rem;
    border: 3px solid #333;
    box-shadow: 0 6px 20px rgba(0, 0, 0, 0.4);
    transform: perspective(1000px) rotateX(15deg);
    transition: transform 0.3s ease;
  }

  .community-card:hover {
    transform: perspective(1000px) rotateX(0deg) translateY(-10px);
  }

  .blinds-display {
    font-size: 0.9rem;
    color: #888;
    background: rgba(0, 0, 0, 0.3);
    padding: 0.5rem 1rem;
    border-radius: 20px;
    border: 1px solid rgba(255, 255, 255, 0.2);
  }

  .blind-label {
    color: #ccc;
    margin-right: 0.5rem;
  }

  .blind-values {
    color: #F5C542;
    font-weight: 700;
  }

  /* Player Position (Bottom) */
  .player-position {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: flex-start;
    padding: 2rem;
  }

  .player-cards-area {
    display: flex;
    gap: 1rem;
    margin-bottom: 2rem;
  }

  .player-card {
    width: 70px;
    height: 90px;
    background: white;
    color: black;
    border-radius: 12px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 2rem;
    border: 3px solid #333;
    box-shadow: 0 6px 20px rgba(0, 0, 0, 0.4);
    cursor: pointer;
    transition: all 0.3s ease;
    transform: perspective(1000px) rotateX(15deg);
  }

  .player-card:hover {
    transform: perspective(1000px) rotateX(0deg) translateY(-10px);
    z-index: 10;
  }

  .player-controls {
    width: 100%;
    max-width: 600px;
    text-align: center;
  }

  .phase-indicator {
    font-size: 1.2rem;
    font-weight: 700;
    color: #F5C542;
    margin-bottom: 2rem;
    text-transform: uppercase;
    letter-spacing: 2px;
  }

  /* Action Controls */
  .action-controls {
    background: rgba(0, 0, 0, 0.3);
    padding: 2rem;
    border-radius: 16px;
    border: 2px solid rgba(255, 255, 255, 0.2);
  }

  .betting-controls {
    display: flex;
    flex-direction: column;
    gap: 1.5rem;
  }

  .action-button {
    padding: 1rem 2rem;
    font-size: 1.2rem;
    font-weight: 800;
    border: none;
    border-radius: 12px;
    cursor: pointer;
    text-transform: uppercase;
    letter-spacing: 1px;
    transition: all 0.3s ease;
    box-shadow: 0 4px 15px rgba(0, 0, 0, 0.3);
  }

  .action-button.fold {
    background: linear-gradient(145deg, #ff4757, #ff6b81);
    color: white;
  }

  .action-button.check {
    background: linear-gradient(145deg, #2ed573, #7bed9f);
    color: #000;
  }

  .action-button.call {
    background: linear-gradient(145deg, #3742fa, #5352ed);
    color: white;
  }

  .action-button.raise {
    background: linear-gradient(145deg, #ffa502, #ff6348);
    color: #000;
  }

  .action-button.allin {
    background: linear-gradient(145deg, #a55eea, #8854d0);
    color: white;
  }

  .action-button:hover {
    transform: translateY(-3px);
    box-shadow: 0 8px 25px rgba(0, 0, 0, 0.4);
  }

  .action-button:active {
    transform: translateY(0);
  }

  /* Raise Controls */
  .raise-section {
    background: rgba(0, 0, 0, 0.3);
    padding: 1.5rem;
    border-radius: 12px;
    border: 1px solid rgba(255, 255, 255, 0.2);
  }

  .raise-label {
    font-size: 0.9rem;
    color: #ccc;
    margin-bottom: 1rem;
    text-transform: uppercase;
    letter-spacing: 1px;
  }

  .raise-input {
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }

  .bet-slider {
    width: 100%;
    height: 6px;
    background: #444;
    border-radius: 3px;
    outline: none;
    cursor: pointer;
  }

  .bet-slider::-webkit-slider-thumb {
    appearance: none;
    width: 20px;
    height: 20px;
    background: #F5C542;
    border-radius: 50%;
    cursor: pointer;
    box-shadow: 0 0 10px rgba(245, 197, 66, 0.5);
  }

  .raise-display {
    font-size: 1.2rem;
    font-weight: 800;
    color: #F5C542;
    text-align: center;
    padding: 0.5rem;
    background: rgba(0, 0, 0, 0.3);
    border-radius: 8px;
    border: 1px solid rgba(245, 197, 66, 0.3);
  }

  /* Game Result */
  .game-result {
    text-align: center;
  }

  .result-title {
    font-size: 2rem;
    font-weight: 800;
    color: #F5C542;
    margin: 0 0 1rem 0;
    text-shadow: 0 2px 4px rgba(0, 0, 0, 0.5);
  }

  .winner-text {
    font-size: 1.2rem;
    color: #fff;
    margin-bottom: 2rem;
  }

  .new-hand-btn {
    padding: 1.5rem 3rem;
    font-size: 1.5rem;
    font-weight: 800;
    background: linear-gradient(145deg, #F5C542, #FF8C00);
    color: #000;
    border: none;
    border-radius: 12px;
    cursor: pointer;
    text-transform: uppercase;
    box-shadow: 0 8px 25px rgba(245, 197, 66, 0.4);
    transition: all 0.3s ease;
  }

  .new-hand-btn:hover {
    transform: translateY(-4px);
    box-shadow: 0 12px 35px rgba(245, 197, 66, 0.6);
  }

  /* Action Badges */
  .action-badge {
    display: inline-block;
    padding: 0.5rem 1.5rem;
    background: linear-gradient(145deg, #F5C542, #FF8C00);
    color: #000;
    border-radius: 20px;
    font-weight: 800;
    text-transform: uppercase;
    letter-spacing: 2px;
    box-shadow: 0 4px 15px rgba(245, 197, 66, 0.4);
    animation: pulse 2s infinite;
  }

  @keyframes pulse {
    0% { transform: scale(1); box-shadow: 0 4px 15px rgba(245, 197, 66, 0.4); }
    50% { transform: scale(1.05); box-shadow: 0 6px 25px rgba(245, 197, 66, 0.6); }
    100% { transform: scale(1); box-shadow: 0 4px 15px rgba(245, 197, 66, 0.4); }
  }

  .action-pulse {
    animation: fadeIn 0.5s ease;
  }

  @keyframes fadeIn {
    from { opacity: 0; transform: translateY(10px); }
    to { opacity: 1; transform: translateY(0); }
  }

  /* Start Screen */
  .game-start-screen {
    display: flex;
    align-items: center;
    justify-content: center;
    min-height: 100vh;
    background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
  }

  .start-overlay {
    text-align: center;
    background: rgba(0, 0, 0, 0.5);
    padding: 4rem;
    border-radius: 20px;
    border: 2px solid rgba(245, 197, 66, 0.3);
    backdrop-filter: blur(10px);
  }

  .start-title {
    font-size: 2.5rem;
    font-weight: 800;
    color: #F5C542;
    margin: 0 0 1rem 0;
    text-shadow: 0 4px 8px rgba(0, 0, 0, 0.5);
  }

  .start-subtitle {
    font-size: 1.2rem;
    color: #ccc;
    margin-bottom: 3rem;
  }

  .start-game-btn {
    padding: 1.5rem 4rem;
    font-size: 1.5rem;
    font-weight: 800;
    background: linear-gradient(145deg, #F5C542, #FF8C00);
    color: #000;
    border: none;
    border-radius: 12px;
    cursor: pointer;
    text-transform: uppercase;
    box-shadow: 0 8px 25px rgba(245, 197, 66, 0.4);
    transition: all 0.3s ease;
    display: inline-flex;
    align-items: center;
    gap: 1rem;
  }

  .start-game-btn:hover {
    transform: translateY(-4px);
    box-shadow: 0 12px 35px rgba(245, 197, 66, 0.6);
  }

  .btn-text {
    position: relative;
    z-index: 2;
  }

  .btn-decor {
    font-size: 1.5rem;
    filter: drop-shadow(0 0 5px rgba(255, 255, 255, 0.5));
  }

  /* Responsive Design */
  @media (max-width: 768px) {
    .table-layout {
      height: auto;
      min-height: 60vh;
    }

    .cpu-position, .player-position {
      padding: 1rem;
    }

    .community-area {
      padding: 1rem;
    }

    .community-cards {
      gap: 0.5rem;
    }

    .community-card, .player-card {
      width: 50px;
      height: 70px;
      font-size: 1.5rem;
    }

    .card-back {
      width: 50px;
      height: 70px;
      font-size: 1.5rem;
    }

    .betting-controls {
      gap: 1rem;
    }

    .action-button {
      padding: 0.75rem 1.5rem;
      font-size: 1rem;
    }

    .start-overlay {
      padding: 2rem;
      margin: 1rem;
    }

    .start-title {
      font-size: 1.5rem;
    }
  }
</style>
