# MY RUNNER 3D

Endless runner original para navegador. El prototipo incluye tres carriles, obstáculos, monedas, salto, deslizamiento, dificultad progresiva, récord local y un avatar 3D que adapta las imágenes que el usuario carga.

## Ejecutar

Requisitos: Node.js 20+ y npm.

```bash
npm install
npm run dev
```

Abrir la URL local que entrega Vite. Para validar el build de producción:

```bash
npm run build
npm run preview
```

## Controles

- PC: ← / → o A / D para cambiar de carril; ↑ / W / espacio para saltar; ↓ / S para deslizar.
- Móvil: botones táctiles en la parte inferior del escenario. El juego se adapta al ancho de pantalla.

## Personalización actual

El rostro y la vestimenta se cargan desde el dispositivo y se aplican como texturas al avatar 3D durante la sesión. Las imágenes no se envían a un servidor en esta versión. Se aceptan imágenes de hasta 8 MB.

**Importante:** esto entrega una personalización visual local, no una reconstrucción generativa de un personaje 3D completo. Para esa etapa se debe conectar un modelo image-to-3D/character de Replicate, validar su esquema de entrada/salida, procesar el GLB, aplicar rigging y mapear animaciones compatibles. Los modelos de Replicate tienen esquemas distintos; no existe una integración universal segura sin elegir y probar un modelo concreto. No se incluye una API key en el frontend.

## Arquitectura

- React + TypeScript + Vite: interfaz y estado.
- Three.js + React Three Fiber: escena y avatar 3D.
- Lógica de juego propia: carriles, movimiento, colisiones, monedas, dificultad y puntuación.
- localStorage: récord del jugador.

## Próximas etapas

1. Sustituir geometrías provisionales por assets GLB originales y optimizados.
2. Incorporar animaciones de carrera, salto, caída y deslizamiento con AnimationMixer.
3. Elegir un modelo Replicate de imagen-a-3D y construir un backend seguro que valide entradas, descargue y procese el GLB.
4. Añadir rigging automático y retargeting a un esqueleto estándar.
5. Persistir perfiles y personajes en Supabase Storage/DB con consentimiento explícito y borrado de fotografías.
6. Añadir audio, pausa, pantalla de resultados, power-ups, obstáculos variados, pruebas y métricas de rendimiento móvil.

## Nota de propiedad intelectual

Proyecto original inspirado en el género endless runner. No utiliza marcas, personajes, modelos, música ni recursos propietarios de Subway Surfers.
