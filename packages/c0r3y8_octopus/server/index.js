/* eslint-disable import/no-unresolved */
import redirect from 'connect-redirection';
/* eslint-enable */

import { checkNpmVersions } from 'meteor/tmeasday:check-npm-versions';
import { WebApp } from 'meteor/webapp';

import Router from './router';
import enableLiveDataSupport from './support/pubsub/subscribe';

import {
  jsperfFilter,
  jsperfFind,
  jsperfForEach
} from '../shared/utils/jsperf';
import {
  decodeData,
  encodeData
} from '../shared/utils/tools';
import { isAppUrl } from '../shared/utils/urls';

checkNpmVersions({
  react: '15.x',
  'react-dom': '15.x',
  'react-router-dom': '4.0.0-beta.6',
}, 'c0r3y8:octopus');

/* eslint-disable max-len */
/* eslint-disable import/prefer-default-export, func-names, no-unused-vars, prefer-arrow-callback */
/* eslint-enable max-len */
const Octopus = (App, clientOptions, serverOptions) => {
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

export {
  decodeData,
  encodeData,
  isAppUrl,
  jsperfFilter,
  jsperfFind,
  jsperfForEach,
  Octopus
};
/* eslint-enable */
