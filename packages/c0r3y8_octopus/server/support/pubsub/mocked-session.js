/* eslint-disable max-len */
/**
 * We're stealing all the code from FastRender
 * https://github.com/kadirahq/fast-render/blob/master/lib/server/publish_context.js
 */
/* eslint-enable */

import { EJSON } from 'meteor/ejson';
import { Meteor } from 'meteor/meteor';
import { Random } from 'meteor/random';

import { jsperfForEach } from '../../../shared/utils/jsperf';

/* eslint-disable max-len */
/*
 * see https://github.com/meteor/meteor/blob/84ed04b8f3b99cf16b5540f2e0193d47e4f8ccf6/packages/ddp-server/livedata_server.js#L224 for more infos
 */
/* eslint-enable */
/** @class */
export default class MockedSession {
  /**
   * @constructor
   * @param {function} subscription
   * @param {SubscriptionContext} context
   */
  constructor(subscription, { headers, userId }) {
    const id = Random.id();

    this.connectionHandle = {
      clientAddress: '127.0.0.1',
      close() {},
      httpHeaders: headers,
      id,
      onClose() {}
    };
    this.id = id;
    this.inQueue = {};
    this.subscription = subscription;
    this.userId = userId;
  }

  /* eslint-disable max-len, no-unused-vars, no-underscore-dangle */
  /**
   * @summary Call inside `Subscription.added`
   * @description https://github.com/meteor/meteor/blob/84ed04b8f3b99cf16b5540f2e0193d47e4f8ccf6/packages/ddp-server/livedata_server.js#L1239
   * @locus Server
   * @memberof MockedSession
   * @method added
   * @instance
   * @param {function} subscriptionHandle
   * @param {string} collectionName
   * @param {string} id
   * @param {object} fields
   */
  /* eslint-enable max-len */
  added(subscriptionHandle, collectionName, id, fields) {
    const { subscription } = this;
    // Don't share state with the data passed in by the user.
    const doc = EJSON.clone(fields);

    doc._id = subscription()._idFilter.idParse(id);
    Meteor._ensure(
      subscription()._collectionData,
      collectionName
    )[ id ] = doc;
  }
  /* eslint-enable */

  /* eslint-disable max-len, no-unused-vars, no-underscore-dangle */
  /**
   * @summary Call inside `Subscription.changed`
   * @description https://github.com/meteor/meteor/blob/84ed04b8f3b99cf16b5540f2e0193d47e4f8ccf6/packages/ddp-server/livedata_server.js#L1257
   * @locus Server
   * @memberof MockedSession
   * @method changed
   * @instance
   * @param {function} subscriptionHandle
   * @param {string} collectionName
   * @param {string} id
   * @param {object} fields
   * @throws {Error}
   */
  /* eslint-enable max-len */
  changed(subscriptionHandle, collectionName, id, fields) {
    const { subscription } = this;
    const doc = subscription()._collectionData[ collectionName ][ id ];

    if (!doc) {
      throw new Error(`Could not find element with id ${id} to change`);
    }

    const keys = Object.keys(fields);
    // jsperf
    keys.jsperfForEach = jsperfForEach;

    keys.jsperfForEach((key) => {
      const value = fields[ key ];

      // Publish API ignores _id if present in fields.
      if (key !== '_id') {
        if (value === undefined) {
          delete doc[ key ];
        } else {
          // Don't share state with the data passed in by the user.
          doc[ key ] = EJSON.clone(value);
        }
      }
    });
  }
  /* eslint-enable */

  /* eslint-disable max-len, no-unused-vars, no-underscore-dangle */
  /**
   * @summary Call inside `Subscription.removed`
   * @description https://github.com/meteor/meteor/blob/84ed04b8f3b99cf16b5540f2e0193d47e4f8ccf6/packages/ddp-server/livedata_server.js#L1273
   * @locus Server
   * @memberof MockedSession
   * @method removed
   * @instance
   * @param {function} subscriptionHandle
   * @param {string} collectionName
   * @param {string} id
   * @throws {Error}
   */
  /* eslint-enable max-len */
  removed(subscriptionHandle, collectionName, id) {
    const { subscription } = this;

    if (!(subscription()._collectionData[ collectionName ]
      && subscription()._collectionData[ collectionName ][ id ])
    ) {
      throw new Error(`Removed nonexistent document ${id}`);
    }
    delete subscription()._collectionData[ collectionName ][ id ];
  }
  /* eslint-enable */

  /* eslint-disable max-len, no-unused-vars, no-underscore-dangle */
  /**
   * @summary Call inside `Subscription.ready`
   * @description https://github.com/meteor/meteor/blob/84ed04b8f3b99cf16b5540f2e0193d47e4f8ccf6/packages/ddp-server/livedata_server.js#L1290
   * @locus Server
   * @memberof MockedSession
   * @method sendReady
   * @instance
   * @param {array} subscriptionIds
   * @throws {Error}
   */
  /* eslint-enable max-len */
  sendReady(subscriptionIds) {
    const { subscription } = this;

    // this is called only for non-universal subscriptions
    if (!subscription()._subscriptionId) {
      throw new Error('Assertion.');
    }

    // make the subscription be marked as ready
    if (!subscription()._isDeactivated()) {
      subscription()._context.completeSubscriptions(
        subscription()._name,
        subscription()._params
      );
    }

    // we just stop it
    subscription().stop();
  }
  /* eslint-enable */
}
