// Delivery address and secrets never enter the Astro/client bundle.
export const destination = 'sanchezlaguna99@gmail.com';
const origins = new Set(['https://leolaguna.com', 'https://www.leolaguna.com']);
const hostnames = new Set(['leolaguna.com', 'www.leolaguna.com']);
const reply = (status, code) => Response.json({ok:status===200, ...(code?{code}:{})}, {
  status, headers:{'Cache-Control':'no-store', ...(status===429?{'Retry-After':'60'}:{})},
});
export async function handleContact(request, env, {verify, deliver}) {
  if(new URL(request.url).pathname !== '/api/contact')return reply(404,'not_found');
  if(request.method !== 'POST')return reply(405,'method');
  if(!origins.has(request.headers.get('Origin')))return reply(403,'origin');
  if(!request.headers.get('Content-Type')?.startsWith('application/json'))return reply(415,'content_type');
  // Configuration failures must never masquerade as successful submissions.
  if(!env.TURNSTILE_SECRET_KEY||!env.EMAIL?.send||!env.CONTACT_RATE_LIMITER?.limit||!env.CONTACT_FROM)return reply(503,'unavailable');
  const ip=request.headers.get('CF-Connecting-IP');
  if(!ip)return reply(403,'origin');
  try {
    const {success}=await env.CONTACT_RATE_LIMITER.limit({key:'contact:'+ip});
    if(!success)return reply(429,'limited');
    // Read with a hard byte limit even for requests without Content-Length.
    const reader=request.body?.getReader();if(!reader)return reply(400,'invalid');
    const parts=[];let size=0;
    while(true){const {done,value}=await reader.read();if(done)break;size+=value.byteLength;if(size>8192){await reader.cancel();return reply(413,'too_large');}parts.push(value);}
    const bytes=new Uint8Array(size);let offset=0;for(const part of parts){bytes.set(part,offset);offset+=part.length;}
    let data;try{data=JSON.parse(new TextDecoder().decode(bytes));}catch{return reply(400,'invalid');}
    if(!data||typeof data.email!=='string'||typeof data.message!=='string'||typeof data.token!=='string')return reply(400,'invalid');
    const email=data.email.trim(),message=data.message.trim();
    if(email.length>254||!/^[^\s@<>]+@[^\s@<>]+\.[^\s@<>]+$/.test(email)||/[\r\n\x00-\x1f\x7f]/.test(email)||!message||data.message.length>500||!data.token||data.token.length>2048)return reply(400,'invalid');
    const validation=await verify({secret:env.TURNSTILE_SECRET_KEY,response:data.token,remoteip:ip});
    if(!validation.success||validation.action!=='contact'||!hostnames.has(validation.hostname))return reply(400,'verification');
    await deliver({from:env.CONTACT_FROM,to:destination,replyTo:email,subject:'New portfolio contact',text:message},env);
    return reply(200);
  }catch{return reply(503,'unavailable');}
}
