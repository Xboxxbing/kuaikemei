/**
 * 前台统一数据层
 * - 有 Node 服务时：走 /api/xxx（后台改内容，前台实时生效）
 * - 直接双击打开 html（file://）时：自动回退到 public/data/site.js 的静态快照
 */
(function () {
  const fallback = window.QM_FALLBACK || {};
  const isFile = location.protocol === 'file:';

  function localQuery(list, opts = {}) {
    const { eq = {}, keywords = '', keywordFields = [], sort = '', order = 'asc', page = 1, pageSize = 20 } = opts;
    let rows = (list || []).filter((r) => {
      if (r.status && r.status === 'off') return false;
      for (const [k, v] of Object.entries(eq)) {
        if (!v || v === 'all') continue;
        if (String(r[k]) !== String(v)) return false;
      }
      if (keywords && keywordFields.length) {
        const kw = String(keywords).toLowerCase();
        if (!keywordFields.some((f) => String(r[f] ?? '').toLowerCase().includes(kw))) return false;
      }
      return true;
    });
    const total = rows.length;
    if (sort) {
      rows.sort((a, b) => {
        const av = a[sort], bv = b[sort];
        if (av === bv) return (b.id || 0) - (a.id || 0);
        return order === 'desc' ? (bv > av ? 1 : -1) : (av > bv ? 1 : -1);
      });
    }
    const p = Number(page), s = Number(pageSize);
    const start = (p - 1) * s;
    return { total, page: p, pageSize: s, rows: s > 0 ? rows.slice(start, start + s) : rows };
  }

  async function request(path, options) {
    if (isFile) return null;
    try {
      const res = await fetch(path, options);
      if (!res.ok) return null;
      const j = await res.json();
      return j && j.code === 0 ? j.data : null;
    } catch (e) {
      return null;
    }
  }

  function qs(obj) {
    const p = new URLSearchParams();
    Object.entries(obj || {}).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== '') p.append(k, v);
    });
    const s = p.toString();
    return s ? '?' + s : '';
  }

  const QM = {
    isFile,
    fallback,

    async settings() {
      const r = await request('/api/settings');
      return r || fallback.settings || {};
    },

    async products(params = {}) {
      const r = await request('/api/products' + qs(params));
      if (r) return r;
      return localQuery(fallback.products, {
        eq: { category: params.category, series: params.series },
        keywords: params.keywords,
        keywordFields: ['name', 'model', 'summary', 'spec', 'series'],
        sort: 'sort', order: 'asc', page: params.page, pageSize: params.pageSize,
      });
    },
    async product(id) {
      const r = await request('/api/products/' + id);
      if (r) return r;
      return (fallback.products || []).find((p) => String(p.id) === String(id)) || null;
    },

    async solutions(params = {}) {
      const r = await request('/api/solutions' + qs(params));
      if (r) return r;
      const list = (fallback.solutions || []).filter((s) => !params.group || params.group === 'all' || s.group === params.group);
      return { total: list.length, rows: list.slice().sort((a, b) => a.sort - b.sort) };
    },

    async cases(params = {}) {
      const r = await request('/api/cases' + qs(params));
      if (r) return r;
      return localQuery(fallback.cases, {
        eq: { category: params.category }, keywords: params.keywords,
        keywordFields: ['title', 'location', 'client'],
        sort: 'sort', order: 'asc', page: params.page, pageSize: params.pageSize,
      });
    },
    async caseDetail(id) {
      const r = await request('/api/cases/' + id);
      if (r) return r;
      return (fallback.cases || []).find((c) => String(c.id) === String(id)) || null;
    },

    async news(params = {}) {
      const r = await request('/api/news' + qs(params));
      if (r) return r;
      const res = localQuery(fallback.news, {
        eq: { category: params.category }, keywords: params.keywords,
        keywordFields: ['title', 'summary', 'content'],
        sort: 'date', order: 'desc', page: params.page, pageSize: params.pageSize,
      });
      res.rows.sort((a, b) => (b.pinned || 0) - (a.pinned || 0));
      return res;
    },
    async newsDetail(id) {
      const r = await request('/api/news/' + id);
      if (r) return r;
      return (fallback.news || []).find((n) => String(n.id) === String(id)) || null;
    },

    async dealers(params = {}) {
      const r = await request('/api/dealers' + qs(params));
      if (r) return r;
      return localQuery(fallback.dealers, {
        eq: { province: params.province, type: params.type }, keywords: params.keywords,
        keywordFields: ['name', 'city', 'address', 'contact', 'phone'],
        sort: 'id', order: 'asc', page: 1, pageSize: 0,
      });
    },

    async submitLead(data) {
      if (isFile) {
        // 静态演示：仅本地提示
        return { id: 0, demo: true };
      }
      const res = await fetch('/api/leads', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data),
      });
      const j = await res.json();
      if (!j || j.code !== 0) throw new Error((j && j.msg) || '提交失败');
      return j.data;
    },
  };

  window.QM = QM;
})();
