/**
 * This module is highly based on https://github.com/kadirahq/fast-render.
 */

import { EJSON } from 'meteor/ejson';
import { Meteor } from 'meteor/meteor';
import { Random } from 'meteor/random';

import { jsperfForEach } from '../../../shared/utils/jsperf';

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

  /* eslint-disable no-unused-vars, no-underscore-dangle */
  /**
   * @method added
   * @param {function} subscriptionHandle
   * @param {string} collectionName
   * @param {string} id
   * @param {object} fields
   */
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

  /* eslint-disable no-unused-vars, no-underscore-dangle */
  /**
   * @method changed
   * @param {function} subscriptionHandle
   * @param {string} collectionName
   * @param {string} id
   * @param {object} fields
   */
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

  /* eslint-disable no-unused-vars, no-underscore-dangle */
  /**
   * @method removed
   * @param {function} subscriptionHandle
   * @param {string} collectionName
   * @param {string} id
   */
  removed(subscriptionHandle, collectionName, id) {
    const { subscription } = this;

    if (!(subscription()._collectionData[ collectionName ]
      && self._collectionData[ collectionName ][ id ])
    ) {
      throw new Error(`Removed nonexistent document ${id}`);
    }
    delete subscription()._collectionData[ collectionName ][ id ];
  }
  /* eslint-enable */

  /* eslint-disable no-unused-vars, no-underscore-dangle */
  /**
   * @method sendReady
   * @param {array} subscriptionIds
   */
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
