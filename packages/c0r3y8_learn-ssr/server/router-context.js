/* eslint-disable max-len */
/**
 * We're stealing all the code from FastRender
 * https://github.com/thereactivestack-legacy/meteor-react-router-ssr/blob/master/lib/ssr_context.js
 */
/* eslint-enable */

import { jsperfForEach } from '../shared/utils/jsperf';

/** @class */
export default class RouterContext {
  constructor(context) {
    this.collections = {};
    this.context = context;
  }

  addSubscription(name, ...params) {
    const { context } = this;
    if (!context) {
      throw new Error(
        `Cannot add a subscription: ${name} without a context`
      );
    }

    const result = context.subscribe(name, ...params);

    const keys = Object.keys(result);
    // jsperf
    keys.jsperfForEach = jsperfForEach;

    keys.jsperfForEach((collectionName) => {
      const collection = this._getCollection(collectionName);
      const collectionData = result[ collectionName ];
      // jsperf
      collectionData.jsperfForEach = jsperfForEach;

      collectionData.jsperfForEach((data) => {
        // jsperf
        /* eslint-disable no-param-reassign */
        data.jsperfForEach = jsperfForEach;
        /* eslint-enable */

        data.jsperfForEach((item) => {
          const {
            _id,
            ...fields
          } = item;
          const doc = collection.findOne(_id);

          if (doc) {
            collection.update(_id, { $set: { ...fields } });
          } else {
            collection.insert(item);
          }
        });
      });
    });
  }

  _getCollection(name) {
    if (!this.collection[ name ]) {
      this.collections[ name ] = new Package.minimongo.LocalCollection();
    }
    return this.collection[ name ];
  }

  getData() {
    return this.context.getData();
  }
}
