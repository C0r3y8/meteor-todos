/**
 * This module is based on `electrode-redux-router-engine` package
 * created by Team Electrode @WalmartLabs.
 *
 * Adding a support for Meteor and ReactRouter v4
 */
import assert from 'assert';
import React from 'react';
import ReactDom from 'react-dom';
/* eslint-disable import/no-unresolved */
import Provider from 'react-redux';
import { BrowserRouter } from 'react-router';
/* eslint-enable */

import { decodeData } from '../shared/utils/encode';

/** @class */
export default class ReactRouterEngine {
  /**
   * @constructs
   * @param {object} engine
   * @param {ReactElement} engine.App
   * @param {object=} engine.options
   * @param {function=} engine.options.createReduxStore
   */
   /* eslint-disable no-underscore-dangle */
  constructor({ App, options = {} }) {
    assert(App, 'You must an app to render.');

    this.App = App;
    this.options = {
      parsePreloadedState: () => decodeData(window.__PRELOADED_STATE__),
      Router: options.Router || BrowserRouter,
      routerOptions: options.routerOptions || {},
      ...options
    };
  }
  /* eslint-enable */

  /**
   * @summary Create redux store if `options.createReduxStore` is specified
   * @locus Anywhere
   * @memberof ReactRouterEngine
   * @method createReduxStore
   * @instance
   */
  createReduxStore() {
    const {
      options: {
       createReduxStore,
       parsePreloadedState
      }
    } = this;

    if (createReduxStore) {
      return createReduxStore(parsePreloadedState());
    }
    return null;
  }

  /**
   * @summary
   * @locus Client
   * @memberof ReactRouterEngine
   * @method render
   * @instance
   * @param {object=} store
   */
  render(store = null) {
    const {
      options: {
        Router,
        routerOptions
      }
    } = this;

    const router = (
      <Router {...routerOptions}>
        <App />
      </Router>
    );

    ReactDom.render((store) ?
      <Provider store={store}>
        {router}
      </Provider>
    : router, document.getElementById('react'));
  }
}
