const makeExecutableSchema = require('graphql-tools').makeExecutableSchema;

import { QueryResolverMgr } from './queryResolverMgr'

export class SchemaMgr {

    queryResolverMgr: QueryResolverMgr;

    constructor(queryResolverMgr: QueryResolverMgr) {
        this.queryResolverMgr = queryResolverMgr
    }

    getSchema() {
        const typeDefs = `
            
            type Query {
                # Return identity for the API token issuer
                me: Identity! 
            }

            #Identity type.
            type Identity {
                # Decentralized Identifier (DID) of the Identity
                did: String!
            }
        `;

        const resolvers = {
            Query: {
                //Return identity for the API token issuer
                me: async (parent: any, args: any, context: any, info: any) => {
                    const res=await this.queryResolverMgr.me(context.headers)
                    return res
                },
            },
        };

        return makeExecutableSchema({
            typeDefs,
            resolvers,
        });
    }

}