import { render } from 'react-dom';

import { Meteor } from 'meteor/meteor';

import routes from './routes';

import './accounts-config';

Meteor.startup(() => {
  render(routes(), document.getElementById('render-target'));
});
