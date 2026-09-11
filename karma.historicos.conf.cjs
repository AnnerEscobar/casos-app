module.exports = function (config) {
  config.set({
    frameworks: ['jasmine', '@angular-devkit/build-angular'],
    plugins: [require('karma-jasmine'), require('karma-chrome-launcher'), require('@angular-devkit/build-angular/plugins/karma')],
    reporters: ['progress'], singleRun: true, concurrency: 1,
    browsers: ['HistoricosDesktop'],
    customLaunchers: {
      HistoricosDesktop: { base: 'ChromeHeadless', flags: ['--window-size=1440,1000'] },
      HistoricosLaptop: { base: 'ChromeHeadless', flags: ['--window-size=1024,900'] },
      HistoricosTablet: { base: 'ChromeHeadless', flags: ['--window-size=768,1024'] },
      HistoricosMobile: { base: 'ChromeHeadless', flags: ['--window-size=390,844', '--force-device-scale-factor=1'] },
    },
    browserNoActivityTimeout: 60000,
    client: { jasmine: { random: false }, args: [process.env.HISTORICOS_VIEWPORT || ''] },
  });
};
