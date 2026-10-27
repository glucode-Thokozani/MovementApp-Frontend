const fs = require('fs');
const path = require('path');

/**
 * Workaround for Expo Go on Android / Issue #52175:
 * "Cannot find native module 'ExpoTopicSubscriptionModule'"
 *
 * In expo-notifications, TopicSubscriptionModule.android.js calls
 * requireNativeModule('ExpoTopicSubscriptionModule') unconditionally at import time.
 * In Expo Go on Android, ExpoTopicSubscriptionModule is not included in the package picker,
 * crashing the app on startup.
 *
 * This patch replaces requireNativeModule with requireOptionalNativeModule and a safe fallback stub.
 */

const targetFiles = [
  path.join(__dirname, '../node_modules/expo-notifications/build/TopicSubscriptionModule.android.js'),
  path.join(__dirname, '../node_modules/expo-notifications/src/TopicSubscriptionModule.android.ts'),
];

const fallbackJs = `import { requireOptionalNativeModule } from 'expo';

const fallbackModule = {
  addListener: () => {},
  removeListeners: () => {},
  subscribeToTopicAsync: () => Promise.resolve(null),
  unsubscribeFromTopicAsync: () => Promise.resolve(null),
};

const nativeModule = requireOptionalNativeModule('ExpoTopicSubscriptionModule');
export default nativeModule ?? fallbackModule;
`;

const fallbackTs = `import { requireOptionalNativeModule } from 'expo';
import type { TopicSubscriptionModule } from './TopicSubscriptionModule.types';

const fallbackModule: TopicSubscriptionModule = {
  addListener: () => {},
  removeListeners: () => {},
  subscribeToTopicAsync: () => Promise.resolve(null),
  unsubscribeFromTopicAsync: () => Promise.resolve(null),
};

const nativeModule = requireOptionalNativeModule<TopicSubscriptionModule>('ExpoTopicSubscriptionModule');
export default nativeModule ?? fallbackModule;
`;

let patchedAny = false;

for (const targetFile of targetFiles) {
  if (fs.existsSync(targetFile)) {
    const isTs = targetFile.endsWith('.ts');
    const content = fs.readFileSync(targetFile, 'utf8');
    if (content.includes("requireNativeModule('ExpoTopicSubscriptionModule')") ||
        content.includes("requireNativeModule<TopicSubscriptionModule>('ExpoTopicSubscriptionModule')")) {
      fs.writeFileSync(targetFile, isTs ? fallbackTs : fallbackJs, 'utf8');
      console.log(`[patch-expo-notifications] Successfully patched: ${path.relative(path.join(__dirname, '..'), targetFile)}`);
      patchedAny = true;
    } else {
      console.log(`[patch-expo-notifications] Already patched: ${path.relative(path.join(__dirname, '..'), targetFile)}`);
    }
  }
}

if (!patchedAny) {
  console.log('[patch-expo-notifications] Verification complete.');
}
