(() => {
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const gate = document.querySelector('.invite-gate');
  const main = document.querySelector('#invitation-content');
  let started = false;
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
      if (art) timeline.from(art,{opacity:.6,scale:.985,transformOrigin:'50% 100%',duration:.9,clearProps:'opacity,transform'},.08);
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
    let opening=false;
    seal.addEventListener('click',()=>{
      if(opening) return;
      opening=true;
      scrollTo({top:0,behavior:'instant'});
      gate.classList.add('opening');
      setTimeout(startScenes,reduced.matches?0:160);
      setTimeout(()=>{
        gate.hidden=true;
        main.inert=false;
        document.documentElement.classList.remove('invitation-sealed');
        const title=document.querySelector('#names');
        title.setAttribute('tabindex','-1');
        title.focus({preventScroll:true});
      },reduced.matches?180:880);
    });
    seal.focus({preventScroll:true});
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
