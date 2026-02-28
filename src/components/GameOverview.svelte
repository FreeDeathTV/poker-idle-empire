<script lang="ts">
</script>

<section class="game-overview">
  <div class="container">
    <div class="overview-content">
      <h1 class="main-title">Game Overview</h1>
      
      <div class="content-block">
        <h2 class="section-title">I drop players straight into a cutthroat poker‑empire grinder where every table you unlock tightens the screws for the next showdown. It's idle scaling fused with hostile expansion and rising rival heat, all wrapped in a deterministic loop that rewards anyone who actually learns the system instead of tapping blindly. You open with one sad little table and a couple of grinders barely keeping the lights on. Five minutes later you're running velvet‑lined lounges, AI‑trained pros, and tournament circuits that sprawl across a whole network of virtual casinos.</h2>
        
        <p class="intro-text">The loop stays brutally tight: expand → upgrade → automate → crush → prestige → repeat. Every cycle sharpens your builds, tunes your lineups, and squeezes obscene value out of idle downtime. That's the grind. That's the rush.</p>
      </div>

      <div class="content-block">
        <h2 class="section-title">⚙️ Gameplay Mechanics</h2>
        
        <div class="mechanics-grid">
          <div class="mechanic-item">
            <h3>Wave‑Based Rival System</h3>
            <p>Rivals hit in predictable but escalating waves. You're always juggling empire growth with showdown prep, living on that knife‑edge tension.</p>
          </div>
          
          <div class="mechanic-item">
            <h3>Deterministic Table Generation</h3>
            <p>Venues, pros, rival patterns — all hard‑ruled. Once you crack the logic, you start bending the whole ecosystem to your will.</p>
          </div>
          
          <div class="mechanic-item">
            <h3>Upgradeable Poker Rigs</h3>
            <p>Start with bargain‑bin setups, then climb into neural‑net readers, bluff‑bots, and fully automated empires that dominate while you're AFK.</p>
          </div>
          
          <div class="mechanic-item">
            <h3>Empire Expansion & Automation</h3>
            <p>Build lounges, pro academies, conveyor‑style talent pipelines, and counter‑rig arrays that feel like turret networks for poker warfare. Every layer multiplies your idle output.</p>
          </div>
          
          <div class="mechanic-item">
            <h3>Risk–Reward Depth</h3>
            <p>Elite circuits offer legendary talent and monstrous payouts, but they come with savage ambushes and brutal table hazards.</p>
          </div>
          
          <div class="mechanic-item">
            <h3>Time‑Loop Progression</h3>
            <p>The world resets. Your meta‑unlocks don't. Each loop you scale harder, smarter, deeper.</p>
          </div>
        </div>
      </div>

      <div class="content-block">
        <h2 class="section-title">🛠️ Development Story</h2>
        
        <p class="story-text">This whole thing started as my obsession with deterministic idle systems — a poker world where every matchup is reproducible, every rule is transparent, and every empire is built through pure strategic muscle. Early builds were just idle table farms printing chips. Then the rivals arrived, the tension spiked, and suddenly it morphed into a half‑empire sim, half auto‑battler, half "how far can I push this before it breaks?" sandbox.</p>
        
        <p class="story-text">The mission was simple: build an appliance‑grade idle game. Fire it up, get hooked instantly, decode the rules, then lose hours perfecting god‑tier loops. Clean, fair, infinitely replayable. Please have fun, report anything you find directly to me the founder. Dan Mac</p>
      </div>
    </div>
  </div>
</section>

<style>
  .game-overview {
    padding: 4rem 1rem;
    background: linear-gradient(180deg, #000000 0%, #1a0f2a 100%);
    position: relative;
    overflow: hidden;
  }

  .container {
    max-width: 1200px;
    margin: 0 auto;
  }

  .overview-content {
    position: relative;
    z-index: 2;
  }

  .main-title {
    font-size: 3rem;
    font-weight: 900;
    text-align: center;
    margin-bottom: 3rem;
    background: linear-gradient(180deg, #F5C542, #d4a520);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    text-transform: uppercase;
    letter-spacing: 4px;
  }

  .content-block {
    margin-bottom: 4rem;
  }

  .section-title {
    font-size: 2rem;
    font-weight: 800;
    color: #F5C542;
    margin-bottom: 2rem;
    text-transform: uppercase;
    letter-spacing: 2px;
  }

  .intro-text {
    font-size: 1.25rem;
    line-height: 1.8;
    color: #e0e0e0;
    margin-bottom: 3rem;
    font-weight: 400;
  }

  .mechanics-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
    gap: 2rem;
  }

  .mechanic-item {
    background: rgba(255, 255, 255, 0.05);
    padding: 2rem;
    border-radius: 16px;
    border: 1px solid rgba(245, 197, 66, 0.2);
    transition: all 0.3s ease;
  }

  .mechanic-item:hover {
    transform: translateY(-5px);
    border-color: rgba(245, 197, 66, 0.5);
    background: rgba(245, 197, 66, 0.05);
  }

  .mechanic-item h3 {
    font-size: 1.5rem;
    font-weight: 800;
    color: #F5C542;
    margin-bottom: 1rem;
    text-transform: uppercase;
  }

  .mechanic-item p {
    font-size: 1.1rem;
    line-height: 1.6;
    color: #d0d0d0;
    margin: 0;
  }

  .story-text {
    font-size: 1.2rem;
    line-height: 1.8;
    color: #e0e0e0;
    margin-bottom: 2rem;
    font-weight: 400;
  }

  /* Decorative elements */
  .game-overview::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: radial-gradient(circle at 50% 0%, rgba(245, 197, 66, 0.1) 0%, transparent 50%);
    z-index: 1;
  }

  .game-overview::after {
    content: '';
    position: absolute;
    bottom: 0;
    left: 0;
    right: 0;
    height: 100px;
    background: linear-gradient(180deg, transparent, #000000);
    z-index: 1;
  }

  @media (max-width: 768px) {
    .main-title {
      font-size: 2rem;
    }
    
    .section-title {
      font-size: 1.5rem;
    }
    
    .mechanics-grid {
      grid-template-columns: 1fr;
    }
    
    .mechanic-item {
      padding: 1.5rem;
    }
  }
</style>