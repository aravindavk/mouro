import {SchemaMgr} from '../schemaMgr';
import { GraphQLSchema, Kind } from 'graphql';
import { QueryResolverMgr } from '../queryResolverMgr';
import { EdgeResolverMgr } from '../edgeResolverMgr';
import { AuthMgr } from '../authMgr';
import { StorageMgr } from '../storageMgr';
import { DidResolverMgr } from '../didResolverMgr';

jest.mock('../queryResolverMgr')
jest.mock('../edgeResolverMgr')
jest.mock('../storageMgr')

describe('SchemaMgr', () => {

    let mockDidResolverMgr:DidResolverMgr=new DidResolverMgr();
    let mockAuthMgr:AuthMgr=new AuthMgr(mockDidResolverMgr);
    let mockStorageMgr:StorageMgr= new StorageMgr();

    let mockQueryResolverMgr:QueryResolverMgr=new QueryResolverMgr(mockAuthMgr,mockStorageMgr);
    let mockEdgeResolverMgr:EdgeResolverMgr=new EdgeResolverMgr(mockDidResolverMgr,mockStorageMgr);
    let sut: SchemaMgr;

    beforeAll((done) =>{
        sut = new SchemaMgr(mockQueryResolverMgr, mockEdgeResolverMgr);
        done();
    })

    test('empty constructor', () => {
        expect(sut).not.toBeUndefined();
    });

    describe('getResolver',()=>{

        test('Query.me',(done)=>{
            mockQueryResolverMgr.me=jest.fn().mockImplementationOnce((h)=>{return h})
            const me = sut._getResolvers()['Query'].me;
            me({},{},{headers: 'head'},{})
            .then((res:any)=>{
                expect(res).toEqual('head');
                expect(mockQueryResolverMgr.me).toBeCalledWith('head')
                done();
            })
        })

        test('Query.edgeByHash',(done)=>{
            mockQueryResolverMgr.edgeByHash=jest.fn().mockImplementationOnce((h,hs)=>{return [h,hs]})
            const edgeByHash = sut._getResolvers()['Query'].edgeByHash;
            edgeByHash({},{hash: 'hash'},{headers: 'head'},{})
            .then((res:any)=>{
                expect(res).toEqual(['head','hash']);
                expect(mockQueryResolverMgr.edgeByHash).toBeCalledWith('head','hash')
                done();
            })
        })

        test('Query.findEdges',(done)=>{
            mockQueryResolverMgr.findEdges=jest.fn().mockImplementationOnce((h,args)=>{return [h,args]})
            const findEdges = sut._getResolvers()['Query'].findEdges;
            findEdges({},'args',{headers: 'head'},{})
            .then((res:any)=>{
                expect(res).toEqual(['head','args']);
                expect(mockQueryResolverMgr.findEdges).toBeCalledWith('head','args')
                done();
            })
        })

        test('Mutation.addEdge',(done)=>{
            mockEdgeResolverMgr.addEdge=jest.fn().mockImplementationOnce((e)=>{return [e]})
            const addEdge = sut._getResolvers()['Mutation'].addEdge;
            addEdge({},{edgeJWT: 'edge'},{},{})
            .then((res:any)=>{
                expect(res).toEqual(['edge']);
                expect(mockEdgeResolverMgr.addEdge).toBeCalledWith('edge')
                done();
            })
        })

        describe('Subscription.edgeAdded',()=>{

            test('visibility: ANY',(done)=>{
                const edge={ visibility: 'ANY'}
                mockEdgeResolverMgr.addEdge=jest.fn().mockImplementationOnce((e)=>{return edge})
    
                const resolvers= sut._getResolvers();
                const edgeAdded =resolvers['Subscription'].edgeAdded;
                const subscribe=edgeAdded.subscribe({},{},{},{})
                
                resolvers['Mutation'].addEdge({},{edgeJWT: 'edge'},{},{})
                .then(()=>{ return subscribe.next() })
                .then((result:any)=>{
                    expect(result.value).toEqual({edgeAdded: edge});
                    done();
                })
            })

            test('visibility: TO',(done)=>{
                const edge={ visibility: 'TO', to: {did: 'did:test'}}
                mockEdgeResolverMgr.addEdge=jest.fn().mockImplementationOnce((e)=>{return edge})
    
                const resolvers= sut._getResolvers();
                const edgeAdded =resolvers['Subscription'].edgeAdded;
                const subscribe=edgeAdded.subscribe({},{},{authData: {user: 'did:test'}},{})
                
                resolvers['Mutation'].addEdge({},{edgeJWT: 'edge'},{},{})
                .then(()=>{ return subscribe.next() })
                .then((result:any)=>{
                    expect(result.value).toEqual({edgeAdded: edge});
                    done();
                })
            })

            test('visibility: BOTH (to)',(done)=>{
                const edge={ visibility: 'BOTH', to: {did: 'did:testTo'}}
                mockEdgeResolverMgr.addEdge=jest.fn().mockImplementationOnce((e)=>{return edge})
    
                const resolvers= sut._getResolvers();
                const edgeAdded =resolvers['Subscription'].edgeAdded;
                const subscribe=edgeAdded.subscribe({},{},{authData: {user: 'did:testTo'}},{})
                
                resolvers['Mutation'].addEdge({},{edgeJWT: 'edge'},{},{})
                .then(()=>{ return subscribe.next() })
                .then((result:any)=>{
                    expect(result.value).toEqual({edgeAdded: edge});
                    done();
                })
            })

            test('visibility: BOTH (from)',(done)=>{
                const edge={ visibility: 'BOTH', to: {did: 'did:testTo'}, from: {did: 'did:testFrom'}}
                mockEdgeResolverMgr.addEdge=jest.fn().mockImplementationOnce((e)=>{return edge})
    
                const resolvers= sut._getResolvers();
                const edgeAdded =resolvers['Subscription'].edgeAdded;
                const subscribe=edgeAdded.subscribe({},{},{authData: {user: 'did:testFrom'}},{})
                
                resolvers['Mutation'].addEdge({},{edgeJWT: 'edge'},{},{})
                .then(()=>{ return subscribe.next() })
                .then((result:any)=>{
                    expect(result.value).toEqual({edgeAdded: edge});
                    done();
                })
            })


            test('filter fromDID',(done)=>{
                const edge={ visibility: 'ANY',  from: {did: 'did:testFrom'}}
                mockEdgeResolverMgr.addEdge=jest.fn().mockImplementationOnce((e)=>{return edge})
    
                const resolvers= sut._getResolvers();
                const edgeAdded =resolvers['Subscription'].edgeAdded;
                const subscribe=edgeAdded.subscribe({},{fromDID:'did:testFrom'},{},{})
                
                resolvers['Mutation'].addEdge({},{edgeJWT: 'edge'},{},{})
                .then(()=>{ return subscribe.next() })
                .then((result:any)=>{
                    expect(result.value).toEqual({edgeAdded: edge});
                    done();
                })
            })

            test('filter toDID',(done)=>{
                const edge={ visibility: 'ANY',  to: {did: 'did:testTo'}}
                mockEdgeResolverMgr.addEdge=jest.fn().mockImplementationOnce((e)=>{return edge})
    
                const resolvers= sut._getResolvers();
                const edgeAdded =resolvers['Subscription'].edgeAdded;
                const subscribe=edgeAdded.subscribe({},{toDID:'did:testTo'},{},{})
                
                resolvers['Mutation'].addEdge({},{edgeJWT: 'edge'},{},{})
                .then(()=>{ return subscribe.next() })
                .then((result:any)=>{
                    expect(result.value).toEqual({edgeAdded: edge});
                    done();
                })
            })


            test('filter type',(done)=>{
                const edge={ visibility: 'ANY',  type: 'testType'}
                mockEdgeResolverMgr.addEdge=jest.fn().mockImplementationOnce((e)=>{return edge})
    
                const resolvers= sut._getResolvers();
                const edgeAdded =resolvers['Subscription'].edgeAdded;
                const subscribe=edgeAdded.subscribe({},{type:'testType'},{},{})
                
                resolvers['Mutation'].addEdge({},{edgeJWT: 'edge'},{},{})
                .then(()=>{ return subscribe.next() })
                .then((result:any)=>{
                    expect(result.value).toEqual({edgeAdded: edge});
                    done();
                })
            })

            test('filter tag',(done)=>{
                const edge={ visibility: 'ANY',  tag: 'testTag'}
                mockEdgeResolverMgr.addEdge=jest.fn().mockImplementationOnce((e)=>{return edge})
    
                const resolvers= sut._getResolvers();
                const edgeAdded =resolvers['Subscription'].edgeAdded;
                const subscribe=edgeAdded.subscribe({},{tag:'testTag'},{},{})
                
                resolvers['Mutation'].addEdge({},{edgeJWT: 'edge'},{},{})
                .then(()=>{ return subscribe.next() })
                .then((result:any)=>{
                    expect(result.value).toEqual({edgeAdded: edge});
                    done();
                })
            })

        })

    })

    test('getSchema', ()=> {
        const schema:GraphQLSchema =sut.getSchema();
        expect(schema).toBeInstanceOf(GraphQLSchema)
    })

});
