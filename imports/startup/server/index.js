import {
  CacheModule,
  defaultBuildKey,
  enableCache
} from 'meteor/c0r3y8:octopus-cache';
import { reduxPageSetName } from '../../actions/redux-page-actions';
import Tasks from '../../api/tasks';

import './register-api';
import { app } from '../shared/index';

app.module(CacheModule, {
  config: {
    collections: [ {
      callback(type) {
        const key = defaultBuildKey('GET', '/', {});
        const entries = this.del(key);

        if (entries > 0) {
          /* eslint-disable no-underscore-dangle */
          app._info('info_cache_del', type, key);
          /* eslint-enable */
        }
      },
      cursor: Tasks.find({})
    } ]
  }
});

/* eslint-disable no-unused-vars, prefer-arrow-callback */
app.route({
  exact: true,
  path: '/'
}, enableCache());

app.route({
  path: '/redux'
}, enableCache(), function reduxPageMiddleware(req, res, next) {
  if (req.query.name) {
    this.store.dispatch(reduxPageSetName(req.query.name));
  }
  next();
});
/* eslint-enable */
