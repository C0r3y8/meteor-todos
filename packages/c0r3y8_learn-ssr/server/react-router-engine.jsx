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

import { encodeData } from '../shared/utils/tools';

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
      stringifyPreloadedState: state =>
        `window.__PRELOADED_STATE__ = '${encodeData(state)}';`,
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
    try {
      return this._renderToString(middlewareContext);
    } catch (err) {
      return {
        err,
        message: err.message,
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
   */
  _renderToString(middlewareContext) {
    const {
      renderToStaticMarkup,
      renderToString
    } = ReactDOMServer;
    const {
      App,
      options: { withIds }
    } = this;
    const context = {};
    const renderMethod = (withIds) ? renderToString : renderToStaticMarkup;

    const router = (
      <StaticRouter location={middlewareContext.req.url} context={context}>
        <App />
      </StaticRouter>
    );

    const html = renderMethod(router);

    if (context.url) {
      return {
        status: 302,
        url: context.url
      };
    }
    return {
      html: `<div id="render-target">${html}</div>`,
      status: (context.notFound) ? 404 : 200
    };
  }
}
