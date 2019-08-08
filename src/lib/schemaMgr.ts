const makeExecutableSchema = require('graphql-tools').makeExecutableSchema;
import { PubSub, withFilter } from 'graphql-subscriptions';
import { readFileSync } from 'fs'
import { QueryResolverMgr } from './queryResolverMgr'
import { EdgeResolverMgr } from './edgeResolverMgr';

export class SchemaMgr {

    queryResolverMgr: QueryResolverMgr;
    edgeResolverMgr: EdgeResolverMgr;

    constructor(queryResolverMgr: QueryResolverMgr, edgeResolverMgr: EdgeResolverMgr) {
        this.queryResolverMgr = queryResolverMgr
        this.edgeResolverMgr = edgeResolverMgr
    }

    _getTypeDefs(){
        return readFileSync(__dirname + '/schema.graphqls', 'utf8')
    }

    _getResolvers(){
        const pubsub = new PubSub();

        return {
            Query: {
                //Return identity for the API token issuer
                me: async (parent: any, args: any, context: any, info: any) => {
                    const res=await this.queryResolverMgr.me(context.headers)
                    return res
                },
                // Return an edge by hash
                edgeByHash: async (parent: any, args: any, context: any, info: any) => {
                    const res=await this.queryResolverMgr.edgeByHash(context.headers,args.hash)
                    return res
                },
                //Find edges
                findEdges: async (parent: any, args: any, context: any, info: any) => {
                    const res=await this.queryResolverMgr.findEdges(context.headers,args)
                    return res
                },
            },
            VisibilityEnum: {
                'TO': 'TO',
                'BOTH': 'BOTH',
                'ANY': 'ANY'
            },
            Mutation: {
                addEdge: async (parent: any, args: any, context: any, info: any) => {
                    const res=await this.edgeResolverMgr.addEdge(args.edgeJWT)
                    pubsub.publish('edgeAdded', { edgeAdded: res });
                    return res
                }, 
            },
            Subscription: {
                edgeAdded:{
                  subscribe: withFilter(
                    () => pubsub.asyncIterator('edgeAdded'),
                    (payload, args,context) => {
                      console.log("PAYLOAD")
                      console.log(payload)
                      console.log("ARGS")
                      console.log(args)
                      console.log("CONTEXT")
                      console.log(context)
  
                      const edge=payload.edgeAdded;
                      const authData=context.authData;
                      
                      //Allowed by visibility
                      let isAllowed=false;
                      if(edge.visibility=='ANY') isAllowed=true;
                      if(edge.visibility=='TO' && edge.to.did==authData.user) isAllowed=true;
                      if(edge.visibility=='BOTH' && 
                            (edge.to.did==authData.user || edge.from.did==authData.user)) isAllowed=true;
                      console.log("isAllowed: "+isAllowed);

                      //Args filters
                      const inFromDID=((!args.fromDID) || (args.fromDID && args.fromDID.indexOf(edge.from.did)>=0))
                      const inToDID=((!args.toDID) || (args.toDID && args.toDID.indexOf(edge.to.did)>=0))
                      const inType=((!args.type) || (args.type && args.type.indexOf(edge.type)>=0))
                      const inTag=((!args.tag) || (args.tag && args.tag.indexOf(edge.tag)>=0))
                      
                      return isAllowed && inFromDID && inToDID && inType && inTag ;
                    }
                  )
                }
              }

        };

    }

    getSchema() {
        const typeDefs=this._getTypeDefs();
        const resolvers = this._getResolvers();
        return makeExecutableSchema({
            typeDefs,
            resolvers,
        });
    }

}
