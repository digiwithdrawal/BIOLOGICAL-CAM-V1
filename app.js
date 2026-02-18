// app.js — VeinGlow Cam v2 (effect upgrade)
// Keep UI/camera as-is. Update only visuals:
// - More biological (eyeball-like) veins: mixed capillary web + feeder veins
// - Subtle organic motion (breathing/waving)
// - Runner = soft white orb, clipped INSIDE vein core, respawns on random vein
// - More embedded double exposure + light palette grade on photo
// - Moderate grain + bloom on final composite
// - No sliders. Random changes everything. 40 palettes. Photo-only. Auto/manual ratios. Flash toggle.

const $ = (id) => document.getElementById(id);

const video = $("video");
const view = $("view");
const vctx = view.getContext("2d", { willReadFrequently: true });

const ui = {
  ratio: $("ratio"),
  flashBtn: $("flashBtn"),
  screenFlash: $("screenFlash"),

  openPal: $("openPal"),
  closePal: $("closePal"),
  palModal: $("palModal"),
  palList: $("palList"),
  palName: $("palName"),

  randomBtn: $("randomBtn"),
  hideBtn: $("hideBtn"),
  showBtn: $("showBtn"),
  snap: $("snap"),
  tip: $("tip"),
};

function clamp(v,a,b){ return Math.max(a, Math.min(b,v)); }
function lerp(a,b,t){ return a + (b-a)*t; }
function rand(min,max){ return min + Math.random()*(max-min); }
function pick(arr){ return arr[(Math.random()*arr.length)|0]; }

// ------------------- Palettes (40) -------------------
const PALETTES = [
  { name:"NEON ORGANIC", a:"#19f6ff", b:"#ff2fb3", c:"#b4ff2f", bg:"#07080c" },
  { name:"PURPLE ORANGE", a:"#a855f7", b:"#fb923c", c:"#ffd166", bg:"#090510" },
  { name:"RED BLUE", a:"#ff3355", b:"#2dd4ff", c:"#7c3aed", bg:"#070711" },
  { name:"RED BLACK", a:"#ff2d2d", b:"#0b0b0d", c:"#ffb703", bg:"#050506" },
  { name:"CYAN LIME", a:"#00f5d4", b:"#bfff00", c:"#00bbf9", bg:"#04070a" },
  { name:"GHOST GREEN", a:"#7CFF6B", b:"#0b2f1a", c:"#9ef01a", bg:"#040804" },
  { name:"ICE MAGENTA", a:"#6ee7ff", b:"#ff4fd8", c:"#c084fc", bg:"#070611" },
  { name:"EMBER", a:"#ff6b35", b:"#f7c59f", c:"#ef233c", bg:"#0b0504" },
  { name:"OCEAN", a:"#2dd4bf", b:"#38bdf8", c:"#0ea5e9", bg:"#02080c" },
  { name:"MINT ROSE", a:"#34d399", b:"#fb7185", c:"#fda4af", bg:"#070708" },

  { name:"TOXIC", a:"#a3ff12", b:"#12ffb0", c:"#6d28d9", bg:"#050806" },
  { name:"SUNSET", a:"#f97316", b:"#fb7185", c:"#fbbf24", bg:"#090403" },
  { name:"DEEP SPACE", a:"#60a5fa", b:"#a78bfa", c:"#22d3ee", bg:"#040412" },
  { name:"VIOLET ICE", a:"#a78bfa", b:"#67e8f9", c:"#f472b6", bg:"#05080b" },
  { name:"GOLD CYAN", a:"#fbbf24", b:"#22d3ee", c:"#fb7185", bg:"#070707" },
  { name:"FOREST NEON", a:"#22c55e", b:"#a3e635", c:"#10b981", bg:"#040704" },
  { name:"ROYAL", a:"#2563eb", b:"#f59e0b", c:"#ef4444", bg:"#05060b" },
  { name:"BLOOD LIME", a:"#ef4444", b:"#84cc16", c:"#f97316", bg:"#060404" },
  { name:"AQUA PINK", a:"#22d3ee", b:"#fb7185", c:"#a78bfa", bg:"#05060a" },
  { name:"STEEL", a:"#94a3b8", b:"#38bdf8", c:"#f472b6", bg:"#06070a" },

  { name:"PLASMA", a:"#ff00ff", b:"#00ffff", c:"#ffee00", bg:"#080010" },
  { name:"LAVA", a:"#ff3d00", b:"#ff9100", c:"#ffea00", bg:"#080202" },
  { name:"GLACIER", a:"#93c5fd", b:"#67e8f9", c:"#a7f3d0", bg:"#05080b" },
  { name:"NIGHT ROSE", a:"#fb7185", b:"#a78bfa", c:"#60a5fa", bg:"#060410" },
  { name:"ELECTRIC", a:"#00ff88", b:"#00aaff", c:"#ff00aa", bg:"#05070a" },
  { name:"CITRUS", a:"#f59e0b", b:"#a3e635", c:"#22c55e", bg:"#060703" },
  { name:"PUNCH", a:"#ef4444", b:"#3b82f6", c:"#fbbf24", bg:"#080406" },
  { name:"SOFT UV", a:"#c084fc", b:"#60a5fa", c:"#f472b6", bg:"#070511" },
  { name:"ACID WAVE", a:"#a3ff12", b:"#19f6ff", c:"#ff2fb3", bg:"#04070a" },
  { name:"COPPER", a:"#b45309", b:"#f59e0b", c:"#fb7185", bg:"#070503" },

  { name:"MIDNIGHT CYAN", a:"#22d3ee", b:"#0ea5e9", c:"#a78bfa", bg:"#02030b" },
  { name:"NEON RED", a:"#ff2d2d", b:"#ff6b35", c:"#fb7185", bg:"#050303" },
  { name:"MATRIX", a:"#00ff66", b:"#00cc55", c:"#66ff99", bg:"#020402" },
  { name:"SKY FIRE", a:"#38bdf8", b:"#f97316", c:"#fbbf24", bg:"#05060a" },
  { name:"ROYAL PINK", a:"#7c3aed", b:"#fb7185", c:"#22d3ee", bg:"#060311" },
  { name:"TROPIC", a:"#34d399", b:"#22d3ee", c:"#f472b6", bg:"#05080a" },
  { name:"INFERNO", a:"#ef4444", b:"#f59e0b", c:"#fbbf24", bg:"#070202" },
  { name:"ALIEN", a:"#bfff00", b:"#00f5d4", c:"#a855f7", bg:"#040804" },
  { name:"BLUEPRINT", a:"#60a5fa", b:"#93c5fd", c:"#22d3ee", bg:"#020610" },
  { name:"PINK LIME", a:"#fb7185", b:"#a3e635", c:"#22d3ee", bg:"#070607" },
];

