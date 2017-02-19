import Fiber from 'fibers';
/* eslint-disable import/no-unresolved */
import UrlPattern from 'url-pattern';
/* eslint-enable */

import { checkNpmVersions } from 'meteor/tmeasday:check-npm-versions';
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
   * @param {object=} router.engine
   * @param {function=} router.engine.createReduxStore
   * @param {object=} router.options
   */
  constructor({ App, options = {} }) {
    this.context = new Meteor.EnvironmentVariable();
    this.engine = new ReactRouterEngine({
      App,
      options: options.engine
    });
    this.middlewares = [];
    this.options = options;
    this.routes = {
      exact: [],
      pattern: []
    };

    // jsPerf
    this.middlewares.jsperfForEach = jsperfForEach;
    this.routes.exact.jsperfFind = jsperfFind;
    this.routes.pattern.jsperfFind = jsperfFind;
  }

  /**
   * @locus Server
   * @memberof Router
   * @method _applyMiddlewares
   * @instance
   * @param {http.IncomingMessage} req
   * @param {http.ServerResponse} res
   * @param {function} next
   * @param {object} store
   */
  _applyMiddlewares(req, res, next, store) {
    this.middlewares.jsperfForEach((middleware) => {
      runInFiber(() => middleware.call(this, req, res, next, store));
    });
  }

  /**
   * @locus Server
   * @memberof Router
   * @method applyRoutes
   * @instance
   * @param {http.IncomingMessage} req
   * @param {http.ServerResponse} res
   * @param {function} next
   * @param {object} store
   */
  _applyRoutes(req, res, next, store) {
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
      runInFiber(
        () => currentRoute.callback.call(this, params, req, res, next, store)
      );
    } else {
      next();
    }
  }

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
  /* eslint-disable no-param-reassign */
  _dispatch(req, res, next, result) {
    const subData = this.context.get().getData();

    let head = '';
    let body = '';
    let i;
    let keys;

    if (result.head) {
      keys = Object.keys(result.head);
      for (i = 0; i < keys.length; i++) {
        head += result.head[ keys[ i ] ].toString();
      }
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
   * @summary Callback call in `WebApp.connectHandlers`
   * @locus Server
   * @memberof Router
   * @method callback
   * @instance
   * @param {http.IncomingMessage} req
   * @param {http.ServerResponse} res
   * @param {function} next
   */
  callback(req, res, next) {
    const { engine } = this;
    const { headers } = req;

    const subContext = new SubscriptionContext({ headers });

    const context = new RouterContext(subContext);

    const store = engine.createReduxStore();

    if (store) {
      checkNpmVersions({
        'react-redux': '5.x'
      }, 'c0r3y8:learn-ssr');
    }

    this.context.withValue(context, () => {
      // support for universal publications
      this._enableUniversalPublish(subContext);

      // need test
      this._applyMiddlewares(req, res, next, store);
      this._applyRoutes(req, res, next, store);
      this._dispatch(req, res, next, engine.render(req, store));
    });
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
   * @param {function} callback - callback(params, req, res, next, store)
   */
  route({
    exact = false,
    path
  }, callback) {
    const pattern = new UrlPattern(path);

    const route = {
      callback,
      pattern
    };

    if (exact) {
      this.routes.exact.push(route);
    } else {
      this.routes.pattern.push(route);
    }
  }
}
