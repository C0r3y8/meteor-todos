import React from 'react';
import {
  Link,
  Route,
  Switch
} from 'react-router-dom';
import { combineReducers } from 'redux';

import { LearnSSR } from 'meteor/c0r3y8:learn-ssr';
import {
  reduxCreateStoreMiddleware,
  reduxEngineRender
} from 'meteor/c0r3y8:learn-ssr-redux';

import AppContainer from '../../ui/containers/app-container';
import NotFound from '../../ui/pages/not-found';
import ReduxPage from '../../ui/pages/redux-page';
import { reduxPageReducer } from '../../reducers/redux-page-reducers';

import './accounts-config';

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

const app = LearnSSR(MainApp, {
  engineOptions: {
    renderToString: reduxEngineRender()
  }
});

app.middleware(reduxCreateStoreMiddleware(
  combineReducers({
    reduxPage: reduxPageReducer
  })
));
