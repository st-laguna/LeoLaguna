# Validación responsive y lifecycle de View All

Proyecto: `X:\MainWP`. Fecha: 2026-10-10. Sin commit, push ni deploy.

## Resultado

El bug de lifecycle al reabrir y rotar queda **FIXED** en las pruebas locales de Chromium y WebKit Windows. Las imágenes negras siguen **NOT REPRODUCED**: no se presenta el arreglo de lifecycle como un arreglo demostrado de ese otro bug.

La última intervención se limita a `project-gallery.ts`, `service-sticky-grid.ts` y `gallery-return.ts`. Los demás cambios responsive ya existentes se conservan.

| Comprobación | Resultado | Evidencia / alcance |
|---|---|---|
| VIEW ALL LIFECYCLE ROTATION BUG | FIXED | Owner por apertura, invalidación de callbacks y recursos explícitos |
| REOPEN + ROTATE | PASS | Secuencia B dos veces en WebKit |
| ROTATE BACK | PASS | Secuencia C dos veces; handoff permanece en 1.0 |
| REDUCED MOTION + ROTATE | PASS | Secuencia D dos veces; imágenes cargadas en grid estático |
| C-04 LISTENERS | PASS | Baseline 303; después de 10 ciclos: 303; sin crecimiento por ciclo |
| VIEW ALL BLACK IMAGES | NOT REPRODUCED | Chromium y WebKit; claro/oscuro y estrés de rotación |
| IPAD LANDSCAPE HEADER | PASS | Diferencia vertical final 0.015625 px |
| IPAD LANDSCAPE SERVICES | PASS | Franja 210 → 275.59 px; grid 439.81 → 600 px en 1590×1060 |
| VIEW ALL IPAD FOOTER | PASS* | Botón y slot en y=1000.40625; estable con scrollTop sintético max+350 |
| WORK IMAGE PERFORMANCE | SAME | Apertura mediana 10 ms; decode 13.3 ms; animación 549.1 ms |
| WWF INITIAL ORIENTATION | PASS | Pivote centrado; quaternion de base e interacción identidad |
| WWF DRAG AXES | PASS | Mouse y touch nativo CDP: derecha, arriba y abajo naturales |
| WWF RESET ON REENTRY | PASS | Canvas inicial y reentrada idénticos en desktop/tablet/phone |
| WORK OVERSCROLL | PASS* | Root/body coinciden con coral; sin overflow horizontal en perfiles probados |
| IPAD BLACK BANDS | PASS | Fondo de transición entre Work/marcas/footer #1C1C1C |
| IPAD HELLO DUPLICATION | PASS | Touch usa texto nativo; overlay oculto |
| IPAD SCROLL | PASS | Paradas libres 28347 / 28262 / 28317; sin snap obligatorio |
| PHONE VIEW ALL | PASS | Las cuatro categorías; orden de intro y zoom |
| PHONE TWO-COLUMN GALLERY | PASS | Dos columnas de 174 px en viewport 390 px |
| PHONE VIEW ALL FOOTER | PASS | Footer simplificado; delta botón/slot X=0, Y=0 |
| PHONE LANDSCAPE REGRESSION | NO | Geometría medida idéntica al baseline; alternancia de breakpoint pasa |
| BUTTON INTERACTION REGRESSION | NO | Nav, Start a Project, Next Case Study y footer; roll/dimming desktop y texto único touch |
| C-01 | PASS | Módulos retrasados en entrada; navegación interna Services/Work con barrera de layout de 12 s |
| C-02 | PASS | Resize durante navegación conserva destino y navegación posterior |
| C-03 | PASS | Hash, Back/Forward, reload, entrada directa y repetición sin duplicar historial |
| C-04 | PASS | Diez ciclos finales, cleanup de triggers en cada cierre |
| P-01 | PASS | Dibujos WebGL del footer por ventana de 750 ms: 0 fuera, 414 visible, 0 fuera |
| P-03 | PASS | CV idle/settled: 0 RAF en 650 ms; wheel/teclado/programático despiertan |
| GSAP WARNINGS | 0 | En las validaciones finales instrumentadas |
| JS ERRORS | 0 | En las validaciones finales instrumentadas |
| 404s | 0 | En las rutas y recursos solicitados por esos smokes |
| BUILD | PASS | `npm run build`, ocho páginas; advertencia existente de chunk >500 kB |

\* Se verificó el clamp del dock, el fondo raíz y la geometría en los perfiles indicados. WebKit Windows no reproduce fielmente el rubber-band nativo de Safari/iPadOS: el bounce físico fuerte todavía requiere comprobarse en el dispositivo. Estos PASS no certifican ese gesto físico.

Los conteos de errores/404 son del alcance instrumentado, no una certificación de todos los recursos del sitio. El archivo previamente conocido `public/videos/6.webm` sigue ausente; no se modificó ni se inventó un reemplazo en esta intervención.

## Qué cambió en el lifecycle