let currentPal = PALETTES[0];
ui.palName.textContent = currentPal.name;

// ------------------- Ratio helpers -------------------
function viewportSize(){
  const vw = Math.floor(window.visualViewport?.width || window.innerWidth);
  const vh = Math.floor(window.visualViewport?.height || window.innerHeight);
  return { vw, vh };
}
function deviceIsLandscape(){
  const { vw, vh } = viewportSize();
  return vw > vh;
}
function chosenMode(){
  const m = ui.ratio.value;
  if (m === "auto") return deviceIsLandscape() ? "landscape" : "portrait";
  return m;
}
function modeAspect(mode){
  if (mode === "square") return 1;
  if (mode === "landscape") return 16/9;
  return 9/16;
}
function computeCropRect(srcW, srcH, mode){
  const ar = modeAspect(mode);
  const srcAR = srcW / srcH;

  let cropW, cropH;
  if (srcAR > ar){
    cropH = srcH;
    cropW = Math.round(srcH * ar);
  } else {
    cropW = srcW;
    cropH = Math.round(srcW / ar);
  }
  const cx = Math.floor((srcW - cropW) / 2);
  const cy = Math.floor((srcH - cropH) / 2);
  return { cx, cy, cropW, cropH };
}
function exportSizeForMode(mode){
  const longEdge = 2000;
  if (mode === "square") return { w: longEdge, h: longEdge };
  if (mode === "landscape") return { w: longEdge, h: Math.round(longEdge / (16/9)) };
  return { h: longEdge, w: Math.round(longEdge * (9/16)) };
}

// ------------------- Flash (Torch + Screen fallback) -------------------
let stream = null;
let videoTrack = null;
let torchAvailable = false;
let flashMode = "off"; // off | torch | screen

function updateFlashButton(){
  ui.flashBtn.textContent =
    flashMode === "off" ? "FLASH: OFF" :
    flashMode === "torch" ? "FLASH: TORCH" :
    "FLASH: SCREEN";
}
function screenFlashPulse(){
  ui.screenFlash.classList.remove("hidden");
  requestAnimationFrame(()=> ui.screenFlash.classList.add("on"));
  setTimeout(()=>{
    ui.screenFlash.classList.remove("on");
    setTimeout(()=> ui.screenFlash.classList.add("hidden"), 120);
  }, 90);
}
async function detectTorchSupport(){
  try{
    videoTrack = stream?.getVideoTracks?.()[0] || null;
    if (!videoTrack) return false;
    const caps = videoTrack.getCapabilities ? videoTrack.getCapabilities() : null;
    torchAvailable = !!(caps && "torch" in caps);
    return torchAvailable;
  }catch{
    torchAvailable = false;
    return false;
  }
}
async function setTorch(on){
  if (!torchAvailable || !videoTrack) return false;
  try{
    await videoTrack.applyConstraints({ advanced: [{ torch: !!on }] });
    return true;
  }catch{
    return false;
  }
}
ui.flashBtn.addEventListener("click", async ()=>{
  if (flashMode === "off"){
    flashMode = torchAvailable ? "torch" : "screen";
  } else if (flashMode === "torch"){
    flashMode = "screen";
    await setTorch(false);
  } else {
    flashMode = "off";
    await setTorch(false);
  }
  updateFlashButton();
});
updateFlashButton();

