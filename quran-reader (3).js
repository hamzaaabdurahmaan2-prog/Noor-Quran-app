/* Noor Quran Academy - Quran reader, Mushaf pages 1-604 (offline)
   Needs in the same folder:  quran-uthmani.txt  (Tanzil text, lines "sura|aya|text")
   Mushaf page table (Tanzil metadata) is taken, in this order, from:
     1) the copy saved on the phone from an earlier run,
     2) quran-data.js in the same folder (optional),
     3) tanzil.net, once, when the phone is online (then saved for offline use).
   If none is available, pages are built by grouping ayahs instead.
   Use: <script src="quran-reader.js"></script>  then  QuranReader.open()  */
(function () {
  var NAMES = ["الفاتحة","البقرة","آل عمران","النساء","المائدة","الأنعام","الأعراف","الأنفال","التوبة","يونس","هود","يوسف","الرعد","إبراهيم","الحجر","النحل","الإسراء","الكهف","مريم","طه","الأنبياء","الحج","المؤمنون","النور","الفرقان","الشعراء","النمل","القصص","العنكبوت","الروم","لقمان","السجدة","الأحزاب","سبأ","فاطر","يس","الصافات","ص","الزمر","غافر","فصلت","الشورى","الزخرف","الدخان","الجاثية","الأحقاف","محمد","الفتح","الحجرات","ق","الذاريات","الطور","النجم","القمر","الرحمن","الواقعة","الحديد","المجادلة","الحشر","الممتحنة","الصف","الجمعة","المنافقون","التغابن","الطلاق","التحريم","الملك","القلم","الحاقة","المعارج","نوح","الجن","المزمل","المدثر","القيامة","الإنسان","المرسلات","النبأ","النازعات","عبس","التكوير","الانفطار","المطففين","الانشقاق","البروج","الطارق","الأعلى","الغاشية","الفجر","البلد","الشمس","الليل","الضحى","الشرح","التين","العلق","القدر","البينة","الزلزلة","العاديات","القارعة","التكاثر","العصر","الهمزة","الفيل","قريش","الماعون","الكوثر","الكافرون","النصر","المسد","الإخلاص","الفلق","الناس"];
  var BISMILLAH = "بِسْمِ ٱللَّهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ";
  var KEY = "noor_quran_pg", KEYS = "noor_quran_size", KEYM = "noor_quran_mushaf_pages";
  var CHARS_PER_PAGE = 650;   /* only used when quran-data.js is missing */
  var flat = null, pageList = null, startPage = null, mushaf = false, root = null;

  var css =
    "#qr{position:fixed;inset:0;z-index:9999;display:none;flex-direction:column;background:#fbfaf5;color:#1d2b24;font-family:'Amiri','Noto Naskh Arabic',serif;padding-top:env(safe-area-inset-top,0);padding-bottom:env(safe-area-inset-bottom,0)}" +
    "#qr .bar{display:flex;align-items:center;gap:10px;padding:12px 14px;background:#0f5132;color:#fff;border-bottom:4px solid #b8892b;direction:ltr}" +
    "#qr .bar b{flex:1;font-size:19px;text-align:center}" +
    "#qr button{background:none;border:0;color:inherit;font:inherit;padding:6px 10px;cursor:pointer}" +
    "#qr .body{flex:1;overflow-y:auto;padding:14px}" +
    "#qr .row{display:flex;align-items:center;gap:12px;padding:12px 4px;border-bottom:1px solid #e4e0d2;cursor:pointer}" +
    "#qr .num{min-width:34px;height:34px;border:2px solid #b8892b;border-radius:50%;display:flex;align-items:center;justify-content:center;font:14px system-ui,sans-serif;color:#0f5132}" +
    "#qr .nm{flex:1;font-size:22px}" +
    "#qr .ct{font:13px system-ui,sans-serif;color:#7a6a1f}" +
    "#qr .txt{direction:rtl;text-align:justify;line-height:2.2;font-size:var(--qs,26px)}" +
    "#qr .mk{color:#b8892b;font-size:.8em;margin:0 .25em}" +
    "#qr .sn{text-align:center;margin:10px 0 4px;padding:6px;border:2px solid #b8892b;border-radius:8px;color:#0f5132;background:#f3e7c9;font-size:calc(var(--qs,26px) + 2px)}" +
    "#qr .bis{text-align:center;color:#0f5132;margin:6px 0 10px;font-size:calc(var(--qs,26px) + 2px)}" +
    "#qr .foot{display:flex;align-items:center;justify-content:space-between;gap:8px;padding:10px 14px;border-top:1px solid #e4e0d2;background:#fff;direction:ltr;font:15px system-ui,sans-serif}" +
    "#qr .foot button{background:#0f5132;color:#fff;border-radius:8px;padding:10px 16px}" +
    "#qr .foot button[disabled]{opacity:.35}";

  function el(tag, cls, text) { var e = document.createElement(tag); if (cls) e.className = cls; if (text != null) e.textContent = text; return e; }
  function toAr(n) { return String(n).replace(/\d/g, function (d) { return "٠١٢٣٤٥٦٧٨٩"[d]; }); }
  function get(k) { try { return localStorage.getItem(k); } catch (e) { return null; } }
  function set(k, v) { try { localStorage.setItem(k, v); } catch (e) {} }
  function plain(w) { return w.replace(/[\u064B-\u065F\u0670\u06D6-\u06ED]/g, ""); }

  function loadScript(src) {
    return new Promise(function (res) {
      if (window.QuranData && window.QuranData.Page) return res();
      var s = document.createElement("script"), done = false;
      function fin() { if (!done) { done = true; res(); } }
      s.src = src; s.charset = "utf-8"; s.onload = fin; s.onerror = fin;
      setTimeout(fin, 6000);
      document.head.appendChild(s);
    });
  }

  function loadMeta() {
    try {
      var c = get(KEYM);
      if (c) { var pg = JSON.parse(c); if (pg && pg.length >= 605) { window.QuranData = { Page: pg }; return Promise.resolve(); } }
    } catch (e) {}
    return loadScript("quran-data.js").then(function () {
      return loadScript("https://tanzil.net/res/text/metadata/quran-data.js");
    });
  }

  function loadText() {
    return fetch("quran-uthmani.txt").then(function (r) { if (!r.ok) throw 0; return r.text(); })
      .catch(function () { return fetch("quran-simple.txt").then(function (r) { if (!r.ok) throw 0; return r.text(); }); });
  }

  function load() {
    if (pageList) return Promise.resolve();
    return Promise.all([loadText(), loadMeta()]).then(function (res) {
      var count = {}; flat = [];
      res[0].split("\n").forEach(function (l) {
        l = l.trim();
        if (!l || l[0] === "#") return;
        var p = l.split("|"); if (p.length < 3) return;
        var su = +p[0], ay = +p[1], tx = p.slice(2).join("|").trim();
        if (ay === 1 && su !== 1 && su !== 9) {          /* remove the Bismillah glued to ayah 1 */
          var w = tx.split(" ");
          if (w.length > 4 && plain(w[0]) === "بسم") tx = w.slice(4).join(" ");
        }
        flat.push({ su: su, ay: ay, tx: tx }); count[su] = (count[su] || 0) + 1;
      });
      buildPages(count);
    });
  }

  function buildPages(count) {
    var ord = {}, base = 0;                               /* ord[su] = index of ayah 1 of that surah in flat */
    for (var s = 1; s <= 114; s++) { ord[s] = base; base += count[s] || 0; }
    pageList = []; mushaf = false;

    var QD = window.QuranData, P = QD && QD.Page;
    if (P && P.length >= 605 && flat.length === 6236 && P[1][0] === 1 && P[1][1] === 1) {
      var st = [];
      for (var p = 1; p <= 604; p++) st[p] = ord[P[p][0]] + P[p][1] - 1;
      var ok = true;
      for (p = 2; p <= 604; p++) if (!(st[p] > st[p - 1])) ok = false;
      if (ok) {
        for (p = 1; p <= 604; p++) {
          var end = p < 604 ? st[p + 1] : flat.length, pg = [];
          for (var i = st[p]; i < end; i++) pg.push(i);
          pageList.push(pg);
        }
        mushaf = true;
        set(KEYM, JSON.stringify(P));                /* keep the table for offline use */
      }
    }
    if (!mushaf) {                                        /* fallback: group ayahs, new page at every surah */
      for (s = 1; s <= 114; s++) {
        var cur = [], len = 0;
        for (var j = ord[s]; j < ord[s] + count[s]; j++) {
          cur.push(j); len += flat[j].tx.length;
          if (len >= CHARS_PER_PAGE) { pageList.push(cur); cur = []; len = 0; }
        }
        if (cur.length) pageList.push(cur);
      }
    }
    startPage = {};
    pageList.forEach(function (pg, idx) {
      pg.forEach(function (i) { if (flat[i].ay === 1 && startPage[flat[i].su] == null) startPage[flat[i].su] = idx; });
    });
  }

  function build() {
    if (root) return;
    document.head.appendChild(el("style", null, css));
    root = el("div"); root.id = "qr"; document.body.appendChild(root);
  }

  function shell(title, back) {
    root.textContent = "";
    var bar = el("div", "bar");
    var b = el("button", null, back ? "←" : "✕"); b.onclick = back || close;
    bar.appendChild(b); bar.appendChild(el("b", null, title));
    var body = el("div", "body");
    root.appendChild(bar); root.appendChild(body);
    return { bar: bar, body: body };
  }

  function list() {
    var v = shell("القرآن الكريم · Qur'aana", null);
    var cnt = {}; flat.forEach(function (a) { cnt[a.su] = (cnt[a.su] || 0) + 1; });
    for (var i = 1; i <= 114; i++) (function (n) {
      var r = el("div", "row");
      r.appendChild(el("span", "num", n));
      r.appendChild(el("span", "nm", "سورة " + NAMES[n - 1]));
      r.appendChild(el("span", "ct", cnt[n] + " ayaata" + (mushaf ? " · fuula " + (startPage[n] + 1) : "")));
      r.onclick = function () { read(startPage[n] || 0); };
      v.body.appendChild(r);
    })(i);
    var last = get(KEY);
    if (last !== null && last !== "" && +last >= 0 && +last < pageList.length) read(+last);
  }

  function read(p) {
    if (p < 0) p = 0; if (p > pageList.length - 1) p = pageList.length - 1;
    set(KEY, p);
    var items = pageList[p], first = flat[items[0]];
    var v = shell("سورة " + NAMES[first.su - 1], function () { set(KEY, ""); list(); });
    var size = +get(KEYS) || 26;
    function apply() { v.body.style.setProperty("--qs", size + "px"); }
    var small = el("button", null, "A-"), big = el("button", null, "A+");
    small.onclick = function () { size = Math.max(18, size - 2); set(KEYS, size); apply(); };
    big.onclick = function () { size = Math.min(44, size + 2); set(KEYS, size); apply(); };
    v.bar.appendChild(small); v.bar.appendChild(big); apply();

    var txt = null;
    items.forEach(function (i) {
      var a = flat[i];
      if (a.ay === 1) {                                   /* a surah begins on this page */
        txt = null;
        v.body.appendChild(el("div", "sn", "سورة " + NAMES[a.su - 1]));
        if (a.su !== 1 && a.su !== 9) v.body.appendChild(el("div", "bis", BISMILLAH));
      }
      if (!txt) { txt = el("div", "txt"); v.body.appendChild(txt); }
      txt.appendChild(document.createTextNode(a.tx + " "));
      txt.appendChild(el("span", "mk", "﴿" + toAr(a.ay) + "﴾"));
      txt.appendChild(document.createTextNode(" "));
    });
    v.body.scrollTop = 0;

    var foot = el("div", "foot");
    var prev = el("button", null, "‹ Duraa"), next = el("button", null, "Itti aanu ›");
    foot.appendChild(prev); foot.appendChild(el("span", null, "Fuula " + (p + 1) + " / " + pageList.length)); foot.appendChild(next);
    prev.disabled = (p === 0); next.disabled = (p === pageList.length - 1);
    function goPrev() { if (p > 0) read(p - 1); }
    function goNext() { if (p < pageList.length - 1) read(p + 1); }
    prev.onclick = goPrev; next.onclick = goNext;
    root.appendChild(foot);

    /* swipe: left = next page, right = previous page */
    var x0 = null;
    v.body.ontouchstart = function (e) { x0 = e.touches[0].clientX; };
    v.body.ontouchend = function (e) {
      if (x0 === null) return;
      var dx = e.changedTouches[0].clientX - x0; x0 = null;
      if (Math.abs(dx) < 70) return;
      if (dx < 0) goNext(); else goPrev();
    };
  }

  function close() { root.style.display = "none"; }

  window.QuranReader = {
    open: function () {
      build(); root.style.display = "flex";
      root.textContent = ""; root.appendChild(el("div", "body", "..."));
      load().then(list).catch(function () {
        root.textContent = "";
        root.appendChild(el("div", "body", "quran-uthmani.txt hin argamne. Faayilii kana repo keessa kaa'i."));
      });
    },
    close: close
  };
})();
