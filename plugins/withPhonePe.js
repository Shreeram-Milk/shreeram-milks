// Expo config plugin: PhonePe's Android payment library is published in PhonePe's own Maven repository, so every Android
// build must know about it. Adding it here (not by hand in android/) keeps it after `expo prebuild` regenerates that folder.
const { withProjectBuildGradle } = require('expo/config-plugins');

const PHONEPE_MAVEN = 'https://phonepe.mycloudrepo.io/public/repositories/phonepe-intentsdk-android';

module.exports = function withPhonePe(config) {
  return withProjectBuildGradle(config, (gradle) => {
    if (gradle.modResults.contents.includes(PHONEPE_MAVEN)) return gradle;
    gradle.modResults.contents = gradle.modResults.contents.replace(
      /allprojects\s*\{\s*repositories\s*\{/,
      (match) => `${match}\n    maven { url '${PHONEPE_MAVEN}' }`,
    );
    if (!gradle.modResults.contents.includes(PHONEPE_MAVEN)) throw new Error('withPhonePe: could not find allprojects.repositories in android/build.gradle');
    return gradle;
  });
};
