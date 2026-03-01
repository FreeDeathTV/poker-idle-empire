<script lang="ts">
  import { onMount } from 'svelte';
  import { pwaInstalled } from '$lib/pwaStore';
  import { aceTokens } from '$lib/stores';
  import { 
    ladderState, 
    currentOpponent, 
    isLadderUnlocked, 
    canStartMatch,
    LADDER_CPU_PROFILES,
    leaderboard,
    setCurrentOpponent,
    type LeaderboardEntry
  } from '$lib/ladderStore';
  import HeadsUpHoldemLadderGame from './HeadsUpHoldemLadderGame.svelte';

  let modalOpen = false;
  let showLeaderboard = false;
  let showGame = false;

  function openModal() {
    modalOpen = true;
  }

  function closeModal() {
    modalOpen = false;
    showLeaderboard = false;
    showGame = false;
  }

  function startMatch() {
    // Start the ladder game (inline, not navigating to /game)
    showGame = true;
  }

  function selectOpponent(opponentId: string) {
    setCurrentOpponent(opponentId);
  }

  function openLeaderboard() {
    showLeaderboard = true;
  }

  function closeLeaderboard() {
    showLeaderboard = false;
  }

  onMount(() => {
    // Listen for custom event to open the modal
    window.addEventListener('open-ladder-modal', () => {
      openModal();
    });
  });
</script>