// ------------------- HUD hide/show (same behavior you requested) -------------------
let hudHidden = false;
function setHudHidden(on){
  hudHidden = !!on;
  document.body.classList.toggle("onlySnap", hudHidden);
  ui.showBtn.classList.toggle("hidden", !hudHidden);
  ui.hideBtn.textContent = hudHidden ? "SHOW" : "HIDE";
}
ui.hideBtn.addEventListener("click", ()=> setHudHidden(!hudHidden));
ui.showBtn.addEventListener("click", ()=> setHudHidden(false));

// ------------------- Palette modal -------------------
function openPal(){ ui.palModal.classList.remove("hidden"); ui.palModal.setAttribute("aria-hidden","false"); }
function closePal(){ ui.palModal.classList.add("hidden"); ui.palModal.setAttribute("aria-hidden","true"); }
ui.openPal.addEventListener("click", openPal);
ui.closePal.addEventListener("click", closePal);
ui.palModal.addEventListener("click", (e)=>{ if (e.target === ui.palModal) closePal(); });

function renderPalettes(){
  ui.palList.innerHTML = "";
  for (const p of PALETTES){
    const btn = document.createElement("button");
    btn.className = "palBtn";
    btn.innerHTML = `${p.name}<small>${p.a} • ${p.b} • ${p.c}</small>`;
    btn.addEventListener("click", ()=>{
      currentPal = p;
      ui.palName.textContent = currentPal.name;
      closePal();
    });
    ui.palList.appendChild(btn);
  }
}
renderPalettes();

// ------------------- Color helpers -------------------
function hexToRgb(hex){
  const h = hex.replace("#","");
  const n = parseInt(h.length===3 ? h.split("").map(x=>x+x).join("") : h, 16);
  return { r:(n>>16)&255, g:(n>>8)&255, b:n&255 };
}
function rgbStr(c, a=1){
  return `rgba(${c.r|0},${c.g|0},${c.b|0},${a})`;
}
function mixRGB(a,b,t){
  return { r: lerp(a.r,b.r,t), g: lerp(a.g,b.g,t), b: lerp(a.b,b.b,t) };
}

// ------------------- Vein system (more biological + motion) -------------------
const veinCanvas = document.createElement("canvas");
const veinCtx = veinCanvas.getContext("2d", { willReadFrequently: true });

// masks for core clipping + glow layering
const coreMask = document.createElement("canvas");
const coreCtx = coreMask.getContext("2d", { willReadFrequently: true });

const runnerCanvas = document.createElement("canvas");
const runnerCtx = runnerCanvas.getContext("2d", { willReadFrequently: true });

// mild bloom helper
const bloomSmall = document.createElement("canvas");
const bloomCtx = bloomSmall.getContext("2d", { willReadFrequently: true });

// grain helper
const grainCanvas = document.createElement("canvas");
const grainCtx = grainCanvas.getContext("2d", { willReadFrequently: true });

let veins = []; // each: { basePts:[{x,y,t,wob}], pts:[{x,y}], w, kind:"cap"/"feed" }
let runner = { lineIndex:0, t:0, speed:0.22, radius:12 };

let params = {
  // 1B mixed capillary + feeders
  capCount: 38,
  feedCount: 6,

  // 2C blood tint
  bloodMix: 0.45, // palette->blood mix

  // 3B subtle wave motion
  waveAmp: 0.010,
  waveSpeed: 0.55,

  // base thickness scaling
  capThickness: 1.15,
  feedThickness: 2.65,

  // shape
  jitter: 0.018,
  wander: 0.028,
  detail: 9,
  scale: 1.0,

  // runner
  glowStrength: 1.10,
  overlayAlpha: 0.70,     // more embedded than before
  blend: "screen",        // double exposure feel
  photoTint: 0.16,        // 8B light palette cast on photo
  photoTintMode: "soft-light", // tint blending

  // 9C moderate grain + bloom
  grain: 0.09,
  bloom: 0.14,
};

