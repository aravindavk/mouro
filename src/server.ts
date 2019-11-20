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

const { ApolloServer } = require('apollo-server-express');
const schema = schemaMgr.getSchema()
const server = new ApolloServer({
  schema,
  context: async (p:any) => {
    //https://www.apollographql.com/docs/apollo-server/features/subscriptions/#context-with-subscriptions
    if (p.connection) {
      return p.connection.context;
    } else {
      return ({
        headers: p.req.headers
      });
    }
  },
  introspection: true,
  graphqlPath:'/graphql',
  subscriptions: {
    onConnect: async (headers:any, webSocket:any) => {
      console.log("onConnect: headers");
      console.log(headers);
      const authData=await authMgr.getAuthData(headers);
      console.log(authData);
      return {authData};
    }
  }
});

import * as express from "express";
const app = express();
server.applyMiddleware({ app }); // app is from an existing express app

const http = require('http');
const httpServer = http.createServer(app);
server.installSubscriptionHandlers(httpServer);


const PORT = process.env.PORT || 3000;

// ⚠️ Pay attention to the fact that we are calling `listen` on the http server variable, and not on `app`.
httpServer.listen(PORT, () => {
  console.log(`🚀 Server ready at http://localhost:${PORT}${server.graphqlPath}`)
  console.log(`🚀 Subscriptions ready at ws://localhost:${PORT}${server.subscriptionsPath}`)
})
