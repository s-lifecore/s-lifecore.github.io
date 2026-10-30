const canvas  = document.getElementById('c');
const ctx     = canvas.getContext('2d');
const overlay = document.getElementById('overlay');
const label   = document.getElementById('label');
const dotsEl  = document.getElementById('dots');

let W, H;
function resize(){ W = canvas.width = innerWidth; H = canvas.height = innerHeight; }
resize();
window.addEventListener('resize', () => { resize(); scenes[sceneIdx].init(); buildDots(); });

// ── Mouse / touch tracking ────────────────────────────────────────────────────
let mouseX = 0, mouseY = 0;
window.addEventListener('mousemove', e => { mouseX=e.clientX; mouseY=e.clientY; });
window.addEventListener('touchmove', e => { mouseX=e.touches[0].clientX; mouseY=e.touches[0].clientY; }, {passive:true});
window.addEventListener('touchstart', e => { mouseX=e.touches[0].clientX; mouseY=e.touches[0].clientY; }, {passive:true});

// ── Perlin noise ──────────────────────────────────────────────────────────────
const perm = new Uint8Array(512);
const g2d  = [[1,0],[-1,0],[0,1],[0,-1],[1,1],[-1,1],[1,-1],[-1,-1]];
for(let i=0;i<256;i++) perm[i]=i;
for(let i=255;i>0;i--){ const j=Math.floor(Math.random()*(i+1)); [perm[i],perm[j]]=[perm[j],perm[i]]; }
for(let i=0;i<256;i++) perm[i+256]=perm[i];
const fade  = t => t*t*t*(t*(t*6-15)+10);
const lerp  = (a,b,t) => a+t*(b-a);
function perlin(x,y){
  const X=Math.floor(x)&255, Y=Math.floor(y)&255;
  const xf=x-Math.floor(x), yf=y-Math.floor(y);
  const u=fade(xf), v=fade(yf);
  const dot=(h,dx,dy)=>{ const g=g2d[h%8]; return g[0]*dx+g[1]*dy; };
  return lerp(lerp(dot(perm[perm[X]+Y],xf,yf),dot(perm[perm[X+1]+Y],xf-1,yf),u),
              lerp(dot(perm[perm[X]+Y+1],xf,yf-1),dot(perm[perm[X+1]+Y+1],xf-1,yf-1),u),v);
}
function flowAngle(x,y,t){
  const s=.0025,z=t*.12;
  return Math.atan2(perlin(x*s+100,y*s+z), perlin(x*s,y*s+z))*4;
}

// ── Color utilities ───────────────────────────────────────────────────────────
function aurora(v){
  v=((v%1)+1)%1;
  return `hsl(${270-v*140},${75+25*Math.sin(v*Math.PI)}%,${50+30*Math.sin(v*Math.PI*2)}%)`;
}
function hslToRgb(h,s,l){   // h:0-360, s/l:0-1 → [r,g,b] 0-255
  h/=360;
  const a=s*Math.min(l,1-l);
  const f=n=>{ const k=(n+h*12)%12; return l-a*Math.max(-1,Math.min(k-3,9-k,1)); };
  return [f(0)*255|0, f(8)*255|0, f(4)*255|0];
}

// ── Audio engine ──────────────────────────────────────────────────────────────
let ac, analyser, analyserBuf, audioAmp=0, lastNoteMs=0;
let prevBass=0, beatFlashA=0;

function startAudio(){
  const AC=window.AudioContext||window.webkitAudioContext; ac=new AC();
  analyser=ac.createAnalyser(); analyser.fftSize=256;
  analyserBuf=new Uint8Array(analyser.frequencyBinCount);
  analyser.connect(ac.destination);
  const audio=new Audio('marbletechno1.mp3'); audio.loop=true;
  const src=ac.createMediaElementSource(audio); src.connect(analyser);
  audio.play();

  // Energy-rise beat detection
  setInterval(()=>{
    analyser.getByteFrequencyData(analyserBuf);
    let bass=0; for(let i=0;i<5;i++) bass+=analyserBuf[i]; bass/=5;
    if(bass > prevBass*1.4 && bass > 80){ lastNoteMs=Date.now(); beatFlashA=.35; }
    prevBass=prevBass*.82+bass*.18;
  },55);
}

