# Estilos de la portada

La portada comparte componentes y comportamiento entre celulares e iPads. No añadir una nueva hoja para una resolución concreta ni recuperar las reglas retiradas del antiguo diseño de iPad.

## Responsabilidad de cada hoja

- `src/styles/global.css`: variables y temas globales.
- Las hojas de cada componente (`projects.css`, `brands.css`, `footer.css`, etc.): composición base, incluidos los estados usados por scripts.
- `src/styles/compact-services.css`: estructura de servicios cuando se activa `data-compact-services`.
- `src/styles/unified-home.css`: composición vertical compartida de Workflow, Science, Featured Works y marcas; adaptaciones de anchura y movimiento reducido.
- `src/styles/mobile-home.css`: ajustes vigentes de la portada móvil, temas, controles y uniones entre secciones. Este archivo sustituye al nombre histórico `mobile-audit.css`.
- `src/styles/surface-radii.css`: escala de radios compartida por Home, CV y About. No recortar los contenedores que conservan transformaciones 3D.
- `src/styles/ipad-home.css`: únicamente las reglas específicas de hero, introducción y navegación que aún siguen vigentes. No controla las secciones móviles unificadas.

## Cómo modificar estilos

1. Buscar la regla y el estado actuales antes de añadir otra declaración. Editar la regla propietaria; evitar corregirla con un parche más abajo.
2. Conservar el orden de importación de `src/pages/index.astro`: participa en la cascada actual.
3. No aumentar las repeticiones de `:root` ni añadir `!important` para ganar prioridad. Los selectores repetidos existentes son deuda pendiente: reducirlos requiere comparar también con las hojas base y los estilos scoped de Astro.
4. No borrar un selector solo porque no aparezca en una captura. Hay estados generados por scripts, menús, galerías, temas, idiomas, movimiento reducido y cambios de orientación.
5. Mantener los fallbacks de unidades y propiedades modernas, aunque parezcan duplicados.

## Comprobación

Ejecutar `npm run check:styles` y `npm run build`. Comprobar EN/ES, claro/oscuro, celular corto y alto, los tamaños de iPad relevantes y escritorio; incluir navegación, giros, galerías y cambio de tamaño cuando afecten al cambio.

La limpieza del 24 de octubre de 2026 retiró declaraciones demostrablemente sustituidas y dos archivos sin referencias activas: `footerGradient.ts` e `ipad-device.css`. El inspector `src/scripts/about/testLoader.js` se conserva como herramienta de desarrollo deliberada; no forma parte del bundle activo.

## Horizontal móvil: primera etapa

Workflow, los intermedios, Featured Works y el footer comparten `mobileJourneyMedia` e `isMobileJourneyLayout()` de `responsive-layout.ts`. La composición se activa en vertical o en horizontal táctil; el formato corto horizontal también permite la emulación de celular. Las reglas base compartidas permanecen en `unified-home.css` y las diferencias de composición horizontal en `mobile-home.css`.

`compactServices()` comparte ahora `mobileJourneyMedia`: servicios y marcas también se adaptan al horizontal móvil. Sus reglas de distribución siguen separadas de Workflow. Las referencias son services-landscape.svg, marcas horizontal.svg y featured works landscape.svg (1140 px de ancho de diseño); usar proporciones y mínimos legibles, no coordenadas absolutas.

Workflow conserva su selección y progreso al girar mediante su controlador existente. Featured Works usa una sola cabecera dentro de GroAqua y las mismas superficies de salida. El footer reutiliza el SVG, la franja completa y el handoff sticky; el tamaño horizontal del texto se limita por el ancho disponible.