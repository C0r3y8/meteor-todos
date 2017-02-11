import Fiber from 'fibers';
/* eslint-disable import/no-unresolved */
import UrlPattern from 'url-pattern';
/* eslint-enable */

import { checkNpmVersions } from 'meteor/tmeasday:check-npm-versions';

import ReactRouterEngine from './react-router-engine';
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
  constructor({ App, engine = {}, options = {} }) {
    this.engine = new ReactRouterEngine({
      App,
      options: engine
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
   * @method _applyMiddlewares
   * @param {http.IncomingMessage} req
   * @param {http.ServerResponse} res
   * @param {function} next
   * @param {object} store
   */
  _applyMiddlewares(req, res, next, store) {
    const self = this;

    this.middlewares.jsperfForEach((middleware) => {
      runInFiber(() => middleware.call(self, req, res, next, store));
    });
  }

  /**
   * @method applyRoutes
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
    const self = this;

    let params;
    const find = route => !!(params = route.pattern.match(originalUrl));

    const currentRoute = exact.jsperfFind(find) || pattern.jsperfFind(find);

    if (currentRoute) {
      runInFiber(
        () => currentRoute.callback.call(self, params, req, res, next, store)
      );
    } else {
      next();
    }
  }

  /**
   * @method callback
   * @param {http.IncomingMessage} req
   * @param {http.ServerResponse} res
   * @param {function} next
   */
  callback(req, res, next) {
    const { engine } = this;
    const store = engine.createReduxStore(req, res);

    if (store) {
      checkNpmVersions({
        'react-redux': '5.x'
      }, 'c0r3y8:electrolysis');
    }

    this._applyMiddlewares(req, res, next, store);
    this._applyRoutes(req, res, next, store);
    this._dispatch(req, res, next, engine.render(req, store));
  }

    /**
   * @method _dispatch
   * @param {http.IncomingMessage} req
   * @param {http.ServerResponse} res
   * @param {function} next
   * @param {object} result
   */
  /* eslint-disable no-param-reassign */
  _dispatch(req, res, next, result) {
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
      body += `<div id="react">${result.html}</div>`;
    }

    if (result.prefetch) {
      body += `<script>${result.prefetch}</script>`;
    }

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
   * @method middleware
   * @param {function} callback
   */
  middleware(callback) {
    this.middlewares.push(callback);
  }

  /**
   * @method route
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
