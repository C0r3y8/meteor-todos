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
import { routes } from './routes';

const reduxPath = routes.get('redux');
const rootPath = routes.get('root');

const MainApp = () => (
  <div>
    <ul>
      <li><Link to={rootPath}>{'Home'}</Link></li>
      <li><Link to={reduxPath}>{'Redux'}</Link></li>
    </ul>

    <Switch>
      <Route exact path={rootPath} component={AppContainer} />
      <Route path={reduxPath} component={ReduxPage} />
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
    Logger: new Logger(),
    routesHelper: routes
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
