import React from 'react';
import {
  Link,
  Route,
  Switch
} from 'react-router-dom';
import { combineReducers } from 'redux';

import { Octopus } from 'meteor/c0r3y8:octopus';
import { Logger } from 'meteor/c0r3y8:octopus-logger';
import { ReduxModule } from 'meteor/c0r3y8:octopus-redux';

import AppContainer from '../../ui/containers/app-container';
import NotFound from '../../ui/pages/not-found';
import ReduxPage from '../../ui/pages/redux-page';
import { reduxPageReducer } from '../../reducers/redux-page-reducers';

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

let serverOptions = {};
if (Meteor.isServer) {
  serverOptions = {
    engineOptions: {
      withIds: true
    },
    Logger: new Logger()
  };
}

/* eslint-disable import/prefer-default-export */
export const app = Octopus(MainApp, {}, serverOptions);
/* eslint-enable */

app.module(ReduxModule, {
  config: {
    reducer: combineReducers({
      reduxPage: reduxPageReducer
    })
  }
});
