import { HTTP } from 'meteor/http';
import { Meteor } from 'meteor/meteor';
import { chai } from 'meteor/practicalmeteor:chai';

import { RouterSSR } from 'meteor/ssr-react-router';

const app = RouterSSR();

/* eslint-disable func-names, prefer-arrow-callback */
describe('normal route', function () {
  it('should return done', function () {
    const path = '/';

    app.route(path, function (params, req, res) {
      res.end('done');
    });

    const res = HTTP.get(Meteor.absoluteUrl());
    chai.assert.equal(res.content, 'done');
  });
});
/* eslint-enable */
