/* ==========================================
   Weather Animation Engine  v3.0
   Dual-canvas architecture:

   #weather-canvas-bg  (z-index: 1)
     → Fog strips, haze atmosphere tint
       Drawn BEHIND all content.

   #weather-canvas-fg  (z-index: 4)
     → Clouds, rain + splash, snow + settle,
       lightning bolts, sun glow + rays,
       haze dust motes.
       Drawn ABOVE sections (z-3), below navbar (z-200).

   Result: particles appear to fall IN FRONT of glass cards,
   they stay fixed to viewport on scroll (position:fixed),
   and clouds are visible as distinct shapes above content.
========================================== */

const bgCanvas = document.getElementById("weather-canvas-bg");
const fgCanvas = document.getElementById("weather-canvas-fg");
const bgCtx    = bgCanvas?.getContext("2d");
const fgCtx    = fgCanvas?.getContext("2d");

/* ==========================================
   Shared state
========================================== */
let particles   = [];   /* rain drops / snow flakes / sun rays */
let clouds      = [];   /* puff-style cloud objects  (fg)       */
let fogLayers   = [];   /* horizontal fog strips     (bg)       */
let dustMotes   = [];   /* haze floating particles   (fg)       */
let splashes    = [];   /* rain splash pool          (fg)       */

let animId      = null;
let currentType = null;
let ltTimer     = 0;    /* lightning timer (frames)             */
let ltFlash     = 0;    /* active flash frames remaining        */

const WIND_RAD = 13 * Math.PI / 180;   /* 13° from vertical    */

/* ==========================================
   Resize — covers full viewport
========================================== */
function resizeCanvases() {
    [bgCanvas, fgCanvas].forEach(c => {
        if (!c) return;
        c.width  = window.innerWidth;
        c.height = window.innerHeight;
    });
}

window.addEventListener("resize", () => {
    resizeCanvases();
    if (currentType) buildParticles(currentType);
});

document.addEventListener("visibilitychange", () => {
    if (document.hidden) pauseAnim();
    else if (currentType && fgCtx) resumeAnim();
});

/* ==========================================
   Map OpenWeather code → animation type
========================================== */
function getType(code) {
    if (code >= 200 && code < 300) return "thunderstorm";
    if (code >= 300 && code < 400) return "drizzle";
    if (code >= 500 && code < 600) return code === 511 ? "sleet" : "rain";
    if (code >= 600 && code < 700) return "snow";
    if (code === 741)              return "fog";
    if (code >= 700 && code < 800) return "haze";
    if (code === 800)              return "clear";
    if (code <= 802)               return "partly-cloudy";
    return "cloudy";
}

/* ==========================================
   Build all particles for a given type
========================================== */
function buildParticles(type) {
    particles  = [];
    clouds     = [];
    fogLayers  = [];
    dustMotes  = [];
    splashes   = [];
    ltTimer    = 0;
    ltFlash    = 0;

    const W = fgCanvas?.width  ?? window.innerWidth;
    const H = fgCanvas?.height ?? window.innerHeight;

    switch (type) {
        case "thunderstorm":
            buildRain(230, 18, 26);
            buildClouds(8, 0.65, true);
            break;

        case "rain":
            buildRain(170, 13, 19);
            buildClouds(4, 0.50, false);
            break;

        case "drizzle":
            buildRain(90, 4, 8);
            buildClouds(3, 0.38, false);
            break;

        case "sleet":
            buildRain(130, 10, 15);
            buildClouds(4, 0.42, false);
            break;

        case "snow":
            buildSnow(120);
            break;

        case "fog":
            buildFog(12, false);   /* cool white-grey */
            break;

        case "haze":
            buildFog(6, true);     /* warm beige on bg */
            buildDustMotes(70, W, H);
            break;

        case "clear":
            buildSun(W, H);
            break;

        case "partly-cloudy":
            buildClouds(3, 0.48, false);
            break;

        case "cloudy":
            buildClouds(7, 0.60, false);
            break;
    }
}

/* ---- Builders ---- */

function buildRain(count, minSpd, maxSpd) {
    const W = fgCanvas.width, H = fgCanvas.height;
    for (let i = 0; i < count; i++) {
        particles.push({
            t: "rain",
            x: Math.random() * W * 1.5 - W * 0.25,
            y: Math.random() * H,
            s: minSpd + Math.random() * (maxSpd - minSpd),
            l: Math.random() * 22 + 8,
            w: Math.random() * 1.4 + 0.3,
            o: Math.random() * 0.55 + 0.25,
        });
    }
}

