// Adds the over-the-air update channel to app.json. A build listens only to its own channel:
//   preview    — the tester's APK; updates are checked here first.
//   production — the Play Store AAB; every customer.
// Set it before `npx expo prebuild`, because the channel is written into the Android folder then:
//   $env:APP_CHANNEL = "preview"
// Nothing set means production, so a forgotten setting can never send untested updates to customers.
const CHANNELS = ['preview', 'production'];

module.exports = ({ config }) => {
  const channel = process.env.APP_CHANNEL || 'production';
  if (!CHANNELS.includes(channel)) throw new Error(`APP_CHANNEL must be one of: ${CHANNELS.join(', ')} (got "${channel}").`);
  return {
    ...config,
    updates: { ...config.updates, requestHeaders: { 'expo-channel-name': channel } },
  };
};
