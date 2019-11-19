import { DidResolverMgr } from "../didResolverMgr";

process.env.INFURA_PROJECT_ID='fakeINFURA_PROJECT_ID'


describe('DidResolverMgr', () => {

    let sut: DidResolverMgr;

    beforeAll((done) =>{
        sut = new DidResolverMgr();
        done();
    })

    test('empty constructor', () => {
        expect(sut).not.toBeUndefined();
        console.log(sut.resolvers);
        expect(sut.resolvers.ethr).toBeDefined();            
        expect(sut.resolvers.web).toBeDefined();            
        expect(sut.resolvers.nacl).toBeDefined();            
    });

    test('no infura project id', () => {
        delete process.env.INFURA_PROJECT_ID;
        let didres=new DidResolverMgr();
        expect(didres.resolvers.ethr).not.toBeDefined();            
    });

    test('getResolver()', ()=>{
        const res=sut.getResolver();
        expect(res).toBeDefined();
    })
})