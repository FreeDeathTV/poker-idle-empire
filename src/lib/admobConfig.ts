export const ADMOB_CONFIG = {
  // AdMob App ID (without the ~ for script loading)
  appId: 'ca-app-pub-4126734833336979~7661113840',
  appClientId: 'ca-pub-4126734833336979', // For script loading

  // AdMob Ad Unit IDs
  adUnits: {
    // Rewarded video ads for Pro Dealers bonus upgrade
    proDealersBonus: 'ca-app-pub-3940256099942544/1712485313',

    // Other ad units for standard ad placements
    doubleTap: 'ca-app-pub-3940256099942544/1712485313',
    extraTable: 'ca-app-pub-3940256099942544/1712485313',
    unlockTH: 'ca-app-pub-3940256099942544/1712485313'
  }
} as const;
