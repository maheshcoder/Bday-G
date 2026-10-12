import * as THREE from 'three';
import { ATLAS, characterPose, EXPRESSIONS } from './character-poses.js';

// The illustrated reference stays illustrated: alpha cutouts move in 3D space.
export async function createMascotScene(host, atlasUrl) {
  const atlas = await new THREE.TextureLoader().loadAsync(atlasUrl);
  atlas.colorSpace = THREE.SRGBColorSpace;
  atlas.minFilter = THREE.LinearFilter;
  atlas.magFilter = THREE.LinearFilter;
  atlas.generateMipmaps = false;
  const canvas = document.createElement('canvas');
  const context = canvas.getContext('webgl2', { alpha: true, antialias: true });
  if (!context) {
    atlas.dispose();
    throw new Error('WebGL is unavailable');
  }
  canvas.setAttribute('aria-hidden', 'true');
  const renderer = new THREE.WebGLRenderer({
    canvas,
    context,
    alpha: true,
    antialias: true,
  });
  renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 1.75));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.setClearColor(0x000000, 0);
  host.append(canvas);
  const scene = new THREE.Scene();
  const camera = new THREE.OrthographicCamera(-1.4, 1.4, 1.4, -1.4, 0.1, 20);
  camera.position.set(0, 0.06, 5);
  camera.lookAt(0, 0.06, 0);
  const actor = new THREE.Group();
  scene.add(actor);
  const textures = Array.from({ length: 12 }, (_, index) => {
    const texture = atlas.clone();
    texture.repeat.set(1 / ATLAS.columns, 1 / ATLAS.rows);
    texture.offset.set(
      (index % ATLAS.columns) / ATLAS.columns,
      1 - (Math.floor(index / ATLAS.columns) + 1) / ATLAS.rows,
    );
    texture.needsUpdate = true;
    return texture;
  });
  const geometry = new THREE.PlaneGeometry(2.05, 2.5625);
  function layer(order) {
    const material = new THREE.MeshBasicMaterial({
      map: textures[4],
      transparent: true,
      depthWrite: false,
      side: THREE.DoubleSide,
      toneMapped: false,
      opacity: order ? 0 : 1,
    });
    const object = new THREE.Mesh(geometry, material);
    object.position.z = order * 0.001;
    object.renderOrder = order;
    actor.add(object);
    return object;
  }
  const base = layer(0);
  const overlay = layer(1);
  const shadowGeometry = new THREE.CircleGeometry(0.7, 32);
  const shadowMaterial = new THREE.MeshBasicMaterial({
    color: 0x756079,
    transparent: true,
    opacity: 0.1,
    depthWrite: false,
  });
  const shadow = new THREE.Mesh(shadowGeometry, shadowMaterial);
  shadow.position.set(0, -1.1, -0.08);
  shadow.scale.set(1, 0.06, 1);
  scene.add(shadow);
  let mood = 'loading';
  let targetIndex = 4;
  let transition;
  let moodStarted = performance.now();
  let paused = false;
  let visible = !document.hidden;
  let destroyed = false;
  let frame = 0;
  let lastRender = -Infinity;
  let lookX = 0;
  let lookY = 0;
  function changePose(index, time, instant = false) {
    if (index === targetIndex && !instant) return;
    if (instant) {
      targetIndex = index;
      base.material.map = textures[index];
      base.material.opacity = 1;
      overlay.material.opacity = 0;
      transition = null;
      return;
    }
    if (transition && (time - transition.start) / 200 >= 0.5) {
      base.material.map = textures[targetIndex];
    }
    targetIndex = index;
    overlay.material.map = textures[index];
    overlay.material.opacity = 0;
    base.material.opacity = 1;
    transition = { start: time };
  }
  function animateExpression(time) {
    let index = characterPose(mood).index;
    const elapsed = time - moodStarted;
    if (!paused && mood === 'success' && elapsed > 1200)
      index = EXPRESSIONS.excited;
    if (!paused && mood === 'idle' && elapsed % 9000 > 6800)
      index = EXPRESSIONS.blushing;
    changePose(index, time, paused);
    if (transition) {
      const amount = Math.min(1, (time - transition.start) / 200);
      base.material.opacity = 1 - amount;
      overlay.material.opacity = amount;
      if (amount === 1) {
        base.material.map = textures[targetIndex];
        base.material.opacity = 1;
        overlay.material.opacity = 0;
        transition = null;
      }
    }
  }
  function render(time = performance.now()) {
    const t = paused ? 0 : time / 1000;
    animateExpression(time);
    const busy = mood === 'loading' || mood === 'navigating';
    const joyful = mood === 'success' || mood === 'highfive';
    actor.position.y = paused
      ? 0
      : Math.sin(t * (joyful ? 7 : 2)) * (joyful ? 0.1 : 0.025);
    actor.position.x =
      !paused && mood === 'navigating' ? Math.sin(t * 6) * 0.055 : 0;
    actor.rotation.y = lookX * 0.1;
    actor.rotation.x = lookY * -0.025;
    actor.rotation.z =
      mood === 'error' ? -0.035 : busy && !paused ? Math.sin(t * 3) * 0.04 : 0;
    actor.scale.setScalar(joyful && !paused ? 1 + Math.sin(t * 7) * 0.02 : 1);
    shadow.scale.x = 1 - Math.max(0, actor.position.y) * 0.7;
    renderer.render(scene, camera);
  }
  function tick(time) {
    frame = 0;
    if (destroyed || paused || !visible) return;
    if (time - lastRender >= 1000 / 30) {
      render(time);
      lastRender = time;
    }
    frame = requestAnimationFrame(tick);
  }
  function schedule() {
    cancelAnimationFrame(frame);
    frame = 0;
    if (!destroyed && visible) {
      render();
      if (!paused) frame = requestAnimationFrame(tick);
    }
  }
  const resize = new ResizeObserver(() => {
    const width = host.clientWidth || 144;
    const height = host.clientHeight || 144;
    const aspect = width / height;
    camera.left = -1.4 * aspect;
    camera.right = 1.4 * aspect;
    camera.updateProjectionMatrix();
    renderer.setSize(width, height, false);
    schedule();
  });
  resize.observe(host);
  schedule();
  return {
    canvas,
    setMood(value) {
      if (value !== mood) moodStarted = performance.now();
      mood = value;
      schedule();
    },
    setLook(x, y) {
      if (!paused) {
        lookX = x;
        lookY = y;
      }
    },
    setPaused(value) {
      paused = value;
      lookX = 0;
      lookY = 0;
      schedule();
    },
    setVisible(value) {
      visible = value;
      schedule();
    },
    destroy() {
      destroyed = true;
      cancelAnimationFrame(frame);
      resize.disconnect();
      geometry.dispose();
      shadowGeometry.dispose();
      shadowMaterial.dispose();
      base.material.dispose();
      overlay.material.dispose();
      textures.forEach((texture) => texture.dispose());
      atlas.dispose();
      renderer.dispose();
      renderer.forceContextLoss();
      canvas.remove();
    },
  };
}
