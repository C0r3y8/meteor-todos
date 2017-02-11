import redirect from 'connect-redirection';

import { checkNpmVersions } from 'meteor/tmeasday:check-npm-versions';
import { WebApp } from 'meteor/webapp';

import Router from './router';

checkNpmVersions({
  react: '15.x',
  'react-dom': '15.x',
  'react-helmet': '4.x',
  'react-router-dom': '4.0.0-beta.5',
}, 'c0r3y8:electrolysis');

/* eslint-disable max-len */
/* eslint-disable import/prefer-default-export, func-names, prefer-arrow-callback */
/* eslint-enable max-len */
export const LearnSSR = (config) => {
  const app = new Router(config);

  WebApp.connectHandlers
    .use(redirect())
    .use(function (req, res, next) {
      app.callback(req, res, next);
    });
  return app;
};
/* eslint-enable */
