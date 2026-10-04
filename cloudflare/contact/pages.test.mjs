import test from 'node:test';
import assert from 'node:assert/strict';
import { onRequest } from '../../functions/api/contact.js';
const makeRequest=(method='POST')=>new Request('https://leolaguna.com/api/contact',{
  method,headers:{Origin:'https://leolaguna.com','Content-Type':'application/json','CF-Connecting-IP':'192.0.2.1'},
  ...(method==='POST'?{body:JSON.stringify({email:'visitor@example.com',message:'Test',token:'mock-token',website:''})}:{})
});
test('Pages forwards the same request, preserving method, URL, headers and body',async()=>{
  const request=makeRequest();let seen;
  const response=Response.json({ok:true});
  const result=await onRequest({request,env:{CONTACT_WORKER:{async fetch(req){seen=req;return response;}}}});
  assert.equal(result,response);assert.equal(seen,request);
  assert.equal(seen.method,'POST');assert.equal(seen.url,'https://leolaguna.com/api/contact');
  assert.equal(seen.headers.get('Origin'),'https://leolaguna.com');
  assert.equal(seen.headers.get('CF-Connecting-IP'),'192.0.2.1');
  assert.equal((await seen.json()).token,'mock-token');
});
for(const [status,code] of [[400,'verification'],[403,'origin'],[429,'limited'],[503,'unavailable']])test('Worker '+status+' response passes through unchanged',async()=>{
  const response=Response.json({ok:false,code},{status,headers:{'Retry-After':'60'}});
  const result=await onRequest({request:makeRequest(),env:{CONTACT_WORKER:{async fetch(){return response;}}}});
  assert.equal(result,response);assert.equal(result.status,status);assert.equal(result.headers.get('Retry-After'),'60');
});
test('non-POST also reaches Worker validation',async()=>{
  let method;const r=await onRequest({request:makeRequest('GET'),env:{CONTACT_WORKER:{async fetch(req){method=req.method;return Response.json({ok:false,code:'method'},{status:405});}}}});
  assert.equal(method,'GET');assert.equal(r.status,405);
});
test('missing binding fails closed',async()=>{const r=await onRequest({request:makeRequest(),env:{}});assert.equal(r.status,503);assert.deepEqual(await r.json(),{ok:false,code:'unavailable'});});
test('internal Worker failure never becomes success',async()=>{const r=await onRequest({request:makeRequest(),env:{CONTACT_WORKER:{fetch(){throw new Error('offline');}}}});assert.equal(r.status,503);});
