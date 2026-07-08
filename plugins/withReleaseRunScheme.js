const { withDangerousMod } = require("expo/config-plugins");
const fs = require("fs");
const path = require("path");

// Debug builds load the JS bundle from a Metro dev server on the LAN, which
// breaks as soon as the phone isn't on the same network as the machine that
// built it ("No script URL provided ... unsanitizedScriptURLString = (null)").
// This app is meant to run fully on-device with no server dependency, so
// Release (which embeds the JS bundle at build time) is the right default
// for the Run action. expo prebuild always (re)writes the shared scheme
// file from its template on a full regeneration, so this has to be patched
// back on every prebuild rather than relying on the committed file alone.
module.exports = function withReleaseRunScheme(config) {
  return withDangerousMod(config, [
    "ios",
    async (config) => {
      const schemePath = path.join(
        config.modRequest.platformProjectRoot,
        `${config.modRequest.projectName}.xcodeproj`,
        "xcshareddata",
        "xcschemes",
        `${config.modRequest.projectName}.xcscheme`
      );
      if (fs.existsSync(schemePath)) {
        const contents = fs.readFileSync(schemePath, "utf8");
        const patched = contents.replace(
          /(<LaunchAction\s+buildConfiguration = )"Debug"/,
          '$1"Release"'
        );
        fs.writeFileSync(schemePath, patched);
      }
      return config;
    },
  ]);
};
