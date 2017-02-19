import { checkNpmVersions } from 'meteor/tmeasday:check-npm-versions';

import Router from './router';
import enableLiveDataSupport from './support/pubsub/connection';

checkNpmVersions({
  react: '15.x',
  'react-dom': '15.x',
  'react-helmet': '4.x',
  'react-router-dom': '4.0.0-beta.6',
}, 'c0r3y8:learn-ssr');

/* eslint-disable max-len */
/* eslint-disable import/prefer-default-export, func-names, prefer-arrow-callback */
/* eslint-enable max-len */
export const LearnSSR = (App, clientOptions) => {
  const app = new Router({
    App,
    options: clientOptions
  });

  enableLiveDataSupport(app);

  app.render();

  return app;
};
/* eslint-enable */
