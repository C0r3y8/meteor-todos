import { Meteor } from 'meteor/meteor';

import Tasks from '../';

/* eslint-disable prefer-arrow-callback */
Meteor.publish('tasks', function tasksPublication() {
  return Tasks.find({
    $or: [
      { private: { $ne: true } },
      { owner: this.userId }
    ]
  });
});
/* eslint-enable */