function getAmp(){
  if(!analyser) return 0;
  analyser.getByteFrequencyData(analyserBuf);
  let s=0; for(let i=0;i<analyserBuf.length;i++) s+=analyserBuf[i];
  return s/analyserBuf.length/255;
}

// ════════════════════════════════════════════════════════════
// SCENE 1 · Flow Field
// ════════════════════════════════════════════════════════════
class FlowScene {
  init(){
    this.pts=[];
    for(let i=0;i<2200;i++) this.pts.push(this._mk(false));
    for(let i=0;i<180;i++)  this.pts.push(this._mk(true));
  }
  _mk(spark){
    return{spark,x:Math.random()*W,y:Math.random()*H,vx:0,vy:0,
      life:Math.random()*(spark?45:200),
      maxLife:spark?45+Math.random()*45:180+Math.random()*270,
      size:spark?1.3+Math.random()*2.5:.5+Math.random()*1.1,
      speed:spark?1.6+Math.random()*2:.5+Math.random()*1.2,
      phase:Math.random(),drift:(Math.random()-.5)*.003};
  }
  update(t,amp){
    for(const p of this.pts){
      const boost=1+amp*4, a=flowAngle(p.x,p.y,t);
      p.vx=p.vx*.91+Math.cos(a)*.32*boost; p.vy=p.vy*.91+Math.sin(a)*.32*boost;
      // Mouse repulsion
      const mdx=p.x-mouseX, mdy=p.y-mouseY, md=Math.hypot(mdx,mdy);
      if(md<120){ const f=(1-md/120)*1.8; p.vx+=mdx/md*f; p.vy+=mdy/md*f; }
      const spd=Math.hypot(p.vx,p.vy), max=p.speed*boost;
      if(spd>max){ p.vx=p.vx/spd*max; p.vy=p.vy/spd*max; }
      p.x+=p.vx; p.y+=p.vy;
      p.phase=(p.phase+p.drift+amp*.008+1)%1; p.life++;
      if(p.life>p.maxLife||p.x<-20||p.x>W+20||p.y<-20||p.y>H+20) Object.assign(p,this._mk(p.spark));
    }
  }
  draw(ctx,t,amp){
    ctx.globalAlpha=.04+amp*.04; ctx.globalCompositeOperation='source-over';
    ctx.fillStyle='#000510'; ctx.fillRect(0,0,W,H);
    ctx.globalCompositeOperation='source-over';
    for(const p of this.pts){
      if(p.spark) continue;
      const a=Math.sin((p.life/p.maxLife)*Math.PI)*.52; if(a<.01) continue;
      ctx.globalAlpha=a; ctx.fillStyle=aurora((p.phase+t*.024)%1);
      ctx.beginPath(); ctx.arc(p.x,p.y,p.size,0,Math.PI*2); ctx.fill();
    }
    ctx.globalCompositeOperation='lighter';
    for(const p of this.pts){
      if(!p.spark) continue;
      const a=Math.sin((p.life/p.maxLife)*Math.PI)*.92; if(a<.01) continue;
      ctx.globalAlpha=a; ctx.fillStyle=aurora((p.phase+t*.024)%1);
      ctx.beginPath(); ctx.arc(p.x,p.y,p.size,0,Math.PI*2); ctx.fill();
    }
    ctx.globalCompositeOperation='source-over'; ctx.globalAlpha=1;
  }
}

