// Pages exposes /api/contact; the internal Worker owns validation and email.
export async function onRequest(context) {
  if (!context.env.CONTACT_WORKER?.fetch) {
    console.error('Contact Pages configuration: missing CONTACT_WORKER service binding');
    return Response.json({ok:false, code:'unavailable'}, {status:503, headers:{'Cache-Control':'no-store'}});
  }
  try {
    return await context.env.CONTACT_WORKER.fetch(context.request);
  } catch {
    console.error('Contact Pages: CONTACT_WORKER invocation failed');
    return Response.json({ok:false, code:'unavailable'}, {status:503, headers:{'Cache-Control':'no-store'}});
  }
}
