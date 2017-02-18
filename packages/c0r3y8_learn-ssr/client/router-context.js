/** @class */
export default class RouterContext {
  /**
   * @constructor
   */
  constructor() {
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
    if (payload && payload.subscriptions) {
      this.subscriptions = payload.subscriptions;
    }
  }

  /**
   * @summary Initialize server rendered subscriptions
   * @locus Client
   * @memberof RouterContext
   * @method init
   * @instance
   */
  init(payload) {
    console.log(payload.collectionData);
    this._initPayload(payload);
    this._initSubscriptions(payload);
  }
}
