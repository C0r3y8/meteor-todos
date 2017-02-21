/* eslint-disable import/no-unresolved */
import util from 'util';
import warning from 'warning';
import winston from 'winston';
/* eslint-enable */

/** @class */
class Logger {
  /**
   * @constructor
   * @param {object} code
   * @param {object=} config
   * @param {object=} handlers
   * @param {object} [CustomLogger=winston.Logger]
   */
  constructor({ codes, config = {
    level: 'info',
    transports: [ new (winston.transports.Console)() ]
  }, handlers = {}, CustomLogger = (winston.Logger) }) {
    this.codes = codes || {};
    this.handlers = {
      debug: this._defaultDebugHandler,
      error: this._defaultErrorHandler,
      info: this._defaultInfoHandler,
      warn: this._defaultWarnHandler,
      ...handlers
    };
    this.logger = new (CustomLogger)(config);
    // by default winston provide Profiling
    // but for user that don't need winston add minimalist profiling system
    this.profiles = {};
  }

  /**
   * @locus Server
   * @memberof Logger
   * @method _applyTemplate
   * @instance
   * @param {string} code
   * @param {function} callback
   * @param {...*} args
   */
  _applyTemplate(code, callback, ...args) {
    const exist = !!this.codes[ code ];
    const regex = /%[sjd%]{1}/g;
    const template = this.codes[ code ];

    let length;

    warning(exist, `Logger: template for ${code} doesn't exist`);
    if (exist) {
      length = template.match(regex).length;
      callback.call(
        this,
        util.format(template, ...args.slice(0, length)),
        ...args.slice(length)
      );
    }
  }

  /**
   * @locus Server
   * @memberof Logger
   * @method _defaultDebugHandler
   * @instance
   * @param {string} message - formatted message
   * @param {...*} args - meta parameters
   */
  _defaultDebugHandler(message, ...args) {
    this.logger.log('debug', message, ...args);
  }

  /**
   * @locus Server
   * @memberof Logger
   * @method _defaultErrorHandler
   * @instance
   * @param {string} message - formatted message
   * @param {...*} args - meta parameters
   */
  _defaultErrorHandler(message, ...args) {
    this.logger.log('error', message, ...args);
  }

  /**
   * @locus Server
   * @memberof Logger
   * @method _defaultInfoHandler
   * @instance
   * @param {string} message - formatted message
   * @param {...*} args - meta parameters
   */
  _defaultInfoHandler(message, ...args) {
    this.logger.log('info', message, ...args);
  }

  /**
   * @locus Server
   * @memberof Logger
   * @method _defaultWarnHandler
   * @instance
   * @param {string} message - formatted message
   * @param {...*} args - meta parameters
   */
  _defaultWarnHandler(message, ...args) {
    this.logger.log('warn', message, ...args);
  }

  /**
   * @summary Call correct handler and apply custom template
   * @locus Server
   * @memberof Logger
   * @method log
   * @instance
   * @param {string} type
   * @param {string} code
   * @param {...*} args - rest parameters passed to handler
   */
  log(type, code, ...args) {
    const exist = !!this.handlers[ type ];

    warning(exist, `Logger: ${type} is not specified in handlers`);
    if (exist) {
      this._applyTemplate(code, this.handlers[ type ], ...args);
    }
  }

  /**
   * @summary Starts / Finishes `name` profile
   * @locus Server
   * @memberof Logger
   * @method profile
   * @instance
   * @param {string} name
   */
  profile(name) {
    const {
      handlers,
      profiles
    } = this;
    const exist = !!handlers.profile;

    if (this.logger instanceof winston.Logger) {
      this.logger.profile(name);
      return;
    }

    warning(exist, 'Logger: profile is not specified in handlers');
    if (!profiles[ name ]) {
      profiles[ name ] = Date.now();
    } else if (exist) {
      handlers.profile.call(this, name, Date.now() - profiles[ name ]);
      delete profiles[ name ];
    }
  }
}

/* eslint-disable import/prefer-default-export */
export {
  Logger
};
/* eslint-enable */
