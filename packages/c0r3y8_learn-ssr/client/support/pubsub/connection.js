/* eslint-disable max-len */
/**
 * We're stealing all the code from FastRender
 * https://github.com/kadirahq/fast-render/blob/master/lib/client/ddp_update.js
 *
 * For `msg`
 * see https://github.com/meteor/meteor/blob/0963bda60ea5495790f8970cd520314fd9fcee05/packages/ddp/DDP.md
 * for more infos
 */
/* eslint-enable */
import { EJSON } from 'meteor/ejson';
import { Meteor } from 'meteor/meteor';
import { MongoID } from 'meteor/mongo-id';

import {
  jsperfFilter,
  jsperfForEach
} from '../../../shared/utils/jsperf';

/* eslint-disable no-param-reassign */
const applyDDP = (doc, msg) => {
  let newDoc = null;

  if (msg.msg === 'added' || msg.msg === 'changed') {
    newDoc = { ...doc, ...msg.fields };

    if (msg.msg === 'cleared') {
      // jsperf
      msg.cleared.jsperfForEach = jsperfForEach;

      msg.cleared.jsperfForEach((field) => {
        delete newDoc[ field ];
      });
    }
  }

  return newDoc;
};

const toChanged = (doc, msg) => {
  const keys = Object.keys(doc);
  // jsperf
  keys.jsperfForEach = jsperfForEach;

  // Change 'added' msg to 'changed'
  msg.msg = 'changed';
  msg.cleared = [];

  keys.jsperfForEach((item) => {
    if (!msg.fields[ item ]) {
      msg.cleared.push(item);
    }
  });
};
/* eslint-enable */

const mergeDoc = (pendingStoreUpdates, msg) => {
  const existingDocs = pendingStoreUpdates.jsperfFilter(
    doc => doc.id === msg.id
  );
  let mergedDoc;

  // jsperfForEach
  existingDocs.jsperfForEach = jsperfForEach;

  existingDocs.jsperfForEach((docMsg) => {
    if (!mergedDoc) {
      mergedDoc = {};
    }
    mergedDoc = applyDDP(mergedDoc, docMsg);
  });

  if (mergedDoc) {
    toChanged(mergedDoc, msg);
  }
};

/* eslint-disable no-underscore-dangle */
/**
 * @summary Allows to fill minimongo before DDP connection
 * @locus Client
 * @param {Router} router
 */
export default (router) => {
  const context = router.getContext();
  const { connection } = Meteor;
  const originalLivedataData = connection._livedata_data;
  const originalSend = connection._send;
  const subscriptionIdMap = {};

  let reconnecting = false;
  let revertedBackToOriginal = false;

  connection._livedata_data = function livedataData(msg) {
    let doc;
    let existingDoc;
    let id;
    let localCollection;
    let pendingStoreUpdates;

    // adds data manually while initializing
    // But when the server sends actual data via DDP, it also tries to add
    // Then we need to detect that and alter
    //
    // But we don't need to interfer with Meteor's simulation process
    // That's why we are checking for serverDocs and ignore manual handling
    //
    // We don't need this logic after our special handling reverted back to
    // original. But we can't detect when null publications completed or not
    // That's why we need keep this logic
    //
    // It's okay to ignore this logic after sometime, but not sure when exactly

    if (msg.msg === 'added') {
      id = MongoID.idParse(msg.id);
      doc = this._getServerDoc(msg.collection, id);

      if (!reconnecting && !doc) {
        localCollection = this._mongo_livedata_collections[ msg.collection ];
        pendingStoreUpdates = this._updatesForUnknownStores[ msg.collection ];

        if (localCollection) {
          existingDoc = localCollection.findOne(id);

          if (existingDoc) {
            toChanged(existingDoc, msg);
          }
        } else if (pendingStoreUpdates) {
          // jsperf
          pendingStoreUpdates.jsperfFilter = jsperfFilter;

          mergeDoc(pendingStoreUpdates, msg);
        }
      }
    }

    // if we've completed our tasks, no need of special handling
    if (!revertedBackToOriginal && context.dataReceived) {
      if (msg.msg === 'ready' && !msg.ssrGen && context.subscriptions) {
        /* eslint-disable no-param-reassign */
        // jsperf
        msg.subs.jsperfForEach = jsperfForEach;
        /* eslint-enable */

        msg.subs.jsperfForEach((subId) => {
          const sub = subscriptionIdMap[ subId ];
          const { subscriptions } = context;

          if (sub) {
            if (subscriptions[ sub.name ]) {
              delete subscriptions[ sub.name ][ sub.paramsKey ];

              if (Object.keys(subscriptions[ sub.name ]).length === 0) {
                delete subscriptions[ sub.name ];
              }
            }
            delete subscriptionIdMap[ subId ];
          }
        });
      }

      if (Object.keys(context.subscriptions).length === 0) {
        revertedBackToOriginal = true;
      }
    }
    return originalLivedataData.call(this, msg);
  };


  connection._send = function send(msg) {
    let paramsKey;

    // if looking for connect again to the server, we must need to revert back
    // to original to prevent some weird DDP issues
    //  normally it is already reverted, but user may added subscriptions
    //  in server, which are not subscribed from the client
    if (msg.msg === 'connect' && msg.session !== undefined) {
      revertedBackToOriginal = true;
      reconnecting = true;
    }

    // if we've completed our tasks, no need of special handling
    if (!revertedBackToOriginal && context.dataReceived) {
      paramsKey = EJSON.stringify(msg.params);

      if (msg.msg === 'sub'
        && context.subscriptions[ msg.name ]
        && context.subscriptions[ msg.name ][ paramsKey ]) {
        context.injectDdpMessage(this, {
          msg: 'ready',
          ssrGen: true,
          subs: [ msg.id ]
        });

        subscriptionIdMap[ msg.id ] = {
          name: msg.name,
          paramsKey
        };
      }
    }

    return originalSend.call(this, msg);
  };
};
/* eslint-enable */
