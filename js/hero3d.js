const canvas = document.getElementById('devlibHero3d');
const host = canvas?.closest('.hero-3d');
const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;

if (canvas && host && !reducedMotion) {
  initHero3d().catch(() => {
    host.classList.add('is-static');
  });
} else if (host) {
  host.classList.add('is-static');
}

async function initHero3d() {
  const THREE = await import('https://cdn.jsdelivr.net/npm/three@0.184.0/build/three.module.js');

  if (!isWebglAvailable()) {
    host.classList.add('is-static');
    return;
  }

  const renderer = new THREE.WebGLRenderer({
    canvas,
    alpha: true,
    antialias: true,
    powerPreference: 'high-performance',
  });
  renderer.setClearColor(0x000000, 0);
  renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 1.75));

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(42, 1, 0.1, 80);
  camera.position.set(0, 0.65, 9.2);

  const rig = new THREE.Group();
  const core = new THREE.Group();
  const orbit = new THREE.Group();
  scene.add(rig);
  rig.add(core, orbit);

  scene.add(makeLight(THREE, 0xffffff, 2.2, -3.5, 4, 6));
  scene.add(makeLight(THREE, 0x22d3ee, 2.8, 5, -2, 3));
  scene.add(makeLight(THREE, 0xf472b6, 1.8, -5, -1, -2));

  const colors = {
    violet: new THREE.Color(0xa78bfa),
    cyan: new THREE.Color(0x22d3ee),
    pink: new THREE.Color(0xf472b6),
    amber: new THREE.Color(0xfbbf24),
    emerald: new THREE.Color(0x34d399),
    dark: new THREE.Color(0x101321),
  };

  const haloMaterial = new THREE.MeshBasicMaterial({
    color: colors.violet,
    transparent: true,
    opacity: 0.18,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  });
  const halo = new THREE.Mesh(new THREE.TorusGeometry(2.6, 0.012, 12, 160), haloMaterial);
  halo.rotation.x = Math.PI * 0.58;
  core.add(halo);

  const knot = new THREE.Mesh(
    new THREE.TorusKnotGeometry(0.86, 0.18, 180, 18, 2, 5),
    new THREE.MeshPhysicalMaterial({
      color: colors.violet,
      emissive: colors.cyan,
      emissiveIntensity: 0.18,
      roughness: 0.28,
      metalness: 0.62,
      clearcoat: 0.7,
      transparent: true,
      opacity: 0.92,
    })
  );
  core.add(knot);

  const panelGeometry = new THREE.BoxGeometry(1.22, 0.74, 0.055);
  const panelEdges = new THREE.EdgesGeometry(panelGeometry);
  const libraryNodes = [
    ['Three.js', colors.cyan, -2.7, 1.6, -0.9],
    ['Magic UI', colors.pink, 2.65, 1.28, -0.6],
    ['ReUI', colors.emerald, -3.15, -0.5, 0.35],
    ['HeroUI', colors.violet, 3.05, -0.45, 0.25],
    ['Aceternity', colors.amber, -1.55, -1.95, -0.25],
    ['shadcn', colors.cyan, 1.65, -1.8, -0.45],
  ];

  const textSprites = [];
  libraryNodes.forEach(([label, color, x, y, z], index) => {
    const panel = new THREE.Group();
    const material = new THREE.MeshPhysicalMaterial({
      color: colors.dark,
      emissive: color,
      emissiveIntensity: 0.12,
      roughness: 0.38,
      metalness: 0.12,
      transparent: true,
      opacity: 0.72,
    });
    const mesh = new THREE.Mesh(panelGeometry, material);
    const wire = new THREE.LineSegments(
      panelEdges,
      new THREE.LineBasicMaterial({ color, transparent: true, opacity: 0.78 })
    );
    panel.add(mesh, wire);
    panel.position.set(x, y, z);
    panel.rotation.set((index % 2 ? -0.08 : 0.08), -x * 0.08, (index % 2 ? -0.08 : 0.08));
    orbit.add(panel);

    const sprite = makeLabelSprite(THREE, label, color);
    sprite.position.set(x, y, z + 0.08);
    orbit.add(sprite);
    textSprites.push(sprite);
  });

  const linkMaterial = new THREE.LineBasicMaterial({
    color: colors.cyan,
    transparent: true,
    opacity: 0.24,
  });
  libraryNodes.forEach(([, , x, y, z]) => {
    const geometry = new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(0, 0, 0),
      new THREE.Vector3(x, y, z),
    ]);
    orbit.add(new THREE.Line(geometry, linkMaterial));
  });

  const particles = makeParticles(THREE, colors);
  scene.add(particles);

  const pointer = { x: 0, y: 0, tx: 0, ty: 0 };
  addEventListener('pointermove', (event) => {
    pointer.tx = (event.clientX / innerWidth - 0.5) * 2;
    pointer.ty = (event.clientY / innerHeight - 0.5) * 2;
  }, { passive: true });

  let running = true;
  document.addEventListener('visibilitychange', () => {
    running = !document.hidden;
    if (running) renderer.setAnimationLoop(render);
    else renderer.setAnimationLoop(null);
  });

  const ro = new ResizeObserver(resize);
  ro.observe(host);
  resize();
  renderer.setAnimationLoop(render);

  function resize() {
    const rect = host.getBoundingClientRect();
    const width = Math.max(1, Math.floor(rect.width));
    const height = Math.max(1, Math.floor(rect.height));
    renderer.setSize(width, height, false);
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
  }

  function render(timeMs) {
    const time = timeMs * 0.001;
    pointer.x += (pointer.tx - pointer.x) * 0.055;
    pointer.y += (pointer.ty - pointer.y) * 0.055;

    rig.rotation.y = pointer.x * 0.22;
    rig.rotation.x = -pointer.y * 0.12;
    core.rotation.y = time * 0.24;
    core.rotation.z = Math.sin(time * 0.5) * 0.08;
    orbit.rotation.y = time * 0.08;
    orbit.rotation.z = Math.sin(time * 0.38) * 0.035;
    halo.rotation.z = time * 0.18;
    knot.rotation.x = time * 0.32;
    knot.rotation.y = time * 0.46;
    particles.rotation.y = time * 0.028;
    particles.rotation.x = Math.sin(time * 0.18) * 0.04;

    textSprites.forEach((sprite) => {
      sprite.quaternion.copy(camera.quaternion);
    });

    if (running) renderer.render(scene, camera);
  }
}

