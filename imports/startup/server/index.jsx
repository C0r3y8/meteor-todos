import React from 'react';
import {
  Route,
  Link
} from 'react-router-dom';

import { LearnSSR } from 'meteor/c0r3y8:learn-ssr';

import AppContainer from '../../ui/containers/app-container';
import './register-api';

const MainApp = () => (
  <div>
    <ul>
      <li><Link to="/">{'Home'}</Link></li>
    </ul>

    <Route exact path="/" component={AppContainer} />
  </div>
);

const ssr = LearnSSR({
  App: MainApp,
  engine: { withIds: true }
});

ssr.route({
  exact: true,
  path: '/'
}, function (params, req, res, next) {
  console.log('Hello');
});
