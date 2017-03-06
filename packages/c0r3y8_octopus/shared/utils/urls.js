import { RoutePolicy } from 'meteor/routepolicy';

/* eslint-disable import/prefer-default-export */
export const isAppUrl = (url) => {
  if (url === '/favicon.ico' || url === '/robots.txt') {
    return false;
  }

  if (url === '/app.manifest') {
    return false;
  }

  // Avoid serving app HTML for declared routes such as /sockjs/.
  if (RoutePolicy.classify(url)) {
    return false;
  }
  return true;
};
/* eslint-enable */
