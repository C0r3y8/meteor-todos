import { Meteor } from 'meteor/meteor';

export default (router) => {
  const originalSubscribe = Meteor.subscribe;
  Meteor.subscribe = (name, ...params) => {
    const context = router.getContext();

    if (context) {
      router.subscribing.withValue(true, () => {
        context.addSubscription(name, params);
      });
    }

    if (originalSubscribe) {
      originalSubscribe.apply(Meteor, [ name, ...params ]);
    }

    return {
      ready: () => true
    };
  };
};
