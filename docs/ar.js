import * as THREE from 'three';
import {MindARThree} from 'mind-ar';
import {createWeddingStage} from './ar-scene.js';

const get = id => document.getElementById(id);
const status = get('status');
const help = get('scanning-help');
const found = get('found-note');
const errorBox = get('error-box');
const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
const sequence = [1, 0, 2];
let session;
let sculpture;
let clock;
let scanning = false;
let targetVisible = false;
let foundAt = -Infinity;
let lostAt = -Infinity;
let currentScene = 1;

function setStatus(message) { status.textContent = message; }

function showError(message) {
  get('error-message').textContent = message;
  errorBox.hidden = false;
  help.hidden = true;
  found.hidden = true;
  document.body.classList.remove('is-found');
  setStatus('Camera unavailable');
}

function beginSequence(now) {
  foundAt = now;
  currentScene = sequence[0];
  sculpture.reveal(now);
  sculpture.select(currentScene, now);
}

function animate() {
  const now = clock.getElapsedTime();
  if (targetVisible) {
    const phase = Math.max(0, now - foundAt - 4.7);
    const step = now - foundAt < 4.7 ? 0 : 1 + Math.floor(phase / 5.2);
    const next = sequence[step % sequence.length];
    if (next !== currentScene) {
      currentScene = next;
      sculpture.select(next, now);
    }
  }
  sculpture?.update(now);
  session.renderer.render(session.scene, session.camera);
}

async function start() {
  if (session || document.hidden) return;
  errorBox.hidden = true;
  help.hidden = false;
  found.hidden = true;
  setStatus('Opening camera…');
  if (!isSecureContext || !navigator.mediaDevices?.getUserMedia) {
    showError('Open this invitation through HTTPS, allow camera access, then reload the page.');
    return;
  }

  try {
    await document.fonts.ready;
    session = new MindARThree({
      container: get('ar-container'),
      imageTargetSrc: 'assets/card-target.mind',
      uiLoading: 'no', uiScanning: 'no', uiError: 'no',
      filterMinCF: .0005, filterBeta: .01
    });
    const {renderer, scene} = session;
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 2));
    scene.add(new THREE.AmbientLight(0xffe3b5, 1.6));
    const light = new THREE.PointLight(0xffc776, 3, 5);
    light.position.set(-.55, .8, 1.3);
    scene.add(light);

    const anchor = session.addAnchor(0);
    sculpture = await createWeddingStage(anchor.group, {reducedMotion});
    clock = new THREE.Clock();
    renderer.setAnimationLoop(animate);
    anchor.onTargetFound = () => {
      const now = clock.getElapsedTime();
      if (now - lostAt > 1.2 || !scanning) beginSequence(now);
      targetVisible = true;
      document.body.classList.add('is-found');
      setStatus('Invitation alive');
      help.hidden = true;
      found.hidden = false;
    };
    anchor.onTargetLost = () => {
      lostAt = clock.getElapsedTime();
      targetVisible = false;
      document.body.classList.remove('is-found');
      setStatus('Searching for the invitation');
      found.hidden = true;
      help.hidden = false;
    };
    await session.start();
    scanning = true;
    if (!targetVisible) setStatus('Searching for the invitation');
  } catch (error) {
    if (error) console.error(error);
    const denied = error?.name === 'NotAllowedError' || String(error).includes('Permission');
    await stop();
    showError(denied
      ? 'Camera access was declined. Allow camera access in your browser settings, then reload this page.'
      : 'The camera could not start. Check the browser camera permission and your connection, then reload this page.');
  }
}

async function stop() {
  const wasScanning = scanning;
  scanning = false;
  targetVisible = false;
  document.body.classList.remove('is-found');
  if (!session) return;
  const oldSession = session;
  session = null;
  try {
    oldSession.renderer.setAnimationLoop(null);
    if (wasScanning) await oldSession.stop();
    else oldSession.renderer.dispose();
  } catch (error) { console.warn(error); }
  sculpture?.dispose();
  sculpture = null;
  get('ar-container').replaceChildren();
}

document.addEventListener('visibilitychange', () => {
  if (document.hidden) stop();
  else start();
});
window.addEventListener('pagehide', () => stop());
start();