function buildSnow(count) {
    const W = fgCanvas.width, H = fgCanvas.height;
    for (let i = 0; i < count; i++) {
        particles.push({
            t:  "snow",
            x:  Math.random() * W,
            y:  Math.random() * H,
            r:  Math.random() * 3.5 + 1,
            s:  Math.random() * 1.2 + 0.3,
            wb: Math.random() * Math.PI * 2,
            ws: (Math.random() * 0.025 + 0.005) * (Math.random() < 0.5 ? 1 : -1),
            dr: Math.random() * 0.4 - 0.2,
            o:  Math.random() * 0.5 + 0.4,
            fo: false,   /* fading-out flag (settling) */
        });
    }
}

function buildFog(count, warm) {
    const W = bgCanvas.width, H = bgCanvas.height;
    for (let i = 0; i < count; i++) {
        fogLayers.push({
            y:   (H / count) * i + Math.random() * 25,
            sp:  (Math.random() * 0.3 + 0.08) * (i % 2 === 0 ? 1 : -1),
            o:   Math.random() * 0.14 + 0.06,
            h:   Math.random() * 100 + 45,
            ox:  Math.random() * W,
            warm,
        });
    }
}

function buildDustMotes(count, W, H) {
    for (let i = 0; i < count; i++) {
        dustMotes.push({
            x:  Math.random() * W,
            y:  Math.random() * H,
            r:  Math.random() * 2.5 + 0.5,
            vy: -(Math.random() * 0.5 + 0.1),
            vx: (Math.random() - 0.5) * 0.3,
            o:  Math.random() * 0.38 + 0.1,
            lf: Math.random(),
            ls: Math.random() * 0.004 + 0.001,
        });
    }
}

/* Cloud object: position, dimensions, speed, opacity, dark flag, blur amount */
function buildClouds(count, baseOp, dark) {
    const W = fgCanvas.width, H = fgCanvas.height;
    for (let i = 0; i < count; i++) {
        const w = Math.random() * 360 + 180;
        const h = Math.random() * 90  + 55;
        clouds.push({
            x:    Math.random() * W * 1.7 - W * 0.35,
            y:    Math.random() * H * 0.40 + 12,
            w, h,
            sp:   Math.random() * 0.50 + 0.10,
            o:    baseOp * (0.75 + Math.random() * 0.50),
            dark,
            blur: Math.random() * 7 + 3,   /* much less than before → defined shape */
        });
    }
}

function buildSun(W, H) {
    /* Sun sits at top-right, partially off-screen so only rays spread inward */
    const cx = W * 0.88, cy = H * 0.07;
    particles.push({ t: "sun-core", cx, cy });
    for (let i = 0; i < 14; i++) {
        particles.push({
            t:  "ray",
            cx, cy,
            a:  (i / 14) * Math.PI * 2,
            l:  Math.random() * 160 + 100,
            w:  Math.random() * 10 + 5,
            o:  Math.random() * 0.18 + 0.08,
            s:  0.0015 + Math.random() * 0.001,
        });
    }
}

/* ==========================================
   Per-particle tick functions
========================================== */

/* --- Rain --- */
function tickRain(p) {
    const sx = Math.sin(WIND_RAD), cy_ = Math.cos(WIND_RAD);

    fgCtx.beginPath();
    fgCtx.moveTo(p.x, p.y);
    fgCtx.lineTo(p.x - sx * p.l, p.y - cy_ * p.l);
    fgCtx.strokeStyle = `rgba(185,225,255,${p.o})`;
    fgCtx.lineWidth   = p.w;
    fgCtx.lineCap     = "round";
    fgCtx.stroke();

    p.x += sx  * p.s;
    p.y += cy_ * p.s;

    const W = fgCanvas.width, H = fgCanvas.height;
    if (p.y > H) {
        /* Splash at bottom of viewport */
        createSplash(p.x, H - 3);
        p.x = Math.random() * W * 1.5 - W * 0.25;
        p.y = -p.l;
    } else if (p.x > W + 60) {
        p.x = -W * 0.25;
        p.y = Math.random() * H;
    }
}

function createSplash(x, y) {
    for (let i = 0; i < 3; i++) {
        const a = Math.random() * Math.PI;   /* upper hemisphere arc */
        const s = Math.random() * 3 + 1.2;
        splashes.push({
            x, y,
            vx: Math.cos(a) * s,
            vy: -Math.sin(a) * s * 0.7,
            l:  1,
            d:  0.07 + Math.random() * 0.06,
        });
    }
}

