(() => {
  if (['#invitation','#cinema','#our-story','#the-day'].includes(location.hash)) {
    location.replace('invite.html'+location.hash); return;
  }
  const gsap = window.gsap;
  if (!gsap || matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const emblem = document.querySelector('.love-emblem');
  emblem?.classList.add('emblem-lit');
  function reveal(target) {
    const timeline = gsap.timeline({defaults:{ease:'power3.out'}});
    const lines = target.querySelectorAll('.name-line>span');
    if (lines.length) {
      // A wide feathered mask passes over intact lines; letters keep their layout.
      gsap.set(lines,{maskImage:'linear-gradient(90deg,#000 0% 35%,transparent 58%)',maskSize:'300% 100%'});
      timeline.fromTo(lines,{maskPosition:'100% 0%',opacity:.65,y:9},
        {maskPosition:'0% 0%',opacity:1,y:0,duration:.92,stagger:.09,clearProps:'maskImage,maskSize,maskPosition,opacity,transform'},0);
      const prelude = target.querySelector('.invitation-prelude');
      if (prelude) timeline.from(prelude,{opacity:.4,y:4,duration:.45},0);
    }
    if (target.matches('.morning-title')) {
      target.classList.add('date-lit');
      timeline.from(target.querySelector('.morning-date'),{opacity:.4,y:4,duration:.5},.12);
    } else if (target.matches('.morning-venue')) {
      timeline.from(target,{opacity:.5,y:7,duration:.55},0);
      timeline.from(target.querySelector('.venue-directions svg'),{opacity:0,scale:.85,transformOrigin:'50% 80%',duration:.4},.15);
    } else if (target.matches('.couple-reveal')) {
      timeline.from(target,{opacity:.2,scale:.985,transformOrigin:'50% 100%',duration:.95,clearProps:'opacity,transform'},0);
    } else if (target.matches('.morning-choices a')) {
      timeline.from(target,{opacity:.45,y:6,duration:.5,clearProps:'opacity,transform'},0);
      timeline.from(target.querySelector('svg'),{opacity:.2,x:-5,duration:.45,clearProps:'opacity,transform'},.1);
    }
  }
  const observer = new IntersectionObserver(entries => {
    entries.forEach(({target,isIntersecting}) => {
      if (!isIntersecting) return;
      reveal(target); observer.unobserve(target);
    });
  },{threshold:.15,rootMargin:'0px 0px -24px 0px'});
  document.querySelectorAll('.morning-title,.morning-venue,.celebration-copy,.couple-reveal,.morning-choices a').forEach(target => observer.observe(target));
})();
