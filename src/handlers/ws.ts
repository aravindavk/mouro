import Debug from 'debug'
const debug = Debug('mouro:WSHandler')

import { Context, APIGatewayProxyResult } from 'aws-lambda';
import { APIGatewayWebSocketEvent,createWsHandler, DynamoDBSubscriptionManager, DynamoDBConnectionManager, APIGatewayV2Handler} from 'aws-lambda-graphql';
import { SchemaMgr } from '../lib/schemaMgr';
import { AuthMgr } from '../lib/authMgr';

export class WSHandler {
    
    wsHandler: APIGatewayV2Handler;

    constructor (schemaMgr: SchemaMgr,authMgr: AuthMgr) {
        
        const subscriptionManager = new DynamoDBSubscriptionManager();
        const connectionManager = new DynamoDBConnectionManager({
            subscriptions: subscriptionManager,
        });

        const schema = schemaMgr.getSchema();

        const onConnect = async (headers:any) => {
            debug("onConnect: %O",headers);
            const authData=await authMgr.getAuthData(headers);
            debug("authData: %O",authData);
            return {authData};
          }
      

        this.wsHandler = createWsHandler({
            connectionManager,
            schema,
            subscriptionManager,
            onConnect,
        });
    }

    getHandler(){
        return async (event: APIGatewayWebSocketEvent, context: Context): Promise<void |APIGatewayProxyResult> => {
            debug("handle event: %j",event)
            debug("handle context: %j",context)

            if (
                (event as APIGatewayWebSocketEvent).requestContext != null &&
                (event as APIGatewayWebSocketEvent).requestContext.routeKey != null
            ) {
                // event is web socket event from api gateway v2
                return this.wsHandler(event, context);
            }
            
            throw new Error('Invalid event');
        }
            
    }

    

}
