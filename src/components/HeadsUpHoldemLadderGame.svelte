<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import { goto } from '$app/navigation';
  import { ladderEngine, LadderEngine } from '$lib/ladderEngine';
  import { ladderCPUManager } from '$lib/ladderAI';
  import { 
    ladderGameState, 
    ladderState,
    currentOpponent,
    currentOpponentWins,
    getEntryCost,
    deductEntryFee,
    awardReward,
    recordWin,
    recordLoss,
    type LadderGameState
  } from '$lib/ladderStore';
  import { aceTokens } from '$lib/stores';

  // Local state
  let raiseAmount = 2;
  let showGame = false;
  let entryCost = 0;
  let matchReward = 0;
  let showResult = false;
  let resultMessage = '';
  
  // Subscribe to game state
  let gameState: LadderGameState;
  const unsubscribe = ladderGameState.subscribe(state => {
    gameState = state;
    
    // Handle game over
    if (state.gameOver && state.winner) {
      handleGameEnd(state);
    }
  });

  onMount(() => {
    // Check if player can afford entry
    const opponent = $currentOpponent;
    if (!opponent) {
      alert('No opponent selected!');
      goto('/shop');
      return;
    }
    
    entryCost = getEntryCost(opponent.tier);
    
    if (!deductEntryFee(opponent.tier)) {
      alert('Not enough Ace Tokens to enter this match!');
      goto('/shop');
      return;
    }
    
    // Start the game
    showGame = true;
    ladderEngine.initialize($ladderState.deterministicSeed);
    ladderEngine.startHand();
    ladderCPUManager.initializeAI();
  });

  onDestroy(() => {
    unsubscribe();
  });

  function handleAction(action: string) {
    switch (action) {
      case 'fold':
        ladderEngine.playerFold();
        break;
      case 'call':
        ladderEngine.playerCall();
        break;
      case 'check':
        ladderEngine.playerCheck();
        break;
      case 'raise':
        ladderEngine.playerRaise(raiseAmount);
        break;
      case 'allin':
        ladderEngine.playerAllIn();
        break;
    }
  }

  function handleGameEnd(state: LadderGameState) {
    if (showResult) return; // Already showing result
    
    const opponent = $currentOpponent;
    if (!opponent) return;
    
    const wins = ($ladderState.wins[opponent.id] || 0) + 1;
    
    if (state.winner === 'player') {
      // Player won!
      matchReward = awardReward(opponent.tier, wins);
      recordWin(opponent.id);
      resultMessage = `🎉 Victory! You won ${matchReward} Ace Tokens!`;
    } else if (state.winner === 'cpu') {
      // Player lost
      recordLoss(opponent.id);
      resultMessage = '😢 Defeat! Better luck next time.';
    } else {
      // Tie
      resultMessage = '🤝 Split pot! It\'s a tie.';
    }
    
    showResult = true;
  }

  function startNewHand() {
    const opponent = $currentOpponent;
    if (!opponent) return;
    
    if (!deductEntryFee(opponent.tier)) {
      alert('Not enough Ace Tokens to continue!');
      goto('/shop');
      return;
    }
    
    showResult = false;
    ladderEngine.resetGame();
    ladderEngine.startHand();
    ladderCPUManager.initializeAI();
  }

  function goBack() {
    goto('/shop');
  }

  // Helper function to format card display
  function formatCard(card: string): string {
    if (!card || card === '') return '🂠';
    const rank = card[0];
    const suit = card[1];
    const suitSymbols: Record<string, string> = {
      '♠': '♠',
      '♥': '♥',
      '♦': '♦',
      '♣': '♣'
    };
    return `${rank}${suitSymbols[suit] || '?'}`;
  }

  // Check if card is red suit
  function isRedSuit(card: string): boolean {
    return card[1] === '♥' || card[1] === '♦';
  }

  // Get blind level name
  function getBlindLevelName(level: number): string {
    const names = ['10BB', '7.5BB', '5BB', '3.3BB', '2.5BB', '2BB', '1.7BB', '1.25BB', '1BB'];
    return names[level] || '10BB';
  }
</script>

