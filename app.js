// ================================================================
// PEACE · SUKOON — Romantic Indie Vinyl
// App Logic
// ================================================================

const DEFAULT_PLAYLIST_ID = "PLexDPGLDp4lQ";

const CURATED_TRACKS = [
  { id:"-2RAq5o5pwc", title:"Jhol",                   artist:"Maanu x Annural Khalid",             category:"coke-studio", mood:"Soft Romantic Vibe",    quote:"Ishq di jhol ch paaye ne, khwaab sajaye ne..." },
  { id:"BWczaSneA0Q", title:"Jhol (Acoustic)",        artist:"Maanu, Annural Khalid & Abdullah",   category:"pakistani",   mood:"Gentle Acoustic",        quote:"Tere bina lagda nahi mann mera..." },
  { id:"M5OCLifZK1w", title:"Aarzu",                  artist:"Noor, Khan & Madhurxo",              category:"pakistani",   mood:"Soulful Longing",        quote:"Aarzu hai bas teri, dhadkanon mein tu basi..." },
  { id:"IJeSR-LJBnk", title:"ISHQ",                   artist:"Faheem Abdullah & Rauhan Malik",     category:"indian",      mood:"Poetic Romance",        quote:"Ishq mein tere fanna hone lage hain..." },
  { id:"hHuG7FIKgtc", title:"Ishq (Lyrical)",         artist:"Amir Ameer & Faheem Abdullah",       category:"indian",      mood:"Heartfelt Love",         quote:"Teri aankhon ki kashish mein kho gaye hum..." },
  { id:"zaFGQEIcetM", title:"Majboor",                artist:"Sheheryar Rehan x Zoha Waseem",      category:"pakistani",   mood:"Melancholic Indie",      quote:"Aap ka hi kehna banta hai, hum toh khamosh hain..." },
  { id:"YzfbpPQLmtE", title:"Sadqay",                 artist:"Aashir Wajahat, Nayel & Nehaal",     category:"pakistani",   mood:"Dreamy Serenade",        quote:"Ke janam pyaar tumse hai, aitbaar tumse hai..." },
  { id:"EvzNDQLwCqw", title:"Ehsaas",                 artist:"Faheem Abdullah & Vaibhav Pani",     category:"indian",      mood:"Acoustic Warmth",        quote:"Har lamha tera hi ehsaas rehta hai..." },
  { id:"M47Bgb4kNUo", title:"Ehsaas (Acoustic)",      artist:"Faheem Abdullah",                    category:"indian",      mood:"Intimate Strings",       quote:"Tu jo paas ho toh har gham sukoon ban jaye..." },
  { id:"Drno4O1ggv0", title:"Chalre Chalre Waal",     artist:"Soulmate Vibes Music",               category:"pakistani",   mood:"Punjabi Folk Indie",     quote:"Tu sanwal phul kasturi, dil di lagi..." },
  { id:"U0EI7XFkkV4", title:"Taare",                  artist:"Farak",                              category:"indian",      mood:"Night Stargazing",       quote:"Taare ginte ginte raat dhal gayi..." },
  { id:"ebZj_nrmH-c", title:"Barsaat",                artist:"Banjaare",                           category:"indian",      mood:"Rain & Longing",         quote:"Barsaat ki boondon mein teri yaadein..." },
  { id:"2vKMY75kvjI", title:"Aankhon Se Batana",      artist:"Dikshant",                           category:"indian",      mood:"Sweet Indie Love",       quote:"Aankhon se batana, baatein dil ki saari..." },
  { id:"l6E16JAk_Fs", title:"Khat",                   artist:"Navjot Ahuja",                       category:"indian",      mood:"Nostalgic Love",         quote:"Woh khat jo kabhi bhej na sake..." },
  { id:"AMfuIWDUDHg", title:"Chal Diye Tum Kahan",    artist:"AUR",                                category:"pakistani",   mood:"Cozy Melancholy",        quote:"Chal diye tum kahan, chhod kar yeh jahan..." },
  { id:"CJq1hGSO89A", title:"Chitta",                 artist:"Manan Bhardwaj (Shiddat)",           category:"indian",      mood:"Soulful Passion",        quote:"Chitta kukkad banere te, tere naal pyaar..." },
  { id:"PHULePbksEU", title:"Aaya Na Tu",             artist:"Arjun Kanungo & Momina Mustehsan",   category:"pakistani",   mood:"Heartfelt Longing",      quote:"Aaya na tu, gham toh aaya..." },
  { id:"Wa6it7j_OHY", title:"Kina Chir",              artist:"The PropheC",                        category:"indian",      mood:"Smooth Punjabi Indie",   quote:"Kina chir sajna tere te marna..." },
  { id:"enidMo5izlE", title:"Noor Mahal",             artist:"Chani Nattan & Inderpal Moga",       category:"indian",      mood:"Warm Indie Melody",      quote:"Tere shehar da noor, tere noor naal..." },
  { id:"L3HabXRXfmw", title:"Ek Dafaa",               artist:"Arjun Kanungo",                      category:"indian",      mood:"Soft Romance",           quote:"Ek dafaa dekh loon toh mil jaye sukoon..." },
  { id:"Qwm6BSGrOq0", title:"Iraaday",                artist:"Abdul Hannan & Rovalio",             category:"pakistani",   mood:"Dreamy Romantic",        quote:"Iraaday toh pehle se the, magar ab yaqeen hai..." },
  { id:"AdTQLpnMx-U", title:"Bikhra",                 artist:"Abdul Hannan & Rovalio",             category:"pakistani",   mood:"Melancholic Love",       quote:"Bikhra hoon main ab tak teri yaadon ke sahare..." },
  { id:"vDliUg9gGdA", title:"Alfaaz",                 artist:"Hamza Malik & Zain Ali",             category:"pakistani",   mood:"Gentle Indie",           quote:"Tere bina har lafz adhura sa hai..." },
  { id:"ko6a2UFYscg", title:"Na Ho Tum",              artist:"Kalp",                               category:"indian",      mood:"Cozy Acoustic",          quote:"Jahan na ho tum, wahan kuch bhi nahi..." },
];

