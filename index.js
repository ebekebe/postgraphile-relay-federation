const { postgraphile } = require('postgraphile')
const { makeProcessSchemaPlugin } = require('graphile-utils')
const express = require('express')

const buildFederatedSchema = require('./buildFederatedSchema')

const processSchemaPlugin = makeProcessSchemaPlugin(postgraphileSchema => {
	return buildFederatedSchema(postgraphileSchema)
})

const app = express()

app.use(postgraphile(process.env.PG_URI, {
    appendPlugins: [processSchemaPlugin],
    
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

module.exports = processSchemaPlugin
