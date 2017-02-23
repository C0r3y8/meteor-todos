/* eslint-disable import/no-unresolved */
import chaiWebdriver from 'chai-webdriver-promised';
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
import { sinon } from 'meteor/practicalmeteor:sinon';

function Welcome({ match }) {
  const name = match.params.name || 'John Doe';
  return <h1>{`Hello, ${name.replace('-', ' ')}`}</h1>;
}

Welcome.propTypes = {
  match: PropTypes.shape({
    params: PropTypes.shape({
      name: PropTypes.string
    }).isRequired
  }).isRequired
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
      <Route path="/hello/:name" component={Welcome} />
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
chai.use(chaiWebdriver(driver, 15000));
/* eslint-disable func-names, no-undef, no-unused-vars, prefer-arrow-callback */
describe('RouterSSR:', function () {
  describe('send request on valid route', function () {
    it('should responded with status 200', function () {
      const res = HTTP.get(Meteor.absoluteUrl());
      expect(res.statusCode).to.equal(200);
    });

    describe('without params', function () {
      before(function (done) {
        driver.get(Meteor.absoluteUrl()).then(done);
      });

      it('h1 should contain \'Hello, John Doe\'', function () {
        expect('h1').dom.to.contain.text('Hello, John Doe');
      });

      it('h1 should not contain \'Hello, Foo Bar\'', function () {
        expect('h1').dom.not.to.contain.text('Hello, Foor Bar');
      });
    });

    describe('with params', function () {
      const url = Meteor.absoluteUrl('hello/John-Smith');

      before(function (done) {
        driver.get(url).then(done);
      });

      it('should passed \'John-Smith\' as param', function () {
        const callback = (params, req, res, next) => { next(); };
        const spy = sinon.spy(callback);

        app.route({ path: '/hello/:name' }, spy);

        const res = HTTP.get(url);
        assert(spy.calledOnce, 'route middleware must be called only once');
        expect(spy.getCall(0).args[ 0 ].name).to.equal('John-Smith');
      });

      it('h1 should contain \'Hello, John Smith\'', function () {
        expect('h1').dom.to.contain.text('Hello, John Smith');
      });
    });
  });

  describe('send request on a invalid route', function () {
    const url = Meteor.absoluteUrl('unknownroute');

    before(function (done) {
      driver.get(url).then(done);
    });

    it('should answer with status 404', function (done) {
      return new Promise((resolve) => {
        HTTP.get(url, (error) => {
          expect(error.response.statusCode).to.equal(404);
          resolve();
        });
      }).then(done);
    });

    it('h1 should contain \'Not found\'', function () {
      expect('h1').dom.to.contain.text('Not found');
    });

    it('h1 should not contain \'Hello, John Doe\'', function () {
      expect('h1').dom.not.to.contain.text('Hello, John Doe');
    });
  });

  after(function (done) {
    driver.close().then(done);
  });
});
/* eslint-enable */
