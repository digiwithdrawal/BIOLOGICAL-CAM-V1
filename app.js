// app.js — VeinGlow Cam (photo-only)
// Live camera + veiny overlay + white traveling glow runner.
// No sliders. Random changes everything. 40 palettes. Auto/manual ratios. Flash toggle.
// Hide -> Show: hides everything except SNAP (and a small SHOW button next to it).

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
  { name:"VIOLET ICE", a:"#a78bfa", b:"#67e8f9", c:"#f472b6", bg:"#060611" },
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

// ------------------- HUD hide/show -------------------
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

// ------------------- Vein system generation -------------------
const veinCanvas = document.createElement("canvas");
const veinCtx = veinCanvas.getContext("2d", { willReadFrequently: true });

let veins = []; // array of polylines: [{pts:[{x,y}...], w}]
let runner = { lineIndex:0, t:0, speed:0.22 };
let params = {
  density: 22,     // number of main branches
  thickness: 1.9,  // base thickness in px (normalized later)
  jitter: 0.030,
  wander: 0.035,
  detail: 7,       // subdivision steps
  scale: 1.0,
  glowStrength: 1.0,
  overlayAlpha: 0.82, // veins-forward double exposure
  blend: "screen", // overlay style
};

function genPolyline(seedX, seedY, dirX, dirY, steps){
  let x = seedX, y = seedY;
  let dx = dirX, dy = dirY;
  const pts = [{x,y}];

  for (let i=0;i<steps;i++){
    // gentle direction wander
    const ang = (Math.random()-0.5) * params.wander * Math.PI * 2;
    const ca = Math.cos(ang), sa = Math.sin(ang);
    const ndx = dx*ca - dy*sa;
    const ndy = dx*sa + dy*ca;
    dx = ndx; dy = ndy;

    // move forward with slight jitter
    const step = rand(0.035, 0.070);
    x += dx*step + (Math.random()-0.5)*params.jitter;
    y += dy*step + (Math.random()-0.5)*params.jitter;

    // keep inside bounds by nudging toward center
    const cx = 0.5 - x;
    const cy = 0.5 - y;
    const pull = 0.02;
    dx += cx*pull;
    dy += cy*pull;

    // normalize direction
    const m = Math.hypot(dx,dy) || 1;
    dx /= m; dy /= m;

    // clamp in [0..1] softly
    x = clamp(x, 0.02, 0.98);
    y = clamp(y, 0.02, 0.98);

    pts.push({x,y});

    // occasional micro-branching (organic)
    if (i > 2 && i < steps-2 && Math.random() < 0.14){
      const bAng = (Math.random()<0.5 ? -1 : 1) * rand(0.35, 0.95);
      const bdx = dx*Math.cos(bAng) - dy*Math.sin(bAng);
      const bdy = dx*Math.sin(bAng) + dy*Math.cos(bAng);
      const branchSteps = Math.floor(steps * rand(0.25, 0.55));
      const branch = genPolyline(x, y, bdx, bdy, branchSteps);
      // thinner branch
      branch.w *= rand(0.45, 0.70);
      veins.push(branch);
    }
  }

  return { pts, w: rand(0.9, 1.25) };
}

function regenerateVeins(forcePaletteChange=true){
  // Randomize everything
  if (forcePaletteChange){
    currentPal = pick(PALETTES);
    ui.palName.textContent = currentPal.name;
  }

  params.density = Math.floor(rand(14, 42));          // amount of veins
  params.thickness = rand(1.2, 3.1);                 // thickness
  params.jitter = rand(0.010, 0.050);
  params.wander = rand(0.018, 0.050);
  params.detail = Math.floor(rand(6, 10));
  params.scale = rand(0.85, 1.18);
  params.glowStrength = rand(0.9, 1.45);
  params.overlayAlpha = rand(0.78, 0.90);
  params.blend = pick(["screen","lighter","overlay"]); // believable double exposure styles

  veins = [];

  // Generate main branches from random edge points toward center
  for (let i=0;i<params.density;i++){
    const side = (Math.random()*4)|0;
    let x,y, dx,dy;
    if (side===0){ x = rand(0.05,0.95); y = 0.02; dx = rand(-0.2,0.2); dy = 1; }
    if (side===1){ x = rand(0.05,0.95); y = 0.98; dx = rand(-0.2,0.2); dy = -1; }
    if (side===2){ x = 0.02; y = rand(0.05,0.95); dx = 1; dy = rand(-0.2,0.2); }
    if (side===3){ x = 0.98; y = rand(0.05,0.95); dx = -1; dy = rand(-0.2,0.2); }

    const steps = Math.floor(rand(10, 18)) + params.detail;
    const m = Math.hypot(dx,dy) || 1; dx/=m; dy/=m;

    const line = genPolyline(x,y,dx,dy,steps);
    line.w *= rand(0.8, 1.3);
    veins.push(line);
  }

  // runner path: pick a longer line
  let best = 0, bestLen = 0;
  for (let i=0;i<veins.length;i++){
    const L = veins[i].pts.length;
    if (L > bestLen){ bestLen = L; best = i; }
  }
  runner.lineIndex = best;
  runner.t = Math.random();
  runner.speed = rand(0.10, 0.38); // speed of glow travel
}

