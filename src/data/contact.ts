// Only the public Turnstile Site Key belongs in this file. Secrets stay in the Worker.
export const contactConfig = {
  siteKey: '0x4AAAAAAFNMWoCY3cucIse6',
  endpoint: '/api/contact',
};
export const contactCopy = {
  en: {
    title: 'CONTACT CARD', email: 'YOUR EMAIL', message: 'MESSAGE', copy: 'COPY MY EMAIL',
    close: 'Close contact card', count: 'Message characters, maximum 500',
    placeholder: 'Write your message...', send: 'SEND IT', sending: 'SENDING…',
    sent: 'Message sent. Thank you!', copied: 'Email copied.',
    copyFailed: 'Copy this address: hello@leolaguna.com',
    verifying: 'Verifying…', verification: 'Please complete the security check.',
    unavailable: 'Contact service unavailable. Please copy my email and try again later.',
    failed: 'Could not send your message. Your draft is saved here; please try again.',
    limited: 'Too many attempts. Please wait a minute before trying again.',
  },
  es: {
    title: 'TARJETA DE CONTACTO', email: 'TU CORREO', message: 'MENSAJE', copy: 'COPIA MI CORREO',
    close: 'Cerrar tarjeta de contacto', count: 'Caracteres del mensaje, máximo 500',
    placeholder: 'Escribe tu mensaje...', send: 'ENVIAR', sending: 'ENVIANDO…',
    sent: 'Mensaje enviado. ¡Gracias!', copied: 'Correo copiado.',
    copyFailed: 'Copia esta dirección: hello@leolaguna.com',
    verifying: 'Verificando…', verification: 'Completa la verificación de seguridad.',
    unavailable: 'El servicio no está disponible. Copia mi correo e inténtalo más tarde.',
    failed: 'No se pudo enviar. Tu mensaje sigue aquí; inténtalo de nuevo.',
    limited: 'Demasiados intentos. Espera un minuto antes de volver a intentarlo.',
  },
} as const;
