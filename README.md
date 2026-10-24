# Leo Laguna — Portafolio

Sitio construido con Astro, CSS propio, GSAP/ScrollTrigger y Three.js.

## Desarrollo

```sh
npm ci
npm run dev -- --background
```

El servidor usa el puerto 4321 por defecto. La gestión del servidor en segundo plano se describe en `AGENTS.md`.

## Comprobaciones

```sh
npm run check:styles
npm run build
```

`check:styles` detecta declaraciones repetidas en los mismos selectores y condiciones, y evita aumentar la especificidad de las hojas móviles compartidas. La compilación genera `dist/`.

## Mantenimiento de la interfaz

Consultar [la arquitectura de estilos](docs/STYLE_ARCHITECTURE.md) antes de cambiar las reglas responsive. Allí se documentan los archivos propietarios, el orden de importación, los estados dinámicos y la validación necesaria para conservar la misma composición móvil en celulares e iPads.