"use client";

import { useMemo, useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { mergeGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js";
import type { RevealAccent } from "@/lib/utils/forms/teamReveal";
import { TIMELINE } from "./teamTimeline";


type SceneProps = {
  color: string;
  accent: RevealAccent;
  moons: { isYou: boolean }[];
  // performance.now() when the sequence started; null = waiting on the pad.
  startedAt: number | null;
  // Skip straight to the final pose (reduced motion / replay off).
  final: boolean;
};

const clamp01 = (x: number) => Math.min(1, Math.max(0, x));
const easeOut = (x: number) => 1 - Math.pow(1 - clamp01(x), 3);
const easeIn = (x: number) => Math.pow(clamp01(x), 2.2);

function useElapsed(startedAt: number | null, final: boolean) {
  return () => {
    if (final) return 60;
    if (startedAt === null) return 0;
    return (performance.now() - startedAt) / 1000;
  };
}

// Streaking starfield: each star is a short segment stretched by warp speed.
function StarField({ elapsed }: { elapsed: () => number }) {
  const COUNT = 1400;
  const { geometry, base } = useMemo(() => {
    const base = new Float32Array(COUNT * 3);
    for (let i = 0; i < COUNT; i++) {
      const r = 6 + Math.random() * 70;
      const a = Math.random() * Math.PI * 2;
      base[i * 3] = Math.cos(a) * r;
      base[i * 3 + 1] = Math.sin(a) * r;
      base[i * 3 + 2] = -Math.random() * 220 + 20;
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute(
      "position",
      new THREE.BufferAttribute(new Float32Array(COUNT * 6), 3),
    );
    return { geometry: g, base };
  }, []);
  const material = useRef<THREE.LineBasicMaterial>(null);

  useFrame((_, dt) => {
    const t = elapsed();
    // Idle drift, accelerate into warp, then settle once we arrive.
    const warpIn = easeIn((t - TIMELINE.warp + 0.6) / 1.2);
    const warpOut = easeOut((t - TIMELINE.arrive) / 1.4);
    const speed = 0.15 + warpIn * (1 - warpOut) * 9 + warpOut * 0.05;
    const stretch = 0.05 + warpIn * (1 - warpOut) * 7;
    const pos = geometry.attributes.position.array as Float32Array;
    for (let i = 0; i < COUNT; i++) {
      let z = base[i * 3 + 2] + speed * Math.min(dt, 0.05) * 60;
      if (z > 20) z -= 220;
      base[i * 3 + 2] = z;
      const x = base[i * 3];
      const y = base[i * 3 + 1];
      pos[i * 6] = x;
      pos[i * 6 + 1] = y;
      pos[i * 6 + 2] = z;
      pos[i * 6 + 3] = x;
      pos[i * 6 + 4] = y;
      pos[i * 6 + 5] = z - stretch;
    }
    geometry.attributes.position.needsUpdate = true;
    if (material.current) material.current.opacity = 0.55 + warpIn * 0.4;
  });

  return (
    <lineSegments geometry={geometry}>
      <lineBasicMaterial
        ref={material}
        color="#c9d2ff"
        transparent
        opacity={0.6}
      />
    </lineSegments>
  );
}

function Rocket({ color, elapsed }: { color: string; elapsed: () => number }) {
  const group = useRef<THREE.Group>(null);
  const flame = useRef<THREE.Mesh>(null);
  const PARTICLES = 220;
  const { geometry, life, vel } = useMemo(() => {
    const g = new THREE.BufferGeometry();
    g.setAttribute(
      "position",
      new THREE.BufferAttribute(new Float32Array(PARTICLES * 3), 3),
    );
    return {
      geometry: g,
      life: new Float32Array(PARTICLES).map(() => Math.random()),
      vel: new Float32Array(PARTICLES * 3),
    };
  }, []);

  useFrame((_, dt) => {
    const t = elapsed();
    if (!group.current) return;
    const lift = easeIn((t - TIMELINE.liftoff) / (TIMELINE.warp - TIMELINE.liftoff));
    const rumble = t > TIMELINE.liftoff - 1.2 && t < TIMELINE.warp ? 0.03 : 0;
    group.current.position.set(
      (Math.random() - 0.5) * rumble,
      -2.6 + lift * 26,
      -9,
    );
    group.current.visible = t < TIMELINE.warp + 0.3;
    // Exhaust: idles on the pad, roars at liftoff.
    const power = t < TIMELINE.liftoff - 1.5 ? 0.25 : t < TIMELINE.liftoff ? 0.6 : 1;
    if (flame.current) {
      flame.current.scale.set(1, 0.6 + power * 1.6 + Math.random() * 0.3, 1);
    }
    const pos = geometry.attributes.position.array as Float32Array;
    const step = Math.min(dt, 0.05);
    for (let i = 0; i < PARTICLES; i++) {
      life[i] += step * (1.2 + power);
      if (life[i] > 1) {
        life[i] = 0;
        pos[i * 3] = (Math.random() - 0.5) * 0.3;
        pos[i * 3 + 1] = -1.9;
        pos[i * 3 + 2] = (Math.random() - 0.5) * 0.3;
        vel[i * 3] = (Math.random() - 0.5) * 1.6 * power;
        vel[i * 3 + 1] = -(2 + Math.random() * 4) * power;
        vel[i * 3 + 2] = (Math.random() - 0.5) * 1.6 * power;
      }
      pos[i * 3] += vel[i * 3] * step;
      pos[i * 3 + 1] += vel[i * 3 + 1] * step;
      pos[i * 3 + 2] += vel[i * 3 + 2] * step;
    }
    geometry.attributes.position.needsUpdate = true;
  });

  return (
    <group ref={group}>
      {/* body */}
      <mesh>
        <cylinderGeometry args={[0.42, 0.5, 2.6, 32]} />
        <meshStandardMaterial color="#eef1ff" metalness={0.3} roughness={0.35} />
      </mesh>
      {/* nose */}
      <mesh position={[0, 1.85, 0]}>
        <coneGeometry args={[0.42, 1.1, 32]} />
        <meshStandardMaterial color={color} metalness={0.4} roughness={0.3} />
      </mesh>
      {/* window */}
      <mesh position={[0, 0.55, 0.43]}>
        <sphereGeometry args={[0.17, 24, 24]} />
        <meshStandardMaterial color="#9fe7ff" emissive="#4cc9ff" emissiveIntensity={0.8} />
      </mesh>
      {/* fins */}
      {[0, 1, 2].map((i) => (
        <mesh
          key={i}
          rotation={[0, (i * Math.PI * 2) / 3, 0]}
          position={[
            Math.sin((i * Math.PI * 2) / 3) * 0.5,
            -1.05,
            Math.cos((i * Math.PI * 2) / 3) * 0.5,
          ]}
        >
          <boxGeometry args={[0.06, 0.8, 0.55]} />
          <meshStandardMaterial color={color} />
        </mesh>
      ))}
      {/* flame core */}
      <mesh ref={flame} position={[0, -1.75, 0]} rotation={[Math.PI, 0, 0]}>
        <coneGeometry args={[0.32, 0.9, 24, 1, true]} />
        <meshBasicMaterial
          color="#ffb04a"
          transparent
          opacity={0.85}
          blending={THREE.AdditiveBlending}
        />
      </mesh>
      <points geometry={geometry}>
        <pointsMaterial
          size={0.12}
          color="#ff8a3d"
          transparent
          opacity={0.8}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </points>
    </group>
  );
}

// Glow that is brightest at the silhouette, fading toward the centre.
function glowShader(color: string) {
  return {
    uniforms: { glowColor: { value: new THREE.Color(color) } },
    vertexShader: `
      varying float intensity;
      void main() {
        vec3 n = normalize(normalMatrix * normal);
        vec3 v = normalize(-(modelViewMatrix * vec4(position, 1.0)).xyz);
        // Back faces: n.v runs from about -0.53 at the planet's limb to 0 at
        // the shell's edge, so this fades the halo outward.
        intensity = pow(clamp(-dot(n, v) / 0.55, 0.0, 1.0), 2.2);
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }`,
    fragmentShader: `
      uniform vec3 glowColor;
      varying float intensity;
      void main() { gl_FragColor = vec4(glowColor, 1.0) * intensity * 0.55; }`,
  };
}

// Point on a sphere from latitude/longitude in radians.
const onSphere = (r: number, lat: number, lon: number) =>
  new THREE.Vector3(
    r * Math.cos(lat) * Math.cos(lon),
    r * Math.sin(lat),
    r * Math.cos(lat) * Math.sin(lon),
  );

function Accent({ accent, color }: { accent: RevealAccent; color: string }) {
  const group = useRef<THREE.Group>(null);
  const pulses = useRef<THREE.Group>(null);

  const data = useMemo(() => {
    const c = new THREE.Color(color);
    if (accent === "graph") {
      // System-design whiteboard: typed components linked into a graph.
      const nodes = Array.from({ length: 7 }, (_, i) =>
        onSphere(5.6, Math.sin(i * 1.7) * 0.5, (i / 7) * Math.PI * 2),
      );
      const edges: [number, number][] = [
        [0, 1], [1, 2], [2, 3], [3, 4], [4, 5], [5, 6], [6, 0], [0, 3], [1, 5],
      ];
      return { c, nodes, edges };
    }
    if (accent === "constellation") {
      // People and labs: a shell of stars joined to their nearest neighbours.
      const nodes = Array.from({ length: 26 }, () =>
        onSphere(5.4, Math.asin(Math.random() * 2 - 1), Math.random() * Math.PI * 2),
      );
      const edges: [number, number][] = [];
      nodes.forEach((n, i) => {
        nodes
          .map((m, j) => [j, n.distanceTo(m)] as const)
          .filter(([j]) => j !== i)
          .sort((a, b) => a[1] - b[1])
          .slice(0, 2)
          .forEach(([j]) => edges.push([i, j]));
      });
      return { c, nodes, edges };
    }
    if (accent === "cluster") {
      // Distributed nodes passing messages around a ring.
      const nodes = Array.from({ length: 8 }, (_, i) =>
        onSphere(5.8, (i % 2 ? 1 : -1) * 0.35, (i / 8) * Math.PI * 2),
      );
      const edges = nodes.map((_, i) => [i, (i + 1) % 8] as [number, number]);
      edges.push([0, 4], [2, 6]);
      return { c, nodes, edges };
    }
    if (accent === "arcs") {
      // Probes around the world reporting back: arcs hopping across the globe.
      const nodes = Array.from({ length: 14 }, () =>
        onSphere(4.05, Math.asin(Math.random() * 1.6 - 0.8), Math.random() * Math.PI * 2),
      );
      const edges: [number, number][] = nodes.map((_, i) => [i, (i * 5 + 3) % 14]);
      return { c, nodes, edges };
    }
    return { c, nodes: [], edges: [] as [number, number][] };
  }, [accent, color]);

  // Edges as thin tubes, merged into one mesh: GL lines are always 1px wide,
  // which nearly disappears on high-DPI phone screens.
  const edgeGeometry = useMemo(() => {
    const radius = accent === "constellation" ? 0.035 : 0.05;
    const tubes = data.edges.map(([a, b]) => {
      const A = data.nodes[a];
      const B = data.nodes[b];
      const curve =
        accent === "arcs"
          ? new THREE.QuadraticBezierCurve3(
              A,
              A.clone().add(B).multiplyScalar(0.5).normalize().multiplyScalar(6.4),
              B,
            )
          : new THREE.LineCurve3(A, B);
      return new THREE.TubeGeometry(curve, accent === "arcs" ? 32 : 2, radius, 6, false);
    });
    return tubes.length ? mergeGeometries(tubes) : null;
  }, [data, accent]);

  // A lighter tint of the team colour so the signature pops off the planet.
  const bright = useMemo(() => data.c.clone().lerp(new THREE.Color("#ffffff"), 0.35), [data]);

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    if (group.current) group.current.rotation.y = t * 0.12;
    // Message pulses travelling along cluster/graph/arc edges.
    pulses.current?.children.forEach((child, i) => {
      const [a, b] = data.edges[i % data.edges.length];
      const k = (t * 0.45 + i * 0.37) % 1;
      child.position.lerpVectors(data.nodes[a], data.nodes[b], k);
    });
  });

  if (accent === "rings") {
    return (
      <group ref={group}>
        {[6.9, 7.9].map((r, i) => (
          <group key={r} rotation={[Math.PI / 2 + 0.35 + i * 0.18, 0.2, 0]}>
            <mesh>
              <torusGeometry args={[r, 0.07, 10, 200]} />
              <meshBasicMaterial color={bright} transparent opacity={0.8} />
            </mesh>
            {[0, 2.1, 4.2].map((a) => (
              <mesh key={a} position={[Math.cos(a + i) * r, Math.sin(a + i) * r, 0]}>
                <boxGeometry args={[0.35, 0.35, 0.35]} />
                <meshBasicMaterial color="#ffffff" />
              </mesh>
            ))}
          </group>
        ))}
      </group>
    );
  }

  return (
    <group ref={group}>
      {edgeGeometry && (
        <mesh geometry={edgeGeometry}>
          <meshBasicMaterial color={bright} transparent opacity={0.85} />
        </mesh>
      )}
      {data.nodes.map((n, i) =>
        accent === "graph" ? (
          <mesh key={i} position={n} rotation={[0.4, i, 0]}>
            <boxGeometry args={[0.75, 0.5, 0.5]} />
            <meshStandardMaterial color={bright} emissive={data.c} emissiveIntensity={0.6} />
          </mesh>
        ) : (
          <mesh key={i} position={n}>
            <sphereGeometry args={[accent === "constellation" ? 0.13 : 0.2, 14, 14]} />
            <meshBasicMaterial color="#ffffff" />
          </mesh>
        ),
      )}
      {accent !== "constellation" && (
        <group ref={pulses}>
          {Array.from({ length: 6 }, (_, i) => (
            <mesh key={i}>
              <sphereGeometry args={[0.17, 12, 12]} />
              <meshBasicMaterial color="#ffffff" />
            </mesh>
          ))}
        </group>
      )}
    </group>
  );
}

function Planet({
  color,
  accent,
  moons,
  elapsed,
}: {
  color: string;
  accent: RevealAccent;
  moons: { isYou: boolean }[];
  elapsed: () => number;
}) {
  const root = useRef<THREE.Group>(null);
  const body = useRef<THREE.Mesh>(null);
  const moonRefs = useRef<THREE.Mesh[]>([]);

  // Each teammate is a moon on its own tilted orbit; yours is the bright one.
  const orbits = useMemo(
    () =>
      moons.map((m, i) => ({
        radius: 6.4 + (i % 4) * 0.55,
        speed: 0.25 + ((i * 37) % 10) / 40,
        phase: (i / Math.max(moons.length, 1)) * Math.PI * 2,
        tilt: 0.25 + ((i * 13) % 7) / 18,
        isYou: m.isYou,
      })),
    [moons],
  );

  const surface = useMemo(() => {
    // Banded procedural texture so the planet reads as a world, not a ball.
    const canvas = document.createElement("canvas");
    canvas.width = 512;
    canvas.height = 256;
    const ctx = canvas.getContext("2d")!;
    const base = new THREE.Color(color);
    for (let y = 0; y < 256; y++) {
      const band = 0.75 + 0.25 * Math.sin(y * 0.09) + 0.08 * Math.sin(y * 0.41);
      const c = base.clone().multiplyScalar(band);
      ctx.fillStyle = `rgb(${c.r * 255},${c.g * 255},${c.b * 255})`;
      ctx.fillRect(0, y, 512, 1);
    }
    for (let i = 0; i < 160; i++) {
      ctx.fillStyle = `rgba(255,255,255,${Math.random() * 0.08})`;
      ctx.beginPath();
      ctx.ellipse(Math.random() * 512, Math.random() * 256, 8 + Math.random() * 40, 2 + Math.random() * 5, 0, 0, Math.PI * 2);
      ctx.fill();
    }
    const tex = new THREE.CanvasTexture(canvas);
    tex.colorSpace = THREE.SRGBColorSpace;
    return tex;
  }, [color]);

  useFrame((state) => {
    const t = elapsed();
    const arrive = easeOut((t - TIMELINE.arrive + 0.4) / 2.4);
    if (root.current) {
      root.current.visible = t > TIMELINE.warp + 0.8;
      // Final spot clears the team card: right of it on wide screens, above
      // it (and a little smaller) on narrow ones.
      const aspect = state.size.width / state.size.height;
      const wide = aspect > 1.15;
      const z = wide ? -17 : -24;
      // Half the visible height at the planet's depth (camera sits at z=9).
      const halfH = Math.tan(((55 / 2) * Math.PI) / 180) * (9 - z);
      const target = wide
        ? [Math.min(6.2, halfH * aspect * 0.42), 0.3]
        : [0, halfH * 0.5]; // centre ~25% from the top on phones
      // Fit the planet + ring + moons (radius ~8.5) into the free space.
      const fit = wide ? 1 : Math.min(0.85, (halfH * aspect * 0.9) / 8.5);
      root.current.position.set(
        target[0] * arrive,
        target[1] * arrive,
        -90 + arrive * (90 + z),
      );
      root.current.scale.setScalar((0.35 + arrive * 0.65) * fit);
    }
    const clock = state.clock.getElapsedTime();
    if (body.current) body.current.rotation.y = clock * 0.08;
    orbits.forEach((o, i) => {
      const mesh = moonRefs.current[i];
      if (!mesh) return;
      const a = o.phase + clock * o.speed;
      mesh.position.set(
        Math.cos(a) * o.radius,
        Math.sin(a) * o.radius * Math.sin(o.tilt),
        Math.sin(a) * o.radius * Math.cos(o.tilt),
      );
    });
  });

  return (
    <group ref={root} visible={false}>
      <mesh ref={body}>
        <sphereGeometry args={[4, 64, 64]} />
        <meshStandardMaterial map={surface} roughness={0.85} metalness={0.05} emissive={color} emissiveIntensity={0.12} />
      </mesh>
      {/* atmosphere: fresnel rim glow */}
      <mesh scale={1.18}>
        <sphereGeometry args={[4, 48, 48]} />
        <shaderMaterial
          args={[glowShader(color)]}
          transparent
          side={THREE.BackSide}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </mesh>
      {accent === "arcs" && (
        <mesh>
          <sphereGeometry args={[4.03, 24, 16]} />
          <meshBasicMaterial color="#ffffff" wireframe transparent opacity={0.12} />
        </mesh>
      )}
      <mesh rotation={[Math.PI / 2 - 0.35, 0.15, 0]}>
        <torusGeometry args={[5.2, 0.06, 8, 180]} />
        <meshBasicMaterial color={color} transparent opacity={0.55} />
      </mesh>
      <Accent accent={accent} color={color} />
      {orbits.map((o, i) => (
        <mesh key={i} ref={(m) => { if (m) moonRefs.current[i] = m; }}>
          <sphereGeometry args={[o.isYou ? 0.36 : 0.22, 20, 20]} />
          <meshStandardMaterial
            color={o.isYou ? "#ffffff" : color}
            emissive={o.isYou ? "#ffffff" : color}
            emissiveIntensity={o.isYou ? 1.4 : 0.5}
          />
        </mesh>
      ))}
    </group>
  );
}

function CameraRig({ elapsed }: { elapsed: () => number }) {
  useFrame(({ camera }) => {
    const t = elapsed();
    // Track the rocket up at liftoff, then glide back to frame the planet.
    const follow = easeIn((t - TIMELINE.liftoff) / 2.2) * (1 - easeOut((t - TIMELINE.warp) / 1.2));
    const settle = easeOut((t - TIMELINE.arrive) / 2.4);
    camera.position.set(0, follow * 3.5, 9);
    camera.lookAt(0, follow * 6 + settle * 0.4, -10);
  });
  return null;
}

export default function TeamScene({ color, accent, moons, startedAt, final }: SceneProps) {
  const elapsed = useElapsed(startedAt, final);
  return (
    <Canvas
      dpr={[1, 1.75]}
      camera={{ fov: 55, near: 0.1, far: 400, position: [0, 0, 9] }}
      gl={{ antialias: true, alpha: true }}
    >
      <ambientLight intensity={0.35} />
      <pointLight position={[14, 10, 10]} intensity={900} color="#ffffff" />
      <directionalLight position={[-10, 4, -6]} intensity={1.4} color={color} />
      <StarField elapsed={elapsed} />
      <Rocket color={color} elapsed={elapsed} />
      <Planet color={color} accent={accent} moons={moons} elapsed={elapsed} />
      <CameraRig elapsed={elapsed} />
    </Canvas>
  );
}
