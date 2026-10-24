import {FramePlayhead} from './frame-playhead.mjs?v=20261024-direct';

/* The latest scroll position chooses the frame directly, at display refresh rate.
   Decoders may finish later, but can only draw the latest requested position. */
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
  // Keep the small compressed film, rather than downloading the same atlas again
  // whenever a quick swipe leaves the decoded window. Only three atlases are decoded.
  const cache = new Map(), pending = new Map(), failures = new Map();
  const compressed = new Map(), downloads = new Map();
  const previews = new Map(), previewFailures = new Set();
  let previewBusy = false;
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
      const range = Math.max(1, document.documentElement.scrollHeight - innerHeight);
      target = range-scrollY < 1 ? 1 : scrollY < .5 ? 0 : clamp(scrollY/range);
    } else {
      const rect = scene.getBoundingClientRect();
      target = clamp((innerHeight - rect.top) / (innerHeight + rect.height));
    }
    if (target !== before) direction = target > before ? 1 : -1;
    schedule();
  }
  function trimCache() {
    if (!playhead || !config) return;
    const current = Math.floor(target*(config.frames-1) / config.perSheet);
    const keys = [...cache.keys()].sort((a,b) => Math.abs(b-current)-Math.abs(a-current));
    for (const key of keys) if (cache.size > 3 && key !== current) {
      close(cache.get(key)); cache.delete(key);
    }
  }
  function filmBlob(index, priority = 'low') {
    if (compressed.has(index)) return Promise.resolve(compressed.get(index));
    if (downloads.has(index)) return downloads.get(index).promise;
    const generation = epoch, controller = new AbortController();
    const task = {controller};
    task.promise = (async () => {
      const response = await fetch(config.sheets[index], {cache:'force-cache', priority, signal:controller.signal});
      if (!response.ok) throw Error('Film frames unavailable');
      const blob = await response.blob();
      if (generation === epoch) {compressed.set(index, blob); warmPreviews();}
      return blob;
    })().finally(() => {if (downloads.get(index) === task) downloads.delete(index);});
    downloads.set(index, task);
    return task.promise;
  }
  async function warmPreviews() {
    if (previewBusy || !config || !active || document.hidden || preference.matches || !('createImageBitmap' in window)) return;
    const current = Math.floor(target*(config.frames-1)/config.perSheet);
    const index = [...compressed.keys()].filter(index => !previews.has(index) && !previewFailures.has(index))
      .sort((a,b) => Math.abs(a-current)-Math.abs(b-current))[0];
    if (index === undefined) return;
    const generation = epoch, film = config;
    const tileWidth = Math.min(film.width, phone.matches ? 160 : 284);
    const tileHeight = Math.round(tileWidth*film.height/film.width);
    previewBusy = true;
    try {
      // A complete lightweight tier makes distant frames immediately drawable.
      // Full detail replaces it at the SAME position, without a playback queue.
      const image = await createImageBitmap(compressed.get(index), {
        resizeWidth:tileWidth*film.columns,
        resizeHeight:tileHeight*Math.ceil(film.perSheet/film.columns),
        resizeQuality:'low'
      });
      if (generation !== epoch) {close(image); return;}
      previews.set(index, {image,width:tileWidth,height:tileHeight});
      if (debug) canvas.dataset.preparedSheets = String(previews.size);
      needsPaint = true; schedule();
    } catch {
      if (generation === epoch) previewFailures.add(index);
      // Full-detail decoding remains available on unsupported browsers.
    }
    finally {
      if (generation === epoch) {previewBusy = false; warmPreviews();}
    }
  }
  function warmFilm() {
    if (!active || !config || document.hidden || preference.matches) return;
    const current = Math.floor(target*(config.frames-1)/config.perSheet);
    const candidates = config.sheets.map((_,index) => index).sort((a,b) => {
      const distance = index => Math.abs(index-current) + (Math.sign(index-current) === direction ? 0 : .5);
      return distance(a)-distance(b);
    });
    // Background transfers are bounded and lower priority than the visible frame.
    for (const index of candidates) {
      if (downloads.size >= 2) break;
      if (compressed.has(index) || downloads.has(index) || (failures.get(index)?.until || 0) > performance.now()) continue;
      const generation = epoch;
      filmBlob(index).catch(() => {
        if (generation === epoch) failures.set(index, {count:1,until:performance.now()+2000});
      }).finally(() => {if (generation === epoch) warmFilm();});
    }
  }
  function request(index, priority = 'low') {
    if (!config || index < 0 || index >= config.sheets.length || cache.has(index) || pending.has(index)) return;
    if ((failures.get(index)?.until || 0) > performance.now() || pending.size >= 2) return;
    const generation = epoch;
    const task = {}; pending.set(index, task);
    (async () => {
      const blob = await filmBlob(index, priority);
      if (generation !== epoch || preference.matches || task.cancelled) return;
      let image;
      if ('createImageBitmap' in window) image = await createImageBitmap(blob);
      else {
        const objectURL = URL.createObjectURL(blob);
        try {image = new Image(); image.src = objectURL; await image.decode();}
        finally {URL.revokeObjectURL(objectURL);}
      }
      if (generation !== epoch || preference.matches || task.cancelled) {close(image); return;}
      cache.set(index, image); failures.delete(index); trimCache(); needsPaint = true;
    })().catch(error => {
      if (generation === epoch && !task.cancelled && error.name !== 'AbortError') {
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
    request(a, 'high'); request(b, 'high');
    return (cache.has(a) || previews.has(a)) && (cache.has(b) || previews.has(b));
  }
  function drawFrame(frame, alpha) {
    const sheet = Math.floor(frame / config.perSheet);
    const preview = previews.get(sheet);
    const detailed = cache.has(sheet);
    const image = detailed ? cache.get(sheet) : preview.image;
    const tileWidth = detailed ? config.width : preview.width;
    const tileHeight = detailed ? config.height : preview.height;
    const local = frame % config.perSheet;
    const scale = phone.matches ? Math.min(width/config.width, height/config.height) : Math.max(width/config.width, height/config.height);
    const dw = config.width*scale, dh = config.height*scale;
    ctx.globalAlpha = alpha;
    if (alpha === 1) {ctx.fillStyle = '#24101e'; ctx.fillRect(0,0,width,height);}
    ctx.drawImage(image, (local%config.columns)*tileWidth, Math.floor(local/config.columns)*tileHeight,
      tileWidth, tileHeight, (width-dw)/2, (height-dh)/2, dw, dh);
  }
  function paint(now) {
    raf = 0;
    if (!config || !active || document.hidden || preference.matches) return;
    const elapsed = now - (last || now-16.667); last = now;
    const destination = target*(config.frames-1);
    const travelDirection = Math.sign(destination-playhead.position) || direction;
    const currentSheet = Math.floor(destination/config.perSheet);
    const neighbourSheet = Math.floor(Math.ceil(destination)/config.perSheet);
    const keep = new Set([currentSheet, neighbourSheet, currentSheet+travelDirection]);
    pending.forEach((task,index) => {
      if (!keep.has(index)) {task.cancelled = true; pending.delete(index);}
    });
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
        canvas.dataset.target = destination.toFixed(3);
        const trace = (canvas.dataset.trace || '').split(',').filter(Boolean);
        if (Number(trace.at(-1)) !== frame || !trace.length) trace.push(String(frame));
        canvas.dataset.trace = trace.slice(-512).join(',');
      }
    }
    request(currentSheet + travelDirection);
    warmFilm();
    warmPreviews();
    trimCache();
    // Stop here. Only fresh scroll/resize input or a completed decoder may repaint.
  }
  function release() {
    epoch++;
    if (raf) cancelAnimationFrame(raf); raf = 0; last = 0;
    pending.forEach(task => {task.cancelled = true;}); pending.clear();
    downloads.forEach(task => task.controller.abort()); downloads.clear(); compressed.clear();
    previews.forEach(preview => close(preview.image)); previews.clear(); previewFailures.clear(); previewBusy = false;
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
