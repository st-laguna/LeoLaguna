# iPad portrait — implementación y validación

Proyecto: X:/MainWP. Cambios locales, sin publicar.

## Archivos

- src/styles/ipad-home.css: composición exclusiva de portada, márgenes proporcionales, controles con padding independiente, servicios, Featured Work, marcas y footer.
- src/scripts/ipad-workflow.ts: expansión conservando orden 01–04, cancelación de selecciones rápidas, giro existente a los dos segundos de terminar la expansión y limpieza al cambiar de orientación/movimiento.
- src/components/Workflow.astro: números individuales y conexión al controlador.
- src/scripts/home-journey.ts: máscara iPad, transición hacia la primera columna, revelado consecutivo y bloqueo de interacción durante la entrada.
- src/components/Hero.astro: coordenadas de la máscara LANDING, conservando ilustración y letras originales.
- src/scripts/hero-presentation.js y responsive-layout.ts: selección de geometría iPad.
- src/scripts/responsive-init.js y ipad-device.js: identificación iPadOS y vista previa explícita de portada con ?layout=ipad-portrait.
- src/pages/index.astro: importación de estilos exclusivos de portada.
- src/scripts/projects.ts: reutilización de la secuencia desktop y aparición del marco al completar la entrada.
- src/components/Projects.astro: separación de dígitos también en presentación estática.
- src/scripts/project-gallery.ts: apertura de View All con transición desktop en la portada iPad; contenido interior intacto.
- src/scripts/service-preview-nav.ts: controles existentes de cambio de servicio habilitados en esta composición.
- src/scripts/brands.ts: retícula original sin duplicados ni movimiento automático en iPad portrait.

## Reutilizado

Imágenes, letras vectoriales, datos de proyectos, galerías, selección de previews, numeración animada desktop, View All, flip de Workflow, contadores, logos, marquee y refracción, navegación y acciones originales.

## Validación

- Compilación Astro satisfactoria; permanece el aviso de bundles mayores de 500 kB.
- WebKit automatizado: 760×1024, 768×1024, 820×1180, 834×1194, 1024×1366, 1152×1536 y 1192×1590; sin overflow horizontal en las mediciones.
- Workflow: una sola carta expandida, giro, cambios rápidos, orden 01–04 y bloqueo durante la transición.
- Miniaturas, View All, servicio 04 con cuatro previews en una fila, navegación y cambio portrait/landscape.
- Detección iPadOS con MacIntel y multitouch; vista previa explícita sin depender de user agent.
- Nueva variante inactiva en escritorio, ventana laptop portrait, teléfono, About y Work interno. Esto comprueba aislamiento; no constituye una comparación pixel a pixel completa de todas esas vistas.
- Movimiento reducido y tema oscuro revisados; restauración de columnas al cambiar la preferencia.
- Retícula de marcas: 17 elementos originales, sin duplicación ni streams.

## Límites y diferencias

- Falta verificar en un iPad físico, especialmente barras dinámicas de Safari, decodificación de videos y rendimiento táctil real. WebKit automatizado no sustituye esa comprobación.
- Los ajustes posteriores del usuario prevalecen sobre los SVG: columnas Workflow contraídas a la izquierda de la carta activa, botones de tamaño existente, intermedio como desktop, banda negra de servicios y logos estáticos en grilla.
- Se conservan paleta, contenido y efectos de la aplicación; las referencias son geometría, no sustitutos visuales de las secciones.
- Responsively puede necesitar el user agent/touch del iPad o ?layout=ipad-portrait. Su tamaño de viewport por sí solo no debe activar una variante de dispositivo en una laptop normal.

## Revisión posterior

- Workflow: encabezado 3 px menor, números entre corchetes solo en columnas contraídas; pulsar la carta abierta la cierra y restaura las cuatro columnas.
- Separador entre visor y previews en los cuatro servicios. Featured Works 4 px menor con flecha en la misma línea.
- Menú iPad lateral de media pantalla, opciones alineadas a la derecha y enlace Home.
- Portada: recorrido ampliado a 550svh, imágenes después de la apertura del título; interacción de Workflow bloqueada hasta completar la entrada.
- Build correcto. WebKit detectó un aviso ResizeObserver de notificaciones aplazadas durante la prueba; se distingue de errores de ejecución.
