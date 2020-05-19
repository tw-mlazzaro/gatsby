import { GraphQLSchema } from "graphql"
import { SchemaComposer } from "graphql-compose"

import { createPageDependency } from "../redux/actions/add-page-dependency"

import { LocalNodeModel } from "./node-model"
import { defaultFieldResolver } from "./resolvers"
import { IGraphQLRunnerStats } from "../query/types"
import { IGatsbyResolverContext, IGraphQLSpanTracer } from "./type-definitions"

import { store } from "../redux"
import {
  registerModule,
  generateModuleId,
} from "../redux/actions/modules/register-module"
import { addModuleDependencyToQueryResult } from "../redux/actions/internal"

export default function withResolverContext<TSource, TArgs>({
  schema,
  schemaComposer,
  context,
  customContext,
  nodeModel,
  stats,
  tracer,
}: {
  schema: GraphQLSchema
  schemaComposer: SchemaComposer<IGatsbyResolverContext<TSource, TArgs>>
  context?: Record<string, any>
  customContext?: Record<string, any>
  nodeModel?: any
  stats?: IGraphQLRunnerStats | null
  tracer?: IGraphQLSpanTracer
}): IGatsbyResolverContext<TSource, TArgs> {
  const nodeStore = require(`../db/nodes`)

  if (!nodeModel) {
    nodeModel = new LocalNodeModel({
      nodeStore,
      schema,
      schemaComposer,
      createPageDependency,
    })
  }

  return {
    ...(context || {}),
    ...(customContext || {}),
    defaultFieldResolver,
    nodeModel: nodeModel.withContext({
      path: context ? context.path : undefined,
    }),
    stats: stats || null,
    tracer: tracer || null,
    addModuleDependency: ({ source, type = `default`, importName }) => {
      if (!context?.path) {
        return `that's like graphiql or gatsby-node - DOESNT WORK NOW`
      }

      if (context.path.startsWith(`sq--`)) {
        return `static query - DOESNT WORK NOW`
      }

      // TO-DO: validation

      // generate moduleID - this show too many details - will change in future
      const moduleID = generateModuleId({ source, type, importName })

      if (!store.getState().modules.has(moduleID)) {
        // register module
        store.dispatch(
          registerModule({
            source,
            type,
            importName,
          })
        )
      }

      store.dispatch(
        addModuleDependencyToQueryResult({
          path: context.path,
          moduleID,
        })
      )

      // actual working stuff
      return moduleID
    },
  }
}

module.exports = withResolverContext