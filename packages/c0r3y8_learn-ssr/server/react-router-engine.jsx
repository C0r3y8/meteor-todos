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
    this.options = {
      renderToString: this._renderToString,
      withIds: false,
      ...options
    };
  }

  /**
   * @summary Render react app
   * @locus Server
   * @memberof ReactRouterEngine
   * @method render
   * @instance
   * @param {object} middlewareContext
   */
  render(middlewareContext) {
    const {
      renderToStaticMarkup,
      renderToString
    } = ReactDOMServer;
    const {
      App,
      options: { withIds }
    } = this;
    const renderMethod = (withIds) ? renderToString : renderToStaticMarkup;
    const context = {};

    let result;
    try {
      result = this.options.renderToString({
        App,
        middlewareContext,
        renderMethod,
        routerContext: context
      });

      if (context.url) {
        return {
          status: 302,
          url: context.url
        };
      }
      return {
        head: result.head,
        html: `<div id="render-target">${result.html}</div>`,
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
   * @locus Server
   * @memberof ReactRouterEngine
   * @method _renderToString
   * @instance
   * @param {object} middlewareContext
   * @param {function} renderMethod
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
}
