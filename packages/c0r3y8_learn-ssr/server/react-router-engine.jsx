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
import Helmet from 'react-helmet';
import Provider from 'react-redux';
import { StaticRouter } from 'react-router';
/* eslint-enable */

import { encodeData } from '../shared/utils/tools';

/** @class */
export default class ReactRouterEngine {
  /**
   * @constructs
   * @param {object} engine
   * @param {ReactElement} engine.App
   * @param {object=} engine.options
   * @param {function=} engine.options.createReduxStore
   */
  constructor({ App, options = {} }) {
    assert(App, 'You must an app to render.');

    this.App = App;
    this.options = {
      stringifyPreloadedState: state =>
        `window.__PRELOADED_STATE__ = '${encodeData(state)}';`,
      renderToString: this._renderToString,
      routerOptions: options.routerOptions || {},
      withIds: false,
      ...options
    };
  }

  /**
   * @summary Create redux store if `options.createReduxStore` is specified
   * @locus Anywhere
   * @memberof ReactRouterEngine
   * @method createReduxStore
   * @instance
   */
  createReduxStore() {
    const { options } = this;

    if (options.createReduxStore) {
      return options.createReduxStore();
    }
    return null;
  }

  /**
   * @summary Render react app
   * @locus Server
   * @memberof ReactRouterEngine
   * @method render
   * @instance
   * @param {http.IncomingMessage}
   * @param {object=} store
   */
  render(req, store = null) {
    try {
      const answer = this._renderToString(req, store);

      return (store) ? {
        prefetch: this.stringifyPreloadedState(store.getState()),
        ...answer
      } : answer;
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
   * @param {http.IncomingMessage}
   * @param {object} store
   */
  _renderToString(req, store) {
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
      <StaticRouter location={req.url} context={context}>
        <App />
      </StaticRouter>
    );

    const html = renderMethod((store) ?
      <Provider store={store}>
        {router}
      </Provider>
    : router);

    const head = Helmet.rewind();

    if (context.url) {
      return {
        status: 302,
        url: context.url
      };
    }
    return {
      head,
      html: `<div id="render-target">${html}</div>`,
      status: (context.notFound) ? 404 : 200
    };
  }
}
