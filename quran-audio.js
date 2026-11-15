/* Noor Quran Academy - Quran audio (online streaming)
   Source: everyayah.com  (one mp3 per ayah: SSSAAA.mp3)  */
(function () {
  var AYAH_COUNTS = [7,286,200,176,120,165,206,75,129,109,123,111,43,52,99,128,111,110,98,135,112,78,118,64,77,227,93,88,69,60,34,30,73,54,45,83,182,88,75,85,54,53,89,59,37,35,38,29,18,45,60,49,62,55,78,96,29,22,24,13,14,11,11,18,12,12,30,52,52,44,28,28,20,56,40,31,50,40,46,42,29,19,36,25,22,17,19,26,30,20,15,21,11,8,8,19,5,8,8,11,11,8,3,9,5,4,7,3,6,3,5,4,5,6];

  var RECITERS = {
    alafasy:  { name: "مشاري العفاسي",        folder: "Alafasy_128kbps" },
    husary:   { name: "محمود خليل الحصري",    folder: "Husary_128kbps" },
    basit:    { name: "عبد الباسط (مرتل)",    folder: "Abdul_Basit_Murattal_192kbps" },
    minshawy: { name: "المنشاوي (مرتل)",      folder: "Minshawy_Murattal_128kbps" }
  };

  var audio = new Audio();
  audio.preload = "auto";
  var state = { reciter: localStorage.getItem("nqa_reciter") || "alafasy",
                surah: 0, ayah: 0, continuous: false };

  function pad(n, l) { n = String(n); while (n.length < l) n = "0" + n; return n; }
  function url(s, a) {
    return "https://everyayah.com/data/" + RECITERS[state.reciter].folder +
           "/" + pad(s, 3) + pad(a, 3) + ".mp3";
  }
  function emit(type) {
    document.dispatchEvent(new CustomEvent("quranaudio:" + type,
      { detail: { surah: state.surah, ayah: state.ayah } }));
  }

  function play(s, a, continuous) {
    state.surah = s; state.ayah = a; state.continuous = !!continuous;
    audio.src = url(s, a);
    audio.play().then(function () { emit("ayah"); })
      .catch(function () { emit("error"); });
  }

  audio.addEventListener("ended", function () {
    if (!state.continuous) { emit("stop"); return; }
    var next = state.ayah + 1;
    if (next <= AYAH_COUNTS[state.surah - 1]) play(state.surah, next, true);
    else { emit("stop"); }
  });
  audio.addEventListener("error", function () { emit("error"); });

  window.QuranAudio = {
    reciters: RECITERS,
    playAyah:  function (s, a) { play(s, a, false); },
    playSurah: function (s, from) { play(s, from || 1, true); },
    pause:  function () { audio.pause(); emit("pause"); },
    resume: function () { audio.play(); emit("ayah"); },
    stop:   function () { audio.pause(); audio.currentTime = 0; state.continuous = false; emit("stop"); },
    setReciter: function (key) {
      if (!RECITERS[key]) return;
      state.reciter = key; localStorage.setItem("nqa_reciter", key);
      if (!audio.paused && state.surah) play(state.surah, state.ayah, state.continuous);
    },
    getReciter: function () { return state.reciter; },
    isPlaying: function () { return !audio.paused; }
  };
})();
