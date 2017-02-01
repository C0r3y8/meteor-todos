import { Meteor } from 'meteor/meteor';
import { check } from 'meteor/check';

import Tasks from './';

function notAuthorized(taskId) {
  const task = Tasks.findOne(taskId);

  if (task.private && task.owner !== this.userId) {
    throw new Meteor.Error('not-authorized');
  }
}

Meteor.methods({
  'tasks.insert': function tasksInsert(text) {
    check(text, String);

    if (!this.userId) {
      throw new Meteor.Error('not-authorized');
    }

    Tasks.insert({
      createdAt: new Date(),
      owner: this.userId,
      text,
      username: Meteor.users.findOne(this.userId).username
    });
  },

  'tasks.remove': function tasksRemove(taskId) {
    check(taskId, String);

    notAuthorized.call(this, taskId);

    Tasks.remove(taskId);
  },

  'tasks.setChecked': function tasksSetChecked(taskId, setChecked) {
    check(setChecked, Boolean);
    check(taskId, String);

    notAuthorized.call(this, taskId);

    Tasks.update(taskId, { $set: { checked: setChecked } });
  },

  'tasks.setPrivate': function tasksSetPrivate(taskId, setToPrivate) {
    check(setToPrivate, Boolean);
    check(taskId, String);

    const task = Tasks.findOne(taskId);

    if (task.owner !== this.userId) {
      throw new Meteor.Error('not-authorized');
    }

    Tasks.update(taskId, { $set: { private: setToPrivate } });
  }
});
