# Firma de correo de Leo Laguna

## Archivos

- Originales conservados: `logo.svg` (nombre exacto, en minúsculas), `email.svg`, `website.svg`, `location.svg`, `linkedin.svg`, `instagram.svg`.
- `logo.png`: conversión directa del SVG, 246 × 177 px; se muestra a 82 × 59 px.
- Cinco iconos PNG: conversiones directas de sus SVG a 42 × 42 px, mostradas a 12–14 px. Fondo blanco para conservar el contraste de los huecos de los iconos.
- `firma.html`: documento con la tabla de firma, estilos inline y URLs HTTPS absolutas. No contiene scripts, CSS externo ni imágenes Base64.
- `preview.html`: vista del mismo diseño con recursos relativos para revisarlo localmente antes de publicar. No copiar imágenes locales a Gmail.

## Publicar

1. Incluye esta carpeta en el siguiente despliegue autorizado del sitio. Astro copia `public/Firma` a `/Firma/`; respeta la F mayúscula. No hace falta añadir enlaces a la navegación ni cambiar DNS o correo.
2. Comprueba en una ventana privada que estas URLs devuelvan archivos reales, sin autenticación, redirección a la portada ni errores: `https://www.leolaguna.com/Firma/logo.png`, y las equivalentes para `email.png`, `website.png`, `location.png`, `linkedin.png` e `instagram.png`. Deben responder con HTTP 200 y Content-Type image/png.
3. Abre `https://www.leolaguna.com/Firma/preview.html` y revisa después `https://www.leolaguna.com/Firma/firma.html`.
4. Mantén esas imágenes públicas y sus nombres estables: los correos enviados seguirán utilizándolas. Los SVG originales se conservan para web y futuras exportaciones; la firma usa PNG para ampliar la compatibilidad entre clientes de correo.

La página de vista previa será accesible por URL directa. No se añade ninguna sección a la web. Este trabajo no publica cambios remotos.

## Instalar en Gmail (navegador de escritorio)

1. Después de publicar, abre `https://www.leolaguna.com/Firma/firma.html`.
2. Pulsa Ctrl+A y Ctrl+C sobre la página renderizada. No abras el código fuente ni copies desde la vista previa local.
3. En Gmail, ve a Configuración → Ver todos los ajustes → General → Firma → Crear nueva; escribe «Leo Laguna».
4. Haz clic dentro del editor de la firma y pega con Ctrl+V, conservando el formato.
5. Selecciónala en los valores predeterminados para correos nuevos y respuestas/reenvíos. Si usas varias direcciones de envío, selecciona la dirección correspondiente.
6. Al final de Configuración, pulsa Guardar cambios.
7. Envía manualmente un mensaje de prueba y comprueba logo, cinco iconos, nombre y enlaces. Revisa también un destinatario móvil. Las imágenes pueden depender de que el destinatario permita contenido externo.

Ayuda oficial: https://support.google.com/mail/answer/8395?hl=es

## Diseño y comprobación

Tabla horizontal de ancho fluido con máximo de 500 px, logo original a la izquierda, separador y texto a la derecha. Nombre a 18 px y datos a 12 px. El texto y los enlaces sociales pueden pasar de línea sin depender de media queries, que no se conservan al pegar en Gmail. La ubicación es texto, sin enlace a una dirección postal. Las únicas URLs de contacto son las cuatro solicitadas; el logo enlaza al sitio.

La prueba local valida archivos y diseño, pero no confirma el despliegue HTTPS ni el tratamiento final de Gmail. Comprueba la firma guardada con el mensaje de prueba antes de utilizarla habitualmente.

Verificación local: firma y vista previa revisadas en Edge a 320, 375, 500 y 760 px; seis imágenes cargadas y cinco enlaces correctos (incluido el logo). Se simularon las URLs HTTPS con los archivos locales para la prueba de firma.html; esto no verifica su disponibilidad pública.
