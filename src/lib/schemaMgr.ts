import Debug from 'debug'
const debug = Debug('mouro:SchemaMgr')


const makeExecutableSchema = require('graphql-tools').makeExecutableSchema;
import { readFileSync } from 'fs'
import { QueryResolverMgr } from './queryResolverMgr'
import { EdgeResolverMgr } from './edgeResolverMgr';
import {
    DynamoDBEventStore,
    PubSub,
    withFilter,
} from 'aws-lambda-graphql';


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
        const eventStore = new DynamoDBEventStore();
        const pubSub = new PubSub({ eventStore });

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
                    pubSub.publish('EDGE_ADDED', { edgeAdded: res });
                    return res
                }, 
            },
            Subscription: {
                edgeAdded:{
                    resolve: (rootValue: any) => {
                        debug("Subscription.edgeAdded.resolve: %O",rootValue)
                        return rootValue;
                    },
                    subscribe: withFilter(
                        pubSub.subscribe('EDGE_ADDED'),
                        (rootValue, args, context) => {
                            debug("Subscription.edgeAdded.subscribe rootValue: %O",rootValue)
                            debug("Subscription.edgeAdded.subscribe args: %O",args)
                            debug("Subscription.edgeAdded.subscribe context: %O",context)

                            return true;
                            
                            /*
                            const edge=rootValue.edgeAdded;
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
                            */
                        },
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
