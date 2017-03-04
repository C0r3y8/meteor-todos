import assert from 'assert';
import warning from 'warning';

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
    this.modules = [];
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
      middleware.call(context);
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
   * @param {...function} callback
   */
  middleware(...callback) {
    assert(callback.length !== 0, 'You must provide a middleware');

    this.middlewares.push(...callback);
  }
  /**
   * @summary Adds module
   * @locus Server
   * @memberof Router
   * @method module
   * @instance
   * @param {function|object} Module
   * @param {object} [options={}]
   * @param {object=} options.config
   * @param {boolean} [options.engineOptions=true]
   * @param {boolean} [options.middlewares=true]
   */
  module(Module, options = {}) {
    assert(Module, 'You must provide a module');

    if (typeof Module !== 'function' && typeof Module !== 'object') {
      warning(false, `Router: ${Module} must be a function or an object`);
      return;
    }

    const mergedOptions = {
      engineOptions: true,
      middlewares: true,
      ...options
    };
    const instance = (typeof Module === 'function') ?
      new Module(mergedOptions.config) : Module;

    let middlewares;

    if (instance.getEngineOptions && mergedOptions.engineOptions) {
      this.engine.setOptions(instance.getEngineOptions());
    }

    if (instance.getMiddlewares && mergedOptions.middlewares) {
      middlewares = instance.getMiddlewares();

      if (middlewares) {
        if (Array.isArray(middlewares)) {
          this.middleware(...middlewares);
        } else {
          this.middleware(middlewares);
        }
      }
    }

    this.modules.push(instance);
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
