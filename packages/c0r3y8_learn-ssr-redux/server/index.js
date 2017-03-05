import { checkNpmVersions } from 'meteor/tmeasday:check-npm-versions';
import {
  reduxCreateStoreMiddleware,
  reduxEngineRender,
  reduxExtrasBody,
  ReduxModule
} from './redux';

checkNpmVersions({
  'react-redux': '5.x',
  redux: '3.x'
}, 'c0r3y8:learn-ssr-redux');

export {
  reduxCreateStoreMiddleware,
  reduxEngineRender,
  reduxExtrasBody,
  ReduxModule
};
