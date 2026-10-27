const { withAndroidManifest, withMainActivity } = require('@expo/config-plugins');

/**
 * Expo Config Plugin for Android Health Connect:
 * 1. Ensures package visibility <queries> for com.google.android.apps.healthdata (Android <= 13)
 * 2. Injects HealthConnectPermissionDelegate.setPermissionDelegate(this) in MainActivity.kt
 *    for Android Activity Result Contracts under React Native New Architecture.
 */
function withHealthConnectQueries(config) {
  return withAndroidManifest(config, async (config) => {
    const manifest = config.modResults.manifest;
    if (!manifest.queries) {
      manifest.queries = [];
    }

    const healthConnectPackage = 'com.google.android.apps.healthdata';
    const hasPackage = manifest.queries.some(
      (q) =>
        q.package &&
        q.package.some((p) => p.$ && p.$['android:name'] === healthConnectPackage)
    );

    if (!hasPackage) {
      manifest.queries.push({
        package: [{ $: { 'android:name': healthConnectPackage } }],
      });
    }

    return config;
  });
}

function withHealthConnectMainActivity(config) {
  return withMainActivity(config, (config) => {
    let contents = config.modResults.contents;
    const importStatement = 'import dev.matinzd.healthconnect.permissions.HealthConnectPermissionDelegate';
    if (!contents.includes(importStatement)) {
      contents = contents.replace(
        'import expo.modules.ReactActivityDelegateWrapper',
        `import expo.modules.ReactActivityDelegateWrapper\n${importStatement}`
      );
    }
    const delegateCall = 'HealthConnectPermissionDelegate.setPermissionDelegate(this)';
    if (!contents.includes(delegateCall)) {
      contents = contents.replace(
        'super.onCreate(null)',
        `super.onCreate(null)\n    ${delegateCall}`
      );
    }
    config.modResults.contents = contents;
    return config;
  });
}

module.exports = function withHealthConnectConfig(config) {
  config = withHealthConnectQueries(config);
  config = withHealthConnectMainActivity(config);
  return config;
};
