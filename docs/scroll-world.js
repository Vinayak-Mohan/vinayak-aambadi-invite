import {FramePlayhead} from './frame-playhead.mjs';

/* Native scrolling remains immediate. Films catch up through adjacent frames.
   Missing frames hold the last picture without advancing an invisible playhead. */
const preference = matchMedia('(prefers-reduced-motion: reduce)');
const economical = navigator.connection?.saveData || /(^|-)2g$/.test(navigator.connection?.effectiveType || '');
const clamp = value => Math.max(0, Math.min(1, value));
const close = image => image.close?.();
const manifests = new Map();
const debug = new URLSearchParams(location.search).has('film-debug');
function manifestAt(url) {
  if (!manifests.has(url)) manifests.set(url, fetch(url, {cache:'force-cache'}).then(response => {
    if (!response.ok) throw Error('Film unavailable');
    return response.json();
  }).catch(error => {manifests.delete(url); throw error;}));
  return manifests.get(url);
}

if (!economical) document.querySelectorAll('.scroll-world[data-manifest]').forEach(stage => {
  const canvas = stage.querySelector('canvas');
  const ctx = canvas?.getContext('2d', {alpha:false});
  if (!ctx) return;
  const phone = matchMedia('(max-width:700px)');
  const cache = new Map(), pending = new Map(), failures = new Map();
  const scene = stage.closest('.scene');
  let config, playhead, epoch = 0, active = false, raf = 0, last = 0;
  let target = 0, width = 0, height = 0, lastWidth = innerWidth, direction = 1;
  let needsPaint = true, retryTimer = 0, releaseTimer = 0;
  const schedule = () => {
    if (!raf && active && !document.hidden && !preference.matches) raf = requestAnimationFrame(paint);
  };
  function measure() {
    const rect = stage.getBoundingClientRect();
    const ratio = Math.min(devicePixelRatio || 1, phone.matches ? 1.25 : 1.5);
    width = Math.max(1, Math.round(rect.width * ratio));
    height = Math.max(1, Math.round(rect.height * ratio));
    stage.style.setProperty('--world-inset', Math.max(0, (rect.height - rect.width * 16 / 9) / 2) + 'px');
    if (canvas.width !== width || canvas.height !== height) {
      canvas.width = width; canvas.height = height; needsPaint = true;
    }
  }
  function update() {
    const before = target;
    if (stage.dataset.world === 'page') {
      target = clamp(scrollY / Math.max(1, document.documentElement.scrollHeight - innerHeight));
    } else {
      const rect = scene.getBoundingClientRect();
      target = clamp((innerHeight - rect.top) / (innerHeight + rect.height));
    }
    if (target !== before) direction = target > before ? 1 : -1;
    schedule();
  }
  function trimCache() {
    if (!playhead || !config) return;
    const current = Math.floor(playhead.position / config.perSheet);
    const keys = [...cache.keys()].sort((a,b) => Math.abs(b-current)-Math.abs(a-current));
    for (const key of keys) if (cache.size > 3 && key !== current) {
      close(cache.get(key)); cache.delete(key);
    }
  }
  function request(index) {
    if (!config || index < 0 || index >= config.sheets.length || cache.has(index) || pending.has(index)) return;
    if ((failures.get(index)?.until || 0) > performance.now() || pending.size >= 2) return;
    const generation = epoch, controller = new AbortController(), url = config.sheets[index];
    const task = {controller}; pending.set(index, task);
    (async () => {
      const response = await fetch(url, {cache:'force-cache', priority:'low', signal:controller.signal});
      if (!response.ok) throw Error('Film frames unavailable');
      const blob = await response.blob();
      let image;
      if ('createImageBitmap' in window) image = await createImageBitmap(blob);
      else {
        const objectURL = URL.createObjectURL(blob);
        try {image = new Image(); image.src = objectURL; await image.decode();}
        finally {URL.revokeObjectURL(objectURL);}
      }
      if (generation !== epoch || preference.matches) {close(image); return;}
      cache.set(index, image); failures.delete(index); trimCache(); needsPaint = true;
    })().catch(error => {
      if (generation === epoch && error.name !== 'AbortError') {
        const count = (failures.get(index)?.count || 0) + 1;
        failures.set(index, {count, until:performance.now() + Math.min(15000, 1000 * 2 ** count)});
        clearTimeout(retryTimer);
        if (count < 4) retryTimer = setTimeout(schedule, Math.min(15000, 1000 * 2 ** count));
      }
    }).finally(() => {
      if (pending.get(index) === task) pending.delete(index);
      if (generation === epoch) schedule();
    });
  }
  function available(position) {
    const first = Math.floor(position), second = Math.min(config.frames-1, Math.ceil(position));
    const a = Math.floor(first / config.perSheet), b = Math.floor(second / config.perSheet);
    request(a); request(b);
    return cache.has(a) && cache.has(b);
  }
  function drawFrame(frame, alpha) {
    const image = cache.get(Math.floor(frame / config.perSheet));
    const local = frame % config.perSheet;
    const scale = phone.matches ? Math.min(width/config.width, height/config.height) : Math.max(width/config.width, height/config.height);
    const dw = config.width*scale, dh = config.height*scale;
    ctx.globalAlpha = alpha;
    if (alpha === 1) {ctx.fillStyle = '#24101e'; ctx.fillRect(0,0,width,height);}
    ctx.drawImage(image, (local%config.columns)*config.width, Math.floor(local/config.columns)*config.height,
      config.width, config.height, (width-dw)/2, (height-dh)/2, dw, dh);
  }
  function paint(now) {
    raf = 0;
    if (!config || !active || document.hidden || preference.matches) return;
    const elapsed = now - (last || now-16.667); last = now;
    const destination = target*(config.frames-1);
    const travelDirection = Math.sign(destination-playhead.position) || direction;
    const proposed = playhead.next(destination, elapsed);
    const ready = available(proposed);
    if (ready && (needsPaint || proposed !== playhead.position)) {
      playhead.commit(proposed);
      const frame = Math.floor(proposed), blend = proposed-frame;
      drawFrame(frame, 1);
      if (blend > 0) drawFrame(Math.ceil(proposed), blend);
      ctx.globalAlpha = 1; needsPaint = false;
      stage.classList.add('world-painted'); canvas.dataset.frame = String(frame);
      if (debug) {
        const trace = (canvas.dataset.trace || '').split(',').filter(Boolean);
        if (Number(trace.at(-1)) !== frame || !trace.length) trace.push(String(frame));
        canvas.dataset.trace = trace.slice(-512).join(',');
      }
    }
    const sheet = Math.floor(playhead.position/config.perSheet);
    request(sheet + travelDirection);
    trimCache();
    // A pending decoder wakes the renderer. Buffering never runs a busy loop.
    if (ready && Math.abs(destination-playhead.position) > 0.001) schedule();
  }
  function release() {
    epoch++;
    if (raf) cancelAnimationFrame(raf); raf = 0; last = 0;
    pending.forEach(task => task.controller.abort()); pending.clear();
    cache.forEach(close); cache.clear(); failures.clear();
    clearTimeout(retryTimer); config = undefined;
    // Retain canvas pixels to avoid flashing an old poster when revisiting.
  }
  async function configure(reset = false) {
    if (preference.matches) return;
    const previousPosition = !reset && playhead ? playhead.position : null;
    update(); const initialTarget = target;
    release(); const generation = epoch;
    try {
      const manifest = await manifestAt(stage.dataset.manifest);
      if (generation !== epoch || preference.matches) return;
      config = phone.matches ? manifest.mobile : manifest.desktop;
      playhead = new FramePlayhead(config.frames, previousPosition ?? initialTarget*(config.frames-1));
      measure(); needsPaint = true; update(); available(playhead.position); schedule();
    } catch {/* The local poster remains if the film cannot load. */}
  }
  const visibility = new IntersectionObserver(([entry]) => {
    active = entry.isIntersecting;
    clearTimeout(releaseTimer);
    if (active) {
      last = 0;
      if (!config) configure(); else {update(); schedule();}
    } else {
      if (raf) cancelAnimationFrame(raf); raf = 0;
      releaseTimer = setTimeout(release, 1500);
    }
  }, {rootMargin:'250px 0px'});
  visibility.observe(stage);
  addEventListener('scroll', update, {passive:true});
  addEventListener('resize', () => {
    if (phone.matches && lastWidth === innerWidth) return;
    lastWidth = innerWidth; measure(); update(); schedule();
  }, {passive:true});
  phone.addEventListener('change', () => {if (active) configure(true); else {release(); playhead = undefined;}});
  document.addEventListener('visibilitychange', () => {if (!document.hidden) {last = 0; update();}});
  preference.addEventListener('change', () => {
    if (preference.matches) {release(); stage.classList.remove('world-painted');}
    else if (active) configure();
  });
});
