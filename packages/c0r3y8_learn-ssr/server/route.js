import assert from 'assert';
import pathToRegexp from 'path-to-regexp';
import warning from 'warning';

import { jsperfForEach } from '../shared/utils/jsperf';
import { isAppUrl } from '../shared/utils/urls';


/** @class */
export default class Route {
  /**
   * @constructor
   * @param {object} config
   * @param {boolean} config.exact
   * @param {string} config.path
   * @param {boolean} config.strict
   * @param {array.<function>} callback
   */
  constructor({
    exact,
    path,
    strict
  }, callback) {
    assert(path, 'You must provide a route path.');
    assert(callback.length !== 0, 'You must provide a route middleware.');

    this.callback = callback;
    this.keys = [];
    // jsperf
    this.keys.jsperfForEach = jsperfForEach;
    this.path = path;
    this.regex = pathToRegexp(path, this.keys, { end: exact, strict });

    warning(isAppUrl(path), `Router: ${path} is not an app url`);
  }

  /**
   * @summary Returns `index` callback
   * @locus Server
   * @memberof Route
   * @method getCallback
   * @instance
   * @param {number} [index=0]
   * @return {function}
   */
  getCallback(index = 0) {
    return this.callback[ index ];
  }

  /**
   * @locus Server
   * @memberof Route
   * @method getPath
   * @instance
   * @return {string}
   */
  getPath() {
    return this.path;
  }
}
