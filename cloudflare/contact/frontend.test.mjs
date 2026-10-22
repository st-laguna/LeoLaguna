import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import vm from 'node:vm';
import { transform } from 'esbuild';

const source = (await readFile(new URL('../../src/scripts/contact-card.ts', import.meta.url), 'utf8'))
  .replace("import gsap from 'gsap';", '')
  .replace("import { contactCopy } from '../data/contact';", '')
  .replaceAll('import.meta.hot', 'false');
const code = (await transform(source, { loader: 'ts', target: 'es2022' })).code;
const copySource = await readFile(new URL('../../src/data/contact.ts', import.meta.url), 'utf8');
const copyCode = (await transform(copySource.replaceAll('export const ', 'var '), { loader: 'ts' })).code;

function setup() {
  class Element {
    value = ''; textContent = ''; dataset = {}; listeners = {}; style = {setProperty(){}};
    addEventListener(name, fn) { this.listeners[name] = fn; }
    setAttribute() {} removeAttribute() {} replaceChildren() {} focus() {}
    querySelector(selector) { return nodes[selector] ||= new Element(); }
    querySelectorAll() { return []; }
    reportValidity() { return true; }
    reset() { email.value = ''; message.value = ''; }
  }
  const nodes = {}, modal = new Element(), card = new Element();
  nodes['[data-contact-modal]'] = modal;
  nodes['[data-contact-form]'] = card;
  const email = card.querySelector('[name=email]'), message = card.querySelector('[name=message]');
  const status = card.querySelector('[data-contact-status]');
  modal.open = true;
  modal.showModal = () => { modal.open = true; };
  modal.dataset = {siteKey:'public-test-key',endpoint:'/api/contact'};
  const scripts = [], timers = new Map(); let timerId = 0, options, fetchCount = 0, resetCount = 0;
  const quick = () => Object.assign(() => {}, {tween:{pause(){},kill(){}}});
  const context = vm.createContext({
    document:{querySelector:s=>nodes[s],documentElement:{lang:'en',style:{}},addEventListener(){},
      createElement:()=>Object.assign(new Element(),{remove(){}}),head:{append:s=>scripts.push(s)}},
    window:{addEventListener(){},dispatchEvent(){}},
    gsap:{quickTo:quick,utils:{clamp(){}}},
    matchMedia:()=>({matches:false,addEventListener(){}}),
    AbortController, HTMLElement:Element, HTMLInputElement:Element, HTMLTextAreaElement:Element,
    setTimeout:fn=>{timers.set(++timerId,fn);return timerId;},clearTimeout:id=>timers.delete(id),
    fetch:async()=>{fetchCount++;return {ok:true,status:200,json:async()=>({ok:true})};},
  });
  vm.runInContext(copyCode + '\n' + code, context);
  email.value = 'visitor@example.org'; message.value = 'Project test';
  const submit = () => card.listeners.submit({preventDefault(){}});
  const tick = async () => { for(let i=0;i<5;i++)await Promise.resolve(); };
  const install = () => {context.window.turnstile={render(_el,opts){options=opts;return 'widget';},reset(){resetCount++;},remove(){}};};
  const verify = async () => {await submit();install();scripts.at(-1).onload();await tick();options.callback('valid-test-token');};
  return {context,email,message,status,scripts,timers,submit,tick,install,verify,
    get options(){return options;},get fetchCount(){return fetchCount;},get resetCount(){return resetCount;}};
}

test('Send it retries after Turnstile loaded without its API', async()=>{
  const h=setup();await h.submit();assert.equal(h.scripts.length,1);
  h.scripts[0].onload();await h.tick();
  assert.match(h.status.textContent,/unavailable/);
  await h.submit();assert.equal(h.scripts.length,2);
  h.install();h.scripts[1].onload();await h.tick();h.options.callback('token');
  await h.submit();assert.equal(h.fetchCount,1);assert.match(h.status.textContent,/accepted/);
});
test('failed script download can retry, without duplicate pending loads',async()=>{
  const h=setup();await h.submit();await h.submit();assert.equal(h.scripts.length,1);
  h.scripts[0].onerror();await h.tick();await h.submit();assert.equal(h.scripts.length,2);
});
test('success remains visible when refreshed verification expires or fails',async()=>{
  const h=setup();await h.verify();await h.submit();
  assert.equal(h.message.value,'');assert.match(h.status.textContent,/accepted/);
  h.options['expired-callback']();h.options['error-callback']();h.options['timeout-callback']();
  assert.match(h.status.textContent,/accepted/);
});
for(const [name,response,expected] of [
  ['server unavailable',{ok:false,status:503,json:async()=>({code:'unavailable'})},/unavailable/],
  ['rate limit',{ok:false,status:429,json:async()=>({})},/Too many/],
  ['invalid input',{ok:false,status:400,json:async()=>({code:'invalid'})},/valid email/],
  ['invalid token',{ok:false,status:400,json:async()=>({code:'verification'})},/security check/],
  ['non JSON response',{ok:true,status:200,json:async()=>{throw Error();}},/Could not send/],
])test(name+' displays an error and preserves the draft',async()=>{
  const h=setup();await h.verify();h.context.fetch=async()=>response;await h.submit();
  assert.match(h.status.textContent,expected);assert.equal(h.message.value,'Project test');
});
test('network failure preserves draft and shows error',async()=>{
  const h=setup();await h.verify();h.context.fetch=async()=>{throw Error('offline');};
  await h.submit();assert.match(h.status.textContent,/Could not send/);assert.equal(h.message.value,'Project test');
});
test('whitespace message is rejected before network or verification',async()=>{
  const h=setup();h.message.value='  ';await h.submit();
  assert.equal(h.fetchCount,0);assert.equal(h.scripts.length,0);assert.match(h.status.textContent,/valid email/);
});
test('expired widget can be reset by Send it without sending an invalid token',async()=>{
  const h=setup();await h.verify();h.options['expired-callback']();await h.submit();
  assert.equal(h.resetCount,1);assert.equal(h.fetchCount,0);
});