function tickSplashes() {
    for (let i = splashes.length - 1; i >= 0; i--) {
        const s = splashes[i];
        s.x  += s.vx;
        s.y  += s.vy;
        s.vy += 0.12;   /* gravity */
        s.l  -= s.d;
        if (s.l <= 0) { splashes.splice(i, 1); continue; }
        fgCtx.beginPath();
        fgCtx.arc(s.x, s.y, 1.8, 0, Math.PI * 2);
        fgCtx.fillStyle = `rgba(180,220,255,${s.l * 0.65})`;
        fgCtx.fill();
    }
}

/* --- Snow --- */
function tickSnow(p) {
    const W = fgCanvas.width, H = fgCanvas.height;

    if (p.fo) {
        /* Settling / fading at bottom */
        p.o -= 0.022;
        if (p.o > 0) {
            drawSnowFlake(p);
        } else {
            /* Reset to top */
            p.fo = false;
            p.o  = Math.random() * 0.5 + 0.4;
            p.y  = -p.r;
            p.x  = Math.random() * W;
        }
        return;
    }

    p.wb += p.ws;
    p.x  += p.dr + Math.sin(p.wb) * 0.4;
    p.y  += p.s;

    if (p.x < 0) p.x = W;
    if (p.x > W) p.x = 0;

    if (p.y >= H - p.r) {
        p.y  = H - p.r;
        p.fo = true;
        return;
    }

    drawSnowFlake(p);
}

function drawSnowFlake(p) {
    if (p.r < 2.5) {
        /* Small — solid circle */
        fgCtx.beginPath();
        fgCtx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        fgCtx.fillStyle = `rgba(255,255,255,${p.o})`;
        fgCtx.fill();
    } else {
        /* Large — 6-point star with branch arms */
        fgCtx.save();
        fgCtx.translate(p.x, p.y);
        fgCtx.strokeStyle = `rgba(255,255,255,${p.o})`;
        fgCtx.lineWidth   = 0.9;
        for (let i = 0; i < 6; i++) {
            fgCtx.rotate(Math.PI / 3);
            fgCtx.beginPath();
            fgCtx.moveTo(0, 0);       fgCtx.lineTo(0, p.r);
            fgCtx.moveTo(0, p.r * 0.42);
            fgCtx.lineTo( p.r * 0.22, p.r * 0.62);
            fgCtx.moveTo(0, p.r * 0.42);
            fgCtx.lineTo(-p.r * 0.22, p.r * 0.62);
            fgCtx.stroke();
        }
        fgCtx.restore();
    }
}

/* --- Clouds (puff-style: 5 overlapping gradient ellipses) --- */
function tickCloud(c) {
    /*
     * Each "cloud" is built from 5 overlapping radial-gradient ellipses.
     * The blur(Xpx) filter blends adjacent bumps naturally — no seams.
     * Less blur than before (3-10px vs 30px) = more defined shape.
     */
    const col = c.dark
        ? [60, 65, 90]       /* dark storm blue-grey  */
        : [215, 230, 248];   /* light sky-white       */

    const bumps = [
        { dx:  0,             dy:  0,           r: c.h * 0.56 },
        { dx:  c.w * 0.22,   dy: -c.h * 0.18,  r: c.h * 0.64 },
        { dx: -c.w * 0.22,   dy: -c.h * 0.14,  r: c.h * 0.48 },
        { dx:  c.w * 0.42,   dy:  0,            r: c.h * 0.40 },
        { dx: -c.w * 0.42,   dy:  0,            r: c.h * 0.38 },
    ];

    fgCtx.save();
    fgCtx.filter = `blur(${c.blur}px)`;

    bumps.forEach(b => {
        const bx = c.x + b.dx, by = c.y + b.dy;
        const r  = b.r * 1.45;
        const g  = fgCtx.createRadialGradient(bx, by, 0, bx, by, r);
        g.addColorStop(0,    `rgba(${col[0]},${col[1]},${col[2]},${c.o})`);
        g.addColorStop(0.55, `rgba(${col[0]},${col[1]},${col[2]},${(c.o * 0.55).toFixed(3)})`);
        g.addColorStop(1,    `rgba(${col[0]},${col[1]},${col[2]},0)`);
        fgCtx.fillStyle = g;
        fgCtx.beginPath();
        fgCtx.ellipse(bx, by, r, b.r, 0, 0, Math.PI * 2);
        fgCtx.fill();
    });

    fgCtx.restore();

    /* Move cloud across screen, wrap around */
    c.x += c.sp;
    if (c.x - c.w > fgCanvas.width) c.x = -c.w;
}