// ------------------- Drawing helpers -------------------
function fitCanvas(){
  const { vw, vh } = viewportSize();
  const dpr = Math.min(2, window.devicePixelRatio || 1);
  view.width = Math.floor(vw * dpr);
  view.height = Math.floor(vh * dpr);
}
fitCanvas();
window.addEventListener("resize", fitCanvas);
window.visualViewport?.addEventListener("resize", fitCanvas);

function ensureVeinCanvas(){
  // Render veins at a lower resolution for speed, then upscale
  const w = Math.max(420, Math.floor(view.width / 2));
  const h = Math.max(420, Math.floor(view.height / 2));
  if (veinCanvas.width !== w || veinCanvas.height !== h){
    veinCanvas.width = w;
    veinCanvas.height = h;
  }
}

function drawVideoTo(ctx, dstW, dstH){
  if (!video.videoWidth || !video.videoHeight) return;

  const mode = chosenMode();
  const vw = video.videoWidth;
  const vh = video.videoHeight;
  const { cx, cy, cropW, cropH } = computeCropRect(vw, vh, mode);

  ctx.imageSmoothingEnabled = true;
  ctx.drawImage(video, cx, cy, cropW, cropH, 0, 0, dstW, dstH);
}

function hexToRgb(hex){
  const h = hex.replace("#","");
  const n = parseInt(h.length===3 ? h.split("").map(x=>x+x).join("") : h, 16);
  return { r:(n>>16)&255, g:(n>>8)&255, b:n&255 };
}
function mix(a,b,t){
  return {
    r: Math.round(lerp(a.r,b.r,t)),
    g: Math.round(lerp(a.g,b.g,t)),
    b: Math.round(lerp(a.b,b.b,t)),
  };
}
function rgbStr(c, a=1){
  return `rgba(${c.r},${c.g},${c.b},${a})`;
}

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
  // t in [0..1]
  const total = polyLength(pts);
  let target = total * clamp(t,0,1);
  for (let i=1;i<pts.length;i++){
    const a = pts[i-1], b = pts[i];
    const seg = Math.hypot(b.x-a.x, b.y-a.y);
    if (target <= seg){
      const u = seg ? (target/seg) : 0;
      return { x: lerp(a.x,b.x,u), y: lerp(a.y,b.y,u), i };
    }
    target -= seg;
  }
  return { x: pts[pts.length-1].x, y: pts[pts.length-1].y, i: pts.length-1 };
}

