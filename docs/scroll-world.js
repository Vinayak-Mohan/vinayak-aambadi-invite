/* A forward camera journey, rendered from the original film frames.
   Scrolling is always native. Decoding never blocks navigation or queues seeks. */
(() => {
  const preference = matchMedia('(prefers-reduced-motion: reduce)');
  if (preference.matches || navigator.connection?.saveData || /(^|-)2g$/.test(navigator.connection?.effectiveType||'')) return;
  document.querySelectorAll('.scroll-world').forEach(stage => {
    const canvas = stage.querySelector('canvas');
    const ctx = canvas.getContext('2d', {alpha:false});
    if (!ctx) return;
    const phone = matchMedia('(max-width:700px)');
    const cache = new Map(), pending = new Map(), blobs = new Map(), failed = new Set();
    let config, epoch=0, active=false, raf=0, last=0, progress=0, target=0;
    let width=0, height=0, lastWidth=0, direction=1, prefetching=false;
    const clamp = x => Math.max(0,Math.min(1,x));
    const close = bitmap => bitmap.close?.();
    const schedule = () => {if (!raf && active && !document.hidden && !preference.matches) raf=requestAnimationFrame(paint);};
    function measure() {
      const rect=stage.getBoundingClientRect();
      const ratio=Math.min(devicePixelRatio||1,phone.matches?1.25:1.5);
      width=Math.round(rect.width*ratio);height=Math.round(rect.height*ratio);
      stage.style.setProperty('--world-inset',Math.max(0,(rect.height-rect.width*16/9)/2)+'px');
      if (canvas.width!==width || canvas.height!==height) {canvas.width=width;canvas.height=height;}
    }
    function update() {
      const previous=target;
      if(stage.dataset.world==='page') {
        target=clamp(scrollY/Math.max(1,document.documentElement.scrollHeight-innerHeight));
      } else {
        const scene=stage.closest('.scene'), rect=scene.getBoundingClientRect();
        target=clamp((innerHeight-rect.top)/(innerHeight+rect.height));
      }
      direction=target>=previous?1:-1;schedule();
    }
    async function source(index) {
      if(blobs.has(index)) return blobs.get(index);
      const generation=epoch, url=config.sheets[index];
      const promise=fetch(url,{cache:'force-cache',priority:'low'}).then(response=>{
        if(!response.ok) throw Error('World frame unavailable');
        return response.blob();
      });
      blobs.set(index,promise);
      try {return await promise;}
      catch(error) {if(generation===epoch) blobs.delete(index);throw error;}
    }
    function request(index) {
      if(!config || index<0 || index>=config.sheets.length || cache.has(index) || pending.has(index) || failed.has(index)) return;
      // Decode only the current sheet and its neighbour, never the whole film.
      if(pending.size>=2) return;
      const generation=epoch;
      const task=(async()=>{
        const blob=await source(index);
        let bitmap;
        if('createImageBitmap' in window) bitmap=await createImageBitmap(blob);
        else {
          const url=URL.createObjectURL(blob);
          try {bitmap=new Image();bitmap.src=url;await bitmap.decode();}
          finally {URL.revokeObjectURL(url);}
        }
        if(generation!==epoch || preference.matches) {close(bitmap);return;}
        cache.set(index,bitmap);
        const wanted=Math.floor(progress*(config.frames-1)/config.perSheet);
        [...cache.keys()].sort((a,b)=>Math.abs(b-wanted)-Math.abs(a-wanted)).forEach(key=>{
          if(cache.size>2 && key!==index) {close(cache.get(key));cache.delete(key);}
        });
      })().catch(()=>{if(generation===epoch) failed.add(index);}).finally(()=>{
        if(pending.get(index)===task) pending.delete(index);schedule();
      });
      pending.set(index,task);
    }
    function drawFrame(frame,alpha) {
      const sheet=Math.floor(frame/config.perSheet), image=cache.get(sheet);
      if(!image) return false;
      const local=frame%config.perSheet;
      const sx=(local%config.columns)*config.width, sy=Math.floor(local/config.columns)*config.height;
      const scale=phone.matches?Math.min(width/config.width,height/config.height):Math.max(width/config.width,height/config.height);
      const dw=config.width*scale, dh=config.height*scale;
      ctx.globalAlpha=alpha;
      if(alpha===1) {ctx.fillStyle='#24101e';ctx.fillRect(0,0,width,height);}
      ctx.drawImage(image,sx,sy,config.width,config.height,(width-dw)/2,(height-dh)/2,dw,dh);
      return true;
    }
    function paint(now) {
      raf=0;if(!config || !active || preference.matches) return;
      const dt=Math.min(48,now-(last||now-16));last=now;
      progress+= (target-progress)*(1-Math.exp(-dt/75));
      if(Math.abs(target-progress)<.0003) progress=target;
      const position=progress*(config.frames-1), frame=Math.floor(position), sheet=Math.floor(frame/config.perSheet);
      request(sheet);
      if(cache.has(sheet)) {
        drawFrame(frame,1);
        const next=Math.min(config.frames-1,frame+1);
        drawFrame(next,position-frame);
        ctx.globalAlpha=1;stage.classList.add('world-painted');
        canvas.dataset.frame=String(frame);
        request(sheet+direction);
      }
      // No old request paints over the latest position: only this renderer draws.
      if(Math.abs(target-progress)>.0003) schedule();
    }
    async function prime() {
      if(prefetching || !config) return;prefetching=true;
      const generation=epoch;
      // Compressed sheets are small; retain them, not their large decoded pixels.
      for(let i=0;i<config.sheets.length;i++) {
        if(generation!==epoch || preference.matches) break;
        try {await source(i);} catch {break;}
      }
      prefetching=false;
    }
    async function configure() {
      if(preference.matches) return;
      const generation=++epoch;
      config=null;
      cache.forEach(close);cache.clear();pending.clear();blobs.clear();failed.clear();prefetching=false;
      stage.classList.remove('world-painted');
      try {
        const response=await fetch('assets/kerala-journey/manifest.json');
        if(!response.ok) return;
        const manifest=await response.json();if(generation!==epoch || preference.matches) return;
        config=phone.matches?manifest.mobile:manifest.desktop;
        measure();update();progress=target;request(Math.floor(target*(config.frames-1)/config.perSheet));
        schedule();prime();
      } catch {/* Static artwork is the permanent failure fallback. */}
    }
    const visibility=new IntersectionObserver(([entry])=>{
      active=entry.isIntersecting;
      if(active) {last=0;if(!config)configure();else {update();schedule();}}
    },{rootMargin:'400px 0px'});
    visibility.observe(stage);
    addEventListener('scroll',update,{passive:true});
    addEventListener('resize',()=>{
      // Ignore mobile URL-bar-only changes; svh keeps the composition steady.
      if(phone.matches && lastWidth===innerWidth) return;
      lastWidth=innerWidth;measure();update();schedule();
    },{passive:true});
    lastWidth=innerWidth;
    phone.addEventListener('change',configure);
    document.addEventListener('visibilitychange',()=>{if(!document.hidden){last=0;update();}});
    preference.addEventListener('change',()=>{
      if(preference.matches){epoch++;cache.forEach(close);cache.clear();stage.classList.remove('world-painted');}
      else configure();
    });
  });
})();
