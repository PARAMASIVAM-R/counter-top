// A 3D preview of the counter: the stone top on cabinets, with walls, backsplash and seams.
// Loaded only when the 3D tab is opened (three.js is large). Sizes are inches; the stone top sits at y = 0.

import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import type { StoneColor } from '../counter/priceList';
import { type Counter, edgeLength, outline, outwardNormal, type Point, roundedOutline, STANDARD_DEPTH } from '../counter/shapes';
import type { Seam } from '../counter/slabs';
import { stoneTexture, TEXTURE_INCHES } from '../stone/texture';

const THICKNESS = 1.25; // 3 cm slab
const CABINET_HEIGHT = 34.5;
const OVERHANG = STANDARD_DEPTH - 24; // stone sticks out 1½" past the cabinet fronts
const SPLASH_HEIGHT = 4;
const SPLASH_THICKNESS = 0.75;
const WALL_HEIGHT = 30; // drawn above the counter
const RADIUS = 3;

/** Edge profiles shown as a bevel on the stone's outline: how far in, how deep, how round. */
const PROFILES: Record<string, { size: number; segments: number }> = {
  eased: { size: 0.125, segments: 2 },
  bevel: { size: 0.375, segments: 1 },
  halfBullnose: { size: 0.5, segments: 5 },
  fullBullnose: { size: 0.6, segments: 6 },
  ogee: { size: 0.45, segments: 3 },
};

interface Props {
  counter: Counter;
  color: StoneColor;
  edgeProfileId: string;
  seams: Seam[];
}

interface Stage {
  renderer: THREE.WebGLRenderer;
  scene: THREE.Scene;
  camera: THREE.PerspectiveCamera;
  controls: OrbitControls;
  model: THREE.Group;
}

export default function Counter3D({ counter, color, edgeProfileId, seams }: Props) {
  const host = useRef<HTMLDivElement>(null);
  const stage = useRef<Stage | null>(null);
  const framedKind = useRef<string | null>(null);
  const [failed, setFailed] = useState(false);

  // Set up the renderer once
  useEffect(() => {
    const el = host.current!;
    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    } catch {
      setFailed(true);
      return;
    }
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    el.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    const pmrem = new THREE.PMREMGenerator(renderer);
    scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture; // soft reflections on polished stone
    scene.add(new THREE.AmbientLight(0xffffff, 0.25));
    const sun = new THREE.DirectionalLight(0xffffff, 1.6);
    sun.position.set(-60, 160, 140);
    sun.castShadow = true;
    sun.shadow.mapSize.set(2048, 2048);
    Object.assign(sun.shadow.camera, { left: -250, right: 250, top: 250, bottom: -250, near: 1, far: 600 });
    scene.add(sun);

    const camera = new THREE.PerspectiveCamera(35, 1, 1, 5000);
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.maxPolarAngle = Math.PI * 0.47; // don't go under the floor
    controls.minDistance = 40;
    controls.maxDistance = 900;

    const model = new THREE.Group();
    scene.add(model);
    stage.current = { renderer, scene, camera, controls, model };
    framedKind.current = null; // a new camera needs aiming

    const resize = () => {
      const width = el.clientWidth;
      const height = Math.round(Math.min(520, Math.max(320, width * 0.62)));
      renderer.setSize(width, height);
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
    };
    const observer = new ResizeObserver(resize);
    observer.observe(el);
    resize();
    renderer.setAnimationLoop(() => {
      controls.update();
      renderer.render(scene, camera);
    });

    return () => {
      observer.disconnect();
      renderer.setAnimationLoop(null);
      disposeChildren(model);
      controls.dispose();
      pmrem.dispose();
      renderer.dispose();
      renderer.domElement.remove();
      stage.current = null;
    };
  }, []);

  // Rebuild the model whenever the drawing or stone changes
  useEffect(() => {
    const s = stage.current;
    if (!s) return;
    disposeChildren(s.model);
    buildModel(s.model, counter, color, edgeProfileId, seams);
    if (framedKind.current !== counter.kind) {
      frame(s, counter); // re-aim the camera only when the shape changes, not on every keystroke
      framedKind.current = counter.kind;
    }
  }, [counter, color, edgeProfileId, seams]);

  if (failed) return <p className="muted">This browser can't show 3D (WebGL is off). The plan view has everything.</p>;
  return (
    <div className="view-3d">
      <div ref={host} className="view-3d-canvas" />
      <div className="view-3d-bar">
        <span className="muted">Drag to turn, scroll to zoom, right-drag to move</span>
        <button type="button" className="link-button" onClick={() => stage.current && frame(stage.current, counter)}>
          Reset view
        </button>
      </div>
    </div>
  );
}

