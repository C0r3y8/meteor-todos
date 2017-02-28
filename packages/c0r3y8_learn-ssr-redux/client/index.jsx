import { Provider } from 'react-redux';
import React from 'react';
import ReactDom from 'react-dom';
import { createStore } from 'redux';

import { decodeData } from 'meteor/c0r3y8:learn-ssr';

/* eslint-disable import/prefer-default-export, no-underscore-dangle */
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

export const reduxEngineRender = () =>
  function engineRenderToString({
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
  };
/* eslint-enable */
