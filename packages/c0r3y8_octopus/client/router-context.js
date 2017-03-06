/**
 * We're stealing all the code from FastRender
 * https://github.com/kadirahq/fast-render/blob/master/lib/client/fast_render.js
 */
import { Accounts } from 'meteor/accounts-base';
import { Meteor } from 'meteor/meteor';
import { MongoID } from 'meteor/mongo-id';

import { jsperfForEach } from '../shared/utils/jsperf';

/** @class */
export default class RouterContext {
  /**
   * @constructor
   */
  constructor() {
    this.dataReceived = false;
    this.payload = null;
    this.subscriptions = {};
  }

  /**
   * @locus Client
   * @memberof RouterContext
   * @method _initPayload
   * @instance
   */
  _initPayload(payload) {
    this.payload = payload;
  }

  /**
   * @locus Client
   * @memberof RouterContext
   * @method _initSubscriptions
   * @instance
   */
  _initSubscriptions(payload) {
    if (payload.subscriptions) {
      this.subscriptions = payload.subscriptions;
    }
  }

  /* eslint-disable no-param-reassign, no-underscore-dangle */
  /**
   * @summary Inject a custom/fake DDP message
   * @locus Client
   * @memberof RouterContext
   * @method _injectDdpMessage
   * @instance
   * @param {Connection} connection
   * @param {object} msg
   */
  injectDdpMessage(connection, msg) {
    const originalWait = connection._waitingForQuiescence;
    connection._waitingForQuiescence = () => false;
    connection._livedata_data(msg);
    connection._waitingForQuiescence = originalWait;
  }
  /* eslint-enable */

  /* eslint-disable no-underscore-dangle */
  /**
   * @summary Initialize server rendered subscriptions
   * @locus Client
   * @memberof RouterContext
   * @method init
   * @instance
   */
  init(payload) {
    const { connection } = Meteor;
    let keys;

    this.dataReceived = true;

    if (payload) {
      this._initPayload(payload);
      this._initSubscriptions(payload);

      keys = Object.keys(payload.collectionData);
      // jsperf
      keys.jsperfForEach = jsperfForEach;

      keys.jsperfForEach((collectionName) => {
        const collection = payload.collectionData[ collectionName ];
        // jsperf
        collection.jsperfForEach = jsperfForEach;

        collection.jsperfForEach(({ _id, ...fields }) => {
          this.injectDdpMessage(connection, {
            collection: collectionName,
            fields,
            fromSSR: true,
            id: MongoID.idStringify(_id),
            msg: 'added'
          });
        });
      });
    }

    // If the connection supports buffered DDP writes, then flush now.
    if (connection._flushBufferedWrites) {
      connection._flushBufferedWrites();
    }

    // let Meteor know, user login process has been completed
    if (Accounts) {
      Accounts._setLoggingIn(false);
    }
  }
  /* eslint-enable */
}
