import React from 'react';
import {
  BrowserRouter as Router,
  Route,
  Link
} from 'react-router-dom';

import AppContainer from '../../ui/containers/app-container';
// import App from '../../ui/layouts/app';

export default function () {
  return (
    <Router>
      <div>
        <ul>
          <li><Link to="/">Home</Link></li>
        </ul>

        <Route exact path="/" component={AppContainer} />
      </div>
    </Router>
  );
}
