import assert from 'assert';
import Fiber from 'fibers';
import * as nodeUrl from 'url';
import warning from 'warning';

import { Meteor } from 'meteor/meteor';

import ReactRouterEngine from './react-router-engine';
import Route from './route';
import RouterContext from './router-context';
import Subscription from './support/pubsub/subscription';
/* eslint-disable max-len */
import SubscriptionContext from './support/pubsub/subscription-context';
/* eslint-enable */
import { encodeData } from '../shared/utils/tools';
import { isAppUrl } from '../shared/utils/urls';
import {
  jsperfFind,
  jsperfForEach
} from '../shared/utils/jsperf';

const runInFiber = (fn) => {
  if (Fiber.current) {
    fn();
  } else {
    new Fiber(() => fn.call()).run();
  }
};

const stringifyPreloadedSubscriptions = data =>
  `window.__PRELOADED_SUBSCRIPTIONS__ = '${encodeData(data)}';`;

/** @class */
export default class Router {
  /**
   * @constructs
   * @param {object} router
   * @param {ReactElement} router.App
   * @param {object} [router.options={}]
   * @param {object} [router.options.engine=new ReactRouterEngine]
   * @param {object} [router.options.engineOptions={}]
   * @param {array} [router.options.engineOptions.extras.body=[]]
   * @param {array} [router.options.engineOptions.extras.headers=[]]
   */
  constructor({ App, options = {} }) {
    assert(App, 'You must provide an app to render.');

    const engineOptions = options.engineOptions || {};

    this.context = new Meteor.EnvironmentVariable();
    if (engineOptions
      && engineOptions.extras
      && engineOptions.extras.body
      && Array.isArray(engineOptions.extras.body)) {
      engineOptions.extras.body.push(this._extraSubscription());
    } else if (engineOptions && engineOptions.extras) {
      engineOptions.extras.body = [ this._extraSubscription() ];
    } else {
      engineOptions.extras = {
        body: [ this._extraSubscription() ]
      };
    }
    this.engine = options.engine || new ReactRouterEngine({
      App,
      options: engineOptions
    });
    this.Logger = options.Logger || null;
    this.middlewares = [];
    this.modules = [];
    this.options = options;
    this.routes = [];

    // jsPerf
    this.routes.jsperfFind = jsperfFind;
  }

  /* eslint-disable no-param-reassign */
  /**
   * @locus Server
   * @memberof Router
   * @method _applyMiddleware
   * @instance
   * @param {object} context
   * @param {number} [index=0]
   */
  _applyMiddleware(context, index = 0) {
    const { req, res } = context;
    const originalNext = context.next;
    const middleware = this.middlewares[ index ];

    if (middleware) {
      this._verbose('verbose_middleware_found');

      runInFiber(() => {
        try {
          context.next = () => {
            context.next = originalNext;
            this._applyMiddleware(context, index + 1);
          };
          middleware.call(context, req, res, context.next);
        } catch (err) {
          this._debug('debug_middleware_callback_error', req.originalUrl, err);
          originalNext(err);
        }
      });
    } else {
      this._verbose('verbose_middleware_not_found');

      originalNext();
    }
  }
  /* eslint-enable */

  /* eslint-disable no-param-reassign */
  /**
   * @locus Server
   * @memberof Router
   * @method _applyRoute
   * @instance
   * @param {object} context
   * @param {object} route
   * @param {Route} route.current
   * @param {object} route.params
   * @param {number} [index=0]
   */
  _applyRoute(context, route, index = 0) {
    const { req, res } = context;
    const callback = route.current.getCallback(index);
    const originalNext = context.next;

    if (callback) {
      runInFiber(
        () => {
          try {
            context.next = () => {
              context.next = originalNext;
              this._applyRoute(context, route, index + 1);
            };
            callback.call(context, req, res, context.next);
          } catch (err) {
            this._debug(
              'debug_route_callback_error',
              route.current.getPath(),
              route.params,
              err
            );

            originalNext(err);
          }
        }
      );
    } else {
      originalNext();
    }
  }
  /* eslint-enable */

  /**
   * @locus Server
   * @memberof Router
   * @method _debug
   * @instance
   * @param {string} code
   * @param {...*} args
   */
  _debug(code, ...args) {
    this._log('debug', code, ...args);
  }

