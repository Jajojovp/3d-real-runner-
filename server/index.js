import 'dotenv/config';
import express from 'express';
import helmet from 'helmet';
import multer from 'multer';
import rateLimit from 'express-rate-limit';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const port = Number(process.env.PORT || 3001);
const replicateToken = process.env.REPLICATE_API_TOKEN;
const model = process.env.REPLICATE_MODEL || 'tencent/hunyuan-3d-3.1';
const replicateApi = 'https://api.replicate.com/v1';

app.disable('x-powered-by');
app.use(helmet({ crossOriginResourcePolicy: { policy: 'same-origin' } }));
app.use('/api/', rateLimit({
  windowMs: 60_000,
  limit: 12,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  message: { error: 'Demasiadas solicitudes. Espera un minuto e inténtalo otra vez.' }
}));

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024, files: 1 },
  fileFilter: (_req, file, done) => {
    const allowed = ['image/jpeg', 'image/png', 'image/webp'];
    if (!allowed.includes(file.mimetype)) return done(new Error('Formato no válido. Usa JPG, PNG o WEBP.'));
    done(null, true);
  }
});

async function replicateRequest(url, options = {}) {
  const response = await fetch(url, {
    ...options,
    headers: {
      Authorization: `Bearer ${replicateToken}`,
      ...(options.headers || {})
    }
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    const detail = typeof payload.detail === 'string' ? payload.detail : 'El proveedor de generación 3D rechazó la solicitud.';
    const error = new Error(detail);
    error.status = response.status;
    throw error;
  }
  return payload;
}

function validPredictionId(value) {
  return typeof value === 'string' && /^[a-z0-9]{8,64}$/i.test(value);
}

app.get('/api/health', (_req, res) => {
  res.json({
    ok: true,
    characterGenerationConfigured: Boolean(replicateToken),
    model
  });
});

app.post('/api/character/generate', upload.single('image'), async (req, res, next) => {
  try {
    if (!replicateToken) {
      return res.status(503).json({ error: 'Falta configurar REPLICATE_API_TOKEN en el archivo .env del servidor.' });
    }
    if (!req.file) return res.status(400).json({ error: 'Debes adjuntar una foto de cuerpo entero.' });

    const dataUri = `data:${req.file.mimetype};base64,${req.file.buffer.toString('base64')}`;
    const prediction = await replicateRequest(`${replicateApi}/models/${model}/predictions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Prefer: 'wait=1',
        'Cancel-After': '10m'
      },
      body: JSON.stringify({
        input: {
          image: dataUri,
          enable_pbr: true,
          face_count: 300000,
          generate_type: 'Normal'
        }
      })
    });

    res.status(202).json({
      id: prediction.id,
      status: prediction.status,
      message: 'La generación 3D comenzó correctamente.'
    });
  } catch (error) {
    next(error);
  }
});

app.get('/api/character/:id', async (req, res, next) => {
  try {
    if (!replicateToken) return res.status(503).json({ error: 'El servicio de generación 3D no está configurado.' });
    if (!validPredictionId(req.params.id)) return res.status(400).json({ error: 'Identificador de generación no válido.' });
    const prediction = await replicateRequest(`${replicateApi}/predictions/${req.params.id}`);
    res.json({
      id: prediction.id,
      status: prediction.status,
      error: prediction.error || null,
      ready: prediction.status === 'succeeded'
    });
  } catch (error) {
    next(error);
  }
});

app.get('/api/character/:id/model', async (req, res, next) => {
  try {
    if (!replicateToken) return res.status(503).json({ error: 'El servicio de generación 3D no está configurado.' });
    if (!validPredictionId(req.params.id)) return res.status(400).json({ error: 'Identificador de generación no válido.' });
    const prediction = await replicateRequest(`${replicateApi}/predictions/${req.params.id}`);
    if (prediction.status !== 'succeeded') {
      return res.status(409).json({ error: 'El modelo todavía no está listo.' });
    }

    const outputUrl = Array.isArray(prediction.output) ? prediction.output[0] : prediction.output;
    if (typeof outputUrl !== 'string' || !outputUrl.startsWith('https://')) {
      return res.status(502).json({ error: 'Replicate no devolvió un archivo GLB válido.' });
    }

    const asset = await fetch(outputUrl, {
      headers: { Authorization: `Bearer ${replicateToken}` }
    });
    if (!asset.ok) return res.status(502).json({ error: 'No se pudo descargar el modelo 3D generado.' });

    const bytes = Buffer.from(await asset.arrayBuffer());
    if (bytes.length > 100 * 1024 * 1024) return res.status(413).json({ error: 'El modelo generado supera el tamaño permitido.' });
    res.setHeader('Content-Type', 'model/gltf-binary');
    res.setHeader('Content-Length', String(bytes.length));
    res.setHeader('Cache-Control', 'private, max-age=3600');
    res.send(bytes);
  } catch (error) {
    next(error);
  }
});

const distPath = path.resolve(__dirname, '../dist');
app.use(express.static(distPath));
app.get('*', (req, res, next) => {
  if (req.path.startsWith('/api/')) return next();
  res.sendFile(path.join(distPath, 'index.html'), (error) => error && next(error));
});

app.use((error, _req, res, _next) => {
  if (error instanceof multer.MulterError && error.code === 'LIMIT_FILE_SIZE') {
    return res.status(413).json({ error: 'La foto debe pesar 5 MB o menos.' });
  }
  const status = Number(error.status) || 500;
  res.status(status).json({
    error: status >= 500 ? 'No se pudo completar la operación. Revisa la configuración del servidor e inténtalo otra vez.' : error.message
  });
});

app.listen(port, () => {
  console.log(`MY RUNNER 3D API escuchando en http://localhost:${port}`);
});
