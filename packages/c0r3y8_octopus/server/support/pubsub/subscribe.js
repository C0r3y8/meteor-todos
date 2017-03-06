/* eslint-disable max-len */
/**
 * We're stealing all the code meteor-react-router-ssr
 * https://github.com/thereactivestack-legacy/meteor-react-router-ssr/blob/master/lib/ssr_data.js
 */
/* eslint-enable */

import { Meteor } from 'meteor/meteor';

export default (router) => {
  const originalSubscribe = Meteor.subscribe;
  Meteor.subscribe = (name, ...params) => {
    const context = router.getContext();

    if (context) {
      context.addSubscription(name, params);
    }

    if (originalSubscribe) {
      originalSubscribe.apply(Meteor, [ name, ...params ]);
    }

    return {
      ready: () => true
    };
  };

  // This is not available in the server. But to make it work with SSR
  // We need to have it.
  Meteor.loggingIn = () => false;
};
