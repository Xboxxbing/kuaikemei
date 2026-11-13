/**
 * 全站动效与交互控件
 * 在 layout.js 的 QMMount() 之后自动初始化，所有页面通用。
 * 内容异步渲染后调用 QMUI.motion.refresh() 重新绑定即可。
 */
(function () {
  const M = { inited: false };
  const q = (sel, root) => Array.from((root || document).querySelectorAll(sel));
  const prefersReduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ========== 1. 滚动入场动画 ========== */
  // 只给"内容块"做入场动画，不给 .section 这类大容器加，避免父子位移叠加
  const REVEAL_SEL = '.sec-head, .card, .case-item, .news-item, .entry, .sol-item, .stat, .cert, .brand-card, .dealer-item, .tech-card, .app-grid a, .pillar > div, .timeline li, .feat-list li, .info-card, .dl-list a, .steps li, .tilemap, .case-info, .swatch, .filters, .about-grid > div, .contact-grid > div';
  let io = null;

  function markReveal(root) {
    q(REVEAL_SEL, root).forEach((el) => {
      if (el.dataset.revealed) return;
      // 已可见的首屏内容不隐藏，避免闪烁
      const r = el.getBoundingClientRect();
      if (r.top < window.innerHeight * 0.9 && r.top > -50) {
        el.dataset.revealed = '1';
        return;
      }
      el.classList.add('reveal');
      el.dataset.revealed = '1';
    });
  }

  function observe() {
    if (prefersReduce) { q('.reveal').forEach((e) => e.classList.add('in')); return; }
    if (!io) {
      io = new IntersectionObserver((entries) => {
        entries.forEach((e) => {
          if (!e.isIntersecting) return;
          const el = e.target;
          // 同组元素依次入场
          const sibs = Array.from(el.parentNode ? el.parentNode.children : []).filter((c) => c.classList.contains('reveal'));
          const idx = Math.max(0, sibs.indexOf(el));
          el.style.transitionDelay = Math.min(idx * 70, 420) + 'ms';
          el.classList.add('in');
          io.unobserve(el);
        });
      }, { threshold: 0.08, rootMargin: '0px 0px -40px 0px' });
    }
    q('.reveal:not(.in)').forEach((el) => io.observe(el));
  }

  /* ========== 2. 数字滚动 ========== */
  function countUp(el) {
    const txt = el.textContent.trim();
    if (el.dataset.counted || !/\d/.test(txt)) return;
    el.dataset.counted = '1';
    if (prefersReduce) return;
    const m = txt.match(/^([^\d]*)(\d+(?:\.\d+)?)(.*)$/);
    if (!m) return;
    const pre = m[1], num = parseFloat(m[2]), suf = m[3];
    const dur = 1400, start = performance.now();
    const dec = (String(m[2]).split('.')[1] || '').length;
    function step(now) {
      const t = Math.min(1, (now - start) / dur);
      const eased = 1 - Math.pow(1 - t, 3);
      el.textContent = pre + (num * eased).toFixed(dec).replace(/\.0+$/, '') + suf;
      if (t < 1) requestAnimationFrame(step);
      else el.textContent = txt;
    }
    el.textContent = pre + '0' + suf;
    requestAnimationFrame(step);
  }
  let countIo = null;
  function bindCounters(root) {
    const els = q('[data-count], .hero-stats b, .stat b, .cert b, .entry .num, .case-info span, .steps b', root);
    if (!els.length) return;
    if (prefersReduce) return;
    if (!countIo) {
      countIo = new IntersectionObserver((es) => es.forEach((e) => { if (e.isIntersecting) { countUp(e.target); countIo.unobserve(e.target); } }), { threshold: 0.4 });
    }
    els.forEach((el) => { if (!el.dataset.counted) countIo.observe(el); });
  }

  /* ========== 3. 顶部滚动进度条 ========== */
  function progressBar() {
    if (document.getElementById('qmProgress')) return;
    const bar = document.createElement('div');
    bar.id = 'qmProgress';
    document.body.appendChild(bar);
    const nav = document.querySelector('.nav');
    let ticking = false;
    const upd = () => {
      const h = document.documentElement.scrollHeight - window.innerHeight;
      const p = h > 0 ? (window.scrollY / h) * 100 : 0;
      bar.style.width = p + '%';
      if (nav) nav.classList.toggle('scrolled', window.scrollY > 40);
      ticking = false;
    };
    window.addEventListener('scroll', () => { if (!ticking) { ticking = true; requestAnimationFrame(upd); } }, { passive: true });
    upd();
  }

  /* ========== 4. 返回顶部 + 右侧悬浮控件 ========== */
  function widgets() {
    if (document.getElementById('qmWidgets')) return;
    const box = document.createElement('div');
    box.id = 'qmWidgets';
    box.innerHTML = `
      <div class="qm-w" id="qmService" title="在线咨询">
        <svg viewBox="0 0 24 24" width="22" height="22"><path fill="currentColor" d="M12 2a9 9 0 0 0-9 9v5a3 3 0 0 0 3 3h1v-8H5v5a1 1 0 0 1-1-1v-4a8 8 0 0 1 16 0v4a1 1 0 0 1-1 1h-1v-8h-2v8h-2v-8h-2v8H9V11a3 3 0 0 1 3-3z"/></svg>
        <span>咨询</span>
      </div>
      <div class="qm-panel" id="qmPanel">
        <div class="hd">快可美在线服务<i id="qmPanelClose">×</i></div>
        <div class="bd">
          <p><b>服务热线</b><br><a class="tel" href="tel:4000825822">400-082-5822</a></p>
          <p><b>商务电话</b><br><a class="tel" href="tel:02164401136">021-64401136</a></p>
          <p><b>服务时间</b><br>周一至周五 8:30 - 17:30</p>
          <a class="btn btn-primary" href="contact.html">在线提交需求</a>
          <a class="btn btn-line" href="dealers.html">查找当地服务商</a>
        </div>
      </div>
      <div class="qm-w" id="qmTop" title="返回顶部">
        <svg viewBox="0 0 24 24" width="20" height="20"><path fill="currentColor" d="M12 4l8 8h-5v8H9v-8H4z"/></svg>
      </div>`;
    document.body.appendChild(box);

    const panel = document.getElementById('qmPanel');
    document.getElementById('qmService').onclick = () => panel.classList.toggle('open');
    document.getElementById('qmPanelClose').onclick = () => panel.classList.remove('open');
    const top = document.getElementById('qmTop');
    top.onclick = () => window.scrollTo({ top: 0, behavior: 'smooth' });
    const onScroll = () => {
      const show = window.scrollY > 500;
      top.classList.toggle('show', show);
      box.classList.toggle('show', window.scrollY > 300);
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
  }

  /* ========== 5. 图片灯箱 ========== */
  let lbItems = [], lbIdx = 0;
  function lightbox() {
    if (document.getElementById('qmLightbox')) return;
    const el = document.createElement('div');
    el.id = 'qmLightbox';
    el.innerHTML = `<i class="x" id="lbX">×</i><i class="ar prev" id="lbPrev">‹</i><i class="ar next" id="lbNext">›</i>
      <div class="lb-inner"><img id="lbImg" src="" alt=""><div class="cap" id="lbCap"></div><div class="cnt" id="lbCnt"></div></div>`;
    document.body.appendChild(el);
    const close = () => el.classList.remove('open');
    document.getElementById('lbX').onclick = close;
    el.onclick = (e) => { if (e.target === el) close(); };
    document.getElementById('lbPrev').onclick = (e) => { e.stopPropagation(); go(-1); };
    document.getElementById('lbNext').onclick = (e) => { e.stopPropagation(); go(1); };
    document.addEventListener('keydown', (e) => {
      if (!el.classList.contains('open')) return;
      if (e.key === 'Escape') close();
      if (e.key === 'ArrowLeft') go(-1);
      if (e.key === 'ArrowRight') go(1);
    });
    function go(d) {
      if (!lbItems.length) return;
      lbIdx = (lbIdx + d + lbItems.length) % lbItems.length;
      const it = lbItems[lbIdx];
      document.getElementById('lbImg').src = it.src;
      document.getElementById('lbCap').textContent = it.cap || '';
      document.getElementById('lbCnt').textContent = lbItems.length > 1 ? (lbIdx + 1) + ' / ' + lbItems.length : '';
    }
    M._lbGo = go;
  }

  function bindLightbox(root) {
    // 注意：用 .gallery > img 只取主图，避免与详情页缩略图切换冲突
    const imgs = q('.card .thumb img, .case-item img, .detail .gallery > img, .app-grid img, .article .cover img, .tech-card .t img, [data-lightbox]', root)
      .filter((i) => !i.closest('.thumbs'));
    imgs.forEach((img) => {
      if (img.dataset.lb) return;
      img.dataset.lb = '1';
      img.style.cursor = 'zoom-in';
      img.onclick = (e) => {
        e.preventDefault();
        const group = img.closest('.grid-4, .grid-3, .gallery, .app-grid, .cover') || document;
        lbItems = q('img', group).filter((i) => !i.closest('.thumbs'))
          .map((i) => ({ src: i.currentSrc || i.src, cap: i.alt || '' }));
        lbIdx = Math.max(0, lbItems.findIndex((x) => x.src === (img.currentSrc || img.src)));
        const el = document.getElementById('qmLightbox');
        el.classList.add('open');
        M._lbGo(0);
      };
    });
  }

  /* ========== 6. Hero 视差 + 标题入场 ========== */
  function heroFx() {
    const hero = document.querySelector('.hero');
    if (!hero) return;
    // 轮播型 hero 由 slider 自己控制入场动画
    if (!hero.classList.contains('slider')) hero.classList.add('hero-anim');
    if (prefersReduce) return;
    let ticking = false;
    window.addEventListener('scroll', () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        const y = window.scrollY;
        if (y < window.innerHeight * 1.2) {
          hero.style.setProperty('--py', (y * 0.28).toFixed(1) + 'px');
          const inner = hero.querySelector('.wrap');
          if (inner) inner.style.opacity = Math.max(0, 1 - y / (window.innerHeight * 0.75));
        }
        ticking = false;
      });
    }, { passive: true });
  }

  /* ========== 7. 卡片鼠标跟随光晕（仅 PC） ========== */
  function cardGlow() {
    if (prefersReduce || !window.matchMedia('(hover: hover)').matches) return;
    document.addEventListener('mousemove', (e) => {
      const card = e.target.closest && e.target.closest('.card, .entry');
      if (!card) return;
      const r = card.getBoundingClientRect();
      card.style.setProperty('--mx', ((e.clientX - r.left) / r.width * 100).toFixed(1) + '%');
      card.style.setProperty('--my', ((e.clientY - r.top) / r.height * 100).toFixed(1) + '%');
    }, { passive: true });
  }

  /* ========== 8. 平滑锚点 ========== */
  function smoothAnchor() {
    document.addEventListener('click', (e) => {
      const a = e.target.closest && e.target.closest('a[href^="#"]');
      if (!a) return;
      const id = a.getAttribute('href').slice(1);
      if (!id) return;
      const t = document.getElementById(id);
      if (!t) return;
      e.preventDefault();
      const top = t.getBoundingClientRect().top + window.scrollY - 90;
      window.scrollTo({ top, behavior: 'smooth' });
      history.replaceState(null, '', '#' + id);
    });
  }

  /* ========== 9. 图片懒加载 ========== */
  function lazy() {
    q('img:not([loading])').forEach((i) => { i.loading = 'lazy'; });
  }

  /* ========== 10. 页面切换淡入 ========== */
  function pageIn() {
    document.body.classList.add('qm-page-in');
  }

  /* ========== 统一入口 ========== */
  M.refresh = function (root) {
    markReveal(root || document);
    observe();
    bindCounters(root || document);
    bindLightbox(root || document);
    lazy();
  };

  M.init = function () {
    if (M.inited) return;
    M.inited = true;
    pageIn();
    progressBar();
    widgets();
    lightbox();
    heroFx();
    cardGlow();
    smoothAnchor();
    M.refresh();
    // 内容异步渲染完成后再扫一次
    setTimeout(() => M.refresh(), 400);
    setTimeout(() => M.refresh(), 1200);
    // 兜底：即使观察器未触发，也补上动画类（内容本就默认可见，此处仅保证动画完整）
    setTimeout(() => q('.reveal:not(.in)').forEach((el) => el.classList.add('in')), 3500);
    // DOM 新增节点自动接管
    if (window.MutationObserver) {
      let t = null;
      new MutationObserver(() => {
        clearTimeout(t);
        t = setTimeout(() => M.refresh(), 200);
      }).observe(document.body, { childList: true, subtree: true });
    }
  };

  window.QMMotion = M;
})();
