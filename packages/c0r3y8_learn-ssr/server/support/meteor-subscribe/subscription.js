/**
 * This module is highly based on https://github.com/kadirahq/fast-render.
 */
/* eslint-disable no-unused-vars */
import warning from 'warning';
/* eslint-enable */
import { MeteorX } from 'meteor/meteorhacks:meteorx';

import MockedSession from './mocked-session';

export default class Subscription extends MeteorX.Subscription {
  constructor(context, handler, subscriptionId, params, name) {
    // mock session
    const session = new MockedSession(() => this, context);
    super(session, handler, subscriptionId, params, name);

    this._collectionData = {};
    this._context = context;
    this.unblock = () => {};
  }

  error(error) {
    const { _name } = this;
    const message = error.message || error;

    warning(false, `error caught on publication: ${_name}: ${message}`);
    this.stop();
  }

  stop() {
    // our stop does not remove all documents (it just calls deactivate)
    // Meteor one removes documents for non-universal subscription
    // we deactivate both for universal and named subscriptions
    // hopefully this is right in our case
    // Meteor does it just for named subscriptions
    this._deactivate();
  }
}
