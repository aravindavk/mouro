import { AuthMgr } from "../lib/authMgr";
import { StorageMgr } from "../lib/storageMgr";

export class WSConnectHandler {

    authMgr: AuthMgr;
    storageMgr: StorageMgr;

    constructor (authMgr: AuthMgr,storageMgr: StorageMgr) {
        this.authMgr=authMgr
        this.storageMgr=storageMgr
    }

    formatError(error: any){
        console.error(error);
        return error;
    }

    async handle(event: any,context: any, cb: any) {
        console.log("Starting...")
        console.log(event.requestContext);
        cb(null,'');
        return;
    }
}