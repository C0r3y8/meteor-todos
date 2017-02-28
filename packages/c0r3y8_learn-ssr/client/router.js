import assert from 'assert';

import { Meteor } from 'meteor/meteor';

import ReactRouterEngine from './react-router-engine';
import RouterContext from './router-context';

import { jsperfForEach } from '../shared/utils/jsperf';
import { decodeData } from '../shared/utils/tools';

/* eslint-disable no-underscore-dangle */
const parsePreloadedSubscriptions = () => {
  if (window.__PRELOADED_SUBSCRIPTIONS__) {
    return decodeData(window.__PRELOADED_SUBSCRIPTIONS__);
  }
  return null;
};
/* eslint-enable */

/** @class */
export default class Router {
  /**
   * @constructs
   * @param {object} router
   * @param {ReactElement} router.App
   * @param {object} [router.options={}]
   * @param {object} [router.options.engine=new ReactRouterEngine]
   * @param {object} [router.options.engineOptions={}]
   * @param {boolean} [router.options.startup=true]
   */
  constructor({ App, options = {} }) {
    assert(App, 'You must provide an app to render.');

    this.context = new RouterContext();
    this.engine = options.engine || new ReactRouterEngine({
      App,
      options: options.engineOptions || {}
    });
    this.middlewares = [];
    this.options = options;
    this.startup = !(options.startup === false);

    // jsperf
    this.middlewares.jsperfForEach = jsperfForEach;
  }

  /**
   * @locus Client
   * @memberof Router
   * @method _dispatch
   * @instance
   */
  _dispatch() {
    const middlewareContext = this._initMiddlewareContext();

    this.context.init(parsePreloadedSubscriptions());

    this.engine.render(middlewareContext);
  }

  /**
   * @locus Client
   * @memberof Router
   * @method _initMiddlewareContext
   * @instance
   * @return {object}
   */
  _initMiddlewareContext() {
    const { middlewares } = this;
    const context = {};

    middlewares.jsperfForEach((middleware) => {
      const res = middleware();

      if (res) {
        Object.assign(context, res);
      }
    });

    return context;
  }

  /**
   * @summary Returns router context
   * @locus Client
   * @memberof Router
   * @method getContext
   * @instance
   * @return {RouterContext}
   */
  getContext() {
    return this.context;
  }

  /**
   * @summary Adds client middleware
   * @locus Client
   * @memberof Router
   * @method middleware
   * @instance
   * @param {function|Array.<function>} middlewares
   */
  middleware(middlewares) {
    assert(middlewares, 'You must provide a middleware');

    if (Array.isArray()) {
      this.middlewares.push(...middlewares);
    } else {
      this.middlewares.push(middlewares);
    }
  }

  /**
   * @summary Start rendering app
   * @locus Client
   * @memberof Router
   * @method render
   * @instance
   */
  render() {
    if (this.startup) {
      Meteor.startup(() => {
        this._dispatch();
      });
    } else {
      this._dispatch();
    }
  }
}
