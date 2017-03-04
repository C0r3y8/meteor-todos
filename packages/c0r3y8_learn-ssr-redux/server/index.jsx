import React from 'react';
import { Provider } from 'react-redux';
import { StaticRouter } from 'react-router';
import { createStore } from 'redux';

import { encodeData } from 'meteor/c0r3y8:learn-ssr';

export const reduxCreateStoreMiddleware = (reducer, preloadedState, enhancer) =>
  function createStoreMiddleware() {
    this.store = createStore(reducer, preloadedState, enhancer);
    this.next();
  };

export function reduxEngineRender({
  App,
  middlewareContext,
  renderMethod,
  routerContext
}) {
  const { req, store } = middlewareContext;
  const router = (
    <Provider store={store}>
      <StaticRouter location={req.url} context={routerContext}>
        <App />
      </StaticRouter>
    </Provider>
  );
  return { html: renderMethod(router) };
}

export const reduxGenerateExtras = (options = {
  stringifyPreloadedState: state =>
    `window.__PRELOADED_STATE__ = '${encodeData(state)}';`,
}) =>
  function reduxStringifyPreloadedState() {
    const { store } = this;
    const { stringifyPreloadedState } = options;

    return `<script>${stringifyPreloadedState(store.getState())}</script>`;
  };


/** @class */
export class ReduxModule {
  /**
   * @constructor
   * @param {object} [config={}]
   * @param {function} enhancer
   * @param {object} [options={}]
   * @param {*} preloadedState
   * @param {function} reducer
   */
  constructor({ enhancer, options = {}, preloadedState, reducer } = {}) {
    this.options = {
      stringifyPreloadedState: state =>
        `window.__PRELOADED_STATE__ = '${encodeData(state)}';`,
      ...options
    };
    this.enhancer = enhancer;
    this.preloadedState = preloadedState;
    this.reducer = reducer;
  }

  /**
   * @summary Returns engine options
   * @locus Server
   * @memberof ReduxModule
   * @method getEngineOptions
   * @instance
   * @return {object}
   */
  getEngineOptions() {
    return {
      renderToString: reduxEngineRender
    };
  }

  /**
   * @summary Returns extras
   * @locus Server
   * @memberof ReduxModule
   * @method getExtras
   * @instance
   * @param {('body'|'headers')} type
   * @return {function|null}
   */
  getExtras(type) {
    if (type === 'body') {
      return reduxGenerateExtras({
        stringifyPreloadedState: this.options.stringifyPreloadedState
      });
    }
    return null;
  }

  /**
   * @summary Returns middlewares
   * @locus Server
   * @memberof ReduxModule
   * @method getMiddlewares
   * @instance
   * @return {function}
   */
  getMiddlewares() {
    const { enhancer, preloadedState, reducer } = this;
    return reduxCreateStoreMiddleware(reducer, preloadedState, enhancer);
  }
}