function ensureAuxCanvases(){
  const w = Math.max(420, Math.floor(view.width / 2));
  const h = Math.max(420, Math.floor(view.height / 2));

  if (veinCanvas.width !== w || veinCanvas.height !== h){
    veinCanvas.width = w; veinCanvas.height = h;
    coreMask.width = w; coreMask.height = h;
    runnerCanvas.width = w; runnerCanvas.height = h;
  }

  // bloom working canvas
  const bw = Math.max(260, Math.floor(view.width / 5));
  const bh = Math.max(260, Math.floor(view.height / 5));
  if (bloomSmall.width !== bw || bloomSmall.height !== bh){
    bloomSmall.width = bw; bloomSmall.height = bh;
  }

  // grain matches view for simplicity (cheap + fast)
  if (grainCanvas.width !== view.width || grainCanvas.height !== view.height){
    grainCanvas.width = view.width; grainCanvas.height = view.height;
  }
}

// organic polyline generator (biological: curvier + branching)
function genPolyline(seedX, seedY, dirX, dirY, steps, kind){
  let x = seedX, y = seedY;
  let dx = dirX, dy = dirY;
  const basePts = [{ x, y, wob: Math.random()*10, w: 1 }];

  for (let i=0;i<steps;i++){
    // gentler wander = more biological
    const ang = (Math.random()-0.5) * params.wander * Math.PI * 2;
    const ca = Math.cos(ang), sa = Math.sin(ang);
    const ndx = dx*ca - dy*sa;
    const ndy = dx*sa + dy*ca;
    dx = ndx; dy = ndy;

    // forward step + jitter
    const step = rand(0.030, 0.060) * (kind === "feed" ? 1.10 : 1.00);
    x += dx*step + (Math.random()-0.5)*params.jitter;
    y += dy*step + (Math.random()-0.5)*params.jitter;

    // softly pull toward center so networks overlap (eyeball-ish)
    const cx = 0.5 - x;
    const cy = 0.5 - y;
    const pull = kind === "feed" ? 0.020 : 0.030;
    dx += cx*pull;
    dy += cy*pull;

    // normalize direction
    const m = Math.hypot(dx,dy) || 1;
    dx /= m; dy /= m;

    // clamp inside bounds
    x = clamp(x, 0.01, 0.99);
    y = clamp(y, 0.01, 0.99);

    // thickness taper
    const taper = lerp(1.0, 0.65, i / (steps-1));
    basePts.push({ x, y, wob: Math.random()*10, w: taper });

    // capillary branching is more frequent than feeder branching
    const branchChance = kind === "cap" ? 0.20 : 0.10;
    if (i > 3 && i < steps-3 && Math.random() < branchChance){
      const bAng = (Math.random()<0.5 ? -1 : 1) * rand(0.40, 1.05);
      const bdx = dx*Math.cos(bAng) - dy*Math.sin(bAng);
      const bdy = dx*Math.sin(bAng) + dy*Math.cos(bAng);
      const branchSteps = Math.floor(steps * rand(0.22, 0.50));
      const branch = genPolyline(x, y, bdx, bdy, branchSteps, "cap");
      branch.w *= rand(0.45, 0.70);
      veins.push(branch);
    }
  }

  return { basePts, pts: basePts.map(p=>({x:p.x,y:p.y})), w: 1.0, kind };
}

