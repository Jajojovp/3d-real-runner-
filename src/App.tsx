import { useCallback, useEffect, useRef, useState, type ChangeEvent, type TouchEvent } from 'react';
import RunnerGame from './game/RunnerGame';

type Action = 'left' | 'right' | 'jump' | 'duck';
type GenerationStatus = 'idle' | 'uploading' | 'processing' | 'ready' | 'error';

const readImage = (file: File) => new Promise<string>((resolve, reject) => {
  const reader = new FileReader();
  reader.onload = () => resolve(String(reader.result));
  reader.onerror = reject;
  reader.readAsDataURL(file);
});

const wait = (ms: number) => new Promise(resolve => window.setTimeout(resolve, ms));

export default function App() {
  const [face, setFace] = useState<string>();
  const [outfit, setOutfit] = useState<string>();
  const [fullBodyFile, setFullBodyFile] = useState<File>();
  const [fullBodyPreview, setFullBodyPreview] = useState<string>();
  const [modelUrl, setModelUrl] = useState<string>();
  const [generationStatus, setGenerationStatus] = useState<GenerationStatus>('idle');
  const [generationMessage, setGenerationMessage] = useState('');
  const [playing, setPlaying] = useState(false);
  const [score, setScore] = useState(0);
  const [best, setBest] = useState(() => Number(localStorage.getItem('myrunner-best') || 0));
  const [coins, setCoins] = useState(0);
  const [hasShield, setHasShield] = useState(false);
  const touchStart = useRef<{ x: number; y: number } | null>(null);

  const updateBest = useCallback((value: number) => {
    setScore(value);
    setBest(current => {
      if (value > current) {
        localStorage.setItem('myrunner-best', String(value));
        return value;
      }
      return current;
    });
  }, []);

  const handleAction = useCallback((action: Action) => {
    if (playing) window.dispatchEvent(new CustomEvent('runner-action', { detail: action }));
  }, [playing]);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      if (target && ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName)) return;
      const map: Record<string, Action> = {
        ArrowLeft: 'left', a: 'left', ArrowRight: 'right', d: 'right',
        ArrowUp: 'jump', w: 'jump', ' ': 'jump', ArrowDown: 'duck', s: 'duck'
      };
      const action = map[event.key];
      if (action && playing) {
        event.preventDefault();
        handleAction(action);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [handleAction, playing]);

  const upload = async (event: ChangeEvent<HTMLInputElement>, target: 'face' | 'outfit') => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setGenerationMessage('Selecciona un archivo de imagen.');
      return;
    }
    if (file.size > 8 * 1024 * 1024) {
      setGenerationMessage('Las fotos de personalización deben pesar menos de 8 MB.');
      return;
    }
    const data = await readImage(file);
    if (target === 'face') setFace(data);
    else setOutfit(data);
  };

  const chooseFullBody = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      setGenerationStatus('error');
      setGenerationMessage('Para generar el modelo 3D usa JPG, PNG o WEBP.');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setGenerationStatus('error');
      setGenerationMessage('La foto para generar el modelo 3D debe pesar 5 MB o menos.');
      return;
    }
    setFullBodyFile(file);
    setFullBodyPreview(await readImage(file));
    setModelUrl(undefined);
    setGenerationStatus('idle');
    setGenerationMessage('');
  };

  const generateCharacter = async () => {
    if (!fullBodyFile || generationStatus === 'uploading' || generationStatus === 'processing') return;
    setGenerationStatus('uploading');
    setGenerationMessage('Subiendo tu foto de referencia de forma segura…');
    setModelUrl(undefined);
    try {
      const form = new FormData();
      form.append('image', fullBodyFile);
      const created = await fetch('/api/character/generate', { method: 'POST', body: form });
      const createdBody = await created.json();
      if (!created.ok) throw new Error(createdBody.error || 'No se pudo iniciar la generación 3D.');

      setGenerationStatus('processing');
      setGenerationMessage('La IA está construyendo tu personaje 3D. Puede tardar varios minutos.');
      for (let attempt = 0; attempt < 120; attempt += 1) {
        await wait(3000);
        const response = await fetch(`/api/character/${createdBody.id}`);
        const status = await response.json();
        if (!response.ok) throw new Error(status.error || 'No se pudo consultar el estado de la generación.');
        if (status.status === 'succeeded') {
          setModelUrl(`/api/character/${createdBody.id}/model`);
          setGenerationStatus('ready');
          setGenerationMessage('¡Personaje 3D generado! Ya está cargado en la carrera.');
          return;
        }
        if (status.status === 'failed' || status.status === 'canceled') {
          throw new Error(status.error || 'La generación no terminó correctamente. Prueba con otra foto.');
        }
      }
      throw new Error('La generación está tardando más de lo esperado. Puedes volver a intentarlo.');
    } catch (error) {
      setGenerationStatus('error');
      setGenerationMessage(error instanceof Error ? error.message : 'Ocurrió un error inesperado.');
    }
  };

  const start = () => {
    setScore(0);
    setCoins(0);
    setHasShield(false);
    setPlaying(true);
  };

  const onTouchStart = (event: TouchEvent<HTMLDivElement>) => {
    const touch = event.changedTouches[0];
    touchStart.current = { x: touch.clientX, y: touch.clientY };
  };

  const onTouchEnd = (event: TouchEvent<HTMLDivElement>) => {
    if (!touchStart.current || !playing) return;
    const touch = event.changedTouches[0];
    const dx = touch.clientX - touchStart.current.x;
    const dy = touch.clientY - touchStart.current.y;
    touchStart.current = null;
    if (Math.max(Math.abs(dx), Math.abs(dy)) < 24) return;
    if (Math.abs(dx) > Math.abs(dy)) handleAction(dx < 0 ? 'left' : 'right');
    else handleAction(dy < 0 ? 'jump' : 'duck');
  };

  return (
    <main className="app-shell">
      <header className="topbar">
        <a className="brand" href="#" aria-label="MY RUNNER 3D inicio">
          <span className="brand-mark">M</span><span>MY RUNNER <b>3D</b></span>
        </a>
        <div className="top-actions">
          <span className="best-chip">🏆 Récord <b>{best.toLocaleString('es-CL')}</b></span>
        </div>
      </header>

      <section className="hero">
        <div className="hero-copy">
          <span className="eyebrow">TU CARRERA · TUS REGLAS</span>
          <h1>Corre a tu<br /><em>manera.</em></h1>
          <p>Corre por una ciudad 3D, esquiva trenes y obstáculos, recoge monedas y crea un personaje inspirado en tus propias fotografías.</p>
          <div className="hero-stats">
            <div><b>3</b><span>carriles</span></div>
            <div><b>∞</b><span>distancia</span></div>
            <div><b>3D</b><span>tu personaje</span></div>
          </div>
        </div>

        <div className="game-panel" data-testid="game-panel" onTouchStart={onTouchStart} onTouchEnd={onTouchEnd}>
          <div className="game-hud">
            <div><small>PUNTUACIÓN</small><strong data-testid="score">{score.toLocaleString('es-CL')}</strong></div>
            <div className="coin-hud">🟡 <b>{coins}</b></div>
            {hasShield && <div className="shield-hud">🛡️ ESCUDO</div>}
          </div>
          <RunnerGame
            running={playing}
            face={face}
            outfit={outfit}
            modelUrl={modelUrl}
            hasShield={hasShield}
            onScore={updateBest}
            onCoin={() => setCoins(value => value + 1)}
            onPowerup={() => setHasShield(true)}
            onUseShield={() => setHasShield(false)}
            onCrash={() => setPlaying(false)}
          />
          {!playing && (
            <div className="game-overlay">
              <div className="overlay-card">
                <span className="overlay-icon">{score > 0 ? '⚡' : '🏃'}</span>
                <h2>{score > 0 ? '¡Buena carrera!' : '¿Listo para correr?'}</h2>
                <p>{score > 0 ? 'Has terminado esta carrera. Recoge monedas y vuelve a intentarlo.' : 'Cambia de carril, salta las barreras y deslízate bajo los arcos.'}</p>
                <button className="primary-button" onClick={start} data-testid="start-game">
                  {score > 0 ? 'VOLVER A JUGAR' : 'EMPEZAR A CORRER'} <span>→</span>
                </button>
                <small className="key-hint">← → MOVER · ↑ SALTAR · ↓ DESLIZAR</small>
              </div>
            </div>
          )}
          <div className="mobile-controls" aria-label="Controles táctiles">
            <button aria-label="Mover a la izquierda" onClick={() => handleAction('left')}>←</button>
            <button aria-label="Saltar" onClick={() => handleAction('jump')}>↑</button>
            <button aria-label="Deslizarse" onClick={() => handleAction('duck')}>↓</button>
            <button aria-label="Mover a la derecha" onClick={() => handleAction('right')}>→</button>
          </div>
        </div>
      </section>

      <section className="customizer">
        <div className="section-heading">
          <div><span className="eyebrow">TU AVATAR</span><h2>El corredor eres tú.</h2></div>
          <span className="privacy-note">🔒 Las fotos solo se envían a Replicate al solicitar la generación 3D</span>
        </div>

        <div className="upload-grid">
          <label className="upload-card">
            <input type="file" accept="image/*" onChange={event => upload(event, 'face')} />
            <span className="upload-preview">{face ? <img src={face} alt="Vista previa del rostro" /> : '👤'}</span>
            <span className="upload-text"><b>01 · Rostro (opcional)</b><small>{face ? 'Imagen cargada · Cambiar' : 'Foto frontal para personalización local'}</small></span>
            <span className="upload-plus">+</span>
          </label>
          <label className="upload-card">
            <input type="file" accept="image/*" onChange={event => upload(event, 'outfit')} />
            <span className="upload-preview">{outfit ? <img src={outfit} alt="Vista previa de vestimenta" /> : '🧥'}</span>
            <span className="upload-text"><b>02 · Vestimenta (opcional)</b><small>{outfit ? 'Imagen cargada · Cambiar' : 'Foto de la ropa para personalización local'}</small></span>
            <span className="upload-plus">+</span>
          </label>
          <label className="upload-card upload-card--featured">
            <input type="file" accept="image/jpeg,image/png,image/webp" onChange={chooseFullBody} />
            <span className="upload-preview">{fullBodyPreview ? <img src={fullBodyPreview} alt="Foto de cuerpo entero seleccionada" /> : '🧍'}</span>
            <span className="upload-text"><b>03 · Foto de cuerpo entero para IA 3D</b><small>{fullBodyFile ? fullBodyFile.name : 'Una persona de pies a cabeza, de frente y con fondo sencillo'}</small></span>
            <span className="upload-plus">+</span>
          </label>
        </div>

        <div className="generation-row">
          <button className="generate-button" onClick={generateCharacter} disabled={!fullBodyFile || generationStatus === 'uploading' || generationStatus === 'processing'}>
            {generationStatus === 'uploading' || generationStatus === 'processing' ? 'GENERANDO PERSONAJE…' : generationStatus === 'ready' ? 'VOLVER A GENERAR' : 'GENERAR PERSONAJE 3D CON IA'}
          </button>
          <span className={`generation-status generation-status--${generationStatus}`} role="status">{generationMessage || 'La generación usa Replicate · Hunyuan 3D 3.1 y requiere REPLICATE_API_TOKEN en el servidor.'}</span>
        </div>
        <p className="customizer-footnote">Para obtener mejores resultados, usa una foto nítida de cuerpo entero, con la persona centrada, buena iluminación y sin objetos que tapen el cuerpo. Replicate genera una malla 3D texturizada; el resultado de una sola fotografía es una reconstrucción aproximada, no un escaneo exacto. Las fotos de rostro y vestimenta separadas siguen aplicándose localmente al avatar de reserva.</p>
      </section>

      <footer><span>MY RUNNER 3D</span><span>Un endless runner original · Hecho para jugar</span></footer>
    </main>
  );
}
