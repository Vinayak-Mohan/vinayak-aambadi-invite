(() => {
  if (['#invitation','#cinema','#our-story','#the-day'].includes(location.hash)) {
    location.replace('invite.html'+location.hash); return;
  }
  const gsap = window.gsap;
  if (!gsap || matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const scenes = [...document.querySelectorAll('.scene')];
  function reveal(scene) {
    const timeline = gsap.timeline({defaults:{ease:'power3.out'}});
    const lines = scene.querySelectorAll('.name-line>span');
    const top = scene.querySelector('.morning-top');
    const prelude = scene.querySelector('.invitation-prelude');
    if (top) timeline.from(top,{opacity:0,y:6,duration:.5},0);
    if (prelude) timeline.from(prelude,{opacity:0,duration:.7},.08);
    timeline.from(lines,{clipPath:'inset(0 100% 0 0)',opacity:.4,duration:1.15,stagger:.12},.08);
    const date = scene.querySelector('.morning-date');
    if (date) timeline.from(date,{opacity:0,y:7,duration:.65},.28);
    const venues = scene.querySelectorAll('.morning-venue');
    if (venues.length) timeline.from(venues,{opacity:.25,y:10,duration:.75,stagger:.1},.22);
    const couple = scene.querySelector('.couple-reveal');
    if (couple) timeline.from(couple,{opacity:0,y:20,scale:.98,duration:1.25},.05);
    const choices = scene.querySelector('.morning-choices');
    if (choices) timeline.from(choices,{opacity:.35,y:8,duration:.75},.3);
  }
  const observer = new IntersectionObserver(entries => {
    entries.forEach(({target,isIntersecting}) => {
      if (!isIntersecting) return;
      reveal(target); observer.unobserve(target);
    });
  },{threshold:.08});
  scenes.forEach(scene => observer.observe(scene));
})();
