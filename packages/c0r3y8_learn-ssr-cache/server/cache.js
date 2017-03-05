import assert from 'assert';
import NodeCache from 'node-cache';

import { jsperfFind } from 'meteor/c0r3y8:learn-ssr';

/** @class */
export default class Cache {
  /**
   * @constructor
   * @param {object} [options={}]
   * @param {number} [options.checkperiod=600]
   * @param {boolean} [options.errorOnMissing=false]
   * @param {number} [options.stdTTL=0]
   * @param {boolean} [options.useClones=true]
   */
  constructor(options = {}) {
    assert(options, 'You must provide `options`');

    this.options = {
      checkperiod: 600,
      errorOnMissing: false,
      stdTTL: 0,
      useClones: true,
      ...options
    };
    this.cache = new NodeCache(this.options);
    this.queue = {};

    this.close = this.cache.close;
    this.del = this.cache.del;
    this.flushAll = this.cache.flushAll;
    this.get = this.cache.get;
    this.getStats = this.cache.getStats;
    this.getTtl = this.cache.getTtl;
    this.keys = this.cache.keys;
    this.mget = this.cache.mget;
    this.on = this.cache.on;
    this.set = this.cache.set;
    this.ttl = this.cache.ttl;
  }

  /**
   * @summary Adds key in queue
   * @locus Server
   * @memberof Cache
   * @method addInQueue
   * @instance
   * @param {object} route
   * @param {string} route.key
   * @param {number} route.ttl
   * @param {string} route.url
   */
  addInQueue(route) {
    if (!this.queue[ route.key ]) {
      this.queue[ route.key ] = route;
    }
  }

  /**
   * @summary Process all queue callback
   * @locus Server
   * @memberof Cache
   * @method processQueue
   * @instance
   */
  processQueue(req, res) {
    const { dynamicBody, dynamicHead, originalUrl } = req;
    const { statusCode } = res;
    const keys = Object.keys(this.queue);
    // jsPerf
    keys.jsperfFind = jsperfFind;

    const current = keys.jsperfFind(
      key => this.queue[ key ].url === originalUrl
    );

    let route;

    if (current) {
      route = this.queue[ current ];

      this.cache.set(route.key, {
        body: dynamicBody,
        head: dynamicHead,
        status: statusCode,
        url: res.getHeader('Location')
      }, route.ttl);

      delete this.queue[ current ];
    }
  }
}
