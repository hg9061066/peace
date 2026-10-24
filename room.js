// ================================================================
// LISTENING ROOM: Firebase Auth + Firestore
// Chat, a shared song list, and synced "listen together" playback.
// Loaded as an ES module after app.js, which exposes window.PeaceAPI.
// ================================================================
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import {
  getAuth, GoogleAuthProvider, signInWithPopup, signInWithRedirect, getRedirectResult, signOut, onAuthStateChanged,
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import {
  getFirestore, doc, collection, getDoc, getDocs, getDocFromServer, setDoc, updateDoc, deleteDoc, addDoc,
  onSnapshot, query, orderBy, limitToLast, serverTimestamp, runTransaction, writeBatch,
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyAdU8IyybDgwxcf8c2wHXRICbQZaGAJi34",
  authDomain: "the-listening-room-85ff9.firebaseapp.com",
  projectId: "the-listening-room-85ff9",
  storageBucket: "the-listening-room-85ff9.firebasestorage.app",
  messagingSenderId: "672086385131",
  appId: "1:672086385131:web:78aeeca457f249dca9f9ae",
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// ---------- DOM ----------
const $ = (id) => document.getElementById(id);
const el = {
  btn: $("roomBtn"), badge: $("roomBadge"), panel: $("roomPanel"), close: $("roomClose"), msg: $("roomMsg"),
  signedOut: $("roomSignedOut"), signIn: $("roomSignIn"),
  lobby: $("roomLobby"), userImg: $("roomUserImg"), userName: $("roomUserName"), signOut: $("roomSignOut"),
  invite: $("roomInvite"), inviteName: $("roomInviteName"), inviteJoin: $("roomInviteJoin"),
  nameInput: $("roomNameInput"), create: $("roomCreate"), joinInput: $("roomJoinInput"), join: $("roomJoin"),
  recentsWrap: $("roomRecentsWrap"), recents: $("roomRecents"),
  live: $("roomLive"), roomName: $("roomName"), members: $("roomMembers"), memberCount: $("roomMemberCount"),
  copy: $("roomCopy"), leave: $("roomLeave"), sync: $("roomSync"), syncStatus: $("roomSyncStatus"),
  tabs: document.querySelectorAll(".rtab"), tabChat: $("tabChat"), tabSongs: $("tabSongs"), songCount: $("roomSongCount"),
  chatList: $("chatList"), chatForm: $("chatForm"), chatInput: $("chatInput"),
  songForm: $("songForm"), songInput: $("songInput"), addCurrent: $("addCurrent"), songs: $("roomSongs"),
  songAlsoMine: $("songAlsoMine"),
  del: $("roomDelete"), timer: $("roomTimer"),
  plAddForm: $("plAddForm"), plAddInput: $("plAddInput"), plAddRoomWrap: $("plAddRoomWrap"), plAddRoom: $("plAddRoom"),
  plMsg: $("plMsg"), plDesc: $("plDesc"),
};

const gate = { btn: $("gateSignIn"), msg: $("gateMsg"), wait: $("gateWait") };

// ---------- State ----------
let user = null;
let room = null;                 // { id, name, ownerUid }
let unsubs = [];
let members = [];
let songs = [];                  // [{ docId, videoId, title, author, addedBy, addedByName }]
let playback = null;             // latest room playback state
let syncOn = false;
let clockOffset = 0;             // server time minus local time, in ms
let applyingUntil = 0;           // ignore our own player events until this time
let lastStable = null;           // last non-buffering player state
let errStreak = 0;
let pendingRoomId = new URLSearchParams(location.search).get("room");
let panelOpen = false;
let activeTab = "chat";
let chatReady = false;
let unread = 0;
let myTracks = null;             // the signed-in user's own playlist, or null until it has loaded
let myUnsub = null;
let inboxUnsub = null;           // songs handed to me by rooms that have closed
let inboxDocs = [];
const importing = new Set();
const purging = new Set();
let closing = false;             // this room is being deleted or has run out of time
let timerId = null;
const PL_DESC_DEFAULT = el.plDesc ? el.plDesc.textContent : "";
const clientId = Math.random().toString(36).slice(2, 10);

const api = () => window.PeaceAPI;
const show = (node, on) => node.classList.toggle("hidden", !on);
const isVideoId = (s) => typeof s === "string" && /^[\w-]{11}$/.test(s);
const initial = (name) => (name || "?").trim().charAt(0).toUpperCase() || "?";
const fmtTime = (ts) => {
  const d = ts && ts.toDate ? ts.toDate() : null;
  return d ? d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "";
};

function say(text, isError = true) {
  el.msg.textContent = text || "";
  el.msg.classList.toggle("ok", !isError);
  show(el.msg, !!text);
  clearTimeout(say.t);
  if (text) say.t = setTimeout(() => say(""), 7000);
}

function errText(e) {
  const c = e && e.code ? e.code : "";
  if (c === "auth/unauthorized-domain") return "This site's domain isn't allowed yet. Add it under Firebase > Authentication > Settings > Authorized domains.";
  if (c === "auth/api-key-not-valid" || c === "auth/invalid-api-key") return "The Firebase API key looks wrong. Check firebaseConfig in room.js.";
  if (c === "permission-denied") return "You don't have access to this room.";
  if (c === "unavailable") return "You seem to be offline.";
  return (e && e.message) ? e.message : "Something went wrong.";
}

// ---------- Recent rooms (per browser, per account) ----------
const recentKey = () => `peace.rooms.${user ? user.uid : "anon"}`;
function getRecents() { try { return JSON.parse(localStorage.getItem(recentKey()) || "[]"); } catch { return []; } }
function saveRecent(id, name) {
  try {
    const list = getRecents().filter((r) => r.id !== id);
    list.unshift({ id, name });
    localStorage.setItem(recentKey(), JSON.stringify(list.slice(0, 6)));
  } catch { /* storage unavailable */ }
}
function forgetRecent(id) {
  try { localStorage.setItem(recentKey(), JSON.stringify(getRecents().filter((r) => r.id !== id))); } catch { /* ignore */ }
}

// ---------- Panel ----------
function openPanel() {
  panelOpen = true;
  el.panel.classList.add("open");
  if (activeTab === "chat") { unread = 0; renderBadge(); }
  showInvite();
}
function closePanel() { panelOpen = false; el.panel.classList.remove("open"); }

function renderBadge() {
  el.badge.textContent = unread > 99 ? "99+" : String(unread);
  show(el.badge, unread > 0);
}

function renderPanel() {
  show(el.signedOut, !user);
  show(el.lobby, !!user && !room);
  show(el.live, !!user && !!room);
  if (user) {
    el.userName.textContent = user.displayName || user.email || "You";
    if (user.photoURL) { el.userImg.src = user.photoURL; show(el.userImg, true); } else { show(el.userImg, false); }
    renderRecents();
  }
  show(el.del, !!user && !!room && room.ownerUid === user.uid);
  renderPlaylistUI();
}

function renderRecents() {
  const list = getRecents();
  el.recents.innerHTML = "";
  show(el.recentsWrap, list.length > 0);
  list.forEach((r) => {
    const li = document.createElement("li");
    const b = document.createElement("button");
    b.type = "button";
    b.className = "room-recent";
    b.textContent = r.name || "Room";
    b.addEventListener("click", () => safely(() => enterRoom(r.id)));
    li.appendChild(b);
    el.recents.appendChild(li);
  });
}

async function showInvite() {
  if (!pendingRoomId || !user || room) { show(el.invite, false); return; }
  try {
    const s = await getDoc(doc(db, "rooms", pendingRoomId));
    if (!s.exists()) { say("That invite link doesn't match any room."); pendingRoomId = null; show(el.invite, false); return; }
    const d = s.data({ serverTimestamps: "estimate" });
    if (isExpired(d)) { say("That room has expired."); pendingRoomId = null; show(el.invite, false); return; }
    el.inviteName.textContent = d.name || "a room";
    show(el.invite, true);
  } catch (e) { say(errText(e)); }
}

async function safely(fn) {
  try { await fn(); } catch (e) { console.error(e); say(errText(e)); }
}

// ---------- Auth ----------
function gateSay(text) {
  gate.msg.textContent = text || "";
  show(gate.msg, !!text);
}

// "loading" (checking), "signedout" (show the button), "open" (signed in). Nothing works behind a closed gate.
function setGate(state) {
  const open = state === "open";
  document.body.classList.toggle("gated", !open);
  show(gate.btn, state === "signedout");
  show(gate.wait, state === "loading");
  [document.querySelector(".app-wrap"), el.panel, $("customModal")].forEach((n) => { if (n) n.inert = !open; });
  if (!open && api() && api().pause) { try { api().pause(); } catch { /* player not ready yet */ } }
}

async function signIn() {
  gateSay("");
  const provider = new GoogleAuthProvider();
  try {
    await signInWithPopup(auth, provider);
  } catch (e) {
    if (e.code === "auth/popup-blocked" || e.code === "auth/operation-not-supported-in-this-environment") {
      try { await signInWithRedirect(auth, provider); } catch (e2) { gateSay(errText(e2)); }
    } else if (e.code !== "auth/popup-closed-by-user" && e.code !== "auth/cancelled-popup-request") {
      gateSay(errText(e));
    }
  }
}

// Coming back from a redirect sign-in: show any error on the sign-in screen.
getRedirectResult(auth).catch((e) => gateSay(errText(e)));

onAuthStateChanged(auth, (u) => {
  window.__peaceAuthReady = true;
  user = u;
  setGate(u ? "open" : "signedout");
  if (!u) { leaveLocal(); stopPersonal(); }
  renderPanel();
  if (u) { showInvite(); startPersonal(); }
});

// ---------- Rooms ----------
function memberData() {
  return {
    name: user.displayName || "Guest",
    photo: user.photoURL || "",
    joinedAt: serverTimestamp(),
    lastSeen: serverTimestamp(),
  };
}

function parseRoomId(input) {
  const s = (input || "").trim();
  if (!s) return null;
  try { const id = new URL(s).searchParams.get("room"); if (id) return id; } catch { /* not a URL */ }
  return /^[A-Za-z0-9]{10,40}$/.test(s) ? s : null;
}

async function createRoom(name) {
  const ref = doc(collection(db, "rooms"));
  await setDoc(ref, {
    name,
    ownerUid: user.uid,
    ownerName: user.displayName || "",
    createdAt: serverTimestamp(),
    playback: null,
  });
  await enterRoom(ref.id);
}

async function enterRoom(id) {
  const snap = await getDoc(doc(db, "rooms", id));
  if (!snap.exists()) { forgetRecent(id); renderRecents(); throw new Error("Room not found."); }
  await calibrateClock();
  const d = snap.data({ serverTimestamps: "estimate" });
  const mref = doc(db, "rooms", id, "members", user.uid);
  const mine = await getDoc(mref);
  if (isExpired(d)) {
    // Rooms last one hour. A member opening an old link finishes the cleanup; anyone else is turned away.
    forgetRecent(id); renderRecents();
    if (mine.exists()) {
      await purgeRoom(id);
      throw new Error("That room's hour was up, so it has been closed. Songs you added are saved to your playlist.");
    }
    throw new Error("That room has expired.");
  }
  if (!mine.exists()) await setDoc(mref, memberData());

  leaveLocal(true);
  room = {
    id, name: d.name || "Room", ownerUid: d.ownerUid,
    createdMs: d.createdAt && d.createdAt.toMillis ? d.createdAt.toMillis() : serverNow(),
  };
  pendingRoomId = null;
  saveRecent(id, room.name);
  try { history.replaceState(null, "", `${location.pathname}?room=${id}`); } catch { /* ignore */ }
  el.roomName.textContent = room.name;
  show(el.invite, false);
  renderPanel();
  subscribe();
  renderSync();
  startTimer();
}

function leaveLocal(keepUrl = false) {
  unsubs.forEach((u) => { try { u(); } catch { /* ignore */ } });
  unsubs = [];
  room = null; members = []; songs = []; playback = null;
  syncOn = false; chatReady = false; unread = 0; errStreak = 0;
  closing = false; stopTimer(); lockRoomUI(false);
  el.chatList.innerHTML = ""; el.songs.innerHTML = "";
  if (!keepUrl) { try { history.replaceState(null, "", location.pathname); } catch { /* ignore */ } }
  renderBadge(); renderSync(); renderPanel();
}

async function leaveRoom() {
  const id = room.id;
  leaveLocal();
  forgetRecent(id);
  renderRecents();
  try { await deleteDoc(doc(db, "rooms", id, "members", user.uid)); } catch { /* ignore */ }
}

// Measures how far this device's clock is from Firestore's server clock.
// Uses the person's own user doc, so it works whether or not a room is open.
let clockReady = false;
async function calibrateClock() {
  if (!user) return;
  try {
    const ref = doc(db, "users", user.uid);
    const t0 = Date.now();
    await setDoc(ref, { seen: serverTimestamp() }, { merge: true });
    const t1 = Date.now();
    const s = await getDocFromServer(ref);
    clockOffset = s.data().seen.toMillis() - (t0 + t1) / 2;
    clockReady = true;
  } catch { /* keep previous offset */ }
}

// ---------- Room lifetime: one hour, then everything goes ----------
const HOUR_MS = 60 * 60 * 1000;   // keep in step with duration.value(1, 'h') in firestore.rules
const serverNow = () => Date.now() + clockOffset;
const isExpired = (d) => !!(clockReady && d && d.createdAt && d.createdAt.toMillis && serverNow() >= d.createdAt.toMillis() + HOUR_MS);

async function inChunks(items, size, fn) {
  for (let i = 0; i < items.length; i += size) await Promise.all(items.slice(i, i + size).map(fn));
}

function mmss(ms) {
  const s = Math.max(0, Math.ceil(ms / 1000));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
}

function stopTimer() {
  if (timerId) { clearInterval(timerId); timerId = null; }
  if (el.timer) { el.timer.textContent = ""; el.timer.classList.remove("warn"); }
}

function startTimer() {
  stopTimer();
  if (!room) return;
  timerId = setInterval(tickRoom, 1000);
  tickRoom();
}

function lockRoomUI(on) {
  el.live.classList.toggle("closing", on);
  [el.chatInput, el.songInput, el.songAlsoMine, el.sync, el.addCurrent].forEach((n) => { if (n) n.disabled = on; });
}

function tickRoom() {
  if (!room || !clockReady) return;
  const left = room.createdMs + HOUR_MS - serverNow();
  if (left > 0) {
    el.timer.textContent = `This room closes in ${mmss(left)}`;
    el.timer.classList.toggle("warn", left < 5 * 60 * 1000);
    return;
  }
  el.timer.textContent = "Time's up. Closing the room…";
  if (closing) return;
  closing = true;
  lockRoomUI(true);
  const id = room.id;
  // The creator goes first; everyone else waits a few seconds in case the creator's browser is closed.
  const delay = room.ownerUid === user.uid ? 500 : 4000 + Math.random() * 8000;
  setTimeout(() => autoClose(id, 0), delay);
}

async function autoClose(id, attempt) {
  if (!room || room.id !== id) return;
  try {
    const s = await getDocFromServer(doc(db, "rooms", id));
    if (!s.exists()) { roomGone(); return; }
    await purgeRoom(id);
    roomGone();
  } catch (e) {
    console.error(e);
    if (attempt < 4) setTimeout(() => autoClose(id, attempt + 1), 5000 * (attempt + 1));
    else say("Couldn't finish closing this room. It is locked and will be cleaned up the next time a member opens the site.");
  }
}

// The room is gone (deleted by its creator, or its hour ran out): leave it and say so.
function roomGone() {
  if (!room) return;
  forgetRecent(room.id);
  leaveLocal();
  say("This room has closed. Songs you added are saved to your playlist.", false);
  if (!panelOpen) openPanel();
}

// Deletes the room and everything in it. Each song is first handed to the person who added it
// (they get it in their own playlist), then chat, songs, members and the room itself are erased.
async function purgeRoom(id) {
  if (purging.has(id)) return;
  purging.add(id);
  try {
    const rref = doc(db, "rooms", id);
    const songSnap = await getDocs(collection(rref, "songs"));
    let failed = 0;
    await inChunks(songSnap.docs, 5, async (d) => {
      const s = d.data();
      if (!isVideoId(s.videoId) || !s.addedBy) return;
      try {
        await addDoc(collection(db, "users", s.addedBy, "inbox"), {
          videoId: s.videoId,
          title: String(s.title || s.videoId).slice(0, 300),
          artist: String(s.author || "").slice(0, 200),
          fromRoom: id,
          songId: d.id,
          createdAt: serverTimestamp(),
        });
      } catch (e) { failed++; console.error(e); }
    });
    if (failed) throw new Error("Couldn't pass every song on to the person who added it, so nothing was deleted. Please try again.");

    const msgSnap = await getDocs(collection(rref, "messages"));
    await inChunks(msgSnap.docs, 8, (d) => deleteDoc(d.ref).catch(() => { }));
    await inChunks(songSnap.docs, 8, (d) => deleteDoc(d.ref).catch(() => { }));
    const left = (await getDocs(collection(rref, "messages"))).size + (await getDocs(collection(rref, "songs"))).size;
    if (left) throw new Error("Some chat or songs couldn't be deleted. Please try again.");

    const memSnap = await getDocs(collection(rref, "members"));
    await inChunks(memSnap.docs.filter((d) => d.id !== user.uid), 8, (d) => deleteDoc(d.ref).catch(() => { }));
    await deleteDoc(rref);
    await deleteDoc(doc(rref, "members", user.uid)).catch(() => { });
  } finally { purging.delete(id); }
}

async function deleteRoomNow() {
  if (!room || room.ownerUid !== user.uid) return;
  const ok = window.confirm(`Delete "${room.name}" for everyone?\n\nThe chat will be erased. Songs go to the playlist of the person who added them.`);
  if (!ok) return;
  closing = true;
  lockRoomUI(true);
  el.timer.textContent = "Deleting the room…";
  try { await purgeRoom(room.id); }
  catch (e) { closing = false; lockRoomUI(false); tickRoom(); throw e; }
  roomGone();
}

// Rooms from this browser's history that ran out of time while nobody had the site open.
async function sweepExpired() {
  if (!user || !clockReady) return;
  for (const r of getRecents()) {
    if (room && room.id === r.id) continue;
    try {
      const s = await getDoc(doc(db, "rooms", r.id));
      if (!s.exists()) { forgetRecent(r.id); continue; }
      if (!isExpired(s.data({ serverTimestamps: "estimate" }))) continue;
      const m = await getDoc(doc(db, "rooms", r.id, "members", user.uid));
      if (m.exists()) await purgeRoom(r.id);
      forgetRecent(r.id);
    } catch (e) { console.warn("sweep skipped", r.id, e); }
  }
  renderRecents();
}

// ---------- Live data ----------
function subscribe() {
  const id = room.id;
  // Once a room is deleted its other listeners start failing with "permission denied". That's expected, not an error.
  const onErr = async (e) => {
    console.error(e);
    if (!room || room.id !== id) return;
    if (e && e.code === "permission-denied") {
      try { const s = await getDoc(doc(db, "rooms", id)); if (!s.exists()) { roomGone(); return; } } catch { /* fall through */ }
    }
    if (!closing) say(errText(e));
  };

  unsubs.push(onSnapshot(doc(db, "rooms", id), (s) => {
    if (!room || room.id !== id) return;
    if (!s.exists()) { roomGone(); return; }
    const d = s.data({ serverTimestamps: "estimate" });
    room.name = d.name || room.name;
    room.ownerUid = d.ownerUid;
    if (d.createdAt && d.createdAt.toMillis) room.createdMs = d.createdAt.toMillis();
    el.roomName.textContent = room.name;
    const pb = d.playback
      ? { ...d.playback, updatedAtMs: d.playback.updatedAt && d.playback.updatedAt.toMillis ? d.playback.updatedAt.toMillis() : null }
      : null;
    playback = pb;
    if (pb && !s.metadata.hasPendingWrites) applyPlayback(pb, false);
    updateSyncStatus();
    renderSongs();
  }, onErr));

  unsubs.push(onSnapshot(collection(db, "rooms", id, "members"), (s) => {
    members = s.docs.map((d) => ({ uid: d.id, ...d.data() }));
    renderMembers();
  }, onErr));

  unsubs.push(onSnapshot(query(collection(db, "rooms", id, "songs"), orderBy("addedAt")), (s) => {
    songs = s.docs.map((d) => ({ docId: d.id, ...d.data({ serverTimestamps: "estimate" }) })).filter((x) => isVideoId(x.videoId));
    renderSongs();
  }, onErr));

  chatReady = false;
  unsubs.push(onSnapshot(query(collection(db, "rooms", id, "messages"), orderBy("createdAt"), limitToLast(100)), (s) => {
    const msgs = s.docs.map((d) => ({ id: d.id, ...d.data({ serverTimestamps: "estimate" }) }));
    renderChat(msgs);
    if (chatReady) {
      const fresh = s.docChanges().filter((c) => c.type === "added" && c.doc.data().uid !== user.uid).length;
      if (fresh && !(panelOpen && activeTab === "chat")) { unread += fresh; renderBadge(); }
    }
    chatReady = true;
  }, onErr));
}

// ---------- Rendering ----------
function renderMembers() {
  el.members.innerHTML = "";
  members.slice(0, 10).forEach((m) => {
    const chip = document.createElement("span");
    chip.className = "member-chip";
    chip.title = m.name || "Guest";
    if (m.photo) {
      const img = document.createElement("img");
      img.src = m.photo; img.alt = ""; img.referrerPolicy = "no-referrer";
      chip.appendChild(img);
    } else {
      chip.textContent = initial(m.name);
    }
    el.members.appendChild(chip);
  });
  el.memberCount.textContent = `${members.length} in room`;
}

function renderChat(msgs) {
  const list = el.chatList;
  const nearBottom = list.scrollHeight - list.scrollTop - list.clientHeight < 90;
  const first = !list.children.length;
  list.innerHTML = "";
  if (!msgs.length) {
    const li = document.createElement("li");
    li.className = "room-empty";
    li.textContent = "No messages yet. Say hi!";
    list.appendChild(li);
    return;
  }
  msgs.forEach((m) => {
    const mine = m.uid === (user && user.uid);
    const li = document.createElement("li");
    li.className = "chat-msg" + (mine ? " mine" : "");
    const name = document.createElement("span");
    name.className = "chat-name";
    name.textContent = mine ? "You" : (m.name || "Guest");
    const text = document.createElement("span");
    text.className = "chat-text";
    text.textContent = m.text || "";
    const time = document.createElement("span");
    time.className = "chat-time";
    time.textContent = fmtTime(m.createdAt);
    li.append(name, text, time);
    list.appendChild(li);
  });
  if (nearBottom || first) list.scrollTop = list.scrollHeight;
}

function renderSongs() {
  el.songCount.textContent = songs.length ? `(${songs.length})` : "";
  el.songs.innerHTML = "";
  if (!songs.length) {
    const li = document.createElement("li");
    li.className = "room-empty";
    li.textContent = "No songs yet. Paste a YouTube link above.";
    el.songs.appendChild(li);
    return;
  }
  songs.forEach((s) => {
    const li = document.createElement("li");
    const row = document.createElement("div");
    row.className = "rs-row" + (playback && playback.videoId === s.videoId ? " active" : "");

    const play = document.createElement("button");
    play.type = "button";
    play.className = "rs-play";
    const thumb = document.createElement("span");
    thumb.className = "rs-thumb";
    thumb.style.backgroundImage = `url('https://i.ytimg.com/vi/${s.videoId}/mqdefault.jpg')`;
    const info = document.createElement("span");
    info.className = "rs-info";
    const title = document.createElement("span");
    title.className = "rs-title";
    title.textContent = s.title || s.videoId;
    const by = document.createElement("span");
    by.className = "rs-by";
    by.textContent = `added by ${s.addedByName || "someone"}`;
    info.append(title, by);
    play.append(thumb, info);
    play.addEventListener("click", () => playRoomSong(s));
    row.appendChild(play);

    if (user && myTracks !== null && !myTracks.some((x) => x.id === s.videoId)) {
      const save = document.createElement("button");
      save.type = "button";
      save.className = "rs-save";
      save.title = "Save to my playlist";
      save.setAttribute("aria-label", "Save to my playlist");
      save.textContent = "+";
      save.addEventListener("click", () => safely(async () => {
        const r = await addToMine({ id: s.videoId, title: s.title, artist: s.author || "", category: "custom" });
        say(r === "exists" ? "Already in your playlist." : "Saved to your playlist.", false);
      }));
      row.appendChild(save);
    }

    if (user && (s.addedBy === user.uid || (room && room.ownerUid === user.uid))) {
      const rm = document.createElement("button");
      rm.type = "button";
      rm.className = "rs-remove";
      rm.title = "Remove from room";
      rm.setAttribute("aria-label", "Remove from room");
      rm.textContent = "✕";
      rm.addEventListener("click", () => safely(() => deleteDoc(doc(db, "rooms", room.id, "songs", s.docId))));
      row.appendChild(rm);
    }
    li.appendChild(row);
    el.songs.appendChild(li);
  });
}

function renderSync() {
  el.sync.classList.toggle("on", syncOn);
  el.sync.setAttribute("aria-pressed", String(syncOn));
  el.sync.textContent = `🎧 Listen together: ${syncOn ? "On" : "Off"}`;
  updateSyncStatus();
}

function updateSyncStatus() {
  if (!room) { el.syncStatus.textContent = ""; return; }
  if (!syncOn) { el.syncStatus.textContent = "Turn this on to hear the same song at the same time as everyone in the room."; return; }
  if (!playback) { el.syncStatus.textContent = "In sync. Waiting for someone to press play or pick a song."; return; }
  el.syncStatus.textContent = `${playback.byName || "Someone"} ${playback.playing ? "is playing" : "paused"}: ${playback.title || "a song"}`;
}

// ---------- Chat and songs ----------
async function sendMessage(text) {
  text = (text || "").trim().slice(0, 500);
  if (!text || !room) return;
  await addDoc(collection(db, "rooms", room.id, "messages"), {
    uid: user.uid,
    name: user.displayName || "Guest",
    text,
    createdAt: serverTimestamp(),
  });
}

function parseVideoId(input) {
  const s = (input || "").trim();
  if (isVideoId(s)) return s;
  try {
    const u = new URL(s);
    if (u.hostname === "youtu.be") { const id = u.pathname.slice(1, 12); if (isVideoId(id)) return id; }
    const v = u.searchParams.get("v");
    if (isVideoId(v)) return v;
    const m = u.pathname.match(/\/(?:shorts|embed|live)\/([\w-]{11})/);
    if (m) return m[1];
  } catch { /* not a URL */ }
  return null;
}

async function lookupVideo(id) {
  const url = encodeURIComponent(`https://www.youtube.com/watch?v=${id}`);
  const res = await fetch(`https://www.youtube.com/oembed?url=${url}&format=json`);
  if (!res.ok) throw new Error("not-found");
  const d = await res.json();
  return { title: d.title || id, author: d.author_name || "" };
}

// Returns "exists" or "added". Callers decide what to tell the person.
async function addSongRecord({ videoId, title, author }) {
  if (songs.some((s) => s.videoId === videoId)) return "exists";
  await addDoc(collection(db, "rooms", room.id, "songs"), {
    videoId, title, author: author || "",
    addedBy: user.uid,
    addedByName: user.displayName || "Guest",
    addedAt: serverTimestamp(),
  });
  return "added";
}

// Adds to the room, and optionally saves the same song to the person's own playlist.
async function addToRoom(song, alsoMine) {
  const roomStatus = await addSongRecord(song);
  let mine = "skipped";
  if (alsoMine) mine = await addToMine({ id: song.videoId, title: song.title, artist: song.author || "", category: "custom" });
  const parts = [roomStatus === "exists" ? "That song is already in the room" : "Added to the room"];
  if (alsoMine && mine !== "skipped") parts.push(mine === "exists" ? "already in your playlist" : "saved to your playlist");
  say(parts.join(", ") + ".", false);
}

async function addSongFromInput(input, alsoMine) {
  const id = parseVideoId(input);
  if (!id) { say("That doesn't look like a YouTube video link."); return; }
  let info;
  try { info = await lookupVideo(id); }
  catch { say("Couldn't add that one. It may be private, removed, or not allowed to be embedded."); return; }
  await addToRoom({ videoId: id, title: info.title, author: info.author }, alsoMine);
}

// ---------- My playlist (saved to each person's Google account) ----------
// Doc id = video id, so a song can't be saved twice. Ids that Firestore reserves get a prefix.
const songDocId = (id) => (/^__.*__$/.test(id) ? `v${id}` : id);

const songData = (t, order) => ({
  videoId: t.id,
  title: String(t.title || t.id).slice(0, 300),
  artist: String(t.artist || "").slice(0, 200),
  category: t.category || "custom",
  mood: t.mood || "",
  quote: t.quote || "",
  order,
  addedAt: serverTimestamp(),
});

function plSay(text, isError = false) {
  el.plMsg.textContent = text || "";
  el.plMsg.classList.toggle("err", !!text && isError);
  show(el.plMsg, !!text);
  clearTimeout(plSay.t);
  if (text) plSay.t = setTimeout(() => plSay(""), 5000);
}

async function safelyPl(fn) {
  try { await fn(); } catch (e) { console.error(e); plSay(errText(e), true); }
}

function renderPlaylistUI() {
  const ready = !!user && myTracks !== null;
  show(el.plAddForm, ready);
  show(el.plAddRoomWrap, ready && !!room);
  if (!ready) show(el.plMsg, false);
  el.plDesc.textContent = ready ? "Your playlist · add or remove songs anytime" : PL_DESC_DEFAULT;
}

function stopPersonal() {
  if (myUnsub) { try { myUnsub(); } catch { /* ignore */ } myUnsub = null; }
  if (inboxUnsub) { try { inboxUnsub(); } catch { /* ignore */ } inboxUnsub = null; }
  inboxDocs = []; importing.clear();
  myTracks = null;
  if (api() && api().setPersonal) api().setPersonal(null);
  renderPlaylistUI();
  renderSongs();
}

// First sign-in: copy the default Peace playlist into this account. After that the list is theirs.
async function seedPersonal(uid) {
  const batch = writeBatch(db);
  api().getDefaultTracks().forEach((t, i) => {
    if (isVideoId(t.id)) batch.set(doc(db, "users", uid, "songs", songDocId(t.id)), songData(t, i));
  });
  batch.set(doc(db, "users", uid), { seeded: true, seededAt: serverTimestamp() });
  await batch.commit();
}

async function startPersonal() {
  stopPersonal();
  const uid = user.uid;
  calibrateClock().then(() => sweepExpired());
  try {
    const s = await getDoc(doc(db, "users", uid));
    if (!user || user.uid !== uid) return;
    if (!s.exists() || !s.data().seeded) await seedPersonal(uid);
  } catch (e) {
    console.error(e);
    say("Couldn't load your playlist. Publish the updated firestore.rules in Firebase, then reload.");
    return;
  }
  if (!user || user.uid !== uid) return;
  myUnsub = onSnapshot(query(collection(db, "users", uid, "songs"), orderBy("order")), (snap) => {
    myTracks = snap.docs
      .map((d) => d.data())
      .filter((x) => isVideoId(x.videoId))
      .map((x) => ({
        id: x.videoId, title: x.title || x.videoId, artist: x.artist || "",
        category: x.category || "custom", mood: x.mood || "", quote: x.quote || "",
      }));
    if (api() && api().setPersonal) api().setPersonal(myTracks);
    renderPlaylistUI();
    renderSongs();
    importInbox();
  }, (e) => { console.error(e); say(errText(e)); });
  inboxUnsub = onSnapshot(collection(db, "users", uid, "inbox"), (snap) => {
    inboxDocs = snap.docs;
    importInbox();
  }, (e) => console.error(e));
}

// Returns "added", "exists" or "skipped" (not signed in / playlist not loaded yet).
async function addToMine(t) {
  if (!user || myTracks === null) return "skipped";
  if (myTracks.some((x) => x.id === t.id)) return "exists";
  await setDoc(doc(db, "users", user.uid, "songs", songDocId(t.id)), songData(t, Date.now()));
  return "added";
}

async function removeFromMine(id) {
  if (!user) return;
  await deleteDoc(doc(db, "users", user.uid, "songs", songDocId(id)));
}

// Songs handed over by rooms that closed land here; move each into my playlist, then clear it from the inbox.
function importInbox() {
  if (!user || myTracks === null || !inboxDocs.length) return;
  const have = new Set(myTracks.map((t) => t.id));
  const todo = inboxDocs.filter((d) => !importing.has(d.id));
  if (!todo.length) return;
  todo.forEach((d) => importing.add(d.id));
  let saved = 0;
  Promise.all(todo.map(async (d, i) => {
    const s = d.data();
    try {
      if (isVideoId(s.videoId) && !have.has(s.videoId)) {
        have.add(s.videoId);
        await setDoc(
          doc(db, "users", user.uid, "songs", songDocId(s.videoId)),
          songData({ id: s.videoId, title: s.title, artist: s.artist, category: "custom" }, Date.now() + i),
        );
        saved++;
      }
      await deleteDoc(d.ref);
    } catch (e) { console.error(e); importing.delete(d.id); }
  })).then(() => {
    if (saved) plSay(`Saved ${saved} song${saved === 1 ? "" : "s"} from a closed room to your playlist.`);
  });
}

// app.js calls this from the ✕ button on each row of the playlist.
window.PeacePlaylist = {
  remove(id) {
    safelyPl(async () => {
      await removeFromMine(id);
      plSay("Removed from your playlist.");
    });
  },
};

// ---------- Synced playback ----------
const armGuard = () => { applyingUntil = Date.now() + 2500; };

async function publish(p) {
  if (!room || !user) return;
  const pb = {
    videoId: p.videoId,
    title: p.title || "",
    artist: p.artist || "",
    playing: !!p.playing,
    position: Math.max(0, Number(p.position) || 0),
    updatedAt: serverTimestamp(),
    byUid: user.uid,
    byName: user.displayName || "Someone",
    clientId,
  };
  playback = { ...pb, updatedAt: null, updatedAtMs: null };  // local mirror until the server echoes it
  updateSyncStatus();
  renderSongs();
  try { await updateDoc(doc(db, "rooms", room.id), { playback: pb }); }
  catch (e) { console.error(e); say(errText(e)); }
}

function applyPlayback(pb, force) {
  if (!syncOn || !pb || !api() || !api().isReady()) return;
  if (!isVideoId(pb.videoId)) return;
  if (!force && pb.clientId === clientId) return;
  if (!pb.updatedAtMs) return;

  const elapsed = pb.playing ? Math.max(0, (Date.now() + clockOffset - pb.updatedAtMs) / 1000) : 0;
  const expected = Math.max(0, (Number(pb.position) || 0) + elapsed);
  armGuard();

  if (api().getVideoId() !== pb.videoId || !api().hasStarted()) {
    api().load({ id: pb.videoId, title: pb.title, artist: pb.artist }, expected, !!pb.playing);
  } else {
    if (Math.abs(api().getTime() - expected) > 2.5) api().seekTo(expected);
    if (pb.playing && !api().isPlaying()) api().play();
    if (!pb.playing && api().isPlaying()) api().pause();
  }
}

function songAfter(videoId, dir) {
  if (!songs.length) return null;
  let i = songs.findIndex((s) => s.videoId === videoId);
  i = i < 0 ? (dir > 0 ? 0 : songs.length - 1) : (i + dir + songs.length) % songs.length;
  return songs[i];
}

function playTrack(t) {
  armGuard();
  api().load({ id: t.videoId, title: t.title, artist: t.artist }, 0, true);
  publish({ ...t, playing: true, position: 0 });
}

function playRoomSong(s) {
  const t = { videoId: s.videoId, title: s.title, artist: s.author || "" };
  if (syncOn) playTrack(t);
  else api().load({ id: t.videoId, title: t.title, artist: t.artist }, 0, true);
}

function currentVideoId() {
  return (api() && api().getVideoId()) || (playback && playback.videoId) || null;
}

function publishCurrent(playing, position) {
  const vid = api().getVideoId();
  if (!vid) return;
  const base = playback && playback.videoId === vid ? { title: playback.title, artist: playback.artist } : api().currentInfo();
  publish({
    videoId: vid, title: base.title, artist: base.artist, playing,
    position: position == null ? api().getTime() : position,
  });
}

// Hook object that app.js calls while "Listen together" is on.
window.PeaceRoomHook = {
  get active() { return !!(room && user && syncOn); },

  next() {
    const s = songAfter(currentVideoId(), 1);
    if (!s) { say("Add songs to the room first.", false); return; }
    playRoomSong(s);
  },

  prev() {
    if (api().getTime() > 3) { api().seekTo(0); publishCurrent(api().isPlaying(), 0); return; }
    const s = songAfter(currentVideoId(), -1);
    if (!s) { say("Add songs to the room first.", false); return; }
    playRoomSong(s);
  },

  start() {
    if (playback && playback.updatedAtMs) { applyPlayback(playback, true); return; }
    if (songs.length) { playRoomSong(songs[0]); return; }
    say("The room has no songs yet. Add some in the Songs tab, or pick one from the Peace playlist.", false);
  },

  playExternal(track) {
    if (!track || !isVideoId(track.id)) return;
    playTrack({ videoId: track.id, title: track.title, artist: track.artist });
  },

  onPlayerState(st) {
    if (st === 3) return;                       // buffering: ignore
    const before = lastStable;
    lastStable = st;
    if (Date.now() < applyingUntil) return;     // caused by a remote update, don't echo it back
    if (st === 1) { errStreak = 0; if (before !== 1) publishCurrent(true); }
    else if (st === 2) { if (before === 1) publishCurrent(false); }
  },

  onSeek(t) {
    if (Date.now() < applyingUntil) return;
    publishCurrent(api().isPlaying(), t);
  },

  // Song ended (or failed to play): move everyone to the next one exactly once.
  async onEnded(fromError) {
    if (!room) return;
    if (fromError) { errStreak++; if (errStreak > 5) { say("Several songs in a row couldn't be played here. Stopping."); return; } }
    const endedId = currentVideoId();
    const nxt = songAfter(endedId, 1);
    if (!nxt) return;
    const ref = doc(db, "rooms", room.id);
    let advanced = false;
    try {
      await runTransaction(db, async (tx) => {
        const s = await tx.get(ref);
        const pb = s.data().playback;
        if (pb && pb.videoId !== endedId) return;           // someone already moved on
        tx.update(ref, {
          playback: {
            videoId: nxt.videoId, title: nxt.title, artist: nxt.author || "",
            playing: true, position: 0, updatedAt: serverTimestamp(),
            byUid: user.uid, byName: user.displayName || "Someone", clientId,
          },
        });
        advanced = true;
      });
    } catch (e) { console.error(e); }
    if (advanced) {
      armGuard();
      api().load({ id: nxt.videoId, title: nxt.title, artist: nxt.author || "" }, 0, true);
    }
  },
};

// ---------- Events ----------
el.btn.addEventListener("click", () => (panelOpen ? closePanel() : openPanel()));
el.close.addEventListener("click", closePanel);
document.addEventListener("keydown", (e) => { if (e.key === "Escape" && panelOpen) closePanel(); });

el.signIn.addEventListener("click", signIn);
el.signOut.addEventListener("click", async () => { leaveLocal(); try { await signOut(auth); } catch { /* ignore */ } });

el.create.addEventListener("click", () => safely(async () => {
  const name = el.nameInput.value.trim();
  if (!name) { say("Give your room a name first."); return; }
  el.nameInput.value = "";
  await createRoom(name);
}));
el.nameInput.addEventListener("keydown", (e) => { if (e.key === "Enter") el.create.click(); });

el.join.addEventListener("click", () => safely(async () => {
  const id = parseRoomId(el.joinInput.value);
  if (!id) { say("Paste the invite link you were sent."); return; }
  el.joinInput.value = "";
  await enterRoom(id);
}));
el.joinInput.addEventListener("keydown", (e) => { if (e.key === "Enter") el.join.click(); });

el.inviteJoin.addEventListener("click", () => safely(() => enterRoom(pendingRoomId)));

el.copy.addEventListener("click", async () => {
  const link = `${location.origin}${location.pathname}?room=${room.id}`;
  try { await navigator.clipboard.writeText(link); say("Invite link copied.", false); }
  catch { window.prompt("Copy this invite link:", link); }
});
el.leave.addEventListener("click", () => safely(leaveRoom));
el.del.addEventListener("click", () => safely(deleteRoomNow));
gate.btn.addEventListener("click", signIn);

el.sync.addEventListener("click", () => {
  syncOn = !syncOn;
  renderSync();
  if (syncOn && playback) applyPlayback(playback, true);
});

el.tabs.forEach((tab) => tab.addEventListener("click", () => {
  activeTab = tab.dataset.tab;
  el.tabs.forEach((t) => t.classList.toggle("active", t === tab));
  show(el.tabChat, activeTab === "chat");
  show(el.tabSongs, activeTab === "songs");
  if (activeTab === "chat") { unread = 0; renderBadge(); el.chatList.scrollTop = el.chatList.scrollHeight; }
}));

el.chatForm.addEventListener("submit", (e) => {
  e.preventDefault();
  const text = el.chatInput.value;
  el.chatInput.value = "";
  safely(() => sendMessage(text));
});

el.songForm.addEventListener("submit", (e) => {
  e.preventDefault();
  const v = el.songInput.value;
  el.songInput.value = "";
  safely(() => addSongFromInput(v, el.songAlsoMine.checked));
});

el.addCurrent.addEventListener("click", () => safely(async () => {
  const cur = api() && api().currentTrack();
  if (!cur) { say("Nothing is playing yet.", false); return; }
  await addToRoom({ videoId: cur.id, title: cur.title, author: cur.artist }, el.songAlsoMine.checked);
}));

// Add a song from the main playlist panel: goes to my playlist, and to the room only if ticked.
el.plAddForm.addEventListener("submit", (e) => {
  e.preventDefault();
  const raw = el.plAddInput.value;
  const alsoRoom = !!room && el.plAddRoom.checked;
  safelyPl(async () => {
    const id = parseVideoId(raw);
    if (!id) { plSay("That doesn't look like a YouTube video link.", true); return; }
    let info;
    try { info = await lookupVideo(id); }
    catch { plSay("Couldn't add that one. It may be private, removed, or not allowed to be embedded.", true); return; }
    el.plAddInput.value = "";
    const mine = await addToMine({ id, title: info.title, artist: info.author, category: "custom" });
    const parts = [mine === "exists" ? "Already in your playlist" : "Added to your playlist"];
    if (alsoRoom) {
      const r = await addSongRecord({ videoId: id, title: info.title, author: info.author });
      parts.push(r === "exists" ? "already in the room" : "added to the room");
    }
    plSay(parts.join(", ") + ".");
  });
});

// ---------- Boot ----------
setGate("loading");
renderPanel();
renderSync();
if (pendingRoomId) openPanel();