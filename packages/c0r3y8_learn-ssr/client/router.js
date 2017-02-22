import { Meteor } from 'meteor/meteor';

import ReactRouterEngine from './react-router-engine';
import RouterContext from './router-context';

import { decodeData } from '../shared/utils/tools';

/* eslint-disable no-underscore-dangle */
const parsePreloadedSubscriptions = () => {
  if (window.__PRELOADED_SUBSCRIPTIONS__) {
    return decodeData(window.__PRELOADED_SUBSCRIPTIONS__);
  }
  return null;
};
/* eslint-enable */

/** @class */
export default class Router {
  /**
   * @constructs
   * @param {object} router
   * @param {ReactElement} router.App
   * @param {object=} router.engine
   * @param {function=} router.engine.createReduxStore
   * @param {object=} router.options
   */
  constructor({ App, options = {} }) {
    this.context = new RouterContext();
    this.engine = new ReactRouterEngine({
      App,
      options: options.engine
    });
    this.options = options;
  }

  /**
   * @locus Client
   * @memberof Router
   * @method _initState
   * @instance
   */
  _initStore() {
    return this.engine.createReduxStore();
  }

  /**
   * @summary Returns router context
   * @locus Client
   * @memberof Router
   * @method getContext
   * @instance
   */
  getContext() {
    return this.context;
  }

  /**
   * @summary Start rendering app
   * @locus Client
   * @memberof Router
   * @method render
   * @instance
   */
  render() {
    Meteor.startup(() => {
      const store = this._initStore();

      this.context.init(parsePreloadedSubscriptions());

      this.engine.render(store);
    });
  }
}