function buildModel(model: THREE.Group, counter: Counter, color: StoneColor, edgeProfileId: string, seams: Seam[]) {
  const stoneMap = new THREE.CanvasTexture(stoneTexture(color).canvas);
  stoneMap.colorSpace = THREE.SRGBColorSpace;
  stoneMap.wrapS = stoneMap.wrapT = THREE.RepeatWrapping;
  stoneMap.repeat.set(1 / TEXTURE_INCHES, 1 / TEXTURE_INCHES); // geometry UVs are in inches
  stoneMap.anisotropy = 8;
  const stone = new THREE.MeshPhysicalMaterial({ map: stoneMap, roughness: 0.22, clearcoat: 0.6, clearcoatRoughness: 0.15 });

  // The stone top, with the edge profile as a bevel and radius corners rounded
  const profile = PROFILES[edgeProfileId] ?? PROFILES.eased;
  const top = new THREE.Mesh(
    new THREE.ExtrudeGeometry(shapeFrom(counter, RADIUS), {
      depth: THICKNESS - 2 * profile.size,
      bevelEnabled: true,
      bevelSize: profile.size,
      bevelThickness: profile.size,
      bevelSegments: profile.segments,
      curveSegments: 12,
    }),
    stone,
  );
  layFlat(top, -profile.size);
  top.castShadow = top.receiveShadow = true;
  model.add(top);

  // Cabinets: the same shape, set back by the overhang
  const cabinetCounter: Counter = { ...counter, legs: counter.legs.map((l) => ({ ...l, depth: Math.max(1, l.depth - OVERHANG) })) };
  const cabinets = new THREE.Mesh(
    new THREE.ExtrudeGeometry(shapeFrom(cabinetCounter, 0), { depth: CABINET_HEIGHT, bevelEnabled: false }),
    new THREE.MeshStandardMaterial({ color: 0x5b6878, roughness: 0.6 }), // painted cabinets, so light and dark stones both stand out
  );
  layFlat(cabinets, -THICKNESS);
  cabinets.castShadow = cabinets.receiveShadow = true;
  model.add(cabinets);

  const points = outline(counter);
  const xs = points.map((p) => p.x);
  const ys = points.map((p) => p.y);
  const floorY = -THICKNESS - CABINET_HEIGHT;

  const floor = new THREE.Mesh(new THREE.PlaneGeometry(2000, 2000), new THREE.MeshStandardMaterial({ color: 0xc9b79c, roughness: 0.9 })); // light oak floor
  floor.rotation.x = -Math.PI / 2;
  floor.position.set((Math.min(...xs) + Math.max(...xs)) / 2, floorY, (Math.min(...ys) + Math.max(...ys)) / 2);
  floor.receiveShadow = true;
  model.add(floor);

  const wallMaterial = new THREE.MeshStandardMaterial({ color: 0xf7f5f1, roughness: 0.9, side: THREE.DoubleSide });
  counter.edges.forEach((type, i) => {
    if (type === 'finished') return;
    const a = points[i];
    const b = points[(i + 1) % points.length];
    const length = edgeLength(points, i);
    const out = outwardNormal(points, i);
    const angle = -Math.atan2(b.y - a.y, b.x - a.x);
    const mid = { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };

    // Wall behind the counter, from the floor up
    const wallHeight = CABINET_HEIGHT + THICKNESS + WALL_HEIGHT;
    const wall = new THREE.Mesh(new THREE.BoxGeometry(length + 8, wallHeight, 4), wallMaterial);
    wall.position.set(mid.x + out.x * 2, floorY + wallHeight / 2, mid.y + out.y * 2);
    wall.rotation.y = angle;
    wall.receiveShadow = true;
    model.add(wall);

    if (type === 'backsplash') {
      const splashMap = stoneMap.clone();
      splashMap.repeat.set(length / TEXTURE_INCHES, SPLASH_HEIGHT / TEXTURE_INCHES);
      splashMap.needsUpdate = true;
      const splash = new THREE.Mesh(
        new THREE.BoxGeometry(length, SPLASH_HEIGHT, SPLASH_THICKNESS),
        new THREE.MeshPhysicalMaterial({ map: splashMap, roughness: 0.22, clearcoat: 0.6 }),
      );
      splash.position.set(mid.x - out.x * (SPLASH_THICKNESS / 2), SPLASH_HEIGHT / 2, mid.y - out.y * (SPLASH_THICKNESS / 2));
      splash.rotation.y = angle;
      splash.castShadow = true;
      model.add(splash);
    }
  });

  // Seams as thin dark lines on the top
  if (seams.length) {
    const positions = seams.flatMap((s) => [s.a.x, 0.02, s.a.y, s.b.x, 0.02, s.b.y]);
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    model.add(new THREE.LineSegments(geometry, new THREE.LineBasicMaterial({ color: 0x8a2b26 })));
  }
}

/** The outline as a three.js shape, in plan coordinates (x right, y towards the front). */
function shapeFrom(counter: Counter, radius: number): THREE.Shape {
  const { points, rounded, ends } = roundedOutline(counter, radius);
  const shape = new THREE.Shape();
  shape.moveTo(ends[0].a.x, ends[0].a.y);
  points.forEach((p: Point, i) => {
    shape.lineTo(ends[i].a.x, ends[i].a.y);
    if (rounded[i]) shape.quadraticCurveTo(p.x, p.y, ends[i].b.x, ends[i].b.y);
  });
  shape.closePath();
  return shape;
}

/** Shapes are drawn on x/y and extruded along z; turn them so plan y runs towards the viewer and they hang down from `top`. */
function layFlat(mesh: THREE.Mesh, top: number) {
  mesh.rotation.x = Math.PI / 2;
  mesh.position.y = top;
}

/** Points the camera at the counter from the front, a little to the side and above, like standing in the kitchen. */
function frame({ camera, controls }: Stage, counter: Counter) {
  const points = outline(counter);
  const width = Math.max(...points.map((p) => p.x));
  const depth = Math.max(...points.map((p) => p.y));
  const size = Math.max(width, depth, 60);
  const target = new THREE.Vector3(width / 2, -12, depth / 2);
  camera.position.set(target.x + size * 0.3, size * 0.7, target.z + size * 1.1);
  controls.target.copy(target);
  controls.update();
}

function disposeChildren(group: THREE.Group) {
  for (const child of [...group.children]) {
    group.remove(child);
    if (child instanceof THREE.Mesh || child instanceof THREE.LineSegments) {
      child.geometry.dispose();
      const materials = Array.isArray(child.material) ? child.material : [child.material];
      for (const m of materials) {
        (m as THREE.MeshStandardMaterial).map?.dispose();
        m.dispose();
      }
    }
  }
}