function drawVeins(){
  ensureVeinCanvas();
  const w = veinCanvas.width, h = veinCanvas.height;
  veinCtx.clearRect(0,0,w,h);

  // subtle background tint layer (helps double exposure feel)
  const bg = hexToRgb(currentPal.bg);
  veinCtx.fillStyle = rgbStr(bg, 0.06);
  veinCtx.fillRect(0,0,w,h);

  // choose vein colors per palette (veins use palette; runner always white)
  const ca = hexToRgb(currentPal.a);
  const cb = hexToRgb(currentPal.b);
  const cc = hexToRgb(currentPal.c);

  // draw base veins
  veinCtx.save();
  veinCtx.globalCompositeOperation = "source-over";
  veinCtx.lineCap = "round";
  veinCtx.lineJoin = "round";

  const baseW = params.thickness * (w/720) * params.scale;

  for (let k=0;k<veins.length;k++){
    const line = veins[k];
    const pts = line.pts;

    // alternate colors to create more “alive” branching
    const tcol = (k % 3) / 2; // 0, .5, 1
    const col = tcol===0 ? ca : (tcol===0.5 ? cb : cc);

    // multi-pass for glow/bloom
    // outer glow
    veinCtx.strokeStyle = rgbStr(col, 0.18 * params.glowStrength);
    veinCtx.lineWidth = baseW * line.w * 3.8;
    veinCtx.beginPath();
    veinCtx.moveTo(pts[0].x*w, pts[0].y*h);
    for (let i=1;i<pts.length;i++) veinCtx.lineTo(pts[i].x*w, pts[i].y*h);
    veinCtx.stroke();

    // mid glow
    veinCtx.strokeStyle = rgbStr(col, 0.28 * params.glowStrength);
    veinCtx.lineWidth = baseW * line.w * 2.2;
    veinCtx.beginPath();
    veinCtx.moveTo(pts[0].x*w, pts[0].y*h);
    for (let i=1;i<pts.length;i++) veinCtx.lineTo(pts[i].x*w, pts[i].y*h);
    veinCtx.stroke();

    // core vein
    veinCtx.strokeStyle = rgbStr(col, 0.65);
    veinCtx.lineWidth = baseW * line.w * 1.0;
    veinCtx.beginPath();
    veinCtx.moveTo(pts[0].x*w, pts[0].y*h);
    for (let i=1;i<pts.length;i++) veinCtx.lineTo(pts[i].x*w, pts[i].y*h);
    veinCtx.stroke();
  }

  veinCtx.restore();

  // draw the WHITE traveling runner pulse on one line
  const idx = clamp(runner.lineIndex, 0, veins.length-1);
  const pts = veins[idx]?.pts;
  if (pts && pts.length > 2){
    // move runner forward
    runner.t += (runner.speed / 60);
    if (runner.t > 1.0){
      runner.t = runner.t - 1.0;
      runner.lineIndex = (Math.random() < 0.6) ? ((Math.random()*veins.length)|0) : runner.lineIndex;
      runner.speed = rand(0.10, 0.38);
    }

    const head = pointAlong(pts, runner.t);
    const tailT = clamp(runner.t - 0.12, 0, 1);
    const tail = pointAlong(pts, tailT);

    // draw runner segment (tail->head) with soft white bloom
    veinCtx.save();
    veinCtx.globalCompositeOperation = "lighter";
    veinCtx.lineCap = "round";
    veinCtx.lineJoin = "round";

    // multiple passes = bloom
    const coreW = baseW * 1.3;
    const glowW1 = coreW * 4.2;
    const glowW2 = coreW * 2.6;

    // outer glow
    veinCtx.strokeStyle = "rgba(255,255,255,0.14)";
    veinCtx.lineWidth = glowW1;
    veinCtx.beginPath();
    veinCtx.moveTo(tail.x*w, tail.y*h);
    veinCtx.lineTo(head.x*w, head.y*h);
    veinCtx.stroke();

    // inner glow
    veinCtx.strokeStyle = "rgba(255,255,255,0.26)";
    veinCtx.lineWidth = glowW2;
    veinCtx.beginPath();
    veinCtx.moveTo(tail.x*w, tail.y*h);
    veinCtx.lineTo(head.x*w, head.y*h);
    veinCtx.stroke();

    // core
    veinCtx.strokeStyle = "rgba(255,255,255,0.95)";
    veinCtx.lineWidth = coreW;
    veinCtx.beginPath();
    veinCtx.moveTo(tail.x*w, tail.y*h);
    veinCtx.lineTo(head.x*w, head.y*h);
    veinCtx.stroke();

    // hot “head”
    veinCtx.fillStyle = "rgba(255,255,255,0.9)";
    veinCtx.beginPath();
    veinCtx.arc(head.x*w, head.y*h, coreW*1.05, 0, Math.PI*2);
    veinCtx.fill();

    veinCtx.restore();
  }
}

// ------------------- Composition (live view) -------------------
function fitExportAndComposite(ctx, outW, outH){
  // draw camera
  drawVideoTo(ctx, outW, outH);

  // overlay veins (double exposure style)
  ctx.save();
  ctx.globalAlpha = params.overlayAlpha;
  ctx.globalCompositeOperation = params.blend;

  // scale vein canvas to output
  ctx.drawImage(veinCanvas, 0, 0, outW, outH);

  // add a second faint pass for “exposure” feel
  ctx.globalAlpha = params.overlayAlpha * 0.35;
  ctx.globalCompositeOperation = "lighter";
  ctx.drawImage(veinCanvas, 0, 0, outW, outH);

  ctx.restore();
}

function tick(){
  if (!video.videoWidth || !video.videoHeight){
    requestAnimationFrame(tick);
    return;
  }

  // update veins animation
  drawVeins();

  // draw composed live view
  vctx.setTransform(1,0,0,1,0,0);
  vctx.clearRect(0,0,view.width,view.height);

  // background tint (palette bg)
  const bg = hexToRgb(currentPal.bg);
  vctx.fillStyle = rgbStr(bg, 1);
  vctx.fillRect(0,0,view.width,view.height);

  fitExportAndComposite(vctx, view.width, view.height);

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

  // Ensure vein canvas exists; draw one more frame so snap matches view
  ensureVeinCanvas();
  drawVeins();

  // composite into export size
  exportCtx.setTransform(1,0,0,1,0,0);
  exportCtx.clearRect(0,0,out.w,out.h);

  // background
  const bg = hexToRgb(currentPal.bg);
  exportCtx.fillStyle = rgbStr(bg, 1);
  exportCtx.fillRect(0,0,out.w,out.h);

  fitExportAndComposite(exportCtx, out.w, out.h);

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

    // initial seed
    regenerateVeins(false);
    tick();
  }catch(e){
    ui.tip.textContent = "Camera blocked. Use HTTPS + allow Camera in Safari.";
  }
}

// init
startCamera();