{#if showGame && gameState}
  <div class="ladder-game">
    <!-- Header -->
    <div class="game-header">
      <button class="back-btn" on:click={goBack}>← Exit</button>
      <div class="game-title">
        <span class="opponent-name">{$currentOpponent?.name}</span>
        <div class="difficulty">
          {#each Array($currentOpponent?.difficultyStars || 0) as _}
            <span class="star">★</span>
          {/each}
        </div>
      </div>
      <div class="blind-level">Blinds: {gameState.smallBlind}/{gameState.bigBlind} ({getBlindLevelName(gameState.blindLevel)})</div>
    </div>

    <!-- Stacks Display -->
    <div class="stacks-row">
      <div class="stack-box player-stack">
        <div class="stack-label">Your Stack</div>
        <div class="stack-value">{gameState.playerStack}</div>
      </div>
      <div class="pot-box">
        <div class="pot-label">POT</div>
        <div class="pot-value">{gameState.pot}</div>
      </div>
      <div class="stack-box cpu-stack">
        <div class="stack-label">CPU Stack</div>
        <div class="stack-value">{gameState.cpuStack}</div>
      </div>
    </div>

    <!-- CPU Area -->
    <div class="cpu-area">
      <div class="cpu-info">
        <div class="cpu-avatar">{$currentOpponent?.portrait || '🤖'}</div>
        <div class="cpu-name">{$currentOpponent?.name}</div>
        <div class="cpu-wins">Wins: {$currentOpponentWins}/5</div>
      </div>
      <div class="cards-row">
        {#each gameState.cpuCards as card}
          {#if gameState.gameOver && gameState.phase === 'showdown'}
            <div class="card" class:red={isRedSuit(card)}>{formatCard(card)}</div>
          {:else}
            <div class="card card-back">🂠</div>
          {/if}
        {/each}
      </div>
      {#if gameState.cpuAction}
        <div class="action-badge cpu-action">{gameState.cpuAction.toUpperCase()}</div>
      {/if}
    </div>

    <!-- Community Cards -->
    <div class="community-area">
      <div class="phase-indicator">{gameState.phase.toUpperCase()}</div>
      <div class="community-cards">
        {#each gameState.communityCards as card, i}
          <div class="card" class:red={isRedSuit(card)}>
            {formatCard(card)}
          </div>
        {/each}
        <!-- Empty placeholders -->
        {#each Array(5 - gameState.communityCards.length) as _}
          <div class="card card-empty">-</div>
        {/each}
      </div>
    </div>

    <!-- Player Area -->
    <div class="player-area">
      {#if gameState.playerAction}
        <div class="action-badge player-action">{gameState.playerAction.toUpperCase()}</div>
      {/if}
      <div class="cards-row">
        {#each gameState.playerCards as card}
          <div class="card" class:red={isRedSuit(card)}>
            {formatCard(card)}
          </div>
        {/each}
        {#if gameState.playerCards.length === 0}
          <div class="card card-empty">-</div>
          <div class="card card-empty">-</div>
        {/if}
      </div>

      <!-- Controls -->
      <div class="controls-area">
        {#if showResult}
          <div class="result-modal">
            <div class="result-message">{resultMessage}</div>
            <div class="result-buttons">
              <button class="btn btn-primary" on:click={startNewHand}>Next Hand</button>
              <button class="btn btn-secondary" on:click={goBack}>Exit</button>
            </div>
          </div>
        {:else if gameState.canPlayerAct}
          <div class="action-buttons">
            {#each gameState.actionOptions as action}
              {#if action === 'raise'}
                <div class="raise-control">
                  <label class="raise-label">Raise: {raiseAmount} BB</label>
                  <input 
                    type="range" 
                    min={gameState.bigBlind} 
                    max={gameState.playerStack} 
                    bind:value={raiseAmount}
                    class="raise-slider"
                  />
                </div>
              {/if}
              <button 
                class="btn btn-{action}" 
                on:click={() => handleAction(action)}
              >
                {action.toUpperCase()}
              </button>
            {/each}
          </div>
        {:else if gameState.gameOver}
          <div class="waiting-text">Hand Complete</div>
        {:else}
          <div class="waiting-text">CPU is thinking...</div>
        {/if}
      </div>
    </div>

    <!-- Entry Info -->
    <div class="entry-info">
      Entry: {entryCost} tokens | Current Wins: {$currentOpponentWins}/5
    </div>
  </div>
{:else}
  <div class="loading-screen">
    <div class="loading-text">Loading...</div>
  </div>
{/if}

<style>
  /* Base Layout */
  .ladder-game {
    min-height: 100vh;
    background: linear-gradient(135deg, #0d1b2a 0%, #1b263b 50%, #0d1b2a 100%);
    color: #fff;
    padding: 1rem;
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }

  .loading-screen {
    min-height: 100vh;
    display: flex;
    align-items: center;
    justify-content: center;
    background: #0d1b2a;
    color: #fff;
  }

  /* Header */
  .game-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0.75rem 1rem;
    background: rgba(0, 0, 0, 0.4);
    border-radius: 12px;
    border: 1px solid rgba(245, 197, 66, 0.3);
  }

  .back-btn {
    background: rgba(255, 255, 255, 0.1);
    border: 1px solid rgba(255, 255, 255, 0.3);
    color: #fff;
    padding: 0.5rem 1rem;
    border-radius: 8px;
    cursor: pointer;
    font-weight: 600;
  }

  .game-title {
    text-align: center;
  }

  .opponent-name {
    font-size: 1.25rem;
    font-weight: 700;
    color: #f5c542;
  }

  .difficulty {
    display: flex;
    justify-content: center;
    gap: 2px;
  }

  .star {
    color: #f5c542;
    font-size: 0.8rem;
  }

  .blind-level {
    font-size: 0.9rem;
    color: #888;
    background: rgba(0, 0, 0, 0.3);
    padding: 0.25rem 0.75rem;
    border-radius: 12px;
  }

  /* Stacks Row */
  .stacks-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 1rem;
  }

  .stack-box {
    flex: 1;
    background: rgba(0, 0, 0, 0.4);
    border-radius: 12px;
    padding: 0.75rem;
    text-align: center;
    border: 1px solid rgba(255, 255, 255, 0.1);
  }

  .stack-label {
    font-size: 0.7rem;
    color: #888;
    text-transform: uppercase;
    letter-spacing: 1px;
  }

  .stack-value {
    font-size: 1.5rem;
    font-weight: 800;
    color: #f5c542;
  }

  .pot-box {
    background: linear-gradient(145deg, #f5c54220, #ff8c0020);
    border: 2px solid rgba(245, 197, 66, 0.5);
    border-radius: 12px;
    padding: 0.5rem 1.5rem;
    text-align: center;
  }

  .pot-label {
    font-size: 0.7rem;
    color: #f5c542;
    font-weight: 700;
  }

  .pot-value {
    font-size: 1.25rem;
    font-weight: 800;
    color: #f5c542;
  }

  /* CPU Area */
  .cpu-area {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.5rem;
    padding: 1rem;
    background: rgba(0, 0, 0, 0.2);
    border-radius: 12px;
  }

  .cpu-info {
    display: flex;
    align-items: center;
    gap: 1rem;
  }

  .cpu-avatar {
    font-size: 2rem;
    width: 48px;
    height: 48px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: rgba(255, 255, 255, 0.1);
    border-radius: 50%;
    border: 2px solid rgba(255, 255, 255, 0.2);
  }

  .cpu-name {
    font-weight: 700;
    font-size: 1.1rem;
  }

  .cpu-wins {
    font-size: 0.8rem;
    color: #888;
    background: rgba(0, 0, 0, 0.3);
    padding: 0.25rem 0.5rem;
    border-radius: 8px;
  }

  .cards-row {
    display: flex;
    gap: 0.5rem;
    justify-content: center;
  }

  /* Cards */
  .card {
    width: 50px;
    height: 70px;
    background: #fff;
    color: #000;
    border-radius: 8px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 1.25rem;
    font-weight: 700;
    border: 2px solid #333;
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.3);
  }

  .card.red {
    color: #dc2626;
  }

  .card-back {
    background: linear-gradient(145deg, #1e3a5f, #0f2744);
    color: #fff;
    border: 2px solid #2d5a87;
  }

  .card-empty {
    background: rgba(255, 255, 255, 0.1);
    border: 2px dashed rgba(255, 255, 255, 0.3);
    color: rgba(255, 255, 255, 0.3);
  }

  /* Action Badges */
  .action-badge {
    padding: 0.25rem 0.75rem;
    border-radius: 20px;
    font-weight: 700;
    font-size: 0.8rem;
    text-transform: uppercase;
    letter-spacing: 1px;
    animation: pulse 1s ease-in-out infinite;
  }

  .cpu-action {
    background: linear-gradient(145deg, #ef4444, #dc2626);
    color: #fff;
  }

  .player-action {
    background: linear-gradient(145deg, #3b82f6, #2563eb);
    color: #fff;
  }

  @keyframes pulse {
    0%, 100% { transform: scale(1); }
    50% { transform: scale(1.05); }
  }

  /* Community Area */
  .community-area {
    background: linear-gradient(145deg, #1e3a5f20, #0f274420);
    border: 2px solid rgba(245, 197, 66, 0.3);
    border-radius: 16px;
    padding: 1rem;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.75rem;
  }

  .phase-indicator {
    font-size: 0.9rem;
    font-weight: 700;
    color: #f5c542;
    letter-spacing: 2px;
  }

  .community-cards {
    display: flex;
    gap: 0.5rem;
    justify-content: center;
  }

  /* Player Area */
  .player-area {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.75rem;
    padding: 1rem;
    background: rgba(0, 0, 0, 0.2);
    border-radius: 12px;
  }

  /* Controls */
  .controls-area {
    width: 100%;
    max-width: 400px;
  }

  .action-buttons {
    display: flex;
    flex-wrap: wrap;
    gap: 0.5rem;
    justify-content: center;
  }

  .raise-control {
    width: 100%;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.25rem;
    margin-bottom: 0.5rem;
  }

  .raise-label {
    font-size: 0.9rem;
    color: #f5c542;
    font-weight: 600;
  }

  .raise-slider {
    width: 100%;
    height: 8px;
    accent-color: #f5c542;
  }

  .btn {
    padding: 0.75rem 1.5rem;
    border: none;
    border-radius: 8px;
    font-weight: 700;
    font-size: 0.9rem;
    cursor: pointer;
    text-transform: uppercase;
    transition: all 0.2s;
  }

  .btn-fold {
    background: linear-gradient(145deg, #ef4444, #dc2626);
    color: #fff;
  }

  .btn-check {
    background: linear-gradient(145deg, #22c55e, #16a34a);
    color: #fff;
  }

  .btn-call {
    background: linear-gradient(145deg, #3b82f6, #2563eb);
    color: #fff;
  }

  .btn-raise {
    background: linear-gradient(145deg, #f59e0b, #d97706);
    color: #000;
  }

  .btn-allin {
    background: linear-gradient(145deg, #a855f7, #9333ea);
    color: #fff;
  }

  .btn:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
  }

  .waiting-text {
    text-align: center;
    color: #888;
    font-style: italic;
  }

  /* Result Modal */
  .result-modal {
    text-align: center;
    padding: 1.5rem;
    background: rgba(0, 0, 0, 0.5);
    border-radius: 12px;
    border: 2px solid rgba(245, 197, 66, 0.5);
  }

  .result-message {
    font-size: 1.25rem;
    font-weight: 700;
    margin-bottom: 1rem;
    color: #f5c542;
  }

  .result-buttons {
    display: flex;
    gap: 1rem;
    justify-content: center;
  }

  .btn-primary {
    background: linear-gradient(145deg, #f5c542, #ff8c00);
    color: #000;
  }

  .btn-secondary {
    background: rgba(255, 255, 255, 0.1);
    border: 1px solid rgba(255, 255, 255, 0.3);
    color: #fff;
  }

  /* Entry Info */
  .entry-info {
    text-align: center;
    font-size: 0.8rem;
    color: #666;
    padding: 0.5rem;
  }

  /* Responsive */
  @media (max-width: 400px) {
    .card {
      width: 40px;
      height: 56px;
      font-size: 1rem;
    }

    .btn {
      padding: 0.5rem 1rem;
      font-size: 0.8rem;
    }
  }
</style>
