import { useCallback, useEffect, useRef, useState } from 'react';
import RunnerGame from './game/RunnerGame';

type Action = 'left' | 'right' | 'jump' | 'duck';
const readImage = (file: File) => new Promise<string>((resolve, reject) => { const reader = new FileReader(); reader.onload = () => resolve(String(reader.result)); reader.onerror = reject; reader.readAsDataURL(file); });

export default function App() {
  const [face, setFace] = useState<string>(); const [outfit, setOutfit] = useState<string>();
  const [playing, setPlaying] = useState(false); const [score, setScore] = useState(0); const [best, setBest] = useState(() => Number(localStorage.getItem('myrunner-best') || 0));
  const [coins, setCoins] = useState(0);
  const touchStart = useRef<{x:number;y:number}|null>(null);
  const updateBest = useCallback((value:number) => { setScore(value); if (value > best) { setBest(value); localStorage.setItem('myrunner-best', String(value)); } }, [best]);
  const handleAction = useCallback((action:Action) => { window.dispatchEvent(new CustomEvent('runner-action', { detail: action })); }, []);
  useEffect(() => {
    const onKey = (event:KeyboardEvent) => { const map:Record<string,Action> = {ArrowLeft:'left',a:'left',ArrowRight:'right',d:'right',ArrowUp:'jump',w:'jump',' ':'jump',ArrowDown:'duck',s:'duck'}; const action = map[event.key]; if (action) { event.preventDefault(); handleAction(action); } };
    window.addEventListener('keydown', onKey); return () => window.removeEventListener('keydown', onKey);
  }, [handleAction]);
  const upload = async (event:React.ChangeEvent<HTMLInputElement>, target:'face'|'outfit') => { const file = event.target.files?.[0]; if (!file) return; if (!file.type.startsWith('image/')) return; if (file.size > 8*1024*1024) { alert('La imagen debe pesar menos de 8 MB.'); return; } const data = await readImage(file); target === 'face' ? setFace(data) : setOutfit(data); };
  const start = () => { setScore(0); setCoins(0); setPlaying(true); };
  const onTouchStart = (event:React.TouchEvent<HTMLDivElement>) => { const touch=event.changedTouches[0]; touchStart.current={x:touch.clientX,y:touch.clientY}; };
  const onTouchEnd = (event:React.TouchEvent<HTMLDivElement>) => { if(!touchStart.current)return; const touch=event.changedTouches[0]; const dx=touch.clientX-touchStart.current.x; const dy=touch.clientY-touchStart.current.y; touchStart.current=null; if(Math.max(Math.abs(dx),Math.abs(dy))<24)return; if(Math.abs(dx)>Math.abs(dy))handleAction(dx<0?'left':'right'); else handleAction(dy<0?'jump':'duck'); };
  return <main className="app-shell">
    <header className="topbar"><a className="brand" href="#"><span className="brand-mark">M</span><span>MY RUNNER <b>3D</b></span></a><div className="top-actions"><span className="best-chip">🏆 Récord <b>{best.toLocaleString('es-CL')}</b></span></div></header>
    <section className="hero">
      <div className="hero-copy"><span className="eyebrow">TU CARRERA · TUS REGLAS</span><h1>Corre a tu<br/><em>manera.</em></h1><p>Personaliza tu corredor con tus fotos, esquiva obstáculos y supera tu propio récord en una carrera infinita en 3D.</p><div className="hero-stats"><div><b>3</b><span>carriles</span></div><div><b>∞</b><span>distancia</span></div><div><b>1</b><span>protagonista: tú</span></div></div></div>
      <div className="game-panel" onTouchStart={onTouchStart} onTouchEnd={onTouchEnd}>
        <div className="game-hud"><div><small>PUNTUACIÓN</small><strong>{score.toLocaleString('es-CL')}</strong></div><div className="coin-hud">🟡 <b>{coins}</b></div></div>
        <RunnerGame running={playing} face={face} outfit={outfit} onScore={updateBest} onCoin={() => setCoins(v=>v+1)} onCrash={() => setPlaying(false)} />
        {!playing && <div className="game-overlay"><div className="overlay-card"><span className="overlay-icon">{score>0?'⚡':'🏃'}</span><h2>{score>0?'¡Buena carrera!':'¿Listo para correr?'}</h2><p>{score>0?'Esquiva, recoge monedas y vuelve a intentarlo.':'Tres carriles, obstáculos y monedas. ¡No dejes que te alcancen!'}</p><button className="primary-button" onClick={start}>{score>0?'VOLVER A JUGAR':'EMPEZAR A CORRER'} <span>→</span></button><small className="key-hint">← → MOVER · ↑ SALTAR · ↓ DESLIZAR</small></div></div>}
        <div className="mobile-controls"><button onClick={()=>handleAction('left')}>←</button><button onClick={()=>handleAction('jump')}>↑</button><button onClick={()=>handleAction('duck')}>↓</button><button onClick={()=>handleAction('right')}>→</button></div>
      </div>
    </section>
    <section className="customizer">
      <div className="section-heading"><div><span className="eyebrow">TU AVATAR</span><h2>El corredor eres tú.</h2></div><span className="privacy-note">🔒 Tus fotos se procesan localmente en esta demo</span></div>
      <div className="upload-grid">
        <label className="upload-card"><input type="file" accept="image/*" onChange={e=>upload(e,'face')}/><span className="upload-preview">{face?<img src={face} alt="Vista previa del rostro"/>:'👤'}</span><span className="upload-text"><b>01 · Tu rostro</b><small>{face?'Imagen cargada · Cambiar':'Sube una foto frontal, bien iluminada'}</small></span><span className="upload-plus">+</span></label>
        <label className="upload-card"><input type="file" accept="image/*" onChange={e=>upload(e,'outfit')}/><span className="upload-preview">{outfit?<img src={outfit} alt="Vista previa de vestimenta"/>:'🧥'}</span><span className="upload-text"><b>02 · Tu vestimenta</b><small>{outfit?'Imagen cargada · Cambiar':'Sube una foto de tu outfit'}</small></span><span className="upload-plus">+</span></label>
      </div>
      <p className="customizer-footnote">La demo adapta visualmente tu rostro y los colores de tu vestimenta al avatar 3D. La reconstrucción generativa de un modelo GLB completo con IA se habilitará al conectar un proveedor de generación 3D.</p>
    </section>
    <footer><span>MY RUNNER 3D</span><span>Un endless runner original · Hecho para jugar</span></footer>
  </main>;
}