'use strict';

const $ = s => document.querySelector(s);
const cv = $('#c'), ctx = cv.getContext('2d');
const COL = ['#ff1744', '#2979ff', '#b400ff', '#00f0ff'];
const SYM = '01ΔΣΞЖ¤░▒▓◢◣◤◥<>/\\{}[]#$%&*+=:;|';
const LV = { LOW: .5, MEDIUM: 1, EXTREME: 2 };
const R = (a, b) => a + Math.random() * (b - a);
const pick = a => a[Math.random() * a.length | 0];

let W, H, level = 'MEDIUM' , auto = true, last = 0, t = 0, nextEv = 2, shake = 0, flash = 0, hold = 0;
let parts = [], frags = [],syms = [], rings = [] , ev = {};
const P = { x: -999, y: -999, v: 0, down: false };
const noiseC = document.createElement('canvas'); noiseC.width = 96; noiseC.height = 54;
const nctx = noiseC.getContext('2d');
const fr = $('#fr'), fb = $('#fb'), dm = $('#dm'), tb = $('#tb');
const K = () => LV[level];


function resize() {
    W = cv.width = innerWidth; H = cv.height = innerHeight;
    parts = parts.filter(p => p.life);
    const n = Math.min(170, W * H / 9000 | 0);
    for (let i = 0;  i < n; i++) parts.push(ambient());
    frags = Array.from({ length: W < 600 ? 8 : 15 }, mkFrag);
}
const ambient = () => ({ x: R(0, W), y: R(0 , H) , vx:R(-.2, .2), vy: R(-.5, -.05), s: R(1, 3.2), c: pick(COL) , life: 0 });
function mkFrag() {
    return { x: R(0, W), y: R(0, H), r: R(14, 70), n: 3 + (Math.random() * 3 | 0), rot: R(0, 6.28), vr: R(-.6, .6), 
        vx : R(-12, 12), vy: R(-12, 12), z: R(.2, 1), c: pick(COL) };
}


