import { Meteor } from 'meteor/meteor';

import ReactRouterEngine from './react-router-engine';

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
  constructor({ App, engine = {}, options = {} }) {
    this.engine = new ReactRouterEngine({
      App,
      options: engine
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
   * @summary Start rendering app
   * @locus Client
   * @memberof Router
   * @method render
   * @instance
   */
  render() {
    Meteor.startup(() => {
      const {
        _initStore,
        engine
      } = this;
      const store = _initStore();

      engine.render(store);
    });
  }
}
