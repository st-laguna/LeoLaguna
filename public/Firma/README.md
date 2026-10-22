# Firma de correo de Leo Laguna

## Archivos

- Originales conservados: `logo.svg` (nombre exacto, en minúsculas), `email.svg`, `website.svg`, `location.svg`, `linkedin.svg`, `instagram.svg`.
- `logo.png`: conversión directa del SVG, 246 × 177 px; se muestra a 82 × 59 px.
- Cinco iconos PNG: conversiones directas de sus SVG a 42 × 42 px, mostradas a 14 px. El icono de ubicación se conserva como recurso, pero no aparece en la firma. Fondo blanco para conservar el contraste de los huecos de los iconos.
- `firma.html`: documento con la tabla de firma, estilos inline y URLs HTTPS absolutas. No contiene scripts, CSS externo ni imágenes Base64.
- `preview.html`: vista del mismo diseño con recursos relativos para revisarlo localmente antes de publicar. No copiar imágenes locales a Gmail.

## Publicar

1. Incluye esta carpeta en el siguiente despliegue autorizado del sitio. Astro copia `public/Firma` a `/Firma/`; respeta la F mayúscula. No hace falta añadir enlaces a la navegación ni cambiar DNS o correo.
2. Comprueba en una ventana privada que estas URLs devuelvan archivos reales, sin autenticación, redirección a la portada ni errores: `https://leolaguna.com/Firma/logo.png`, y las equivalentes para `email.png`, `website.png`, `linkedin.png` e `instagram.png`. Deben responder con HTTP 200 y Content-Type image/png.
3. Abre `https://leolaguna.com/Firma/preview.html` y revisa después `https://leolaguna.com/Firma/firma.html`.
4. Mantén esas imágenes públicas y sus nombres estables: los correos enviados seguirán utilizándolas. Los SVG originales se conservan para web y futuras exportaciones; la firma usa PNG para ampliar la compatibilidad entre clientes de correo.

La página de vista previa será accesible por URL directa. No se añade ninguna sección a la web. Este trabajo no publica cambios remotos.

## Instalar en Gmail (navegador de escritorio)

1. Después de publicar, abre `https://leolaguna.com/Firma/firma.html`.
2. Pulsa Ctrl+A y Ctrl+C sobre la página renderizada. No abras el código fuente ni copies desde la vista previa local.
3. En Gmail, ve a Configuración → Ver todos los ajustes → General → Firma → Crear nueva; escribe «Leo Laguna».
4. Haz clic dentro del editor de la firma y pega con Ctrl+V, conservando el formato.
5. Selecciónala en los valores predeterminados para correos nuevos y respuestas/reenvíos. Si usas varias direcciones de envío, selecciona la dirección correspondiente.
6. Al final de Configuración, pulsa Guardar cambios.
7. Envía manualmente un mensaje de prueba y comprueba logo, cuatro iconos, nombre y enlaces. Revisa también un destinatario móvil. Las imágenes pueden depender de que el destinatario permita contenido externo.

Ayuda oficial: https://support.google.com/mail/answer/8395?hl=es

## Diseño y comprobación

Tabla horizontal de hasta 500 px, con logo a la izquierda, separador y cinco líneas de texto a la derecha:

1. Leonardo Sánchez Laguna
2. Scientific Illustrator & Technical 3D Visualizer
3. B.Sc. Marine Biology · Lima, Peru (sin icono de ubicación)
4. Correo electrónico
5. Web | LinkedIn | Instagram, en una sola línea

Se mantienen el nombre, el cargo y la fila de enlaces sin saltos de línea para respetar la referencia. En pantallas más estrechas que la firma puede ser necesario desplazarse horizontalmente; la vista previa proporciona ese desplazamiento. Nombre a 18 px y datos a 12 px, con estilos inline.

Las imágenes usan URLs HTTPS absolutas del dominio operativo sin www. Se puede abrir firma.html localmente y copiar su contenido renderizado si esas URLs públicas están disponibles; no copiar desde preview.html local, que utiliza imágenes relativas. No se han modificado DNS ni publicado cambios.

La comprobación en navegador no sustituye la revisión de un correo de prueba enviado desde Gmail.
