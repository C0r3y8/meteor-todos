/**
 * We're stealing all the code from FastRender
 * https://github.com/kadirahq/fast-render/blob/master/lib/server/context.js
 */
import Fiber from 'fibers';
import Future from 'fibers/future';

import { Accounts } from 'meteor/account-base';
import { Meteor } from 'meteor/meteor';

import { jsperfForEach } from '../../../shared/utils/jsperf';

/** @class */
export default class SubscriptionContext {
  constructor(loginToken) {
    this.collectionData = {};
    this.loginToken = loginToken;
    this.subscritpions = {};

    let hashedToken;
    let user;

    // get the user
    if (Meteor.users) {
      // check to make sure, we've the loginToken,
      // otherwise a random user will fetched from the db
      if (loginToken) {
        /* eslint-disable no-underscore-dangle */
        hashedToken = loginToken && Accounts._hashLoginToken(loginToken);
        /* eslint-disable */
        user = Meteor.users.findOne({
          'services.resume.loginTokens.hashedToken': hashedToken
        }, { fields: { _id: 1 } });
      }

      /* support for Meteor.user
       * DDP._CurrentInvocation is a Meteor.EnvironmentVariable instance
       * https://github.com/meteor/meteor/blob/87681c8f166641c6c3e34958032a5a070aa2d11a/packages/ddp-client/livedata_common.js
       * https://github.com/meteor/meteor/blob/87681c8f166641c6c3e34958032a5a070aa2d11a/packages/meteor/dynamics_browser.js
       *
       * Fiber.current._meteor_dynamics[ DDP._CurrentInvocation.slot ]
       * https://github.com/meteor/meteor/blob/87681c8f166641c6c3e34958032a5a070aa2d11a/packages/ddp-client/client_convenience.js
       * https://github.com/meteor/meteor/blob/7baed435f53c4fa2cf5515679e64c68d88d31d7a/packages/ddp-client/livedata_connection.js
       * https://github.com/meteor/meteor/blob/84ed04b8f3b99cf16b5540f2e0193d47e4f8ccf6/packages/ddp-server/livedata_server.js
       * https://github.com/meteor/meteor/blob/19a60d51db8f7eaf70a9fae4e1560a459c35ff53/packages/ddp-common/method_invocation.js
       * https://github.com/meteor/meteor/blob/87681c8f166641c6c3e34958032a5a070aa2d11a/packages/ddp-client/livedata_connection.js
       * Accounts
       * https://github.com/meteor/meteor/blob/580e84d64acb6585233c4f4f0f5aad0c47244f23/packages/accounts-base/accounts_server.js
       */
      /* eslint-disable no-underscore-dangle */
      Fiber.current._meteor_dynamics = {};
      Fiber.current._meteor_dynamics[ DDP._CurrentInvocation.slot ] = this;
      /* eslint-enable */

      if (user) {
        this.userId = user._id;
      }
    }
  }
}
