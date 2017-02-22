import React from 'react';
import {
  Link,
  Route,
  Switch
} from 'react-router-dom';

import { LearnSSR } from 'meteor/c0r3y8:learn-ssr';

import AppContainer from '../../ui/containers/app-container';
import NotFound from '../../ui/pages/not-found';

import './accounts-config';


const MainApp = () => (
  <div>
    <ul>
      <li><Link to="/">{'Home'}</Link></li>
    </ul>

    <Switch>
      <Route exact path="/" component={AppContainer} />
      <Route component={NotFound} />
    </Switch>
  </div>
);

LearnSSR(MainApp);
