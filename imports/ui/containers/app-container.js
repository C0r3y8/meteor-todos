import { createContainer } from 'meteor/react-meteor-data';

import { Meteor } from 'meteor/meteor';

import Tasks from '../../api/tasks';

import App from '../layouts/app';

export default createContainer(() => {
  Meteor.subscribe('tasks');

  const selector = { private: { $ne: true } };
  const sort = { sort: { createdAt: -1 } };

  const incompleteCount = (Meteor.isServer) ?
    Tasks.find({
      checked: { $ne: true },
      ...selector
    }, sort).count() : Tasks.find({ checked: { $ne: true } }).count();

  const tasks = (Meteor.isServer) ?
    Tasks.find(selector, sort).fetch() : Tasks.find({}, sort).fetch();

  return {
    currentUser: Meteor.user(),
    incompleteCount,
    tasks
  };
}, App);
