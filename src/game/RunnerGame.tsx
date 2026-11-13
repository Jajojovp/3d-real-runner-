import { Canvas, useFrame } from '@react-three/fiber';
import { useEffect, useMemo, useRef, useState } from 'react';
import * as THREE from 'three';

type Props = { running:boolean; face?:string; outfit?:string; onScore:(score:number)=>void; onCoin:()=>void; onCrash:()=>void };
type Action = 'left'|'right'|'jump'|'duck';
const laneX = [-1.65,0,1.65];

function makeTexture(source?:string) {
  if (!source) return null;
  const image = new Image(); image.src = source;
  const texture = new THREE.Texture(image); image.onload = () => { texture.needsUpdate = true; }; texture.colorSpace = THREE.SRGBColorSpace; return texture;
}
function Runner({face,outfit,lane,jump,duck}:{face?:string;outfit?:string;lane:number;jump:number;duck:boolean}) {
  const faceTexture = useMemo(()=>makeTexture(face),[face]); const outfitTexture = useMemo(()=>makeTexture(outfit),[outfit]);
  return <group position={[laneX[lane],jump,1.6]} scale={duck?[1,0.58,1]:[1,1,1]}>
    <mesh position={[0,0.86,0]} castShadow><capsuleGeometry args={[0.34,0.62,5,10]}/><meshStandardMaterial color="#e9a56f" map={outfitTexture || undefined}/></mesh>
    <mesh position={[0,1.58,0]} castShadow><sphereGeometry args={[0.36,24,24]}/><meshStandardMaterial color="#d69a72" map={faceTexture || undefined}/></mesh>
    <mesh position={[-0.13,1.63,0.31]}><sphereGeometry args={[0.045,8,8]}/><meshBasicMaterial color="#17202b"/></mesh><mesh position={[0.13,1.63,0.31]}><sphereGeometry args={[0.045,8,8]}/><meshBasicMaterial color="#17202b"/></mesh>
    <mesh position={[-0.19,0.22,0]} castShadow><boxGeometry args={[0.2,0.48,0.23]}/><meshStandardMaterial color="#273e59"/></mesh><mesh position={[0.19,0.22,0]} castShadow><boxGeometry args={[0.2,0.48,0.23]}/><meshStandardMaterial color="#273e59"/></mesh>
    <mesh position={[-0.19,-0.04,0.08]}><boxGeometry args={[0.25,0.12,0.42]}/><meshStandardMaterial color="#f4f1e9"/></mesh><mesh position={[0.19,-0.04,0.08]}><boxGeometry args={[0.25,0.12,0.42]}/><meshStandardMaterial color="#f4f1e9"/></mesh>
  </group>;
}
function World({running,face,outfit,onScore,onCoin,onCrash}:{running:boolean;face?:string;outfit?:string;onScore:(n:number)=>void;onCoin:()=>void;onCrash:()=>void}) {
  const [lane,setLane] = useState(1); const [jump,setJump] = useState(0); const [duck,setDuck] = useState(false);
  const obstacles = useRef<THREE.Group[]>([]); const coins = useRef<THREE.Group[]>([]); const road = useRef<THREE.Group>(null);
  const speed = useRef(12); const distance = useRef(0); const jumpVelocity = useRef(0); const duckTimer = useRef(0); const scoreTimer = useRef(0); const crashed = useRef(false);
  const obstacleData = useMemo(()=>Array.from({length:7},(_,i)=>({z:-12-i*9,lane:Math.floor(Math.random()*3),type:i%3===0?'barrier':i%3===1?'train':'arch'})),[]);
  const coinData = useMemo(()=>Array.from({length:12},(_,i)=>({z:-7-i*6,lane:(i%3),y:i%4===0?2.2:1.05})),[]);
  useEffect(()=>{ const act=(event:Event)=>{const action=(event as CustomEvent<Action>).detail; if(action==='left')setLane(v=>Math.max(0,v-1)); if(action==='right')setLane(v=>Math.min(2,v+1)); if(action==='jump'&&jump<=0){jumpVelocity.current=8.5;} if(action==='duck')duckTimer.current=0.8;}; window.addEventListener('runner-action',act); return()=>window.removeEventListener('runner-action',act); },[jump]);
  useEffect(()=>{ if(running){crashed.current=false;speed.current=12;distance.current=0;scoreTimer.current=0;setLane(1);setJump(0);setDuck(false);jumpVelocity.current=0;duckTimer.current=0;} },[running]);
  useFrame((_,delta)=>{
    if(!running||crashed.current)return;
    const dt=Math.min(delta,0.04); distance.current+=speed.current*dt; speed.current=Math.min(25,12+distance.current*0.018); scoreTimer.current+=dt;
    if(scoreTimer.current>0.12){onScore(Math.floor(distance.current*3));scoreTimer.current=0;}
    if(road.current) road.current.children.forEach((child)=>{child.position.z+=speed.current*dt;if(child.position.z>4)child.position.z-=48;});
    obstacles.current.forEach((obj,i)=>{if(!obj)return;obj.position.z+=speed.current*dt;if(obj.position.z>5){obj.position.z-=63;obj.position.x=laneX[Math.floor(Math.random()*3)];}
      if(obj.position.z>0.8&&obj.position.z<2.2&&Math.abs(obj.position.x-laneX[lane])<0.65){const low=obj.userData.type==='arch';if((low&&duck)||(low===false&&jump>0.75)){return;}crashed.current=true;onCrash();}
    });
    coins.current.forEach((obj)=>{if(!obj)return;obj.position.z+=speed.current*dt;obj.rotation.y+=dt*3;if(obj.position.z>5){obj.position.z-=72;obj.position.x=laneX[Math.floor(Math.random()*3)];}
      if(obj.position.z>0.7&&obj.position.z<2.5&&Math.abs(obj.position.x-laneX[lane])<0.65&&obj.visible){obj.visible=false;onCoin();window.setTimeout(()=>{obj.visible=true;},900);}
    });
    if(jumpVelocity.current!==0){jumpVelocity.current-=22*dt;setJump(v=>{const next=Math.max(0,v+jumpVelocity.current*dt);if(next===0)jumpVelocity.current=0;return next;});}
    if(duckTimer.current>0){duckTimer.current-=dt;setDuck(true);}else setDuck(false);
  });
  return <>
    <ambientLight intensity={1.2}/><directionalLight position={[4,9,5]} intensity={2.1} castShadow/>
    <fog attach="fog" args={['#9ccbd0',18,58]}/>
    <mesh rotation={[-Math.PI/2,0,0]} position={[0,-0.12,-18]} receiveShadow><planeGeometry args={[9,65]}/><meshStandardMaterial color="#263e4c"/></mesh>
    <group ref={road}>{Array.from({length:18},(_,i)=><group key={i} position={[0,0,-i*3-3]}><mesh position={[-0.83,-0.105,0]}><boxGeometry args={[0.035,0.02,1.2]}/><meshBasicMaterial color="#d2e2df"/></mesh><mesh position={[0.83,-0.105,0]}><boxGeometry args={[0.035,0.02,1.2]}/><meshBasicMaterial color="#d2e2df"/></mesh></group>)}</group>
    <mesh position={[-4.2,2,-20]}><boxGeometry args={[1.2,5,55]}/><meshStandardMaterial color="#d3a06e"/></mesh><mesh position={[4.2,2,-20]}><boxGeometry args={[1.2,5,55]}/><meshStandardMaterial color="#d3a06e"/></mesh>
    {obstacleData.map((o,i)=><group key={i} ref={el=>{if(el){obstacles.current[i]=el;el.userData.type=o.type;}}} position={[laneX[o.lane],0,o.z]}>
      {o.type==='barrier'?<><mesh position={[0,0.48,0]} castShadow><boxGeometry args={[1.15,0.95,0.8]}/><meshStandardMaterial color="#e35d43"/></mesh><mesh position={[0,0.5,0.42]}><boxGeometry args={[1.1,0.15,0.04]}/><meshStandardMaterial color="#f8e6c5"/></mesh></>:o.type==='train'?<><mesh position={[0,1.25,0]} castShadow><boxGeometry args={[1.35,2.5,2.4]}/><meshStandardMaterial color="#d99a45"/></mesh><mesh position={[0,1.6,1.22]}><boxGeometry args={[0.7,0.65,0.03]}/><meshStandardMaterial color="#385d70"/></mesh></>:<><mesh position={[0,1.35,0]}><boxGeometry args={[1.25,0.25,0.5]}/><meshStandardMaterial color="#5c7081"/></mesh><mesh position={[-0.52,0.7,0]}><boxGeometry args={[0.18,1.5,0.4]}/><meshStandardMaterial color="#5c7081"/></mesh><mesh position={[0.52,0.7,0]}><boxGeometry args={[0.18,1.5,0.4]}/><meshStandardMaterial color="#5c7081"/></mesh></>}
    </group>)}
    {coinData.map((c,i)=><group key={i} ref={el=>{if(el)coins.current[i]=el;}} position={[laneX[c.lane],c.y,c.z]}><mesh rotation={[Math.PI/2,0,0]}><torusGeometry args={[0.25,0.09,8,18]}/><meshStandardMaterial color="#ffd34e" metalness={0.65} roughness={0.25}/></mesh></group>)}
    <Runner face={face} outfit={outfit} lane={lane} jump={jump} duck={duck}/>
  </>;
}
export default function RunnerGame(props:Props) { return <div className="game-canvas"><Canvas shadows camera={{position:[0,5.2,9],fov:52}}><World {...props}/></Canvas></div>; }