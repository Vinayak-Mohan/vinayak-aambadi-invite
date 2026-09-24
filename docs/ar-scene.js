import * as THREE from 'three';

const ease = value => 1 - Math.pow(1 - Math.max(0, Math.min(1, value)), 3);
const progress = (time, delay, duration) => ease((time - delay) / duration);

function panel(texture, width, height, opacity = 1) {
  return new THREE.Mesh(
    new THREE.PlaneGeometry(width, height),
    new THREE.MeshBasicMaterial({
      map: texture, transparent: true, opacity, depthWrite: false,
      side: THREE.DoubleSide, toneMapped: false
    })
  );
}

function textTexture(lines, width = 1024, height = 276) {
  const canvas = document.createElement('canvas');
  canvas.width = width; canvas.height = height;
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = 'rgba(49, 12, 28, .97)';
  ctx.beginPath(); ctx.roundRect(12, 12, width - 24, height - 24, 20); ctx.fill();
  ctx.strokeStyle = '#e9c685'; ctx.lineWidth = 7; ctx.stroke();
  ctx.textAlign = 'center';
  ctx.fillStyle = '#fff3d8';
  ctx.font = '67px "Bodoni Moda", Georgia, serif';
  ctx.fillText(lines[0], width / 2, 121);
  ctx.fillStyle = '#e9ca91';
  ctx.font = '500 30px "DM Sans", Arial, sans-serif';
  ctx.fillText(lines[1], width / 2, 199);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

// The tracked card is the XY plane. A +90° rotation around X makes each panel
// stand on it: its artwork's vertical direction becomes the card's +Z normal.
function hingedPanel(texture, width, height, cardY, lift = 0) {
  const hinge = new THREE.Group();
  hinge.position.set(0, cardY, lift);
  const artwork = panel(texture, width, height);
  artwork.position.y = height / 2;
  hinge.add(artwork);
  return {hinge, artwork};
}

function lotus(x, y, material, centerMaterial) {
  const flower = new THREE.Group();
  flower.position.set(x, y, .035);
  for (let index = 0; index < 7; index++) {
    const angle = index * Math.PI * 2 / 7;
    const petal = new THREE.Mesh(new THREE.SphereGeometry(.055, 8, 6), material);
    petal.scale.set(.48, 1.24, .24);
    petal.position.set(Math.cos(angle) * .042, Math.sin(angle) * .042, .018);
    petal.rotation.z = angle - Math.PI / 2;
    flower.add(petal);
  }
  const heart = new THREE.Mesh(new THREE.SphereGeometry(.022, 10, 8), centerMaterial);
  heart.scale.z = .5;
  heart.position.z = .033;
  flower.add(heart);
  return flower;
}

export async function createWeddingStage(parent, {reducedMotion = false, assetRoot = ''} = {}) {
  const loader = new THREE.TextureLoader();
  const paths = [
    'assets/ceremonial-arch.webp',
    'assets/illustrated-couple-portrait.webp',
    'assets/illustrated-couple-standing.webp',
    'assets/illustrated-couple-swing.webp'
  ];
  const textures = await Promise.all(paths.map(path => loader.loadAsync(assetRoot + path)));
  textures.forEach(texture => {
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.anisotropy = 4;
  });

  const stage = new THREE.Group();
  stage.scale.setScalar(.43);
  parent.add(stage);
  const gold = new THREE.MeshBasicMaterial({color: 0xe8bf75, transparent: true, opacity: .86, side: THREE.DoubleSide});
  const dimGold = new THREE.MeshBasicMaterial({color: 0xffd992, transparent: true, opacity: .48, side: THREE.DoubleSide});
  const wine = new THREE.MeshStandardMaterial({color: 0x9d344b, roughness: .46, metalness: .2});

  // Shallow ornament rests on the printed surface and gives the unfolding art
  // a visible physical origin instead of making it hover over the camera feed.
  const base = new THREE.Group();
  stage.add(base);
  const oval = new THREE.Mesh(new THREE.TorusGeometry(.67, .008, 6, 96), gold);
  oval.scale.y = .60; oval.position.set(0, -.07, .014); base.add(oval);
  const innerOval = new THREE.Mesh(new THREE.TorusGeometry(.58, .0035, 5, 96), dimGold);
  innerOval.scale.y = .61; innerOval.position.set(0, -.07, .017); base.add(innerOval);
  const lotuses = [
    lotus(-.51, -.29, wine, gold), lotus(.51, -.29, wine, gold),
    lotus(-.48, .17, wine, gold), lotus(.48, .17, wine, gold)
  ];
  lotuses.forEach(flower => base.add(flower));

  const arch = hingedPanel(textures[0], 1.55, 1.04, .20, .025);
  stage.add(arch.hinge);
  const figures = [
    hingedPanel(textures[1], .72, .83, -.11, .045),
    hingedPanel(textures[2], .68, 1.02, -.13, .045),
    hingedPanel(textures[3], .68, 1.02, -.13, .045)
  ];
  figures.forEach(item => stage.add(item.hinge));
  figures.forEach(item => { item.artwork.material.opacity = 0; item.hinge.visible = false; });

  const captions = [
    ['With our families', 'YOUR PRESENCE IS OUR BLESSING'],
    ['Vinayak & Aambadi', '11 FEBRUARY 2027'],
    ['A new chapter', 'TOGETHER, FROM THIS DAY']
  ].map(lines => hingedPanel(textTexture(lines), 1.10, .29, -.45, .07));
  captions.forEach(item => stage.add(item.hinge));
  captions.forEach(item => { item.artwork.material.opacity = 0; item.hinge.visible = false; });

  const sparkles = [];
  const sparkleGeometry = new THREE.SphereGeometry(.009, 6, 5);
  for (let index = 0; index < 20; index++) {
    const point = new THREE.Mesh(sparkleGeometry, index % 3 ? gold : dimGold);
    const phase = index * 2.399963;
    const radius = .22 + Math.sqrt(index / 20) * .39;
    point.position.set(Math.cos(phase) * radius, Math.sin(phase) * radius - .03, .025);
    stage.add(point);
    sparkles.push({point, phase, rise: .22 + (index % 5) * .045});
  }

  let selected = 1;
  let startTime = 0;
  let sceneTime = 0;
  let playing = false;
  let lastUpdate = 0;

  function reveal(elapsed) {
    startTime = elapsed;
    sceneTime = elapsed;
    playing = true;
    lastUpdate = elapsed;
    stage.visible = true;
  }

  function select(index, elapsed) {
    selected = index;
    sceneTime = elapsed;
  }

  function update(elapsed) {
    if (!playing) return;
    const delta = Math.max(0, Math.min(.1, elapsed - lastUpdate));
    lastUpdate = elapsed;
    const t = reducedMotion ? 10 : elapsed - startTime;
    const sceneT = reducedMotion ? 10 : elapsed - sceneTime;
    const baseIn = progress(t, 0, .55);
    base.scale.setScalar(Math.max(.001, baseIn));
    base.visible = baseIn > .01;

    const archIn = progress(t, .38, 1.25);
    arch.hinge.rotation.x = Math.PI / 2 * archIn;
    arch.artwork.material.opacity = archIn;
    arch.hinge.visible = archIn > .01;

    figures.forEach((figure, index) => {
      const active = index === selected;
      const incoming = active ? progress(Math.min(t - 1.02, sceneT), 0, .92) : 0;
      const oldOpacity = figure.artwork.material.opacity;
      const opacity = active ? incoming : reducedMotion ? 0 : Math.max(0, oldOpacity - delta * 3.8);
      figure.hinge.rotation.x = Math.PI / 2 * opacity;
      figure.artwork.material.opacity = opacity;
      figure.hinge.visible = opacity > .01;
      if (active && !reducedMotion) figure.hinge.rotation.z = Math.sin(elapsed * .9) * .008 * incoming;
    });

    captions.forEach((caption, index) => {
      const active = index === selected;
      const incoming = active ? progress(Math.min(t - 1.83, sceneT - .50), 0, .62) : 0;
      const oldOpacity = caption.artwork.material.opacity;
      const opacity = active ? incoming : reducedMotion ? 0 : Math.max(0, oldOpacity - delta * 4.5);
      caption.hinge.rotation.x = Math.PI / 2 * opacity;
      caption.artwork.material.opacity = opacity;
      caption.hinge.visible = opacity > .01;
    });

    const glimmer = progress(t, 2.05, .8);
    sparkles.forEach(({point, phase, rise}) => {
      point.visible = glimmer > .01;
      point.position.z = .025 + rise * glimmer + (reducedMotion ? 0 : Math.sin(elapsed * 1.35 + phase) * .018 * glimmer);
      point.scale.setScalar(glimmer * (1 + (reducedMotion ? 0 : Math.sin(elapsed * 1.7 + phase) * .22)));
    });
    if (!reducedMotion) lotuses.forEach((flower, index) => {
      flower.rotation.z = Math.sin(elapsed * .6 + index) * .07;
    });
  }

  stage.visible = false;
  return {stage, reveal, select, update, dispose() {
    parent.remove(stage);
    stage.traverse(object => {
      if (object.isMesh) object.geometry.dispose();
    });
    [...textures, ...captions.map(item => item.artwork.material.map)].forEach(texture => texture.dispose());
    stage.traverse(object => {
      if (object.isMesh && object.material !== gold && object.material !== dimGold && object.material !== wine) object.material.dispose();
    });
    gold.dispose(); dimGold.dispose(); wine.dispose(); sparkleGeometry.dispose();
  }};
}
