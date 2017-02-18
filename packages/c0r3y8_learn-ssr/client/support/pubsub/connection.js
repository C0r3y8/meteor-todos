import { Meteor } from 'meteor/meteor';

/* eslint-disable no-underscore-dangle */
/**
 * @summary Allows to fill minimongo before DDP connection
 * @locus Client
 * @param {Router} router
 */
export default (router) => {
  const { connection } = Meteor;
  const originalLivedataData = connection._livedata_data;

  connection._livedata_data = function livedataData(msg) {
    return originalLivedataData.call(this, msg);
  };
};
/* eslint-enable */
