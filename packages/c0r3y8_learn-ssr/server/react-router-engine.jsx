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
        `window.__PRELOADED_STATE__ = ${EJSON.stringify(state)};`,
      renderToString: this._renderToString,
      withIds: false,
      ...options
    };
  }

  /**
   * @method createReduxStore
   * @param {http.IncomingMessage} req
   * @param {http.ServerResponse} res
   */
  createReduxStore(req, res) {
    const { options } = this;

    if (options.createReduxStore) {
      return options.createReduxStore(req, res);
    }
    return null;
  }

  /**
   * @method render
   * @param {http.IncomingMessage}
   * @param {object} store
   */
  render(req, store) {
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
   * @method _renderToString
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
      html,
      status: 200
    };
  }
}
