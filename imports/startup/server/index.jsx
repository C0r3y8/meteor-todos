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
  Logger: new Logger({
    codes: {
      router_does_not_find_route: 'Router: No routes matches with %s',
      router_finds_route: 'Router: Finds route %s with params %j',
      router_finishes: 'Router: Response %j sended',
    }
  }),
  profiling: true
});

ssr.route({
  exact: true,
  path: '/'
}, function (params, req, res, next) {
  console.log('Hello');
  next();
});
