const { withEntitlementsPlist } = require("expo/config-plugins");

// expo-notifications' iOS plugin unconditionally adds `aps-environment` to
// support remote push, but this app only schedules local reminders
// (lib/notify.ts) and never registers for remote push. Personal/free Apple
// dev teams can't sign an app with the Push Notifications capability, so
// strip the entitlement expo-notifications adds. Must be listed after
// "expo-notifications" in app.json's plugins array to run afterward.
module.exports = function withoutPushEntitlement(config) {
  return withEntitlementsPlist(config, (config) => {
    delete config.modResults["aps-environment"];
    return config;
  });
};
