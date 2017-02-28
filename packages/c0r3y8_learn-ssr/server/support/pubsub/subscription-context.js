/**
 * We're stealing all the code from FastRender
 * https://github.com/kadirahq/fast-render/blob/master/lib/server/context.js
 */
import Fiber from 'fibers';
import Future from 'fibers/future';
import warning from 'warning';

import { DDP } from 'meteor/ddp';
import { EJSON } from 'meteor/ejson';
import { Meteor } from 'meteor/meteor';
import { Random } from 'meteor/random';

import Subscription from './subscription';
import { jsperfForEach } from '../../../shared/utils/jsperf';

/** @class */
export default class SubscriptionContext {
  /**
   * @constructor
   * @param {object} otherParams
   */
  constructor(otherParams) {
    this._collectionData = {};
    this._loginToken = null;
    this._subscriptions = {};
    this._timeout = otherParams.timeout || 500;
    this.userId = null;

    // Needed to perform subscription
    // We don't allow auth with cookie but subscription needs to `this.userId`
    if (Meteor.users) {
      /* eslint-disable max-len, no-underscore-dangle */
      /*
       * support for Meteor.user()
       * see https://github.com/meteor/meteor/blob/580e84d64acb6585233c4f4f0f5aad0c47244f23/packages/accounts-base/accounts_server.js#L80 for more infos
       */
      Fiber.current._meteor_dynamics = {};
      Fiber.current._meteor_dynamics[ DDP._CurrentInvocation.slot ] = this;
      /* eslint-enable */
    }

    Object.assign(this, otherParams);
  }

  /**
   * @summary Call when subscription is ready
   * @locus Server
   * @memberof SubscriptionContext
   * @method completeSubscriptions
   * @instance
   * @param {string} name
   * @param {object} params
   * @return {object}
   */
  completeSubscriptions(name, params) {
    const { _subscriptions } = this;
    if (!_subscriptions[ name ]) {
      _subscriptions[ name ] = {};
    }

    _subscriptions[ name ][ EJSON.stringify(params) ] = true;
  }

  /**
   * @summary Runs subscription handler and returns data
   * @locus Server
   * @memberof SubscriptionContext
   * @method performSubscription
   * @instance
   * @param {Subscription} subscription
   */
  /* eslint-disable no-underscore-dangle */
  performSubscription(subscription) {
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
   * @locus Server
   * @memberof SubscriptionContext
   * @method _ensureCollection
   * @instance
   * @param {string} collectionName
   */
  _ensureCollection(collectionName) {
    if (!this._collectionData[ collectionName ]) {
      this._collectionData[ collectionName ] = [];
    }
  }

  /**
   * @summary Returns datas to inject in html
   * @locus Server
   * @memberof SubscriptionContext
   * @method getData
   * @instance
   * @return {object}
   */
  getData() {
    return {
      collectionData: this._collectionData,
      subscriptions: this._subscriptions
    };
  }

  /**
   * @summary Performs the `subName` subscription
   * @locus Server
   * @memberof SubscriptionContext
   * @method subscribe
   * @instance
   * @param {string} subName
   * @param {...*} params
   * @return {object}
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

      return this.performSubscription(subscription);
    }

    warning(false, `There is no such publish handler named: ${subName}`);
    return {};
  }
}
