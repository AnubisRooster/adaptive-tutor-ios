const { withXcodeProject } = require("expo/config-plugins");

// Xcode 15+ sandboxes Run Script build phases by default (User Script
// Sandboxing). React Native's "Bundle React Native code and images" script
// writes an ip.txt file (used for Metro live-reload) into the app bundle at
// a path the sandbox doesn't allow, which fails device builds with
// "Sandbox: bash deny(1) file-write-create ... ip.txt". Disable it.
module.exports = function withoutScriptSandboxing(config) {
  return withXcodeProject(config, (config) => {
    const configurations = config.modResults.pbxXCBuildConfigurationSection();
    for (const key in configurations) {
      const entry = configurations[key];
      if (entry && typeof entry.buildSettings === "object") {
        entry.buildSettings.ENABLE_USER_SCRIPT_SANDBOXING = "NO";
      }
    }
    return config;
  });
};
