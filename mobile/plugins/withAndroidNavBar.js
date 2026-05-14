const { withDangerousMod } = require('@expo/config-plugins');
const fs = require('fs');
const path = require('path');

module.exports = function withAndroidNavBar(config) {
  return withDangerousMod(config, [
    'android',
    async (cfg) => {
      const packageName = cfg.android?.package ?? 'com.barbarossa.flickbook';
      const packagePath = packageName.replace(/\./g, '/');
      const mainActivityPath = path.join(
        cfg.modRequest.platformProjectRoot,
        'app/src/main/java',
        packagePath,
        'MainActivity.kt'
      );

      if (!fs.existsSync(mainActivityPath)) {
        console.warn('[withAndroidNavBar] MainActivity.kt not found:', mainActivityPath);
        return cfg;
      }

      let src = fs.readFileSync(mainActivityPath, 'utf8');

      if (src.includes('isNavigationBarContrastEnforced')) {
        return cfg;
      }

      // Add Build import after the last import line
      if (!src.includes('import android.os.Build')) {
        src = src.replace(
          /(^import .+$)/m,
          'import android.os.Build\n$1'
        );
      }

      // Inject after super.onCreate(...) — param may be null or savedInstanceState
      src = src.replace(
        /(super\.onCreate\([^)]*\))/,
        '$1\n    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {\n      window.isNavigationBarContrastEnforced = false\n    }'
      );

      fs.writeFileSync(mainActivityPath, src);
      return cfg;
    },
  ]);
};