function makeLight(THREE, color, intensity, x, y, z) {
  const light = new THREE.PointLight(color, intensity, 20);
  light.position.set(x, y, z);
  return light;
}

function makeParticles(THREE, colors) {
  const count = 360;
  const positions = new Float32Array(count * 3);
  const colorData = new Float32Array(count * 3);
  const palette = [colors.violet, colors.cyan, colors.pink, colors.emerald, colors.amber];

  for (let i = 0; i < count; i += 1) {
    const radius = 4.2 + Math.random() * 4.6;
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.acos(2 * Math.random() - 1);
    positions[i * 3] = radius * Math.sin(phi) * Math.cos(theta);
    positions[i * 3 + 1] = radius * Math.sin(phi) * Math.sin(theta) * 0.62;
    positions[i * 3 + 2] = radius * Math.cos(phi) - 1.2;
    palette[i % palette.length].toArray(colorData, i * 3);
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  geometry.setAttribute('color', new THREE.BufferAttribute(colorData, 3));

  return new THREE.Points(
    geometry,
    new THREE.PointsMaterial({
      size: 0.035,
      vertexColors: true,
      transparent: true,
      opacity: 0.62,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    })
  );
}

function makeLabelSprite(THREE, label, color) {
  const canvas2d = document.createElement('canvas');
  canvas2d.width = 512;
  canvas2d.height = 160;
  const ctx = canvas2d.getContext('2d');
  const [r, g, b] = color.toArray().map((value) => Math.round(value * 255));

  ctx.clearRect(0, 0, canvas2d.width, canvas2d.height);
  ctx.fillStyle = 'rgba(7, 8, 15, 0.72)';
  roundRect(ctx, 28, 34, 456, 92, 22);
  ctx.fill();
  ctx.strokeStyle = `rgba(${r}, ${g}, ${b}, 0.86)`;
  ctx.lineWidth = 3;
  roundRect(ctx, 28, 34, 456, 92, 22);
  ctx.stroke();
  ctx.fillStyle = 'rgba(245, 245, 247, 0.96)';
  ctx.font = '600 42px Geist, Inter, system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(label, 256, 81);

  const texture = new THREE.CanvasTexture(canvas2d);
  texture.colorSpace = THREE.SRGBColorSpace;
  const sprite = new THREE.Sprite(new THREE.SpriteMaterial({
    map: texture,
    transparent: true,
    depthWrite: false,
  }));
  sprite.scale.set(1.24, 0.39, 1);
  return sprite;
}

function roundRect(ctx, x, y, width, height, radius) {
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.arcTo(x + width, y, x + width, y + height, radius);
  ctx.arcTo(x + width, y + height, x, y + height, radius);
  ctx.arcTo(x, y + height, x, y, radius);
  ctx.arcTo(x, y, x + width, y, radius);
  ctx.closePath();
}

function isWebglAvailable() {
  const probe = document.createElement('canvas');
  return Boolean(
    window.WebGLRenderingContext &&
    (probe.getContext('webgl') || probe.getContext('experimental-webgl'))
  );
}
