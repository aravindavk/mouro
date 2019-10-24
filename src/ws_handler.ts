"use strict";

//Load Mgrs
import {AuthMgr} from './lib/authMgr';
import {StorageMgr} from './lib/storageMgr';

//Instanciate Mgr
let authMgr = new AuthMgr();
let storageMgr = new StorageMgr();

//Load handlers
import {WSConnectHandler} from "./handlers/ws_connect";

//Instanciate handlers
const wsConnectHandler = (new WSConnectHandler(authMgr,storageMgr));

//Exports for serverless
exports.wsConnect = wsConnectHandler;