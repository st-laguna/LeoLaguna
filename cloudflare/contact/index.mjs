import { EmailMessage } from 'cloudflare:email';
import { handleContact } from './handler.mjs';

export default {
  fetch(request, env) {
    return handleContact(request, env, {
      async verify(payload) {
        const response=await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
          method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload),signal:AbortSignal.timeout(10000),
        });
        if(!response.ok)throw new Error('Siteverify unavailable');
        return response.json();
      },
      async deliver(message, env) {
        // Raw EmailMessage works with the existing Email Routing send_email binding.
        // The visitor is Reply-To, never the authenticated sender.
        if(!/^[^\s@<>]+@leolaguna\.com$/.test(message.from))throw new Error('Invalid configured sender');
        const raw=[
          `From: Leo Laguna Contact <${message.from}>`,
          `To: ${message.to}`,`Reply-To: ${message.replyTo}`,`Subject: ${message.subject}`,
          `Date: ${new Date().toUTCString()}`,`Message-ID: <${crypto.randomUUID()}@leolaguna.com>`,
          'MIME-Version: 1.0','Content-Type: text/plain; charset=UTF-8','Content-Transfer-Encoding: base64','',
          btoa(Array.from(new TextEncoder().encode(message.text),byte=>String.fromCharCode(byte)).join('')).match(/.{1,76}/g).join('\r\n'),
        ].join('\r\n');
        await env.EMAIL.send(new EmailMessage(message.from,message.to,raw));
      },
    });
  },
};
