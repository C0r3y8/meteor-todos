import { render } from 'react-dom';

import { Meteor } from 'meteor/meteor';

import routes from './routes';

import './accounts-config';

Meteor.startup(() => {
  console.log(Meteor.connection);
  render(routes(), document.getElementById('react'));
});
