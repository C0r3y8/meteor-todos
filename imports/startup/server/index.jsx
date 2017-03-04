import React from 'react';
import {
  Link,
  Route,
  Switch
} from 'react-router-dom';
import { combineReducers } from 'redux';

import { LearnSSR } from 'meteor/c0r3y8:learn-ssr';
import { Logger } from 'meteor/c0r3y8:learn-ssr-logger';
import { ReduxModule } from 'meteor/c0r3y8:learn-ssr-redux';

import AppContainer from '../../ui/containers/app-container';
import NotFound from '../../ui/pages/not-found';
import ReduxPage from '../../ui/pages/redux-page';
import { reduxPageReducer } from '../../reducers/redux-page-reducers';
import { reduxPageSetName } from '../../actions/redux-page-actions';

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

const ssr = LearnSSR(MainApp, {}, {
  engineOptions: {
    withIds: true
  },
  Logger: new Logger()
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
}, (req, res, next) => {
  next();
});

ssr.route({
  path: '/redux'
}, function reduxPageMiddleware(req, res, next) {
  if (req.query.name) {
    this.store.dispatch(reduxPageSetName(req.query.name));
  }
  next();
});
/* eslint-enable */
