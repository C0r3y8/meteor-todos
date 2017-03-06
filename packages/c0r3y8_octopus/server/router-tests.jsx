/* eslint-disable import/no-unresolved */
import chaiWebdriver from 'chai-webdriver-promised';
import faker from 'faker';
import React, { PropTypes } from 'react';
import {
  Link,
  Route,
  Switch
} from 'react-router-dom';
import webdriver from 'selenium-webdriver';
/* eslint-enable */

import { HTTP } from 'meteor/http';
import { Octopus } from 'meteor/c0r3y8:octopus';
import { Meteor } from 'meteor/meteor';
import { chai, expect } from 'meteor/practicalmeteor:chai';
import { sinon } from 'meteor/practicalmeteor:sinon';
import { createContainer } from 'meteor/react-meteor-data';

const TasksCollection = new Meteor.Collection('tasks');
TasksCollection.insert({
  createdAt: new Date(),
  text: faker.lorem.sentence()
});
/* eslint-disable prefer-arrow-callback */
Meteor.publish('tasks', function tasksPublication() {
  return TasksCollection.find({}, { sort: { createdAt: -1 } });
});
/* eslint-enable */

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

function Task({ text }) {
  return <li className="tasks-item">{text}</li>;
}

Task.propTypes = {
  text: PropTypes.string.isRequired
};

function Tasks(props) {
  const renderTasks = tasks =>
    tasks.map(({ _id, text }) => <Task key={_id} text={text} />);

  return <ul className="tasks">{renderTasks(props.tasks)}</ul>;
}

Tasks.propTypes = {
  tasks: PropTypes.array.isRequired
};

const TasksContainer = createContainer(() => {
  Meteor.subscribe('tasks');
  return {
    tasks: TasksCollection.find({}, { sort: { createdAt: -1 } }).fetch()
  };
}, Tasks);

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
      <Route exact path="/tasks" component={TasksContainer} />
      <Route component={NotFound} />
    </Switch>
  </div>
);

const app = new Octopus(MainApp, {}, { engineOptions: { withIds: true } });

/* eslint-disable no-unused-vars */
app.route({
  exact: true,
  path: '/'
}, (req, res, next) => { next(); });
/* eslint-enable */

const driver = new webdriver.Builder().forBrowser('chrome').build();
chai.use(chaiWebdriver(driver, 15000));
/* eslint-disable func-names, no-undef, no-unused-vars, prefer-arrow-callback */
describe('RouterSSR:', function () {
  describe('Send request on a valid route', function () {
    it('should respond with status 200', function () {
      const res = HTTP.get(Meteor.absoluteUrl());
      expect(res.statusCode).to.equal(200);
    });

    describe('without params', function () {
      before(function (done) {
        driver.get(Meteor.absoluteUrl()).then(done);
      });

      it('should contain \'Hello, John Doe\' in h1', function () {
        expect('h1').dom.to.contain.text('Hello, John Doe');
      });
    });

    describe('with params', function () {
      const url = Meteor.absoluteUrl('hello/John-Smith');

      before(function (done) {
        driver.get(url).then(done);
      });

      it('should call route middleware with { name: \'John-Smith\' }',
        function () {
          const callback = (req, res, next) => { next(); };
          const spy = sinon.spy(callback);

          app.route({ path: '/hello/:name' }, spy);

          HTTP.get(url);
          assert(spy.calledOnce, 'route middleware must be called once');
          expect(spy.thisValues[ 0 ].params.name).to.equal('John-Smith');
        }
      );

      it('should contain \'Hello, John Smith\' in h1', function () {
        expect('h1').dom.to.contain.text('Hello, John Smith');
      });
    });

    describe('with subscriptions', function () {
      const url = Meteor.absoluteUrl('tasks');

      before(function (done) {
        driver.get(url).then(done);
      });

      it('should have task in first HTML payload', function () {
        expect('.tasks-item').dom.to.have.count(1);
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
