const { GraphQLSchema, specifiedDirectives } = require('graphql')
const { transformSchema } = require('apollo-graphql')
const { printSchema } = require('@apollo/federation')
const { federationDirectives } = require('@apollo/federation/dist/directives')
const { typeIncludesDirective } = require('@apollo/federation/dist/directives')
const { serviceField, entitiesField, EntityType } = require('@apollo/federation/dist/types')

const {
	isObjectType,
	isUnionType,
	GraphQLUnionType,
	GraphQLObjectType
} = require('graphql')

function createKeyDirective (fieldName) {
	return {
		kind: 'Directive',
		name: { kind: 'Name', value: 'key' },
		arguments: [
			{
				kind: 'Argument',
				name: { kind: 'Name', value: 'fields' },
				value: { kind: 'StringValue', value: fieldName, block: false }
			}
		]
	}
}

function addTypeNameToPossibleReturn (maybeObject, typename) {
	if (maybeObject !== null && typeof maybeObject === 'object') {
		Object.defineProperty(maybeObject, '__typename', {
			value: typename
		})
	}
	return maybeObject
}

function buildFederatedSchema (postgraphileSchema) {
	const postgraphileSchemaConfig = postgraphileSchema.toConfig()
	const pSchema = new GraphQLSchema({
		...postgraphileSchemaConfig,
		directives: [...postgraphileSchemaConfig.directives, ...specifiedDirectives, ...federationDirectives]
	})

	const queryTypeConfig = postgraphileSchemaConfig.query.toConfig()

	// Find the auto-generated resolver that can resolve an id to the entity type.
	// Use `query { node(id: ID!) }` to let postgraphile fetch the requested object
	const postgraphileResolver = queryTypeConfig.fields.node.resolve

	const entitiesFieldResolver = (_source, { representations }, context, info) => {
		return representations.map((reference) => {
			const { __typename } = reference

			const type = info.schema.getType(__typename)
			if (!type || !isObjectType(type)) {
				throw new Error(
					`The _entities resolver tried to load an entity for type "${__typename}", but no object type of that name was found in the schema`
				)
			}

			const { id } = reference
			const rootValue = null
			const result = postgraphileResolver(rootValue, { id }, context, info)

			return result.then((x) =>
				addTypeNameToPossibleReturn(x, __typename)
			)
		})
	}

	// Add directives to postgraphile schema here
	let schema = transformSchema(pSchema, type => {
		// Ignore root types `Query`, `Subscription` and `Mutation`
		if (isObjectType(type) && type === pSchema.getQueryType()) return undefined
		if (isObjectType(type) && type === pSchema.getMutationType()) return undefined
		if (isObjectType(type) && type === pSchema.getSubscriptionType()) return undefined

		const config = type.toConfig()

		// Only add types that implment the Relay `Node` interface
		if (config.interfaces && config.interfaces.find(i => i.name === 'Node')) {
			const newType = new GraphQLObjectType({
				...config,

				// Add @key directive for field `id`
				astNode: {
					kind: 'ObjectTypeDefinition',
					name: { kind: 'Name', value: config.name },
					directives: [createKeyDirective('id')]
				}
			})

			return newType
		}

		return undefined
	})

	// This is "normal" federation logic, borrowed from
	// https://github.com/apollographql/apollo-server/blob/master/packages/apollo-federation/src/service/buildFederatedSchema.ts
	// The only exception is that we use our own resolver for the `_entities` field.
	const _sdl = printSchema(schema)

	const entityTypes = Object.values(schema.getTypeMap()).filter(
		type => isObjectType(type) && typeIncludesDirective(type, 'key')
	)
	const hasEntities = entityTypes.length > 0

	schema = transformSchema(schema, type => {
		// Add `_entities` and `_service` fields to query root type
		if (isObjectType(type) && type === schema.getQueryType()) {
			const config = type.toConfig()
			return new GraphQLObjectType({
				...config,
				fields: {
					...(hasEntities && { _entities: { ...entitiesField, resolve: entitiesFieldResolver } }),
					_service: {
						...serviceField,
						resolve: () => ({ sdl: _sdl })
					},
					...config.fields
				}
			})
		}

		return undefined
	})

	schema = transformSchema(schema, type => {
		if (hasEntities && isUnionType(type) && type.name === EntityType.name) {
			return new GraphQLUnionType({
				...EntityType.toConfig(),
				types: entityTypes.filter(isObjectType)
			})
		}
		return undefined
	})

	return schema
}

module.exports = buildFederatedSchema
