import { Provider } from 'react-redux';
import React from 'react';
import ReactDom from 'react-dom';
import { createStore } from 'redux';

import { decodeData } from 'meteor/c0r3y8:learn-ssr';

/* eslint-disable no-underscore-dangle */
export const reduxCreateStoreMiddleware = (
  reducer,
  preloadedState,
  enhancer,
  options = {
    parsePreloadedState: () => {
      if (window.__PRELOADED_STATE__) {
        return decodeData(window.__PRELOADED_STATE__);
      }
      return undefined;
    }
  }
) =>
  function createStoreMiddleware() {
    const { mergePreloadedState, parsePreloadedState } = options;
    let initialState = parsePreloadedState();

    if (preloadedState) {
      initialState = mergePreloadedState(preloadedState, initialState);
    }
    this.store = createStore(reducer, initialState, enhancer);
  };

export function reduxEngineRender({
  App,
  middlewareContext,
  Router,
  routerOptions
}) {
  const router = (
    <Provider store={middlewareContext.store}>
      <Router {...routerOptions}>
        <App />
      </Router>
    </Provider>
  );

  ReactDom.render(router, document.getElementById('render-target'));
}

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
      parsePreloadedState: () => {
        if (window.__PRELOADED_STATE__) {
          return decodeData(window.__PRELOADED_STATE__);
        }
        return undefined;
      },
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
   * @summary Returns middlewares
   * @locus Server
   * @memberof ReduxModule
   * @method getMiddlewares
   * @instance
   * @return {function}
   */
  getMiddlewares() {
    const { enhancer, options, preloadedState, reducer } = this;
    return reduxCreateStoreMiddleware(
      reducer,
      preloadedState,
      enhancer,
      options
    );
  }
}
/* eslint-enable */
