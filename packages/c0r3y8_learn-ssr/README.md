# Learn SSR with Meteor

## Introduction

Faire fonctionner le __SSR__ (Server Side Rendering) avec __Meteor__ implique d’effectuer quelques étapes pour simuler la communication __Client / Server__. [kadirahq/fast-render](https://github.com/kadirahq/fast-render) permet déjà d’activer le __SSR__ avec Meteor.
Cet article reprend d’ailleurs directement du code de [kadirahq/fast-render](https://github.com/kadirahq/fast-render), [meteor/meteor](https://github.com/meteor/meteor), [kadirahq/flow-router/tree/ssr](https://github.com/kadirahq/flow-router/tree/ssr) et [thereactivestack-legacy/meteor-react-router-ssr](https://github.com/thereactivestack-legacy/meteor-react-router-ssr).  
## Exécuter une publication côté Server

`Meteor.subscribe` permet en général de souscrire à une publication. Celle-ci envoie les données voulues provenant des collections et les rend disponibles côté __Client__.

> Plus d’infos sur __publish and subscribe__ [ici](https://docs.meteor.com/api/pubsub.html)

Habituellement l’utilisateur souscris à une publication qui est ensuite exécutée et les données sont envoyées au client. __DDP__ se charge d’identifier l’utilisateur si il est connecté (`loginToken` existant) pour permettre l’utilisation entre autre de `this.userId` pour tester par exemple les autorisations d’un utilisateur.

Le fonctionnement est un peu différent en __SSR__. La connexion __DDP__ n’étant pas encore établie avec le client, nous devons faire certaines opérations afin d’activer l’utilisation de `this.userId` dans une publication.  > Remarque: cela peut engendrer des problèmes de sécurité expliquer sur [le dépôt de kadirahq/fast-render](https://github.com/kadirahq/fast-render#security). Nous y reviendrons plus tard pour voir les éventuelles solutions.

### Définir `Meteor.subscribe` côté Server

```javascript
const originalSubscribe = Meteor.subscribe;
```

## Notes diverses
Quelques notes supplémentaires sur __Meteor__.

### Meteor.connection

```javascript
// https://github.com/meteor/meteor/blob/87681c8f166641c6c3e34958032a5a070aa2d11a/packages/ddp-client/client_convenience.js#L45
/* ... */
  Meteor.connection =
    DDP.connect(ddpUrl, {
      onDDPVersionNegotiationFailure: onDDPVersionNegotiationFailure
  });
/* ... */
```

`Meteor.connection` représente (côté Client), la connexion __DDP__ entre le serveur et le client. On peut également voir un peu plus bas dans le fichier que `Meteor.subscribe` revient à faire `Meteor.connection.subscribe`.

```javascript
// https://github.com/meteor/meteor/blob/87681c8f166641c6c3e34958032a5a070aa2d11a/packages/ddp-client/client_convenience.js#L45
/* ... */
  _.each(['subscribe', 'methods', 'call', 'apply', 'status', 'reconnect',
          'disconnect'],
         function (name) {
           Meteor[name] = _.bind(Meteor.connection[name], Meteor.connection);
         });
/* ... */
```

Cependant le code du fichier [client_convenience.js](https://github.com/meteor/meteor/blob/87681c8f166641c6c3e34958032a5a070aa2d11a/packages/ddp-client/client_convenience.js) n'est exécuté que côté client ne nous permettant donc pas de faire directement `Meteor.subscribe` côté serveur.

`DDP.connect` est une fonction retournant une nouvelle instance de l'objet `Connection`
```javascript
// https://github.com/meteor/meteor/blob/7baed435f53c4fa2cf5515679e64c68d88d31d7a/packages/ddp-client/livedata_connection.js#L1752
DDP.connect = function (url, options) {
  var ret = new Connection(url, options);
  /* ... */
  return ret;
};
```

Ce qui nous intéresse dans cet objet c'est la méthode `subscribe` définit [ici](https://github.com/meteor/meteor/blob/7baed435f53c4fa2cf5515679e64c68d88d31d7a/packages/ddp-client/livedata_connection.js#L537).
C'est elle qui est utilisé lorsqu'un utilisateur appelle `Meteor.subscribe`.