// ════════════════════════════════════════════════════════════
// SCENE 2 · Lissajous Webs  [NEW]
// ════════════════════════════════════════════════════════════
class LissajousScene {
  init(){
    this.curves=[
      {a:1,b:2,ph:0,dphi:.009,col:0},
      {a:2,b:3,ph:Math.PI/4,dphi:.007,col:.25},
      {a:3,b:4,ph:Math.PI/2,dphi:.005,col:.5},
      {a:3,b:5,ph:Math.PI,  dphi:.004,col:.72},
    ];
    this.hist=this.curves.map(()=>[]);
  }
  update(t,amp){
    const r=Math.min(W,H)*.38*(1+amp*.08);
    for(let i=0;i<this.curves.length;i++){
      const c=this.curves[i];
      c.ph+=c.dphi*(1+amp*2.5);
      const x=W/2+r*Math.sin(c.a*c.ph);
      const y=H/2+r*Math.sin(c.b*c.ph+Math.PI/2);
      this.hist[i].push({x,y});
      const maxLen=600+i*100;
      if(this.hist[i].length>maxLen) this.hist[i].shift();
    }
  }
  draw(ctx,t,amp){
    ctx.globalAlpha=.035; ctx.globalCompositeOperation='source-over';
    ctx.fillStyle='#000008'; ctx.fillRect(0,0,W,H);
    ctx.globalCompositeOperation='source-over';
    for(let i=0;i<this.curves.length;i++){
      const h=this.hist[i], base=this.curves[i].col;
      for(let j=1;j<h.length;j++){
        const frac=j/h.length;
        ctx.globalAlpha=frac*.65;
        ctx.strokeStyle=aurora((base+frac*.2+t*.01)%1);
        ctx.lineWidth=.7+frac;
        ctx.beginPath(); ctx.moveTo(h[j-1].x,h[j-1].y); ctx.lineTo(h[j].x,h[j].y); ctx.stroke();
      }
    }
    // Center cross-hair glow
    ctx.globalCompositeOperation='lighter';
    const gr=ctx.createRadialGradient(W/2,H/2,0,W/2,H/2,Math.min(W,H)*.06);
    gr.addColorStop(0,`rgba(180,220,255,${.15+amp*.3})`); gr.addColorStop(1,'rgba(0,0,0,0)');
    ctx.globalAlpha=1; ctx.fillStyle=gr; ctx.fillRect(0,0,W,H);
    ctx.globalCompositeOperation='source-over'; ctx.globalAlpha=1;
  }
}

// ════════════════════════════════════════════════════════════
// SCENE 3 · Clifford Attractor
// ════════════════════════════════════════════════════════════
class AttractorScene {
  init(){
    const a=-1.4,b=1.6,c=1.0,d=0.7;
    this.a=a;this.b=b;this.c=c;this.d=d;
    this.walkers=[];
    for(let i=0;i<900;i++){
      let x=(Math.random()-.5)*4,y=(Math.random()-.5)*4;
      for(let j=0;j<120;j++){const nx=Math.sin(a*y)+c*Math.cos(a*x),ny=Math.sin(b*x)+d*Math.cos(b*y);x=nx;y=ny;}
      this.walkers.push({x,y,phase:Math.random()});
    }
    let minX=Infinity,maxX=-Infinity,minY=Infinity,maxY=-Infinity,x=0,y=0;
    for(let i=0;i<6000;i++){
      const nx=Math.sin(a*y)+c*Math.cos(a*x),ny=Math.sin(b*x)+d*Math.cos(b*y);x=nx;y=ny;
      if(i>200){minX=Math.min(minX,x);maxX=Math.max(maxX,x);minY=Math.min(minY,y);maxY=Math.max(maxY,y);}
    }
    const sc=Math.min(W/(maxX-minX),H/(maxY-minY))*.82;
    this.sc=sc;this.ox=W/2-(minX+maxX)/2*sc;this.oy=H/2-(minY+maxY)/2*sc;this.rot=0;
  }
  update(t,amp){
    const {a,b,c,d}=this,steps=2+Math.round(amp*8);
    for(const w of this.walkers){
      for(let i=0;i<steps;i++){const nx=Math.sin(a*w.y)+c*Math.cos(a*w.x),ny=Math.sin(b*w.x)+d*Math.cos(b*w.y);w.x=nx;w.y=ny;}
      w.phase=(w.phase+.001)%1;
    }
    this.rot+=.003+amp*.005;
  }
  draw(ctx,t,amp){
    ctx.globalAlpha=.05;ctx.globalCompositeOperation='source-over';
    ctx.fillStyle='#000008';ctx.fillRect(0,0,W,H);
    const cx=W/2,cy=H/2,sc=this.sc,ox=this.ox,oy=this.oy,r=this.rot;
    ctx.globalCompositeOperation='lighter';
    for(const w of this.walkers){
      const wx=ox+w.x*sc,wy=oy+w.y*sc,dx=wx-cx,dy=wy-cy;
      const rx=cx+dx*Math.cos(r)-dy*Math.sin(r),ry=cy+dx*Math.sin(r)+dy*Math.cos(r);
      ctx.globalAlpha=.5;ctx.fillStyle=aurora((w.phase+t*.018)%1);
      ctx.fillRect(rx|0,ry|0,1,1);
    }
    ctx.globalCompositeOperation='source-over';ctx.globalAlpha=1;
  }
}

