"use strict";

//Load Mgrs
import {DidResolverMgr} from './lib/didResolverMgr';
import {AuthMgr} from './lib/authMgr';
import {StorageMgr} from './lib/storageMgr';
import {QueryResolverMgr} from "./lib/queryResolverMgr";
import {EdgeResolverMgr} from './lib/edgeResolverMgr';
import {SchemaMgr} from './lib/schemaMgr';

//Instanciate Mgr
let didResolverMgr = new DidResolverMgr();
let authMgr = new AuthMgr(didResolverMgr);
let storageMgr = new StorageMgr();
let queryResolverMgr = new QueryResolverMgr(authMgr,storageMgr);
let edgeResolverMgr = new EdgeResolverMgr(didResolverMgr,storageMgr);
let schemaMgr = new SchemaMgr(queryResolverMgr,edgeResolverMgr);

//Load handlers
import {GraphQLHandler} from "./handlers/graphql";

//Instanciate handlers
const graphqlHandler = (new GraphQLHandler(schemaMgr)).getHandler()

//Exports for serverless
exports.graphql = graphqlHandler;
