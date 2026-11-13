import { Canvas, useFrame, useLoader } from '@react-three/fiber';
import { Suspense, useEffect, useMemo, useRef, useState } from 'react';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

type Props = {
  running: boolean;
  face?: string;
  outfit?: string;
  modelUrl?: string;
  hasShield: boolean;
  onScore: (score: number) => void;
  onCoin: () => void;
  onPowerup: () => void;
  onUseShield: () => void;
  onCrash: () => void;
};
type Action = 'left' | 'right' | 'jump' | 'duck';
const laneX = [-1.65, 0, 1.65];

function makeTexture(source?: string) {
  if (!source) return null;
  const image = new Image();
  image.src = source;
  const texture = new THREE.Texture(image);
  image.onload = () => { texture.needsUpdate = true; };
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

function GeneratedCharacter({ url }: { url: string }) {
  const gltf = useLoader(GLTFLoader, url);
  const model = useMemo(() => {
    const clone = gltf.scene.clone(true);
    const bounds = new THREE.Box3().setFromObject(clone);
    const size = bounds.getSize(new THREE.Vector3());
    const center = bounds.getCenter(new THREE.Vector3());
    const scale = 1.72 / Math.max(size.y, 0.01);
    clone.scale.setScalar(scale);
    clone.position.set(-center.x * scale, -bounds.min.y * scale, -center.z * scale);
    clone.traverse(object => {
      if (object instanceof THREE.Mesh) {
        object.castShadow = true;
        object.receiveShadow = true;
      }
    });
    return clone;
  }, [gltf.scene]);
  return <primitive object={model} />;
}

function FallbackCharacter({ face, outfit, duck, running }: { face?: string; outfit?: string; duck: boolean; running: boolean }) {
  const faceTexture = useMemo(() => makeTexture(face), [face]);
  const outfitTexture = useMemo(() => makeTexture(outfit), [outfit]);
  const leftLeg = useRef<THREE.Group>(null);
  const rightLeg = useRef<THREE.Group>(null);
  const leftArm = useRef<THREE.Group>(null);
  const rightArm = useRef<THREE.Group>(null);

  useFrame(({ clock }) => {
    const swing = running ? Math.sin(clock.elapsedTime * 13) * 0.55 : 0;
    if (leftLeg.current) leftLeg.current.rotation.x = swing;
    if (rightLeg.current) rightLeg.current.rotation.x = -swing;
    if (leftArm.current) leftArm.current.rotation.x = -swing * 0.8;
    if (rightArm.current) rightArm.current.rotation.x = swing * 0.8;
  });

  return (
    <group scale={duck ? [1, 0.62, 1] : [1, 1, 1]}>
      <mesh position={[0, 1.42, 0]} castShadow>
        <capsuleGeometry args={[0.31, 0.62, 6, 12]} />
        <meshStandardMaterial color="#e9a56f" map={outfitTexture || undefined} roughness={0.82} />
      </mesh>
      <mesh position={[0, 2.02, 0]} castShadow>
        <sphereGeometry args={[0.32, 28, 24]} />
        <meshStandardMaterial color="#d69a72" map={faceTexture || undefined} roughness={0.78} />
      </mesh>
      <mesh position={[0, 1.98, 0.29]}>
        <boxGeometry args={[0.38, 0.08, 0.08]} />
        <meshStandardMaterial color="#252b31" />
      </mesh>
      <group ref={leftArm} position={[-0.38, 1.62, 0]}>
        <mesh position={[0, -0.28, 0]} rotation={[0.12, 0, -0.12]} castShadow>
          <capsuleGeometry args={[0.095, 0.42, 4, 8]} />
          <meshStandardMaterial color="#e9a56f" roughness={0.8} />
        </mesh>
      </group>
      <group ref={rightArm} position={[0.38, 1.62, 0]}>
        <mesh position={[0, -0.28, 0]} rotation={[0.12, 0, 0.12]} castShadow>
          <capsuleGeometry args={[0.095, 0.42, 4, 8]} />
          <meshStandardMaterial color="#e9a56f" roughness={0.8} />
        </mesh>
      </group>
      <group ref={leftLeg} position={[-0.17, 0.98, 0]}>
        <mesh position={[0, -0.32, 0]} castShadow>
          <capsuleGeometry args={[0.12, 0.48, 4, 8]} />
          <meshStandardMaterial color="#273e59" roughness={0.86} />
        </mesh>
        <mesh position={[0, -0.6, 0.11]} castShadow>
          <boxGeometry args={[0.23, 0.13, 0.38]} />
          <meshStandardMaterial color="#f4f1e9" roughness={0.7} />
        </mesh>
      </group>
      <group ref={rightLeg} position={[0.17, 0.98, 0]}>
        <mesh position={[0, -0.32, 0]} castShadow>
          <capsuleGeometry args={[0.12, 0.48, 4, 8]} />
          <meshStandardMaterial color="#273e59" roughness={0.86} />
        </mesh>
        <mesh position={[0, -0.6, 0.11]} castShadow>
          <boxGeometry args={[0.23, 0.13, 0.38]} />
          <meshStandardMaterial color="#f4f1e9" roughness={0.7} />
        </mesh>
      </group>
    </group>
  );
}

function Runner({ face, outfit, modelUrl, lane, jump, duck, running }: {
  face?: string; outfit?: string; modelUrl?: string; lane: number; jump: number; duck: boolean; running: boolean;
}) {
  const group = useRef<THREE.Group>(null);
  useFrame((_, delta) => {
    if (group.current) {
      group.current.position.x = THREE.MathUtils.damp(group.current.position.x, laneX[lane], 13, delta);
      group.current.position.y = jump + (running && jump === 0 ? Math.sin(performance.now() * 0.012) * 0.035 : 0);
    }
  });
  return (
    <group ref={group} position={[laneX[lane], 0, 1.6]}>
      {modelUrl
        ? <Suspense fallback={<FallbackCharacter face={face} outfit={outfit} duck={duck} running={running} />}><GeneratedCharacter url={modelUrl} /></Suspense>
        : <FallbackCharacter face={face} outfit={outfit} duck={duck} running={running} />}
    </group>
  );
}

function Building({ x, z, height, width, color, windows = true }: {
  x: number; z: number; height: number; width: number; color: string; windows?: boolean;
}) {
  return (
    <group position={[x, height / 2 - 0.1, z]}>
      <mesh castShadow receiveShadow>
        <boxGeometry args={[width, height, 5]} />
        <meshStandardMaterial color={color} roughness={0.92} />
      </mesh>
      {windows && Array.from({ length: Math.max(2, Math.floor(height / 0.75)) }, (_, row) => (
        <group key={row} position={[0, -height / 2 + 0.55 + row * 0.72, 2.53]}>
          {[-0.32, 0.32].map((offset, index) => (
            <mesh key={index} position={[offset * width, 0, 0]}>
              <planeGeometry args={[0.25, 0.38]} />
              <meshStandardMaterial color={row % 3 === 0 ? '#f3c878' : '#315064'} emissive={row % 3 === 0 ? '#b77a35' : '#10202b'} emissiveIntensity={0.28} />
            </mesh>
          ))}
        </group>
      ))}
    </group>
  );
}

function World({ running, face, outfit, modelUrl, hasShield, onScore, onCoin, onPowerup, onUseShield, onCrash }: Props) {
  const [lane, setLane] = useState(1);
  const [jump, setJump] = useState(0);
  const [duck, setDuck] = useState(false);
  const laneRef = useRef(1);
  const jumpHeight = useRef(0);
  const jumpVelocity = useRef(0);
  const duckTimer = useRef(0);
  const obstacles = useRef<THREE.Group[]>([]);
  const coins = useRef<THREE.Group[]>([]);
  const powerups = useRef<THREE.Group[]>([]);
  const road = useRef<THREE.Group>(null);
  const distance = useRef(0);
  const speed = useRef(12);
  const scoreTimer = useRef(0);
  const crashed = useRef(false);

  const obstacleData = useMemo(() => Array.from({ length: 8 }, (_, i) => ({
    z: -13 - i * 9.2,
    lane: (i * 2 + 1) % 3,
    type: i % 3 === 0 ? 'barrier' : i % 3 === 1 ? 'train' : 'arch'
  })), []);
  const coinData = useMemo(() => Array.from({ length: 15 }, (_, i) => ({
    z: -8 - i * 5.5,
    lane: i % 3,
    y: i % 5 === 0 ? 2.1 : 1.12
  })), []);
  const powerupData = useMemo(() => [{ z: -48, lane: 0 }, { z: -112, lane: 2 }], []);

  useEffect(() => {
    const act = (event: Event) => {
      const action = (event as CustomEvent<Action>).detail;
      if (action === 'left') {
        laneRef.current = Math.max(0, laneRef.current - 1);
        setLane(laneRef.current);
      }
      if (action === 'right') {
        laneRef.current = Math.min(2, laneRef.current + 1);
        setLane(laneRef.current);
      }
      if (action === 'jump' && jumpHeight.current <= 0.02) jumpVelocity.current = 8.8;
      if (action === 'duck') duckTimer.current = 0.85;
    };
    window.addEventListener('runner-action', act);
    return () => window.removeEventListener('runner-action', act);
  }, []);

  useEffect(() => {
    if (!running) return;
    crashed.current = false;
    speed.current = 12;
    distance.current = 0;
    scoreTimer.current = 0;
    laneRef.current = 1;
    setLane(1);
    jumpHeight.current = 0;
    jumpVelocity.current = 0;
    setJump(0);
    duckTimer.current = 0;
    setDuck(false);
    obstacles.current.forEach((object, index) => {
      if (!object) return;
      object.position.set(laneX[obstacleData[index].lane], 0, obstacleData[index].z);
    });
    coins.current.forEach((object, index) => {
      if (!object) return;
      object.position.set(laneX[coinData[index].lane], coinData[index].y, coinData[index].z);
      object.visible = true;
      object.userData.cooldown = 0;
    });
    powerups.current.forEach((object, index) => {
      if (!object) return;
      object.position.set(laneX[powerupData[index].lane], 1.15, powerupData[index].z);
      object.visible = true;
    });
  }, [running, obstacleData, coinData, powerupData]);

  useFrame((_, delta) => {
    if (!running || crashed.current) return;
    const dt = Math.min(delta, 0.04);
    distance.current += speed.current * dt;
    speed.current = Math.min(25, 12 + distance.current * 0.018);
    scoreTimer.current += dt;

    if (scoreTimer.current >= 0.15) {
      onScore(Math.floor(distance.current * 3));
      scoreTimer.current = 0;
    }

    if (road.current) {
      road.current.children.forEach(child => {
        child.position.z += speed.current * dt;
        if (child.position.z > 4) child.position.z -= 54;
      });
    }

    obstacles.current.forEach(object => {
      if (!object) return;
      object.position.z += speed.current * dt;
      if (object.position.z > 5) {
        object.position.z -= 82;
        object.position.x = laneX[Math.floor(Math.random() * 3)];
      }
      if (object.position.z > 0.8 && object.position.z < 2.2 && Math.abs(object.position.x - laneX[laneRef.current]) < 0.68) {
        const type = object.userData.type as string;
        const cleared = (type === 'barrier' && jumpHeight.current > 0.82) || (type === 'arch' && duckTimer.current > 0);
        if (cleared) return;
        if (hasShield) {
          onUseShield();
          object.position.z = 4.5;
        } else {
          crashed.current = true;
          onCrash();
        }
      }
    });

    coins.current.forEach(object => {
      if (!object) return;
      if (!object.visible) {
        object.userData.cooldown = Math.max(0, (object.userData.cooldown || 0) - dt);
        if (object.userData.cooldown === 0) {
          object.visible = true;
          object.position.z -= 82;
        }
        return;
      }
      object.position.z += speed.current * dt;
      object.rotation.y += dt * 4;
      if (object.position.z > 5) {
        object.position.z -= 82;
        object.position.x = laneX[Math.floor(Math.random() * 3)];
      }
      if (object.position.z > 0.7 && object.position.z < 2.5 && Math.abs(object.position.x - laneX[laneRef.current]) < 0.68) {
        object.visible = false;
        object.userData.cooldown = 1.1;
        onCoin();
      }
    });

    powerups.current.forEach(object => {
      if (!object || !object.visible) return;
      object.position.z += speed.current * dt;
      object.rotation.y += dt * 2.4;
      if (object.position.z > 5) object.visible = false;
      if (object.position.z > 0.7 && object.position.z < 2.5 && Math.abs(object.position.x - laneX[laneRef.current]) < 0.68) {
        object.visible = false;
        onPowerup();
      }
    });

    if (jumpVelocity.current !== 0) {
      jumpVelocity.current -= 22 * dt;
      jumpHeight.current = Math.max(0, jumpHeight.current + jumpVelocity.current * dt);
      if (jumpHeight.current === 0) jumpVelocity.current = 0;
      setJump(jumpHeight.current);
    }
    if (duckTimer.current > 0) {
      duckTimer.current = Math.max(0, duckTimer.current - dt);
      setDuck(true);
    } else {
      setDuck(false);
    }
  });

  return (
    <>
      <color attach="background" args={['#8db8c3']} />
      <fog attach="fog" args={['#a5c7c8', 22, 72]} />
      <ambientLight intensity={0.72} />
      <hemisphereLight args={['#d9efff', '#34434b', 0.8]} />
      <directionalLight position={[5, 11, 7]} intensity={2.1} castShadow shadow-mapSize-width={1024} shadow-mapSize-height={1024} />
      <pointLight position={[-3, 4, -12]} intensity={18} distance={18} color="#f6c77b" />
      <pointLight position={[3, 4, -35]} intensity={18} distance={18} color="#f6c77b" />

      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.13, -28]} receiveShadow>
        <planeGeometry args={[9.5, 90]} />
        <meshStandardMaterial color="#34424a" roughness={0.95} />
      </mesh>
      <group ref={road}>
        {Array.from({ length: 18 }, (_, i) => (
          <group key={i} position={[0, 0, -i * 3 - 3]}>
            <mesh position={[-0.83, -0.105, 0]}><boxGeometry args={[0.035, 0.025, 1.25]} /><meshBasicMaterial color="#d4e2d8" /></mesh>
            <mesh position={[0.83, -0.105, 0]}><boxGeometry args={[0.035, 0.025, 1.25]} /><meshBasicMaterial color="#d4e2d8" /></mesh>
          </group>
        ))}
      </group>

      <mesh position={[-4.7, 2.2, -26]}><boxGeometry args={[0.35, 4.5, 88]} /><meshStandardMaterial color="#697c80" roughness={0.9} /></mesh>
      <mesh position={[4.7, 2.2, -26]}><boxGeometry args={[0.35, 4.5, 88]} /><meshStandardMaterial color="#697c80" roughness={0.9} /></mesh>

      {Array.from({ length: 8 }, (_, i) => (
        <group key={i}>
          <Building x={-6.2} z={-i * 10 - 12} height={5 + (i % 3) * 1.7} width={2.2} color={i % 2 ? '#647b80' : '#8c8273'} />
          <Building x={6.2} z={-i * 10 - 16} height={6 + (i % 4) * 1.3} width={2.2} color={i % 2 ? '#7b8580' : '#687b82'} />
        </group>
      ))}

      {obstacleData.map((item, index) => (
        <group
          key={index}
          ref={element => {
            if (element) {
              obstacles.current[index] = element;
              element.userData.type = item.type;
            }
          }}
          position={[laneX[item.lane], 0, item.z]}
        >
          {item.type === 'barrier' ? (
            <>
              <mesh position={[0, 0.48, 0]} castShadow><boxGeometry args={[1.12, 0.92, 0.72]} /><meshStandardMaterial color="#e15f42" roughness={0.7} /></mesh>
              <mesh position={[0, 0.5, 0.37]}><boxGeometry args={[1.08, 0.14, 0.035]} /><meshStandardMaterial color="#f5e7c8" /></mesh>
              <mesh position={[-0.42, 0.98, 0]}><boxGeometry args={[0.08, 0.22, 0.78]} /><meshStandardMaterial color="#d6d0bf" /></mesh>
            </>
          ) : item.type === 'train' ? (
            <>
              <mesh position={[0, 1.22, 0]} castShadow><boxGeometry args={[1.42, 2.44, 2.65]} /><meshStandardMaterial color="#d99b45" metalness={0.18} roughness={0.42} /></mesh>
              <mesh position={[0, 1.55, 1.34]}><boxGeometry args={[0.72, 0.64, 0.035]} /><meshStandardMaterial color="#274c61" metalness={0.35} roughness={0.24} /></mesh>
              <mesh position={[0, 0.22, 1.34]}><boxGeometry args={[0.95, 0.08, 0.04]} /><meshStandardMaterial color="#f4d28a" emissive="#9a6025" emissiveIntensity={0.25} /></mesh>
            </>
          ) : (
            <>
              <mesh position={[0, 1.45, 0]} castShadow><boxGeometry args={[1.28, 0.24, 0.48]} /><meshStandardMaterial color="#536c78" metalness={0.35} roughness={0.5} /></mesh>
              <mesh position={[-0.54, 0.72, 0]} castShadow><boxGeometry args={[0.18, 1.48, 0.38]} /><meshStandardMaterial color="#536c78" metalness={0.35} roughness={0.5} /></mesh>
              <mesh position={[0.54, 0.72, 0]} castShadow><boxGeometry args={[0.18, 1.48, 0.38]} /><meshStandardMaterial color="#536c78" metalness={0.35} roughness={0.5} /></mesh>
            </>
          )}
        </group>
      ))}

      {coinData.map((coin, index) => (
        <group key={index} ref={element => { if (element) coins.current[index] = element; }} position={[laneX[coin.lane], coin.y, coin.z]}>
          <mesh rotation={[Math.PI / 2, 0, 0]} castShadow>
            <torusGeometry args={[0.25, 0.085, 10, 24]} />
            <meshStandardMaterial color="#ffd34e" metalness={0.82} roughness={0.2} emissive="#8e5b0c" emissiveIntensity={0.15} />
          </mesh>
        </group>
      ))}

      {powerupData.map((powerup, index) => (
        <group key={index} ref={element => { if (element) powerups.current[index] = element; }} position={[laneX[powerup.lane], 1.15, powerup.z]}>
          <mesh rotation={[Math.PI / 2, 0, 0]}><torusGeometry args={[0.38, 0.12, 12, 24]} /><meshStandardMaterial color="#66e6bd" emissive="#159b83" emissiveIntensity={0.8} metalness={0.35} roughness={0.25} /></mesh>
          <mesh><icosahedronGeometry args={[0.2, 1]} /><meshStandardMaterial color="#e0fff5" emissive="#4cd6ad" emissiveIntensity={0.7} /></mesh>
        </group>
      ))}

      <Runner face={face} outfit={outfit} modelUrl={modelUrl} lane={lane} jump={jump} duck={duck} running={running} />
    </>
  );
}

export default function RunnerGame(props: Props) {
  return (
    <div className="game-canvas">
      <Canvas shadows dpr={[1, 1.5]} camera={{ position: [0, 5.4, 9.5], fov: 50 }} gl={{ antialias: true, powerPreference: 'high-performance' }}>
        <World {...props} />
      </Canvas>
    </div>
  );
}
