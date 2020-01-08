import Debug from 'debug'
const debug = Debug('mouro:PgMgr')

import { PersistedEdgeType, StorageInterface } from "./storageMgr";
import { AuthDataType, AuthzConditionType } from "./authMgr";
const { Client } = require('pg')
const sql = require('sql-bricks-postgres');

module.exports = class PgMgr implements StorageInterface{

  constructor() {
    debug("Pg Driver Started.")
  }

  _getClient(){
    return new Client({
      connectionString: process.env.PG_URL,
    })
  }

  async init(){
    const debug = Debug('mouro:PgMgr:init')

    const sql=`
    CREATE TABLE IF NOT EXISTS edges
    (
      hash CHAR(128) NOT NULL, 
      "from" VARCHAR(64) NOT NULL, 
      "to" VARCHAR(64) NOT NULL, 
      type VARCHAR(128) NULL, 
      "time" INTEGER NOT NULL, -- from iat
      visibility VARCHAR(4) NOT NULL,
      retention INTEGER NULL,
      tag VARCHAR(128) NULL, 
      data TEXT NULL, 
      jwt TEXT NOT NULL,
      CONSTRAINT edges_pkey PRIMARY KEY (hash),
      CHECK (visibility IN ('TO', 'BOTH', 'ANY'))
    )
    `
    const client = this._getClient();
    try {
      await client.connect()
      debug("client.query %s",sql)
      const res = await client.query(sql);
      debug("client query success")
      return res;
    } catch (e) {
      debug(e)
      throw (e);
    } finally {
      await client.end()
    }
  }

  async addEdge(edge: PersistedEdgeType){
    const debug = Debug('mouro:PgMgr:addEdge')

    //Store edge
    const sql=`
    INSERT INTO edges
    (
      hash, 
      "from", 
      "to", 
      type, 
      "time",
      visibility,
      retention,
      tag, 
      data,
      jwt
    )
    VALUES
    ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
    ON CONFLICT ON CONSTRAINT edges_pkey 
    DO NOTHING;
    `
    const client = this._getClient();
    try {
      debug("client.connect");
      await client.connect()
      debug("client.connect success");

      const values=[
        edge.hash,
        edge.from,
        edge.to,
        edge.type,
        edge.time,
        edge.visibility,
        edge.retention,
        edge.tag,
        edge.data,
        edge.jwt
      ]
      debug("client.query %s %j",sql,values)
      const res = await client.query(sql,values);
      debug("client.query success");
      return res;
    } catch (e) {
      debug(e);
      throw (e);
    } finally {
      await client.end()
    }
  }

  async getEdge(hash: string, authData: AuthDataType | null){
    const debug = Debug('mouro:PgMgr:getEdge')

    let whereClause=sql.eq('hash',hash);
    
    //Add perms to whereClause
    whereClause = sql.and(whereClause,this._getPermsReadWhere(authData))
    
    const q=sql.select().from('edges').where(whereClause).toString();
    const client = this._getClient();
    try {
      debug("client.connect");
      await client.connect()
      debug("client.connect success");

      debug("client.query %s",q)
      const res = await client.query(q);
      debug("client.query success");
      return res.rows[0];
    } catch (e) {
      debug(e);
      throw (e);
    } finally {
      await client.end()
    }
  }

  async findEdges(args: any, authData: AuthDataType | null){
    const debug = Debug('mouro:PgMgr:findEdges')
    debug("args: %j",args)
    //find edges
    let where={};
    
    if(args.fromDID) where=sql.and(where,sql.in('from',args.fromDID))
    if(args.toDID)   where=sql.and(where,sql.in('to'  ,args.toDID))
    if(args.type)  where=sql.and(where,sql.in('type',args.type))
    if(args.since) where=sql.and(where,sql.gt('time', args.since))
    if(args.tag)   where=sql.and(where,sql.in('tag',args.tag))
    
    //Add perms to whereClause
    where = sql.and(where,this._getPermsReadWhere(authData))

    const q=sql.select().from('edges')
      .where(where)
      .orderBy('time')
      .toString();

    const client = this._getClient();
    try {
      debug("client.connect");
      await client.connect()
      debug("client.connect success");

      debug("client.query %s",q)
      const res = await client.query(q);
      debug("client.query success");
      return res.rows;
    } catch (e) {
      debug(e);
      throw (e);
    } finally {
      await client.end()
    }
  }


  _getPermsReadWhere(authData: AuthDataType | null){
    //Visibility access
    
    //add ANY
    let any=sql.eq('visibility','ANY');
    let vis=any;

    if(authData!==null){
      //Owner access
      let own=sql.and(
                sql.eq('visibility','TO'),
                sql.eq('to',authData.user)
              )

      //Both access
      let both=sql.and(
                sql.eq('visibility','BOTH'),
                sql.or(
                  sql.eq('from',authData.user),
                  sql.eq('to',authData.user)
                )
              )

      vis=sql.or(own,both,any);
    }

    let perms={};
    //Perms (authz)
    if(authData!==null && authData.authzRead){
        for(let i=0;i<authData.authzRead.length;i++){
            const authzCond:AuthzConditionType=authData.authzRead[i];
            
            //"From" condition
            if(authzCond.from){
                const authzPerm=sql.and(
                    sql.eq('to',authzCond.iss),
                    sql.eq('from',authzCond.from)
                );
                perms=sql.or(perms,authzPerm)
            }
        }
    }
    return sql.or(vis,perms);
  }

}

