/**
 * 前台公共组件：顶部导航、页脚、卡片渲染、分页、提示
 * 各页面只需 <div id="header"></div> + <div id="footer"></div>
 */
(function () {
  const NAV = [
    {
      key: 'about', text: '关于我们', href: 'about.html',
      sub: [
        { text: '快可美中国简介', href: 'about.html' },
        { text: '发展历程', href: 'about.html#history' },
        { text: '关于西伟德', href: 'sievert.html' },
      ],
    },
    {
      key: 'home', text: '家装领域', href: 'home-field.html',
      sub: [
        { text: '家装解决方案', href: 'home-field.html#solution' },
        { text: '家装产品中心', href: 'products.html?group=home' },
      ],
    },
    {
      key: 'building', text: '建筑领域', href: 'building.html',
      sub: [
        { text: '建筑解决方案', href: 'building.html#solution' },
        { text: '建筑产品中心', href: 'products.html?group=building' },
      ],
    },
    {
      key: 'products', text: '产品中心', href: 'products.html',
      sub: [
        { text: '美缝系统', href: 'products.html?category=meifeng' },
        { text: '瓷砖与石材粘贴', href: 'products.html?category=dizhuan' },
        { text: '防水系统', href: 'products.html?category=fangshui' },
        { text: '砂浆与腻子', href: 'products.html?category=shajiang' },
        { text: '涂料系统', href: 'products.html?category=tuliao' },
        { text: '地坪系统', href: 'products.html?category=diping' },
      ],
    },
    {
      key: 'cases', text: '应用案例', href: 'cases.html',
      sub: [
        { text: '公共建筑', href: 'cases.html?category=public' },
        { text: '教育领域', href: 'cases.html?category=education' },
        { text: '商业文化', href: 'cases.html?category=business' },
        { text: '住宅项目', href: 'cases.html?category=residential' },
        { text: '工业厂房', href: 'cases.html?category=industrial' },
        { text: '海外项目', href: 'cases.html?category=overseas' },
      ],
    },
    {
      key: 'news', text: '新闻资讯', href: 'news.html',
      sub: [
        { text: '公司动态', href: 'news.html?category=公司动态' },
        { text: '新品发布', href: 'news.html?category=新品发布' },
        { text: '展会活动', href: 'news.html?category=展会活动' },
        { text: '工程荣誉', href: 'news.html?category=工程荣誉' },
      ],
    },
    {
      key: 'service', text: '服务支持', href: 'service.html',
      sub: [
        { text: '施工教程', href: 'service.html#tech' },
        { text: '常见问题', href: 'service.html#faq' },
        { text: '资料下载', href: 'service.html#download' },
      ],
    },
    { key: 'dealers', text: '合作伙伴', href: 'dealers.html' },
    { key: 'contact', text: '联系我们', href: 'contact.html' },
  ];

  const FOOTER_LINKS = [
    {
      title: '产品中心',
      links: [
        { t: '美缝系统', h: 'products.html?category=meifeng' },
        { t: '瓷砖与石材粘贴', h: 'products.html?category=dizhuan' },
        { t: '防水系统', h: 'products.html?category=fangshui' },
        { t: '砂浆与腻子', h: 'products.html?category=shajiang' },
        { t: '涂料系统', h: 'products.html?category=tuliao' },
      ],
    },
    {
      title: '解决方案',
      links: [
        { t: '家装领域', h: 'home-field.html' },
        { t: '建筑领域', h: 'building.html' },
        { t: '应用案例', h: 'cases.html' },
        { t: '合作运营商', h: 'dealers.html' },
      ],
    },
    {
      title: '关于我们',
      links: [
        { t: '快可美中国简介', h: 'about.html' },
        { t: '发展历程', h: 'about.html#history' },
        { t: '关于西伟德', h: 'sievert.html' },
        { t: '新闻资讯', h: 'news.html' },
        { t: '联系我们', h: 'contact.html' },
      ],
    },
  ];

  function esc(s) {
    return String(s === undefined || s === null ? '' : s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  }
  const imgOf = (p) => (p && p.img ? (p.img.startsWith('http') || p.img.startsWith('/') ? p.img : 'assets/img/product/' + p.img) : 'assets/img/placeholder.svg');

  /* ---------- 卡片模板 ---------- */
  const UI = {
    esc, imgOf,

    productCard(p) {
      const tag = (p.tags && p.tags[0]) || '';
      return `<a class="card" href="product.html?id=${p.id}">
        <div class="thumb">
          <img src="${imgOf(p)}" alt="${esc(p.name)}" onerror="this.onerror=null;this.src='assets/img/placeholder.svg'">
          ${tag ? `<span class="tag">${esc(tag)}</span>` : ''}
          <button class="cmp" data-cmp="${p.id}" title="加入对比" type="button"><i></i>对比</button>
        </div>
        <div class="body">
          <h3>${esc(p.name)}</h3>
          <div class="model">${esc(p.model || '')} · ${esc(p.spec || '')}</div>
          <p class="desc">${esc(p.summary || '')}</p>
          ${p.colors && p.colors.length ? `<div class="colors">${p.colors.slice(0, 8).map((c) => `<i style="background:${c.hex}" title="${esc(c.name)}"></i>`).join('')}</div>` : ''}
          <div class="foot">查看详情 →</div>
        </div>
      </a>`;
    },

    caseItem(c) {
      const CAT = { public: '公共建筑', education: '教育领域', business: '商业文化', residential: '住宅项目', industrial: '工业厂房', overseas: '海外项目' };
      const cover = c.cover ? (c.cover.startsWith('http') || c.cover.startsWith('/') ? c.cover : 'assets/img/case/' + c.cover) : 'assets/img/placeholder.svg';
      return `<a class="case-item" href="case.html?id=${c.id}">
        <img src="${cover}" alt="${esc(c.title)}" onerror="this.onerror=null;this.src='assets/img/placeholder.svg'">
        <span class="case-cat">${CAT[c.category] || '应用案例'}</span>
        <div class="mask">
          <h3>${esc(c.title)}</h3>
          <span>${esc(c.location || '')}${c.area ? ' · ' + esc(c.area) : ''}</span>
        </div>
      </a>`;
    },

    newsItem(n) {
      const cover = n.cover ? (n.cover.startsWith('http') || n.cover.startsWith('/') ? n.cover : 'assets/img/news/' + n.cover) : 'assets/img/placeholder.svg';
      return `<a class="news-item" href="news-detail.html?id=${n.id}">
        <div class="nc"><img src="${cover}" alt="${esc(n.title)}" onerror="this.onerror=null;this.src='assets/img/placeholder.svg'"></div>
        <div>
          <h3>${n.pinned ? '<span class="text-brand">[置顶]</span> ' : ''}${esc(n.title)}</h3>
          <div class="meta">${esc(n.category || '资讯')} · ${esc(n.date || '')} · ${n.views || 0} 次阅读</div>
          <p class="sum">${esc(n.summary || '')}</p>
        </div>
      </a>`;
    },

    dealerItem(d) {
      return `<div class="dealer-item">
        <h4>${esc(d.name)}<span class="tp">${esc(d.type || '经销商')}</span></h4>
        <p>${esc(d.province || '')} ${esc(d.city || '')} · ${esc(d.address || '')}</p>
        <p>联系人：${esc(d.contact || '—')}　电话：${esc(d.phone || '—')}</p>
      </div>`;
    },

    solItem(s, i) {
      return `<div class="sol-item">
        <div class="idx">${String(i + 1).padStart(2, '0')}</div>
        <div>
          <h3>${esc(s.name)}</h3>
          <div class="feat">${(s.features || []).map((f) => `<span>${esc(f)}</span>`).join('')}</div>
          <p class="muted" style="font-size:13px;margin:10px 0 0">${esc(s.content || '')}</p>
        </div>
      </div>`;
    },

    pager(total, page, pageSize, onGo) {
      const pages = Math.max(1, Math.ceil(total / pageSize));
      if (pages <= 1) return '';
      let html = `<button ${page <= 1 ? 'disabled' : ''} data-p="${page - 1}">上一页</button>`;
      for (let i = 1; i <= pages; i++) {
        if (pages > 8 && i > 2 && i < pages - 1 && Math.abs(i - page) > 2) {
          if (i === 3) html += '<button disabled>…</button>';
          continue;
        }
        html += `<button class="${i === page ? 'on' : ''}" data-p="${i}">${i}</button>`;
      }
      html += `<button ${page >= pages ? 'disabled' : ''} data-p="${page + 1}">下一页</button>`;
      const el = document.createElement('div');
      el.className = 'pager';
      el.innerHTML = html;
      el.querySelectorAll('button[data-p]').forEach((b) => {
        b.onclick = () => onGo(Number(b.dataset.p));
      });
      return el.outerHTML;
    },

    toast(msg) {
      let t = document.querySelector('.toast');
      if (!t) { t = document.createElement('div'); t.className = 'toast'; document.body.appendChild(t); }
      t.textContent = msg;
      t.style.display = 'block';
      clearTimeout(t._timer);
      t._timer = setTimeout(() => { t.style.display = 'none'; }, 2600);
    },

    param(key, def) {
      const v = new URLSearchParams(location.search).get(key);
      return v === null ? def : v;
    },
  };

  /* ---------- 挂载导航与页脚 ---------- */
  async function mount(active) {
    const s = (window.QM && (await window.QM.settings())) || {};
    const header = document.getElementById('header');
    if (header) {
      header.innerHTML = `
      <div class="topbar">
        <div class="wrap">
          <div class="left">${esc(s.slogan || '源自 1919 德国 · 全屋缝隙美学系统')}</div>
          <div class="right">
            <span>服务热线：<b>${esc(s.hotline || '400-082-5822')}</b></span>
            <span><a href="dealers.html">查找当地服务商</a></span>
            <span><a href="contact.html">经销商加盟</a></span>
          </div>
        </div>
      </div>
      <div class="nav">
        <div class="nav-inner">
          <a class="logo" href="index.html">
            <span class="mark">quick-mix</span>
            <span>
              <span class="cn">快可美</span><br>
              <span class="en">SINCE 1919 GERMANY</span>
            </span>
          </a>
          <ul class="menu" id="menu">
            ${NAV.map((n) => `<li class="${n.key === active ? 'on' : ''}">
              <a href="${n.href}">${n.text}</a>
              ${n.sub ? `<div class="submenu">${n.sub.map((x) => `<a href="${x.href}">${x.text}</a>`).join('')}</div>` : ''}
            </li>`).join('')}
          </ul>
          <a class="nav-cta" href="contact.html">获取产品报价</a>
          <button class="burger" id="burger"><i></i><i></i><i></i></button>
        </div>
      </div>`;
      const burger = document.getElementById('burger');
      const menu = document.getElementById('menu');
      if (burger && menu) burger.onclick = () => menu.classList.toggle('open');
    }

    const footer = document.getElementById('footer');
    if (footer) {
      footer.innerHTML = `
      <div class="footer">
        <div class="wrap">
          <div class="cols">
            <div>
              <h4>${esc(s.copyright || '西伟德宝业快可美建筑材料（合肥）有限公司')}</h4>
              <p style="max-width:320px">${esc((s.about || '').slice(0, 110))}…</p>
              <p class="muted">${esc(s.address || '')}</p>
            </div>
            ${FOOTER_LINKS.map((c) => `<div><h4>${c.title}</h4><ul>${c.links.map((l) => `<li><a href="${l.h}">${l.t}</a></li>`).join('')}</ul></div>`).join('')}
            <div class="contact">
              <h4>联系我们</h4>
              <p><b>${esc(s.hotline || '400-082-5822')}</b></p>
              <p>${esc(s.phone2 || '')}</p>
              <p>${esc(s.email || '')}</p>
              <p>${esc(s.workTime || '')}</p>
              <p><a class="btn btn-primary" style="margin-top:12px" href="contact.html">在线咨询</a></p>
            </div>
          </div>
          <div class="bottom">
            <span>© ${new Date().getFullYear()} ${esc(s.copyright || '快可美 quick-mix')}　${esc(s.icp || '')}</span>
            <span><a href="https://www.quick-mix.com.cn/" target="_blank" rel="noreferrer">品牌官网</a> · <a href="admin/" target="_blank">网站后台</a></span>
          </div>
        </div>
      </div>`;
    }
    document.title = (document.title || '') + '';

    // 内页头部：大号英文水印，消除面包屑到标题之间的空洞感
    const CRUMB_WM = {
      'about.html': 'ABOUT US', 'sievert.html': 'SIEVERT GROUP',
      'home-field.html': 'HOME SOLUTIONS', 'building.html': 'BUILDING SYSTEMS',
      'products.html': 'PRODUCT CENTER', 'product.html': 'PRODUCT DETAIL',
      'cases.html': 'APPLICATION CASES', 'case.html': 'CASE STUDY',
      'news.html': 'NEWS & EVENTS', 'news-detail.html': 'NEWS',
      'service.html': 'SERVICE & SUPPORT', 'dealers.html': 'PARTNERS',
      'contact.html': 'CONTACT US', 'index.html': 'QUICK-MIX'
    };
    const _crumb = document.querySelector('.crumb');
    const _wm = CRUMB_WM[(location.pathname.split('/').pop() || 'index.html')];
    if (_crumb && _wm && !_crumb.querySelector('.crumb-wm')) {
      _crumb.insertAdjacentHTML('afterbegin', '<div class="crumb-wm">' + _wm + '</div>');
    }

    // 全站动效与控件：滚动入场、数字滚动、进度条、悬浮客服、返回顶部、图片灯箱
    if (window.QMMotion) QMMotion.init();
  }

  UI.motion = window.QMMotion;
  window.QMUI = UI;
  window.QMMount = mount;
})();
