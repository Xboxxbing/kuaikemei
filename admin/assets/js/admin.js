/* ===========================================================
   快可美官网后台管理（零依赖原生 JS）
   =========================================================== */
(function () {
  const app = document.getElementById('app');
  const TOKEN = 'qm_token';
  const USER = 'qm_user';
  let state = { page: 1, pageSize: 10, keywords: '', filter: '' };

  /* ---------- 请求 ---------- */
  function authHeader() {
    const t = localStorage.getItem(TOKEN) || '';
    return t ? { Authorization: 'Bearer ' + t, 'Content-Type': 'application/json' } : { 'Content-Type': 'application/json' };
  }
  async function api(path, method, body) {
    const res = await fetch(path, { method: method || 'GET', headers: authHeader(), body: body ? JSON.stringify(body) : undefined });
    if (res.status === 401) { localStorage.removeItem(TOKEN); location.reload(); return null; }
    const j = await res.json();
    if (j.code !== 0) throw new Error(j.msg || '请求失败');
    return j.data;
  }
  const get = (p) => api(p);
  const post = (p, b) => api(p, 'POST', b);
  const put = (p, b) => api(p, 'PUT', b);
  const del = (p) => api(p, 'DELETE');

  async function upload(file) {
    const fd = new FormData();
    fd.append('file', file);
    const res = await fetch('/api/upload', { method: 'POST', headers: { Authorization: 'Bearer ' + (localStorage.getItem(TOKEN) || '') }, body: fd });
    const j = await res.json();
    if (j.code !== 0) throw new Error(j.msg || '上传失败');
    return j.data[0] ? j.data[0].url : '';
  }

  /* ---------- 导出 CSV ---------- */
  async function exportCsv(col) {
    try {
      const t = localStorage.getItem(TOKEN) || '';
      const res = await fetch('/api/export?col=' + encodeURIComponent(col) + '&token=' + encodeURIComponent(t));
      if (!res.ok) throw new Error('导出失败（HTTP ' + res.status + '）');
      const blob = await res.blob();
      if (!blob.size) throw new Error('没有可导出的数据');
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = col + '-' + new Date().toISOString().slice(0, 10) + '.csv';
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 3000);
      toast('已导出 ' + col + ' 数据');
    } catch (e) { toast(e.message || '导出失败，请重试'); }
  }

  /* ---------- 通用 UI ---------- */
  const esc = (s) => String(s === undefined || s === null ? '' : s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  function toast(msg) {
    let t = document.querySelector('.toast');
    if (!t) { t = document.createElement('div'); t.className = 'toast'; document.body.appendChild(t); }
    t.textContent = msg; t.style.display = 'block';
    clearTimeout(t._t); t._t = setTimeout(() => (t.style.display = 'none'), 2400);
  }
  function closeModal() { const m = document.querySelector('.mask'); if (m) m.remove(); }
  function modal(title, bodyHtml, footHtml) {
    const m = document.createElement('div');
    m.className = 'mask';
    m.innerHTML = `<div class="modal">
      <div class="hd"><h3>${title}</h3><button class="close" onclick="this.closest('.mask').remove()">×</button></div>
      <div class="bd">${bodyHtml}</div>
      <div class="ft">${footHtml || ''}</div>
    </div>`;
    document.body.appendChild(m);
    return m;
  }
  function confirmBox(text, onYes) {
    const m = modal('确认操作', `<p style="margin:0">${esc(text)}</p>`,
      `<button class="btn" onclick="this.closest('.mask').remove()">取消</button><button class="btn btn-danger" id="yesBtn">确定</button>`);
    m.querySelector('#yesBtn').onclick = () => { m.remove(); onYes(); };
  }

  /* ---------- 字段渲染 ---------- */
  function fieldHtml(f, val) {
    const v = val === undefined || val === null ? '' : val;
    switch (f.type) {
      case 'textarea':
        return `<textarea data-k="${f.k}" placeholder="${esc(f.ph || '')}">${esc(v)}</textarea>`;
      case 'number':
        return `<input type="number" data-k="${f.k}" value="${esc(v)}">`;
      case 'date':
        return `<input type="date" data-k="${f.k}" value="${esc(v)}">`;
      case 'select':
        return `<select data-k="${f.k}">${f.opts.map((o) => {
          const val2 = Array.isArray(o) ? o[0] : o, lb = Array.isArray(o) ? o[1] : o;
          return `<option value="${esc(val2)}" ${String(v) === String(val2) ? 'selected' : ''}>${esc(lb)}</option>`;
        }).join('')}</select>`;
      case 'tags':
        return `<input type="text" data-k="${f.k}" value="${Array.isArray(v) ? v.join(',') : esc(v)}" placeholder="多个标签用逗号分隔">
          <div class="hint">例：新品,德国进口,地暖可用</div>`;
      case 'image':
        return `<div class="inline">
            <input type="text" data-k="${f.k}" value="${esc(v)}" placeholder="图片地址或点击上传">
            <input type="file" accept="image/*" class="up" style="width:110px">
          </div>
          <div style="margin-top:8px"><img class="img-prev" src="${esc(v) ? esc(v) : 'data:image/svg+xml;utf8,<svg xmlns=%22http://www.w3.org/2000/svg%22 width=%22100%22 height=%22100%22><rect width=%22100%22 height=%22100%22 fill=%22%23f4f5f7%22/></svg>'}" onerror="this.style.display='none'"></div>`;
      case 'list':
        return `<div data-list="${f.k}">${(Array.isArray(v) ? v : []).map((row) => listRowHtml(f, row)).join('')}</div>
          <button class="btn btn-sm addRow" type="button">+ 添加一条</button>
          <div class="hint">${esc(f.hint || '')}</div>`;
      case 'kv':
        return `<div data-kv="${f.k}">${(Array.isArray(v) ? v : []).map((row) => kvRowHtml(row)).join('')}</div>
          <button class="btn btn-sm addKv" type="button">+ 添加参数</button>`;
      case 'colors':
        return `<div data-colors="${f.k}">${(Array.isArray(v) ? v : []).map((c) => colorRowHtml(c)).join('')}</div>
          <button class="btn btn-sm addColor" type="button">+ 添加颜色</button>`;
      default:
        return `<input type="text" data-k="${f.k}" value="${esc(v)}" placeholder="${esc(f.ph || '')}">`;
    }
  }
  function listRowHtml(f, row) {
    return `<div class="f-row" style="grid-template-columns:1fr 32px;margin-bottom:8px">
      <div class="f-half" style="grid-template-columns:${f.fields.map(() => '1fr').join(' ')}">
        ${f.fields.map((ff) => ff.area
          ? `<textarea data-f="${ff.k}" placeholder="${esc(ff.t)}">${esc(row[ff.k] || '')}</textarea>`
          : `<input type="text" data-f="${ff.k}" value="${esc(row[ff.k] || '')}" placeholder="${esc(ff.t)}">`).join('')}
      </div>
      <button class="mini" type="button" onclick="this.closest('.f-row').remove()">×</button>
    </div>`;
  }
  const kvRowHtml = (r) => `<div class="kv-row">
      <input type="text" data-k2="k" value="${esc(r.k || '')}" placeholder="参数名">
      <input type="text" data-k2="v" value="${esc(r.v || '')}" placeholder="参数值">
      <button class="mini" type="button" onclick="this.parentNode.remove()">×</button>
    </div>`;
  const colorRowHtml = (c) => `<div class="color-row">
      <input type="text" data-c2="name" value="${esc(c.name || '')}" placeholder="颜色名称">
      <input type="color" data-c2="hex" value="${esc(c.hex || '#cccccc')}" style="width:100%;height:34px;border:1px solid var(--line)">
      <button class="mini" type="button" onclick="this.parentNode.remove()">×</button>
    </div>`;

  function collectForm(root, fields) {
    const data = {};
    fields.forEach((f) => {
      if (f.type === 'list') {
        data[f.k] = [...root.querySelectorAll(`[data-list="${f.k}"] .f-row`)].map((r) => {
          const o = {};
          r.querySelectorAll('[data-f]').forEach((i) => { o[i.dataset.f] = i.value; });
          return o;
        }).filter((o) => Object.values(o).some(Boolean));
      } else if (f.type === 'kv') {
        data[f.k] = [...root.querySelectorAll(`[data-kv="${f.k}"] .kv-row`)].map((r) => ({
          k: r.querySelector('[data-k2="k"]').value, v: r.querySelector('[data-k2="v"]').value,
        })).filter((x) => x.k || x.v);
      } else if (f.type === 'colors') {
        data[f.k] = [...root.querySelectorAll(`[data-colors="${f.k}"] .color-row`)].map((r) => ({
          name: r.querySelector('[data-c2="name"]').value, hex: r.querySelector('[data-c2="hex"]').value,
        })).filter((x) => x.name);
      } else {
        const el = root.querySelector(`[data-k="${f.k}"]`);
        if (!el) return;
        let v = el.value;
        if (f.type === 'tags') v = v.split(/[,，]/).map((s) => s.trim()).filter(Boolean);
        else if (f.type === 'number') v = Number(v) || 0;
        data[f.k] = v;
      }
    });
    return data;
  }

  /* ---------- 配置：各模块字段 ---------- */
  const CATS = [['meifeng', '美缝系统'], ['dizhuan', '瓷砖与石材粘贴'], ['fangshui', '防水系统'], ['shajiang', '砂浆与腻子'], ['tuliao', '涂料系统'], ['diping', '地坪系统']];
  const CASE_CATS = [['public', '公共建筑'], ['education', '教育领域'], ['business', '商业文化'], ['residential', '住宅项目'], ['industrial', '工业厂房'], ['overseas', '海外项目']];
  const NEWS_CATS = ['公司动态', '新品发布', '展会活动', '产品资讯', '工程荣誉'];
  const ON_OFF = [['on', '上架 / 显示'], ['off', '下架 / 隐藏']];

  const CFG = {
    products: {
      title: '产品中心', api: '/api/products', needAuth: true,
      cols: [
        { t: '图片', w: 60, r: (r) => `<img class="thumb" src="${r.img ? (r.img.startsWith('http') || r.img.startsWith('/') ? r.img : '/assets/img/product/' + r.img) : '/assets/img/placeholder.svg'}" onerror="this.src='/assets/img/placeholder.svg'">` },
        { t: '产品名称', r: (r) => `<b>${esc(r.name)}</b><br><span style="color:#9096a0;font-size:12px">${esc(r.model || '')} · ${esc(r.spec || '')}</span>` },
        { t: '分类', r: (r) => esc((CATS.find((c) => c[0] === r.category) || ['', '—'])[1]) },
        { t: '系列', r: (r) => esc(r.series || '') },
        { t: '状态', r: (r) => `<span class="tag ${r.status === 'off' ? 'off' : 'on'}">${r.status === 'off' ? '下架' : '上架'}</span>` },
        { t: '浏览', w: 70, r: (r) => r.views || 0 },
      ],
      filters: [{ k: 'category', opts: [['', '全部分类']].concat(CATS) }],
      fields: [
        { k: 'name', t: '产品名称', type: 'text', req: true },
        { k: 'model', t: '产品型号', type: 'text', ph: '如 H30' },
        { k: 'category', t: '所属分类', type: 'select', opts: CATS },
        { k: 'series', t: '产品系列', type: 'text', ph: '如 氢化美缝系列' },
        { k: 'spec', t: '包装规格', type: 'text', ph: '如 400ml/支' },
        { k: 'tags', t: '产品标签', type: 'tags' },
        { k: 'summary', t: '产品简介', type: 'textarea' },
        { k: 'features', t: '产品特点', type: 'list', fields: [{ k: 't', t: '特点标题' }, { k: 'd', t: '特点说明', area: true }], hint: '每行一条，建议 4~6 条' },
        { k: 'params', t: '技术参数', type: 'kv' },
        { k: 'application', t: '适用范围', type: 'textarea' },
        { k: 'construction', t: '施工工艺', type: 'textarea' },
        { k: 'standards', t: '执行标准', type: 'text' },
        { k: 'img', t: '产品主图', type: 'image' },
        { k: 'colors', t: '色卡', type: 'colors' },
        { k: 'status', t: '上架状态', type: 'select', opts: ON_OFF },
        { k: 'sort', t: '排序值', type: 'number' },
      ],
    },
    solutions: {
      title: '解决方案', api: '/api/solutions', pageSize: 50,
      cols: [
        { t: '方案名称', r: (r) => `<b>${esc(r.name)}</b>` },
        { t: '归属', r: (r) => r.group === 'home' ? '家装领域' : '建筑领域' },
        { t: '核心优势', r: (r) => (r.features || []).slice(0, 3).map((f) => `<span class="tag">${esc(f)}</span>`).join(' ') },
        { t: '排序', w: 70, r: (r) => r.sort || 0 },
      ],
      filters: [{ k: 'group', opts: [['', '全部'], ['home', '家装领域'], ['building', '建筑领域']] }],
      fields: [
        { k: 'name', t: '方案名称', type: 'text', req: true },
        { k: 'en', t: '英文名称', type: 'text' },
        { k: 'group', t: '归属领域', type: 'select', opts: [['home', '家装领域'], ['building', '建筑领域']] },
        { k: 'features', t: '核心优势', type: 'list', fields: [{ k: 't', t: '优势点' }], hint: '每行一条短标签' },
        { k: 'content', t: '方案介绍', type: 'textarea' },
        { k: 'img', t: '方案配图', type: 'image' },
        { k: 'sort', t: '排序值', type: 'number' },
        { k: 'status', t: '显示状态', type: 'select', opts: ON_OFF },
      ],
    },
    cases: {
      title: '案例工程', api: '/api/cases', pageSize: 20,
      cols: [
        { t: '封面', w: 60, r: (r) => `<img class="thumb" src="${r.cover ? (r.cover.startsWith('http') || r.cover.startsWith('/') ? r.cover : '/assets/img/case/' + r.cover) : '/assets/img/placeholder.svg'}" onerror="this.src='/assets/img/placeholder.svg'">` },
        { t: '项目标题', r: (r) => `<b>${esc(r.title)}</b><br><span style="color:#9096a0;font-size:12px">${esc(r.location || '')}</span>` },
        { t: '分类', r: (r) => esc((CASE_CATS.find((c) => c[0] === r.category) || ['', '—'])[1]) },
        { t: '规模', r: (r) => esc(r.area || '') },
        { t: '年份', w: 70, r: (r) => esc(r.year || '') },
      ],
      filters: [{ k: 'category', opts: [['', '全部分类']].concat(CASE_CATS) }],
      fields: [
        { k: 'title', t: '项目标题', type: 'text', req: true },
        { k: 'category', t: '项目分类', type: 'select', opts: CASE_CATS },
        { k: 'location', t: '项目地点', type: 'text' },
        { k: 'area', t: '应用规模', type: 'text', ph: '如 外墙 40,000㎡' },
        { k: 'year', t: '竣工年份', type: 'text' },
        { k: 'client', t: '建设单位', type: 'text' },
        { k: 'cover', t: '封面图', type: 'image' },
        { k: 'images', t: '项目图集', type: 'tags', ph: '多个图片地址用逗号分隔' },
        { k: 'systems', t: '应用系统', type: 'list', fields: [{ k: 't', t: '系统名称' }] },
        { k: 'content', t: '项目介绍', type: 'textarea' },
        { k: 'sort', t: '排序值', type: 'number' },
        { k: 'status', t: '显示状态', type: 'select', opts: ON_OFF },
      ],
    },
    news: {
      title: '新闻资讯', api: '/api/news', pageSize: 10,
      cols: [
        { t: '标题', r: (r) => `<b>${r.pinned ? '<span class="tag red">置顶</span> ' : ''}${esc(r.title)}</b><br><span style="color:#9096a0;font-size:12px">${esc(r.date || '')} · ${esc(r.category || '')}</span>` },
        { t: '分类', w: 100, r: (r) => esc(r.category || '') },
        { t: '来源', w: 120, r: (r) => esc(r.author || '') },
        { t: '阅读', w: 70, r: (r) => r.views || 0 },
        { t: '状态', w: 80, r: (r) => `<span class="tag ${r.status === 'off' ? 'off' : 'on'}">${r.status === 'off' ? '隐藏' : '显示'}</span>` },
      ],
      filters: [{ k: 'category', opts: [['', '全部分类']].concat(NEWS_CATS.map((c) => [c, c])) }],
      fields: [
        { k: 'title', t: '新闻标题', type: 'text', req: true },
        { k: 'category', t: '所属分类', type: 'select', opts: NEWS_CATS.map((c) => [c, c]) },
        { k: 'date', t: '发布日期', type: 'date' },
        { k: 'author', t: '来源 / 作者', type: 'text' },
        { k: 'cover', t: '封面图', type: 'image' },
        { k: 'summary', t: '摘要', type: 'textarea' },
        { k: 'content', t: '正文内容', type: 'textarea', ph: '段落之间空行分隔' },
        { k: 'pinned', t: '是否置顶', type: 'select', opts: [[0, '否'], [1, '置顶']] },
        { k: 'status', t: '显示状态', type: 'select', opts: ON_OFF },
      ],
    },
    dealers: {
      title: '合作运营商', api: '/api/dealers', pageSize: 50,
      cols: [
        { t: '名称', r: (r) => `<b>${esc(r.name)}</b> <span class="tag">${esc(r.type || '')}</span>` },
        { t: '地区', w: 160, r: (r) => esc((r.province || '') + ' ' + (r.city || '')) },
        { t: '联系人', w: 120, r: (r) => esc(r.contact || '') },
        { t: '联系电话', w: 140, r: (r) => esc(r.phone || '') },
      ],
      filters: [],
      fields: [
        { k: 'name', t: '门店名称', type: 'text', req: true },
        { k: 'type', t: '合作类型', type: 'select', opts: [['旗舰服务商', '旗舰服务商'], ['经销商', '经销商'], ['服务商', '服务商']] },
        { k: 'province', t: '省份', type: 'text', ph: '如 山东省' },
        { k: 'city', t: '城市', type: 'text', ph: '如 潍坊市' },
        { k: 'address', t: '详细地址', type: 'text' },
        { k: 'contact', t: '联系人', type: 'text' },
        { k: 'phone', t: '联系电话', type: 'text' },
        { k: 'lng', t: '经度', type: 'number' },
        { k: 'lat', t: '纬度', type: 'number' },
        { k: 'status', t: '显示状态', type: 'select', opts: ON_OFF },
      ],
    },
  };

  /* ---------- 通用列表页 ---------- */
  async function listPage(key) {
    const cfg = CFG[key];
    const fk = state.filter;
    const r = await get(`${cfg.api}?page=${state.page}&pageSize=${cfg.pageSize || 10}&keywords=${encodeURIComponent(state.keywords)}${fk ? '&' + fk : ''}`);
    const rows = r.rows || [];
    const total = r.total || 0;
    const pages = Math.max(1, Math.ceil(total / (cfg.pageSize || 10)));

    const head = `<div class="toolbar">
        ${(cfg.filters || []).map((f) => `<select data-flt="${f.k}">${f.opts.map((o) => `<option value="${o[0]}" ${state['f_' + f.k] === o[0] ? 'selected' : ''}>${o[1]}</option>`).join('')}</select>`).join('')}
        <input id="kw" placeholder="搜索关键词" value="${esc(state.keywords)}" style="width:200px">
        <button class="btn" id="btnSearch">搜索</button>
        <div class="spacer"></div>
        <button class="btn" id="btnExport">导出 CSV</button>
        <button class="btn btn-primary" id="btnAdd">+ 新增</button>
      </div>`;

    const table = rows.length ? `<table class="tbl">
        <thead><tr>${cfg.cols.map((c) => `<th${c.w ? ` style="width:${c.w}px"` : ''}>${c.t}</th>`).join('')}<th style="width:130px">操作</th></tr></thead>
        <tbody>${rows.map((r2) => `<tr>${cfg.cols.map((c) => `<td>${c.r(r2)}</td>`).join('')}
          <td>
            <button class="btn btn-sm" data-edit="${r2.id}">编辑</button>
            <button class="btn btn-sm btn-danger" data-del="${r2.id}">删除</button>
          </td></tr>`).join('')}</tbody>
      </table>` : '<div class="empty">暂无数据</div>';

    const pager = `<div class="pager">${Array.from({ length: pages }, (_, i) => `<button class="${i + 1 === state.page ? 'on' : ''}" data-p="${i + 1}">${i + 1}</button>`).join('')}</div>`;

    document.getElementById('view').innerHTML = `<div class="card"><h3>${cfg.title}（共 ${total} 条）</h3>${head}${table}${pager}</div>`;

    document.getElementById('btnSearch').onclick = () => { state.keywords = document.getElementById('kw').value; state.page = 1; listPage(key); };
    document.getElementById('btnAdd').onclick = () => formPage(key, null);
    document.getElementById('btnExport').onclick = () => exportCsv(key);
    document.querySelectorAll('[data-flt]').forEach((s) => {
      s.onchange = () => { state['f_' + s.dataset.flt] = s.value; state.filter = s.value ? s.dataset.flt + '=' + encodeURIComponent(s.value) : ''; state.page = 1; listPage(key); };
    });
    document.querySelectorAll('[data-p]').forEach((b) => { b.onclick = () => { state.page = Number(b.dataset.p); listPage(key); }; });
    document.querySelectorAll('[data-edit]').forEach((b) => { b.onclick = () => formPage(key, rows.find((x) => String(x.id) === b.dataset.edit)); });
    document.querySelectorAll('[data-del]').forEach((b) => {
      b.onclick = () => confirmBox('确定删除这条记录吗？删除后不可恢复。', async () => {
        await del(cfg.api + '/' + b.dataset.del); toast('已删除'); listPage(key);
      });
    });
  }

  /* ---------- 通用表单弹窗 ---------- */
  async function formPage(key, row) {
    const cfg = CFG[key];
    const isEdit = !!row;
    const body = cfg.fields.map((f) => {
      if (f.type === 'list' && f.fields.length === 1) {
        // 单字段列表：存字符串数组，做适配
        const arr = Array.isArray(row && row[f.k]) ? row[f.k] : [];
        const val = arr.map((x) => (typeof x === 'string' ? { t: x } : x));
        return `<div class="f-row"><label>${f.t}</label><div>${fieldHtml(Object.assign({}, f, { fields: [{ k: 't', t: f.fields[0].t }] }), val)}</div></div>`;
      }
      return `<div class="f-row"><label>${f.t}</label><div>${fieldHtml(f, row ? row[f.k] : (f.type === 'select' ? (f.opts[0][0] ?? '') : ''))}</div></div>`;
    }).join('');

    const m = modal(isEdit ? '编辑' + cfg.title : '新增' + cfg.title, body,
      `<button class="btn" onclick="this.closest('.mask').remove()">取消</button>
       <button class="btn btn-primary" id="btnSave">保存</button>`);

    // 动态行按钮
    m.querySelectorAll('.addRow').forEach((b) => {
      b.onclick = () => {
        const wrap = b.previousElementSibling;
        const f = cfg.fields.find((x) => x.type === 'list');
        wrap.insertAdjacentHTML('beforeend', listRowHtml(f, {}));
      };
    });
    m.querySelectorAll('.addKv').forEach((b) => b.onclick = () => b.previousElementSibling.insertAdjacentHTML('beforeend', kvRowHtml({})));
    m.querySelectorAll('.addColor').forEach((b) => b.onclick = () => b.previousElementSibling.insertAdjacentHTML('beforeend', colorRowHtml({ name: '', hex: '#cccccc' })));
    m.querySelectorAll('input.up').forEach((inp) => {
      inp.onchange = async () => {
        if (!inp.files[0]) return;
        try { const url = await upload(inp.files[0]); const t = inp.parentNode.querySelector('input[type=text]'); t.value = url; const p = inp.parentNode.parentNode.querySelector('.img-prev'); if (p) { p.src = url; p.style.display = 'block'; } toast('上传成功'); }
        catch (e) { toast(e.message); }
      };
    });

    m.querySelector('#btnSave').onclick = async () => {
      const data = collectForm(m.querySelector('.bd'), cfg.fields);
      const req = cfg.fields.find((f) => f.req);
      if (req && !data[req.k]) return toast('请填写「' + req.t + '」');
      // 单字段 list 转字符串数组
      cfg.fields.forEach((f) => {
        if (f.type === 'list' && f.fields.length === 1 && Array.isArray(data[f.k])) data[f.k] = data[f.k].map((x) => x.t).filter(Boolean);
      });
      try {
        if (isEdit) await put(cfg.api + '/' + row.id, data);
        else await post(cfg.api, data);
        toast('保存成功'); closeModal(); listPage(key);
      } catch (e) { toast(e.message); }
    };
  }

  /* ---------- 仪表盘 ---------- */
  async function dashboard() {
    const s = await get('/api/stats');
    const st = Object.entries(s.byStatus || {}).map(([k, v]) => `<span class="tag">${esc(k)} ${v}</span>`).join(' ');
    document.getElementById('view').innerHTML = `
      <div class="note">数据与前台实时联动：后台保存后，前台页面刷新即可看到最新内容。前台入口：<a href="/" target="_blank" style="color:var(--brand);text-decoration:underline">打开网站首页</a></div>
      <div class="stat-grid">
        <div class="stat"><b>${s.products}</b><span>产品总数</span></div>
        <div class="stat"><b>${s.cases}</b><span>案例总数</span></div>
        <div class="stat"><b>${s.news}</b><span>资讯总数</span></div>
        <div class="stat"><b>${s.dealers}</b><span>合作运营商</span></div>
        <div class="stat"><b>${s.leads}</b><span>客户线索</span></div>
        <div class="stat"><b>${s.leadsToday}</b><span>今日新增线索</span></div>
      </div>
      <div class="card"><h3>线索状态分布</h3><div>${st || '<span class="muted">暂无</span>'}</div></div>
      <div class="grid2" style="display:grid;grid-template-columns:1fr 1fr;gap:18px">
        <div class="card"><h3>最新线索</h3>
          ${(s.latestLeads || []).length ? `<table class="tbl"><tbody>${s.latestLeads.map((l) => `<tr>
            <td><b>${esc(l.name)}</b><br><span style="color:#9096a0;font-size:12px">${esc(l.type)} · ${esc(l.city || '')}</span></td>
            <td>${esc(l.phone)}</td><td><span class="tag ${l.status === '未处理' ? 'off' : 'on'}">${esc(l.status)}</span></td>
            <td style="color:#9096a0;font-size:12px">${new Date(l.createdAt).toLocaleDateString()}</td></tr>`).join('')}</tbody></table>` : '<div class="empty">暂无线索</div>'}
          <div style="margin-top:12px"><a class="btn btn-sm" href="#/leads">查看全部线索</a></div>
        </div>
        <div class="card"><h3>最新资讯</h3>
          ${(s.latestNews || []).length ? `<table class="tbl"><tbody>${s.latestNews.map((n) => `<tr><td><b>${esc(n.title)}</b></td><td style="width:100px;color:#9096a0;font-size:12px">${esc(n.date)}</td></tr>`).join('')}</tbody></table>` : '<div class="empty">暂无</div>'}
          <div style="margin-top:12px"><a class="btn btn-sm" href="#/news">管理资讯</a></div>
        </div>
      </div>`;
  }

  /* ---------- 线索管理 ---------- */
  async function leadsPage() {
    const q = state.keywords;
    const r = await get('/api/leads?page=' + state.page + '&pageSize=15&keywords=' + encodeURIComponent(q) + (state.filter ? '&' + state.filter : ''));
    const rows = r.rows || [];
    document.getElementById('view').innerHTML = `<div class="card"><h3>线索与表单（共 ${r.total} 条）</h3>
      <div class="toolbar">
        <select id="fStatus"><option value="">全部状态</option>${['未处理', '跟进中', '已成交', '已关闭'].map((s) => `<option ${state.filter === 'status=' + encodeURIComponent(s) ? 'selected' : ''}>${s}</option>`).join('')}</select>
        <input id="kw" placeholder="搜索姓名 / 电话 / 城市" value="${esc(q)}" style="width:220px">
        <button class="btn" id="btnSearch">搜索</button>
        <div class="spacer"></div>
        <button class="btn" id="btnExportLeads">导出 CSV</button>
      </div>
      ${rows.length ? `<table class="tbl"><thead><tr><th>提交时间</th><th>类型</th><th>姓名</th><th>电话</th><th>城市 / 公司</th><th>意向</th><th>状态</th><th style="width:190px">操作</th></tr></thead><tbody>
        ${rows.map((l) => `<tr>
          <td style="font-size:12px;color:#9096a0">${new Date(l.createdAt).toLocaleString('zh-CN')}</td>
          <td><span class="tag">${esc(l.type || '')}</span></td>
          <td><b>${esc(l.name)}</b></td>
          <td>${esc(l.phone)}</td>
          <td>${esc(l.city || '')} ${esc(l.company || '')}</td>
          <td style="font-size:12px;color:#5b6169">${esc(l.product || l.message || '').slice(0, 20)}</td>
          <td><span class="tag ${l.status === '未处理' ? 'off' : 'on'}">${esc(l.status || '未处理')}</span></td>
          <td>
            <select data-st="${l.id}" style="border:1px solid var(--line);padding:4px;border-radius:3px;font-size:12px">
              ${['未处理', '跟进中', '已成交', '已关闭'].map((s) => `<option ${l.status === s ? 'selected' : ''}>${s}</option>`).join('')}
            </select>
            <button class="btn btn-sm" data-view="${l.id}">详情</button>
            <button class="btn btn-sm btn-danger" data-del="${l.id}">删</button>
          </td></tr>`).join('')}
      </tbody></table>` : '<div class="empty">暂无线索</div>'}
      <div class="pager">${Array.from({ length: Math.max(1, Math.ceil(r.total / 15)) }, (_, i) => `<button class="${i + 1 === state.page ? 'on' : ''}" data-p="${i + 1}">${i + 1}</button>`).join('')}</div>
    </div>`;

    document.getElementById('btnSearch').onclick = () => { state.keywords = document.getElementById('kw').value; state.page = 1; leadsPage(); };
    document.getElementById('btnExportLeads').onclick = () => exportCsv('leads');
    document.getElementById('fStatus').onchange = (e) => { state.filter = e.target.value ? 'status=' + encodeURIComponent(e.target.value) : ''; state.page = 1; leadsPage(); };
    document.querySelectorAll('[data-p]').forEach((b) => b.onclick = () => { state.page = Number(b.dataset.p); leadsPage(); });
    document.querySelectorAll('[data-st]').forEach((s) => s.onchange = async () => { await put('/api/leads/' + s.dataset.st, { status: s.value }); toast('状态已更新'); });
    document.querySelectorAll('[data-del]').forEach((b) => b.onclick = () => confirmBox('确定删除该线索？', async () => { await del('/api/leads/' + b.dataset.del); toast('已删除'); leadsPage(); }));
    document.querySelectorAll('[data-view]').forEach((b) => b.onclick = () => {
      const l = rows.find((x) => String(x.id) === b.dataset.view);
      modal('线索详情', `
        <div class="f-row"><label>姓名</label><div>${esc(l.name)}　${esc(l.phone)}</div></div>
        <div class="f-row"><label>类型</label><div>${esc(l.type || '')}　${esc(l.city || '')}　${esc(l.company || '')}</div></div>
        <div class="f-row"><label>意向产品</label><div>${esc(l.product || '—')}</div></div>
        <div class="f-row"><label>留言</label><div>${esc(l.message || '—')}</div></div>
        <div class="f-row"><label>备注</label><div><textarea id="note">${esc(l.note || '')}</textarea></div></div>`,
        `<button class="btn" onclick="this.closest('.mask').remove()">关闭</button>
         <button class="btn btn-primary" id="saveNote">保存备注</button>`);
      document.querySelector('#saveNote').onclick = async () => {
        await put('/api/leads/' + l.id, { note: document.getElementById('note').value });
        toast('已保存'); closeModal();
      };
    });
  }

  /* ---------- 站点设置 ---------- */
  async function settingsPage() {
    const s = await get('/api/settings');
    const m = modal('站点设置', `
      <div class="f-row"><label>网站名称</label><div><input type="text" id="siteName" value="${esc(s.siteName)}"></div></div>
      <div class="f-row"><label>品牌标语</label><div><input type="text" id="slogan" value="${esc(s.slogan)}"></div></div>
      <div class="f-row"><label>服务热线</label><div><input type="text" id="hotline" value="${esc(s.hotline)}"></div></div>
      <div class="f-row"><label>备用电话</label><div><input type="text" id="phone2" value="${esc(s.phone2)}"></div></div>
      <div class="f-row"><label>邮箱</label><div><input type="text" id="email" value="${esc(s.email)}"></div></div>
      <div class="f-row"><label>公司地址</label><div><input type="text" id="address" value="${esc(s.address)}"></div></div>
      <div class="f-row"><label>工作时间</label><div><input type="text" id="workTime" value="${esc(s.workTime)}"></div></div>
      <div class="f-row"><label>ICP 备案</label><div><input type="text" id="icp" value="${esc(s.icp)}"></div></div>
      <div class="f-row"><label>版权主体</label><div><input type="text" id="copyright" value="${esc(s.copyright)}"></div></div>
      <div class="f-row"><label>公司简介</label><div><textarea id="about" style="min-height:120px">${esc(s.about)}</textarea></div></div>
      <div class="f-row"><label>数据指标</label><div><textarea id="stats" style="min-height:90px">${esc(JSON.stringify(s.stats || [], null, 1))}</textarea><div class="hint">JSON 数组：[{"num":"1919","label":"品牌创立年份"}]</div></div></div>
      <div class="f-row"><label>发展历程</label><div><textarea id="timeline" style="min-height:120px">${esc(JSON.stringify(s.timeline || [], null, 1))}</textarea><div class="hint">JSON 数组：[{"year":"1919","text":"……"}]</div></div></div>`,
      `<button class="btn" onclick="this.closest('.mask').remove()">取消</button><button class="btn btn-primary" id="saveSet">保存设置</button>`);
    m.querySelector('#saveSet').onclick = async () => {
      let stats = [], timeline = [];
      try { stats = JSON.parse(document.getElementById('stats').value); } catch (e) { return toast('数据指标 JSON 格式有误'); }
      try { timeline = JSON.parse(document.getElementById('timeline').value); } catch (e) { return toast('发展历程 JSON 格式有误'); }
      await put('/api/settings', {
        siteName: document.getElementById('siteName').value,
        slogan: document.getElementById('slogan').value,
        hotline: document.getElementById('hotline').value,
        phone2: document.getElementById('phone2').value,
        email: document.getElementById('email').value,
        address: document.getElementById('address').value,
        workTime: document.getElementById('workTime').value,
        icp: document.getElementById('icp').value,
        copyright: document.getElementById('copyright').value,
        about: document.getElementById('about').value,
        stats, timeline,
      });
      toast('设置已保存，前台刷新后生效'); closeModal();
    };
  }

  function passwordPage() {
    const m = modal('修改密码', `
      <div class="f-row"><label>原密码</label><div><input type="password" id="old"></div></div>
      <div class="f-row"><label>新密码</label><div><input type="password" id="np"></div></div>
      <div class="f-row"><label>确认新密码</label><div><input type="password" id="np2"></div></div>`,
      `<button class="btn" onclick="this.closest('.mask').remove()">取消</button><button class="btn btn-primary" id="ok">保存</button>`);
    m.querySelector('#ok').onclick = async () => {
      const o = document.getElementById('old').value, a = document.getElementById('np').value, b = document.getElementById('np2').value;
      if (a !== b) return toast('两次输入的新密码不一致');
      try { await put('/api/auth/password', { oldPassword: o, newPassword: a }); toast('密码已修改，请重新登录'); setTimeout(() => { localStorage.removeItem(TOKEN); location.reload(); }, 1200); }
      catch (e) { toast(e.message); }
    };
  }

  /* ---------- 路由 ---------- */
  const MENU = [
    { g: '概览' },
    { k: 'dashboard', t: '仪表盘' },
    { g: '内容管理' },
    { k: 'products', t: '产品中心' },
    { k: 'solutions', t: '解决方案' },
    { k: 'cases', t: '案例工程' },
    { k: 'news', t: '新闻资讯' },
    { g: '运营' },
    { k: 'dealers', t: '合作运营商' },
    { k: 'leads', t: '线索与表单' },
    { g: '系统' },
    { k: 'settings', t: '站点设置' },
  ];

  function shell(active, title) {
    app.innerHTML = `<div class="layout">
      <div class="side">
        <div class="logo"><b>quick-mix</b><span>快可美官网后台</span></div>
        <ul>${MENU.map((m) => m.g
          ? `<li class="grp">${m.g}</li>`
          : `<li><a href="#/${m.k}" class="${m.k === active ? 'on' : ''}">${m.t}</a></li>`).join('')}</ul>
      </div>
      <div class="main">
        <div class="top"><h1>${title}</h1>
          <div class="user">
            <a href="/" target="_blank">查看前台 ↗</a>
            <a href="#" id="btnPwd">修改密码</a>
            <span>${esc(localStorage.getItem(USER) || 'admin')}</span>
            <a href="#" id="btnOut">退出</a>
          </div>
        </div>
        <div class="content" id="view"></div>
      </div>
    </div>`;
    document.getElementById('btnOut').onclick = (e) => { e.preventDefault(); localStorage.removeItem(TOKEN); location.hash = ''; location.reload(); };
    document.getElementById('btnPwd').onclick = (e) => { e.preventDefault(); passwordPage(); };
  }

  async function route() {
    const k = (location.hash || '').replace('#/', '') || 'dashboard';
    if (k === 'dashboard') { shell('dashboard', '仪表盘'); await dashboard(); return; }
    if (k === 'leads') { shell('leads', '线索与表单'); state = { page: 1, pageSize: 15, keywords: '', filter: '' }; await leadsPage(); return; }
    if (k === 'settings') { shell('settings', '站点设置'); document.getElementById('view').innerHTML = '<div class="card"><h3>站点设置</h3><p class="muted">管理前台展示的公司信息、联系方式、数据指标与发展历程。</p><button class="btn btn-primary" id="openSet">编辑站点信息</button></div>'; document.getElementById('openSet').onclick = settingsPage; return; }
    if (CFG[k]) { shell(k, CFG[k].title); state = { page: 1, pageSize: CFG[k].pageSize || 10, keywords: '', filter: '' }; await listPage(k); return; }
    location.hash = '#/dashboard';
  }

  /* ---------- 登录 ---------- */
  function loginView() {
    app.innerHTML = `<div class="login"><div class="login-box">
      <h2><span class="mark">quick-mix</span> 后台管理</h2>
      <div class="sub">快可美官网内容管理系统 · 默认账号 admin / admin</div>
      <div class="f-row" style="grid-template-columns:1fr"><input type="text" id="u" value="admin" placeholder="账号"></div>
      <div class="f-row" style="grid-template-columns:1fr"><input type="password" id="p" value="admin" placeholder="密码"></div>
      <button class="btn btn-primary" id="go" style="width:100%;justify-content:center;padding:11px">登 录</button>
    </div></div>`;
    document.getElementById('go').onclick = async () => {
      try {
        const r = await post('/api/auth/login', { username: document.getElementById('u').value, password: document.getElementById('p').value });
        localStorage.setItem(TOKEN, r.token);
        localStorage.setItem(USER, r.user.name);
        safeRoute();
      } catch (e) { toast(e.message); }
    };
    document.getElementById('p').onkeydown = (e) => { if (e.key === 'Enter') document.getElementById('go').click(); };
  }

  /* ---------- 启动 ---------- */
  // 任何页面渲染异常都要看得见、能重试，避免「点了没反应」的静默失败
  async function safeRoute() {
    try { await route(); }
    catch (e) {
      const v = document.getElementById('view');
      if (v) v.innerHTML = `<div class="card"><h3>页面加载失败</h3>
        <p class="muted">${esc(e.message || '未知错误')}</p>
        <button class="btn btn-primary" id="retryBtn">重新加载</button></div>`;
      const rb = document.getElementById('retryBtn');
      if (rb) rb.onclick = safeRoute;
      toast('页面加载失败：' + (e.message || '未知错误'));
    }
  }

  // 路由监听必须在任何分支之前无条件注册：
  // 首次登录（本地无 token）时也要能响应左侧菜单的 hash 变化。
  window.addEventListener('hashchange', () => {
    if (localStorage.getItem(TOKEN)) safeRoute();
  });

  (async function boot() {
    const t = localStorage.getItem(TOKEN);
    if (!t) return loginView();
    try {
      await get('/api/auth/check');
      safeRoute();
    } catch (e) { localStorage.removeItem(TOKEN); loginView(); }
  })();
})();
