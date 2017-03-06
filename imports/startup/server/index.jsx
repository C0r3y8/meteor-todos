import React from 'react';
import {
  Link,
  Route,
  Switch
} from 'react-router-dom';
import { combineReducers } from 'redux';

import {
  CacheModule,
  defaultBuildKey,
  enableCache
} from 'meteor/c0r3y8:octopus-cache';
import { Logger } from 'meteor/c0r3y8:octopus-logger';
import { Octopus } from 'meteor/c0r3y8:octopus';
import { ReduxModule } from 'meteor/c0r3y8:octopus-redux';

import AppContainer from '../../ui/containers/app-container';
import NotFound from '../../ui/pages/not-found';
import ReduxPage from '../../ui/pages/redux-page';
import { reduxPageReducer } from '../../reducers/redux-page-reducers';
import { reduxPageSetName } from '../../actions/redux-page-actions';
import Tasks from '../../api/tasks';

import './register-api';

const MainApp = () => (
  <div>
    <ul>
      <li><Link to="/">{'Home'}</Link></li>
      <li><Link to="/redux">{'Redux'}</Link></li>
    </ul>

    <Switch>
      <Route exact path="/" component={AppContainer} />
      <Route path="/redux" component={ReduxPage} />
      <Route component={NotFound} />
    </Switch>
  </div>
);

const ssr = Octopus(MainApp, {}, {
  engineOptions: {
    withIds: true
  },
  Logger: new Logger()
});

ssr.module(CacheModule, {
  config: {
    collections: [ {
      callback(type) {
        const key = defaultBuildKey('GET', '/', {});
        const entries = this.del(key);

        if (entries > 0) {
          /* eslint-disable no-underscore-dangle */
          ssr._info('info_cache_del', type, key);
          /* eslint-enable */
        }
      },
      cursor: Tasks.find({})
    } ]
  }
});

ssr.module(ReduxModule, {
  config: {
    reducer: combineReducers({
      reduxPage: reduxPageReducer
    })
  }
});

/* eslint-disable no-unused-vars, prefer-arrow-callback */
ssr.route({
  exact: true,
  path: '/'
}, enableCache(), (req, res, next) => {
  next();
});

ssr.route({
  path: '/redux'
}, enableCache(), function reduxPageMiddleware(req, res, next) {
  if (req.query.name) {
    this.store.dispatch(reduxPageSetName(req.query.name));
  }
  next();
});
/* eslint-enable */
