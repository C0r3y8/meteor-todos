import { EJSON } from 'meteor/ejson';

/* eslint-disable import/prefer-default-export */
export const defaultBuildKey = (type, url, params) =>
  `${type}-${url}-${EJSON.stringify(params)}`;
/* eslint-enable */
