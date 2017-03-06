/* eslint-disable import/no-unresolved */
import util from 'util';
import warning from 'warning';
import winston from 'winston';
/* eslint-enable */

import defaultCodes from './codes';

/** @class */
class Logger {
  /* eslint-disable max-len */
  /**
   * @constructor
   * @param {object} options
   * @param {object} [options.codes=defaultCodes]
   * @param {object} [options.config={}]
   * @param {string} [options.config.level='info']
   * @param {array} [options.config.transports=[ new (winston.transports.Console)() ]]
   * @param {object} [options.CustomLogger=winston.Logger]
   * @param {object} [options.handlers={}]
   * @param {string} [options.level='info']
   */
  /* eslint-enable */
  constructor({ codes = defaultCodes, config = {
    level: 'info',
    transports: [ new (winston.transports.Console)() ]
  }, CustomLogger = (winston.Logger), handlers = {}, level = 'info' } = {}) {
    this.codes = codes || {};
    this.config = config;
    this.handlers = {
      debug: this._defaultDebugHandler,
      error: this._defaultErrorHandler,
      info: this._defaultInfoHandler,
      verbose: this._defaultVerboseHandler,
      warn: this._defaultWarnHandler,
      ...handlers
    };
    // by default winston provides a Level system
    // but for user that don't need winston we add a minimalist level system
    if (winston.Logger === CustomLogger && this.config.level) {
      this.config.level = level;
    } else {
      this.level = level;
    }
    this.levels = { error: 0, warn: 1, info: 2, verbose: 3, debug: 4 };

    this.logger = new (CustomLogger)(this.config);

    // by default winston provides a Profiling system
    // but for user that don't need winston we add a minimalist profiling system
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
    let match;

    warning(exist, `Logger: template for ${code} doesn't exist`);
    if (exist) {
      match = template.match(regex);
      length = (match) ? match.length : 0;
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
   * @method _defaultVerboseHandler
   * @instance
   * @param {string} message - formatted message
   * @param {...*} args - meta parameters
   */
  _defaultVerboseHandler(message, ...args) {
    this.logger.log('verbose', message, ...args);
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
   * @summary Same as `log` method but type is set to `debug`
   * @locus Server
   * @memberof Logger
   * @method debug
   * @instance
   */
  debug(code, ...args) {
    this.log('debug', code, ...args);
  }

  /**
   * @summary Same as `log` but type is set to `error`
   * @locus Server
   * @memberof Logger
   * @method error
   * @instance
   */
  error(code, ...args) {
    this.log('error', code, ...args);
  }

  /**
   * @summary Same as `log` but type is set to `info`
   * @locus Server
   * @memberof Logger
   * @method info
   * @instance
   */
  info(code, ...args) {
    this.log('info', code, ...args);
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
    const canLog = (this.logger instanceof winston.Logger)
      || this.levels[ type ] <= this.levels[ this.level ];

    warning(exist, `Logger: ${type} is not specified in handlers`);
    if (exist && canLog) {
      this._applyTemplate(code, this.handlers[ type ], ...args);
    }
  }

  /**
   * @summary Same as `log` but type is set to `verbose`
   * @locus Server
   * @memberof Logger
   * @method verbose
   * @instance
   */
  verbose(code, ...args) {
    this.log('verbose', code, ...args);
  }

  /**
   * @summary Same as `log` but type is set to `warn`
   * @locus Server
   * @memberof Logger
   * @method warn
   * @instance
   */
  warn(code, ...args) {
    this.log('warn', code, ...args);
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
