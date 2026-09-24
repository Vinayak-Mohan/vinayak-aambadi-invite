import * as THREE from 'three';
import {MindARThree} from 'mind-ar';
import {createWeddingStage} from './ar-scene.js';

const get = id => document.getElementById(id);
const intro = get('intro');
const status = get('status');
const help = get('scanning-help');
const found = get('found-note');
const controls = get('scene-controls');
const errorBox = get('error-box');
const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
const messages = [
  '✦ &nbsp; Your blessings, our joy &nbsp; ✦',
  '✦ &nbsp; 11 February 2027 &nbsp; ✦',
  '✦ &nbsp; Vinayak &amp; Aambadi &nbsp; ✦'
];
let session;
let sculpture;
let running = false;
let selected = 1;
let clock;
let lostAt = -Infinity;

function setStatus(message) { status.textContent = message; }
function showError(message) {
  get('error-message').textContent = message;
  errorBox.hidden = false;
  setStatus('Camera unavailable');
}

function selectScene(index) {
  selected = index;
  controls.querySelectorAll('button[data-scene]').forEach(button => {
    button.setAttribute('aria-pressed', String(Number(button.dataset.scene) === index));
  });
  found.innerHTML = messages[index];
  if (sculpture && clock) sculpture.select(index, clock.getElapsedTime());
}

async function start() {
  if (running || session) return;
  errorBox.hidden = true;
  if (!isSecureContext || !navigator.mediaDevices?.getUserMedia) {
    showError('Open this page through HTTPS on your phone, then allow camera access.');
    return;
  }
  get('start').disabled = true;
  setStatus('Preparing your camera…');
  try {
    await document.fonts.ready;
    session = new MindARThree({
      container: get('ar-container'),
      imageTargetSrc: 'assets/card-target.mind',
      uiLoading: 'no', uiScanning: 'no', uiError: 'no',
      filterMinCF: .0005, filterBeta: .01
    });
    const {renderer, scene, camera} = session;
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 2));
    scene.add(new THREE.AmbientLight(0xffe3b5, 1.6));
    const light = new THREE.PointLight(0xffc776, 3, 5);
    light.position.set(-.55, .8, 1.3);
    scene.add(light);

    const anchor = session.addAnchor(0);
    sculpture = await createWeddingStage(anchor.group, {reducedMotion});
    clock = new THREE.Clock();
    renderer.setAnimationLoop(() => {
      sculpture?.update(clock.getElapsedTime());
      renderer.render(scene, camera);
    });
    anchor.onTargetFound = () => {
      const now = clock.getElapsedTime();
      if (now - lostAt > 1.2 || !running) {
        sculpture.reveal(now);
        sculpture.select(selected, now);
      }
      setStatus('The card is alive');
      help.hidden = true; found.hidden = false; controls.hidden = false;
    };
    anchor.onTargetLost = () => {
      lostAt = clock.getElapsedTime();
      setStatus('Searching for the card');
      found.hidden = true; controls.hidden = true; help.hidden = false;
    };
    await session.start();
    running = true;
    intro.hidden = true; help.hidden = false;
    setStatus('Searching for the card');
  } catch (error) {
    console.error(error);
    const denied = error?.name === 'NotAllowedError' || String(error).includes('Permission');
    await stop(false);
    showError(denied
      ? 'Camera access was declined. Enable camera permission in your browser settings, then try again.'
      : 'Please check your camera, connection, and browser settings, then try again.');
  } finally { get('start').disabled = false; }
}

async function stop(showIntro = true) {
  if (session) {
    try {
      session.renderer.setAnimationLoop(null);
      await session.stop();
    } catch (error) { console.warn(error); }
    sculpture?.dispose();
    sculpture = null;
    session = null;
    get('ar-container').replaceChildren();
  }
  running = false;
  help.hidden = true; found.hidden = true; controls.hidden = true;
  if (showIntro) {
    intro.hidden = false;
    errorBox.hidden = true;
    setStatus('Ready to begin');
  }
}

get('start').addEventListener('click', start);
get('retry').addEventListener('click', start);
get('stop').addEventListener('click', () => stop());
get('replay').addEventListener('click', () => {
  if (sculpture && clock) sculpture.reveal(clock.getElapsedTime());
});
controls.querySelectorAll('button[data-scene]').forEach(button => {
  button.addEventListener('click', () => selectScene(Number(button.dataset.scene)));
});
document.addEventListener('visibilitychange', () => {
  if (document.hidden && running) stop();
});
