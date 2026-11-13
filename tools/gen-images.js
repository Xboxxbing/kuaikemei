/**
 * 批量生成站点矢量素材（产品图 / 解决方案图 / 占位图 / 背景纹理）
 * 运行：node tools/gen-images.js
 * 说明：这些是可直接替换的占位视觉，拿到实拍图后在后台「产品中心」上传覆盖即可。
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const IMG = path.join(ROOT, 'public', 'assets', 'img');
const seed = require(path.join(ROOT, 'server', 'data', 'seed.json'));

const dirs = ['product', 'solution', 'news', 'case'];
dirs.forEach((d) => fs.mkdirSync(path.join(IMG, d), { recursive: true }));

const W = 600, H = 450;

/* ---------- 色系 ---------- */
const PALETTE = {
  'BIO': { a: '#eef5ec', b: '#d7e8d3', main: '#3f7d3a', cap: '#2d5c2a', label: 'BIOBASIERT' },
  'NANO': { a: '#f1f2f4', b: '#dcdfe4', main: '#6b7076', cap: '#454a50', label: 'NANO MINERAL' },
  'RET': { a: '#f3efe9', b: '#e2d9cb', main: '#8a7255', cap: '#6b5843', label: 'RETEXTUR' },
  'H30': { a: '#fdeef0', b: '#f7d3d8', main: '#d6001c', cap: '#a80016', label: 'HYDROGENATED' },
  'H30-T': { a: '#fdeef0', b: '#f7d3d8', main: '#d6001c', cap: '#a80016', label: 'HYDROGENATED' },
  'Q10': { a: '#eef1f6', b: '#d6dde9', main: '#3d5a80', cap: '#2a4060', label: 'Q10 POLY-H' },
  'Q30': { a: '#eef1f6', b: '#d6dde9', main: '#3d5a80', cap: '#2a4060', label: 'Q30 POLY-H' },
  'Q50': { a: '#eef1f6', b: '#d6dde9', main: '#3d5a80', cap: '#2a4060', label: 'Q50 EPOXY' },
  'Q70': { a: '#eaf0f4', b: '#d3e0ea', main: '#2f6b8f', cap: '#1f4d69', label: 'Q70 POLYUREA' },
  'Q80': { a: '#f2eef6', b: '#ded5ea', main: '#63508f', cap: '#4a3a6d', label: 'Q80 SEALANT' },
  'PU-400': { a: '#eaf0f4', b: '#d3e0ea', main: '#2f6b8f', cap: '#1f4d69', label: 'POLYURETHANE' },
  'NIT-400': { a: '#f3efe9', b: '#e2d9cb', main: '#8a7255', cap: '#6b5843', label: 'EPOXY PLASTIC' },
};
const DEF = { a: '#f4f5f7', b: '#e2e5e9', main: '#7b8189', cap: '#5b6169', label: 'quick-mix' };

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

