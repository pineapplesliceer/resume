/* ============================================================
   刘昕卓 · 个人简历  |  交互脚本
   1. 主题切换（记忆到 localStorage）
   2. 滚动入场动画 + 技能条动画
   3. 导航高亮当前区块
   4. 复制邮箱
   5. 打印 / 导出 PDF
   6. 视口信息上报（供移动端 / 桌面端验收核对）
   ============================================================ */
(function () {
  'use strict';

  var root = document.documentElement;
  var THEME_KEY = 'lxz-resume-theme';

  /* ---------- 1. 主题 ---------- */
  var themeBtn = document.getElementById('themeBtn');
  var themeIcon = document.getElementById('themeIcon');

  function applyTheme(theme) {
    root.setAttribute('data-theme', theme);
    if (themeIcon) themeIcon.textContent = theme === 'dark' ? '☀' : '☾';
    var meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.setAttribute('content', theme === 'dark' ? '#0f1319' : '#0f6fbe');
  }

  var saved = null;
  try { saved = localStorage.getItem(THEME_KEY); } catch (e) { /* 隐私模式忽略 */ }

  var prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
  applyTheme(saved || (prefersDark ? 'dark' : 'light'));

  if (themeBtn) {
    themeBtn.addEventListener('click', function () {
      var next = root.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
      applyTheme(next);
      try { localStorage.setItem(THEME_KEY, next); } catch (e) { /* 忽略 */ }
    });
  }

  /* ---------- 2. 入场动画与技能条 ---------- */
  var reduceMotion = window.matchMedia &&
                     window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  var revealTargets = document.querySelectorAll(
    '.card, .edu, .timeline__item, .certs, .facts, .contact__note, .section__title'
  );

  function fillBars(scope) {
    var bars = (scope || document).querySelectorAll('.bar__fill');
    Array.prototype.forEach.call(bars, function (el, i) {
      var level = el.getAttribute('data-level') || '0';
      window.setTimeout(function () { el.style.width = level + '%'; }, i * 90);
    });
  }

  if (reduceMotion || !('IntersectionObserver' in window)) {
    Array.prototype.forEach.call(revealTargets, function (el) { el.classList.add('is-in'); });
    fillBars(document);
  } else {
    Array.prototype.forEach.call(revealTargets, function (el) { el.classList.add('reveal'); });

    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('is-in');
        if (entry.target.closest && entry.target.closest('#skills')) fillBars(document);
        io.unobserve(entry.target);
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });

    Array.prototype.forEach.call(revealTargets, function (el) { io.observe(el); });

    // 首屏可能已在视口内，补一次
    window.setTimeout(function () {
      Array.prototype.forEach.call(revealTargets, function (el) {
        var r = el.getBoundingClientRect();
        if (r.top < window.innerHeight * 0.92) el.classList.add('is-in');
      });
    }, 120);
  }

  /* ---------- 3. 导航高亮 ---------- */
  var navLinks = Array.prototype.slice.call(document.querySelectorAll('.nav__links a'));
  var sections = navLinks
    .map(function (a) { return document.querySelector(a.getAttribute('href')); })
    .filter(Boolean);

  if (sections.length && 'IntersectionObserver' in window) {
    var spy = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        navLinks.forEach(function (a) {
          var on = a.getAttribute('href') === '#' + entry.target.id;
          a.style.color = on ? 'var(--brand)' : '';
          a.style.background = on ? 'var(--brand-soft)' : '';
        });
      });
    }, { rootMargin: '-45% 0px -50% 0px' });
    sections.forEach(function (s) { spy.observe(s); });
  }

  /* ---------- 4. 复制邮箱 ---------- */
  var copyBtn = document.getElementById('copyBtn');
  var copyHint = document.getElementById('copyHint');

  function legacyCopy(text) {
    var ta = document.createElement('textarea');
    ta.value = text;
    ta.setAttribute('readonly', '');
    ta.style.position = 'fixed';
    ta.style.top = '-1000px';
    document.body.appendChild(ta);
    ta.select();
    var ok = false;
    try { ok = document.execCommand('copy'); } catch (e) { ok = false; }
    document.body.removeChild(ta);
    return ok;
  }

  if (copyBtn && copyHint) {
    copyBtn.addEventListener('click', function () {
      var email = copyBtn.getAttribute('data-email') || '';
      function done(ok) {
        copyHint.textContent = ok ? '已复制：' + email : '复制失败，请手动选择邮箱地址：' + email;
        window.setTimeout(function () { copyHint.textContent = ''; }, 3200);
      }
      if (navigator.clipboard && window.isSecureContext) {
        navigator.clipboard.writeText(email).then(
          function () { done(true); },
          function () { done(legacyCopy(email)); }
        );
      } else {
        done(legacyCopy(email));
      }
    });
  }

  /* ---------- 5. 打印 ---------- */
  var printBtn = document.getElementById('printBtn');
  if (printBtn) {
    printBtn.addEventListener('click', function () { window.print(); });
  }

  /* ---------- 6. 视口自检（验收辅助） ---------- */
  var yearEl = document.getElementById('year');
  if (yearEl) yearEl.textContent = String(new Date().getFullYear());

  var checkEl = document.getElementById('selfCheck');

  function reportViewport() {
    var de = document.documentElement;
    var w = window.innerWidth;
    var overflow = de.scrollWidth - de.clientWidth;
    var mode = w <= 768 ? '移动端' : '桌面端';
    de.setAttribute('data-mode', w <= 768 ? 'mobile' : 'desktop');

    if (checkEl) {
      checkEl.textContent =
        '自检：视口 ' + w + 'px · ' + mode +
        ' · ' + (overflow > 1 ? '存在横向溢出 ' + overflow + 'px ✕' : '无横向溢出 ✓');
      checkEl.style.color = overflow > 1 ? '#d92d20' : 'var(--ok)';
    }

    if (window.console && console.log) {
      console.log('[resume] viewport=%dpx mode=%s overflowX=%dpx', w, mode, overflow);
    }
  }

  reportViewport();
  window.addEventListener('resize', reportViewport, { passive: true });
  window.addEventListener('orientationchange', function () {
    window.setTimeout(reportViewport, 260);
  });
})();
