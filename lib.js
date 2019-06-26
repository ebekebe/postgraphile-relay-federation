const { makeProcessSchemaPlugin } = require('graphile-utils')

const buildFederatedSchema = require('./buildFederatedSchema')

const processSchemaPlugin = makeProcessSchemaPlugin(postgraphileSchema => {
	return buildFederatedSchema(postgraphileSchema)
})

module.exports = processSchemaPlugin