function svgWrap(inner, bgTop, bgBottom) {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="${bgTop}"/><stop offset="1" stop-color="${bgBottom}"/>
    </linearGradient>
    <linearGradient id="gloss" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0" stop-color="#fff" stop-opacity=".55"/><stop offset=".45" stop-color="#fff" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity=".08"/>
    </linearGradient>
    <filter id="sh" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="0" dy="10" stdDeviation="12" flood-color="#000" flood-opacity=".16"/>
    </filter>
  </defs>
  <rect width="${W}" height="${H}" fill="url(#bg)"/>
  <circle cx="520" cy="70" r="120" fill="#fff" opacity=".28"/>
  <circle cx="70" cy="400" r="90" fill="#fff" opacity=".22"/>
  ${inner}
</svg>`;
}

/* 支装胶瓶（400ml 双组份） */
function tube(p, c) {
  return `
  <g filter="url(#sh)" transform="translate(300 250)">
    <rect x="-96" y="-140" width="192" height="280" rx="16" fill="${c.main}"/>
    <rect x="-96" y="-140" width="192" height="280" rx="16" fill="url(#gloss)"/>
    <rect x="-96" y="-140" width="192" height="86" rx="16" fill="${c.cap}"/>
    <rect x="-96" y="-72" width="192" height="18" fill="#fff" opacity=".85"/>
    <text x="0" y="-92" text-anchor="middle" font-family="Arial,Helvetica,sans-serif" font-size="19" font-weight="bold" fill="#fff" letter-spacing="1">quick-mix</text>
    <rect x="-58" y="-20" width="116" height="76" rx="6" fill="#fff" opacity=".93"/>
    <text x="0" y="16" text-anchor="middle" font-family="Arial,Helvetica,sans-serif" font-size="30" font-weight="bold" fill="${c.cap}">${esc(p.model)}</text>
    <text x="0" y="42" text-anchor="middle" font-family="Arial,Helvetica,sans-serif" font-size="13" fill="#8a8f96">${esc(p.spec)}</text>
    <rect x="-58" y="70" width="116" height="52" rx="6" fill="#fff" opacity=".55"/>
    <text x="0" y="102" text-anchor="middle" font-family="Arial,Helvetica,sans-serif" font-size="12" fill="${c.cap}">${esc(c.label)}</text>
    <path d="M-30 -140 L30 -140 L18 -190 L-18 -190 Z" fill="${c.cap}"/>
    <rect x="-18" y="-216" width="36" height="28" rx="6" fill="#cfd3d8"/>
    <rect x="-9" y="-244" width="18" height="30" fill="#b9bec4"/>
  </g>
  <text x="300" y="418" text-anchor="middle" font-family="Arial,Helvetica,sans-serif" font-size="14" fill="#6d7278">${esc(p.name)}</text>`;
}

/* 桶装（3kg / 5kg） */
function pail(p, c) {
  return `
  <g filter="url(#sh)" transform="translate(300 245)">
    <path d="M-118 -110 L118 -110 L100 130 L-100 130 Z" fill="${c.main}"/>
    <path d="M-118 -110 L118 -110 L100 130 L-100 130 Z" fill="url(#gloss)"/>
    <ellipse cx="0" cy="-110" rx="118" ry="30" fill="${c.cap}"/>
    <ellipse cx="0" cy="-110" rx="118" ry="30" fill="url(#gloss)"/>
    <ellipse cx="0" cy="-112" rx="94" ry="22" fill="${c.main}" opacity=".55"/>
    <path d="M-118 -100 Q0 40 100 -100" fill="none" stroke="#fff" stroke-opacity=".5" stroke-width="6"/>
    <rect x="-72" y="-36" width="144" height="96" rx="8" fill="#fff" opacity=".94"/>
    <text x="0" y="4" text-anchor="middle" font-family="Arial,Helvetica,sans-serif" font-size="30" font-weight="bold" fill="${c.cap}">${esc(p.model)}</text>
    <text x="0" y="30" text-anchor="middle" font-family="Arial,Helvetica,sans-serif" font-size="13" fill="#8a8f96">${esc(p.spec)}</text>
    <text x="0" y="52" text-anchor="middle" font-family="Arial,Helvetica,sans-serif" font-size="11" fill="${c.cap}">${esc(c.label)}</text>
  </g>
  <text x="300" y="418" text-anchor="middle" font-family="Arial,Helvetica,sans-serif" font-size="14" fill="#6d7278">${esc(p.name)}</text>`;
}

/* 袋装（25kg / 20kg） */
function bag(p, c) {
  return `
  <g filter="url(#sh)" transform="translate(300 245)">
    <rect x="-118" y="-112" width="236" height="248" rx="8" fill="${c.main}"/>
    <rect x="-118" y="-112" width="236" height="248" rx="8" fill="url(#gloss)"/>
    <rect x="-118" y="-112" width="236" height="26" fill="${c.cap}"/>
    <rect x="-118" y="106" width="236" height="30" fill="${c.cap}"/>
    <rect x="-76" y="-40" width="152" height="112" rx="6" fill="#fff" opacity=".94"/>
    <text x="0" y="0" text-anchor="middle" font-family="Arial,Helvetica,sans-serif" font-size="28" font-weight="bold" fill="${c.cap}">${esc(p.model)}</text>
    <text x="0" y="28" text-anchor="middle" font-family="Arial,Helvetica,sans-serif" font-size="13" fill="#8a8f96">${esc(p.spec)}</text>
    <text x="0" y="54" text-anchor="middle" font-family="Arial,Helvetica,sans-serif" font-size="11" fill="${c.cap}">${esc(c.label)}</text>
  </g>
  <text x="300" y="418" text-anchor="middle" font-family="Arial,Helvetica,sans-serif" font-size="14" fill="#6d7278">${esc(p.name)}</text>`;
}

let count = 0;
for (const p of seed.products) {
  const c = PALETTE[p.model] || DEF;
  const isTube = /支/.test(p.spec || '');
  const isBag = /袋/.test(p.spec || '');
  const inner = isTube ? tube(p, c) : isBag ? bag(p, c) : pail(p, c);
  fs.writeFileSync(path.join(IMG, 'product', p.img), svgWrap(inner, c.a, c.b));
  count++;
}

/* ---------- 解决方案图 ---------- */
const SOL_STYLE = {
  's-kitchen.svg': ['#eef1f6', '#dbe2ec', '厨卫防水', '#3d5a80'],
  's-pool.svg': ['#e7f2f6', '#cfe6ee', '泳池防水', '#1f7a8c'],
  's-garage.svg': ['#f0f0f2', '#dcdfe4', '车库地下室', '#6b7076'],
  's-wall.svg': ['#f4f1ec', '#e6ded2', '内墙腻子', '#9a7b52'],
  's-renovation.svg': ['#f2eef6', '#e0d7ee', '旧墙翻新', '#63508f'],
  's-deco.svg': ['#f3efe9', '#e2d9cb', '装饰砂浆', '#8a7255'],
  's-floor.svg': ['#eef0ec', '#dbe0d3', '地坪系统', '#5b7042'],
  's-gfloor.svg': ['#eceef1', '#d6dbe2', '车库地坪', '#4d5765'],
  's-etics.svg': ['#eef1f6', '#d9e1ec', '外墙外保温', '#3d5a80'],
  's-facade.svg': ['#f3efe9', '#e2d9cb', '外墙装饰砂浆', '#8a7255'],
  's-roof.svg': ['#eaf0f4', '#d3e0ea', '屋面防水', '#2f6b8f'],
  's-indfloor.svg': ['#eceef1', '#d6dbe2', '工业地坪', '#4d5765'],
  's-precast.svg': ['#f2f0ec', '#e0dbd0', '装配式配套', '#7d7358'],
  's-anti.svg': ['#eef5ec', '#d7e8d3', '抗菌自洁', '#3f7d3a'],
};
function scene(txt, color) {
  return `
  <g opacity=".95">
    <rect x="60" y="90" width="220" height="270" fill="#fff" opacity=".55"/>
    <rect x="330" y="140" width="210" height="220" fill="#fff" opacity=".38"/>
    <rect x="60" y="300" width="480" height="60" fill="${color}" opacity=".22"/>
    <g stroke="${color}" stroke-opacity=".55" stroke-width="2" fill="none">
      <path d="M60 200 H280 M60 240 H280 M60 280 H280"/>
      <path d="M330 200 H540 M330 250 H540 M330 300 H540"/>
    </g>
    <rect x="60" y="86" width="480" height="6" fill="${color}"/>
  </g>
  <text x="300" y="392" text-anchor="middle" font-family="Arial,Helvetica,sans-serif" font-size="22" font-weight="bold" fill="${color}">${esc(txt)}</text>`;
}
for (const [file, [a, b, txt, color]] of Object.entries(SOL_STYLE)) {
  fs.writeFileSync(path.join(IMG, 'solution', file), svgWrap(scene(txt, color), a, b));
  count++;
}

/* ---------- 新闻 / 案例 / 占位 / 背景 ---------- */
const NEWS_STYLE = {
  'news-2026.svg': ['#fdeef0', '#f7d3d8', '2026 美缝系统战略发布', '#d6001c'],
  'news-shenyang.svg': ['#eef1f6', '#d6dde9', '沈阳新品发布会', '#3d5a80'],
  'news-qseries.svg': ['#eef1f6', '#d6dde9', '全屋美缝系统上市', '#3d5a80'],
  'news-ai200c.svg': ['#eef5ec', '#d7e8d3', 'AI 200C 净味内墙漆', '#3f7d3a'],
  'news-history.svg': ['#f3efe9', '#e2d9cb', '百年西伟德', '#8a7255'],
  'case-taicang.svg': ['#eef5ec', '#d7e8d3', '太仓被动房项目', '#3f7d3a'],
  'case-demo1.svg': ['#eceef1', '#d6dbe2', '商业综合体幕墙', '#4d5765'],
  'case-demo2.svg': ['#f2eef6', '#e0d7ee', '高端酒店精装', '#63508f'],
  'case-demo3.svg': ['#f0f0f2', '#dcdfe4', '智能制造产业园', '#6b7076'],
  'case-demo4.svg': ['#eef1f6', '#d9e1ec', '欧洲海外项目', '#3d5a80'],
};
for (const [file, [a, b, txt, color]] of Object.entries(NEWS_STYLE)) {
  const target = file.startsWith('case-') ? 'case' : 'news';
  fs.writeFileSync(path.join(IMG, target, file), svgWrap(scene(txt, color), a, b));
  count++;
}

// 占位图
fs.writeFileSync(path.join(IMG, 'placeholder.svg'), `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 450" width="600" height="450">
  <rect width="600" height="450" fill="#f4f5f7"/>
  <rect x="230" y="196" width="140" height="58" fill="#d6001c"/>
  <text x="300" y="233" text-anchor="middle" font-family="Arial,Helvetica,sans-serif" font-size="24" font-weight="bold" fill="#fff">quick-mix</text>
  <text x="300" y="286" text-anchor="middle" font-family="Arial,Helvetica,sans-serif" font-size="14" fill="#9aa0a6">图片待上传</text>
</svg>`);
count++;

// Hero 背景纹理
fs.writeFileSync(path.join(IMG, 'hero-pattern.svg'), `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 700" width="1200" height="700">
  <defs>
    <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#d6001c" stop-opacity=".18"/><stop offset="1" stop-color="#d6001c" stop-opacity="0"/>
    </linearGradient>
  </defs>
  <rect width="1200" height="700" fill="url(#g)"/>
  <g stroke="#ffffff" stroke-opacity=".07" stroke-width="1">
    ${Array.from({ length: 26 }, (_, i) => `<line x1="${i * 48}" y1="0" x2="${i * 48 - 200}" y2="700"/>`).join('')}
  </g>
  <g fill="#ffffff" fill-opacity=".05">
    ${Array.from({ length: 8 }, (_, r) => Array.from({ length: 12 }, (_, c) => `<rect x="${760 + c * 36}" y="${80 + r * 70}" width="26" height="52"/>`).join('')).join('')}
  </g>
</svg>`);
count++;

console.log('素材生成完成：' + count + ' 个 SVG');