// ════════════════════════════════════════════════════════════
// SCENE 4 · Constellation Network
// ════════════════════════════════════════════════════════════
class StarnetScene {
  init(){
    this.stars=[];
    for(let i=0;i<90;i++) this.stars.push({
      x:W*.1+Math.random()*W*.8,y:H*.1+Math.random()*H*.8,
      vx:(Math.random()-.5)*.25,vy:(Math.random()-.5)*.25,
      phase:Math.random(),size:.8+Math.random()*1.8
    });
    this.LINK=Math.min(W,H)*.18;
  }
  update(t,amp){
    for(const s of this.stars){
      s.vx+=(Math.random()-.5)*.015+(W/2-s.x)*.00008;
      s.vy+=(Math.random()-.5)*.015+(H/2-s.y)*.00008;
      if(amp>.04){s.vx+=(Math.random()-.5)*amp*.4;s.vy+=(Math.random()-.5)*amp*.4;}
      // Mouse attraction
      const mdx=mouseX-s.x,mdy=mouseY-s.y,md=Math.hypot(mdx,mdy);
      if(md<200){s.vx+=mdx/md*.04;s.vy+=mdy/md*.04;}
      s.vx*=.97;s.vy*=.97;s.x+=s.vx;s.y+=s.vy;
      if(s.x<40)s.vx+=.08;if(s.x>W-40)s.vx-=.08;
      if(s.y<40)s.vy+=.08;if(s.y>H-40)s.vy-=.08;
      s.phase+=.0015;
    }
  }
  draw(ctx,t,amp){
    ctx.globalAlpha=.1;ctx.globalCompositeOperation='source-over';
    ctx.fillStyle='#000008';ctx.fillRect(0,0,W,H);
    const L=this.LINK;
    ctx.globalCompositeOperation='source-over';
    for(let i=0;i<this.stars.length;i++) for(let j=i+1;j<this.stars.length;j++){
      const a=this.stars[i],b=this.stars[j],d=Math.hypot(a.x-b.x,a.y-b.y);
      if(d>L) continue;
      ctx.globalAlpha=(1-d/L)*.42;
      ctx.strokeStyle=aurora(((a.phase+b.phase)*.5+t*.012)%1);
      ctx.lineWidth=.5;ctx.beginPath();ctx.moveTo(a.x,a.y);ctx.lineTo(b.x,b.y);ctx.stroke();
    }
    ctx.globalCompositeOperation='lighter';
    for(const s of this.stars){
      ctx.globalAlpha=.88;ctx.fillStyle=aurora((s.phase+t*.012)%1);
      ctx.beginPath();ctx.arc(s.x,s.y,s.size+amp*2.5,0,Math.PI*2);ctx.fill();
    }
    ctx.globalCompositeOperation='source-over';ctx.globalAlpha=1;
  }
}

