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
        console.log("edgeJWT:"+edgeJWT);
        
        //blake2b hash of the original message
        const hash = blake.blake2bHex(edgeJWT)
        console.log("hash:"+hash);

        
        //Verify that the body is a proper JWT
        let verifyOptions: {resolver:any, audience?:string|undefined}={
            resolver: this.didResolverMgr.getResolver()
        }

        //Verify audience to the recipient aud (yes is kind of a hack..)
        console.log("decodeJWT...")
        const decodedJWT = didJWT.decodeJWT(edgeJWT)
        console.log(decodedJWT)
        
        if(decodedJWT.payload.aud){
            verifyOptions.audience=decodedJWT.payload.aud
        }
        
        //This can take up to 3 sec
        console.log("verifyJWT...")
        const verifiedJWT = await didJWT.verifyJWT(edgeJWT,verifyOptions);
        console.log(verifiedJWT);

        const pl=verifiedJWT.payload;

        const edgeObject:PersistedEdgeType={
            hash: hash,
            jwt: edgeJWT,
            from: pl.iss,
            to:   pl.sub,
            type:  pl.type,
            time: pl.iat,
            visibility: this.visToVisibility(pl.vis),
            retention: pl.ret,
            tag:  pl.tag,
            data: pl.data
        }
        console.log("edge decoded")
        console.log(edgeObject);

        //Persist edge
        await this.storageMgr.addEdge(edgeObject);

        //Return
        let ret:any=edgeObject;
        ret.from={ did: ret.from }
        ret.to={did: ret.to}
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