  /* eslint-disable no-param-reassign */
  /**
   * @locus Server
   * @memberof Router
   * @method _dispatch
   * @instance
   * @param {http.IncomingMessage} req
   * @param {http.ServerResponse} res
   * @param {function} next
   * @param {object} result
   * @param {Error=} result.err
   * @param {string=} result.body
   * @param {string=} result.head
   * @param {number} result.status
   * @param {string=} result.url
   */
  _dispatch(req, res, next, { body, err, head, status, url }) {
    res.statusCode = status;
    switch (res.statusCode) {
      case 200:
        req.dynamicHead = head;
        req.dynamicBody = body;
        next();
        break;

      case 302:
        res.redirect(302, url);
        break;

      case 404:
        res.statusMessage = 'Not found.';
        req.dynamicHead = head;
        req.dynamicBody = body;
        next();
        break;

      case 500:
        res.statusMessage = `Unexpected error: ${err.message}`;
        res.end(err.toString());
        break;

      default:
    }

    const error = (err) ? err.message : '';
    const type = (status === 500) ? 'error' : 'info';
    this._log(type, `${type}_response_sended`, status, error);
    this._verbose('verbose_response_sended', head, body);
    this._debug(
      `debug_response_sended${(err) ? '_error' : ''}`,
      req.originalUrl,
      status,
      err
    );
  }
  /* eslint-enable */

  /**
   * @locus Server
   * @memberof Router
   * @method _enableUniversalPublish
   * @instance
   * @param {SubscriptionContext} subContext
   */
  _enableUniversalPublish(subContext) {
    const callback = () => {
      const handlers = Meteor.default_server.universal_publish_handlers;

      if (handlers) {
        // jsperf
        handlers.jsperfForEach = jsperfForEach;

        handlers.jsperfForEach((item) => {
          // universal subs have subscription ID, params, and name undefined
          const subscription = new Subscription(subContext, item);
          subContext.performSubscription(subscription);
        });
      }
    };
    runInFiber(callback);
  }

  /**
   * @locus Server
   * @memberof Router
   * @method _error
   * @instance
   * @param {string} code
   * @param {...*} args
   */
  _error(code, ...args) {
    this._log('error', code, ...args);
  }

  /* eslint-disable no-underscore-dangle */
  /**
   * @locus Server
   * @memberof Router
   * @method _extraSubscription
   * @instance
   * @return {function}
   */
  _extraSubscription() {
    const self = this;

    return function extraSubscriptionBody() {
      const { res } = this;
      const subData = self.getContext().getData();

      if (res._headers && res._headers[ 'access-control-allow-origin' ]) {
        warning(
          false,
          `Server subscriptions turned off due to CORS headers.
          read more: http://goo.gl/eGwb4e`
        );
        return '';
      }
      return `<script>${stringifyPreloadedSubscriptions(subData)}</script>`;
    };
  }
  /* eslint-enable */

  /**
   * @locus Server
   * @memberof Router
   * @method _findRoute
   * @instance
   * @param {http.IncomingMessage} req
   * @return {object|null}
   */
  _findRoute(req) {
    const pathname = nodeUrl.parse(req.originalUrl).pathname;
    const { routes } = this;

    const params = {};

    let values;
    const find = (route) => {
      values = route.regex.exec(pathname);

      if (!values || (route.exact && !(values[ 0 ] === pathname))) {
        return false;
      }
      return true;
    };

    const currentRoute = routes.jsperfFind(find);

    if (currentRoute) {
      currentRoute.keys.jsperfForEach((key, i) => {
        params[ key.name ] = values[ i + 1 ];
      });

      this._info(
        'info_route_found',
        currentRoute.path,
        params
      );

      return {
        current: currentRoute,
        params
      };
    }

    this._verbose('verbose_route_not_found', req.originalUrl);

    return null;
  }

  /**
   * @locus Server
   * @memberof Router
   * @method _info
   * @instance
   * @param {string} code
   * @param {...*} args
   */
  _info(code, ...args) {
    this._log('info', code, ...args);
  }

  /**
   * @locus Server
   * @memberof Router
   * @method _log
   * @instance
   * @param {string} type
   * @param {string} code
   * @param {...*} args
   */
  _log(type, code, ...args) {
    if (this.Logger) {
      this.Logger.log(type, code, ...args);
    }
  }

  /**
   * @locus Server
   * @memberof Router
   * @method _profile
   * @instance
   * @param {string} name
   */
  _profile(name) {
    if (this.Logger) {
      this.Logger.profile(name);
    }
  }

