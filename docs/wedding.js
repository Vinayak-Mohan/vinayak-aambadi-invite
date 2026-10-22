(() => {
  if (document.body.classList.contains('home-page') && ['#invitation','#cinema','#our-story','#the-day'].includes(location.hash)) {
    location.replace('invite.html' + location.hash);
    return;
  }
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const finePointer = matchMedia('(pointer: fine)');
  const gsap = window.gsap;
  const scenes = [...document.querySelectorAll('.scene')];

  // The complete document remains visible if motion support or JavaScript fails.
  if (gsap && 'IntersectionObserver' in window) {
    const media = gsap.matchMedia();
    media.add('(prefers-reduced-motion: no-preference)', () => {
      const contexts = new Set();
      const played = new Set();
      const revealObserver = new IntersectionObserver(entries => {
        entries.forEach(({target, isIntersecting}) => {
          if (!isIntersecting) return;
          buildScene(target);
          revealObserver.unobserve(target);
        });
      }, {threshold: .06, rootMargin: '0px 0px -24px 0px'});

      function buildScene(scene) {
        if (played.has(scene)) return;
        played.add(scene);
        const index=scenes.indexOf(scene);
        const context=gsap.context(()=>{
        const titleLines = scene.querySelectorAll('h1 .title-line > span, h2 .title-line > span');
        const details = scene.querySelectorAll('[data-reveal]');
        const illustration = scene.querySelector('.figure-arrival, .portal-art img, .blessing-art img, .swing-inner');
        const setting = scene.querySelector('.portrait-setting');
        const tl = gsap.timeline({defaults:{duration:.65,ease:'power3.out'}});
        tl.addLabel('setting',0).addLabel('words',.12).addLabel('details',.38);
        if (index === 0) {
          const backdrop=scene.querySelector('.world-layer');
          if(backdrop) tl.from(backdrop, {scale:1.045,opacity:.6,duration:1.35}, 'setting');
          tl.from(scene.querySelector('.scene-top'), {y:10,opacity:0,duration:.45}, 'setting+=.06');
        }
        const light=scene.querySelector('.light-layer, .garden-glow, .portal-light');
        if(light) tl.to(light,{opacity:.55,duration:2.2,repeat:1,yoyo:true,ease:'sine.inOut'},'setting+=.2');
        if (setting) tl.from(setting,{scale:1.04,opacity:0,duration:1.05},'setting');
        if (illustration) tl.from(illustration,{y:25,scale:.975,opacity:0,duration:1.05},'setting+=.12');
        if (titleLines.length) tl.from(titleLines,{yPercent:110,rotationX:-8,stagger:.13,duration:.95},'words');
        if (details.length) tl.from(details,{y:13,opacity:0,stagger:{each:.065,amount:Math.min(.4,details.length*.065)},duration:.65},'details');
        const flower = scene.querySelector('.drawn-flower path');
        if (flower) {
          const length = flower.getTotalLength();
          tl.fromTo(flower,{strokeDasharray:length,strokeDashoffset:length},{strokeDashoffset:0,duration:1.3,ease:'power2.inOut'},'setting');
        }
        const rule = scene.querySelector('.day-schedule');
        if (rule) tl.from(rule,{opacity:.3,duration:.8},'setting');
        },scene);
        contexts.add(context);
      }
      // Prepare a scene only when it is actually on screen. Off-screen text is
      // never hidden while waiting for a delayed observer callback.
      scenes.forEach(scene=>{
        const rect=scene.getBoundingClientRect();
        if(rect.top<innerHeight-24 && rect.bottom>24) buildScene(scene);
        else revealObserver.observe(scene);
      });

      const pointerCleanups = [];
      if (finePointer.matches) {
        scenes.forEach(scene => {
          const xTo=gsap.quickTo(scene,'--pointer-x',{duration:.8,ease:'power3.out'});
          const yTo=gsap.quickTo(scene,'--pointer-y',{duration:.8,ease:'power3.out'});
          const move=event=>{
            const rect=scene.getBoundingClientRect();
            xTo((event.clientX-rect.left)/rect.width-.5);
            yTo((event.clientY-rect.top)/rect.height-.5);
          };
          const reset=()=>{xTo(0);yTo(0);};
          scene.addEventListener('pointermove',move,{passive:true});
          scene.addEventListener('pointerleave',reset);
          pointerCleanups.push(()=>{
            scene.removeEventListener('pointermove',move);
            scene.removeEventListener('pointerleave',reset);
            scene.style.removeProperty('--pointer-x');scene.style.removeProperty('--pointer-y');
          });
        });
      }
      return ()=>{
        revealObserver.disconnect();
        contexts.forEach(context=>context.revert());
        pointerCleanups.forEach(cleanup=>cleanup());
      };
    });
  }

})();