// ════════════════════════════════════════════════════════════
// SCENE 5 · Mandala
// ════════════════════════════════════════════════════════════
class MandalaScene {
  init(){this.rot=0;}
  update(t,amp){this.rot+=.004+amp*.01;}
  _poly(ctx,cx,cy,r,n,rot){
    ctx.beginPath();
    for(let i=0;i<=n;i++){const a=(i/n)*Math.PI*2+rot;ctx.lineTo(cx+r*Math.cos(a),cy+r*Math.sin(a));}
    ctx.stroke();
  }
  draw(ctx,t,amp){
    ctx.globalAlpha=.06;ctx.globalCompositeOperation='source-over';
    ctx.fillStyle='#000008';ctx.fillRect(0,0,W,H);
    const cx=W/2,cy=H/2,maxR=Math.min(W,H)*.44,sym=8,br=this.rot;
    ctx.globalCompositeOperation='source-over';
    for(let s=0;s<sym;s++){
      ctx.save();
      ctx.translate(cx,cy);ctx.rotate((s/sym)*Math.PI*2);ctx.translate(-cx,-cy);
      for(let r=1;r<=8;r++){
        const radius=r*maxR/8*(1+amp*.12),sides=r+2;
        const rot2=br*(r%2===0?1:-1)*r*.5;
        ctx.globalAlpha=.38+.25*Math.sin(t*.025+r);
        ctx.strokeStyle=aurora((r/8+t*.014)%1);ctx.lineWidth=.7;
        this._poly(ctx,cx,cy,radius,sides,rot2);
      }
      ctx.restore();
    }
    const gr=ctx.createRadialGradient(cx,cy,0,cx,cy,maxR*.2);
    gr.addColorStop(0,`rgba(120,180,255,${.1+amp*.25})`);gr.addColorStop(1,'rgba(0,0,0,0)');
    ctx.globalAlpha=1;ctx.fillStyle=gr;ctx.fillRect(0,0,W,H);
    const age=(Date.now()-lastNoteMs)/2000;
    if(age<1){
      const rp=maxR*(.3+age*.5);
      const gp=ctx.createRadialGradient(cx,cy,rp*.9,cx,cy,rp);
      gp.addColorStop(0,'rgba(0,0,0,0)');
      gp.addColorStop(.5,`rgba(150,200,255,${(1-age)*.35})`);
      gp.addColorStop(1,'rgba(0,0,0,0)');
      ctx.fillStyle=gp;ctx.fillRect(0,0,W,H);
    }
    ctx.globalAlpha=1;
  }
}

// ════════════════════════════════════════════════════════════
// SCENE 6 · Plasma  [NEW]
// ════════════════════════════════════════════════════════════
class PlasmaScene {
  init(){
    this.RW=96; this.RH=54;
    this.off=document.createElement('canvas'); this.off.width=this.RW; this.off.height=this.RH;
    this.offCtx=this.off.getContext('2d');
    this.img=this.offCtx.createImageData(this.RW,this.RH);
  }
  update(){}
  draw(ctx,t,amp){
    const {RW,RH,img}=this; const data=img.data;
    const spd=.045+amp*.07;
    for(let y=0;y<RH;y++) for(let x=0;x<RW;x++){
      const v=Math.sin(x*.28+t*spd)
             +Math.sin(y*.28+t*spd*.75)
             +Math.sin((x+y)*.18+t*spd*1.3)
             +Math.sin(Math.sqrt((x-RW/2)**2+(y-RH/2)**2)*.35+t*spd);
      const n=((v+4)/8);
      const hue=270-n*140, sat=.75+.25*Math.sin(n*Math.PI), lig=.35+.4*Math.sin(n*Math.PI*2);
      const [r,g,b]=hslToRgb(hue,sat,lig);
      const i=(y*RW+x)*4; data[i]=r;data[i+1]=g;data[i+2]=b;data[i+3]=255;
    }
    this.offCtx.putImageData(img,0,0);
    ctx.globalAlpha=1;ctx.globalCompositeOperation='source-over';
    ctx.imageSmoothingEnabled=false;
    ctx.drawImage(this.off,0,0,W,H);
    ctx.imageSmoothingEnabled=true;
  }
}

