import Debug from 'debug'
const debug = Debug('mouro:WSHandler')

import { Context, APIGatewayProxyResult, DynamoDBStreamEvent, APIGatewayEvent, DynamoDBStreamHandler } from 'aws-lambda';
import { APIGatewayWebSocketEvent,createWsHandler, DynamoDBSubscriptionManager, DynamoDBConnectionManager, APIGatewayV2Handler, createDynamoDBEventProcessor} from 'aws-lambda-graphql';
import { SchemaMgr } from '../lib/schemaMgr';
import { AuthMgr } from '../lib/authMgr';

export class WSHandler {
    
    wsHandler: APIGatewayV2Handler;
    eventProcessor: DynamoDBStreamHandler;

    constructor (schemaMgr: SchemaMgr,authMgr: AuthMgr) {
        
        const subscriptionManager = new DynamoDBSubscriptionManager();
        const connectionManager = new DynamoDBConnectionManager({
            subscriptions: subscriptionManager,
        });

        const schema = schemaMgr.getSchema();

        const onConnect = async (headers:any) => {
            debug("onConnect: %j",headers);
            const authData=await authMgr.getAuthData(headers);
            debug("authData: %j",authData);
            return {authData};
          }
      

        this.wsHandler = createWsHandler({
            connectionManager,
            schema,
            subscriptionManager,
            onConnect,
        });

        this.eventProcessor = createDynamoDBEventProcessor({
            connectionManager,
            schema,
            subscriptionManager,
          });
    }

    getHandler(){
        return async (event: APIGatewayEvent | APIGatewayWebSocketEvent | DynamoDBStreamEvent, context: Context): Promise<void |APIGatewayProxyResult> => {
            debug("handle event: %j",event)
            debug("handle context: %j",context)

            // detect event type
            if ((event as DynamoDBStreamEvent).Records != null) {
                // event is DynamoDB stream event
                return this.eventProcessor(event as DynamoDBStreamEvent, context, null as any);
            }
            if (
                (event as APIGatewayWebSocketEvent).requestContext != null &&
                (event as APIGatewayWebSocketEvent).requestContext.routeKey != null
            ) {
                // event is web socket event from api gateway v2
                return this.wsHandler(event as APIGatewayWebSocketEvent, context);
            }
            
            throw new Error('Invalid event');
        }
            
    }

    

}
