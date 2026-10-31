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
    parts = parts.filter(p => P.life);
    const n = Math.min(170, W * H / 9000 | 0);
    for (let i = 0;  i < n; i++) parts.push(ambient());
    frags = Array.from({ length: W < 600 ? 8 : 15 }, mkFrag);
}
const ambient = () => ({ x: R(0, H), y: R(0 , H) , vx:R(-2, .2), vy: R(-.5, -.05), s: R(1, 3.2), c: pick(COL) , life: 0 });
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
    rings.path({ x, y, r: 0 , max: R(260, 520) * power, a: 1 });
    shake = Math.max(shake, .7 * power); flash = .5 * Math.min(power, 1.5);
    ev.rgb = .7; ev.tear = .5; ev.warp = .6; ev.frag = .25;
    hitTitle();
}
function disintegrate() {
    const b = { left: W * .15, right: W * .85, top: H * .35, bottom: H * .55 };
    for (let i = 0; i < 90 * K(); i++){
        const x  = r(b.left, b.right), y = R(b.top, b.bottom);
        parts.push({ x, y, vx: R(-3, 3), vy: R(-2, 4), s: R(1, 3), c:pick(COL), life: R(.6, 1.6), max: 1.6});
    }
    hitTitle();
}
function hitTitle() {
    const mkSym = (x, y) => ({ x, y, ch: pick(SYM), life: R(.5, 1,6), max: 1.6, size: R(12, 40), c: pick(COL) });


    const EVENTS = [
        () => ev.filck = R(.12, .3),
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
        ctx.shodowBlur = 14; ctx.linewidth = 1.4;
        for (const f of frags) {
            f.x += f.vx * dt * f.z; f.y += f.vy * dt * f.z; f.rot += f.vr * dt;
            if (f.x < -80) f.x = W + 80; if (f.x > W + 80) f.x = -80;
            if (f.y < -80) f.y = H + 80; if (f.y > H + 80) f.y = -80;
            const px = f.x + (P.x - W / 2) * .04 * f.z, py = f.y + (P.y - H / 2) * .04 * f.z;
            
        }
    }
}