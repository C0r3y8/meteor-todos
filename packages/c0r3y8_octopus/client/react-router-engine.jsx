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
import { BrowserRouter } from 'react-router-dom';
/* eslint-enable */

/** @class */
export default class ReactRouterEngine {
  /**
   * @constructs
   * @param {object} engine
   * @param {ReactElement} engine.App
   * @param {object} [engine.options={}]
   * @param {function} [engine.options.renderToString=this._renderToString]
   * @param {ReactElement} [engine.options.Router=BrowserRouter]
   * @param {object} [engine.options.routerOptions={}]
   */
   /* eslint-disable no-underscore-dangle */
  constructor({ App, options = {} }) {
    assert(App, 'You must an app to render.');

    this.App = App;
    this.options = {
      renderToString: this._renderToString,
      Router: BrowserRouter,
      routerOptions: {},
      ...options
    };
  }
  /* eslint-enable */

  /**
   * @locus Client
   * @memberof ReactRouterEngine
   * @method _renderToString
   * @instance
   * @param {object} config
   * @param {ReactElement} config.App
   * @param {object} config.middlewareContext
   * @param {ReactElement} config.Router
   * @param {routerOptions} config.routerOptions
   */
  _renderToString({ App, Router, routerOptions }) {
    const router = (
      <Router {...routerOptions}>
        <App />
      </Router>
    );

    ReactDom.render(router, document.getElementById('render-target'));
  }

  /**
   * @summary
   * @locus Client
   * @memberof ReactRouterEngine
   * @method render
   * @instance
   * @param {object} middlewareContext
   */
  render(middlewareContext) {
    const {
      App,
      options: {
        renderToString,
        Router,
        routerOptions
      }
    } = this;

    renderToString({ App, middlewareContext, Router, routerOptions });
  }

  /**
   * @summary Set options
   * @locus Client
   * @memberof ReactRouterEngine
   * @method setOptions
   * @instance
   * @param {object} options
   */
  setOptions(options) {
    assert(options, 'You must provide options');
    assert(typeof options === 'object', 'Param `options` must be an object');

    Object.assign(this.options, options);
  }
}
