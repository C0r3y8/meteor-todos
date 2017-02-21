import React from 'react';
import {
  Route,
  Link
} from 'react-router-dom';

import { LearnSSR } from 'meteor/c0r3y8:learn-ssr';
import { Logger } from 'meteor/c0r3y8:learn-ssr-logger';

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

const ssr = LearnSSR(MainApp, {}, {
  engine: { withIds: true },
  Logger: new Logger()
});

/* eslint-disable no-unused-vars */
ssr.route({
  exact: true,
  path: '/'
}, (params, req, res, next) => {
  next();
});
/* eslint-enable */
