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
