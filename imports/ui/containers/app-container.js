import { createContainer } from 'meteor/react-meteor-data';

import { Meteor } from 'meteor/meteor';

import Tasks from '../../api/tasks';

import App from '../layouts/app';

export default createContainer(() => {
  Meteor.subscribe('tasks');

  return {
    currentUser: Meteor.user(),
    incompleteCount: Tasks.find({ checked: { $ne: true } }).count(),
    tasks: Tasks.find({}, { sort: { createdAt: -1 } }).fetch()
  };
}, App);
