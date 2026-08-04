const html=document.documentElement;
const body=document.body;
const wakeScene=document.getElementById('wakeScene');
const wakeLaptop=document.getElementById('wakeLaptop');
const screenWake=document.getElementById('screenWake');
const experience=document.getElementById('manifestoExperience');
const ambience=document.getElementById('houseAmbience');
const ambienceToggle=document.getElementById('ambienceToggle');
const pages=[...document.querySelectorAll('.manifesto-page')];
const foundersContinue=document.getElementById('foundersContinue');
const doorTransition=document.getElementById('doorTransition');
const reduce=matchMedia('(prefers-reduced-motion: reduce)').matches;
const baseVolume=.5;
let ambienceWanted=true;
let ambienceWasPlaying=false;

function fadeVolume(target,duration=1200){
  const startVolume=ambience.volume;
  const start=performance.now();
  const step=now=>{
    const progress=Math.min(1,(now-start)/duration);
    ambience.volume=startVolume+(target-startVolume)*(1-Math.pow(1-progress,3));
    if(progress<1)requestAnimationFrame(step);
  };
  requestAnimationFrame(step);
}

function unlockAudio(){
  if(!ambienceWanted)return;
  ambience.volume=0;
  ambience.play().then(()=>fadeVolume(baseVolume,2200)).catch(()=>{});
}

function openManifesto(){
  wakeLaptop.disabled=true;
  screenWake.setAttribute('aria-hidden','false');
  screenWake.classList.add('is-awake');
  unlockAudio();
  setTimeout(()=>{
    experience.removeAttribute('inert');
    experience.classList.add('is-active');
    wakeScene.classList.add('is-opening');
    html.classList.remove('cinematic-locked');
    body.classList.remove('cinematic-locked');
    window.scrollTo(0,0);
  },reduce?20:1700);
}

function updateAmbienceFromScroll(){
  if(!ambienceWanted||ambience.paused)return;
  const max=Math.max(1,document.documentElement.scrollHeight-innerHeight);
  const progress=Math.max(0,Math.min(1,scrollY/max));
  let multiplier=1;
  if(progress>.72)multiplier=.7;
  else if(progress>.38)multiplier=.8;
  else if(progress>.08)multiplier=.9;
  ambience.volume=baseVolume*multiplier;
}

wakeLaptop.addEventListener('click',openManifesto);

addEventListener('scroll',()=>{
  updateAmbienceFromScroll();
  const max=Math.max(1,document.documentElement.scrollHeight-innerHeight);
  const progress=Math.max(0,Math.min(1,scrollY/max));
  document.documentElement.style.setProperty('--manifesto-scroll',String(progress));
},{passive:true});

ambienceToggle.addEventListener('click',()=>{
  ambienceWanted=ambience.paused;
  ambienceToggle.setAttribute('aria-pressed',String(ambienceWanted));
  if(ambienceWanted)ambience.play().then(()=>fadeVolume(baseVolume,700)).catch(()=>{});
  else{fadeVolume(0,450);setTimeout(()=>ambience.pause(),470)}
});

foundersContinue.addEventListener('click',()=>{
  html.classList.add('cinematic-locked');body.classList.add('cinematic-locked');
  doorTransition.setAttribute('aria-hidden','false');
  doorTransition.classList.add('is-active');
  fadeVolume(0,2600);
  setTimeout(()=>doorTransition.classList.add('is-open'),reduce?40:1050);
  setTimeout(()=>{location.href='founders.html'},reduce?140:3900);
});

document.addEventListener('visibilitychange',()=>{
  if(document.hidden){ambienceWasPlaying=!ambience.paused;ambience.pause();return}
  if(ambienceWasPlaying&&ambienceWanted)ambience.play().catch(()=>{});
  ambienceWasPlaying=false;
});
addEventListener('pagehide',()=>ambience.pause());