// ════════════════════════════════════════════════════════════
// SCENE 7 · Swarm / Boids
// ════════════════════════════════════════════════════════════
class SwarmScene {
  init(){
    this.bs=[];
    for(let i=0;i<200;i++) this.bs.push({
      x:Math.random()*W,y:Math.random()*H,
      vx:(Math.random()-.5)*2,vy:(Math.random()-.5)*2,phase:Math.random()
    });
  }
  update(t,amp){
    const bs=this.bs,NR=85,AR=26,spd=1.4+amp*2;
    for(const b of bs){
      let ax=0,ay=0,cx2=0,cy2=0,cvx=0,cvy=0,nc=0,sx=0,sy=0,sc=0;
      for(const o of bs){
        if(o===b) continue;
        const dx=o.x-b.x,dy=o.y-b.y,d=Math.sqrt(dx*dx+dy*dy);
        if(d>NR) continue;
        cx2+=o.x;cy2+=o.y;cvx+=o.vx;cvy+=o.vy;nc++;
        if(d<AR){sx-=dx/d;sy-=dy/d;sc++;}
      }
      if(nc>0){ax+=(cx2/nc-b.x)/NR*.012+(cvx/nc-b.vx)*.05;ay+=(cy2/nc-b.y)/NR*.012+(cvy/nc-b.vy)*.05;}
      if(sc>0){ax+=sx*.06;ay+=sy*.06;}
      if(b.x<80)ax+=.06;if(b.x>W-80)ax-=.06;if(b.y<80)ay+=.06;if(b.y>H-80)ay-=.06;
      // Mouse attraction
      const mdx=mouseX-b.x,mdy=mouseY-b.y,md=Math.hypot(mdx,mdy);
      if(md<180){ax+=mdx/md*.06;ay+=mdy/md*.06;}
      if(amp>.04){ax+=(W/2-b.x)*amp*.0008;ay+=(H/2-b.y)*amp*.0008;}
      b.vx+=ax;b.vy+=ay;
      const sp=Math.hypot(b.vx,b.vy);
      if(sp>spd){b.vx=b.vx/sp*spd;b.vy=b.vy/sp*spd;}else if(sp<.4){b.vx*=1.1;b.vy*=1.1;}
      b.x+=b.vx;b.y+=b.vy;b.phase=(b.phase+.002+sp*.001)%1;
    }
  }
  draw(ctx,t,amp){
    ctx.globalAlpha=.07;ctx.globalCompositeOperation='source-over';
    ctx.fillStyle='#000008';ctx.fillRect(0,0,W,H);
    ctx.globalCompositeOperation='lighter';
    for(const b of this.bs){
      const sp=Math.hypot(b.vx,b.vy);
      ctx.globalAlpha=.65+sp*.1;ctx.fillStyle=aurora((b.phase+t*.012)%1);
      ctx.beginPath();ctx.arc(b.x,b.y,1.2+sp*.3+amp*1.5,0,Math.PI*2);ctx.fill();
    }
    ctx.globalCompositeOperation='source-over';ctx.globalAlpha=1;
  }
}

// ════════════════════════════════════════════════════════════
// SCENE 8 · Origami Cranes  [NEW]
// ════════════════════════════════════════════════════════════
class CranesScene {
  init(){
    this.cranes=[];
    for(let i=0;i<22;i++) this.cranes.push({
      x:Math.random()*W, y:Math.random()*H,
      vx:1.2+Math.random()*1.8,
      vy:(Math.random()-.5)*.6,
      size:16+Math.random()*24,
      wp:Math.random()*Math.PI*2,    // wing phase
      ws:.07+Math.random()*.06,      // wing speed
      cp:Math.random(),              // color phase
      bob:Math.random()*Math.PI*2,   // vertical bob offset
    });
  }
  _crane(ctx,x,y,sz,wa,col,al){
    const w=Math.sin(wa);   // wing flap -1..1
    ctx.globalAlpha=al; ctx.fillStyle=col;
    // Body
    ctx.beginPath();
    ctx.moveTo(x+sz*.5,y); ctx.lineTo(x,y-sz*.22);
    ctx.lineTo(x-sz*.7,y); ctx.lineTo(x,y+sz*.22); ctx.closePath(); ctx.fill();
    // Neck + head
    ctx.beginPath();
    ctx.moveTo(x+sz*.38,y-sz*.1); ctx.lineTo(x+sz*.72,y-sz*.38); ctx.lineTo(x+sz*.78,y-sz*.2); ctx.closePath(); ctx.fill();
    ctx.beginPath(); ctx.arc(x+sz*.76,y-sz*.4,sz*.07,0,Math.PI*2); ctx.fill();
    // Beak
    ctx.beginPath();
    ctx.moveTo(x+sz*.82,y-sz*.42); ctx.lineTo(x+sz*.98,y-sz*.5);
    ctx.lineTo(x+sz*.82,y-sz*.36); ctx.closePath(); ctx.fill();
    // Wings
    ctx.beginPath();
    ctx.moveTo(x-sz*.05,y-sz*.15);
    ctx.lineTo(x-sz*.18+w*sz*.08,y-sz*.48-w*sz*.32);
    ctx.lineTo(x+sz*.28,y-sz*.08); ctx.closePath(); ctx.fill();
    ctx.beginPath();
    ctx.moveTo(x-sz*.05,y+sz*.15);
    ctx.lineTo(x-sz*.18-w*sz*.08,y+sz*.48+w*sz*.32);
    ctx.lineTo(x+sz*.28,y+sz*.08); ctx.closePath(); ctx.fill();
    // Tail
    ctx.beginPath();
    ctx.moveTo(x-sz*.6,y-sz*.06); ctx.lineTo(x-sz*.88,y-sz*.24);
    ctx.lineTo(x-sz*.75,y); ctx.lineTo(x-sz*.88,y+sz*.24);
    ctx.lineTo(x-sz*.6,y+sz*.06); ctx.closePath(); ctx.fill();
  }
  update(t,amp){
    for(const c of this.cranes){
      c.wp+=c.ws*(1+amp*3);
      c.x+=c.vx*(1+amp*.6);
      c.y+=c.vy+Math.sin(t*.018+c.bob)*.35;
      c.cp+=.0008;
      if(c.x>W+100) c.x=-100;
      if(c.x<-100)  c.x=W+100;
      if(c.y<-60)   c.y=H+60;
      if(c.y>H+60)  c.y=-60;
    }
  }
  draw(ctx,t,amp){
    ctx.globalAlpha=.07; ctx.globalCompositeOperation='source-over';
    ctx.fillStyle='#000008'; ctx.fillRect(0,0,W,H);
    ctx.globalCompositeOperation='source-over';
    for(const c of this.cranes){
      const v=(c.cp+t*.007)%1;
      const ang=Math.atan2(c.vy+Math.cos(t*.018+c.bob)*.35,c.vx);
      ctx.save();
      ctx.translate(c.x,c.y); ctx.rotate(ang);
      this._crane(ctx,0,0,c.size,c.wp,aurora(v),.88);
      ctx.restore();
    }
    ctx.globalAlpha=1;
  }
}

