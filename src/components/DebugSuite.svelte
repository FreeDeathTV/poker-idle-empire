<script lang="ts">
  import { debugEnabled, debugState, buildings, chips, prestigePoints } from '$lib/stores';
  import {
    debugInjectCash,
    debugClearCashInjection,
    debugTestLevelUp,
    debugSpinWheel,
    debugClearWheelTest,
    debugStartResetFlowTest,
    debugAdvanceResetStage,
    debugClearResetTest,
    debugGetStateSnapshot,
    debugExportStateAsJSON,
    debugSetInspectorView,
    type LevelUpTestResult,
    type ResetFlowTestSnapshot
  } from '$lib/debugLogic';
  import type { EscapeMethod } from '$lib/stores';

  let panelOpen = false;
  let activeTab = 'cash'; // cash | levelup | wheel | reset | inspector
  let levelUpTest: LevelUpTestResult | null = null;
  let levelUpAnimating = false;
  let selectedWheelMethod: EscapeMethod = 'relocation';
  let wheelForceOutcome: boolean = false;
  let wheelForceOutcomeIndex: number = 0;
  let resetTestSkipToStage: 1 | 2 | 3 = 1;
  let resetTestForceMultiplier: number | null = null;
  let showResetTestWarning = false;
  let jsonCopied = false;

  function togglePanel() {
    panelOpen = !panelOpen;
  }

  function handleCashInject(amount: number) {
    const newTotal = debugInjectCash(amount);
    // Show in UI - component displays it but stores don't change
    setTimeout(() => debugClearCashInjection(), 3000);
  }

  function handleTestLevelUp(buildingId: string) {
    try {
      const result = debugTestLevelUp(buildingId);
      levelUpTest = result;
      levelUpAnimating = true;
      setTimeout(() => {
        levelUpAnimating = false;
      }, result.animationDuration);
    } catch (e) {
      alert(`Error: ${(e as Error).message}`);
    }
  }

  function handleSpinWheel() {
    const forceIndex = wheelForceOutcome ? wheelForceOutcomeIndex : undefined;
    debugSpinWheel(selectedWheelMethod, forceIndex);
  }

  function handleClearWheelTest() {
    debugClearWheelTest();
  }

  function handleStartResetTest() {
    debugStartResetFlowTest();
  }

  function handleAdvanceResetStage() {
    try {
      let method: EscapeMethod | undefined;
      if (resetTestSkipToStage > 1) {
        method = 'relocation'; // Default
      }
      debugAdvanceResetStage(method, resetTestForceMultiplier);
    } catch (e) {
      alert(`Error: ${(e as Error).message}`);
    }
  }

  function handleClearResetTest() {
    debugClearResetTest();
  }

  function handleCopyJSON() {
    const json = debugExportStateAsJSON();
    navigator.clipboard.writeText(json).then(() => {
      jsonCopied = true;
      setTimeout(() => (jsonCopied = false), 2000);
    });
  }

  function handleSetInspectorView(view: 'compact' | 'full' | 'json') {
    debugSetInspectorView(view);
  }
</script>

