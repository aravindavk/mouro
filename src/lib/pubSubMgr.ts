import Debug from 'debug'
const debug = Debug('mouro:PubSubMgr')

import { PubSub, PubSubEngine } from 'graphql-subscriptions';

import { PostgresPubSub } from "graphql-postgres-subscriptions";
import { Client } from "pg";

export class PubSubMgr{

    pubSub!:PubSubEngine

    constructor(){
        if(process.env.PG_URL){
            (async ()=>{
                const client = new Client({
                    connectionString: process.env.PG_URL,
                });
                await client.connect();
                this.pubSub = new PostgresPubSub({ client });

                debug("Using PostgresPubSub.")
             })();
        }else{
            this.pubSub = new PubSub();
            debug("Using PubSub (in-memory).")
        }
    }


    getPubSub(){
        return this.pubSub;
    }
}