Cada apertura crea un owner con generación y AbortController. Las continuaciones asíncronas, el observer de imágenes y el reloj comprueban que su owner siga activo. Al cerrar se destruyen los recursos y se invalida esa apertura.

El grid controla explícitamente sus timelines, ScrollTrigger, estilos y listeners. Su cleanup es idempotente y ya no queda registrado como cleanup de un contexto responsive de página. Las variantes de media tienen su propia generación; callbacks viejos no pueden actualizar la variante actual. Los callbacks encolados del ResizeObserver se descartan tras el cierre.

ScrollTrigger restaura el progreso durante refresh con callbacks suprimidos. El grid reconcilia el handoff, la visibilidad y el estado inert al finalizar refresh. Al rotar se conserva el progreso lógico y el desplazamiento posterior al final de la transición, en lugar de reutilizar coordenadas de otra altura.

El dock del footer también comprueba su owner y descarta callbacks después de su cleanup.

No se añadieron bucles RAF permanentes, cambios de resolución de imágenes ni ajustes visuales para ocultar el fallo.

## Pruebas finales de lifecycle

`webkit-lifecycle.json` registra dos rondas de:

- A: abrir → llegar al handoff → rotar → cerrar.
- B: abrir → cerrar → reabrir → rotar → cerrar.
- C: abrir → rotar → volver a landscape → cerrar → reabrir.
- D: abrir → activar reduced motion → rotar → cerrar.

Las comprobaciones exigen imágenes cargadas y visibles, un solo trigger de grid cuando corresponde y un solo trigger de dock. Tras cerrar no queda ninguno de esos triggers. En modo animado, el handoff conserva al menos 99% después de rotar; la medición final fue 100%. Reduced motion elimina el recorrido sticky y muestra su grid estático, por lo que scrollY=0 puede ser válido sin representar un reinicio de la animación.

`owner-validation.json` conserva ocho callbacks de la apertura anterior y los invoca después de reabrir. El DOM, scroll y lista de triggers de la apertura nueva permanecen idénticos.

`breakpoint-validation.json` alterna 390×844 ↔ 844×390 cuatro veces con el diálogo abierto. Portrait mantiene dos columnas y cero triggers de grid; landscape mantiene un solo trigger. El diálogo permanece abierto.

C-04 usa un baseline después de inicializar Services, Playwright y una apertura de calentamiento. Esto separa la inicialización única de GSAP/Playwright de una acumulación por ciclo. Los diez ciclos medidos vuelven a 303 listeners y 15 triggers de página; no sobreviven `service-sticky-grid` ni `gallery-return-dock`.

## Rendimiento conservado

Medición ya confirmada, sin repetir la auditoría: tres contextos Chromium con viewport iPad 1590×1060, touch y DPR 2. Imagen EXO1 original: 1920×1080, 169486 bytes transferidos, aproximadamente 8.29 MB decodificados.

| Métrica | Resultado |
|---|---|
| Apertura del diálogo | Mediana 10 ms (9 / 12.6 / 10) |
| Decode desde el toque | Mediana 13.3 ms (12.6 / 16 / 13.3) |
| Animación terminada | Mediana 549.1 ms |
| Long tasks | 0 en las tres muestras |
| Layouts | 5 por apertura |
| Tiempo de layout | 0.93–1.23 ms por muestra |
| Intervalos RAF >32 ms | 1 / 0 / 0 en ventanas de ~1.3 s |

Los intervalos RAF no son una medición directa de frames perdidos ni del FPS de un iPad físico. La prueba temporal sin blur no aportó mejora consistente, por lo que el resultado sigue SAME y se mantiene el diseño/calidad original.

## Archivos de producto modificados (acumulado)

- `src/components/Projects.astro`: contenido completo para phone portrait e intro de video.
- `src/scripts/responsive-layout.ts`: detección específica de phone portrait.
- `src/scripts/project-gallery.ts`: modo portrait y ownership por apertura.
- `src/scripts/service-sticky-grid.ts`: flujo phone, ownership, cleanup y continuidad de rotación/refresh.
- `src/scripts/gallery-return.ts`: clamp del dock y callbacks ligados al owner.
- `src/styles/service-sticky-grid.css`: intro, dos columnas y footer de phone portrait.
- `src/styles/large-tablet-landscape.css`: alineación de header, tamaño de Services y posición del footer.
- `src/styles/footer.css`: evita exponer la segunda capa de texto del roll.
- `src/styles/label-interactions.css`: una capa de texto en touch.
- `src/styles/ipad-portrait.css`: continuidad del fondo de marcas.
- `src/scripts/scroll-pacing.ts`: elimina proximity snap de tablet touch portrait.
- `src/scripts/case-model.ts`: orientación canónica, ejes naturales y reset del modelo WWF.
- `src/scripts/case-study.ts`: sincroniza el fondo raíz con el tramo coral.
- `src/styles/case-study.css`: superficies base/coral para overscroll.

Se añade este reporte y sus evidencias bajo `docs/performance-audit/device-validation-2026-10-10/`.
