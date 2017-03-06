# Octopus

```
                          `--::-`                                
                        .+ssssssys:                              
             ./++/-    /ssssssssssyo       -+oo/.                
            -yoshsso  /ssssssssssssy/     /shh-sy.               
            `- .ysyo .sssosssssssosyy`    osyy/.-                
             .oso+-  .ssossysssohooyy`    `ossy:                 
            `ss.      osssysosossosys       +sss`                
             ss+.   `-/sssssyyysssyy+:.    `osss`                
             .osssssyyyyyssssosssyysssss+/+ssss-                 
               ./sssssssssssyssssyysssyyssss+:`                  
                osssyyyysssyyssssyyysssys:.`                     
         ``    /ssyhhyhyssyyyssssyyhhhysy`      .-.`             
       :++osoossyyo::...ossyyssssy+ .ohyss-  .:ssyyy:            
      `:    .:/:-      `ossyyssssyo   -shyyyss+/---:o            
                 :/+//+sssys:`/sssss+++++/```       `            
               .osyyyssoo/.     .:+ssyhyys+.                     
          :/+osyyo.                    ./yyysoos-                
          `                                `   `-                
```

A router that enables __SSR__ (Server Side Rendering) for [Meteor](https://www.meteor.com/).

## Table of Contents
1. [Introduction](#introduction)
2. [Installation](#Installation)
3. [Example](#example)
4. [API](#api)
6. [Create a module](#create-a-module)
7. [Create an engine](#create-an-engine)
8. [Sources](#sources)

## Introduction

Basically, I create this package to learn more about [Meteor](https://www.meteor.com/) and __SSR__.

But if this package can help someone, I would be delighted to help.

> By default, Octopus adds support for [`react`](https://github.com/facebook/react) and [`react-router v4`](https://github.com/ReactTraining/react-router/tree/v4) with `ReactRouterEngine` but you can create your own [engine](#create-an-engine) to render what you want on client and server.
Also, you can use [modules](#using-a-module) to add some good stuff like Redux or other.

## Installation

For the instance, this package is not published on [Atmosphere](https://atmospherejs.com/) but you can clone this repo and copy / paste `c0r3y8_octopus` in `packages` folder into your project.

## Examples

Some parts of Octopus API are not be able on both client and server so I try to provide a small example.

> See [ToDo example](https://github.com/C0r3y8/meteor-todos) for more informations

__Both:__
```javascript
// Some imports

const MainApp = () => (
  <div>
    <ul>
      <li><Link to="/">{'Home'}</Link></li>
      <li><Link to="/redux">{'Redux'}</Link></li>
    </ul>

    <Switch>
      <Route exact path="/" component={AppContainer} />
      <Route component={NotFound} />
    </Switch>
  </div>
);

const app = Octopus(MainApp);
```

__Client:__
```javascript
// Do nothing
```

__Server:__
```javascript
app.route({
  exact: true,
  path: '/'
}, function (req, res, next) {
  // Do something
  next();
});
```

## API

> JSDoc 3 is used in this package. In future, I'll deploy the generated doc for more API documentation.

#### `Octopus(MainApp, [clientConfig], [serverConfig])`
> Anywhere

Adds Octopus middleware in [`webapp`](https://github.com/meteor/meteor/tree/devel/packages/webapp).

Returns Octopus instance.

__Arguments__
-  `MainApp` (Function): This is your React app
- [`clientConfig`] (Object): Custom client configuration
  - [`clientConfig.engine=new ReactRouterEngine`] (Object): use this option, if you want to use a custom engine
  - [`clientConfig.engineOptions={}`] (Object): use this option, if you want to pass custom options to the engine like `renderToString`
  - [`clientConfig.startup=true`] (Boolean): if `true`, router starts automatically on `Meteor.startup` but sometimes you need to start router when you want so you can set it to `false` and call `app.render` manually.
- [`serverConfig`] (Object): Custom server configuration
  - [`serverConfig.engine=new ReactRouterEngine`] (Object): use this option, if you want to use a custom engine
  - [`serverConfig.engineOptions={}`] (Object): use this option, if you want to pass custom options to the engine like `renderToString` or `extras` body / headers

#### `app.middleware(callback [, callback...])`
> Anywhere

Adds middleware callback.

__Arguments__
- `callback` (Function):
  - __On Client:__ Callback is called (`callback()`) without arguments. It's just like a before render hook.
  - __On Server:__ Callback is called (`callback(req, res, next)`) with request, response and next arguments. You can use this to do some checks or to pass custom context to other middleware or route callback by using `this`, ex: `this.store = createStore(...)`.

> If you want to access to middleware context (`this`) in your callback, do not use arrow function.

#### `app.module(Module, [options])`
> Anywhere

Adds module.

__Arguments__
- `Module` (Function|Object): it can be an __instance__ or a __class__ (ES2015), if it's a `function` then call `new Module` else use Module directly
- [`options={}`] (Object):
  - [`options.config`] (Object): if it's set and `Module` is a function then pass `config` as an argument to `new Module(config)`
  - [`options.engineOptions=true`] (Boolean): if `true`, `Module` can set engine options
  - [`options.middlewares=true`] (Boolean): if `true`, `Module` can add middleware
  - [`options.routes=true`] (Boolean): __Server only__, if `true`, `Module` can add route

#### `app.route(routeConfig, callback [, callback...])`
> Server

Adds route.

__Arguments__
- `routeConfig` (Object):
  - [`routeConfig.exact=false`] (Boolean): if `true`, path must be matched exactly with request url
  - `routeConfig.path` (String): an Express-style path
  - [`routeConfig.strict=false`] (Boolean): if `false`, the trailing slash is optional
- `callback` (Function): callback is called if request url matches with a route path. For dynamic route ex: `/user/:name`, you can access to url parameters with `this.params.name`.

> If you want to access to route context (`this`) in your callback, do not use arrow function.

## Create an engine

_To do_

## Create a module

_To do_

## Sources

This package is based or have code from over package but not use them directly. How I said, basically I create this package for learn more about __SSR__ with Meteor.
So big thanks to:
- [`meteorhacks:fast-render`](https://github.com/kadirahq/fast-render)
- [`meteorhacks:inject-data`](https://github.com/meteorhacks/inject-data)
- [`meteorhacks:picker`](https://github.com/meteorhacks/picker)
- [`reactrouter:react-router-ssr`](https://github.com/thereactivestack-legacy/meteor-react-router-ssr)
- [`electrode-redux-router-engine`](https://github.com/electrode-io/electrode/tree/762edbafdcd083dbdb0a7978682a08b85b8e8640/packages/electrode-redux-router-engine)
- [`ssrwpo:ssr`](https://github.com/ssrwpo/ssr)
