/* eslint-disable import/no-unresolved */
import chaiWebdriver from 'chai-webdriver';
import React, { PropTypes } from 'react';
import {
  Link,
  Route,
  Switch
} from 'react-router-dom';
import webdriver from 'selenium-webdriver';
/* eslint-enable */

import { HTTP } from 'meteor/http';
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

/* eslint-disable no-param-reassign, no-unused-vars */
function NotFound(props, { router }) {
  if (Meteor.isServer) {
    router.staticContext.notFound = true;
  }
  return <h1>{'Not found'}</h1>;
}
/* eslint-enable */

NotFound.contextTypes = {
  router: PropTypes.object
};

const MainApp = () => (
  <div>
    <ul>
      <li><Link to="/">{'Welcome'}</Link></li>
    </ul>

    <Switch>
      <Route exact path="/" component={Welcome} />
      <Route component={NotFound} />
    </Switch>
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
/* eslint-disable func-names, no-undef, no-unused-vars, prefer-arrow-callback */
describe('SSR', function () {
  describe('request on valid route without params', function () {
    before(function (done) {
      return driver.get(Meteor.absoluteUrl()).then(done);
    });

    it('h1 should contain \'Hello, John Doe\'', function () {
      expect('h1').dom.to.contain.text('Hello, John Doe');
    });

    it('h1 should not contain \'Hello, Foo Bar\'', function () {
      expect('h1').dom.not.to.contain.text('Hello, Foor Bar');
    });

    it('should responded with status 200', function () {
      const res = HTTP.get(Meteor.absoluteUrl());
      expect(res.statusCode).to.equal(200);
    });
  });

  describe('request on a invalid route', function () {
    const url = `${Meteor.absoluteUrl()}/unknownroute`;

    before(function (done) {
      return driver.get(url).then(done);
    });

    it('h1 should contain \'Not found\'', function () {
      expect('h1').dom.to.contain.text('Not found');
    });

    it('h1 should not contain \'Hello, John Doe\'', function () {
      expect('h1').dom.not.to.contain.text('Hello, John Doe');
    });

    it('should answer with status 404', function (done) {
      return new Promise((resolve) => {
        HTTP.get(url, (error) => {
          expect(error.response.statusCode).to.equal(404);
          resolve();
        });
      }).then(done);
    });
  });

  after(function (done) {
    driver.close().then(done);
  });
});
/* eslint-enable */
