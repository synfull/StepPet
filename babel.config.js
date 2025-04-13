module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: [
      'react-native-reanimated/plugin',
      [
        'module-resolver',
        {
          root: ['.'],
          alias: {
            '@': '.',
            '@components': './src/components',
            '@screens': './src/screens',
            '@navigation': './src/navigation',
            '@utils': './src/utils',
            '@context': './src/context',
            '@assets': './assets',
            '@hooks': './src/hooks',
            '@constants': './src/constants',
            '@types': './src/types',
          },
        },
      ],
      [
        'module:react-native-dotenv',
        {
          moduleName: '@env',
          path: '.env',
          blacklist: null,
          whitelist: null,
          safe: false,
          allowUndefined: true,
        },
      ],
    ],
  };
}; 