const { withDangerousMod, withGradleProperties } = require("@expo/config-plugins");
const fs = require("fs");
const path = require("path");

/**
 * Expo config plugin to limit Android build to arm64-v8a architecture only.
 * This is required for cactus-react-native which only provides prebuilt
 * libraries for arm64-v8a architecture.
 */
const withAndroidAbiFilters = (config) => {
  // Use withGradleProperties to add the architecture filter
  config = withGradleProperties(config, (config) => {
    // Remove any existing reactNativeArchitectures property
    config.modResults = config.modResults.filter(
      (item) => !(item.type === "property" && item.key === "reactNativeArchitectures")
    );

    // Add the arm64-v8a only filter
    config.modResults.push({
      type: "property",
      key: "reactNativeArchitectures",
      value: "arm64-v8a",
    });

    return config;
  });

  return config;
};

module.exports = withAndroidAbiFilters;