{#if $debugEnabled}
  <!-- Floating Toggle Button -->
  <div class="fixed bottom-6 right-6 z-40">
    <button
      on:click={togglePanel}
      class="w-12 h-12 bg-purple-600 hover:bg-purple-500 rounded-full shadow-lg flex items-center justify-center text-white text-xl font-bold cursor-pointer transition-all active:scale-95"
      title="Toggle Debug Suite"
    >
      🛠
    </button>
  </div>

  <!-- Debug Suite Panel -->
  {#if panelOpen}
    <div class="fixed bottom-24 right-6 z-40 bg-gray-800 border-2 border-purple-500 rounded-xl shadow-2xl w-96 max-h-96 flex flex-col overflow-hidden">
      <!-- Header -->
      <div class="bg-purple-700 px-4 py-3 flex justify-between items-center">
        <h2 class="text-white font-bold text-lg">🛠 Debug Suite V302</h2>
        <button
          on:click={() => (panelOpen = false)}
          class="text-white hover:text-gray-300 text-xl"
        >
          ✕
        </button>
      </div>

      <!-- Tab Navigation -->
      <div class="bg-gray-700 flex gap-1 p-2 border-b border-gray-600 overflow-x-auto">
        <button
          on:click={() => (activeTab = 'cash')}
          class="px-3 py-1 rounded text-sm font-semibold whitespace-nowrap transition-colors {activeTab === 'cash'
            ? 'bg-purple-500 text-white'
            : 'bg-gray-600 text-gray-300 hover:bg-gray-500'}"
        >
          💰 Cash
        </button>
        <button
          on:click={() => (activeTab = 'levelup')}
          class="px-3 py-1 rounded text-sm font-semibold whitespace-nowrap transition-colors {activeTab === 'levelup'
            ? 'bg-purple-500 text-white'
            : 'bg-gray-600 text-gray-300 hover:bg-gray-500'}"
        >
          ⬆️ Level-Up
        </button>
        <button
          on:click={() => (activeTab = 'wheel')}
          class="px-3 py-1 rounded text-sm font-semibold whitespace-nowrap transition-colors {activeTab === 'wheel'
            ? 'bg-purple-500 text-white'
            : 'bg-gray-600 text-gray-300 hover:bg-gray-500'}"
        >
          🎡 Wheel
        </button>
        <button
          on:click={() => (activeTab = 'reset')}
          class="px-3 py-1 rounded text-sm font-semibold whitespace-nowrap transition-colors {activeTab === 'reset'
            ? 'bg-purple-500 text-white'
            : 'bg-gray-600 text-gray-300 hover:bg-gray-500'}"
        >
          🔄 Reset
        </button>
        <button
          on:click={() => (activeTab = 'inspector')}
          class="px-3 py-1 rounded text-sm font-semibold whitespace-nowrap transition-colors {activeTab === 'inspector'
            ? 'bg-purple-500 text-white'
            : 'bg-gray-600 text-gray-300 hover:bg-gray-500'}"
        >
          📊 State
        </button>
      </div>

      <!-- Content Area -->
      <div class="flex-1 overflow-y-auto p-4 bg-gray-800">
        <!-- TAB: CASH INJECTOR -->
        {#if activeTab === 'cash'}
          <div class="space-y-3">
            <div class="text-yellow-400 text-sm font-semibold mb-3">⚠️ Not Saved</div>
            <div class="grid grid-cols-2 gap-2">
              <button
                on:click={() => handleCashInject(1e6)}
                class="bg-green-600 hover:bg-green-500 text-white py-2 px-3 rounded text-sm font-semibold"
              >
                +1e6
              </button>
              <button
                on:click={() => handleCashInject(1e9)}
                class="bg-green-600 hover:bg-green-500 text-white py-2 px-3 rounded text-sm font-semibold"
              >
                +1e9
              </button>
              <button
                on:click={() => handleCashInject(1e12)}
                class="bg-green-600 hover:bg-green-500 text-white py-2 px-3 rounded text-sm font-semibold"
              >
                +1e12
              </button>
              <button
                on:click={() => handleCashInject(1e15)}
                class="bg-green-600 hover:bg-green-500 text-white py-2 px-3 rounded text-sm font-semibold"
              >
                +1e15
              </button>
            </div>
            {#if $debugState.lastCashInjection > 0}
              <div class="text-green-400 text-sm mt-3 p-2 bg-green-900/30 rounded">
                ✓ Injected: +{$debugState.lastCashInjection.toExponential(1)} chips (not saved)
              </div>
            {/if}
          </div>
        {/if}

        <!-- TAB: LEVEL-UP TESTER -->
        {#if activeTab === 'levelup'}
          <div class="space-y-3">
            <label class="block text-gray-300 text-sm font-semibold">Select Building</label>
            <select
              class="w-full bg-gray-700 text-white rounded px-3 py-2 text-sm border border-gray-600"
              on:change={(e) => console.log(e.currentTarget.value)}
            >
              {#each $buildings as building}
                <option value={building.name}>{building.name}</option>
              {/each}
            </select>
            <button
              on:click={() => handleTestLevelUp($buildings[0]?.name || 'Poker Table')}
              class="w-full bg-blue-600 hover:bg-blue-500 text-white py-2 rounded font-semibold text-sm"
            >
              Test Animation
            </button>
            {#if levelUpTest}
              <div
                class="text-blue-300 text-sm p-2 bg-blue-900/30 rounded {levelUpAnimating
                  ? 'animate-pulse'
                  : ''}"
              >
                <div>Building: {levelUpTest.buildingName}</div>
                <div>Animation: {levelUpTest.animationDuration}ms</div>
                <div>Reward: {levelUpTest.reward.amount} chips</div>
              </div>
            {/if}
          </div>
        {/if}

        <!-- TAB: WHEEL SPINNER -->
        {#if activeTab === 'wheel'}
          <div class="space-y-3">
            <label class="block text-gray-300 text-sm font-semibold">Method</label>
            <div class="space-y-2">
              {#each ['relocation', 'identity', 'run'] as m}
                <label class="flex items-center gap-2 cursor-pointer text-gray-300 text-sm">
                  <input
                    type="radio"
                    bind:group={selectedWheelMethod}
                    value={m}
                    class="w-4 h-4"
                  />
                  {m}
                </label>
              {/each}
            </div>

            <label class="flex items-center gap-2 cursor-pointer text-gray-300 text-sm mt-3">
              <input type="checkbox" bind:checked={wheelForceOutcome} class="w-4 h-4" />
              Force Outcome
            </label>

            {#if wheelForceOutcome}
              <input
                type="number"
                min="0"
                max="5"
                bind:value={wheelForceOutcomeIndex}
                class="w-full bg-gray-700 text-white rounded px-3 py-2 text-sm border border-gray-600"
                placeholder="Outcome index (0-5)"
              />
            {/if}

            <button
              on:click={handleSpinWheel}
              class="w-full bg-blue-600 hover:bg-blue-500 text-white py-2 rounded font-semibold text-sm"
            >
              Spin Wheel
            </button>

            {#if $debugState.wheelTestResult}
              <div class="text-green-300 text-sm p-2 bg-green-900/30 rounded space-y-1">
                <div>Outcome: {$debugState.wheelTestResult.outcome.name}</div>
                <div>Multiplier: {$debugState.wheelTestResult.multiplier}×</div>
                <div>Base Bonus: {($debugState.wheelTestResult.baseBonus * 100).toFixed(1)}%</div>
                <div>Final Bonus: {($debugState.wheelTestResult.finalBonus * 100).toFixed(1)}%</div>
              </div>
            {/if}

            {#if $debugState.wheelTestHistory.length > 0}
              <button
                on:click={handleClearWheelTest}
                class="w-full bg-gray-600 hover:bg-gray-500 text-white py-1 rounded text-sm"
              >
                Clear History ({$debugState.wheelTestHistory.length})
              </button>
            {/if}
          </div>
        {/if}

        <!-- TAB: RESET FLOW TESTER -->
        {#if activeTab === 'reset'}
          <div class="space-y-3">
            {#if !$debugState.resetFlowSnapshot}
              <button
                on:click={handleStartResetTest}
                class="w-full bg-orange-600 hover:bg-orange-500 text-white py-2 rounded font-semibold text-sm"
              >
                Start Reset Test
              </button>
            {:else}
              <div class="text-orange-300 text-sm p-2 bg-orange-900/30 rounded">
                Stage: {$debugState.resetFlowSnapshot.stage}/3
              </div>

              {#if $debugState.resetFlowSnapshot.stage === 1}
                <p class="text-gray-400 text-xs">Select method and advance to stage 2</p>
              {:else if $debugState.resetFlowSnapshot.stage === 2}
                <p class="text-gray-400 text-xs">Wheel spinning... Advance to stage 3</p>
              {:else}
                <div class="text-white text-xs space-y-1">
                  <div>Outcome: {$debugState.resetFlowSnapshot.outcome?.name}</div>
                  <div>Multiplier: {$debugState.resetFlowSnapshot.outcome?.multiplier}×</div>
                  <div>
                    Confetti: {$debugState.resetFlowSnapshot.outcome && $debugState.resetFlowSnapshot.outcome.multiplier > 1.5 ? '✓' : '✕'}
                  </div>
                </div>
              {/if}

              <button
                on:click={handleAdvanceResetStage}
                class="w-full bg-blue-600 hover:bg-blue-500 text-white py-2 rounded font-semibold text-sm"
              >
                Advance Stage
              </button>

              <label class="block text-gray-300 text-sm font-semibold mt-3">Force Multiplier (opt)</label>
              <input
                type="number"
                step="0.1"
                min="0.8"
                max="2.0"
                bind:value={resetTestForceMultiplier}
                class="w-full bg-gray-700 text-white rounded px-3 py-2 text-sm border border-gray-600"
                placeholder="e.g., 1.5"
              />

              <button
                on:click={handleClearResetTest}
                class="w-full bg-gray-600 hover:bg-gray-500 text-white py-1 rounded text-sm"
              >
                Clear Test
              </button>

              <div class="text-yellow-400 text-xs p-2 bg-yellow-900/30 rounded">
                ⚠️ This is a simulation. No actual reset will happen.
              </div>
            {/if}
          </div>
        {/if}

        <!-- TAB: STATE INSPECTOR -->
        {#if activeTab === 'inspector'}
          <div class="space-y-3">
            <div class="flex gap-2">
              <button
                on:click={() => handleSetInspectorView('compact')}
                class="flex-1 px-2 py-1 text-xs rounded font-semibold {$debugState.inspectorView === 'compact'
                  ? 'bg-purple-500 text-white'
                  : 'bg-gray-600 text-gray-300 hover:bg-gray-500'}"
              >
                Compact
              </button>
              <button
                on:click={() => handleSetInspectorView('full')}
                class="flex-1 px-2 py-1 text-xs rounded font-semibold {$debugState.inspectorView === 'full'
                  ? 'bg-purple-500 text-white'
                  : 'bg-gray-600 text-gray-300 hover:bg-gray-500'}"
              >
                Full
              </button>
              <button
                on:click={() => handleSetInspectorView('json')}
                class="flex-1 px-2 py-1 text-xs rounded font-semibold {$debugState.inspectorView === 'json'
                  ? 'bg-purple-500 text-white'
                  : 'bg-gray-600 text-gray-300 hover:bg-gray-500'}"
              >
                JSON
              </button>
            </div>

            {#if $debugState.inspectorView === 'json'}
              <div class="bg-black rounded p-2 font-mono text-xs text-green-400 max-h-48 overflow-y-auto whitespace-pre-wrap break-words">
                {debugExportStateAsJSON()}
              </div>
              <button
                on:click={handleCopyJSON}
                class="w-full bg-blue-600 hover:bg-blue-500 text-white py-1 rounded text-sm font-semibold"
              >
                {jsonCopied ? '✓ Copied!' : 'Copy JSON'}
              </button>
            {:else}
              <div class="bg-gray-700 rounded p-2 text-xs text-gray-300 space-y-1 max-h-48 overflow-y-auto font-mono">
                {#each Object.entries(debugGetStateSnapshot()) as [key, value]}
                  {#if $debugState.inspectorView === 'compact' && !['timestamp', 'wheelHistory', 'v2BuildingLevels', 'buildings'].includes(key)}
                    <div><span class="text-cyan-400">{key}:</span> <span class="text-yellow-400">{typeof value === 'object' ? JSON.stringify(value) : value}</span></div>
                  {:else if $debugState.inspectorView === 'full'}
                    <div><span class="text-cyan-400">{key}:</span> <span class="text-yellow-400">{typeof value === 'object' ? JSON.stringify(value).slice(0, 50) : value}</span></div>
                  {/if}
                {/each}
              </div>
            {/if}

            <div class="text-gray-500 text-xs p-2 bg-gray-900/30 rounded">
              Read-only state snapshot
            </div>
          </div>
        {/if}
      </div>
    </div>
  {/if}
{/if}

<style>
  :global(.debug-suite) {
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
  }
</style>
