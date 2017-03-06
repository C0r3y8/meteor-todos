/**
 * This module is based on `electrode-redux-router-engine` package
 * created by Team Electrode @WalmartLabs.
 *
 * Adding a support for Meteor and ReactRouter v4
 */
import assert from 'assert';
import React from 'react';
import ReactDOMServer from 'react-dom/server';
/* eslint-disable import/no-unresolved */
import { StaticRouter } from 'react-router';
/* eslint-enable */

import { jsperfForEach } from '../shared/utils/jsperf';

/** @class */
export default class ReactRouterEngine {
  /**
   * @constructs
   * @param {object} engine
   * @param {ReactElement} engine.App
   * @param {object} [engine.options={}]
   * @param {function} [engine.options.renderToString=this._renderToString]
   * @param {boolean} [engine.options.withIds=false]
   */
  constructor({ App, options = {} }) {
    assert(App, 'You must provide an app to render.');

    this.App = App;
    this.extras = {
      body: [],
      headers: []
    };
    if (options.extras) {
      if (options.extras.body && Array.isArray(options.extras.body)) {
        this.extras.body.push(...options.extras.body);
      }
      if (options.extras.headers && Array.isArray(options.extras.headers)) {
        this.extras.headers.push(...options.extras.headers);
      }
    }
    this.options = {
      renderToString: this._renderToString,
      withIds: false,
      ...options
    };

    // jsPerf
    this.extras.body.jsperfForEach = jsperfForEach;
    this.extras.headers.jsperfForEach = jsperfForEach;
  }

  /**
   * @locus Server
   * @memberof ReactRouterEngine
   * @method _generateExtras
   * @instance
   * @param {('body'|'headers')} type
   * @return {string}
   */
  _generateExtras(type, middlewareContext) {
    let extras = '';
    this.extras[ type ].jsperfForEach((generator) => {
      extras += generator.call(middlewareContext);
    });

    return extras;
  }

  /**
   * @locus Server
   * @memberof ReactRouterEngine
   * @method _renderToString
   * @instance
   * @param {object} config
   * @param {ReactElement} config.App
   * @param {object} config.middlewareContext
   * @param {function} config.renderMethod
   * @param {object} config.routerContext
   * @return {object}
   */
  _renderToString({ App, middlewareContext, renderMethod, routerContext }) {
    const { req } = middlewareContext;
    const router = (
      <StaticRouter location={req.url} context={routerContext}>
        <App />
      </StaticRouter>
    );

    return {
      html: renderMethod(router)
    };
  }

  /**
   * @summary Render react app
   * @locus Server
   * @memberof ReactRouterEngine
   * @method render
   * @instance
   * @param {object} middlewareContext
   * @return {object}
   */
  render(middlewareContext) {
    const {
      renderToStaticMarkup,
      renderToString
    } = ReactDOMServer;
    const { options: { withIds } } = this;
    const renderMethod = (withIds) ? renderToString : renderToStaticMarkup;
    const context = {};

    let body = '';
    let extraBody;
    let extraHeaders;
    let head = '';
    let result;

    try {
      result = this.options.renderToString({
        App: this.App,
        middlewareContext,
        renderMethod: Main =>
          `<div id="render-target">${renderMethod(Main)}</div>`,
        routerContext: context
      });

      extraBody = this._generateExtras('body', middlewareContext);
      extraHeaders = this._generateExtras('headers', middlewareContext);

      if (result.html) {
        body += result.html;
      }

      if (result.head) {
        head += result.head;
      }

      if (extraBody) {
        body += extraBody;
      }

      if (extraHeaders) {
        head += extraHeaders;
      }

      if (context.url) {
        return {
          status: 302,
          url: context.url
        };
      }
      return {
        body,
        head,
        status: (context.notFound) ? 404 : 200
      };
    } catch (err) {
      return {
        err,
        status: 500
      };
    }
  }

  /**
   * @summary Set options
   * @locus Server
   * @memberof ReactRouterEngine
   * @method setOptions
   * @instance
   * @param {object} options
   */
  setOptions(options) {
    assert(options, 'You must provide options');
    assert(typeof options === 'object', 'Param `options` must be an object');

    Object.assign(this.options, options);
    if (options.extras) {
      if (options.extras.body && Array.isArray(options.extras.body)) {
        this.extras.body.push(...options.extras.body);
      }
      if (options.extras.headers && Array.isArray(options.extras.headers)) {
        this.extras.headers.push(...options.extras.headers);
      }
    }
  }
}