function explode(x, y, power = 1) {
    const n = Math.min(260,70 * power * K() | 0);
    for (let  i= 0; i < n; i++) {
        const a = R(0, 6.28), v = R(40, 420) * power;
        parts.push({ x, y, vx : Math.cos(a) * v / 60, vy: Math.sin(a) * v / 60, s: R(1, 4), c: pick(COL), life: R(.8, 2.2), max: 2.2 });
    }
    for (let i = 0 ; i < 8 * K() ; i++) syms.push(mkSym(x + R(-90, 90), y + R(-90, 90)));
    rings.push({ x, y, r: 0 , max: R(260, 520) * power, a: 1 });
    shake = Math.max(shake, .7 * power); flash = .5 * Math.min(power, 1.5);
    ev.rgb = .7; ev.tear = .5; ev.warp = .6; ev.frag = .25;
    hitTitle();
}
function disintegrate() {
    const b = { left: W * .15, right: W * .85, top: H * .35, bottom: H * .55 };
    for (let i = 0; i < 90 * K(); i++){
        const x  = R(b.left, b.right), y = R(b.top, b.bottom);
        parts.push({ x, y, vx: R(-3, 3), vy: R(-2, 4), s: R(1, 3), c:pick(COL), life: R(.6, 1.6), max: 1.6});
    }
    hitTitle();
}
function hitTitle() {}
    const mkSym = (x, y) => ({ x, y, ch: pick(SYM), life: R(.5, 1.6), max: 1.6, size: R(12, 40), c: pick(COL) });


    const EVENTS = [
        () => ev.flick = R(.12, .3),
        () => ev.rgb = R(.3, .8),
        () => ev.tear = R(.3, .8),
        () => ev.stat = R(.1, .3),
        () => explode(R(W * .1, W * .9), R(H * .1, H * .9), R(.35, .7)),
        () => ev.frag = R(.2, .5),
        () => ev.vhs = R(1.2, 2.2),
        () => ev.warp = R(.4, 1)
    ];
    function schedule(dt) {
        if (!auto) return;
        nextEv -= dt;
        if (nextEv > 0) return;
        nextEv = R(1.2, 4.2) /K();
        const n = Math.random() < .25 * K() ? 2 : 1;
        for (let i = 0; i < n; i++)pick(EVENTS)();
        if (Math.random() < .2) disintegrate(); 
    }


    function drawBackdrop() {

        const hz = H * .62, k = K();
        ctx.lineWidth = 1; ctx.strokeStyle = 'rgba(180,0,255,.22)'; ctx.beginPath();
        for (let i = -14; i <= 14; i++) {ctx.moveTo(W / 2 + i * 12, hz); ctx.lineTo(W / 2 + i * W * .12 + (P.x - W / 2) * .05, H); }
        for (let i = 0; i < 14; i++) {const f = ((i + t * .6) % 14) / 14, y = hz + (H - hz) * f * f; ctx.moveTo(0, y); ctx.lineTo(W, y); }
        ctx.stroke();

        ctx.globalCompositeOperation = 'lighter';
        for (let w = 0; w < 3; w++) {
            ctx.strokeStyle = ['rgba(255,23,68,.4)','rgba(41,121,255,.45)', 'rgba(0,240,255,.35)'][w];
            ctx.beginPath();
            const amp = 18 + 14 * k + (ev.rgb ? 50 : 0), by = H * (.3 + w * .17);
            for (let x = 0; x <= W; x += 10) {
                const j = (ev.tear || ev.stat) && Math.random() < .08 ? R(-30, 30) : 0 ;
                const y = by + Math.sin(x * .012 + t * (1 + w * .6) + w) * amp + Math.sin(x * .04 - t * 2) *amp * .25 + j;
                x ? ctx.lineTo(x, y) : ctx.moveTo(x, y);
            }
            ctx.stroke();
        }
    }
    function drawFrags(dt) {
        ctx.shadowBlur = 14; ctx.lineWidth = 1.4;
        for (const f of frags) {
            f.x += f.vx * dt * f.z; f.y += f.vy * dt * f.z; f.rot += f.vr * dt;
            if (f.x < -80) f.x = W + 80; if (f.x > W + 80) f.x = -80;
            if (f.y < -80) f.y = H + 80; if (f.y > H + 80) f.y = -80;
            const px = f.x + (P.x - W / 2) * .04 * f.z, py = f.y + (P.y - H / 2) * .04 * f.z;
            const d = 2 + (ev.rgb ? 14 : 0) + Math.min(P.v, 60) * .15 * f.z;
            for (let ch = 0; ch < 3; ch++) {
                ctx.strokeStyle = ctx.shadowColor = ['#ff1744' , '#00f0ff' , '#2979ff'][ch];
                ctx.beginPath();
                for (let i = 0; i <= f.n; i++) {
                    const a = f.rot + i * 6.283 / f.n;
                    const x = px +Math.cos(a) * f.r * f.z + (ch - 1) * d, y = py + Math.sin(a) * f.r * f.z;
                    i ? ctx.lineTo(x,y) : ctx.moveTo(x,y);
                }
                ctx.stroke();
            }
        }
        ctx.shadowBlur = 0;
    }
    function drawParts(dt) {
        const R2 = 150 + (P.down ? 100 : 0), k = K();
        for (let i = parts.length - 1; i >= 0; i--) {
            const p = parts[i];
            const dx = p.x - P.x, dy = p.y - P.y, d = Math.hypot(dx, dy) || 1;
           if (d < R2) {
            const f = 1 -d / R2;
            if (P.down) { p.vx += (-dx / d * 1.2 - dy / d * 1.6) * f; p.vy += (-dy / d * 1.2 + dx / d * 1.6) * f; }
            else { p.vx += dx / d * f * (.5 + P.v * .03) * k; p.vy += dy / d * f * (.5 + P.v * .03) * k; }
           }   
           p.x += p.vx * dt * 60 * .5; p.y += p.vy * dt * 60 * .5;
           p.vx *= .985; p.vy *= .985;
           if (p.life) { p.life -= dt; if (p.life <= 0) { parts.splice(i,1); continue; } ctx.globalAlpha = Math.min(1, p.life / p.max * 2); }
           else{
            if (p.x < 0) p.x = W; if (p.x > W) p.x = 0; if (p.y < 0) p.y = H; if (p.y > H) p.y = 0;
            if (Math.abs(p.vx) < .3) p.vx += R(-.02, .02);
            ctx.globalAlpha = .5 + .5 * Math.sin(t * 2 + p.x);
           }
           const sp = Math.hypot(p.vx, p.vy);
           ctx.fillStyle = '#ff1744'; ctx.fillRect(p.x - sp * .6 -1, p.y, p.s, p.s);
           ctx.fillStyle = p.c; ctx.fillRect(p.x, p.y, p.s, p.s);
           if (sp > 2) { ctx.fillStyle = '#00f0ff'; ctx.fillRect(p.x + sp * .6, p.y, p.s, p.s); }
        }
        ctx.globalAlpha = 1;
    }
    function drawSysm(dt) {
        if (Math.random() < dt * 6 * K()) syms.push(mkSym(R(0, W), R(0,H)));
        ctx.textBaseline = 'middle';
        for (let i = syms.length - 1; i >= 0; i--) {
            const s = syms[i]; s.life -= dt;
            if (s.life <= 0) { syms.splice(i, 1); continue; }
            ctx.globalAlpha = Math.min(1, s.life / s.max * 2) * (Math.random() < .1 ? .3 : 1);
            ctx.font = `${s.size | 0}px "Courier New",monospace`;
            ctx.fillStyle = '#ff1744' ; ctx.fillText(s.ch, s.x - 3, s.y);
            ctx.fillStyle = s.c; ctx.fillText(s.ch, s.x, s.y);
            if (Math.random() < .05) s.ch = pick(SYM);
        }
        ctx.globalAlpha = 1;
    }
    function drawRings(dt) {
        for (let i = rings.length - 1; i >= 0; i--) {
            const r = rings[i]; r.r += (r.max - r.r) * dt * 3.2; r.a -= dt * 1.1;
            if (r.a <= 0) {rings.splice(i, 1); continue; }
            ctx.globalAlpha = r.a; ctx.lineWidth = 2;
            [['#ff1744', -6], ['#00f0ff' , 0], ['#2979ff', 6]].forEach(([c, o]) => {
                ctx.strokeStyle = c; ctx.beginPath(); ctx.arc(r.x + o, r.y, r.r,0, 6.283); ctx.stroke();
            });
        }
        ctx.globalAlpha = 1;
    }
    function drawCursor(dt) {
        if (P.x < 0) return;
        const r = 12 + Math.min(P.v, 80) * .4 + (P.down ? 18 + Math.sin(t * 20) * 6 : 0);
        ctx.lineWidth = 1.5;
        [['#ff1744', -3], ['#00f0ff', 3], ['#b400ff', 0]].forEach(([c, o]) => {
        ctx.strokeStyle = c ; ctx.beginPath(); ctx.arc(P.x + o, P.y, r, 0, 6.283); ctx.stroke();
    });
    if (P.v > 25) for (let i = 0; i < Math.min(P.v / 8, 10); i++) {
        ctx.fillStyle = pick(COL); ctx.globalAlpha = R(.3, .9);
        ctx.fillRect(P.x + R(-60, 60), P.y + R(-40, 40), R(4, 40), R(1, 5));
    }
    ctx.globalAlpha = 1;
    if(P.down) {
        const g = ctx.createRadialGradient(P.x, P.y, 0, P.x, P.y, 160);
        g.addColorStop(0, 'rgba(180,0,255,.25)'); g.addColorStop(1, 'rgba(180,0,255,0)'); ctx.fillStyle = g; ctx.fillRect(P.x - 160, P.y -160, 320, 320);
    }

    }

    function localSplit(x, y, rad, off, n) {
        ctx.globalCompositeOperation = 'source-over';
        for (let i = 0; i< n; i++) {
            const sy = Math.max(0, Math.min(H - 12, y + R(-rad, rad))), h = R(3, 14), sx = Math.max(0, x - rad), w = Math.min(rad * 2, W - sx);
            if (w > 0) ctx.drawImage(cv, sx, sy, w, h, sx + R(-off, off), sy, w, h);
        }
    }
    function tear(amount) {
        for(let i =0; i < 6 + amount * 10; i ++) {
            const y = R(0,H), h = R(4, 50 * amount + 8);
        ctx.drawImage(cv, 0, y, W, h, R(-80, 80) * amount, y, W, h);
            }
    }
    function fragment() {
      for (let i = 0; i < 14; i++) {
        const w = R(60, W / 3) , h = R(40, H / 4), x = R(0, W - w), y = R(0, H - h);
        ctx.drawImage(cv , x, y, w, h, x + R(-70, 70), y + R(-50, 50), w,h);  
      } 
    }
    function vhs(){
        const y = (t * H * .5% (H + 120)) - 60;
        ctx.drawImage(cv, 0, y, W, 38, R(-40, 40), y, W, 38);
        ctx.fillStyle = 'rgba(255,255,255, .08)'; ctx.fillRect(0, y + 38, W, 3);
        ctx.fillStyle = 'rgba(0,240,255,.12)'; ctx.fillRect(0, y, W, 2);
    }
    function staticNoise(a) {
        const d = nctx.createImageData(96, 54);
        for (let i =0; i < d.data.length; i += 4) { const v = Math.random() * 255; d.data[i] = v; d.data[i + 1] = v * R(.3, 1); d.data[i + 2] = v; d.data[i + 3] = 255; }
        nctx.putImageData(d, 0, 0);
        ctx.globalAlpha = a; ctx.imageSmoothingEnabled = false; ctx.drawImage(noiseC, 0, 0, W, H); ctx.globalAlpha = 1;
    }
    function pixelNoise() {
        const n = 10 * K() + (ev.stat ? 80 : 0);
        for (let i = 0; i < n; i++) {ctx.fillStyle = pick(COL);ctx.fillRect(R(0, W), R(0, H), R(1, 4), R(1,4)); }
        
    }

        function frame(ms) {
            const dt = Math.min(.05, (ms - last) / 1000 || .016); last = ms; t += dt;
            const k = K();
            for (const key in ev) { ev[key] -= dt; if (ev[key] <= 0) delete ev[key];}
            schedule(dt);
            P.v *= .9;
            if (P.down) {
                hold += dt; ev.rgb = Math.max(ev.rgb || 0, .1); ev.warp = Math.max(ev.wrap || 0, .1);
                if (Math.random() < .3) parts.push({ x: P.x + R(-120, 120), y: P.y + R(-120,120), vx: 0, vy: 0, s: R(1, 3), c:pick(COL), life: 1, max:1});
            }
            else hold = 0;

            ctx.globalCompositeOperation = 'source-over';
            ctx.fillStyle = `rgba(2,2,10,${ev.rgb ? .12 : .3})`; ctx.fillRect(0, 0, W, H);
            drawBackdrop(); ctx.globalCompositeOperation = 'lighter';
            drawFrags(dt); drawParts(dt); drawSysm(dt); drawRings(dt); drawCursor(dt);
            ctx.globalCompositeOperation = 'source-over';


            if (P.x > 0 && (P.v > 4 || P.down)) localSplit(P.x, P.y, P.down ? 170 : 90 + P.v, (P.down ? 40 : 8) + P.v * .5 * k, P.down ? 10 : 4);
            if (ev.tear) tear(ev.tear * k);
            if (ev.frag) fragment();
            if (ev.vhs) vhs();
            if (ev.stat) staticNoise(.25 + ev.stat);
            if (flash > 0) {ctx.fillStyle = `rgba(200,240,255,${flash * .45})`; ctx.fillRect(0, 0, W, H); flash -= dt * 2.5; }
            if (ev.flick) { ctx.fillStyle = `rgba(${pick(['255,23,68' , '0,240,255' , '180,0,255'])},${R(.05, .22)})`; ctx.fillRect(0, 0, W, H); cv.style.opacity = R(.55, 1); }
            else if (cv.style.opacity !== '1') cv.style.opacity = 1;
            pixelNoise();


            const ch = (.8 + (ev.rgb ? 18 : 0) + Math.min(P.v, 80) * .12) * k;
            fr.setAttribute('dx', ch.toFixed(1)); fb.setAttribute('dx', (-ch).toFixed(1)); fr.setAttribute('dy', (ch * .15).toFixed(1));
            const warping = !!ev.warp;
            if (warping) {
                if (!cv.style.filter.includes('warp')) {
                    tb.setAttribute('baseFrequency', `${R(.001,.006).toFixed(4)} ${R(.01,.06).toFixed(3)}`);
                    tb.setAttribute('seed', R(1,199) | 0);
                }
                dm.setAttribute('scale', (Math.min(ev.warp, 1) * 70 * k).toFixed(0));
            }
                const f = warping ? 'url(#chroma) url(#warp)' : 'url(#chroma)';
                if (cv.style.filter !== f) cv.style.filter = f;
                shake = Math.max(0, shake - dt * 1.6);
                const sk = warping ? R(-1, 1) * ev.warp * 1.2 * k : 0, s = shake * 14;
                cv.style.transform = (shake || warping) ? `translate(${R(-s,s)}px,${R(-s,s)}px) skewX(${sk}deg) scale(${1 + shake * .02})` : '';
                requestAnimationFrame(frame);
            }


            addEventListener('pointermove', e => { 
                P.v = Math.max(P.v, Math.hypot(e.clientX - P.x, e.clientY - P.y)); if(P.x < 0) P.v = 0;
                P.x = e.clientX ; P.y = e.clientY; 
            }, { passive: true });
            addEventListener('pointerdown', e => { 
                if (e.target.closest('button')) return;
                P.x = e.clientX; P.y = e.clientY; P.down = true; explode(P.x, P.y, 1);
            });
            addEventListener('pointerup', () => P.down = false);
            addEventListener('pointercancel', () => P.down = false);
            document.addEventListener('pointerleave', () => { P.x = P.y = -999; P.down = false; });
            addEventListener('keydown',e => { if (e.code === 'Space') { e.preventDefault(); explode(R(W * .2, W * .8), R(H * .2, H *.8), 1);} });
            addEventListener('resize', resize);

            const setAuto = v => { auto = v; }, setLevel = l => {level = l; };
            addEventListener('keydown', e => {
                if (e.key === '1') setLevel('LOW'); if (e.key === '2') setLevel('MEDIUM'); if (e.key === '3') setLevel('EXTREME');
                if (e.key === 'a' || e.key === 'A') setAuto(!auto);
            });


        if (matchMedia('(prefers-reduced-motion: reduce)').matches) {
            setLevel('LOW'); setAuto(false); }
            resize();
            ev.stat = .4; ev.tear = .6; ev.rgb = .5;
            requestAnimationFrame(frame);
        
    