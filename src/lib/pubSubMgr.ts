import Debug from 'debug'
const debug = Debug('mouro:PubSubMgr')

import { PubSub, PubSubEngine } from 'graphql-subscriptions';

import { PostgresPubSub } from "graphql-postgres-subscriptions";
const { Client } = require('pg')

export class PubSubMgr{

    pubSub!:PubSubEngine
    pubSubClass!:string

    constructor(){
        if(process.env.PG_URL){
            this.pubSubClass="PostgresPubSub";
            (async ()=>{
                const client = new Client({
                    connectionString: process.env.PG_URL,
                });
                await client.connect();
                this.pubSub = new PostgresPubSub({ client });
             })();
        }else{
            this.pubSubClass="PubSub";
            this.pubSub = new PubSub();
        }

        debug("Using %s.",this.pubSubClass);
    }


    getPubSub(){
        const debug = Debug('mouro:PubSubMgr:getPubSub')

        debug("%s init: %o",this.pubSubClass, this.pubSub!==undefined);
        return this.pubSub;
    }
}