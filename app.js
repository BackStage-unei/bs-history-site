// BackStage のあゆみ。innerHTML は使わず el() / textContent だけで組み立てる
(function () {
  'use strict';
  const D = window.HISTORY_DATA;
  // 背景モード（埋め込み先に馴染ませる）。埋め込みの中では何も付けなくても透過（clear）。
  // ?bg=veil で半透明ベール、?bg=solid で濃い背景。直接開いたときはいつも濃い背景
  const bgParam = new URLSearchParams(location.search).get('bg');
  const bgMode = ['clear', 'veil', 'solid'].includes(bgParam) ? bgParam : 'clear';
  if (window.self !== window.top && bgMode !== 'solid') document.documentElement.dataset.bg = bgMode;
  const FINDER = 'https://back-stage.app/#searching'; // 活動中の人のリンク先（公式サイトのキャスト検索）

  function el(tag, cls, text) {
    const e = document.createElement(tag);
    if (cls) e.className = cls;
    if (text != null) e.textContent = text;
    return e;
  }
  const ymd = s => { const [y, m, d] = s.split('-').map(Number); return { y, m, d }; };
  const period = (a, b) => { const s = ymd(a), e = ymd(b); return `${s.y}.${s.m}.${s.d} – ${e.m}.${e.d}`; };

  // 人（アイコン＋名前）。活動中ならプロフィールへのリンク、活動終了はリンクなしで薄く
  function personEl(id, size) {
    const p = D.people[id];
    const wrap = p.active ? el('a', 'person') : el('div', 'person is-off');
    if (p.active) { wrap.href = FINDER; wrap.target = '_top'; }
    wrap.classList.add('person--' + size);
    const av = el('span', 'avatar');
    if (p.icon) { const img = el('img'); img.src = p.icon; img.alt = ''; av.append(img); }
    else av.append(el('span', 'avatar__ini', p.name.slice(0, 1)));
    wrap.append(av, el('span', 'person__name', p.name));
    if (!p.active) wrap.append(el('span', 'person__off', '活動終了'));
    return wrap;
  }

  // 出来事のリンク（イベントページ・X のハッシュタグなど）。行き先は build で検査済み（https・決まったサイトだけ）
  function evLinks(links) {
    const wrap = el('span', 'ev__links');
    (links || []).forEach(l => {
      const a = el('a', 'ev__link', l.label + ' ↗');
      a.href = l.url;
      // 公式サイトのページは STUDIO ごと移動、外のサイトは新しいタブ
      if (new URL(l.url).hostname === 'back-stage.app') a.target = '_top';
      else { a.target = '_blank'; a.rel = 'noopener'; }
      wrap.append(a);
    });
    return wrap;
  }

  // 出来事のサムネイル。リンクがあれば先頭のリンク（イベントページ）へ
  function evImage(src, links) {
    const first = (links || [])[0];
    const box = first ? el('a', 'ev__img') : el('span', 'ev__img');
    if (first) {
      box.href = first.url;
      if (new URL(first.url).hostname === 'back-stage.app') box.target = '_top';
      else { box.target = '_blank'; box.rel = 'noopener'; }
    }
    const img = el('img'); img.src = src; img.alt = ''; img.loading = 'lazy';
    box.append(img);
    return box;
  }

  function tag(series) {
    const s = D.series[series];
    const t = el('span', 'tag', s.name);
    t.style.setProperty('--c', s.color);
    return t;
  }

  // ---- 年表 ----
  function renderTimeline(root) {
    const list = el('ol', 'tl');
    let year = '';
    D.timeline.slice().reverse().forEach(m => {
      const [y, mo] = m.ym.split('-');
      if (y !== year) { year = y; list.append(el('li', 'tl__year', y)); }
      const li = el('li', 'tl__item');
      li.style.setProperty('--c', D.series[m.series].color);
      li.append(el('span', 'tl__dot'));
      // 通話回数の節目は小さな1行、大会はカード。公式サイトにページがある回だけリンク
      if (m.series === 'app' && !m.note) {
        li.classList.add('tl__item--mini');
        li.append(el('span', 'tl__mini', `${Number(mo)}月　${m.title} 達成`));
        list.append(li);
        return;
      }
      const card = el(m.url ? 'a' : 'div', 'tl__card');
      if (m.url) { card.href = m.url; card.target = '_top'; }
      const head = el('div', 'tl__head');
      head.append(el('span', 'tl__month', Number(mo) + '月'), tag(m.series));
      card.append(head, el('h3', 'tl__title', m.title));
      if (m.note) card.append(el('p', 'tl__note', m.note));
      if (m.url) card.append(el('span', 'tl__more', 'くわしく見る ›'));
      li.append(card);
      list.append(li);
    });
    root.append(list);
  }

  // ---- ルーキーチャレンジ ----
  function renderRookie(root) {
    // ハブサイトの入口（最新回の告知画像を背景に）
    const HUB = 'https://bs-rookie-challenge.web.app/';
    const hub = el('a', 'hubcard');
    hub.href = HUB; hub.target = '_blank'; hub.rel = 'noopener';
    const bg = el('img', 'hubcard__bg'); bg.src = 'hub/hero.webp'; bg.alt = '';
    const inner = el('div', 'hubcard__in');
    const logo = el('img', 'hubcard__logo'); logo.src = 'hub/rc-logo.webp'; logo.alt = 'ROOKIE CHALLENGE';
    inner.append(logo,
      el('p', 'hubcard__lead', 'デビューしたての BSter が、毎月ここから羽ばたいていきます。'),
      el('p', 'hubcard__sub', `全${D.rookie.length}回の記録・参加者のプロフィール・最新回は公式ハブで`),
      el('span', 'hubcard__btn', 'ハブサイトを開く ↗'));
    hub.append(bg, inner);
    root.append(hub, el('p', 'intro', '回ごとにルールが変わってきたので、時代ごとに分けて載せています。サムネイルを押すと、その回のページが開きます。'));
    D.eras.slice().reverse().forEach(era => {
      const vols = D.rookie.filter(r => r.vol >= era.from && r.vol <= era.to).reverse();
      if (!vols.length) return;
      const sec = el('section', 'era');
      const h = el('h3', 'era__head');
      h.append(el('span', 'era__range', `vol.${era.from}${era.to < 999 ? '〜' + era.to : '〜'}`), el('span', 'era__rule', era.label));
      sec.append(h);
      vols.forEach(r => {
        if (r.vol < 12) { sec.append(compactRow(r)); return; }
        const row = el('article', 'vol');
        const meta = el('a', 'vol__meta');
        meta.href = r.url; meta.target = '_blank'; meta.rel = 'noopener';
        if (r.thumb) { const t = el('img', 'vol__thumb'); t.src = r.thumb; t.alt = `vol.${r.vol} の告知画像`; t.loading = 'lazy'; meta.append(t); }
        meta.append(el('span', 'vol__no', 'vol.' + r.vol), el('span', 'vol__date', period(r.start, r.end)),
          el('span', 'vol__n', `${r.entrants}人が挑戦`));
        const body = el('div', 'vol__body');
        // vol.12 以降は達成型で順位を付けない。賞の対象（優勝・BP最高得点）の1人だけを出す
        if (r.winners.length) {
          const w = el('div', 'award award--win');
          w.append(el('span', 'award__label', r.vol >= 14 ? 'BP最高得点' : '優勝'));
          r.winners.forEach(id => w.append(personEl(id, 'l')));
          body.append(w);
        }
        if (r.lvmax.length) {
          const m = el('div', 'award award--max');
          m.append(el('span', 'award__label', `${r.vol >= 14 ? 'Lv.MAX' : '30万BP'} 達成 ${r.lvmax.length}人`));
          const g = el('div', 'grid');
          r.lvmax.forEach(id => g.append(personEl(id, 's')));
          m.append(g);
          body.append(m);
        }
        row.append(meta, body);
        sec.append(row);
      });
      root.append(sec);
    });
  }

  // 順位バッジ付きの人（1〜3位）。BP も小さく添える
  function rankedPerson(t, rank, size) {
    const p = personEl(t.id, size);
    p.classList.add('rank-' + rank);
    p.querySelector('.avatar').append(el('span', 'rankbadge', String(rank)));
    p.append(el('span', 'person__bp', t.bp.toLocaleString('ja-JP') + ' BP'));
    return p;
  }

  // 順位争いの時代（vol.1〜11）は3位までを1行で（埋め込み枠の高さに収めるため）
  function compactRow(r) {
    const row = el('div', 'crow');
    const no = el('a', 'crow__vol');
    no.href = r.url; no.target = '_blank'; no.rel = 'noopener';
    if (r.thumb) { const t = el('img', 'crow__thumb'); t.src = r.thumb; t.alt = ''; t.loading = 'lazy'; no.append(t); }
    no.append(el('span', 'crow__no', 'vol.' + r.vol));
    row.append(no, el('span', 'crow__date', period(r.start, r.end)));
    const w = el('span', 'crow__win');
    r.top3.forEach((t, i) => {
      const p = D.people[t.id];
      const item = el('span', 'crow__p rank-' + (i + 1));
      const av = el('span', 'avatar avatar--xs');
      if (p.icon) { const img = el('img'); img.src = p.icon; img.alt = ''; av.append(img); }
      else av.append(el('span', 'avatar__ini', p.name.slice(0, 1)));
      av.append(el('span', 'rankbadge', String(i + 1)));
      item.append(av, el('span', 'crow__name' + (p.active ? '' : ' is-off'), p.name));
      w.append(item);
    });
    row.append(w, el('span', 'crow__n', r.entrants + '人'));
    return row;
  }

  // ---- ほかの大会（仮） ----
  function renderOther(root, key) {
    const items = D.timeline.filter(m => m.series === key).reverse();
    root.append(el('p', 'intro', '（モック）結果はまだ集めていません。回ごとに優勝・上位を載せる想定です。'));
    items.forEach(m => {
      const row = el('article', 'vol');
      const meta = el(m.url ? 'a' : 'div', 'vol__meta');
      if (m.url) { meta.href = m.url; meta.target = '_top'; }
      const [y, mo] = m.ym.split('-');
      meta.append(el('span', 'vol__no vol__no--sm', m.title), el('span', 'vol__date', `${y}.${Number(mo)}`));
      const body = el('div', 'vol__body');
      const w = el('div', 'award award--win');
      w.append(el('span', 'award__label', '優勝'));
      const ph = el('div', 'person person--l is-ph');
      ph.append(el('span', 'avatar', '?'), el('span', 'person__name', '（結果を確認中）'));
      w.append(ph);
      body.append(w);
      row.append(meta, body);
      root.append(row);
    });
  }

  // 動画カード（サムネイル＋題名＋公開日）。YouTube を新しいタブで開く
  function videoCard(v, cls) {
    const a = el('a', 'vcard ' + (cls || ''));
    a.href = 'https://www.youtube.com/watch?v=' + encodeURIComponent(v.id);
    a.target = '_blank'; a.rel = 'noopener';
    const th = el('span', 'vcard__thumb');
    const img = el('img'); img.src = v.thumb; img.alt = ''; img.loading = 'lazy';
    th.append(img, el('span', 'vcard__play', '▶'));
    if (v.live) th.append(el('span', 'vcard__live', '配信'));
    a.append(th, el('span', 'vcard__title', v.title.replace(/#\S+/g, '').trim()), el('span', 'vcard__date', v.date.replace(/-/g, '.')));
    return a;
  }

  // ---- ものがたり（章） ----
  function renderStory(root) {
    D.story.slice().reverse().forEach((ch, i, arr) => {
      const sec = el('section', 'ch');
      const head = el('header', 'ch__head');
      head.append(el('span', 'ch__no', 'CHAPTER ' + (arr.length - 1 - i)), el('span', 'ch__period', ch.period));
      sec.append(head, el('h2', 'ch__title', ch.title), el('p', 'ch__lead', ch.lead));
      if (ch.source) sec.append(el('p', 'ch__src', '出典: ' + ch.source));
      const ev = el('ul', 'ch__events');
      ch.events.forEach(([ym, s, t, links, img]) => {
        const li = el('li', 'ev');
        li.style.setProperty('--c', (D.series[s] || { color: '#ff7aa8' }).color);
        const [y, m] = ym.split('-');
        li.append(el('span', 'ev__ym', `${y}.${Number(m)}`), el('span', 'ev__t', t));
        if (img) li.append(evImage(img, links));
        if (links && links.length) li.append(evLinks(links));
        ev.append(li);
      });
      sec.append(ev);
      if (ch.casts.length) {
        const g = el('div', 'ch__casts');
        ch.casts.forEach(id => g.append(personEl(id, 's')));
        sec.append(g);
      }
      if (ch.videos.length) {
        const strip = el('div', 'ch__videos');
        ch.videos.forEach(v => strip.append(videoCard(v)));
        sec.append(strip);
      }
      root.append(sec);
    });
  }

  // ---- BackStage FM（キャストの素顔に迫るインタビュー） ----
  const FM_BY_ID = {};
  D.fm.forEach(v => { FM_BY_ID[v.id] = v; });
  const ytUrl = id => 'https://www.youtube.com/watch?v=' + encodeURIComponent(id);
  // 活動中で、アプリのキャストと結び付いた FM だけポップアップを出す（それ以外は今までどおり動画へ）
  const fmActive = v => v && v.cast != null && D.people[v.cast] && D.people[v.cast].active;

  // ---- プロフィールのポップアップ ----
  // 埋め込み（iframe）では高さがページ全体になり画面の中央が分からないので、押したカードの位置に出す
  let modal = null, lastFocus = null;
  function closeProfile() {
    if (!modal) return;
    modal.remove(); modal = null;
    document.removeEventListener('keydown', onKey);
    if (lastFocus) lastFocus.focus();
  }
  function onKey(e) { if (e.key === 'Escape') closeProfile(); }
  function openProfile(v, from) {
    closeProfile();
    lastFocus = from;
    const p = (v.cast != null && D.people[v.cast]) || { icon: null, active: false };
    const pr = (p.active && D.profiles[v.cast]) || {};
    const back = el('div', 'pf-back');
    back.addEventListener('click', e => { if (e.target === back) closeProfile(); });
    const box = el('div', 'pf');
    box.setAttribute('role', 'dialog'); box.setAttribute('aria-modal', 'true'); box.setAttribute('aria-label', v.guest + ' のプロフィール');
    const x = el('button', 'pf__close', '×'); x.type = 'button'; x.setAttribute('aria-label', '閉じる');
    x.addEventListener('click', closeProfile);

    const head = el('div', 'pf__head');
    const bg = el('img', 'pf__bg'); bg.src = v.thumb; bg.alt = '';
    const av = el('span', 'pf__avatar');
    if (p.icon) { const i = el('img'); i.src = p.icon; i.alt = ''; av.append(i); }
    else av.append(el('span', 'avatar__ini', v.guest.slice(0, 1)));
    head.append(bg, av);

    const body = el('div', 'pf__body');
    body.append(el('p', 'pf__eyebrow', 'BackStage FM ゲスト'), el('h3', 'pf__name', v.guest));
    if (pr.catch) body.append(el('p', 'pf__catch', pr.catch));
    if (pr.tags && pr.tags.length) {
      const t = el('div', 'pf__tags');
      pr.tags.forEach(s => t.append(el('span', 'pf__tag', s)));
      body.append(t);
    }
    if (pr.intro) body.append(el('p', 'pf__intro', pr.intro));

    const acts = el('div', 'pf__acts');
    if (v.cast != null && !p.active) body.append(el('p', 'pf__off', 'いまは活動していません'));
    if (pr.app) {
      const call = el('a', 'pf__call', '📞 アプリで通話しにいく'); call.href = pr.app; call.target = '_blank'; call.rel = 'noopener';
      acts.append(call, el('p', 'pf__note', 'アプリが開いて、このキャストのプロフィールが出ます（アプリが無いときはストアへ）'));
    }
    const watch = el('a', 'pf__watch');
    watch.href = ytUrl(v.id); watch.target = '_blank'; watch.rel = 'noopener';
    const th = el('span', 'pf__wthumb'); const ti = el('img'); ti.src = v.thumb; ti.alt = ''; th.append(ti, el('span', 'vcard__play', '▶'));
    const wt = el('span', 'pf__wtext');
    wt.append(el('span', 'pf__wlabel', 'FM のインタビューを見る'), el('span', 'pf__wtitle', v.catch.replace(/^【BackStage FM】/, '')));
    watch.append(th, wt);
    acts.append(watch);
    body.append(acts);

    box.append(x, head, body);
    back.append(box);
    document.body.append(back);
    back.style.height = document.documentElement.scrollHeight + 'px';
    const r = from.getBoundingClientRect();
    box.style.top = Math.max(16, window.scrollY + r.top - 40) + 'px';
    modal = back;
    document.addEventListener('keydown', onKey);
    x.focus({ preventScroll: true });
    box.scrollIntoView({ block: 'nearest' });
  }

  // リンク（href）のままだと、外側（Artifact の表示枠など）がクリックを先に拾って YouTube へ飛ぶことがある。
  // だからカードはリンクを外したボタンにして、必ずポップアップを先に出す
  function asPopupButton(a, v) {
    a.removeAttribute('href'); a.removeAttribute('target'); a.removeAttribute('rel');
    a.setAttribute('role', 'button'); a.tabIndex = 0;
    a.setAttribute('aria-haspopup', 'dialog');
    a.addEventListener('click', e => { e.preventDefault(); openProfile(v, a); });
    a.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openProfile(v, a); } });
  }

  function renderFM(root) {
    const live = D.fm.filter(fmActive).length;
    root.append(el('p', 'intro', `キャストの素顔に迫るインタビュー。これまでに ${D.fm.length} 人が登場しました。押すとプロフィールが開きます。「通話できる」の印がある ${live} 人には、そのままアプリで通話しにいけます。`));
    const g = el('div', 'fmgrid');
    D.fm.forEach(v => {
      const a = videoCard(v, 'vcard--fm');
      a.querySelector('.vcard__title').textContent = v.guest;
      a.insertBefore(el('span', 'vcard__catch', v.catch.replace(/^【BackStage FM】/, '')), a.querySelector('.vcard__date'));
      if (fmActive(v)) a.querySelector('.vcard__thumb').append(el('span', 'vcard__on', '● 通話できる'));
      asPopupButton(a, v);
      g.append(a);
    });
    root.append(g);
  }

  // ---- 規模の推移（SVG を DOM で組み立てる・外部ライブラリなし） ----
  const NS = 'http://www.w3.org/2000/svg';
  function svg(tag, attrs) { const e = document.createElementNS(NS, tag); Object.entries(attrs || {}).forEach(([k, v]) => e.setAttribute(k, v)); return e; }
  const fmt = n => n.toLocaleString('ja-JP');
  function chart(title, key, kind, color, unit) {
    const rows = D.months, W = 320, H = 120, P = 6;
    const max = Math.max(...rows.map(r => r[key])) || 1;
    const box = el('figure', 'gchart');
    const done = rows.filter(r => !r.partial);
    const lastDone = done[done.length - 1];
    const head = el('figcaption', 'gchart__head');
    head.append(el('span', 'gchart__t', title), el('span', 'gchart__v', fmt(lastDone[key]) + unit));
    const s = svg('svg', { viewBox: `0 0 ${W} ${H}`, class: 'gchart__svg', role: 'img', 'aria-label': title });
    const x = i => P + (W - 2 * P) * i / (rows.length - 1);
    const y = v => H - P - (H - 2 * P) * v / max;
    // 年の区切り線
    rows.forEach((r, i) => { if (r.m.endsWith('-01')) { s.append(svg('line', { x1: x(i), x2: x(i), y1: 0, y2: H, class: 'gchart__yr' })); const t = svg('text', { x: x(i) + 3, y: 11, class: 'gchart__yrt' }); t.textContent = r.m.slice(0, 4); s.append(t); } });
    if (kind === 'bar') {
      const bw = (W - 2 * P) / rows.length * 0.7;
      rows.forEach((r, i) => s.append(svg('rect', { x: x(i) - bw / 2, y: y(r[key]), width: bw, height: H - P - y(r[key]), rx: 1.5, fill: color, opacity: r.partial ? 0.35 : 0.9 })));
    } else {
      const pts = done.map((r, i) => `${x(i)},${y(r[key])}`).join(' ');
      s.append(svg('polygon', { points: `${x(0)},${H - P} ${pts} ${x(done.length - 1)},${H - P}`, fill: color, opacity: 0.18 }));
      s.append(svg('polyline', { points: pts, fill: 'none', stroke: color, 'stroke-width': 2.5, 'stroke-linejoin': 'round' }));
    }
    const first = rows.find(r => r[key] > 0);
    const foot = el('span', 'gchart__foot', `${first.m.replace('-', '.')}：${fmt(first[key])}${unit} → ${lastDone.m.replace('-', '.')}：${fmt(lastDone[key])}${unit}`);
    box.append(head, s, foot);
    return box;
  }

  // ---- 月ごとの年表 ----
  function renderMonths(root) {
    const g = el('section', 'growth');
    g.append(el('h2', 'growth__h', '数字で見る BackStage'),
      el('p', 'growth__sub', '2023年6月から、月ごとの推移（最新の月は途中までのため薄く表示）'));
    const grid = el('div', 'growth__grid');
    grid.append(chart('月の通話回数', 'calls', 'bar', '#c99aff', '回'),
      chart('登録した人（累計）', 'reg_total', 'line', '#38bdf8', '人'),
      chart('その月に通話したキャスト', 'casts', 'line', '#ff5c8a', '人'));
    g.append(grid);
    root.append(g);

    const max = Math.max(...D.months.map(r => r.calls));
    const list = el('ol', 'mt');
    let year = '';
    D.months.slice().reverse().forEach(r => {
      const [y, m] = r.m.split('-');
      if (y !== year) { year = y; list.append(el('li', 'tl__year mt__year', y)); }
      const rich = r.events.length || r.videos.length || r.fm.length || r.marks.length;
      const li = el('li', 'mt__row' + (rich ? '' : ' is-quiet'));
      li.append(el('span', 'mt__m', Number(m) + '月'));
      const body = el('div', 'mt__body');
      const bar = el('div', 'mt__bar');
      const fill = el('span', 'mt__fill'); fill.style.width = Math.max(1.5, 100 * r.calls / max) + '%';
      if (r.partial) fill.classList.add('is-partial');
      bar.append(fill);
      body.append(bar, el('span', 'mt__nums', `通話 ${fmt(r.calls)}回 ・ キャスト ${r.casts}人 ・ 新規登録 ${fmt(r.reg)}人${r.partial ? '（途中）' : ''}`));
      r.marks.forEach(t => body.append(el('span', 'mt__mark', '★ ' + t)));
      if (r.events.length) {
        const ul = el('ul', 'mt__events');
        r.events.forEach(e => {
          const it = el('li', 'ev'); it.style.setProperty('--c', (D.series[e.s] || { color: '#c99aff' }).color);
          it.append(el('span', 'ev__t', e.t));
          if (e.img) it.append(evImage(e.img, e.links));
          if (e.links) it.append(evLinks(e.links));
          ul.append(it);
        });
        body.append(ul);
      }
      if (r.videos.length) {
        const vs = el('div', 'mt__videos');
        r.videos.slice(0, 4).forEach(v => vs.append(videoCard(v, 'vcard--sm')));
        if (r.videos.length > 4) vs.append(el('span', 'mt__more', `ほか ${r.videos.length - 4}本`));
        body.append(vs);
      }
      if (r.fm.length) {
        const fm = el('div', 'mt__fm');
        fm.append(el('span', 'mt__fml', 'BackStage FM'));
        r.fm.forEach(v => {
          const a = el('a', 'fmchip'); a.href = 'https://www.youtube.com/watch?v=' + encodeURIComponent(v.id); a.target = '_blank'; a.rel = 'noopener';
          const img = el('img'); img.src = v.thumb; img.alt = ''; img.loading = 'lazy';
          a.append(img, el('span', '', v.guest));
          const full = FM_BY_ID[v.id];
          if (full) asPopupButton(a, full);
          fm.append(a);
        });
        body.append(fm);
      }
      li.append(body);
      list.append(li);
    });
    root.append(list);
  }

  // ---- 骨組み ----
  const stats = document.getElementById('stats');
  [['SINCE', D.stats.since], ['通話', Math.floor(D.stats.calls_total / 10000) + '万回+'], ['登録', Math.floor(D.stats.reg_total / 10000) + '万人+'], ['動画', D.stats.videos + '本']]
    .forEach(([k, v]) => { const li = el('li', 'stat'); li.append(el('span', 'stat__k', k), el('span', 'stat__v', v)); stats.append(li); });
  const [ay, am] = D.stats.as_of.split('-').map(Number);
  document.getElementById('foot').textContent =
    `通話・登録の数字はアプリの記録から集計（${ay}年${am}月時点・その月は途中まで）。ルーキーチャレンジの結果は公式ハブの確定結果です。`;

  const TABS = [['months', '年表'], ['story', 'ものがたり'], ['rookie', 'ルーキーチャレンジ'], ['fm', 'BackStage FM']];
  const tabs = document.getElementById('tabs');
  const panel = document.getElementById('panel');
  function show(key) {
    tabs.querySelectorAll('button').forEach(b => b.setAttribute('aria-selected', String(b.dataset.k === key)));
    panel.replaceChildren();
    if (key === 'months') renderMonths(panel);
    else if (key === 'story') renderStory(panel);
    else if (key === 'timeline') renderTimeline(panel);
    else if (key === 'rookie') renderRookie(panel);
    else if (key === 'fm') renderFM(panel);
    else renderOther(panel, key);
    try { sessionStorage.setItem('bs-history-tab', key); } catch (e) { /* 保存できなくても動く */ }
  }
  TABS.forEach(([k, label]) => {
    const b = el('button', 'tab', label);
    b.type = 'button'; b.dataset.k = k; b.setAttribute('role', 'tab');
    if (D.series[k]) b.style.setProperty('--c', D.series[k].color);
    b.addEventListener('click', () => show(k));
    tabs.append(b);
  });
  let first = new URLSearchParams(location.search).get('tab');
  if (!first) { try { first = sessionStorage.getItem('bs-history-tab'); } catch (e) { first = null; } }
  show(TABS.some(t => t[0] === first) ? first : 'months');
})();
