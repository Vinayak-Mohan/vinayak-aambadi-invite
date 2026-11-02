(() => {
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const gate = document.querySelector('.invite-gate');
  const main = document.querySelector('#invitation-content');
  let started = false;
  let coverRevealed = false;
  function startScenes() {
    if (started) return;
    started = true;
    const seen = new WeakSet();
    const observer = new IntersectionObserver(entries => entries.forEach(({target,isIntersecting}) => {
      target.classList.toggle('in-view', isIntersecting);
      if (!isIntersecting || seen.has(target)) return;
      seen.add(target);
      if (reduced.matches || !window.gsap) return;
      const lines = target.querySelectorAll('[data-words] > span,[data-words] > i');
      const timeline = gsap.timeline({defaults:{ease:'power3.out'}});
      if (lines.length) timeline.fromTo(lines,
        {clipPath:'inset(100% -8% -18% -8%)',y:10},
        {clipPath:'inset(-12% -8% -18% -8%)',y:0,duration:.85,stagger:.09,clearProps:'clipPath,transform'},0);
      const art=target.querySelector('.cover-couple img,.letter-couple img,.swing img');
      if (art && !(coverRevealed && target.id==='top')) timeline.from(art,{opacity:.6,scale:.985,transformOrigin:'50% 100%',duration:.9,clearProps:'opacity,transform'},.08);
      const events=target.querySelectorAll('.event');
      if (events.length) timeline.from(events,{opacity:.5,y:10,duration:.65,stagger:.12,clearProps:'opacity,transform'},.1);
    }),{threshold:.08});
    document.querySelectorAll('.scene').forEach(section=>observer.observe(section));
  }
  // The invitation is fully usable without JS. Deep links bypass the entrance.
  if (gate && main && (!location.hash || location.hash==='#top')) {
    gate.hidden=false;
    main.inert=true;
    document.documentElement.classList.add('invitation-sealed');
    const seal=gate.querySelector('button');
    seal.disabled=true;
    gate.setAttribute('aria-busy','true');
    const action=gate.querySelector('.gate-action');
    const hint=gate.querySelector('.gate-hint');
    action.textContent='Loading invitation';
    hint.textContent='A moment, please';
    const heroImages=[...main.querySelectorAll('.cover img')];
    const ready=Promise.allSettled(heroImages.map(img=>img.decode?.() || Promise.resolve()));
    Promise.race([ready,new Promise(resolve=>setTimeout(resolve,2500))]).then(()=>{
      gate.classList.add('is-ready');
      gate.setAttribute('aria-busy','false');
      seal.disabled=false;
      action.textContent='Open invitation';
      hint.textContent='Tap the tulip to enter';
    });
    let opening=false;
    seal.addEventListener('click',()=>{
      if(opening) return;
      opening=true;
      coverRevealed=true;
      scrollTo({top:0,behavior:'instant'});
      gate.classList.add('opening');
      const finish=()=>{
        gate.hidden=true;
        main.inert=false;
        document.documentElement.classList.remove('invitation-sealed');
        const title=document.querySelector('#names');
        title.setAttribute('tabindex','-1');
        title.focus({preventScroll:true});
      };
      if(reduced.matches || !window.gsap){
        startScenes();
        gate.animate([{opacity:1},{opacity:0}],{duration:reduced.matches?150:300,fill:'forwards'}).finished.then(finish,finish);
        return;
      }
      const leaf=gate.querySelector('.gate-leaf');
      const setting=main.querySelector('.setting');
      const portrait=main.querySelector('.cover-couple img');
      const openingTimeline=gsap.timeline({defaults:{ease:'power3.inOut'},onComplete:()=>{
        gsap.set([setting,portrait],{clearProps:'transform,opacity'});
        finish();
      }});
      openingTimeline.addLabel('release',0)
        .to(gate.querySelector('.flower-bloom'),{scale:1.055,svgOrigin:'120 140',duration:.4,ease:'power2.out'},'release')
        .to(gate.querySelectorAll('.gate-heading,.gate-prompt,.invitation-seal'),{y:-8,opacity:0,duration:.34,ease:'power2.out'},'release')
        .addLabel('arrive',.14)
        .to(leaf,{y:-20,opacity:0,duration:1.05,ease:'power2.inOut'},'arrive')
        .fromTo(setting,{scale:1.025},{scale:1,duration:1.3,ease:'power2.out'},'arrive')
        .call(startScenes,[],.28)
        .fromTo(portrait,{y:10,opacity:0},{y:0,opacity:1,duration:.95,ease:'power3.out'},.34);
    });

  } else startScenes();
  const prepare=new IntersectionObserver(entries=>entries.forEach(({target,isIntersecting})=>{
    if(!isIntersecting)return;
    target.querySelectorAll('img[loading="lazy"]').forEach(img=>{
      img.loading='eager';img.decode?.().catch(()=>{});
    });
    prepare.unobserve(target);
  }),{rootMargin:'600px 0px'});
  document.querySelectorAll('.letter,.memory,.celebrations,.closing').forEach(section=>prepare.observe(section));
})();
