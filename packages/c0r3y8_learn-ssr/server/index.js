/* eslint-disable import/no-unresolved */
import redirect from 'connect-redirection';
import cookieParser from 'cookie-parser';
/* eslint-enable */

import { checkNpmVersions } from 'meteor/tmeasday:check-npm-versions';
import { WebApp } from 'meteor/webapp';

import Router from './router';
import enableLiveDataSupport from './support/meteor-subscribe/subscribe';

checkNpmVersions({
  react: '15.x',
  'react-dom': '15.x',
  'react-helmet': '4.x',
  'react-router-dom': '4.0.0-beta.6',
}, 'c0r3y8:electrolysis');

/* eslint-disable max-len */
/* eslint-disable import/prefer-default-export, func-names, prefer-arrow-callback */
/* eslint-enable max-len */
export const LearnSSR = (config) => {
  const app = new Router(config);

  enableLiveDataSupport(app);

  WebApp.rawConnectHandlers
    .use(redirect())
    .use(cookieParser());

  WebApp.connectHandlers
    .use(function (req, res, next) {
      app.callback(req, res, next);
    });

  return app;
};
/* eslint-enable */