// ════════════════════════════════════════════════════════════
// SCENE 9 · Tunnel  [NEW]
// ════════════════════════════════════════════════════════════
class TunnelScene {
  init(){
    this.rings=[];
    for(let i=0;i<55;i++) this.rings.push({z:i/55,phase:Math.random(),sides:Math.floor(Math.random()*5)+4});
  }
  update(t,amp){
    const spd=.005+amp*.012;
    for(const r of this.rings){ r.z+=spd; if(r.z>=1) r.z-=1; }
  }
  draw(ctx,t,amp){
    ctx.globalAlpha=.12;ctx.globalCompositeOperation='source-over';
    ctx.fillStyle='#000';ctx.fillRect(0,0,W,H);
    // Camera tilts toward mouse (subtle)
    const tiltX=(mouseX-W/2)*.04, tiltY=(mouseY-H/2)*.04;
    const cx=W/2+tiltX, cy=H/2+tiltY;
    const maxR=Math.min(W,H)*.62;
    const sorted=[...this.rings].sort((a,b)=>a.z-b.z);
    ctx.globalCompositeOperation='source-over';
    for(const ring of sorted){
      const p=ring.z*ring.z; // perspective: near items bigger
      const r=p*maxR;
      const alpha=p*.75;
      if(alpha<.02) continue;
      const v=(ring.phase+t*.02+ring.z*.25)%1;
      ctx.globalAlpha=alpha;
      ctx.strokeStyle=aurora(v);
      ctx.lineWidth=.6+p*2.5;
      ctx.beginPath();
      for(let i=0;i<=ring.sides;i++){
        const a=(i/ring.sides)*Math.PI*2+t*.08*(ring.z+.5);
        const x=cx+r*Math.cos(a), y=cy+r*Math.sin(a);
        i===0?ctx.moveTo(x,y):ctx.lineTo(x,y);
      }
      ctx.stroke();
    }
    // Central vanishing glow
    ctx.globalCompositeOperation='lighter';
    const gr=ctx.createRadialGradient(cx,cy,0,cx,cy,maxR*.15);
    gr.addColorStop(0,`rgba(160,220,255,${.2+amp*.4})`);gr.addColorStop(1,'rgba(0,0,0,0)');
    ctx.globalAlpha=1;ctx.fillStyle=gr;ctx.fillRect(0,0,W,H);
    ctx.globalCompositeOperation='source-over';ctx.globalAlpha=1;
  }
}

