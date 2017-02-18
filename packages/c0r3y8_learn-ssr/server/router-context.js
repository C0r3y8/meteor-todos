/* eslint-disable max-len */
/**
 * We're stealing all the code meteor-react-router-ssr
 * https://github.com/thereactivestack-legacy/meteor-react-router-ssr/blob/master/lib/ssr_context.js
 */
/* eslint-enable */

/** @class */
export default class RouterContext {
  /**
   * @constructor
   * @param {SubscriptionContext} context
   */
  constructor(context) {
    this.context = context;
  }

  /**
   * @summary Starts subscription on server
   * @locus Server
   * @memberof RouterContext
   * @method addSubscription
   * @instance
   * @param {string} name
   * @param {object} params
   */
  addSubscription(name, ...params) {
    const { context } = this;
    if (!context) {
      throw new Error(
        `Cannot add a subscription: ${name} without a context`
      );
    }

    context.subscribe(name, ...params);
  }

  /**
   * @summary Returns subscriptions datas
   * @locus Server
   * @memberof RouterContext
   * @method getData
   * @instance
   */
  getData() {
    return this.context.getData();
  }
}
