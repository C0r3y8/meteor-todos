import { checkNpmVersions } from 'meteor/tmeasday:check-npm-versions';
import {
  cacheInitContextMiddleware,
  cachePresenceForMiddleware,
  enableCache,
  CacheModule
} from './cache-module';

checkNpmVersions({
  'node-cache': '4.x'
}, 'c0r3y8:learn-ssr-redux');

export {
  cacheInitContextMiddleware,
  cachePresenceForMiddleware,
  enableCache,
  CacheModule
};