  /**
   * @locus Server
   * @memberof Router
   * @method _verbose
   * @instance
   * @param {string} code
   * @param {...*} args
   */
  _verbose(code, ...args) {
    this._log('verbose', code, ...args);
  }

  /**
   * @locus Server
   * @memberof Router
   * @method _log
   * @instance
   * @param {string} code
   * @param {...*} args
   */
  _warn(code, ...args) {
    this._log('warn', code, ...args);
  }

    /**
   * @summary Callback call in `WebApp.connectHandlers`
   * @locus Server
   * @memberof Router
   * @method callback
   * @instance
   * @param {http.IncomingMessage} req
   * @param {http.ServerResponse} res
   * @param {function} next
   */
  callback(req, res, out) {
    this._info('info_received_request', req.originalUrl);
    this._verbose('verbose_received_request', req);
    this._profile('Responded in');

    const { engine } = this;
    const {
      headers,
      originalUrl
    } = req;

    const subContext = new SubscriptionContext({ headers });
    const context = new RouterContext(subContext);

    const logger = {
      debug: (code, ...args) => this._debug(code, ...args),
      error: (code, ...args) => this._error(code, ...args),
      info: (code, ...args) => this._info(code, ...args),
      log: (type, code, ...args) => this._log(type, code, ...args),
      profile: name => this._profile(name),
      verbose: (code, ...args) => this._verbose(code, ...args),
      warn: (code, ...args) => this._warn(code, ...args)
    };
    const middlewareContext = { logger, out, req, res };

    const route = this._findRoute(req);

    if (route) {
      middlewareContext.params = route.params;
    }

    const next = (callback = null) =>
      (err) => {
        if (err) {
          this._dispatch(req, res, out, { err, status: 500 });
        } else if (callback) {
          middlewareContext.next = next();
          callback.call(this, middlewareContext, route);
        } else if (isAppUrl(originalUrl)) {
          this._dispatch(req, res, out, engine.render(middlewareContext));
        } else {
          out();
        }
      };

    this.context.withValue(context, () => {
      // support for universal publications
      this._enableUniversalPublish(subContext);

      middlewareContext.next = (route) ? next(this._applyRoute) : next();
      this._applyMiddleware(middlewareContext);
    });

    this._profile('Responded in');
  }

  /**
   * @summary Return the router context
   * @locus Server
   * @memberof Router
   * @method getContext
   * @instance
   * @return {RouterContext}
   */
  getContext() {
    return this.context.get();
  }

  /**
   * @summary Adds a middleware
   * @locus Server
   * @memberof Router
   * @method middleware
   * @instance
   * @param {...function} callback
   */
  middleware(...callback) {
    assert(callback.length !== 0, 'You must provide a middleware');

    this.middlewares.push(...callback);
  }

  /* eslint-disable max-len */
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
   * @param {boolean} [options.routes=true]
   */
  /* eslint-enable */
  module(Module, options = {}) {
    assert(Module, 'You must provide a module');

    if (typeof Module !== 'function' && typeof Module !== 'object') {
      warning(false, `Router: ${Module} must be a function or an object`);
      return;
    }

    const mergedOptions = {
      engineOptions: true,
      middlewares: true,
      routes: true,
      ...options
    };
    const instance = (typeof Module === 'function') ?
      new Module(mergedOptions.config) : Module;

    let middlewares;
    let routes;

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

    if (instance.getRoutes && mergedOptions.routes) {
      routes = instance.getRoutes();

      if (routes) {
        if (Array.isArray(routes)) {
          // jsperf
          routes.jsperfForEach = jsperfForEach;

          routes.jsperfForEach((route) => {
            this.route(route.config, ...route.callback);
          });
        } else {
          this.route(routes.config, ...routes.callback);
        }
      }
    }

    this.modules.push(instance);
  }

  /**
   * @summary Adds a route
   * @locus Server
   * @memberof Router
   * @method route
   * @instance
   * @param {object} routeConfig
   * @param {boolean} [routeConfig.exact=false]
   * @param {string} routeConfig.path
   * @param {boolean} [routeConfig.strict=false]
   * @param {...function} callback
   */
  route(routeConfig, ...callback) {
    const { path } = routeConfig;

    warning(isAppUrl(path), `Router: ${path} is not an app url`);
    this.routes.push(new Route(routeConfig, callback));
  }
}
