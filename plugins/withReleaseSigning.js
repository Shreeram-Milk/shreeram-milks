// Expo config plugin: signs the Play Store release build with our own upload key instead of the shared debug key. The key file and its
// passwords live only on the build computer, in ~/.gradle/gradle.properties (SHREERAM_UPLOAD_*), never in this project. Doing it here
// (not by hand in android/) keeps it after `expo prebuild --clean` regenerates that folder.
const { withAppBuildGradle } = require('expo/config-plugins');

const MARKER = 'SHREERAM_UPLOAD_STORE_FILE';

const RELEASE_SIGNING = `
        release {
            if (project.hasProperty('${MARKER}')) {
                storeFile file(${MARKER})
                storePassword SHREERAM_UPLOAD_STORE_PASSWORD
                keyAlias SHREERAM_UPLOAD_KEY_ALIAS
                keyPassword SHREERAM_UPLOAD_KEY_PASSWORD
            }
        }`;

module.exports = function withReleaseSigning(config) {
  return withAppBuildGradle(config, (gradle) => {
    let contents = gradle.modResults.contents;
    if (contents.includes(MARKER)) return gradle;

    contents = contents.replace(/signingConfigs\s*\{/, (match) => `${match}${RELEASE_SIGNING}`);
    // Only the release build type changes; debug keeps the debug key. Without the settings on this computer the release build
    // still uses the debug key, which Play Console refuses, so a wrong upload can never slip through.
    contents = contents.replace(
      /(release\s*\{[^}]*?)signingConfig\s+signingConfigs\.debug/,
      `$1signingConfig project.hasProperty('${MARKER}') ? signingConfigs.release : signingConfigs.debug`,
    );

    if (!contents.includes(`signingConfigs.release`)) throw new Error('withReleaseSigning: could not find the release build type in android/app/build.gradle');
    gradle.modResults.contents = contents;
    return gradle;
  });
};
