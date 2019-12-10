import Debug from 'debug'
const debug = Debug('mouro:EdgeResolverMgr')

const blake = require('blakejs')

import { StorageMgr, PersistedEdgeType } from "./storageMgr";
import { DidResolverMgr } from "./didResolverMgr";
import * as didJWT from 'did-jwt'

export class EdgeResolverMgr {

    storageMgr: StorageMgr;
    didResolverMgr: DidResolverMgr;

    constructor(didResolverMgr: DidResolverMgr, storageMgr: StorageMgr) {
        this.didResolverMgr = didResolverMgr
        this.storageMgr = storageMgr
    }

    async addEdge(edgeJWT: string){
        debug("addEdge edgeJWT: %j",edgeJWT);
        
        //blake2b hash of the original message
        const hash = blake.blake2bHex(edgeJWT)
        debug("addEdge hash: %j",hash);

        
        //Verify that the body is a proper JWT
        let verifyOptions: {resolver:any, audience?:string|undefined}={
            resolver: this.didResolverMgr.getResolver()
        }

        //Verify audience to the recipient aud (yes is kind of a hack..)
        const decodedJWT = didJWT.decodeJWT(edgeJWT)
        debug("addEdge decodedJWT: %j",decodedJWT)
        
        if(decodedJWT.payload.aud){
            verifyOptions.audience=decodedJWT.payload.aud
        }
        
        //This can take up to 3 sec
        debug("addEdge verifyJWT...")
        const verifiedJWT = await didJWT.verifyJWT(edgeJWT,verifyOptions);
        debug("addEdge verifiedJWT: %j",decodedJWT)

        const pl=verifiedJWT.payload;

        const edgeObject:PersistedEdgeType={
            hash: hash,
            jwt: edgeJWT,
            from: pl.iss,
            to:   pl.sub || pl.aud,
            type:  pl.type,
            time: pl.iat,
            visibility: this.visToVisibility(pl.vis),
            retention: pl.ret,
            tag:  pl.tag,
            data: pl.data
        }
        debug("addEdge edgeObject: %j",edgeObject)

        //Persist edge
        await this.storageMgr.addEdge(edgeObject);

        //Return
        let ret:any=edgeObject;
        ret.from={ did: ret.from }
        ret.to={did: ret.to}
        
        
        debug("addEdge ret: %j",ret)
        return ret;
    }

    visToVisibility(vis:string):string{
        //Default visibility is BOTH
        const DEFAULT='BOTH';
        if(vis == undefined) return DEFAULT;

        if(vis.toUpperCase()=='TO') return 'TO';
        if(vis.toUpperCase()=='BOTH') return 'BOTH';
        if(vis.toUpperCase()=='ANY') return 'ANY';

        return DEFAULT;

    }
}


