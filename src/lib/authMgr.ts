import { headersType } from "./commonTypes";
import { DidResolverMgr } from "./didResolverMgr";

const didJWT = require('did-jwt')

export type AuthzConditionType ={
    iss: string,
    from?: string
}

export type AuthDataType = {
    user: string, //DID of the authenticated user.
    authzRead?: AuthzConditionType[]  //Array of authz data for read
    authzDelete?: AuthzConditionType[]  //Array of authz data for delete
}

export type VerifiedJWTType = {
    issuer: string,
    payload: {
        sub: string,
        claim?: any
    }
}
export class AuthMgr {

    didResolverMgr: DidResolverMgr;

    constructor(didResolverMgr: DidResolverMgr) {
        this.didResolverMgr = didResolverMgr
    }

    async verify(authToken: string): Promise<VerifiedJWTType> {
        if (!authToken) throw new Error('no authToken')
        const verifiedToken = await didJWT.verifyJWT(authToken,{resolver: this.didResolverMgr.getResolver()});
        return verifiedToken;
   }

   async verifyAuthorizationHeader(headers: headersType):Promise<VerifiedJWTType|null>{
    let authHead = headers.authorization;
    if(authHead===undefined) authHead = headers.Authorization;
    if(authHead===undefined) return null;

    const parts = authHead.split(" ");
    if (parts.length !== 2) throw Error("Format is Authorization: Bearer [token]");
    const scheme = parts[0];
    if (scheme !== "Bearer") throw Error("Format is Authorization: Bearer [token]");
 
    return await this.verify(parts[1]);
        
   }


   async getAuthData(headers: headersType):Promise<AuthDataType | null>{

    //TODO: Check cache for headers.Authorization

    const authToken=await this.verifyAuthorizationHeader(headers);
    if(authToken==null) return null;
    
    let authData:AuthDataType={
        user: authToken.issuer,
    }

    if(authToken.payload.claim && authToken.payload.claim.access){
        let access: any[] = authToken.payload.claim.access;
        let authzRead: AuthzConditionType[] = [];
        let authzDelete: AuthzConditionType[] = [];
        for(let i=0;i<access.length;i++){
            const authzToken=access[i];
            //Verify token
            try{
                //Decode token
                const authZ=await this.verify(authzToken)

                //Check if authZToken is issues to the right user
                if (authZ.payload.sub == authData.user){
                    const authzCond={
                        iss: authZ.issuer,
                        ...authZ.payload.claim.condition
                    }

                    switch(authZ.payload.claim.action){
                        case('read'): authzRead.push(authzCond);break;
                        case('delete'): authzDelete.push(authzCond);break;
                    }
                }

            }catch(err){ console.log(err.message+' -> '+authzToken)}
        }

        if(authzRead.length>0) authData.authzRead=authzRead;
        if(authzDelete.length>0) authData.authzDelete=authzDelete;
    }

    //TODO: Store Cache
    return authData;
   }

}


