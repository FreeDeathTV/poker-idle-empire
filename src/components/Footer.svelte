<script lang="ts">
  // Version number - would be dynamic in production
  const version = '1.3.0';
</script>

<footer class="footer">
  <div class="footer-content">
    <div class="brand">
      <span class="logo">🃏</span>
      <span class="brand-name">Poker Idle Empire</span>
    </div>
    
    <p class="copyright">© {new Date().getFullYear()} Poker Idle Empire</p>
    
    <p class="made-with">
      Made with <span class="heart">❤️</span> in the UK
    </p>
    
    <a href="/privacy" class="privacy-link">
      Privacy Policy
    </a>
    
    <p class="version">Version {version}</p>
  </div>
</footer>

<style>
  .footer {
    padding: 3rem 1rem;
    background: #000000;
    border-top: 1px solid rgba(245, 197, 66, 0.2);
  }

  .footer-content {
    max-width: 600px;
    margin: 0 auto;
    text-align: center;
  }

  .brand {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.5rem;
    margin-bottom: 1rem;
  }

  .logo {
    font-size: 1.5rem;
  }

  .brand-name {
    font-size: 1.25rem;
    font-weight: 700;
    color: #F5C542;
    text-transform: uppercase;
    letter-spacing: 1px;
  }

  .copyright {
    color: #666;
    font-size: 0.85rem;
    margin-bottom: 0.5rem;
  }

  .made-with {
    color: #888;
    font-size: 0.85rem;
    margin-bottom: 1rem;
  }

  .heart {
    color: #FF4AC9;
    animation: heartbeat 1.5s ease-in-out infinite;
  }

  @keyframes heartbeat {
    0%, 100% { transform: scale(1); }
    50% { transform: scale(1.2); }
  }

  .privacy-link {
    display: inline-block;
    color: #4AC9FF;
    font-size: 0.85rem;
    text-decoration: none;
    margin-bottom: 0.5rem;
    transition: color 0.2s ease;
  }

  .privacy-link:hover {
    color: #7dd3fc;
    text-decoration: underline;
  }

  .version {
    color: #444;
    font-size: 0.75rem;
  }
</style>
