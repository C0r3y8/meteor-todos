import { Meteor } from 'meteor/meteor';

const originalSubscribe = Meteor.subscribe;
Meteor.subscribe = (name, ...params) => {

  if (originalSubscribe) {
    originalSubscribe.apply(Meteor, arguments);
  }

  return {
    ready: () => true
  };
};
