// Expo config plugin: builds the app's native code with CMake 4.1.1, whose ninja (1.12+) understands Windows long paths. The default
// CMake 3.22.1 ships ninja 1.10, which stops with "Filename longer than 260 characters" on this project's deep codegen paths.
// Windows long paths must also be switched on once per computer (LongPathsEnabled = 1). Doing it here (not by hand in android/)
// keeps it after `expo prebuild --clean` regenerates that folder.
const { withAppBuildGradle } = require('expo/config-plugins');

const CMAKE_VERSION = '4.1.1';
const MARKER = '// withLongPathCmake';

module.exports = function withLongPathCmake(config) {
  return withAppBuildGradle(config, (gradle) => {
    if (gradle.modResults.contents.includes(MARKER)) return gradle;
    gradle.modResults.contents += `\n${MARKER}\nandroid {\n    externalNativeBuild {\n        cmake {\n            version "${CMAKE_VERSION}"\n        }\n    }\n}\n`;
    return gradle;
  });
};