// ---- DOM refs ----
const $ = id => document.getElementById(id);
const el = {
  deck:              $("deck"),
  start:             $("start"),
  startText:         $("start-text"),
  title:             $("title"),
  artist:            $("artist"),
  quote:             $("quote"),
  originBadge:       $("trackOriginBadge"),
  moodBadge:         $("trackMoodBadge"),
  deckBadge:         $("deckStateBadge"),
  status:            $("status"),
  play:              $("play"),
  playIcon:          $("playIconSvg"),
  prev:              $("prev"),
  next:              $("next"),
  shuffle:           $("shuffle"),
  loop:              $("loop"),
  seek:              $("seek"),
  seekFill:          $("seekFill"),
  elapsed:           $("elapsed"),
  duration:          $("duration"),
  volume:            $("volume"),
  volFill:           $("volumeFill"),
  volPct:            $("volumePercent"),
  muteBtn:           $("muteBtn"),
  list:              $("list"),
  count:             $("count"),
  searchInput:       $("searchInput"),
  themeToggle:       $("themeToggle"),
  themeLabel:        $("themeLabel"),
  rainToggle:        $("rainToggle"),
  rainAudio:         $("rainAudio"),
  customPlBtn:       $("customPlBtn"),
  customModal:       $("customModal"),
  closeModalBtn:     $("closeModalBtn"),
  customPlInput:     $("customPlInput"),
  applyCustomPlBtn:  $("applyCustomPlBtn"),
  resetCuratedBtn:   $("resetCuratedBtn"),
  toggleScreenBtn:   $("toggleScreenBtn"),
  screenCollapsible: $("screenCollapsible"),
};

// ---- State ----
let player = null;
let playerReady = false;
let started = false;
let seeking = false;
let shuffleOn = true;
let loopOne = false;
let currentVol = 80;
let muted = false;
let filterCat = "all";
let searchQ = "";
let tracks = [...CURATED_TRACKS];
let queue = [];
let pos = -1;
let currentIdx = -1;
let personalTracks = null;   // the signed-in user's own playlist (set by room.js), or null for the default list
let customLoaded = false;    // true while a pasted YouTube playlist is on screen instead
const baseTracks = () => personalTracks || CURATED_TRACKS;

