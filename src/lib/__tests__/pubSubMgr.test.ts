import {PubSubMgr} from '../pubSubMgr';

jest.mock("pg");
const { Client } = require("pg");
let pgClientMock = {
  connect: jest.fn()
};
Client.mockImplementation(() => {
  return pgClientMock;
});

describe('PubSubMgr', () => {

  let sut: PubSubMgr;


  beforeAll((done) =>{
    sut = new PubSubMgr();
    done();
  })

  test('empty constructor', () => {
    expect(sut).not.toBeUndefined();
  });

  test('PgPubSub', () => {
    process.env.PG_URL='FAKE_PG_URL';
    try{
        const sM=new PubSubMgr();
        expect(sM).not.toBeUndefined();
    }catch(err){
        fail(err)
    }
  });

  test('getPubSub()', ()=>{
      expect(sut.getPubSub()).not.toBeNull()
  })

});