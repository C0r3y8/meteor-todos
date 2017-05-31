import PropTypes from 'prop-types';
import React from 'react';

import { Meteor } from 'meteor/meteor';

/* eslint-disable no-param-reassign, no-unused-vars */
export default function NotFound(props, { router }) {
  if (Meteor.isServer) {
    router.staticContext.notFound = true;
  }
  return <h1>{'Not found'}</h1>;
}

NotFound.contextTypes = {
  router: PropTypes.object
};
/* eslint-enable */