/* --- Fog (bg canvas, cool white) --- */
function tickFog(layer) {
    const W  = bgCanvas.width;
    const ox = ((layer.ox % W) + W) % W;
    /* Fog = cool white-grey; Haze fog-part = warm beige */
    const r  = layer.warm ? [210, 190, 150] : [220, 232, 242];

    const g = bgCtx.createLinearGradient(0, layer.y, 0, layer.y + layer.h);
    g.addColorStop(0,   `rgba(${r[0]},${r[1]},${r[2]},0)`);
    g.addColorStop(0.5, `rgba(${r[0]},${r[1]},${r[2]},${layer.o})`);
    g.addColorStop(1,   `rgba(${r[0]},${r[1]},${r[2]},0)`);
    bgCtx.fillStyle = g;
    bgCtx.fillRect(ox - W, layer.y, W * 2, layer.h);
    bgCtx.fillRect(ox,     layer.y, W * 2, layer.h);

    layer.ox += layer.sp;
}

/* --- Haze (bg tint + fg dust motes) --- */
function tickHaze() {
    const W = bgCanvas.width, H = bgCanvas.height;

    /* Warm amber-yellow gradient tint on BG canvas */
    const g = bgCtx.createLinearGradient(0, 0, 0, H);
    g.addColorStop(0,    "rgba(195,165,90,0.14)");
    g.addColorStop(0.45, "rgba(195,165,90,0.07)");
    g.addColorStop(1,    "rgba(170,140,70,0.16)");
    bgCtx.fillStyle = g;
    bgCtx.fillRect(0, 0, W, H);

    /* Fog strips (warm) on BG canvas */
    fogLayers.forEach(tickFog);

    /* Dust motes floating upward on FG canvas */
    const fw = fgCanvas.width, fh = fgCanvas.height;
    dustMotes.forEach(m => {
        m.x  += m.vx;
        m.y  += m.vy;
        m.lf  = (m.lf + m.ls) % 1;

        if (m.y < -5)  { m.y = fh + 5; m.x = Math.random() * fw; }
        if (m.x < 0 || m.x > fw) m.x = Math.random() * fw;

        const alpha = Math.sin(m.lf * Math.PI) * m.o;
        if (alpha <= 0) return;

        fgCtx.beginPath();
        fgCtx.arc(m.x, m.y, m.r, 0, Math.PI * 2);
        fgCtx.fillStyle = `rgba(215,185,115,${alpha.toFixed(3)})`;
        fgCtx.fill();
    });
}

/* --- Sun (bright glow + rotating rays) --- */
function tickSun() {
    const core = particles.find(p => p.t === "sun-core");
    if (!core) return;

    /* Bright radial glow at sun position */
    const glow = fgCtx.createRadialGradient(core.cx, core.cy, 0, core.cx, core.cy, 80);
    glow.addColorStop(0,   "rgba(255,248,185,0.80)");
    glow.addColorStop(0.3, "rgba(255,225,100,0.40)");
    glow.addColorStop(0.7, "rgba(255,200,60,0.12)");
    glow.addColorStop(1,   "rgba(255,200,60,0)");
    fgCtx.fillStyle = glow;
    fgCtx.beginPath();
    fgCtx.arc(core.cx, core.cy, 80, 0, Math.PI * 2);
    fgCtx.fill();

    /* Rotating rays emanating from glow */
    particles.filter(p => p.t === "ray").forEach(p => {
        p.a += p.s;

        const x1 = p.cx + Math.cos(p.a) * 72;
        const y1 = p.cy + Math.sin(p.a) * 72;
        const x2 = p.cx + Math.cos(p.a) * (72 + p.l);
        const y2 = p.cy + Math.sin(p.a) * (72 + p.l);

        const rg = fgCtx.createLinearGradient(x1, y1, x2, y2);
        rg.addColorStop(0,   `rgba(255,240,120,0)`);
        rg.addColorStop(0.15,`rgba(255,235,110,${p.o})`);
        rg.addColorStop(0.7, `rgba(255,225,90,${(p.o * 0.55).toFixed(3)})`);
        rg.addColorStop(1,   `rgba(255,215,70,0)`);

        fgCtx.beginPath();
        fgCtx.moveTo(x1, y1);
        fgCtx.lineTo(x2, y2);
        fgCtx.strokeStyle = rg;
        fgCtx.lineWidth   = p.w;
        fgCtx.lineCap     = "round";
        fgCtx.stroke();
    });
}

