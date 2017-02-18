let router;

/* eslint-disable global-require */
if (Meteor.isServer) {
  router = require('./server');
} else {
  router = require('./client');
}
/* eslint-enable */

/* eslint-disable import/prefer-default-export */
export const LearnSSR = router;
/* eslint-enable */