// Listening Room (room.js) takes over playback while "Listen together" is on.
const roomHook = () => (window.PeaceRoomHook && window.PeaceRoomHook.active) ? window.PeaceRoomHook : null;

// ---- Helpers ----
const esc = s => String(s ?? "").replace(/[&<>"']/g, c => ({ "&":"&amp;", "<":"&lt;", ">":"&gt;", '"':"&quot;", "'":"&#39;" }[c]));
const fmt = s => { s = Math.max(0, Math.floor(s||0)); return `${Math.floor(s/60)}:${String(s%60).padStart(2,"0")}`; };
function shuffle(arr) {
  const a = arr.slice();
  for (let i = a.length-1; i>0; i--) { const j = Math.floor(Math.random()*(i+1)); [a[i],a[j]]=[a[j],a[i]]; }
  return a;
}

// ---- Queue ----
function buildQueue(first) {
  const all = tracks.map((_,i)=>i);
  queue = shuffleOn ? [first, ...shuffle(all.filter(i=>i!==first))] : [...all.slice(first), ...all.slice(0,first)];
  pos = 0;
}

// ---- Playback ----
function playAt(idx) {
  if (!playerReady || idx < 0 || idx >= tracks.length) return;
  currentIdx = idx;
  started = true;
  el.start.classList.add("hidden");
  player.loadVideoById(tracks[idx].id);
  showTrack(idx);
}

function playQueuePos(qp) {
  if (qp < 0 || qp >= queue.length) return;
  pos = qp;
  playAt(queue[pos]);
}

function next() {
  if (!playerReady) return;
  const rh = roomHook(); if (rh) { rh.next(); return; }
  if (!tracks.length) return;
  if (loopOne && currentIdx >= 0) { player.seekTo(0,true); player.playVideo(); return; }
  if (pos+1 < queue.length) { playQueuePos(pos+1); }
  else {
    const last = currentIdx;
    let first = shuffleOn ? Math.floor(Math.random()*tracks.length) : 0;
    if (shuffleOn && tracks.length>1) while (first===last) first=Math.floor(Math.random()*tracks.length);
    buildQueue(first); playQueuePos(0);
  }
}

function prev() {
  if (!playerReady) return;
  const rh = roomHook(); if (rh) { rh.prev(); return; }
  if (player.getCurrentTime()>3 || pos<=0) player.seekTo(0,true);
  else playQueuePos(pos-1);
}

function startPlay() {
  if (!playerReady) return;
  const rh = roomHook(); if (rh) { rh.start(); return; }
  if (!tracks.length) { el.status.textContent = "Your playlist is empty. Add a song first."; return; }
  const first = shuffleOn ? Math.floor(Math.random()*tracks.length) : 0;
  buildQueue(first); playQueuePos(0);
}

function togglePlay() {
  if (!playerReady) return;
  if (!started) { startPlay(); return; }
  const s = player.getPlayerState();
  s===YT.PlayerState.PLAYING ? player.pauseVideo() : player.playVideo();
}

// ---- Display ----
const CATEGORY_NAMES = { pakistani:"Pakistani Indie", indian:"Indian Indie", "coke-studio":"Coke Studio" };
function showTrack(idx) {
  const t = tracks[idx];
  if (!t) return;
  el.title.textContent = t.title;
  el.artist.textContent = t.artist || "Unknown Artist";
  el.quote.textContent = t.quote ? `"${t.quote}"` : `"Sukoon bhari yeh shaam…"`;
  el.originBadge.textContent = CATEGORY_NAMES[t.category] || "Indie Gem";
  el.moodBadge.textContent = t.mood || "Soft Romantic";
  document.title = `${t.title} · ${t.artist} | Peace`;

  document.querySelectorAll(".song-row").forEach(r => {
    const active = Number(r.dataset.index) === idx;
    r.classList.toggle("active", active);
    if (active) r.scrollIntoView({ block:"nearest", behavior:"smooth" });
  });

  if ("mediaSession" in navigator) {
    navigator.mediaSession.metadata = new MediaMetadata({
      title: t.title,
      artist: t.artist,
      album: "Soft Romantic Indie · Peace",
      artwork: [{ src:`https://i.ytimg.com/vi/${t.id}/hqdefault.jpg`, sizes:"480x360", type:"image/jpeg" }],
    });
  }
}

function setPlayingUI(playing) {
  el.deck.classList.toggle("playing", playing);
  el.deckBadge.textContent = playing ? "SPINNING" : started ? "PAUSED" : "READY";
  el.status.textContent = playing ? "Now playing" : started ? "Paused" : "Ready to spin";
  el.playIcon.innerHTML = playing
    ? '<path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/>'
    : '<path d="M8 5v14l11-7z"/>';
}

// ---- Playlist Render ----
function renderList() {
  const filtered = tracks.filter((t, i) => {
    const matchCat = filterCat==="all" || t.category===filterCat;
    const q = searchQ.toLowerCase();
    const matchQ = !q || t.title.toLowerCase().includes(q) || t.artist.toLowerCase().includes(q) || (t.mood||"").toLowerCase().includes(q);
    return matchCat && matchQ;
  });
  el.count.textContent = `${filtered.length} songs`;
  el.list.innerHTML = "";

  filtered.forEach(t => {
    const origIdx = tracks.indexOf(t);
    const li = document.createElement("li");
    li.className = "pl-item";
    const removable = !!personalTracks && !customLoaded;
    if (removable) li.classList.add("has-remove");
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = `song-row${origIdx===currentIdx?" active":""}`;
    btn.dataset.index = origIdx;

    const catLabel = { pakistani:"PK", indian:"IN", "coke-studio":"CS", custom:"YT" }[t.category] || "🎵";
    const safeId = /^[\w-]{11}$/.test(t.id) ? t.id : "";
    const thumb = `https://i.ytimg.com/vi/${safeId}/mqdefault.jpg`;

    btn.innerHTML = `
      <span class="row-num">${origIdx+1}</span>
      <div class="row-thumb" style="background-image:url('${thumb}')"></div>
      <div class="row-info">
        <span class="row-title">${esc(t.title)}</span>
        <div class="row-meta">
          <span class="row-artist">${esc(t.artist)}</span>
          <span class="row-badge">${catLabel}</span>
        </div>
      </div>
      <div class="row-eq"><span></span><span></span><span></span></div>
    `;
    btn.addEventListener("click", () => {
      const rh = roomHook();
      if (rh) { rh.playExternal(tracks[origIdx]); return; }
      buildQueue(origIdx); playQueuePos(0);
    });
    li.appendChild(btn);
    if (removable) {
      const rm = document.createElement("button");
      rm.type = "button";
      rm.className = "row-remove";
      rm.title = "Remove from my playlist";
      rm.setAttribute("aria-label", `Remove ${t.title} from my playlist`);
      rm.textContent = "✕";
      rm.addEventListener("click", () => { if (window.PeacePlaylist) window.PeacePlaylist.remove(t.id); });
      li.appendChild(rm);
    }
    el.list.appendChild(li);
  });
}

// ---- YouTube API ----
const ytScript = document.createElement("script");
ytScript.src = "https://www.youtube.com/iframe_api";
document.head.appendChild(ytScript);

window.onYouTubeIframeAPIReady = () => {
  player = new YT.Player("player", {
    width:"100%", height:"100%",
    videoId: CURATED_TRACKS[0].id,
    playerVars: { controls:1, rel:0, playsinline:1, disablekb:1, modestbranding:1, origin:window.location.origin },
    events: {
      onReady() {
        playerReady = true;
        setVol(currentVol);
        setInterval(tick, 400);
        el.start.disabled = false;
        el.startText.textContent = "Start Listening";
        el.status.textContent = "Click start or pick any song";
      },
      onStateChange(e) {
        const S = YT.PlayerState;
        const rh = roomHook();
        if (rh) rh.onPlayerState(e.data);
        if (e.data===S.PLAYING) setPlayingUI(true);
        else if (e.data===S.PAUSED) setPlayingUI(false);
        else if (e.data===S.BUFFERING) { el.status.textContent="Loading…"; }
        else if (e.data===S.ENDED) { rh ? rh.onEnded(false) : next(); }
      },
      onError() {
        el.status.textContent="Can't play this song here, skipping…";
        const rh = roomHook();
        setTimeout(() => rh ? rh.onEnded(true) : next(), 800);
      }
    }
  });
};

function tick() {
  if (!player||!started||seeking) return;
  const d = player.getDuration()||0;
  const t = player.getCurrentTime()||0;
  el.elapsed.textContent = fmt(t);
  el.duration.textContent = fmt(d);
  if (d>0) {
    const pct = t/d;
    el.seek.value = Math.round(pct*1000);
    el.seekFill.style.width = `${pct*100}%`;
  }
}

// ---- Volume ----
function setVol(v) {
  currentVol = Math.max(0, Math.min(100, v));
  el.volume.value = currentVol;
  el.volFill.style.width = `${currentVol}%`;
  el.volPct.textContent = `${currentVol}%`;
  if (player && playerReady) player.setVolume(currentVol);
}

// ---- Events ----
el.start.addEventListener("click", startPlay);
el.play.addEventListener("click", togglePlay);
el.next.addEventListener("click", () => started ? next() : startPlay());
el.prev.addEventListener("click", () => started ? prev() : startPlay());

el.shuffle.addEventListener("click", () => {
  shuffleOn = !shuffleOn;
  el.shuffle.classList.toggle("active", shuffleOn);
  el.shuffle.setAttribute("aria-pressed", String(shuffleOn));
  if (started && currentIdx>=0) buildQueue(currentIdx);
});

el.loop.addEventListener("click", () => {
  loopOne = !loopOne;
  el.loop.classList.toggle("active", loopOne);
  el.loop.setAttribute("aria-pressed", String(loopOne));
});

el.seek.addEventListener("input", () => {
  seeking = true;
  const d = playerReady ? player.getDuration() : 0;
  const frac = el.seek.value/1000;
  el.elapsed.textContent = fmt(frac*d);
  el.seekFill.style.width = `${frac*100}%`;
});
el.seek.addEventListener("change", () => {
  if (playerReady && started) {
    const target = (el.seek.value/1000)*player.getDuration();
    player.seekTo(target, true);
    const rh = roomHook(); if (rh) rh.onSeek(target);
  }
  seeking = false;
});

el.volume.addEventListener("input", e => setVol(Number(e.target.value)));
el.muteBtn.addEventListener("click", () => {
  if (muted) { setVol(currentVol||70); muted=false; }
  else { if(player&&playerReady) player.setVolume(0); el.volFill.style.width="0%"; el.volPct.textContent="0%"; muted=true; }
});

// Filter tabs
document.querySelectorAll(".ftab").forEach(tab => {
  tab.addEventListener("click", () => {
    document.querySelectorAll(".ftab").forEach(t=>t.classList.remove("active"));
    tab.classList.add("active");
    filterCat = tab.dataset.filter;
    renderList();
  });
});

// Search
el.searchInput.addEventListener("input", e => { searchQ=e.target.value; renderList(); });

// Theme switcher
const THEMES = [
  { cls:"",            label:"Twilight" },
  { cls:"theme-rose",  label:"Rose" },
  { cls:"theme-midnight", label:"Midnight" },
];
let themeIdx = 0;
el.themeToggle.addEventListener("click", () => {
  document.body.classList.remove(THEMES[themeIdx].cls);
  themeIdx = (themeIdx+1)%THEMES.length;
  document.body.classList.add(THEMES[themeIdx].cls);
  el.themeLabel.textContent = THEMES[themeIdx].label;
});

// Rain
let rainOn = false;
el.rainToggle.addEventListener("click", () => {
  rainOn = !rainOn;
  el.rainToggle.classList.toggle("active", rainOn);
  el.rainToggle.setAttribute("aria-pressed", String(rainOn));
  rainOn ? el.rainAudio.play().catch(()=>{}) : el.rainAudio.pause();
});

// Custom playlist modal
el.customPlBtn.addEventListener("click", () => { el.customModal.classList.remove("hidden"); el.customModal.setAttribute("aria-hidden","false"); });
el.closeModalBtn.addEventListener("click", () => { el.customModal.classList.add("hidden"); el.customModal.setAttribute("aria-hidden","true"); });

  el.resetCuratedBtn.addEventListener("click", () => {
  customLoaded=false; tracks=[...baseTracks()]; currentIdx=-1; queue=[]; pos=-1; renderList();
  el.customModal.classList.add("hidden");
  el.status.textContent = personalTracks ? "Back to your playlist" : "Restored default Peace playlist!";
});

el.applyCustomPlBtn.addEventListener("click", () => {
  let raw = el.customPlInput.value.trim();
  if (!raw) return;
  let plId = raw;
  if (raw.includes("list=")) { try { plId=new URL(raw).searchParams.get("list")||raw; } catch { plId=raw.split("list=")[1]?.split("&")[0]||raw; } }
  el.customModal.classList.add("hidden");
  el.status.textContent=`Loading playlist ${plId}…`;
  if (player&&playerReady) {
    player.loadPlaylist({ list:plId, listType:"playlist", index:0 });
    let att=0;
    const check=setInterval(()=>{
      att++;
      const ids=player.getPlaylist();
      if (ids?.length) {
        clearInterval(check);
        tracks=ids.map((id,i)=>({id, title:`Track ${i+1}`, artist:"YouTube", category:"custom", mood:"Custom", quote:"From your custom playlist"}));
        customLoaded=true; renderList(); buildQueue(0); playQueuePos(0);
      } else if (att>40) { clearInterval(check); el.status.textContent="Couldn't load playlist — is it public?"; }
    }, 400);
  }
});

// Video toggle
el.toggleScreenBtn.addEventListener("click", () => {
  const collapsed = el.screenCollapsible.classList.toggle("collapsed");
  el.toggleScreenBtn.textContent = collapsed ? "Show" : "Hide";
});

// Keyboard
document.addEventListener("keydown", e => {
  if (e.target.tagName==="INPUT") return;
  if (e.code==="Space"&&e.target.tagName!=="BUTTON") { e.preventDefault(); togglePlay(); }
  else if (e.code==="ArrowRight") el.next.click();
  else if (e.code==="ArrowLeft")  el.prev.click();
});

if ("mediaSession" in navigator) {
  navigator.mediaSession.setActionHandler("play",        ()=>started ? player.playVideo() : startPlay());
  navigator.mediaSession.setActionHandler("pause",       ()=>started && player.pauseVideo());
  navigator.mediaSession.setActionHandler("nexttrack",   ()=>el.next.click());
  navigator.mediaSession.setActionHandler("previoustrack",()=>el.prev.click());
}

// ---- Bokeh Canvas ----
function initBokeh() {
  const canvas = $("bokehCanvas");
  if (!canvas) return;
  const ctx = canvas.getContext("2d");
  let W = canvas.width = window.innerWidth;
  let H = canvas.height = window.innerHeight;
  window.addEventListener("resize", () => { W=canvas.width=window.innerWidth; H=canvas.height=window.innerHeight; });

  const DOTS = 42;
  const dots = Array.from({length:DOTS}, () => ({
    x: Math.random()*W, y: Math.random()*H,
    r: Math.random()*5+2,
    vx: (Math.random()-0.5)*0.35,
    vy: -(Math.random()*0.55+0.15),
    a: Math.random()*0.45+0.15,
    hue: Math.random()>0.55 ? 32 : (Math.random()>0.5 ? 10 : 340),
  }));

  (function draw() {
    ctx.clearRect(0,0,W,H);
    for (const d of dots) {
      d.x+=d.vx; d.y+=d.vy;
      if (d.y<-10) { d.y=H+10; d.x=Math.random()*W; }
      if (d.x<-10) d.x=W+10;
      if (d.x>W+10) d.x=-10;
      const g=ctx.createRadialGradient(d.x,d.y,0,d.x,d.y,d.r*2.8);
      g.addColorStop(0,`hsla(${d.hue},80%,68%,${d.a})`);
      g.addColorStop(0.55,`hsla(${d.hue},75%,55%,${d.a*0.35})`);
      g.addColorStop(1,"transparent");
      ctx.beginPath(); ctx.arc(d.x,d.y,d.r*2.8,0,Math.PI*2); ctx.fillStyle=g; ctx.fill();
    }
    requestAnimationFrame(draw);
  })();
}

// ---- Room bridge (used by room.js) ----
function showCustomTrack(t) {
  currentIdx = tracks.findIndex(x => x.id === t.id);
  el.title.textContent = t.title || "Untitled";
  el.artist.textContent = t.artist || "Shared in the room";
  el.quote.textContent = t.quote ? `"${t.quote}"` : `"Listening together…"`;
  el.originBadge.textContent = "Listening Room";
  el.moodBadge.textContent = "Together";
  document.title = `${t.title || "Now playing"} | Peace`;
  document.querySelectorAll(".song-row").forEach(r => {
    r.classList.toggle("active", Number(r.dataset.index) === currentIdx);
  });
  if ("mediaSession" in navigator) {
    navigator.mediaSession.metadata = new MediaMetadata({
      title: t.title || "Now playing",
      artist: t.artist || "",
      album: "Listening Room · Peace",
      artwork: [{ src:`https://i.ytimg.com/vi/${t.id}/hqdefault.jpg`, sizes:"480x360", type:"image/jpeg" }],
    });
  }
}

// Swaps in a new track list while keeping the play order and the current song intact.
function applyTracks(newTracks) {
  const curId = currentIdx >= 0 && tracks[currentIdx] ? tracks[currentIdx].id : null;
  const oldIds = queue.map(i => tracks[i] && tracks[i].id);
  const survivorsUpToNow = pos >= 0 ? oldIds.slice(0, pos + 1) : [];
  tracks = newTracks;
  const idxOf = id => tracks.findIndex(t => t.id === id);
  const seen = new Set();
  const kept = [];
  oldIds.forEach(id => {
    const i = id ? idxOf(id) : -1;
    if (i >= 0 && !seen.has(i)) { seen.add(i); kept.push(i); }
  });
  const fresh = tracks.map((_, i) => i).filter(i => !seen.has(i));
  queue = kept.concat(shuffleOn ? shuffle(fresh) : fresh);
  pos = survivorsUpToNow.filter(id => id && idxOf(id) >= 0).length - 1;
  currentIdx = curId ? idxOf(curId) : -1;
  renderList();
}

window.PeaceAPI = {
  isReady:    () => playerReady,
  hasStarted: () => started,
  getTime:    () => (playerReady ? (player.getCurrentTime() || 0) : 0),
  getVideoId: () => {
    try { return playerReady ? ((player.getVideoData() || {}).video_id || null) : null; }
    catch { return null; }
  },
  isPlaying:  () => playerReady && player.getPlayerState() === YT.PlayerState.PLAYING,
  currentInfo: () => ({ title: el.title.textContent, artist: el.artist.textContent }),
  currentTrack() {
    const id = this.getVideoId();
    return (started && id) ? { id, ...this.currentInfo() } : null;
  },
  load(track, startSec = 0, playing = true) {
    if (!playerReady) return;
    started = true;
    el.start.classList.add("hidden");
    const args = { videoId: track.id, startSeconds: Math.max(0, startSec || 0) };
    if (playing) player.loadVideoById(args); else player.cueVideoById(args);
    showCustomTrack(track);
    if (!playing) setPlayingUI(false);
  },
  seekTo: (t) => { if (playerReady) player.seekTo(t, true); },
  play:   () => { if (playerReady) player.playVideo(); },
  pause:  () => { if (playerReady) player.pauseVideo(); },
  getDefaultTracks: () => CURATED_TRACKS.map(t => ({ ...t })),
  // room.js hands over the signed-in user's playlist here (null when signed out).
  setPersonal(list) {
    personalTracks = Array.isArray(list) ? list.map(t => ({ ...t })) : null;
    if (customLoaded) return;   // a pasted YouTube playlist is showing; "Reset" will pick this up
    applyTracks([...baseTracks()]);
  },
};

// ---- Boot ----
renderList();
initBokeh();
setVol(80);
