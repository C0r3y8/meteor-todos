import React from 'react';
import {
  Link,
  Route,
  Switch
} from 'react-router-dom';
import { combineReducers } from 'redux';

import { Octopus } from 'meteor/c0r3y8:octopus';
import { ReduxModule } from 'meteor/c0r3y8:octopus-redux';

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

const app = Octopus(MainApp);

app.module(ReduxModule, {
  config: {
    reducer: combineReducers({
      reduxPage: reduxPageReducer
    })
  }
});
