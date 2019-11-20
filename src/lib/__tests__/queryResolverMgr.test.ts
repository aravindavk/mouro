import {QueryResolverMgr} from '../queryResolverMgr';

const { Credentials } = require('uport-credentials')
const {did, privateKey} = Credentials.createIdentity();
const credentials = new Credentials({
    appName: 'Test App', did, privateKey
})

import { StorageMgr } from '../storageMgr';
import { AuthMgr } from '../authMgr';
import { DidResolverMgr } from '../didResolverMgr';

jest.mock('../storageMgr')
jest.mock('../authMgr')

describe('QueryResolverMgr', () => {
    
    let sut: QueryResolverMgr;
    let mockStorageMgr:StorageMgr=new StorageMgr();
    let mockDidResolverMgr:DidResolverMgr=new DidResolverMgr();
    let mockAuthMgr:AuthMgr=new AuthMgr(mockDidResolverMgr);
    let validToken='';

    beforeAll((done) =>{
        sut = new QueryResolverMgr(mockAuthMgr,mockStorageMgr);

        const payload={
            sub: did,
            claim:{
                token: 'valid'
            }
        }
        credentials.signJWT(payload)
        .then((token: string)=>{
            validToken=token;
        }).then(done);
    })

    test('empty constructor', () => {
        expect(sut).not.toBeUndefined();
    });


    describe("me()", () => {
        mockAuthMgr.verifyAuthorizationHeader=
            jest.fn().mockImplementationOnce(()=>{throw Error('fail')})

        test('authMgr.verifyAuthorizarionHeader fail', (done)=> {
            sut.me({authorization: 'Bearer '+validToken})
            .then(()=> {
                fail("shouldn't return"); done()
            })
            .catch( (err: Error)=>{
                expect(err.message).toEqual('fail')
                done()
            })
        })

        test('null token', (done)=> {
            mockAuthMgr.verifyAuthorizationHeader=
                jest.fn().mockResolvedValueOnce(null);
    
                sut.me({})
            .then((resp: any)=> {
                expect(resp).not.toBeNull();
                expect(resp).toEqual({})
                done();
            })
            .catch( (err: Error)=>{
                fail(err); done()
            })
        })

        test('valid token', (done)=> {
            mockAuthMgr.verifyAuthorizationHeader=
                jest.fn().mockResolvedValueOnce({issuer: did});
    
                sut.me({authorization: 'Bearer '+validToken})
            .then((resp: any)=> {
                expect(resp).not.toBeNull();
                expect(resp.did).toEqual(did)
                done();
            })
            .catch( (err: Error)=>{
                fail(err); done()
            })
        })
    })

    describe("edgeByHash()", () => {

        test('authMgr.getAuthData fail', (done)=> {
            mockAuthMgr.getAuthData=
                jest.fn().mockImplementationOnce(()=>{throw Error('fail')})
            sut.edgeByHash({authorization: 'Bearer '+validToken},'hash')
            .then(()=> {
                fail("shouldn't return"); done()
            })
            .catch( (err: Error)=>{
                expect(err.message).toEqual('fail')
                done()
            })
        })

        test('storageMgr.getEdge fail', (done)=> {
            mockAuthMgr.getAuthData=
                jest.fn().mockResolvedValue({user: did})
            mockStorageMgr.getEdge=
                jest.fn().mockImplementationOnce(()=>{throw Error('failS')})
            sut.edgeByHash({authorization: 'Bearer '+validToken},'hash')
            .then(()=> {
                fail("shouldn't return"); done()
            })
            .catch( (err: Error)=>{
                expect(err.message).toEqual('failS')
                done()
            })
        })

        test('storageMgr.getEdge returns null', (done)=> {
            mockAuthMgr.getAuthData=
                jest.fn().mockResolvedValue({user: did})
                mockStorageMgr.getEdge=
                jest.fn().mockResolvedValue(null)
            sut.edgeByHash({authorization: 'Bearer '+validToken},'hash')
            .then((resp)=> {
                expect(resp).toBeNull();
                done()
            })
        })

        
        test('valid hash', (done)=> {
            mockAuthMgr.getAuthData=
                jest.fn().mockResolvedValue({user: did})
            mockStorageMgr.getEdge=
                jest.fn().mockResolvedValue({from: 'other-did', to: did, claim:{}})

            sut.edgeByHash({authorization: 'Bearer '+validToken},'hash')
            .then((resp: any)=> {
                expect(resp).not.toBeNull();
                expect(resp.from).toEqual({did: 'other-did'})
                expect(resp.to).toEqual({did: did})
                expect(resp.claim).toEqual("{}")
                done();
            })
            .catch( (err: Error)=>{
                fail(err); done()
            })
        })
    })

    describe("findEdges()", ()=>{

        test('authMgr.getAuthData fail', (done)=> {
            mockAuthMgr.getAuthData=
                jest.fn().mockImplementationOnce(()=>{throw Error('fail')})
            sut.findEdges({authorization: 'Bearer '+validToken},'args')
            .then(()=> {
                fail("shouldn't return"); done()
            })
            .catch( (err: Error)=>{
                expect(err.message).toEqual('fail')
                done()
            })
        })

        test('storageMgr.findEdges fail', (done)=> {
            mockAuthMgr.getAuthData=
                jest.fn().mockResolvedValue({})
            mockStorageMgr.findEdges=
                jest.fn().mockImplementationOnce(()=>{throw Error('failS')})
            sut.findEdges({authorization: 'Bearer '+validToken},'args')
            .then(()=> {
                fail("shouldn't return"); done()
            })
            .catch( (err: Error)=>{
                expect(err.message).toEqual('failS')
                done()
            })
        })

        test('happy path', (done)=> {
            mockAuthMgr.getAuthData=
                jest.fn().mockResolvedValue({})
            mockStorageMgr.findEdges=
                jest.fn().mockResolvedValue([{from: 'other-did', to: did, claim:{}}])
            sut.findEdges({authorization: 'Bearer '+validToken},'args')
            .then((resp: any)=> {
                expect(resp).not.toBeNull();
                expect(resp[0]).not.toBeNull();
                expect(resp[0].from).toEqual({did: 'other-did'})
                expect(resp[0].to).toEqual({did: did})
                expect(resp[0].claim).toEqual("{}")
                done();
            })
            .catch( (err: Error)=>{
                fail(err); done()
            })
        })

    })

});
