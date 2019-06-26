# Postgraphile Relay Federation

Enable [GraphQL federation](https://www.apollographql.com/docs/apollo-server/federation/introduction/) the [Postgraphile](https://www.graphile.org/postgraphile/introduction/) generated schema for all types conforming to the Relay `Node` interface

**This package is experimental** in supposed to help exploring native support for federation in Postgraphile.

There is currently [a ticket](https://github.com/graphile/postgraphile/issues/1094) that discusses support for federation in Postgraphile.

## Getting started

Start example server:

```sh
npm install
PG_URI=postgres://postgres:password@localhost/postgres npm start
```


## Use as library

```sh
npm install ebekebe/postgraphile-relay-federation#semver:1.0.1
```

```js
// index.js

const { postgraphile } = require('postgraphile')
const express = require('express')
const federationPlugin = require('@ebekebe/postgraphile-relay-federation')

const app = express()

app.use(postgraphile(process.env.PG_URI, {
    appendPlugins: [federationPlugin],
    
    // The plugin currently only works with classic ids enabled
    classicIds: true,
}))

app.listen(3000)
```