function regenerateVeins(forcePaletteChange=true){
  if (forcePaletteChange){
    currentPal = pick(PALETTES);
    ui.palName.textContent = currentPal.name;
  }

  // Random changes EVERYTHING (10A)
  params.capCount = Math.floor(rand(28, 60));
  params.feedCount = Math.floor(rand(4, 10));

  params.bloodMix = rand(0.35, 0.55);
  params.waveAmp = rand(0.006, 0.014);     // subtle organic motion (3B)
  params.waveSpeed = rand(0.42, 0.72);

  params.capThickness = rand(0.95, 1.45);
  params.feedThickness = rand(2.25, 3.35);

  params.jitter = rand(0.010, 0.024);
  params.wander = rand(0.020, 0.038);
  params.detail = Math.floor(rand(8, 11));
  params.scale = rand(0.92, 1.12);

  params.glowStrength = rand(0.95, 1.25);

  params.overlayAlpha = rand(0.62, 0.78);     // more embedded (7B)
  params.blend = pick(["screen","overlay","soft-light"]);
  params.photoTint = rand(0.12, 0.22);         // 8B light photo tint
  params.photoTintMode = pick(["soft-light","overlay","color"]);

  params.grain = rand(0.07, 0.11);             // 9C moderate grain
  params.bloom = rand(0.12, 0.18);             // 9C moderate bloom

  veins = [];

  // feeders: start from edges, longer lines
  for (let i=0;i<params.feedCount;i++){
    const side = (Math.random()*4)|0;
    let x,y, dx,dy;
    if (side===0){ x = rand(0.05,0.95); y = 0.01; dx = rand(-0.15,0.15); dy = 1; }
    if (side===1){ x = rand(0.05,0.95); y = 0.99; dx = rand(-0.15,0.15); dy = -1; }
    if (side===2){ x = 0.01; y = rand(0.05,0.95); dx = 1; dy = rand(-0.15,0.15); }
    if (side===3){ x = 0.99; y = rand(0.05,0.95); dx = -1; dy = rand(-0.15,0.15); }

    const steps = Math.floor(rand(14, 22)) + params.detail;
    const m = Math.hypot(dx,dy) || 1; dx/=m; dy/=m;

    const line = genPolyline(x,y,dx,dy,steps,"feed");
    line.w *= rand(1.05, 1.35);
    veins.push(line);
  }

  // capillaries: seed from random feeder points + random interior points
  const seedFromExisting = () => {
    const src = pick(veins);
    const bp = pick(src.basePts);
    return { x: bp.x, y: bp.y };
  };

  for (let i=0;i<params.capCount;i++){
    let x,y;
    if (Math.random() < 0.70 && veins.length){
      const s = seedFromExisting();
      x = s.x; y = s.y;
    } else {
      x = rand(0.10,0.90);
      y = rand(0.10,0.90);
    }

    // direction loosely radial
    let dx = (0.5 - x) * rand(-0.8, 0.8);
    let dy = (0.5 - y) * rand(-0.8, 0.8);
    if (Math.abs(dx)+Math.abs(dy) < 0.02){ dx = rand(-1,1); dy = rand(-1,1); }
    const m = Math.hypot(dx,dy) || 1; dx/=m; dy/=m;

    const steps = Math.floor(rand(9, 16)) + params.detail;
    const line = genPolyline(x,y,dx,dy,steps,"cap");
    line.w *= rand(0.70, 1.05);
    veins.push(line);
  }

  // pick runner starting vein randomly (5A respawn behavior will handle switching)
  runner.lineIndex = (Math.random()*veins.length)|0;
  runner.t = Math.random();
  runner.speed = rand(0.12, 0.42);
  runner.radius = rand(9, 16); // soft orb radius (4A)
}

// ------------------- Motion deformation (3B) -------------------
function deformVeinPoints(time){
  // subtle sine-based wobble per point, coherent along the line
  const amp = params.waveAmp;
  const spd = params.waveSpeed;

  for (const line of veins){
    const bp = line.basePts;
    const out = line.pts;
    for (let i=0;i<bp.length;i++){
      const p = bp[i];
      // combine two low-frequency waves for “breathing”
      const t = time*spd;
      const wob = p.wob;
      const w1 = Math.sin(t + wob + i*0.35);
      const w2 = Math.sin(t*0.62 + wob*1.7 + i*0.18);

      // direction for perpendicular offset: use neighbor tangent
      const a = bp[Math.max(0,i-1)];
      const b = bp[Math.min(bp.length-1,i+1)];
      let tx = b.x - a.x;
      let ty = b.y - a.y;
      const m = Math.hypot(tx,ty) || 1;
      tx /= m; ty /= m;

      // perpendicular
      const px = -ty, py = tx;

      // taper motion a bit at ends
      const taper = Math.sin((i/(bp.length-1))*Math.PI);
      const o = (w1*0.65 + w2*0.35) * amp * taper;

      out[i].x = clamp(p.x + px*o, 0.0, 1.0);
      out[i].y = clamp(p.y + py*o, 0.0, 1.0);
    }
  }
}

// ------------------- Path helpers for runner -------------------
function polyLength(pts){
  let L=0;
  for (let i=1;i<pts.length;i++){
    const dx = pts[i].x - pts[i-1].x;
    const dy = pts[i].y - pts[i-1].y;
    L += Math.hypot(dx,dy);
  }
  return L || 1;
}
function pointAlong(pts, t){
  const total = polyLength(pts);
  let target = total * clamp(t,0,1);
  for (let i=1;i<pts.length;i++){
    const a = pts[i-1], b = pts[i];
    const seg = Math.hypot(b.x-a.x, b.y-a.y);
    if (target <= seg){
      const u = seg ? (target/seg) : 0;
      return { x: lerp(a.x,b.x,u), y: lerp(a.y,b.y,u) };
    }
    target -= seg;
  }
  const last = pts[pts.length-1];
  return { x:last.x, y:last.y };
}

// ------------------- Draw video (cropped to chosen ratio) -------------------
function drawVideoTo(ctx, dstW, dstH){
  if (!video.videoWidth || !video.videoHeight) return;

  const mode = chosenMode();
  const vw = video.videoWidth;
  const vh = video.videoHeight;
  const { cx, cy, cropW, cropH } = computeCropRect(vw, vh, mode);

  ctx.imageSmoothingEnabled = true;
  ctx.drawImage(video, cx, cy, cropW, cropH, 0, 0, dstW, dstH);
}

