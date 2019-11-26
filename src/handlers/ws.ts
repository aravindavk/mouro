import { Context, APIGatewayProxyResult } from 'aws-lambda';
import { APIGatewayWebSocketEvent,createWsHandler, DynamoDBSubscriptionManager, DynamoDBConnectionManager, APIGatewayV2Handler} from 'aws-lambda-graphql';
import { SchemaMgr } from '../lib/schemaMgr';

export class WSHandler {
    
    wsHandler: APIGatewayV2Handler;
    schemaMgr: SchemaMgr;

    constructor (schemaMgr: SchemaMgr) {
        this.schemaMgr=schemaMgr;
        
        const subscriptionManager = new DynamoDBSubscriptionManager();
        const connectionManager = new DynamoDBConnectionManager({
            subscriptions: subscriptionManager,
        });

        const schema = this.schemaMgr.getSchema();

        const onConnect = async (headers:any) =>{
            console.log("onConnect: headers");
            console.log(headers);
            //const authData=await authMgr.getAuthData(headers);
            //console.log(authData);
            //return {authData};
            return {};
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
        
            if (
                (event as APIGatewayWebSocketEvent).requestContext != null &&
                (event as APIGatewayWebSocketEvent).requestContext.routeKey != null
            ) {
                // event is web socket event from api gateway v2
                console.log("WEB SOCKET EVENT")
                console.log(event)
                console.log(context)
                return this.wsHandler(event, context);
            }
            
            throw new Error('Invalid event');
        }
            
    }

    

}
