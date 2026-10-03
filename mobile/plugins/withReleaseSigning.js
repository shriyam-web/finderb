const { withAppBuildGradle, withGradleProperties } = require('expo/config-plugins');

/**
 * Release signing lives in mobile/credentials (gitignored, outside android/)
 * so `expo prebuild` can regenerate android/ without deleting the key.
 */
const MARKER = '// finderb-release-signing';

const SIGNING_BLOCK = `
        release { ${MARKER}
            def finderbKeystoreProps = new Properties()
            def finderbKeystoreFile = new File(rootDir, '../credentials/keystore.properties')
            if (finderbKeystoreFile.exists()) {
                finderbKeystoreFile.withInputStream { finderbKeystoreProps.load(it) }
                storeFile new File(rootDir, '../credentials/' + finderbKeystoreProps['storeFile'])
                storePassword finderbKeystoreProps['storePassword']
                keyAlias finderbKeystoreProps['keyAlias']
                keyPassword finderbKeystoreProps['keyPassword']
            }
            enableV1Signing true
            enableV2Signing true
            enableV3Signing true
        }`;

function addSigningConfig(gradle) {
  if (gradle.includes(MARKER)) return gradle;

  const withConfig = gradle.replace(
    /(signingConfigs\s*\{\s*debug\s*\{[^}]*\})/,
    `$1${SIGNING_BLOCK}`,
  );

  return withConfig.replace(
    /(buildTypes\s*\{[\s\S]*?release\s*\{[\s\S]*?)signingConfig signingConfigs\.debug/,
    `$1signingConfig new File(rootDir, '../credentials/keystore.properties').exists() ? signingConfigs.release : signingConfigs.debug`,
  );
}

function withReleaseSigning(config) {
  config = withAppBuildGradle(config, (cfg) => {
    cfg.modResults.contents = addSigningConfig(cfg.modResults.contents);
    return cfg;
  });

  return withGradleProperties(config, (cfg) => {
    const props = cfg.modResults;
    const existing = props.find(
      (item) => item.type === 'property' && item.key === 'expo.useLegacyPackaging',
    );
    if (existing) {
      existing.value = 'true';
    } else {
      props.push({ type: 'property', key: 'expo.useLegacyPackaging', value: 'true' });
    }
    return cfg;
  });
}

module.exports = withReleaseSigning;
