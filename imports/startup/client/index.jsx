import React from 'react';
import {
  Route,
  Link
} from 'react-router-dom';

import { LearnSSR } from 'meteor/c0r3y8:learn-ssr';

import AppContainer from '../../ui/containers/app-container';

import './accounts-config';


const MainApp = () => (
  <div>
    <ul>
      <li><Link to="/">{'Home'}</Link></li>
    </ul>

    <Route exact path="/" component={AppContainer} />
  </div>
);

LearnSSR(MainApp);
