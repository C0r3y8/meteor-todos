/**
 * We're stealing all the code from FastRender
 * https://github.com/kadirahq/fast-render/blob/master/lib/server/context.js
 */
import Fiber from 'fibers';
// import Future from 'fibers/future';

import { Accounts } from 'meteor/account-base';
import { Meteor } from 'meteor/meteor';
import { Random } from 'meteor/random';

// import { jsperfForEach } from '../../../shared/utils/jsperf';

/** @class */
export default class Context {
  /**
   * @constructor
   * @param {string} loginToken
   * @param {object} otherParams
   */
  constructor(loginToken, otherParams) {
    this._collectionData = {};
    this._loginToken = loginToken;
    this._subscritpions = {};

    Object.assign(this, otherParams);

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

      /*
       * support for Meteor.user()
       * see https://github.com/meteor/meteor/blob/580e84d64acb6585233c4f4f0f5aad0c47244f23/packages/accounts-base/accounts_server.js#L80 for more infos
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

  /**
   * @method processPublication
   * @param {PublishContext} publishContext
   */
  processPublication(publishContext) {

  }

  /**
   * @method subscribe
   * @param {string} subName
   * @param {...*} params
   */
  subscribe(subName, ...params) {
    const publishHandler = Meteor.default_server.publish_handlers[ subName ];

    let publishContext;

    if (publishHandler) {
      publishContext = new PublishContext(
        this,
        publishHandler,
        Random.id(),
        params,
        subName
      );

      return this.processPublication(publishContext);
    }

    warning(false, `There is no such publish handler named: ${subName}`);
    return {};
  }
}
