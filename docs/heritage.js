(() => {
  if (matchMedia('(prefers-reduced-motion: reduce)').matches || !window.gsap) return;
  const seen = new WeakSet();
  const observer = new IntersectionObserver(entries => {
    entries.forEach(({target, isIntersecting}) => {
      target.classList.toggle('in-view', isIntersecting);
      if (!isIntersecting) return;
      if (seen.has(target)) return;
      seen.add(target);
      const words = target.querySelectorAll('[data-words] > span, [data-words] > i');
      const timeline = gsap.timeline({defaults:{ease:'power3.out'}});
      if (words.length) {
        timeline.fromTo(words,
          {clipPath:'inset(100% -8% -18% -8%)',y:10},
          {clipPath:'inset(-12% -8% -18% -8%)',y:0,duration:.85,stagger:.09,
            clearProps:'clipPath,transform'},0);
      }
      const art = target.querySelector('.cover-couple img,.letter-couple img,.swing img');
      if (art) timeline.from(art,{opacity:.6,scale:.985,transformOrigin:'50% 100%',duration:.9,clearProps:'opacity,transform'},.08);
      const events = target.querySelectorAll('.event');
      if (events.length) timeline.from(events,{opacity:.4,y:12,duration:.75,stagger:.13,clearProps:'opacity,transform'},.1);
    });
  },{threshold:.08});
  document.querySelectorAll('.scene').forEach(section => observer.observe(section));
  // Decode the next illustration before it enters, rather than fading an empty box.
  const prepare = new IntersectionObserver(entries => entries.forEach(({target,isIntersecting}) => {
    if (!isIntersecting) return;
    target.querySelectorAll('img[loading="lazy"]').forEach(img => {
      img.loading = 'eager';
      img.decode?.().catch(() => {});
    });
    prepare.unobserve(target);
  }), {rootMargin:'600px 0px'});
  document.querySelectorAll('.letter,.memory,.celebrations,.closing').forEach(section => prepare.observe(section));
})();
