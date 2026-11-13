/* Noor Quran Academy - Quran text reader (offline)
   Needs: quran-uthmani.txt (from tanzil.net, "sura|aya|text" format) next to index.html
   Use:   <script src="quran-reader.js"></script>  then  QuranReader.open()  */
(function () {
  var NAMES = ["الفاتحة","البقرة","آل عمران","النساء","المائدة","الأنعام","الأعراف","الأنفال","التوبة","يونس","هود","يوسف","الرعد","إبراهيم","الحجر","النحل","الإسراء","الكهف","مريم","طه","الأنبياء","الحج","المؤمنون","النور","الفرقان","الشعراء","النمل","القصص","العنكبوت","الروم","لقمان","السجدة","الأحزاب","سبأ","فاطر","يس","الصافات","ص","الزمر","غافر","فصلت","الشورى","الزخرف","الدخان","الجاثية","الأحقاف","محمد","الفتح","الحجرات","ق","الذاريات","الطور","النجم","القمر","الرحمن","الواقعة","الحديد","المجادلة","الحشر","الممتحنة","الصف","الجمعة","المنافقون","التغابن","الطلاق","التحريم","الملك","القلم","الحاقة","المعارج","نوح","الجن","المزمل","المدثر","القيامة","الإنسان","المرسلات","النبأ","النازعات","عبس","التكوير","الانفطار","المطففين","الانشقاق","البروج","الطارق","الأعلى","الغاشية","الفجر","البلد","الشمس","الليل","الضحى","الشرح","التين","العلق","القدر","البينة","الزلزلة","العاديات","القارعة","التكاثر","العصر","الهمزة","الفيل","قريش","الماعون","الكوثر","الكافرون","النصر","المسد","الإخلاص","الفلق","الناس"];
  var BISMILLAH = "بِسْمِ ٱللَّهِ ٱلرَّحْمَـٰنِ ٱلرَّحِيمِ";
  var KEY = "noor_quran_last";
  var data = null, root = null;

  var css = "#qr{position:fixed;inset:0;z-index:9999;background:#fbfaf4;color:#14331f;display:none;flex-direction:column;font-family:sans-serif}" +
    "#qr .bar{display:flex;align-items:center;gap:10px;padding:12px 14px;background:#0f5132;color:#fff;border-bottom:3px solid #c9a227}" +
    "#qr .bar b{flex:1;font-size:18px}" +
    "#qr button{background:none;border:0;color:inherit;font-size:20px;padding:4px 10px}" +
    "#qr .body{flex:1;overflow-y:auto;padding:12px}" +
    "#qr .row{display:flex;align-items:center;gap:12px;padding:12px;border-bottom:1px solid #e6e0c8;direction:rtl}" +
    "#qr .num{min-width:34px;height:34px;border:2px solid #c9a227;border-radius:50%;display:flex;align-items:center;justify-content:center;color:#0f5132;font-size:14px;direction:ltr}" +
    "#qr .nm{flex:1;font-size:22px;font-family:'Amiri Quran','Noto Naskh Arabic','Traditional Arabic',serif}" +
    "#qr .ct{font-size:13px;color:#7a6a1f;direction:ltr}" +
    "#qr .txt{direction:rtl;text-align:justify;line-height:2.6;font-size:var(--qs,28px);font-family:'Amiri Quran','Noto Naskh Arabic','Traditional Arabic',serif}" +
    "#qr .bis{text-align:center;color:#0f5132;margin:10px 0 18px}" +
    "#qr .end{display:inline-flex;align-items:center;justify-content:center;width:1.5em;height:1.5em;border:1.5px solid #c9a227;border-radius:50%;font-size:.5em;margin:0 .4em;color:#0f5132;font-family:sans-serif}";

  function el(t, c, h) { var e = document.createElement(t); if (c) e.className = c; if (h != null) e.innerHTML = h; return e; }
  function toAr(n) { return String(n).replace(/\d/g, function (d) { return "٠١٢٣٤٥٦٧٨٩"[d]; }); }

  function load() {
    if (data) return Promise.resolve(data);
    return fetch("quran-uthmani.txt").then(function (r) { if (!r.ok) throw 0; return r.text(); })
      .catch(function () { return fetch("quran-simple.txt").then(function (r) { return r.text(); }); })
      .then(function (t) {
      var s = {};
      t.split("\n").forEach(function (l) {
        if (!l || l[0] === "#") return;
        var p = l.split("|"); if (p.length < 3) return;
        var su = +p[0], ay = +p[1], tx = p.slice(2).join("|").trim();
        if (ay === 1 && su !== 1 && su !== 9) tx = tx.split(" ").slice(4).join(" ");
        (s[su] = s[su] || []).push(tx);
      });
      data = s; return s;
    });
  }

  function build() {
    if (root) return;
    var st = el("style", null, css); document.head.appendChild(st);
    root = el("div"); root.id = "qr"; document.body.appendChild(root);
  }

  function shell(title, back) {
    root.innerHTML = "";
    var bar = el("div", "bar");
    var b = el("button", null, back ? "←" : "✕"); b.onclick = back || close;
    bar.appendChild(b); bar.appendChild(el("b", null, title));
    var body = el("div", "body");
    root.appendChild(bar); root.appendChild(body);
    return { bar: bar, body: body };
  }

  function list() {
    var v = shell("القرآن الكريم · Qur'aana", null);
    for (var i = 1; i <= 114; i++) (function (n) {
      var r = el("div", "row", '<span class="num">' + n + '</span><span class="nm">سورة ' + NAMES[n - 1] + '</span><span class="ct">' + data[n].length + '</span>');
      r.onclick = function () { read(n); };
      v.body.appendChild(r);
    })(i);
    var last = +localStorage.getItem(KEY);
    if (last) read(last);
  }

  function read(n) {
    localStorage.setItem(KEY, n);
    var v = shell("سورة " + NAMES[n - 1], function () { localStorage.removeItem(KEY); list(); });
    var small = el("button", null, "A-"), big = el("button", null, "A+");
    var size = +localStorage.getItem("noor_quran_size") || 28;
    function apply() { v.body.style.setProperty("--qs", size + "px"); localStorage.setItem("noor_quran_size", size); }
    small.onclick = function () { size = Math.max(18, size - 2); apply(); };
    big.onclick = function () { size = Math.min(44, size + 2); apply(); };
    v.bar.appendChild(small); v.bar.appendChild(big); apply();
    if (n !== 1 && n !== 9) v.body.appendChild(el("div", "txt bis", BISMILLAH));
    var html = data[n].map(function (a, i) { return a + '<span class="end">' + toAr(i + 1) + "</span>"; }).join(" ");
    v.body.appendChild(el("div", "txt", html));
    v.body.scrollTop = 0;
  }

  function close() { root.style.display = "none"; }

  window.QuranReader = {
    open: function () {
      build(); root.style.display = "flex";
      root.innerHTML = '<div class="body">...</div>';
      load().then(list).catch(function () {
        root.innerHTML = '<div class="body">quran-uthmani.txt not found.<br><button onclick="QuranReader.close()">✕</button></div>';
      });
    },
    close: close
  };
})();
