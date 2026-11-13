# MY RUNNER 3D

Endless runner 3D original para navegador. El juego tiene tres carriles, movimiento lateral, salto, deslizamiento, trenes, barreras, monedas, escudo, dificultad progresiva, récord local y controles táctiles.

## Ejecutar en desarrollo

Requisitos: Node.js 20+ y npm.

```bash
npm install
```

Terminal 1 — frontend:

```bash
npm run dev
```

Terminal 2 — API:

```bash
npm run server
```

Abre la URL local que entrega Vite. Para validar producción:

```bash
npm run build
npm run server
```

El servidor Express entrega la carpeta `dist` y expone la API bajo `/api`.

## Controles

- PC: ← / → o A / D para cambiar de carril; ↑ / W / espacio para saltar; ↓ / S para deslizar.
- Móvil: botones táctiles y gestos swipe sobre el escenario.
- Recoge monedas y el power-up verde para obtener un escudo de un impacto.

## Personaje personalizado con Replicate

1. Crea una copia de `.env.example` llamada `.env`.
2. Añade tu token privado de Replicate en `REPLICATE_API_TOKEN`. Nunca uses un prefijo `VITE_` ni lo pongas en el frontend.
3. Inicia `npm run server`.
4. En el juego, carga una foto de cuerpo entero en JPG, PNG o WEBP (máximo 5 MB) y pulsa **Generar personaje 3D con IA**.
5. El backend crea una predicción con el modelo oficial `tencent/hunyuan-3d-3.1`, consulta su estado y sirve el GLB al navegador mediante una ruta del propio servidor.

La foto debe mostrar una sola persona de pies a cabeza, centrada, con fondo sencillo y buena iluminación. El modelo genera una aproximación 3D desde una imagen; no garantiza identidad facial exacta, anatomía perfecta ni rigging. El personaje GLB se presenta en la escena con movimiento de carrera de raíz. Para animación corporal completa se necesita rigging y retargeting con clips compatibles.

Las fotos opcionales de rostro y vestimenta continúan aplicándose localmente al avatar de reserva. La foto de cuerpo entero solo se envía a Replicate cuando el usuario pulsa el botón de generación. No se guardan las fotos en la base de datos.

## Seguridad y configuración

- `REPLICATE_API_TOKEN`: secreto del servidor.
- `REPLICATE_MODEL`: por defecto `tencent/hunyuan-3d-3.1`.
- `PORT`: puerto del servidor API, por defecto 3001.
- API con límite de solicitudes, validación de MIME/tamaño y sin exponer el token al cliente.
- Las fotos se procesan en memoria; el backend no crea una galería ni persiste las imágenes.

## Pruebas

```bash
npm run build
npx playwright install chromium
npm run test:e2e
```

Los tests verifican carga de escena, inicio de carrera, puntuación y controles móviles. La integración de Playwright MCP y la inspección REA se documentan en `.agents/skills/my-runner-rea/SKILL.md`.

## Arquitectura

- React + TypeScript + Vite: interfaz y estado.
- Three.js + React Three Fiber: escena 3D, entorno, obstáculos y personaje.
- Express + Multer: API de generación, validación y proxy seguro del GLB.
- Replicate Hunyuan 3D 3.1: generación image-to-3D.
- localStorage: récord del jugador.
- Playwright: pruebas e2e.
- REA: flujo documentado para inspección basada en evidencia.

## Próximas mejoras necesarias

1. Rigging automático y retargeting de animaciones de carrera, salto y deslizamiento.
2. Assets GLB originales de trenes, edificios, señalética y entorno con licencias verificadas.
3. Persistencia opcional de perfiles y modelos en Supabase Storage con consentimiento y borrado.
4. Audio, pausa, pantalla de resultados, misiones y economía de monedas.
5. Medición de FPS, tamaño de GLB y pruebas en dispositivos Android/iOS reales.

## Propiedad intelectual

Proyecto original inspirado en el género endless runner. No utiliza marcas, personajes, música ni recursos propietarios de Subway Surfers.
