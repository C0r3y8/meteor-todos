/**
 * We're stealing all the code from FastRender
 * https://github.com/kadirahq/fast-render/blob/master/lib/server/context.js
 */
import Fiber from 'fibers';
import Future from 'fibers/future';
import warning from 'warning';

import { Accounts } from 'meteor/accounts-base';
import { EJSON } from 'meteor/ejson';
import { Meteor } from 'meteor/meteor';
import { Random } from 'meteor/random';

import Subscription from './subscription';
import { jsperfForEach } from '../../../shared/utils/jsperf';

/** @class */
export default class SubscriptionContext {
  /**
   * @constructor
   * @param {string} loginToken
   * @param {object} otherParams
   */
  constructor(loginToken, otherParams) {
    this._collectionData = {};
    this._loginToken = loginToken;
    this._subscritpions = {};
    this._timeout = otherParams.timeout || 500;

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
        /* eslint-enable */
        user = Meteor.users.findOne({
          'services.resume.loginTokens.hashedToken': hashedToken
        }, { fields: { _id: 1 } });
      }

      /* eslint-disable max-len, no-underscore-dangle */
      /*
       * support for Meteor.user()
       * see https://github.com/meteor/meteor/blob/580e84d64acb6585233c4f4f0f5aad0c47244f23/packages/accounts-base/accounts_server.js#L80 for more infos
       */
      Fiber.current._meteor_dynamics = {};
      Fiber.current._meteor_dynamics[ DDP._CurrentInvocation.slot ] = this;
      /* eslint-enable */

      if (user) {
        this.userId = user._id;
      }
    }
  }

  /**
   * @method completeSubscriptions
   * @param {string} name
   * @param {object} params
   */
  completeSubscriptions(name, params) {
    const { _subscriptions } = this;
    if (!_subscriptions[ name ]) {
      _subscriptions[ name ] = {};
    }

    _subscriptions[ EJSON.stringify(params) ] = true;
  }

  /**
   * @method dispatchSubscription
   * @param {Subscription} subscription
   */
  /* eslint-disable no-underscore-dangle */
  dispatchSubscription(subscription) {
    const data = {};
    const future = new Future();

    const ensureCollection = (collectionName) => {
      this._ensureCollection(collectionName);

      if (!data[ collectionName ]) {
        data[ collectionName ] = [];
      }
    };

    // detect when the context is ready to be sent to the client
    subscription.onStop(() => {
      if (!future.isResolved()) {
        future.return();
      }
    });

    subscription._runHandler();

    if (!subscription._subscriptionId) {
      /* eslint-disable max-len */
      // universal subscription, we stop it (same as marking it as ready) ourselves
      // they otherwise do not have ready or stopped state, but in our case they do
      /* eslint-enable */
      subscription.stop();
    }

    if (!future.isResolved()) {
      // don't wait forever for handler to fire ready()
      Meteor.setTimeout(() => {
        if (!future.isResolved()) {
          // publish handler failed to send ready signal in time
          // maybe your non-universal publish handler
          // is not calling this.ready()?
          // or maybe it is returning null to signal empty publish?
          // it should still call this.ready() or return an empty array []
          warning(false, `
              Publish handler for ${subscription._name} sent no ready signal
              This could be because this publication \`return null\`.
              Use \`return this.ready()\` instead.
            `
          );
          future.return();
        }
      }, this._timeout);

      //  wait for the subscription became ready.
      future.wait();
    }

    // stop any runaway subscription
    // this can happen if a publish handler never calls ready or stop
    // for example it does not hurt to call it multiple times
    subscription.stop();

    const keys = Object.keys(subscription._collectionData);
    // jsperf
    keys.jsperfForEach = jsperfForEach;

    // get the data
    keys.jsperfForEach((key) => {
      let collectionData = subscription._collectionData[ key ];

      // making an array from a map
      collectionData = Object
        .keys(collectionData)
        .map(item => collectionData[ item ]);

      ensureCollection(key);
      data[ key ].push(collectionData);

      // copy the collection data in subscription into the subscription context
      this._collectionData[ key ].push(collectionData);
    });

    return data;
  }
  /* eslint-enable */

  /**
   * @method _ensureCollection
   * @param {string} collectionName
   */
  _ensureCollection(collectionName) {
    if (!this.collectionData[ collectionName ]) {
      this.collectionData[ collectionName ] = [];
    }
  }

  /**
   * @method getData
   */
  getData() {
    return {
      collectionData: this._collectionData,
      loginToken: this._loginToken,
      subscriptions: this._subscritpions
    };
  }

  /**
   * @method subscribe
   * @param {string} subName
   * @param {...*} params
   */
  subscribe(subName, ...params) {
    const publishHandler = Meteor.default_server.publish_handlers[ subName ];

    let subscription;

    if (publishHandler) {
      subscription = new Subscription(
        this,
        publishHandler,
        Random.id(),
        params,
        subName
      );

      return this.dispatchSubscription(subscription);
    }

    warning(false, `There is no such publish handler named: ${subName}`);
    return {};
  }
}
