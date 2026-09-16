const { withAndroidManifest } = require('expo/config-plugins');

/**
 * Android 11+ package visibility — needed so Truecaller deep links resolve reliably.
 */
function withTruecallerQueries(config) {
  return withAndroidManifest(config, (config) => {
    const manifest = config.modResults.manifest;
    if (!manifest.queries) {
      manifest.queries = [];
    }

    const queries = Array.isArray(manifest.queries)
      ? manifest.queries
      : [manifest.queries];

    const hasPackage = queries.some(
      (q) =>
        q.package?.some?.(
          (p) => p.$?.['android:name'] === 'com.truecaller',
        ),
    );
    if (!hasPackage) {
      queries.push({
        package: [{ $: { 'android:name': 'com.truecaller' } }],
      });
    }

    const hasScheme = queries.some((q) =>
      q.intent?.some?.(
        (intent) =>
          intent.data?.some?.(
            (d) => d.$?.['android:scheme'] === 'truecallersdk',
          ),
      ),
    );
    if (!hasScheme) {
      queries.push({
        intent: [
          {
            action: [
              { $: { 'android:name': 'android.intent.action.VIEW' } },
            ],
            data: [{ $: { 'android:scheme': 'truecallersdk' } }],
          },
        ],
      });
    }

    manifest.queries = queries;
    return config;
  });
}

module.exports = withTruecallerQueries;
