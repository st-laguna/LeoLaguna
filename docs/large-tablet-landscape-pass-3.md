# Large iPad landscape — debugging/performance pass 3

Fecha: 2026-10-04. Referencia: 1590 × 1060, DPR 2, capacidades táctiles.

## Versión verificada antes de editar

- Rama local `dev`; HEAD `a88bc0208244bc6ce1bcc7f40a1bdf5cd76bae86`; árbol limpio al inicio.
- Las referencias remotas `main` y `dev` apuntaban a ese mismo commit. La rama local `main` estaba atrasada; no era el checkout usado.
- Los nombres de los bundles de About y Contact Card de `leolaguna.com` coincidían con el build local inicial. Además, el contenido del bundle principal de About coincidía exactamente al comparar texto.
- No se encontró evidencia de un build antiguo en esos archivos. No se pudo consultar la rama de producción configurada en el dashboard de Cloudflare; Git no demuestra esa configuración. La comparación no certifica todos los archivos de producción.
- El grid 2×4 sí estaba en el código actual: la regla intermedia hasta 1600 px ocultaba la novena miniatura. No era necesario atribuirlo a un despliegue antiguo.
- Los cambios de este pase son locales; no se ha desplegado producción.

## Diagnóstico y cambios

| Petición | Causa/evidencia | Cambio o resultado |
|---|---|---|
| 1. About inferior blanco | La composición inferior distribuía Difference entre reloj y enlaces, en lugar de una única superficie común. La incidencia específica de composición de Safari no puede confirmarse aquí. | Un grupo común Difference para reloj y enlaces, con hijos en blend normal; CTA coral fuera del grupo. Ninguna selección de objetos modifica estos estilos. En Chromium, ambos temas muestran correctamente la franja. |
| 2. Hero parpadea al cambiar altura | `renderer.setSize()` borra el buffer antes del siguiente RAF. Además, un refresh puede renderizar el estado temporal rebobinado de la timeline. | Repintado síncrono tras resize, sin recrear canvas/textura. En iPad, se evita pintar el estado temporal de refresh. El refresh por altura espera a que termine el scroll/transición; los tamaños visibles siguen actualizándose inmediatamente. Safari real pendiente. |
| 3. Hero inicial invisible | Reproducido sin interacción: anchors ocultos y falta de `data-hero-layout-ready`. El setup inline podía medir antes de disponer de geometría válida. | Nueva medición en DOMContentLoaded/fonts-ready, y commit de readiness en el camino de geometría ya conocida. Carga y reload del build estático pasan en light/dark sin scroll ni click. |
| 4. Contact oscuro negro puro | El padre heredaba el token global de fondo negro. | El footer oscuro posee `--background` y el token óptico con `--dark-base` (#1C1C1C). No se recolorean hijos explícitamente negros. |
| 5. Targets iPad | Botones pequeños y columnas de cabecera con anchos antiguos. | EN/ES mínimo 44 px, tema ampliado y columnas de la cabecera grande ajustadas a esos targets. |
| 6. FPS de navegación | Costes comprobados: miniaturas originales grandes, blur lateral de Services y trabajo WebGL del Hero durante covers. No se dispone de un perfil GPU/FPS de Safari real para atribuir toda la caída. | Miniaturas específicas, eliminación del blur y suspensión del Hero durante cover. Services/Works y CV→Home terminan correctamente. No se afirma que los FPS de Safari estén resueltos sin medirlos allí. |
| 7. Zoom About | Hitbox nativo de 2 px de alto; habilitado y no cubierto, pero difícil de tocar. | Hitbox 44 px manteniendo el track de 2 px. Un arrastre táctil real vía CDP cambió el valor hasta 83. |
| 8. ES About | Traducción larga y cache de fitTitle basada solo en ancho del contenedor. | `HEY, SOY LEO`, conservando la capitalización visual. Se invalida la medida al cambiar idioma: ambas líneas miden aproximadamente 286 px en un contenedor de 286 px. |
| 9. Tilt táctil | El controlador descartaba explícitamente touch. | Reutiliza el mismo controlador, captura local del pointer, ±4° en tablet y retorno suave. Excluye campos, botones y enlaces; pan vertical sigue permitido. Mouse conserva ±7°. |
| 10. CV controls | PageControls tenía EN/ES de 25 px y tema de 56 px. CV no importa global.css. | Overrides en el propio componente compartido: EN/ES 44 px, tema 92 px, gaps mayores y Home más cómodo, solo con data-ipad. |
| 11. Miniaturas lentas | Miniaturas sin srcset/dimensiones, usando imágenes completas. | 35 fuentes producen 70 variantes 320/640 WebP. Solo paneles visibles/próximos hidratan sus miniaturas; galerías completas no se precargan. Preview original intacto. |
| 12. Blur GLOBAL | Pseudo-elemento lateral con backdrop-filter blur y máscara. | Eliminado el bloque que genera el pseudo-elemento, conservando el layout. Computed content: none en las cuatro regresiones. |
| 13. Gestos principales | Existe un controlador local de Services y otro para secuencias de casos; no un controlador horizontal global permanente. | Se mantiene esa arquitectura. Prueba táctil: horizontal avanza la coordenada de la misma timeline, vertical conserva scroll nativo. No se añadieron listeners horizontales ni se cambiaron los casos que funcionan. La resistencia descrita en Safari queda pendiente de reproducción allí. |
| 14. Rebote footer | El refresh por viewport podía ejecutarse durante un gesto/rubber-band. La conversión horizontal ya limita su rango y excluye la salida hacia Brands/footer. | Refresh espera scroll idle y coordenada válida; no se desactiva rubber-band nativo ni se añade overlay. La prueba llega exactamente al máximo sin transición bloqueada; rebote de Safari pendiente. |
| 15. 3×3 | Regla intermedia 2×4 vigente hasta 1600 px. | Override exclusivo de large-tablet-landscape para servicios de imágenes: 9 celdas de 139,94 px en grid cuadrado de 439,81 px. Video conserva 2 columnas/8 miniaturas. |
| 16. View All | Padding horizontal demasiado estrecho. | Padding-inline 20 px en los cuatro servicios horizontales. |
| 17. Auditoría touch | Se revisaron loops, DPR, loaders y refresh. | Hero idle/offscreen/document-hidden ya se detiene; ahora también durante cover. About mantiene gates visible/document-hidden y DPR 1; footer usa IntersectionObserver; Lenis no se activa en iPad. Se conservan esos mecanismos y los casos existentes. No se añaden loops permanentes. |

## Rendimiento cuantificado

Las 35 fuentes de overview sumaban 6.494.024 bytes. Las variantes de 320 px suman 447.192 bytes (93,1% menos); las de 640 px, 1.279.522 bytes (80,3% menos). Son totales de archivos, no una medición de toda la transferencia del sitio. En el perfil probado se eligieron las variantes 320; previews/full galleries mantienen su resolución original. No se ha medido una mejora de FPS en hardware iPad.

## Archivos modificados

- Hero/viewport: `src/scripts/hero-presentation.js`, `hero-distortion.ts`, `home-journey.ts`, `large-tablet-viewport.ts`.
- About: `src/components/about/EditorialAbout.astro`, `src/scripts/about/editorialAbout.js`, `src/styles/about-editorial.css`.
- Contact touch: `src/scripts/contact-card.ts`, `src/styles/contact-card.css`.
- Controles/CSS: `src/components/PageControls.astro`, `src/styles/global.css`, `src/styles/large-tablet-landscape.css`.
- Services: `src/components/GlassSidebar.astro`, `src/components/Projects.astro`, `src/scripts/projects.ts`, nuevo `src/data/service-thumbnail.ts`, nuevo `scripts/build-service-thumbnails.mjs`, 70 archivos nuevos en `public/img/service-thumbs/`.
- Este informe: `docs/large-tablet-landscape-pass-3.md`.

Generar miniaturas: `node scripts/build-service-thumbnails.mjs` (Node 22.18+; usa sharp existente). No requiere cambiar las imágenes originales ni el despliegue.

## Alcance y reglas anteriores

- Solo large-tablet-landscape: 3×3 y novena miniatura, columnas de controles principales y ancho de tema en About.
- Solo iPad: protección del render temporal de refresh, refresh de viewport grande en reposo, targets PageControls/idioma.
- Tablets táctiles: tilt local de Contact Card; móvil pequeño conserva fallback.
- Compartido justificado: inicialización correcta del Hero, repintado WebGL, franja inferior Difference de About, ajuste de texto ES, footer dark token, assets pequeños de Services, padding View All y eliminación GLOBAL del blur solicitado.
- Se retiró la antigua excepción compacta del fondo oscuro del footer, ahora redundante con la corrección del padre. Se eliminó el generador del blur. El breakpoint 2×4 se conserva para los otros tamaños; solo se sustituye en el target grande, evitando una regresión global.

## Pruebas y límites

- `npm run build`: correcto; advertencia existente de chunk >500 KB. `git diff --check`: correcto.
- Chromium/Edge con viewport 1590×1060, DPR2 y touch: carga inicial/reload sin interacción, light/dark; EN/ES y ajuste de título; About light/dark con screenshots; slider con touch; Contact Card touch/retorno/close; fuentes pequeñas; grid 3×3 y video; cambios repetidos de altura 1060↔1160; mismo canvas Hero (uno, sin recreación); About→Services; Works; CV→Home; desplazamiento horizontal y vertical; llegada al footer sin estado bloqueado.
- Build estático en preview local: carga y reload light/dark sin interacción, anchors visibles; View All de Technical Visuals abre y cierra correctamente, sin estado de transición residual.
- Regresiones iniciales: desktop 2560×1440, laptop 1279×645, iPad portrait 834×1194, móvil 390×844; Hero visible, perfil grande no aplicado fuera de target, blur ausente.
- No se envió otro correo real ni se modificaron Worker, Turnstile, validación o backend.
- Este entorno Windows no permite validar Safari/iPadOS real, toolbar física, rubber-band nativo ni FPS GPU. Esas tres incidencias requieren la comprobación final en el iPad; no se presentan como verificadas por una emulación de Chromium. Tampoco se hizo una certificación completa de todas las interacciones de todos los dispositivos.
