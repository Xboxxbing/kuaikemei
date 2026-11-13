/**
 * 快可美 quick-mix 官网 —— 零依赖 Node 服务
 * 启动：node server/app.js     （默认 http://localhost:3000）
 * 后台：http://localhost:3000/admin   默认账号 admin / admin
 * 无需 npm install，只用 Node 内置模块。
 */
const http = require('http');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const url = require('url');

const db = require('./db');
const { handleUpload } = require('./upload');

const ROOT = path.join(__dirname, '..');
const PUBLIC_DIR = path.join(ROOT, 'public');
const ADMIN_DIR = path.join(ROOT, 'admin');
const PORT = process.env.PORT || 3000;

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.gif': 'image/gif',
  '.webp': 'image/webp',
  '.ico': 'image/x-icon',
  '.pdf': 'application/pdf',
  '.woff2': 'font/woff2',
  '.mp4': 'video/mp4',
};

/* ---------------- 工具 ---------------- */
function json(res, data, code = 200) {
  const body = Buffer.from(JSON.stringify(data), 'utf8');
  res.writeHead(code, {
    'Content-Type': 'application/json; charset=utf-8',
    'Content-Length': body.length,
    'Cache-Control': 'no-store',
  });
  res.end(body);
}
const ok = (res, data) => json(res, { code: 0, data });
const fail = (res, msg, code = 400) => json(res, { code: -1, msg }, code);

function md5(s) {
  return crypto.createHash('md5').update(s).digest('hex');
}

const tokens = new Map(); // token -> 用户信息
function authGuard(req) {
  const h = req.headers.authorization || '';
  const token = h.replace(/^Bearer\s+/i, '').trim();
  return tokens.get(token) || null;
}
/** 允许通过 ?token= 访问（导出下载等直接用链接的场景） */
function authGuardWithQuery(req, query) {
  return authGuard(req) || (query && query.token ? tokens.get(String(query.token)) : null);
}
function requireAuth(req, res) {
  const u = authGuard(req);
  if (!u) fail(res, '未登录或登录已失效', 401);
  return u;
}

function collectBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    let size = 0;
    req.on('data', (c) => {
      size += c.length;
      if (size > 60 * 1024 * 1024) { reject(new Error('请求体过大')); req.destroy(); return; }
      chunks.push(c);
    });
    req.on('end', () => resolve(Buffer.concat(chunks)));
    req.on('error', reject);
  });
}