{#if $pwaInstalled}
  <button class="ladder-entry-btn" on:click={openModal}>
    <div class="ladder-icon">🃏</div>
    <div class="ladder-title">Heads-Up Hold'em Ladder</div>
    <div class="ladder-badge">NEW</div>
  </button>
{/if}

{#if modalOpen}
  <div class="modal-overlay" on:click={closeModal}>
    <div class="modal-content" on:click|stopPropagation>
      <div class="modal-header">
        <h2 class="modal-title">Heads-Up Hold'em Ladder</h2>
        <button class="close-btn" on:click={closeModal}>×</button>
      </div>
      
      {#if showLeaderboard}
        <div class="leaderboard-content">
          <div class="leaderboard-header">
            <h3 class="leaderboard-title">Leaderboard</h3>
            <button class="back-btn" on:click={closeLeaderboard}>← Back to Ladder</button>
          </div>
          
          <div class="leaderboard-list">
            {#each $leaderboard as entry, index}
              <div class="leaderboard-item" class:player-entry={entry.name === 'Player'}>
                <div class="rank-badge">{index + 1}</div>
                <div class="player-info">
                  <div class="player-name">{entry.name}</div>
                  <div class="player-stats">
                    <span class="stat">Tokens: {entry.tokensWon}</span>
                    <span class="stat">Streak: {entry.winStreak}</span>
                    <span class="stat">Tier: {entry.highestTierBeaten}</span>
                  </div>
                </div>
              </div>
            {/each}
          </div>
        </div>
      {:else if showGame}
        <div class="game-container">
          <HeadsUpHoldemLadderGame />
        </div>
      {:else}
        <div class="ladder-list">
          {#each LADDER_CPU_PROFILES as opponent}
            <div 
              class="ladder-item" 
              class:unlocked={$ladderState.unlockedTiers >= opponent.tier}
              class:selected={$ladderState.currentOpponentId === opponent.id}
              on:click={() => selectOpponent(opponent.id)}
              role="button"
              tabindex="0"
            >
              <div class="opponent-info">
                <div class="opponent-portrait">{opponent.portrait}</div>
                <div class="opponent-details">
                  <div class="opponent-name">{opponent.name}</div>
                  <div class="opponent-bio">{opponent.bio}</div>
                  <div class="difficulty">
                    {#each Array(opponent.difficultyStars) as _, i}
                      <span class="star">★</span>
                    {/each}
                    {#each Array(5 - opponent.difficultyStars) as _, i}
                      <span class="star empty">★</span>
                    {/each}
                  </div>
                </div>
              </div>
              
              <div class="opponent-actions">
                {#if $ladderState.unlockedTiers >= opponent.tier}
                  <div class="win-progress">
                    Wins: {$ladderState.wins[opponent.id] || 0} / 5
                    <div class="progress-bar">
                      <div class="progress-fill" style="width: {Math.min((($ladderState.wins[opponent.id] || 0) / 5) * 100, 100)}%"></div>
                    </div>
                  </div>
                  {#if $ladderState.currentOpponentId === opponent.id}
                    <button class="start-match-btn" on:click|stopPropagation={startMatch}>
                      Start Match
                    </button>
                  {/if}
                {:else}
                  <div class="locked-badge">Locked</div>
                {/if}
              </div>
            </div>
          {/each}
        </div>
      {/if}

      <div class="modal-footer">
        <div class="current-tokens">Tokens: {$aceTokens}</div>
        <div class="footer-actions">
          <button class="leaderboard-btn" on:click={openLeaderboard}>Leaderboard</button>
          <button class="close-modal-btn" on:click={closeModal}>Close</button>
        </div>
      </div>
    </div>
  </div>
{/if}

<style>
  .ladder-entry-btn {
    display: flex;
    align-items: center;
    gap: 1rem;
    background: linear-gradient(145deg, #1a1a2e, #252540);
    border: 1px solid rgba(245, 197, 66, 0.3);
    border-radius: 12px;
    padding: 1rem;
    color: white;
    cursor: pointer;
    width: 100%;
    text-align: left;
    transition: all 0.3s ease;
  }

  .ladder-entry-btn:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 25px rgba(245, 197, 66, 0.3);
  }

  .ladder-icon {
    font-size: 2rem;
  }

  .ladder-title {
    flex: 1;
    font-size: 1.25rem;
    font-weight: 700;
    color: #F5C542;
  }

  .ladder-badge {
    background: rgba(245, 197, 66, 0.2);
    color: #F5C542;
    padding: 0.25rem 0.75rem;
    border-radius: 20px;
    font-size: 0.8rem;
    font-weight: 700;
    border: 1px solid rgba(245, 197, 66, 0.5);
  }

  .modal-overlay {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.8);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1000;
    padding: 1rem;
  }

  .modal-content {
    background: #1a1a2e;
    border-radius: 16px;
    border: 2px solid rgba(245, 197, 66, 0.3);
    box-shadow: 0 20px 50px rgba(0, 0, 0, 0.5);
    width: 100%;
    max-width: 600px;
    max-height: 80vh;
    overflow: hidden;
    display: flex;
    flex-direction: column;
  }

  .modal-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 1.5rem;
    border-bottom: 1px solid rgba(255, 255, 255, 0.1);
    background: rgba(245, 197, 66, 0.1);
  }

  .modal-title {
    font-size: 1.5rem;
    font-weight: 800;
    color: #F5C542;
    margin: 0;
  }

  .close-btn {
    background: none;
    border: none;
    color: #F5C542;
    font-size: 2rem;
    cursor: pointer;
    padding: 0;
    width: 40px;
    height: 40px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 50%;
  }

  .ladder-list {
    flex: 1;
    overflow-y: auto;
    padding: 1rem;
  }

  .ladder-item {
    background: rgba(255, 255, 255, 0.05);
    border-radius: 12px;
    padding: 1rem;
    margin-bottom: 1rem;
    border: 1px solid rgba(255, 255, 255, 0.1);
    display: flex;
    justify-content: space-between;
    align-items: center;
    transition: all 0.3s ease;
  }

  .ladder-item.unlocked {
    border-color: rgba(245, 197, 66, 0.3);
    background: rgba(245, 197, 66, 0.05);
  }

  .ladder-item.selected {
    border-color: #f5c542;
    background: rgba(245, 197, 66, 0.15);
    box-shadow: 0 0 20px rgba(245, 197, 66, 0.3);
  }

  .ladder-item:hover {
    transform: translateX(4px);
    cursor: pointer;
  }

  .game-container {
    max-height: 70vh;
    overflow-y: auto;
  }

  .opponent-info {
    display: flex;
    align-items: center;
    gap: 1rem;
    flex: 1;
  }

  .opponent-portrait {
    font-size: 2.5rem;
    width: 60px;
    height: 60px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 50%;
    background: rgba(255, 255, 255, 0.1);
    border: 2px solid rgba(255, 255, 255, 0.2);
  }

  .opponent-details {
    flex: 1;
  }

  .opponent-name {
    font-size: 1.25rem;
    font-weight: 700;
    color: white;
    margin-bottom: 0.25rem;
  }

  .opponent-bio {
    font-size: 0.9rem;
    color: #ccc;
    margin-bottom: 0.5rem;
  }

  .difficulty {
    display: flex;
    gap: 2px;
  }

  .star {
    color: #F5C542;
    font-size: 1rem;
  }

  .star.empty {
    color: #555;
  }

  .opponent-actions {
    display: flex;
    flex-direction: column;
    align-items: flex-end;
    gap: 0.5rem;
  }

  .win-progress {
    text-align: right;
    font-size: 0.9rem;
    color: #ccc;
  }

  .progress-bar {
    width: 120px;
    height: 8px;
    background: rgba(255, 255, 255, 0.2);
    border-radius: 4px;
    overflow: hidden;
    margin-top: 4px;
  }

  .progress-fill {
    height: 100%;
    background: linear-gradient(90deg, #F5C542, #FF8C00);
    transition: width 0.3s ease;
  }

  .start-match-btn {
    background: linear-gradient(145deg, #F5C542, #FF8C00);
    border: none;
    color: #000;
    padding: 0.5rem 1.5rem;
    border-radius: 8px;
    font-weight: 700;
    cursor: pointer;
    text-transform: uppercase;
    letter-spacing: 1px;
    box-shadow: 0 4px 15px rgba(245, 197, 66, 0.4);
  }

  .locked-badge {
    background: rgba(255, 255, 255, 0.1);
    color: #888;
    padding: 0.5rem 1rem;
    border-radius: 20px;
    font-size: 0.8rem;
    font-weight: 700;
    border: 1px solid rgba(255, 255, 255, 0.2);
  }

  .modal-footer {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 1.5rem;
    border-top: 1px solid rgba(255, 255, 255, 0.1);
    background: rgba(245, 197, 66, 0.1);
  }

  .current-tokens {
    font-size: 1.1rem;
    font-weight: 700;
    color: #F5C542;
  }

  .close-modal-btn {
    background: rgba(255, 255, 255, 0.1);
    border: 1px solid rgba(255, 255, 255, 0.3);
    color: white;
    padding: 0.5rem 1rem;
    border-radius: 8px;
    cursor: pointer;
  }

  .leaderboard-btn {
    background: rgba(74, 201, 255, 0.2);
    border: 1px solid rgba(74, 201, 255, 0.5);
    color: #4AC9FF;
    padding: 0.5rem 1rem;
    border-radius: 8px;
    cursor: pointer;
    font-weight: 700;
    margin-right: 0.5rem;
  }

  .footer-actions {
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }

  .leaderboard-content {
    padding: 1rem;
  }

  .leaderboard-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 1rem;
    padding-bottom: 1rem;
    border-bottom: 1px solid rgba(255, 255, 255, 0.2);
  }

  .leaderboard-title {
    font-size: 1.5rem;
    font-weight: 800;
    color: #4AC9FF;
    margin: 0;
  }

  .back-btn {
    background: rgba(255, 255, 255, 0.1);
    border: 1px solid rgba(255, 255, 255, 0.3);
    color: white;
    padding: 0.5rem 1rem;
    border-radius: 8px;
    cursor: pointer;
  }

  .leaderboard-list {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }

  .leaderboard-item {
    background: rgba(255, 255, 255, 0.05);
    border-radius: 8px;
    padding: 1rem;
    display: flex;
    align-items: center;
    gap: 1rem;
    border: 1px solid rgba(255, 255, 255, 0.1);
    transition: all 0.3s ease;
  }

  .leaderboard-item:hover {
    background: rgba(255, 255, 255, 0.1);
    transform: translateX(4px);
  }

  .leaderboard-item.player-entry {
    background: rgba(245, 197, 66, 0.1);
    border-color: rgba(245, 197, 66, 0.3);
  }

  .rank-badge {
    width: 32px;
    height: 32px;
    background: rgba(255, 255, 255, 0.2);
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-weight: 800;
    color: white;
    border: 2px solid rgba(255, 255, 255, 0.3);
  }

  .player-info {
    flex: 1;
  }

  .player-name {
    font-size: 1.1rem;
    font-weight: 700;
    color: white;
    margin-bottom: 0.25rem;
  }

  .player-stats {
    display: flex;
    gap: 1rem;
    font-size: 0.8rem;
    color: #ccc;
  }

  .stat {
    background: rgba(255, 255, 255, 0.1);
    padding: 0.25rem 0.5rem;
    border-radius: 4px;
    border: 1px solid rgba(255, 255, 255, 0.2);
  }

  @media (max-width: 600px) {
    .ladder-item {
      flex-direction: column;
      align-items: flex-start;
      gap: 1rem;
    }

    .opponent-actions {
      align-self: flex-end;
    }
  }
</style>