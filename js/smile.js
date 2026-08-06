const stage=document.getElementById('gardenStage');
const layers=[...document.querySelectorAll('.garden-layer')];
const world=document.getElementById('gardenWorld');
const warmth=document.getElementById('cursorWarmth');
const title=document.getElementById('gardenTitle');
const hint=document.getElementById('lookHint');
const meet=document.getElementById('meetSmile');
const gallery=document.getElementById('smileGallery');
const audio=document.getElementById('gardenAudio');
const soundToggle=document.getElementById('soundToggle');
const canvas=document.getElementById('gardenLife');
const continueManifesto=document.getElementById('continueManifesto');
const manifestoWhiteout=document.getElementById('manifestoWhiteout');
const ctx=canvas.getContext('2d');
const reduce=matchMedia('(prefers-reduced-motion: reduce)').matches;
const mobileExplore=matchMedia('(max-width: 780px), (pointer: coarse)').matches;
let targetX=0,targetY=0,currentX=0,currentY=0;
let dragging=false,dragStartX=0,dragStartY=0,dragOriginX=0,dragOriginY=0;
let audioStarted=false;
let gardenAudioWasPlayingBeforeHidden=false;

function resize(){const r=stage.getBoundingClientRect();const d=Math.min(devicePixelRatio||1,2);canvas.width=Math.round(r.width*d);canvas.height=Math.round(r.height*d);canvas.style.width=r.width+'px';canvas.style.height=r.height+'px';ctx.setTransform(d,0,0,d,0,0)}
resize();addEventListener('resize',resize,{passive:true});

const clamp=(value,min,max)=>Math.max(min,Math.min(max,value));
function pointFromEvent(e){
    const r=stage.getBoundingClientRect();
    warmth.style.left=(e.clientX-r.left)+'px';
    warmth.style.top=(e.clientY-r.top)+'px';
    stage.classList.add('is-awake');
    startAudio();
    if(mobileExplore){
        if(!dragging)return;
        e.preventDefault();
        targetX=clamp(dragOriginX+(e.clientX-dragStartX)/(r.width*.58),-1,1);
        targetY=clamp(dragOriginY+(e.clientY-dragStartY)/(r.height*1.8),-.28,.28);
        return;
    }
    targetX=((e.clientX-r.left)/r.width-.5)*2;
    targetY=((e.clientY-r.top)/r.height-.5)*2;
}
stage.addEventListener('pointerdown',e=>{
    if(!mobileExplore)return;
    dragging=true;
    dragStartX=e.clientX;dragStartY=e.clientY;dragOriginX=targetX;dragOriginY=targetY;
    stage.setPointerCapture?.(e.pointerId);
    stage.classList.add('is-dragging','is-awake');
    startAudio();
},{passive:true});
stage.addEventListener('pointermove',pointFromEvent,{passive:false});
function endDrag(e){
    if(!dragging)return;
    dragging=false;
    stage.releasePointerCapture?.(e.pointerId);
    stage.classList.remove('is-dragging');
}
stage.addEventListener('pointerup',endDrag,{passive:true});
stage.addEventListener('pointercancel',endDrag,{passive:true});
stage.addEventListener('pointerenter',()=>stage.classList.add('is-awake'));
stage.addEventListener('pointerleave',()=>{if(!mobileExplore){targetX=0;targetY=0;stage.classList.remove('is-awake')}});

function animateCamera(){
    currentX+=(targetX-currentX)*(dragging ? .12 : .055);
    currentY+=(targetY-currentY)*(dragging ? .12 : .055);
    if(mobileExplore){
        const maxPan=Math.max(0,(world.offsetWidth-stage.clientWidth)/2);
        world.style.transform=`translate3d(${currentX*maxPan}px,${currentY*18}px,0)`;
    }
    layers.forEach(layer=>{
        const travel=Number(layer.dataset.travel||10);
        const x=currentX*travel*(mobileExplore ? .72 : 1);
        const y=currentY*travel*(mobileExplore ? .22 : .52);
        const scale=1+travel/1100;
        layer.style.transform=`translate3d(${x}px,${y}px,0) scale(${scale})`;
    });
    requestAnimationFrame(animateCamera);
}
animateCamera();

