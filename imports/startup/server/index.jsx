import React from 'react';
import {
  Route,
  Link
} from 'react-router-dom';

import { LearnSSR } from 'meteor/c0r3y8:learn-ssr';

import App from '../../ui/layouts/app';
import './register-api';

const MainApp = () => (
  <div>
    <ul>
      <li><Link to="/">{'Home'}</Link></li>
    </ul>

    <Route exact path="/" component={App} />
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
