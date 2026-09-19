"use strict";
const { test }=require("node:test");
const assert=require("node:assert/strict");
const { createBot }=require("../src/client");
const { createControlHandler }=require("../src/services/controlServer");
test("production control API preserves authentication, status, reload and slash refresh",async t=>{
  const client=createBot({connect:false,sqlitePath:":memory:"});
  t.after(()=>client.sqlite.close());let syncs=0;client.services.slash.syncAll=async()=>{syncs++;};
  const handler=createControlHandler(client,{token:"test-token"});
  async function request(method,url,token="test-token"){
    let status,payload;await handler({method,url,headers:{authorization:`Bearer ${token}`},resume(){}},{writeHead:s=>status=s,end:b=>payload=JSON.parse(b)});
    return {status,payload};
  }
  assert.equal((await request("GET","/api/control/status","wrong")).status,401);
  const status=await request("GET","/api/control/status");assert.equal(status.status,200);assert.equal(status.payload.loader_ready,true);assert.equal(status.payload.discord_ready,false);
  assert.equal((await request("POST","/api/control/reload")).payload.success,true);
  assert.equal((await request("POST","/api/control/refresh-slash")).payload.success,true);assert.equal(syncs,1);
  assert.equal((await request("POST","/unknown")).status,404);
});
