/* eslint-disable import/no-unresolved */
import redirect from 'connect-redirection';
/* eslint-enable */

import { checkNpmVersions } from 'meteor/tmeasday:check-npm-versions';
import { WebApp } from 'meteor/webapp';

import Router from './router';
import enableLiveDataSupport from './support/pubsub/subscribe';

checkNpmVersions({
  react: '15.x',
  'react-dom': '15.x',
  'react-helmet': '4.x',
  'react-router-dom': '4.0.0-beta.6',
}, 'c0r3y8:electrolysis');

/* eslint-disable max-len */
/* eslint-disable import/prefer-default-export, func-names, no-unused-vars, prefer-arrow-callback */
/* eslint-enable max-len */
export const LearnSSR = (App, clientOptions, serverOptions) => {
  const app = new Router({
    App,
    options: serverOptions
  });

  enableLiveDataSupport(app);

  WebApp.rawConnectHandlers
    .use(redirect());

  WebApp.connectHandlers
    .use(function (req, res, next) {
      app.callback(req, res, next);
    });

  return app;
};
/* eslint-enable */
