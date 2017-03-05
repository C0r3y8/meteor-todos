Package.describe({
  name: 'c0r3y8:learn-ssr-cache',
  version: '0.0.1',
  // Brief, one-line summary of the package.
  summary: 'Node cache for Learn SSR',
  // URL to the Git repository containing the source code for this package.
  git: '',
  // By default, Meteor will default to using README.md for documentation.
  // To avoid submitting documentation, set this field to null.
  documentation: 'README.md'
});

const basePackages = {
  server: [ 'c0r3y8:learn-ssr', 'ecmascript', 'ejson', 'meteor' ]
};

const testPackages = [
  'http',
  'practicalmeteor:mocha',
  'practicalmeteor:mocha-console-runner',
  'practicalmeteor:chai',
  'practicalmeteor:sinon',
  'react-meteor-data'
];

/* eslint-disable func-names, prefer-arrow-callback */
Package.onUse(function (api) {
  api.versionsFrom('1.4.2.3');

  Npm.depends({
    assert: '1.4.1',
    warning: '3.0.0'
  });

  api.use(basePackages.server, 'server');

  api.use('tmeasday:check-npm-versions@0.3.1');

  api.mainModule('server/index.js', 'server');
});
/* eslint-enable */

/* eslint-disable func-names, prefer-arrow-callback */
Package.onTest(function (api) {
  Npm.depends({
    assert: '1.4.1',
    'chai-webdriver-promised': '4.0.3',
    faker: '4.1.0',
    'selenium-webdriver': '2.53.3',
    warning: '3.0.0'
  });
  api.use(basePackages.server, 'server');

  api.use(testPackages);

  api.use('c0r3y8:learn-ssr');
  api.use('c0r3y8:learn-ssr-cache');

  api.addFiles('server/cache-tests.js', 'server');
});
/* eslint-enable */