/* --- Lightning --- */
function tickLightning() {
    ltTimer++;

    /* Fire every 25-65 frames = 0.4–1.1 seconds at 60fps */
    if (ltTimer > 25 + Math.random() * 40) {
        ltFlash  = 12 + Math.floor(Math.random() * 6);
        ltTimer  = 0;
        if (Math.random() > 0.08) drawBolt();   /* 92% chance of bolt */
    }

    /* Full-screen flash overlay — clearly visible above all content */
    if (ltFlash > 0) {
        fgCtx.fillStyle = `rgba(255,255,235,${(ltFlash * 0.025).toFixed(3)})`;
        fgCtx.fillRect(0, 0, fgCanvas.width, fgCanvas.height);
        ltFlash--;
    }
}

function drawBolt() {
    const W  = fgCanvas.width, H = fgCanvas.height;
    const sx = Math.random() * W * 0.6 + W * 0.2;

    fgCtx.save();
    fgCtx.strokeStyle = "rgba(255,255,245,1)";
    fgCtx.lineWidth   = 3.5;
    fgCtx.shadowColor = "rgba(170,210,255,1)";
    fgCtx.shadowBlur  = 45;    /* strong electric glow */
    fgCtx.lineCap     = "round";
    fgCtx.lineJoin    = "round";
    fgCtx.beginPath();
    fgCtx.moveTo(sx, 0);

    let x = sx, y = 0;
    const segs = 8 + Math.floor(Math.random() * 5);

    for (let i = 0; i < segs; i++) {
        x += (Math.random() - 0.5) * 80;
        y += H / segs;
        fgCtx.lineTo(x, y);

        /* Random fork branches */
        if (Math.random() > 0.50 && i > 1) {
            fgCtx.save();
            fgCtx.lineWidth  = 1.8;
            fgCtx.shadowBlur = 24;
            fgCtx.beginPath();
            fgCtx.moveTo(x, y);
            fgCtx.lineTo(
                x + (Math.random() - 0.5) * 110,
                y + 55 + Math.random() * 90
            );
            fgCtx.stroke();
            fgCtx.restore();
            fgCtx.beginPath();
            fgCtx.moveTo(x, y);
        }
    }
    fgCtx.stroke();
    fgCtx.restore();
}

/* ==========================================
   Main Animation Loop
========================================== */
function animate() {
    if (!bgCtx || !fgCtx || !currentType) return;

    bgCtx.clearRect(0, 0, bgCanvas.width, bgCanvas.height);
    fgCtx.clearRect(0, 0, fgCanvas.width, fgCanvas.height);

    switch (currentType) {

        case "thunderstorm":
            /* Clouds first (fg), then rain on top (fg), then lightning (fg) */
            clouds.forEach(tickCloud);
            particles.forEach(tickRain);
            tickSplashes();
            tickLightning();
            break;

        case "rain":
        case "drizzle":
        case "sleet":
            clouds.forEach(tickCloud);
            particles.forEach(tickRain);
            tickSplashes();
            break;

        case "snow":
            particles.forEach(tickSnow);
            break;

        case "fog":
            /* Dense cool fog strips on bg canvas */
            fogLayers.forEach(tickFog);
            break;

        case "haze":
            /* Warm tint + sparse warm fog on bg; dust motes on fg */
            tickHaze();
            break;

        case "clear":
            tickSun();
            break;

        case "partly-cloudy":
        case "cloudy":
            clouds.forEach(tickCloud);
            break;
    }

    animId = requestAnimationFrame(animate);
}

function pauseAnim() {
    if (animId) { cancelAnimationFrame(animId); animId = null; }
}

function resumeAnim() {
    if (!animId && fgCtx) animate();
}

function stopAnim() {
    pauseAnim();
    bgCtx?.clearRect(0, 0, bgCanvas.width, bgCanvas.height);
    fgCtx?.clearRect(0, 0, fgCanvas.width, fgCanvas.height);
    currentType = null;
}

/* ==========================================
   Public API
========================================== */
export function setWeatherAnimation(code) {
    const type = getType(code);
    if (type === currentType) return;

    stopAnim();
    currentType = type;

    if (!bgCtx || !fgCtx) return;

    /* Size both canvases to viewport */
    resizeCanvases();

    buildParticles(type);
    animate();
}