// ------------------- Composite: more embedded double exposure (7B/8B/9C) -------------------
function addBloom(ctx, w, h, strength){
  if (strength <= 0) return;

  // downsample, blur-ish via repeated draws, then screen back
  const bw = bloomSmall.width, bh = bloomSmall.height;
  bloomCtx.clearRect(0,0,bw,bh);
  bloomCtx.drawImage(ctx.canvas, 0,0,w,h, 0,0,bw,bh);

  bloomCtx.globalCompositeOperation = "source-over";
  bloomCtx.globalAlpha = 0.25;
  for (let i=0;i<5;i++){
    bloomCtx.drawImage(bloomSmall, -2, 0);
    bloomCtx.drawImage(bloomSmall,  2, 0);
    bloomCtx.drawImage(bloomSmall, 0, -2);
    bloomCtx.drawImage(bloomSmall, 0,  2);
  }
  bloomCtx.globalAlpha = 1;

  ctx.save();
  ctx.globalCompositeOperation = "screen";
  ctx.globalAlpha = strength;
  ctx.drawImage(bloomSmall, 0,0,bw,bh, 0,0,w,h);
  ctx.restore();
}

function addGrain(ctx, w, h, amount){
  if (amount <= 0) return;

  const img = grainCtx.createImageData(w, h);
  const d = img.data;
  // cheap monochrome grain
  for (let i=0;i<d.length;i+=4){
    const n = (Math.random() - 0.5) * 255;
    const v = clamp(128 + n, 0, 255);
    d[i]=v; d[i+1]=v; d[i+2]=v; d[i+3]=255;
  }
  grainCtx.putImageData(img,0,0);

  ctx.save();
  ctx.globalCompositeOperation = "overlay";
  ctx.globalAlpha = amount;
  ctx.drawImage(grainCanvas, 0,0,w,h);
  ctx.restore();
}

function tintPhoto(ctx, w, h){
  // light palette cast on photo (8B), integrated (7B)
  const ca = hexToRgb(currentPal.a);
  const cb = hexToRgb(currentPal.b);
  const cc = hexToRgb(currentPal.c);
  const mix1 = mixRGB(ca, cb, 0.50);
  const mix2 = mixRGB(mix1, cc, 0.35);

  ctx.save();
  ctx.globalCompositeOperation = params.photoTintMode;
  ctx.globalAlpha = params.photoTint;

  // soft gradient tint
  const g = ctx.createLinearGradient(0,0,w,h);
  g.addColorStop(0, rgbStr(mix2, 1));
  g.addColorStop(1, rgbStr(ca, 1));
  ctx.fillStyle = g;
  ctx.fillRect(0,0,w,h);

  ctx.restore();
}

