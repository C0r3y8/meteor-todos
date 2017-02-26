import assert from 'assert';
import Fiber from 'fibers';
/* eslint-disable import/no-unresolved */
import UrlPattern from 'url-pattern';
import warning from 'warning';
/* eslint-enable */

import { Meteor } from 'meteor/meteor';

import ReactRouterEngine from './react-router-engine';
import RouterContext from './router-context';
import Subscription from './support/pubsub/subscription';
/* eslint-disable max-len */
import SubscriptionContext from './support/pubsub/subscription-context';
/* eslint-enable */
import { encodeData } from '../shared/utils/tools';
import {
  jsperfFind,
  jsperfForEach
} from '../shared/utils/jsperf';
import { isAppUrl } from '../shared/utils/urls';

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
   * @param {object=} router.options
   * @param {object=} router.options.engine
   */
  constructor({ App, options = {} }) {
    assert(App, 'You must provide an app to render.');

    this.context = new Meteor.EnvironmentVariable();
    this.engine = new ReactRouterEngine({
      App,
      options: options.engine
    });
    this.Logger = options.Logger || null;
    this.middlewares = [];
    this.options = options;
    this.routes = {
      exact: [],
      pattern: []
    };

    // jsPerf
    this.routes.exact.jsperfFind = jsperfFind;
    this.routes.pattern.jsperfFind = jsperfFind;
  }

  /* eslint-disable no-param-reassign */
  /**
   * @locus Server
   * @memberof Router
   * @method _applyMiddlewares
   * @instance
   * @param {object} context
   */
  _applyMiddlewares(context, index = 0) {
    const { req, res } = context;
    const originalNext = context.next;
    const middleware = this.middleware[ index ];

    if (middleware) {
      this._verbose('verbose_middleware_found');

      runInFiber(() => {
        try {
          context.next = () => {
            context.next = originalNext;
            this._applyMiddlewares(context, index + 1);
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
   * @method _applyRoutes
   * @instance
   * @param {object} context
   */
  _applyRoutes(context) {
    const { next, req, res } = context;
    const { originalUrl } = req;
    const {
      routes: {
        exact,
        pattern
      }
    } = this;

    let params;
    const find = route => !!(params = route.pattern.match(originalUrl));

    const currentRoute = exact.jsperfFind(find) || pattern.jsperfFind(find);

    if (currentRoute) {
      this._info(
        'info_route_found',
        currentRoute.path,
        params
      );

      runInFiber(
        () => {
          try {
            context.params = params;
            currentRoute.callback.call(context, req, res, next);
          } catch (err) {
            this._debug(
              'debug_route_callback_error',
              currentRoute.path,
              params,
              err
            );

            next(err);
          }
        }
      );
    } else {
      this._verbose('verbose_route_not_found', req.originalUrl);

      next();
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
   */
  _dispatch(req, res, next, result) {
    const subData = this.getContext().getData();

    let head = '';
    let body = '';
    let keys;

    if (result.head) {
      keys = Object.keys(result.head);
      // jsperf
      keys.jsperfForEach = jsperfForEach;

      keys.jsperfForEach((i) => {
        head += result.head[ i ].toString();
      });
    }

    if (result.html) {
      body += result.html;
    }

    if (result.prefetch) {
      body += `<script>${result.prefetch}</script>`;
    }

    body += `<script>${stringifyPreloadedSubscriptions(subData)}</script>`;

    res.statusCode = result.status;
    switch (res.statusCode) {
      case 200:
        req.dynamicHead = head;
        req.dynamicBody = body;
        next();
        break;

      case 302:
        res.redirect(302, result.url);
        break;

      case 404:
        res.statusMessage = 'Not found.';
        req.dynamicHead = head;
        req.dynamicBody = body;
        next();
        break;

      case 500:
        res.statusMessage = `Unexpected error: ${result.message}`;
        res.end(result.err.toString());
        break;

      default:
    }

    const error = (result.err) ? result.err.message : '';
    const type = (result.status === 500) ? 'error' : 'info';
    this._log(type, `${type}_response_sended`, result.status, error);
    this._verbose('verbose_response_sended', head, body);
    this._debug(
      `debug_response_sended${(result.err) ? '_error' : ''}`,
      req.originalUrl,
      result.status,
      result.err
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

    const middlewareContext = { req, res };

    const next = (callback = null) =>
      (err) => {
        if (err) {
          this._dispatch(req, res, out, { err, status: 500 });
        } else if (callback) {
          middlewareContext.next = next();
          callback.call(this, middlewareContext);
        } else if (isAppUrl(originalUrl)) {
          this._dispatch(req, res, out, engine.render(middlewareContext));
        } else {
          out();
        }
      };

    this.context.withValue(context, () => {
      // support for universal publications
      this._enableUniversalPublish(subContext);

      // need test
      middlewareContext.next = next(this._applyRoutes);
      this._applyMiddlewares(middlewareContext);
    });

    this._profile('Responded in');
  }

  /**
   * @summary Return the router context
   * @locus Server
   * @memberof Router
   * @method getContext
   * @instance
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
   * @param {function} callback
   */
  middleware(callback) {
    this.middlewares.push(callback);
  }

  /**
   * @summary Adds a route
   * @locus Server
   * @memberof Router
   * @method route
   * @instance
   * @param {object} routeConfig
   * @param {string} routeConfig.path
   * @param {boolean=} routeConfig.exact
   * @param {function} callback - callback(params, req, res, next)
   */
  route({
    exact = false,
    path
  }, callback) {
    const pattern = new UrlPattern(path);

    const route = {
      callback,
      path,
      pattern
    };

    warning(isAppUrl(path), `Router: ${path} is not an app url`);
    if (exact) {
      this.routes.exact.push(route);
    } else {
      this.routes.pattern.push(route);
    }
  }
}
