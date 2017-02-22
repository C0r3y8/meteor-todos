import chaiWebdriver from 'chai-webdriver';
import React, { PropTypes } from 'react';
import {
  Route,
  Link
} from 'react-router-dom';
import webdriver from 'selenium-webdriver';

import { LearnSSR } from 'meteor/c0r3y8:learn-ssr';
import { Meteor } from 'meteor/meteor';
import { chai, expect } from 'meteor/practicalmeteor:chai';

function Welcome(props) {
  return <h1>{`Hello, ${props.name}`}</h1>;
}

Welcome.defaultProps = {
  name: 'John Doe'
};

Welcome.propTypes = {
  name: PropTypes.string
};

const MainApp = () => (
  <div>
    <ul>
      <li><Link to="/">{'Welcome'}</Link></li>
    </ul>

    <Route exact path="/" component={Welcome} />
  </div>
);

const app = new LearnSSR(MainApp, {}, { engine: { withIds: true } });

/* eslint-disable no-unused-vars */
app.route({
  exact: true,
  path: '/'
}, (params, req, res, next) => { next(); });
/* eslint-enable */

const driver = new webdriver.Builder().forBrowser('chrome').build();
chai.use(chaiWebdriver(driver));
/* eslint-disable func-names, no-unused-vars, prefer-arrow-callback */
describe('SSR', function () {
  describe('render static page', function () {
    it('body should contain \'Hello, John Doe\'', function (done) {
      return driver.get(Meteor.absoluteUrl())
        .then(() => {
          expect('h1').dom.to.contain.text('Hello, John Doe');
        })
        .then(done);
    });
  });
});
/* eslint-enable */
