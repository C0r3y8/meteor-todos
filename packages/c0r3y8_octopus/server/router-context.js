/* eslint-disable max-len */
/**
 * We're stealing all the code meteor-react-router-ssr
 * https://github.com/thereactivestack-legacy/meteor-react-router-ssr/blob/master/lib/ssr_context.js
 */
/* eslint-enable */

import { jsperfForEach } from '../shared/utils/jsperf';

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
   * @param {...*} params
   * @throws {Error}
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
   * @return {object}
   */
  getData() {
    const contextData = this.context.getData();

    const formatedData = {
      collectionData: {},
      subscriptions: contextData.subscriptions
    };

    const keys = Object.keys(contextData.collectionData);
    // jsperf
    keys.jsperfForEach = jsperfForEach;

    keys.jsperfForEach((collectionName) => {
      const collectionData = contextData.collectionData[ collectionName ];

      if (!formatedData.collectionData[ collectionName ]) {
        formatedData.collectionData[ collectionName ] = [];
      }

      // jsperf
      collectionData.jsperfForEach = jsperfForEach;

      collectionData.jsperfForEach((dataSet) => {
        // jsperf
        /* eslint-disable no-param-reassign */
        dataSet.jsperfForEach = jsperfForEach;
        /* eslint-enable */

        dataSet.jsperfForEach((item) => {
          formatedData.collectionData[ collectionName ].push(item);
        });
      });
    });

    return formatedData;
  }
}
