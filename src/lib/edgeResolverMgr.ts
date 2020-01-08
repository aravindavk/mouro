import Debug from 'debug'

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
        const debug = Debug('mouro:EdgeResolverMgr:addEdge')
        debug("edgeJWT: %j",edgeJWT);
        
        //blake2b hash of the original message
        const hash = blake.blake2bHex(edgeJWT)
        debug("hash: %j",hash);

        
        //Verify that the body is a proper JWT
        let verifyOptions: {resolver:any, audience?:string|undefined}={
            resolver: this.didResolverMgr.getResolver()
        }

        //Verify audience to the recipient aud (yes is kind of a hack..)
        const decodedJWT = didJWT.decodeJWT(edgeJWT)
        debug("decodedJWT: %j",decodedJWT)
        
        if(decodedJWT.payload.aud){
            verifyOptions.audience=decodedJWT.payload.aud
        }
        
        //This can take up to 3 sec
        debug("verifyJWT...")
        const verifiedJWT = await didJWT.verifyJWT(edgeJWT,verifyOptions);
        debug("verifiedJWT: %j",decodedJWT)

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
        debug("edgeObject: %j",edgeObject)

        //Persist edge
        debug("storageMgr.addEdge")
        await this.storageMgr.addEdge(edgeObject);
        debug("storageMgr.addEdge success")

        //Return
        let ret:any=edgeObject;
        ret.from={ did: ret.from }
        ret.to={did: ret.to}
        
        
        debug("ret: %j",ret)
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