const particles=Array.from({length:90},()=>({x:Math.random(),y:Math.random(),r:.6+Math.random()*2.4,v:.00008+Math.random()*.0002,drift:(Math.random()-.5)*.00015,a:.18+Math.random()*.58,type:Math.random()<.18?'petal':'mote',phase:Math.random()*6.28}));
function life(t){const w=canvas.clientWidth,h=canvas.clientHeight;ctx.clearRect(0,0,w,h);for(const p of particles){p.y-=p.v*(1+Math.sin(t*.0004+p.phase)*.35);p.x+=p.drift+Math.sin(t*.00035+p.phase)*.00008;if(p.y<-.04){p.y=1.04;p.x=Math.random()}if(p.x<-.05)p.x=1.05;if(p.x>1.05)p.x=-.05;const x=p.x*w,y=p.y*h;ctx.save();ctx.translate(x,y);ctx.rotate(Math.sin(t*.001+p.phase));if(p.type==='petal'){ctx.fillStyle=`rgba(255,211,218,${p.a})`;ctx.beginPath();ctx.ellipse(0,0,p.r*2.5,p.r,0,0,Math.PI*2);ctx.fill()}else{ctx.fillStyle=`rgba(255,238,177,${p.a})`;ctx.shadowBlur=12;ctx.shadowColor='#ffe1a0';ctx.beginPath();ctx.arc(0,0,p.r,0,Math.PI*2);ctx.fill()}ctx.restore()}requestAnimationFrame(life)}
if(!reduce)requestAnimationFrame(life);

function fadeAudio(to=0.52,duration=2400){if(!audio)return;const from=audio.volume;const start=performance.now();function step(now){const p=Math.min(1,(now-start)/duration);audio.volume=from+(to-from)*(1-Math.pow(1-p,3));if(p<1)requestAnimationFrame(step)}requestAnimationFrame(step)}
function startAudio(){if(audioStarted||!audio)return;audioStarted=true;audio.volume=0;audio.play().then(()=>{soundToggle.setAttribute('aria-pressed','true');fadeAudio()}).catch(()=>{audioStarted=false})}
soundToggle.addEventListener('click',()=>{if(audio.paused){startAudio();if(audioStarted){audio.play().then(()=>{soundToggle.setAttribute('aria-pressed','true');fadeAudio()}).catch(()=>{audioStarted=false;soundToggle.setAttribute('aria-pressed','false')})}}else{audio.pause();soundToggle.setAttribute('aria-pressed','false')}});

meet.addEventListener('mouseenter',()=>{world.style.filter='brightness(1.08) saturate(1.08)';startAudio()});
meet.addEventListener('mouseleave',()=>world.style.filter='');
function unlockSmileGallery({scroll=true}={}){
    document.documentElement.classList.remove('smile-locked');
    document.body.classList.remove('smile-locked');
    gallery.removeAttribute('inert');
    if(scroll)gallery.scrollIntoView({behavior:reduce?'auto':'smooth',block:'start'});
}

meet.addEventListener('click',()=>unlockSmileGallery());

continueManifesto?.addEventListener('click',event=>{
    event.preventDefault();
    const destination=continueManifesto.href;
    manifestoWhiteout?.classList.add('is-active');
    if(audio&&!audio.paused)fadeAudio(0,900);
    setTimeout(()=>{location.href=destination},reduce?40:1100);
});

addEventListener('load',()=>{
    if(mobileExplore)hint.textContent='Drag gently to explore the garden.';
    if(location.hash==='#smileGallery')requestAnimationFrame(()=>unlockSmileGallery({scroll:true}));
    setTimeout(()=>title.classList.add('is-visible'),reduce?0:4700);
    setTimeout(()=>hint.classList.add('is-visible'),reduce?0:5500);
    setTimeout(()=>meet.classList.add('is-visible'),reduce?0:6200)
});
addEventListener('pageshow',()=>{if(location.hash==='#smileGallery')unlockSmileGallery({scroll:false})});
addEventListener('pointerdown',startAudio,{once:true});
addEventListener('keydown',startAudio,{once:true});

document.addEventListener('visibilitychange',()=>{
    if(!audio)return;
    if(document.hidden){gardenAudioWasPlayingBeforeHidden=!audio.paused;audio.pause();return}
    if(!gardenAudioWasPlayingBeforeHidden)return;
    gardenAudioWasPlayingBeforeHidden=false;
    audio.play().catch(()=>{audioStarted=false;soundToggle.setAttribute('aria-pressed','false')})
});
addEventListener('pagehide',()=>audio?.pause());