// ------------------- Vein drawing (core mask + color + runner clipped inside) -------------------
function drawVeins(time){
  ensureAuxCanvases();
  deformVeinPoints(time);

  const w = veinCanvas.width, h = veinCanvas.height;

  veinCtx.clearRect(0,0,w,h);
  coreCtx.clearRect(0,0,w,h);
  runnerCtx.clearRect(0,0,w,h);

  // Colors: palette-based veins with blood tint in core (2C)
  const ca = hexToRgb(currentPal.a);
  const cb = hexToRgb(currentPal.b);
  const cc = hexToRgb(currentPal.c);
  const blood = { r: 210, g: 45, b: 60 };

  const coreA = mixRGB(ca, blood, params.bloodMix);
  const coreB = mixRGB(cb, blood, params.bloodMix);
  const coreC = mixRGB(cc, blood, params.bloodMix);

  // thickness scaling
  const baseScale = (w/760) * params.scale;
  const capW = params.capThickness * baseScale;
  const feedW = params.feedThickness * baseScale;

  // 1) draw core mask (for clipping runner inside vein core)
  coreCtx.save();
  coreCtx.globalCompositeOperation = "source-over";
  coreCtx.strokeStyle = "rgba(255,255,255,1)";
  coreCtx.lineCap = "round";
  coreCtx.lineJoin = "round";

  for (let k=0;k<veins.length;k++){
    const line = veins[k];
    const pts = line.pts;
    const lw = (line.kind === "feed" ? feedW : capW) * line.w;

    coreCtx.lineWidth = lw;
    coreCtx.beginPath();
    coreCtx.moveTo(pts[0].x*w, pts[0].y*h);
    for (let i=1;i<pts.length;i++) coreCtx.lineTo(pts[i].x*w, pts[i].y*h);
    coreCtx.stroke();
  }
  coreCtx.restore();

  // 2) draw vein glow + colored core (more biological depth)
  veinCtx.save();
  veinCtx.globalCompositeOperation = "source-over";
  veinCtx.lineCap = "round";
  veinCtx.lineJoin = "round";

  for (let k=0;k<veins.length;k++){
    const line = veins[k];
    const pts = line.pts;

    // color cycling
    const which = k % 3;
    const glowCol = which===0 ? ca : which===1 ? cb : cc;
    const coreCol = which===0 ? coreA : which===1 ? coreB : coreC;

    const lw = (line.kind === "feed" ? feedW : capW) * line.w;

    // outer haze (subtle)
    veinCtx.strokeStyle = rgbStr(glowCol, 0.12 * params.glowStrength);
    veinCtx.lineWidth = lw * 4.4;
    veinCtx.beginPath();
    veinCtx.moveTo(pts[0].x*w, pts[0].y*h);
    for (let i=1;i<pts.length;i++) veinCtx.lineTo(pts[i].x*w, pts[i].y*h);
    veinCtx.stroke();

    // mid glow
    veinCtx.strokeStyle = rgbStr(glowCol, 0.22 * params.glowStrength);
    veinCtx.lineWidth = lw * 2.6;
    veinCtx.beginPath();
    veinCtx.moveTo(pts[0].x*w, pts[0].y*h);
    for (let i=1;i<pts.length;i++) veinCtx.lineTo(pts[i].x*w, pts[i].y*h);
    veinCtx.stroke();

    // colored core (blood-tinted)
    veinCtx.strokeStyle = rgbStr(coreCol, 0.72);
    veinCtx.lineWidth = lw * 1.05;
    veinCtx.beginPath();
    veinCtx.moveTo(pts[0].x*w, pts[0].y*h);
    for (let i=1;i<pts.length;i++) veinCtx.lineTo(pts[i].x*w, pts[i].y*h);
    veinCtx.stroke();

    // tiny spec highlight (helps “wet” biological feel)
    veinCtx.strokeStyle = "rgba(255,255,255,0.08)";
    veinCtx.lineWidth = lw * 0.55;
    veinCtx.beginPath();
    veinCtx.moveTo(pts[0].x*w, pts[0].y*h);
    for (let i=1;i<pts.length;i++) veinCtx.lineTo(pts[i].x*w, pts[i].y*h);
    veinCtx.stroke();
  }

  veinCtx.restore();

  // 3) runner: soft WHITE orb clipped INSIDE core mask (6B) + respawn (5A)
  const idx = clamp(runner.lineIndex, 0, veins.length-1);
  const line = veins[idx];
  if (line && line.pts.length > 2){
    runner.t += (runner.speed / 60);
    if (runner.t > 1.0){
      // exit -> respawn on another random vein (5A)
      runner.t = runner.t - 1.0;
      runner.lineIndex = (Math.random()*veins.length)|0;
      runner.speed = rand(0.12, 0.42);
      runner.radius = rand(9, 16);
    }

    const head = pointAlong(line.pts, runner.t);
    const x = head.x*w, y = head.y*h;

    // draw orb on runner canvas
    runnerCtx.save();
    runnerCtx.globalCompositeOperation = "source-over";

    // orb bloom gradient
    const r = runner.radius * (w/760) * params.scale;
    const g = runnerCtx.createRadialGradient(x,y, r*0.05, x,y, r*2.0);
    g.addColorStop(0.00, "rgba(255,255,255,0.95)");
    g.addColorStop(0.20, "rgba(255,255,255,0.55)");
    g.addColorStop(0.55, "rgba(255,255,255,0.16)");
    g.addColorStop(1.00, "rgba(255,255,255,0.00)");

    runnerCtx.fillStyle = g;
    runnerCtx.beginPath();
    runnerCtx.arc(x,y, r*2.0, 0, Math.PI*2);
    runnerCtx.fill();

    // tighter bright core
    const g2 = runnerCtx.createRadialGradient(x,y, 0, x,y, r*0.70);
    g2.addColorStop(0.00, "rgba(255,255,255,0.98)");
    g2.addColorStop(1.00, "rgba(255,255,255,0.00)");
    runnerCtx.fillStyle = g2;
    runnerCtx.beginPath();
    runnerCtx.arc(x,y, r*0.85, 0, Math.PI*2);
    runnerCtx.fill();

    runnerCtx.restore();

    // clip orb inside the vein core mask
    runnerCtx.save();
    runnerCtx.globalCompositeOperation = "destination-in";
    runnerCtx.drawImage(coreMask, 0,0);
    runnerCtx.restore();

    // add runner into veins with lighter blend
    veinCtx.save();
    veinCtx.globalCompositeOperation = "lighter";
    veinCtx.globalAlpha = 0.95;
    veinCtx.drawImage(runnerCanvas, 0,0);
    veinCtx.restore();
  }
}

