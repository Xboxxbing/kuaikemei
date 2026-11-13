/**
 * 由 server/data/seed.json 生成前台静态快照 public/data/site.js
 * 用途：直接双击 html 预览（file:// 无后端）时，页面仍显示完整内容。
 */
const fs = require('fs');
const path = require('path');
const seed = require(path.join(__dirname, '..', 'server', 'data', 'seed.json'));

const data = {
  products: seed.products,
  solutions: seed.solutions,
  cases: seed.cases,
  news: seed.news,
  dealers: seed.dealers,
  settings: seed.settings,
};

const out = '/* 自动生成，请勿手改：由 server/data/seed.json 同步 */\nwindow.QM_FALLBACK = ' + JSON.stringify(data) + ';\n';
fs.mkdirSync(path.join(__dirname, '..', 'public', 'data'), { recursive: true });
fs.writeFileSync(path.join(__dirname, '..', 'public', 'data', 'site.js'), out, 'utf8');
console.log('site.js 已生成，' + (out.length / 1024).toFixed(0) + ' KB');
