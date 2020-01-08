import Debug from 'debug'
const debug = Debug('mouro:SchemaMgr')


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
                    const debug = Debug('mouro:SchemaMgr:Query:me')
                    debug("%j %j %j %j",parent,args,context,info)

                    debug("this.queryResolverMgr.me %j",context.headers);
                    const res=await this.queryResolverMgr.me(context.headers)
                    debug("this.queryResolverMgr.me success");
                    return res
                },
                // Return an edge by hash
                edgeByHash: async (parent: any, args: any, context: any, info: any) => {
                    const debug = Debug('mouro:SchemaMgr:Query:edgeByHash')
                    debug("%j %j %j %j",parent,args,context,info)

                    debug("this.queryResolverMgr.edgeByHash %j %j",context.headers, args.hash);
                    const res=await this.queryResolverMgr.edgeByHash(context.headers,args.hash)
                    debug("this.queryResolverMgr.edgeByHash success");
                    return res
                },
                //Find edges
                findEdges: async (parent: any, args: any, context: any, info: any) => {
                    const debug = Debug('mouro:SchemaMgr:Query:findEdges')
                    debug("%j %j %j %j",parent,args,context,info)
                    
                    debug("this.queryResolverMgr.findEdges %j %j",context.headers, args);
                    const res=await this.queryResolverMgr.findEdges(context.headers,args)
                    debug("this.queryResolverMgr.findEdges success");
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
                    const debug = Debug('mouro:SchemaMgr:Mutation:addEdge')
                    debug("%j %j %j %j",parent,args,context,info)

                    debug("this.edgeResolverMgr.addEdge %s",args.edgeJWT)
                    const res=await this.edgeResolverMgr.addEdge(args.edgeJWT)
                    debug("this.edgeResolverMgr.addEdge success")

                    debug("pubsub.publish %j",{ edgeAdded: res })
                    await pubsub.publish('EDGE_ADDED', { edgeAdded: res });
                    debug("pubsub.publish success")
                    return res
                }, 
            },
            Subscription: {
                edgeAdded:{
                  subscribe: withFilter(
                    () => pubsub.asyncIterator('EDGE_ADDED'),
                    (payload, args,context) => {
                      const debug = Debug('mouro:SchemaMgr:Subscription:edgeAdded:subscribe')
                    
                      debug("%j %j %j",payload,args,context)
  
                      const edge=payload.edgeAdded;
                      const authData=context.authData;
                      
                      //Allowed by visibility
                      let isAllowed=false;
                      if(edge.visibility=='ANY') isAllowed=true;
                      if(edge.visibility=='TO' && edge.to.did==authData.user) isAllowed=true;
                      if(edge.visibility=='BOTH' && 
                            (edge.to.did==authData.user || edge.from.did==authData.user)) isAllowed=true;
                    
                      debug("isAllowed: %j",isAllowed);

                      //Args filters
                      const inFromDID=((!args.fromDID) || (args.fromDID && args.fromDID.indexOf(edge.from.did)>= 0))
                      const inToDID=((!args.toDID) || (args.toDID && args.toDID.indexOf(edge.to.did)>= 0))
                      const inType=((!args.type) || (args.type && args.type.indexOf(edge.type)>= 0))
                      const inTag=((!args.tag) || (args.tag && args.tag.indexOf(edge.tag)>= 0))
                      
                      debug("inFromDID:%j inToDID:%j inType:%j inTag:%j",inFromDID,inToDID,inType,inTag);
                      
                      const ret=isAllowed && inFromDID && inToDID && inType && inTag
                      debug("ret %j",ret);

                      return ret ;
                    }
                  ),
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
