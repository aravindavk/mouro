import { Context } from 'aws-lambda';
import { APIGatewayWebSocketEvent,createWsHandler, DynamoDBSubscriptionManager, DynamoDBConnectionManager} from 'aws-lambda-graphql';
import { SchemaMgr } from '../lib/schemaMgr';

export class WSHandler {
    
    wsHandler: any;
    schemaMgr: SchemaMgr;

    constructor (schemaMgr: SchemaMgr) {
        this.schemaMgr=schemaMgr;
        
        const subscriptionManager = new DynamoDBSubscriptionManager();
        const connectionManager = new DynamoDBConnectionManager({
            subscriptions: subscriptionManager,
        });

        const schema = this.schemaMgr.getSchema();

        this.wsHandler = createWsHandler({
            connectionManager,
            schema,
            subscriptionManager,
        });
    }


    async handle(event: APIGatewayWebSocketEvent, context: Context) {
        
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
