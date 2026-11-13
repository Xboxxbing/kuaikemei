/**
 * 轻量级 JSON 持久化存储
 * 零依赖：只有一个 data/db.json 文件，备份/迁移直接拷文件即可。
 * 如需换成 MySQL / SQLite，只要替换本文件并保持下面 6 个方法签名不变。
 */
const fs = require('fs');
const path = require('path');

const DATA_DIR = path.join(__dirname, 'data');
const DB_FILE = path.join(DATA_DIR, 'db.json');
const SEED_FILE = path.join(DATA_DIR, 'seed.json');

let cache = null;
let seq = {};

function load() {
  if (cache) return cache;
  if (!fs.existsSync(DB_FILE)) {
    if (!fs.existsSync(SEED_FILE)) throw new Error('缺少初始数据文件 seed.json');
    fs.mkdirSync(DATA_DIR, { recursive: true });
    fs.copyFileSync(SEED_FILE, DB_FILE);
  }
  cache = JSON.parse(fs.readFileSync(DB_FILE, 'utf8'));
  for (const key of Object.keys(cache)) {
    if (!Array.isArray(cache[key])) continue;
    let max = 0;
    for (const row of cache[key]) if (row.id > max) max = row.id;
    seq[key] = max;
  }
  return cache;
}

let writeTimer = null;
function persist() {
  // 合并写，避免批量操作时频繁落盘
  if (writeTimer) return;
  writeTimer = setTimeout(() => {
    writeTimer = null;
    const tmp = DB_FILE + '.tmp';
    fs.writeFileSync(tmp, JSON.stringify(cache, null, 2), 'utf8');
    fs.renameSync(tmp, DB_FILE);
  }, 30);
}

function nextId(col) {
  seq[col] = (seq[col] || 0) + 1;
  return seq[col];
}

function coll(col) {
  const data = load();
  if (!data[col]) data[col] = [];
  return data[col];
}

const db = {
  /** 取全部（可传排序字段） */
  all(col, sortField) {
    const list = coll(col).slice();
    if (sortField) {
      list.sort((a, b) => (a[sortField] ?? 0) - (b[sortField] ?? 0));
    }
    return list;
  },

  find(col, id) {
    return coll(col).find((r) => String(r.id) === String(id)) || null;
  },

  /** 条件查询：keywords 模糊匹配字段、eq 精确匹配、分页、排序 */
  query(col, opts = {}) {
    const { eq = {}, keywords = '', keywordFields = [], sort = 'sort', order = 'asc', page = 1, pageSize = 20 } = opts;
    let list = coll(col).filter((r) => {
      for (const [k, v] of Object.entries(eq)) {
        if (v === undefined || v === null || v === '' || v === 'all') continue;
        if (String(r[k]) !== String(v)) return false;
      }
      if (keywords && keywordFields.length) {
        const kw = String(keywords).toLowerCase();
        const hit = keywordFields.some((f) => String(r[f] ?? '').toLowerCase().includes(kw));
        if (!hit) return false;
      }
      return true;
    });
    const total = list.length;
    if (sort) {
      list.sort((a, b) => {
        const av = a[sort], bv = b[sort];
        if (av === bv) return (b.id || 0) - (a.id || 0);
        return order === 'desc' ? (bv > av ? 1 : -1) : (av > bv ? 1 : -1);
      });
    }
    const start = (Number(page) - 1) * Number(pageSize);
    const rows = Number(pageSize) > 0 ? list.slice(start, start + Number(pageSize)) : list;
    return { total, page: Number(page), pageSize: Number(pageSize), rows };
  },

  insert(col, obj) {
    const list = coll(col);
    const now = Date.now();
    const row = Object.assign({}, obj, {
      id: nextId(col),
      createdAt: obj.createdAt || now,
      updatedAt: now,
    });
    list.unshift(row);
    persist();
    return row;
  },

  update(col, id, patch) {
    const row = db.find(col, id);
    if (!row) return null;
    Object.assign(row, patch, { id: row.id, updatedAt: Date.now() });
    persist();
    return row;
  },

  remove(col, id) {
    const list = coll(col);
    const idx = list.findIndex((r) => String(r.id) === String(id));
    if (idx < 0) return false;
    list.splice(idx, 1);
    persist();
    return true;
  },

  /** 直接读写配置项（settings 是对象而非数组） */
  getSettings() {
    return load().settings || {};
  },
  saveSettings(obj) {
    const data = load();
    data.settings = Object.assign({}, data.settings, obj);
    persist();
    return data.settings;
  },

  raw() {
    return load();
  },
  path: DB_FILE,
};

module.exports = db;
