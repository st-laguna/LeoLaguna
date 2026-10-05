# Segunda revisión de iPad grande horizontal

Referencia: 1590 × 1060, DPR 2. Sin cambios en el diseño responsive anterior.

## Diagnóstico y cambios

| Problema | Hallazgo / corrección | Archivo |
|---|---|---|
| Logo vuelve a entrar al cambiar la altura | ScrollTrigger invalida y rebobina temporalmente el estado durante refresh; ese estado intermedio podía disparar la salida/entrada. El controlador de visibilidad ignora esos estados de refresh. No se elimina el ajuste del viewport. | src/scripts/home-journey.ts |
| Texto sobre la fila convergente | El timeline movía las cartas pero dejaba fijo el bloque de texto. Se eleva título, número, etiqueta y descripción en el mismo tramo .88–1.1, calculando el espacio necesario según la geometría. Solo iPad grande horizontal. | src/scripts/service-sticky-grid.ts |
| Tres cartas invisibles en Safari | El traslado cambia de padre a figuras dentro de capas transformadas, promovidas y recortadas. En Chromium sus estilos computados eran visibles, sin máscara/filtro ni falta de carga; no se reprodujo el fallo específico de Safari. Se evita la promoción 3D anidada en el perfil objetivo y se establece un estado 2D explícito al entregar la fila; el botón conserva visibilidad y elimina cualquier clip de entrada. Es una corrección del punto de riesgo, pendiente de confirmación en Safari real. | src/scripts/service-sticky-grid.ts |
| Líneas y textos de About blancos | No se encontró una asignación de color dependiente de selección. Los elementos ya tenían difference. Se elimina la caja intermedia de la interfaz mediante display:contents para que sus capas de fusión compartan el contexto del fondo/escena; se mantienen las bandas y sus layouts. La composición específica de Safari requiere confirmación. | src/styles/about-editorial.css |
| About táctil bloqueado | configureInput deshabilitaba enableRotate en cualquier pointer coarse. La experiencia editorial permite ahora arrastrar sobre su canvas; el comportamiento portrait anterior se conserva. El touch-action se limita al canvas, sin listeners globales que bloqueen el scroll. | src/scripts/about/dogScene.js |
| Services resiste el gesto | Las escrituras de scroll usaban la posición real con retraso, mientras el scrub .7 seguía alcanzando esa posición. Ahora el gesto mantiene su propia coordenada de destino y sincroniza el mismo master inmediatamente; el desplazamiento vertical sigue nativo. Se excluye la fase de salida hacia Brands. | src/scripts/tablet-horizontal-gesture.ts; src/scripts/projects.ts |
| Cambios rápidos / coral | Todo enlace estaba excluido, incluido el gran panel coral. Ahora ese enlace admite arrastre y mantiene sus taps; se cancela la inercia previa al iniciar otro gesto y se suprime el click producido por un drag, sin bloquear teclado. | src/scripts/tablet-horizontal-gesture.ts |
| WWF microparpadeo | resize llamaba setSize incluso con dimensiones idénticas y reiniciaba el encuadre. Se omiten esos resets. Ante un cambio real de tamaño se pinta inmediatamente el buffer antes de esperar al siguiente RAF. No se pudo reproducir el microparpadeo específico de Safari. | src/scripts/case-model.ts |
| Pivot y ejes del modelo | El centro world del GLB se restaba a una posición local mientras el padre podía estar girado. Se convierte el centro al espacio del padre. La rotación anterior invertía la cámara orbital; no era una acumulación manual de Euler. Se reemplaza por un quaternion normalizado del objeto con ejes de pantalla constantes, se corrige solo el signo vertical y se conserva la orientación al pasar de preview a interacción. | src/scripts/case-model.ts |

## Alcance y propiedad de eventos

- Solo large-tablet-landscape: gesto de navegación horizontal, rango Services, elevación del texto y promoción de capas durante View All.
- Compartido: protección del logo durante refresh, contexto de fusión del About editorial y entrega visual explícita de la fila.
- Global para el modelo de case studies: centro, quaternion, ratón/touch/teclado y guard de resize.
- Se reutilizan los listeners touch del controlador horizontal existente; se añade únicamente supresión de click tras drag. No hay un segundo carousel/timeline de navegación.
- OrbitControls conserva el cálculo de distancia/zoom; su rotación queda deshabilitada. Un controlador pointer del objeto sustituye esa responsabilidad, con captura y cancelación. Todos sus listeners se limpian mediante AbortController; se conserva controls.dispose().
- No se agregaron listeners globales resize ni remounts.

## Verificación realizada

Pruebas locales en Edge/Chromium con emulación táctil (no Safari real):

- 1590 × 1060 DPR 2; viewport 1060 → 1160: stage igual a la altura disponible y logo visible, transform identidad antes/después.
- Educational Visuals: .88 → .95 → 1 → .95 → 1 → .5 → 1, en claro y oscuro. Las tres cartas terminan con opacity 1, visibility visible, clip none, ancho 498px y fuentes decodificadas de 1920px. Fila alineada y sin salto al volver.
- Capturas revisadas de galería y About en claro.
- About: All → Laptop → Simba → Morena; difference persistente en líneas y reloj. El hit-test central alcanza CANVAS; controles táctiles habilitados.
- Services: gesto horizontal avanza el scroll existente; no nuevo controlador de render.
- Panel coral: gesto horizontal mueve la secuencia. Cuatro cambios rápidos de dirección mantienen progreso finito sin errores JS.
- WWF: preview activo, apertura del visor, drag táctil horizontal/vertical y mouse ±180° horizontal/vertical con arrastres alternados; sin errores de ejecución.
- Carga y perfiles iniciales: laptop 1279×645, desktop 2560×1440, portrait 834×1194 y mobile 390×844. Stage coincide con la altura; el perfil large-landscape no se activa en esos tamaños.
- npm run build y git diff --check correctos. Advertencia previa de bundle >500KB permanece.

No se modificaron Hero/distorsión, Contact Card, footer, marcas, CTA/CV ni la grilla Services. Los checks de perfiles no equivalen a un recorrido interactivo completo en cada dispositivo.

## Limitación pendiente

No hay Safari/iPad físico disponible en este entorno. No se puede afirmar que el fallo de composición de imágenes, la fusión dependiente de selección o el microparpadeo estén definitivamente resueltos en Safari hasta repetir allí la prueba. Los hallazgos comprobados se distinguen de las hipótesis de composición en la tabla; no se redujo el alto de la sección para ocultar el problema.
