<script>
  let deferredPrompt = null;
  let showInstall = false;

  window.addEventListener("beforeinstallprompt", (e) => {
    e.preventDefault();
    deferredPrompt = e;
    showInstall = true;
  });

  async function install() {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    await deferredPrompt.userChoice;
    deferredPrompt = null;
    showInstall = false;
  }
</script>

{#if showInstall}
  <button class="install-btn" on:click={install}>
    Install App
  </button>
{/if}

<style>
  .install-btn {
    background: #9a7b2f;
    color: white;
    padding: 6px 10px;
    border-radius: 6px;
    font-size: 0.85rem;
    font-weight: 600;
  }
</style>