/* ---------------- 路由 ---------------- */
const routes = [
  // ===== 认证 =====
  ['POST', /^\/api\/auth\/login$/, async (req, res, body) => {
    const { username, password } = body;
    const admin = db.all('admins').find((a) => a.username === username);
    if (!admin || admin.password !== md5(String(password))) return fail(res, '账号或密码错误');
    const token = crypto.randomBytes(24).toString('hex');
    tokens.set(token, { id: admin.id, username: admin.username, name: admin.name });
    return ok(res, { token, user: { username: admin.username, name: admin.name } });
  }],
  ['GET', /^\/api\/auth\/check$/, async (req, res) => {
    const u = authGuard(req);
    return u ? ok(res, u) : fail(res, '未登录', 401);
  }],
  ['POST', /^\/api\/auth\/logout$/, async (req, res) => {
    const h = req.headers.authorization || '';
    tokens.delete(h.replace(/^Bearer\s+/i, '').trim());
    return ok(res, true);
  }],
  ['PUT', /^\/api\/auth\/password$/, async (req, res, body) => {
    const u = requireAuth(req, res); if (!u) return;
    const admin = db.find('admins', u.id);
    if (!admin || admin.password !== md5(String(body.oldPassword || ''))) return fail(res, '原密码不正确');
    if (!body.newPassword) return fail(res, '新密码不能为空');
    db.update('admins', admin.id, { password: md5(String(body.newPassword)) });
    return ok(res, true);
  }],

  // ===== 上传 =====
  ['POST', /^\/api\/upload$/, async (req, res, body, raw) => {
    if (!requireAuth(req, res)) return;
    try {
      const { files } = handleUpload(req, raw);
      return ok(res, files);
    } catch (e) {
      return fail(res, '上传失败：' + e.message);
    }
  }],

  // ===== 产品 =====
  ['GET', /^\/api\/products$/, async (req, res, body, raw, query) => {
    const { category, series, keywords, status, page = 1, pageSize = 24 } = query;
    const r = db.query('products', {
      eq: { category, series, status },
      keywords,
      keywordFields: ['name', 'model', 'summary', 'spec', 'series'],
      sort: 'sort', order: 'asc', page, pageSize,
    });
    return ok(res, r);
  }],
  ['GET', /^\/api\/products\/(\d+)$/, async (req, res, body, raw, query, m) => {
    const p = db.find('products', m[1]);
    if (!p) return fail(res, '产品不存在', 404);
    p.views = (p.views || 0) + 1;
    return ok(res, p);
  }],
  ['POST', /^\/api\/products$/, async (req, res, body) => {
    if (!requireAuth(req, res)) return;
    return ok(res, db.insert('products', body));
  }],
  ['PUT', /^\/api\/products\/(\d+)$/, async (req, res, body, raw, query, m) => {
    if (!requireAuth(req, res)) return;
    const r = db.update('products', m[1], body);
    return r ? ok(res, r) : fail(res, '产品不存在', 404);
  }],
  ['DELETE', /^\/api\/products\/(\d+)$/, async (req, res, body, raw, query, m) => {
    if (!requireAuth(req, res)) return;
    return ok(res, db.remove('products', m[1]));
  }],

  // ===== 解决方案 =====
  ['GET', /^\/api\/solutions$/, async (req, res, body, raw, query) => {
    const { group } = query;
    const list = db.all('solutions', 'sort').filter((s) => !group || group === 'all' || s.group === group);
    return ok(res, { total: list.length, rows: list });
  }],
  ['POST', /^\/api\/solutions$/, async (req, res, body) => { if (!requireAuth(req, res)) return; return ok(res, db.insert('solutions', body)); }],
  ['PUT', /^\/api\/solutions\/(\d+)$/, async (req, res, body, raw, query, m) => { if (!requireAuth(req, res)) return; return ok(res, db.update('solutions', m[1], body)); }],
  ['DELETE', /^\/api\/solutions\/(\d+)$/, async (req, res, body, raw, query, m) => { if (!requireAuth(req, res)) return; return ok(res, db.remove('solutions', m[1])); }],

  // ===== 案例 =====
  ['GET', /^\/api\/cases$/, async (req, res, body, raw, query) => {
    const { category, keywords, page = 1, pageSize = 12 } = query;
    const r = db.query('cases', {
      eq: { category }, keywords, keywordFields: ['title', 'location', 'client'],
      sort: 'sort', order: 'asc', page, pageSize,
    });
    return ok(res, r);
  }],
  ['GET', /^\/api\/cases\/(\d+)$/, async (req, res, body, raw, query, m) => {
    const c = db.find('cases', m[1]);
    if (!c) return fail(res, '案例不存在', 404);
    c.views = (c.views || 0) + 1;
    return ok(res, c);
  }],
  ['POST', /^\/api\/cases$/, async (req, res, body) => { if (!requireAuth(req, res)) return; return ok(res, db.insert('cases', body)); }],
  ['PUT', /^\/api\/cases\/(\d+)$/, async (req, res, body, raw, query, m) => { if (!requireAuth(req, res)) return; return ok(res, db.update('cases', m[1], body)); }],
  ['DELETE', /^\/api\/cases\/(\d+)$/, async (req, res, body, raw, query, m) => { if (!requireAuth(req, res)) return; return ok(res, db.remove('cases', m[1])); }],

  // ===== 新闻 =====
  ['GET', /^\/api\/news$/, async (req, res, body, raw, query) => {
    const { category, keywords, page = 1, pageSize = 10 } = query;
    const r = db.query('news', {
      eq: { category }, keywords, keywordFields: ['title', 'summary', 'content', 'author'],
      sort: 'date', order: 'desc', page, pageSize,
    });
    r.rows = r.rows.slice().sort((a, b) => (b.pinned || 0) - (a.pinned || 0));
    return ok(res, r);
  }],
  ['GET', /^\/api\/news\/(\d+)$/, async (req, res, body, raw, query, m) => {
    const n = db.find('news', m[1]);
    if (!n) return fail(res, '新闻不存在', 404);
    n.views = (n.views || 0) + 1;
    return ok(res, n);
  }],
  ['POST', /^\/api\/news$/, async (req, res, body) => { if (!requireAuth(req, res)) return; return ok(res, db.insert('news', body)); }],
  ['PUT', /^\/api\/news\/(\d+)$/, async (req, res, body, raw, query, m) => { if (!requireAuth(req, res)) return; return ok(res, db.update('news', m[1], body)); }],
  ['DELETE', /^\/api\/news\/(\d+)$/, async (req, res, body, raw, query, m) => { if (!requireAuth(req, res)) return; return ok(res, db.remove('news', m[1])); }],

  // ===== 合作运营商 =====
  ['GET', /^\/api\/dealers$/, async (req, res, body, raw, query) => {
    const { province, type, keywords } = query;
    const r = db.query('dealers', {
      eq: { province, type }, keywords, keywordFields: ['name', 'city', 'address', 'contact', 'phone'],
      sort: 'id', order: 'asc', page: 1, pageSize: 0,
    });
    return ok(res, r);
  }],
  ['POST', /^\/api\/dealers$/, async (req, res, body) => { if (!requireAuth(req, res)) return; return ok(res, db.insert('dealers', body)); }],
  ['PUT', /^\/api\/dealers\/(\d+)$/, async (req, res, body, raw, query, m) => { if (!requireAuth(req, res)) return; return ok(res, db.update('dealers', m[1], body)); }],
  ['DELETE', /^\/api\/dealers\/(\d+)$/, async (req, res, body, raw, query, m) => { if (!requireAuth(req, res)) return; return ok(res, db.remove('dealers', m[1])); }],

  // ===== 线索（前台提交 / 后台管理） =====
  ['POST', /^\/api\/leads$/, async (req, res, body) => {
    if (!body.name || !body.phone) return fail(res, '请填写姓名与联系电话');
    const row = db.insert('leads', Object.assign({ status: '未处理' }, body));
    return ok(res, row);
  }],
  ['GET', /^\/api\/leads$/, async (req, res, body, raw, query) => {
    if (!requireAuth(req, res)) return;
    const { status, type, keywords, page = 1, pageSize = 20 } = query;
    const r = db.query('leads', {
      eq: { status, type }, keywords, keywordFields: ['name', 'phone', 'city', 'company', 'message'],
      sort: 'createdAt', order: 'desc', page, pageSize,
    });
    return ok(res, r);
  }],
  ['PUT', /^\/api\/leads\/(\d+)$/, async (req, res, body, raw, query, m) => { if (!requireAuth(req, res)) return; return ok(res, db.update('leads', m[1], body)); }],
  ['DELETE', /^\/api\/leads\/(\d+)$/, async (req, res, body, raw, query, m) => { if (!requireAuth(req, res)) return; return ok(res, db.remove('leads', m[1])); }],

  // ===== 站点设置 =====
  ['GET', /^\/api\/settings$/, async (req, res) => ok(res, db.getSettings())],
  ['PUT', /^\/api\/settings$/, async (req, res, body) => { if (!requireAuth(req, res)) return; return ok(res, db.saveSettings(body)); }],

  // ===== 仪表盘 =====
  ['GET', /^\/api\/stats$/, async (req, res) => {
    if (!requireAuth(req, res)) return;
    const leads = db.all('leads');
    const byStatus = {};
    leads.forEach((l) => { byStatus[l.status || '未处理'] = (byStatus[l.status || '未处理'] || 0) + 1; });
    const news = db.all('news').slice().sort((a, b) => String(b.date).localeCompare(String(a.date))).slice(0, 5);
    return ok(res, {
      products: db.all('products').length,
      cases: db.all('cases').length,
      news: db.all('news').length,
      dealers: db.all('dealers').length,
      leads: leads.length,
      leadsToday: leads.filter((l) => Date.now() - l.createdAt < 86400000).length,
      byStatus,
      latestLeads: leads.slice().sort((a, b) => b.createdAt - a.createdAt).slice(0, 5),
      latestNews: news,
    });
  }],

  // ===== 导出 =====
  ['GET', /^\/api\/export$/, async (req, res, body, raw, query) => {
    if (!authGuardWithQuery(req, query)) return fail(res, '未登录', 401);
    const col = query.col || 'leads';
    const rows = db.all(col);
    if (!rows.length) return fail(res, '无数据');
    const headers = [...new Set(rows.flatMap((r) => Object.keys(r)))].filter((k) => k !== 'id');
    const esc = (v) => '"' + String(v === undefined || v === null ? '' : typeof v === 'object' ? JSON.stringify(v) : v).replace(/"/g, '""') + '"';
    const csv = '\uFEFF' + [headers.map(esc).join(',')].concat(rows.map((r) => headers.map((h) => esc(r[h])).join(','))).join('\r\n');
    res.writeHead(200, {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="${col}-${Date.now()}.csv"`,
    });
    res.end(csv);
    return true;
  }],
];

/* ---------------- 静态文件 ---------------- */
function serveStatic(res, filePath) {
  if (!filePath.startsWith(PUBLIC_DIR) && !filePath.startsWith(ADMIN_DIR)) return fail(res, '禁止访问', 403);
  fs.stat(filePath, (err, st) => {
    if (err || !st.isFile()) {
      res.writeHead(404, { 'Content-Type': 'text/html; charset=utf-8' });
      res.end('<h1>404</h1><p><a href="/">返回首页</a></p>');
      return;
    }
    const ext = path.extname(filePath).toLowerCase();
    res.writeHead(200, {
      'Content-Type': MIME[ext] || 'application/octet-stream',
      'Content-Length': st.size,
      'Cache-Control': ext === '.html' ? 'no-cache' : 'public, max-age=3600',
    });
    fs.createReadStream(filePath).pipe(res);
  });
}

/* ---------------- 服务 ---------------- */
const server = http.createServer(async (req, res) => {
  const parsed = url.parse(req.url, true);
  const pathname = decodeURIComponent(parsed.pathname);
  const method = req.method.toUpperCase();

  // API
  if (pathname.startsWith('/api/')) {
    let raw = Buffer.alloc(0);
    try { raw = await collectBody(req); } catch (e) { return fail(res, '请求异常'); }
    let body = {};
    if (raw.length) {
      const ct = req.headers['content-type'] || '';
      if (ct.includes('multipart')) {
        // multipart 的普通字段在路由内解析
      } else {
        try { body = JSON.parse(raw.toString('utf8')); } catch (e) { return fail(res, 'JSON 格式错误'); }
      }
    }
    for (const [m, re, handler] of routes) {
      const mm = re.exec(pathname);
      if (m === method && mm) {
        try {
          const r = await handler(req, res, body, raw, parsed.query, mm);
          if (r !== true && !res.writableEnded) return;
          return;
        } catch (e) {
          console.error('[API ERROR]', pathname, e);
          return fail(res, '服务端错误：' + e.message, 500);
        }
      }
    }
    return fail(res, '接口不存在', 404);
  }

  // 后台：不带尾部斜杠时先重定向，否则浏览器会把 assets/... 解析到站点根目录导致 404
  if (pathname === '/admin') {
    res.writeHead(302, { Location: '/admin/' + (parsed.search || '') });
    return res.end();
  }
  if (pathname === '/admin/' || pathname.startsWith('/admin/')) {
    const rel = pathname.replace(/^\/admin\/?/, '') || 'index.html';
    return serveStatic(res, path.join(ADMIN_DIR, rel));
  }

  // 前台
  let file = path.join(PUBLIC_DIR, pathname === '/' ? 'index.html' : pathname);
  if (!path.extname(file)) {
    if (fs.existsSync(file + '.html')) file += '.html';
    else file = path.join(file, 'index.html');
  }
  serveStatic(res, file);
});

function banner(port) {
  console.log('');
  console.log('  ================================================');
  console.log('   quick-mix 快可美官网已启动');
  console.log('  ================================================');
  console.log('   前台首页： http://localhost:' + port + '/');
  console.log('   管理后台： http://localhost:' + port + '/admin');
  console.log('   后台账号： admin        密码： admin');
  console.log('   数据文件： ' + db.path);
  console.log('');
  console.log('   保持这个窗口开着 = 网站就在运行；关掉窗口 = 网站停止');
  console.log('   停止服务：按 Ctrl + C');
  console.log('  ================================================');
  console.log('');
}

// 端口被占用时自动向后顺延，避免双击启动后"没反应"
const START = Number(PORT);
let tryPort = START;
server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    if (tryPort < START + 10) {
      tryPort += 1;
      console.log('  端口 ' + (tryPort - 1) + ' 已被占用，改用 ' + tryPort + ' …');
      server.listen(tryPort);
    } else {
      console.error('  端口 ' + START + ' ~ ' + (START + 9) + ' 都被占用了，请先关闭其它程序，或执行：PORT=8080 node server/app.js');
      process.exit(1);
    }
  } else {
    console.error(err);
    process.exit(1);
  }
});
server.listen(tryPort, () => banner(tryPort));