// ------------------- Composition (live view) -------------------
function compositeTo(ctx, outW, outH, time){
  // draw camera
  drawVideoTo(ctx, outW, outH);

  // add light palette photo tint (8B) to embed effect
  tintPhoto(ctx, outW, outH);

  // draw veins over photo with embedded double exposure feel (7B)
  // upscale veins to output
  ctx.save();
  ctx.globalAlpha = params.overlayAlpha;
  ctx.globalCompositeOperation = params.blend;
  ctx.drawImage(veinCanvas, 0,0, outW, outH);
  ctx.restore();

  // extra soft pass to feel “exposed into” the image (double exposure fade)
  ctx.save();
  ctx.globalAlpha = params.overlayAlpha * 0.22;
  ctx.globalCompositeOperation = "screen";
  ctx.drawImage(veinCanvas, 0,0, outW, outH);
  ctx.restore();

  // bloom + grain on final composite (9C)
  addBloom(ctx, outW, outH, params.bloom);
  addGrain(ctx, outW, outH, params.grain);
}

// ------------------- Live loop -------------------
function fitCanvas(){
  const { vw, vh } = viewportSize();
  const dpr = Math.min(2, window.devicePixelRatio || 1);
  view.width = Math.floor(vw * dpr);
  view.height = Math.floor(vh * dpr);
}
fitCanvas();
window.addEventListener("resize", fitCanvas);
window.visualViewport?.addEventListener("resize", fitCanvas);

let t0 = performance.now();
function tick(now){
  if (!video.videoWidth || !video.videoHeight){
    requestAnimationFrame(tick);
    return;
  }

  const time = (now - t0) / 1000;

  ensureAuxCanvases();
  drawVeins(time);

  vctx.setTransform(1,0,0,1,0,0);
  vctx.clearRect(0,0,view.width,view.height);

  // fill background in case camera edges appear
  const bg = hexToRgb(currentPal.bg);
  vctx.fillStyle = rgbStr(bg, 1);
  vctx.fillRect(0,0,view.width,view.height);

  compositeTo(vctx, view.width, view.height, time);

  requestAnimationFrame(tick);
}

// ------------------- SNAP (photo-only) -------------------
const exportCanvas = document.createElement("canvas");
const exportCtx = exportCanvas.getContext("2d", { willReadFrequently:true });

ui.snap.addEventListener("click", async ()=>{
  if (!video.videoWidth || !video.videoHeight){
    ui.tip.textContent = "Camera not ready.";
    return;
  }

  // flash pulse
  if (flashMode === "torch" && torchAvailable){
    await setTorch(true);
    await new Promise(r => setTimeout(r, 120));
    await setTorch(false);
  } else if (flashMode === "screen"){
    screenFlashPulse();
    await new Promise(r => setTimeout(r, 90));
  }

  const mode = chosenMode();
  const out = exportSizeForMode(mode);

  exportCanvas.width = out.w;
  exportCanvas.height = out.h;

  // render one more “exact” frame for export
  const time = (performance.now() - t0) / 1000;
  ensureAuxCanvases();
  drawVeins(time);

  exportCtx.setTransform(1,0,0,1,0,0);
  exportCtx.clearRect(0,0,out.w,out.h);

  // background
  const bg = hexToRgb(currentPal.bg);
  exportCtx.fillStyle = rgbStr(bg, 1);
  exportCtx.fillRect(0,0,out.w,out.h);

  compositeTo(exportCtx, out.w, out.h, time);

  // download jpg
  const a = document.createElement("a");
  const stamp = new Date().toISOString().replace(/[:.]/g,"-");
  a.download = `veinglow_${currentPal.name}_${stamp}.jpg`
    .replace(/\s+/g,"_")
    .replace(/[^\w\-\.]/g,"");
  a.href = exportCanvas.toDataURL("image/jpeg", 0.92);
  a.click();

  ui.tip.textContent = `Saved: ${currentPal.name} • ${mode.toUpperCase()}`;
});

// ------------------- RANDOM -------------------
ui.randomBtn.addEventListener("click", ()=>{
  regenerateVeins(true);
  ui.tip.textContent = `Randomized: ${currentPal.name}`;
});

// ------------------- Camera start -------------------
async function startCamera(){
  try{
    stream = await navigator.mediaDevices.getUserMedia({
      video: {
        facingMode: "environment",
        width: { ideal: 1920 },
        height: { ideal: 1080 }
      },
      audio: false
    });

    video.srcObject = stream;
    await video.play();

    await detectTorchSupport();
    updateFlashButton();

    ui.tip.textContent = torchAvailable
      ? "Ready. Torch supported."
      : "Ready. Torch not supported (screen flash works).";

    regenerateVeins(false);
    requestAnimationFrame(tick);
  }catch(e){
    ui.tip.textContent = "Camera blocked. Use HTTPS + allow Camera in Safari.";
  }
}

// init
startCamera();