// ── Scene management ──────────────────────────────────────────────────────────
const SCENE_DUR = 1260;
const FADE      = 90;

let sceneIdx=0, tick=0;
const SCENE_META = [
  {name:'flow',         Scene:FlowScene      },
  {name:'lissajous',    Scene:LissajousScene },
  {name:'attractor',    Scene:AttractorScene },
  {name:'constellation',Scene:StarnetScene   },
  {name:'mandala',      Scene:MandalaScene   },
  {name:'plasma',       Scene:PlasmaScene    },
  {name:'swarm',        Scene:SwarmScene     },
  {name:'cranes',       Scene:CranesScene    },
  {name:'tunnel',       Scene:TunnelScene    },
];
const scenes = SCENE_META.map(m => new m.Scene());
scenes.forEach(s => s.init());

function sceneFade(){
  if(tick<FADE) return tick/FADE;
  if(tick>SCENE_DUR-FADE) return (SCENE_DUR-tick)/FADE;
  return 1;
}

// ── Scene dots ────────────────────────────────────────────────────────────────
function buildDots(){
  dotsEl.innerHTML='';
  SCENE_META.forEach((_,i)=>{
    const d=document.createElement('div'); d.className='dot'+(i===sceneIdx?' active':'');
    dotsEl.appendChild(d);
  });
}
function updateDots(){
  [...dotsEl.children].forEach((d,i)=>d.className='dot'+(i===sceneIdx?' active':''));
}
buildDots();

function showLabel(name){
  label.textContent=name; label.style.opacity='1';
  setTimeout(()=>{label.style.opacity='0';},3000);
}

// ── Note pulse ────────────────────────────────────────────────────────────────
let pulseA=0;
function drawPulse(){
  const age=(Date.now()-lastNoteMs)/1000;
  pulseA=age<1.2?Math.max(pulseA,1-age/1.2):pulseA*.90;
  if(pulseA<.005) return;
  const r=Math.min(W,H)*.4;
  const gr=ctx.createRadialGradient(W/2,H/2,0,W/2,H/2,r);
  gr.addColorStop(0,`rgba(100,150,255,${pulseA*.09})`);gr.addColorStop(1,'rgba(0,0,0,0)');
  ctx.globalAlpha=1;ctx.globalCompositeOperation='source-over';
  ctx.fillStyle=gr;ctx.fillRect(0,0,W,H);
}

// ── Beat flash ────────────────────────────────────────────────────────────────
function drawBeatFlash(){
  if(beatFlashA<.005) return;
  ctx.globalAlpha=beatFlashA;
  ctx.globalCompositeOperation='lighter';
  ctx.fillStyle='rgba(80,120,255,1)';
  ctx.fillRect(0,0,W,H);
  ctx.globalCompositeOperation='source-over';
  beatFlashA*=.78;
}

// ── Click to start ────────────────────────────────────────────────────────────
overlay.addEventListener('click',()=>{
  startAudio();
  overlay.style.transition='opacity 1.2s'; overlay.style.opacity='0';
  setTimeout(()=>overlay.remove(),1300);
  showLabel(SCENE_META[0].name);
},{once:true});

// ── Main loop ─────────────────────────────────────────────────────────────────
let t=0, frame=0;

(function animate(){
  requestAnimationFrame(animate);
  t+=.5; frame++;
  audioAmp=audioAmp*.84+getAmp()*.16;
  tick++;

  if(tick>=SCENE_DUR){
    sceneIdx=(sceneIdx+1)%scenes.length;
    tick=0;
    ctx.globalAlpha=1;ctx.globalCompositeOperation='source-over';
    ctx.fillStyle='#000';ctx.fillRect(0,0,W,H);
    scenes[sceneIdx].init();
    showLabel(SCENE_META[sceneIdx].name);
    updateDots();
  }

  scenes[sceneIdx].update(t,audioAmp);
  scenes[sceneIdx].draw(ctx,t,audioAmp);
  drawPulse();
  drawBeatFlash();

  const f=sceneFade();
  if(f<1){
    ctx.globalAlpha=Math.pow(1-f,1.5);
    ctx.globalCompositeOperation='source-over';
    ctx.fillStyle='#000';ctx.fillRect(0,0,W,H);
    ctx.globalAlpha=1;
  }
})();
