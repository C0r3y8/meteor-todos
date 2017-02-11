/* eslint-disable max-len */
/**
 * This module is highly based on https://github.com/thereactivestack-legacy/meteor-react-router-ssr.
 */
/* eslint-enable */

import { jsperfForEach } from '../shared/utils/jsperf';

/** @class */
export default class RouterContext {
  constructor() {
    this.collections = {};
    this.subscritpions = {};
  }

  add(name, ...params) {
    const fastRenderContext = FastRender.frContext.get();
    if (!fastRenderContext) {
      throw new Error(
        `Cannot add a subscription: ${name} without FastRender Context`
      );
    }

    const result = fastRenderContext.subscribe(name, ...params);

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
}
