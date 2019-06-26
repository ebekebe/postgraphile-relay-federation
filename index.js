const { postgraphile } = require('postgraphile')
const express = require('express')
const app = express()

const federationPlugin = require('./lib')

app.use(postgraphile(process.env.PG_URI, {
    appendPlugins: [federationPlugin],
    
    // The plugin currently only works with classic ids enabled
    classicIds: true,
}))

app.listen(3000, error => {
	if (error) {
		console.error(error)
		process.exit(1)
	}
	
	console.info(`Running the GraphQL API server at localhost:3000/graphql`)
})