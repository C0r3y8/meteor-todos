Package.describe({
  name: 'c0r3y8:learn-ssr',
  version: '0.0.1',
  // Brief, one-line summary of the package.
  summary: 'Learn SSR',
  // URL to the Git repository containing the source code for this package.
  git: '',
  // By default, Meteor will default to using README.md for documentation.
  // To avoid submitting documentation, set this field to null.
  documentation: 'README.md'
});

Npm.depends({
  assert: '1.4.1',
  'connect-redirection': '0.0.1',
  'url-pattern': '1.0.3',
  warning: '3.0.0'
});

const basePackages = {
  all: [
    'account-base',
    'ecmascript',
    'ejson',
    'meteor',
    'meteorhacks:meteorx',
    'minimongo'
  ],
  server: [ 'ddp', 'random', 'webapp' ]
};

const testPackages = [
  'practicalmeteor:mocha',
  'practicalmeteor:mocha-console-runner',
  'practicalmeteor:chai',
  'http'
];

/* eslint-disable func-names, prefer-arrow-callback */
Package.onUse(function (api) {
  api.versionsFrom('1.4.2.3');

  api.use(basePackages.all);
  api.use(basePackages.server, 'server');

  api.use('tmeasday:check-npm-versions@0.3.1');

  api.mainModule('server/index.js', 'server');
});
/* eslint-enable */

/* eslint-disable func-names, prefer-arrow-callback */
Package.onTest(function (api) {
  api.use(basePackages.all);
  api.use(basePackages.server, 'server');

  api.use(testPackages);

  api.use('ssr-react-router');

  api.addFiles('server/router-tests.js', 'server');
});
/* eslint-enable */
