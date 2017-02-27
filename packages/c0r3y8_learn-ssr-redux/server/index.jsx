import React from 'react';
import { Provider } from 'react-redux';
import { StaticRouter } from 'react-router';
import { createStore } from 'redux';

import { encodeData } from 'meteor/c0r3y8:learn-ssr';

/* eslint-disable import/prefer-default-export */
export const reduxCreateStoreMiddleware = (...args) =>
  function createStoreMiddleware() {
    this.store = createStore(...args);
    this.next();
  };

export const reduxEngineRender = (options = {
  stringifyPreloadedState: state =>
    `window.__PRELOADED_STATE__ = '${encodeData(state)}';`,
}) =>
  function engineRenderToString({
    App,
    middlewareContext,
    renderMethod,
    routerContext
  }) {
    const { req, store } = middlewareContext;
    const { stringifyPreloadedState } = options;
    const router = (
      <Provider store={store}>
        <StaticRouter location={req.url} context={routerContext}>
          <App />
        </StaticRouter>
      </Provider>
    );
    let html = renderMethod(router);

    html += `<script>${stringifyPreloadedState(store.getState())}</script>`;

    return { html };
  };
/* eslint-enable */
