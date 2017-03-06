/* eslint-disable max-len */
/**
 * We're stealing all the code from FastRender
 * https://github.com/kadirahq/fast-render/blob/master/lib/server/publish_context.js
 */
/* eslint-enable */
import warning from 'warning';

import { MeteorX } from 'meteor/meteorhacks:meteorx';

import MockedSession from './mocked-session';

/* eslint-disable max-len */
/*
 * see https://github.com/meteor/meteor/blob/84ed04b8f3b99cf16b5540f2e0193d47e4f8ccf6/packages/ddp-server/livedata_server.js#L937 for more infos
 */
/* eslint-enable */
/** @class */
export default class Subscription extends MeteorX.Subscription {
  /**
   * @constructor
   * @param {Context} context
   * @param {function} handler
   * @param {string=} subscriptionId
   * @param {array=} params
   * @param {string=} name
   */
  constructor(context, handler, subscriptionId, params, name) {
    // mock session
    const session = new MockedSession(() => this, context);
    super(session, handler, subscriptionId, params, name);

    this._collectionData = {};
    this._context = context;
    this.unblock = () => {};
  }

  /**
   * @summary Call when a error occurs in publication
   * @locus Server
   * @memberof Subscription
   * @method error
   * @instance
   * @param {Error} error
   */
  error(error) {
    const { _name } = this;
    const message = error.message || error;

    warning(false, `error caught on publication: ${_name}: ${message}`);
    this.stop();
  }

  /**
   * @summary Stops the subscription
   * @locus Server
   * @memberof Subscription
   * @method stop
   * @instance
   */
  stop() {
    // our stop does not remove all documents (it just calls deactivate)
    // Meteor one removes documents for non-universal subscription
    // we deactivate both for universal and named subscriptions
    // hopefully this is right in our case
    // Meteor does it just for named subscriptions
    this._deactivate();
  }
}
