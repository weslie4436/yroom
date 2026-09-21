(function () {
  var HEART =
    '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 20C10.5 18.4 7.3 15.8 5.4 11.9C4 9.1 5.2 6 8.4 6c1.8 0 3 1.1 3.6 2.2C12.6 7.1 13.8 6 15.6 6c3.2 0 4.4 3.1 3 5.9C16.7 15.8 13.5 18.4 12 20Z"/></svg>';
  var HEART_RAIL =
    '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 20C10.5 18.4 7.3 15.8 5.4 11.9C4 9.1 5.2 6 8.4 6c1.8 0 3 1.1 3.6 2.2C12.6 7.1 13.8 6 15.6 6c3.2 0 4.4 3.1 3 5.9C16.7 15.8 13.5 18.4 12 20Z" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linejoin="round"/></svg>';
  var LIST = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 7h12M6 12h12M6 17h8" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"/></svg>';
  var GRID = '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="5" y="5" width="5.5" height="5.5" rx="1" fill="none" stroke="currentColor" stroke-width="1.7"/><rect x="13.5" y="5" width="5.5" height="5.5" rx="1" fill="none" stroke="currentColor" stroke-width="1.7"/><rect x="5" y="13.5" width="5.5" height="5.5" rx="1" fill="none" stroke="currentColor" stroke-width="1.7"/><rect x="13.5" y="13.5" width="5.5" height="5.5" rx="1" fill="none" stroke="currentColor" stroke-width="1.7"/></svg>';
  var PLAY = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 6l12 6-12 6z" fill="currentColor"/></svg>';
  var FOLDER =
    '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 7h6l2 2h8v10H4z" fill="none" stroke="currentColor" stroke-width="1.6"/></svg>';
  var CAMERA =
    '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3.5" y="8" width="17" height="11.5" rx="2" fill="none" stroke="currentColor" stroke-width="1.7"/><path d="M8 8l1.4-2.4h5.2L16 8" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linejoin="round"/><circle cx="12" cy="13.6" r="3" fill="none" stroke="currentColor" stroke-width="1.7"/></svg>';
  var KEY = (window.YRoomGate && window.YRoomGate.currentKey()) || window.YROOM_VIEW_KEY || "";
  var hall = document.getElementById("hall");
  var status = document.getElementById("status");
  var feed = document.getElementById("feed");
  var home = document.getElementById("home-head");
  var gear = document.getElementById("settingsToggle");
  var menu = document.getElementById("settingsMenu");
  var catcher = document.getElementById("settingsCatch");
  var actMask = document.getElementById("actMask");
  var askMask = document.getElementById("askMask");
  var shelfBack = document.getElementById("shelf-back");
  var jobsMask = document.getElementById("jobsMask");
  var jobsBody = document.getElementById("jobsBody");
  var homeInstall = document.getElementById("home-install");
  var homeInstalled = document.getElementById("home-installed");
  var coverInput = document.getElementById("cover-input");
  var backdropInput = document.getElementById("backdrop-input");
  var bookCoverInput = document.getElementById("book-cover-input");
  var coverBusy = false;
  var stageBg = document.getElementById("stage-bg");
  var cabHud = document.getElementById("cab-hud");
  var faceImg = document.getElementById("face-img");
  var readerName = document.getElementById("reader-name");
  var jobsEntry = menu ? menu.querySelector('.settings-entry[data-job="jobs"]') : null;
  var busy = false;
  var retryTimer = 0;
  var allItems = [];
  var catalog = {};
  var mode = "manga";
  var listMode = false;
  var layoutBtn = null;
  var LAYOUT_KEY = "yroom.layout";
  try { listMode = localStorage.getItem(LAYOUT_KEY) === "list"; } catch (e) {}
  var selected = new Set();
  var selectMode = false;
  var cwd = "";
  var parentCwd = "";
  var orgSnap = { folders: [], favorites: [] };
  var actItem = null;
  var form = null;
  var askFn = null;
  var noteTimer = 0;
  var FIRST = 12;
  var THUMB_CAP = 6;
  var THUMB_CACHE = "yroom-thumbs-v1";
  var thumbGen = 0;
  var thumbActive = 0;
  var thumbWait = [];
  var blobUrls = [];
  var memThumbs = {};
  var backdropUrl = "";
  var waitBusy = false;
  var waitTimer = 0;
  var prefetchCtl = null;
  var readerOpen = false;
  var readerStaySeq = 0;
  var readerReadyTimer = 0;
  var hintTimer = 0;
  var bridgeBackAt = 0;

  if (window.YRoomGate) {
    window.YRoomGate.blockWebChrome();
    window.YRoomGate.bindKeyboard();
  } else {
    document.addEventListener("contextmenu", function (e) { e.preventDefault(); });
    document.addEventListener("selectstart", function (e) {
      if (e.target && e.target.closest && e.target.closest("input, textarea, select")) return;
      e.preventDefault();
    });
  }

  function vault() {
    if (window.YRoomGate) return window.YRoomGate.origin() || location.origin;
    var host = String(location.hostname || "");
    if (host === "127.0.0.1" || host === "localhost") return location.origin;
    return String(window.VAULT_ORIGIN || "").replace(/\/$/, "") || location.origin;
  }
  function withKey(path) {
    var u = new URL(path, vault() + "/");
    if (KEY) u.searchParams.set("k", KEY);
    return u.href;
  }
  function get(path) {
    if (window.YRoomGate) {
      return window.YRoomGate.apiRetry(path, KEY, { timeout: 20000, tries: 3 }).then(function (x) {
        if (!x || !x.j || (x.res && !x.res.ok)) throw (x && x.j) || new Error("bad");
        return x.j;
      });
    }
    return fetch(withKey(path), { credentials: "omit" }).then(function (r) {
      return r.json().then(function (data) {
        if (!r.ok) throw data;
        return data;
      });
    });
  }
  function post(path, body) {
    return fetch(withKey(path), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body || {}),
    }).then(function (r) {
      return r.json().then(function (data) {
        if (!r.ok) throw data;
        return data;
      });
    });
  }

  function showHome() {
    var blobs = document.querySelector(".blobs");
    if (blobs) blobs.hidden = true;
    hall.classList.remove("is-booting");
    hall.classList.add("is-ready");
    if (status) status.hidden = true;
    var wait = document.getElementById("invite-wait") || document.getElementById("boot-wait");
    if (wait) wait.hidden = true;
    var profile = document.querySelector(".profile");
    if (profile) profile.hidden = true;
    home.hidden = false;
    if (cabHud) cabHud.hidden = false;
  }

  function failGate(msg) {
    hall.classList.remove("is-booting");
    if (status) status.textContent = msg || "維護中,請5分鐘後再試";
  }

  function scheduleReconnect() {
    if (retryTimer) return;
    retryTimer = setTimeout(function () {
      retryTimer = 0;
      if (window.YRoomGate) {
        window.YRoomGate.refreshOrigin().then(boot);
      } else {
        location.reload();
      }
    }, 12000);
  }

  function clock(sec) {
    var n = Math.max(0, Math.floor(Number(sec) || 0));
    var h = Math.floor(n / 3600);
    var m = Math.floor((n % 3600) / 60);
    var s = n % 60;
    if (h) return h + ":" + String(m).padStart(2, "0") + ":" + String(s).padStart(2, "0");
    return m + ":" + String(s).padStart(2, "0");
  }

  function readProgressTotal(item) {
    var readTotal = Number(item.read_total) || 0;
    var pages = Number(item.page_count) || 0;
    return readTotal > 0 ? readTotal : pages;
  }

  function readLabel(item) {
    if (!item) return "";
    if (item.kind === "video") {
      if (item.finished) return "已觀看";
      var dur = Number(item.duration) || 0;
      var pos = Number(item.progress) || 0;
      if (dur > 0 && pos > 0) return Math.max(1, Math.min(100, Math.round(pos / dur * 100))) + "%";
      return "";
    }
    if (item.finished) return "已閱讀";
    if (item.progress == null) return "";
    var total = readProgressTotal(item);
    if (total <= 0) return "";
    var pct = Math.max(1, Math.min(100, Math.round((Number(item.progress) + 1) / total * 100)));
    return pct + "%";
  }

  function coverTarget(item) {
    return item.cover_book || item.id || "";
  }

  function coverUrl(item) {
    var extra = item.cover_rev ? "&r=" + encodeURIComponent(item.cover_rev) : "";
    return withKey("/cover?book=" + encodeURIComponent(coverTarget(item)) + extra);
  }

  function thumbUrl(item) {
    var extra = item.cover_rev ? "&r=" + encodeURIComponent(item.cover_rev) : "";
    return withKey("/thumb?book=" + encodeURIComponent(coverTarget(item)) + extra);
  }

  function thumbKey(item) {
    var base = location.origin || "https://yroom.local";
    return base + "/yroom-t/" + encodeURIComponent(item.id || "") + "/" + (item.cover_rev || 0);
  }

  function revokeThumbs() {
    thumbGen += 1;
    if (window.thumbObserver) {
      window.thumbObserver.disconnect();
      window.thumbObserver = null;
    }
    thumbWait.length = 0;
    blobUrls.forEach(function (url) {
      try { URL.revokeObjectURL(url); } catch (e) {}
    });
    blobUrls = [];
  }

  function pumpThumbs() {
    while (thumbActive < THUMB_CAP && thumbWait.length) {
      var job = thumbWait.shift();
      thumbActive += 1;
      job(function () {
        thumbActive -= 1;
        pumpThumbs();
      });
    }
  }

  function readCachedThumb(cacheKey) {
    if (!window.caches) return Promise.resolve(null);
    return caches.open(THUMB_CACHE).then(function (cache) {
      return cache.match(cacheKey);
    }).then(function (res) {
      return res ? res.blob() : null;
    }).catch(function () {
      return null;
    });
  }

  function writeCachedThumb(cacheKey, blob) {
    if (!blob || !cacheKey || !window.caches) return;
    caches.open(THUMB_CACHE).then(function (cache) {
      return cache.put(cacheKey, new Response(blob, { headers: { "Content-Type": blob.type || "image/jpeg" } }));
    }).catch(function () {});
  }

  function showBlob(img, blob, onReady) {
    var obj = URL.createObjectURL(blob);
    blobUrls.push(obj);
    function done() {
      img.removeEventListener("load", onLoad);
      img.removeEventListener("error", onErr);
      img.classList.add("is-on");
      if (onReady) onReady();
    }
    function onLoad() { done(); }
    function onErr() { done(); }
    img.addEventListener("load", onLoad);
    img.addEventListener("error", onErr);
    img.src = obj;
  }

  function bindThumb(img, url, cacheKey, gen) {
    var mem = memThumbs[cacheKey];
    if (mem) {
      img.classList.add("is-ready");
      showBlob(img, mem);
      return;
    }
    readCachedThumb(cacheKey).then(function (cached) {
      if (gen !== thumbGen) return;
      if (cached) {
        memThumbs[cacheKey] = cached;
        if (!img.isConnected) return;
        img.classList.add("is-ready");
        showBlob(img, cached);
        return;
      }
      function start(done) {
        fetch(url, { mode: "cors", credentials: "omit" })
          .then(function (res) {
            if (!res.ok) throw new Error("bad");
            return res.blob();
          })
          .then(function (blob) {
            memThumbs[cacheKey] = blob;
            writeCachedThumb(cacheKey, blob);
            if (gen !== thumbGen || !img.isConnected) {
              if (done) done();
              return;
            }
            showBlob(img, blob, done);
          })
          .catch(function () {
            if (gen !== thumbGen || !img.isConnected) {
              if (done) done();
              return;
            }
            img.classList.add("is-on");
            img.src = url;
            if (done) done();
          });
      }
      thumbWait.push(start);
      pumpThumbs();
    });
  }

  function watchThumb(img, item, eager) {
    var url = thumbUrl(item);
    var cacheKey = thumbKey(item);
    img.dataset.thumbUrl = url;
    img.dataset.thumbKey = cacheKey;
    if (eager || memThumbs[cacheKey] || !window.IntersectionObserver) {
      if (img.dataset.thumbBound) return;
      img.dataset.thumbBound = "1";
      bindThumb(img, url, cacheKey, thumbGen);
      return;
    }
    if (!window.thumbObserver) {
      window.thumbObserver = new IntersectionObserver(function (entries) {
        entries.forEach(function (en) {
          if (!en.isIntersecting) return;
          var node = en.target;
          window.thumbObserver.unobserve(node);
          if (node.dataset.thumbBound) return;
          node.dataset.thumbBound = "1";
          bindThumb(node, node.dataset.thumbUrl, node.dataset.thumbKey, thumbGen);
        });
      }, { rootMargin: "240px 0px" });
    }
    window.thumbObserver.observe(img);
  }

  function setJobRun(on, entry) {
    var cover = document.querySelector("#cab-hud .cab-cover");
    if (cover) cover.classList.toggle("is-run", !!on);
    var row = entry || jobsEntry;
    if (row) {
      row.classList.toggle("is-run", !!on);
      var badge = row.querySelector(".ins-icon");
      if (badge) badge.classList.toggle("is-run", !!on);
    }
  }

  function layoutStage() {
    if (!stageBg || !hall || stageBg.hidden) return;
    var hallBox = hall.getBoundingClientRect();
    var tags = document.getElementById("tag-board");
    var startBox = tags && !tags.hidden ? tags.getBoundingClientRect() : (feed ? feed.getBoundingClientRect() : null);
    var endBox = feed ? feed.getBoundingClientRect() : startBox;
    var start = startBox ? Math.max(0, startBox.top - hallBox.top) : 180;
    var end = endBox ? Math.max(start + 24, endBox.top - hallBox.top) : start + 80;
    var fade = "linear-gradient(to bottom, #000 0, #000 " + Math.round(start) + "px, transparent " + Math.round(end) + "px)";
    stageBg.style.height = Math.round(end) + "px";
    stageBg.style.webkitMaskImage = fade;
    stageBg.style.maskImage = fade;
    if (backdropUrl) tuneNameOnBackdrop(backdropUrl);
  }

  function lumaBehindName(img, stage, nameEl) {
    var stageBox = stage.getBoundingClientRect();
    var nameBox = nameEl.getBoundingClientRect();
    var iw = img.naturalWidth;
    var ih = img.naturalHeight;
    if (stageBox.width < 8 || nameBox.height < 4 || !iw || !ih) return null;
    var scale = Math.max(stageBox.width / iw, stageBox.height / ih);
    var ox = (stageBox.width - iw * scale) / 2;
    var pad = 10;
    var sx = (nameBox.left - stageBox.left - ox - pad) / scale;
    var sy = (nameBox.top - stageBox.top - pad) / scale;
    var sw = (nameBox.width + pad * 2) / scale;
    var sh = (nameBox.height + pad * 2) / scale;
    var x = Math.max(0, Math.min(iw - 1, sx));
    var y = Math.max(0, Math.min(ih - 1, sy));
    var w = Math.max(1, Math.min(iw - x, sw));
    var h = Math.max(1, Math.min(ih - y, sh));
    var canvas = document.createElement("canvas");
    canvas.width = 24;
    canvas.height = 12;
    var ctx = canvas.getContext("2d");
    if (!ctx) return null;
    try {
      ctx.drawImage(img, x, y, w, h, 0, 0, 24, 12);
      var data = ctx.getImageData(0, 0, 24, 12).data;
      var sum = 0;
      for (var i = 0; i < data.length; i += 4) {
        sum += (0.2126 * data[i] + 0.7152 * data[i + 1] + 0.0722 * data[i + 2]) / 255;
      }
      return sum / (data.length / 4);
    } catch (err) {
      return null;
    }
  }

  function tuneNameOnBackdrop(url) {
    if (!readerName || !stageBg || stageBg.hidden || !url) return;
    var img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = function () {
      if (url !== backdropUrl) return;
      var luma = lumaBehindName(img, stageBg, readerName);
      var light = luma != null && luma >= 0.65;
      readerName.classList.toggle("is-on-light", light);
      readerName.classList.toggle("is-on-dark", !light);
    };
    img.src = url;
  }

  function paintStage(reader) {
    if (!stageBg || !hall) return;
    if (reader && reader.has_backdrop && reader.id) {
      backdropUrl = vault() + "/backdrop?person=" + encodeURIComponent(reader.id) + "&k=" + encodeURIComponent(KEY) + "&r=" + (reader.backdrop_rev || 0);
      hall.classList.add("has-backdrop");
      if (readerName) {
        readerName.classList.remove("is-on-light");
        readerName.classList.add("is-on-dark");
      }
      stageBg.style.backgroundImage = "url(" + backdropUrl + ")";
      stageBg.hidden = false;
      requestAnimationFrame(layoutStage);
    } else {
      backdropUrl = "";
      hall.classList.remove("has-backdrop");
      if (readerName) readerName.classList.remove("is-on-light", "is-on-dark");
      stageBg.hidden = true;
      stageBg.style.backgroundImage = "";
    }
  }

  function renderMe(reader) {
    if (!reader) return;
    if (readerName) readerName.textContent = reader.display_name || "館主";
    if (faceImg) {
      if (reader.has_cover) {
        faceImg.src = vault() + "/cover?person=" + encodeURIComponent(reader.id || "owner") + "&k=" + encodeURIComponent(KEY) + "&r=" + (reader.cover_rev || 0);
      } else {
        faceImg.src = "./face-default.jpg?v=2";
      }
      faceImg.hidden = false;
    }
    if (cabHud) cabHud.hidden = false;
    if (home) home.hidden = false;
    paintStage(reader);
  }

  function showWaitCard(title) {
    var mask = document.getElementById("waitMask");
    var head = document.getElementById("waitTitle");
    var pct = document.getElementById("waitPct");
    if (head) head.textContent = title || "更換背景中";
    if (pct) pct.textContent = "0%";
    if (mask) mask.hidden = false;
  }

  function setWaitPct(n) {
    var pct = document.getElementById("waitPct");
    if (pct) pct.textContent = Math.max(0, Math.min(100, Math.round(n))) + "%";
  }

  function hideWaitCard() {
    var mask = document.getElementById("waitMask");
    if (mask) mask.hidden = true;
    if (waitTimer) {
      window.clearInterval(waitTimer);
      waitTimer = 0;
    }
  }

  function tickWait() {
    var pct = document.getElementById("waitPct");
    var n = parseInt((pct && pct.textContent) || "0", 10) || 0;
    if (n < 90) setWaitPct(n + 1);
  }

  function postFile(url, body, onPct) {
    return new Promise(function (resolve, reject) {
      var xhr = new XMLHttpRequest();
      xhr.open("POST", url);
      xhr.onload = function () {
        if (xhr.status >= 200 && xhr.status < 300) resolve(xhr);
        else reject(new Error("fail"));
      };
      xhr.onerror = function () { reject(new Error("net")); };
      if (xhr.upload) {
        xhr.upload.onprogress = function (ev) {
          if (ev.lengthComputable && ev.total) onPct(Math.round((ev.loaded / ev.total) * 100));
        };
      }
      xhr.send(body);
    });
  }

  function refreshMe() {
    return get("/api/me").then(function (me) {
      if (me) renderMe(me);
      return me;
    });
  }

  function shelfTab() {
    return mode === "fav" ? "fav" : (mode === "video" ? "video" : "manga");
  }

  function shelfPath() {
    var q = "/api/shelf?limit=400&tab=" + encodeURIComponent(shelfTab());
    if (cwd) q += "&cwd=" + encodeURIComponent(cwd);
    return q;
  }

  function reloadShelf() {
    return get(shelfPath()).then(function (data) {
      if (!data) return data;
      allItems = data.items || [];
      cwd = data.cwd || cwd || "";
      parentCwd = data.parent || "";
      catalog = {};
      allItems.forEach(function (item) { catalog[item.id] = item; });
      paintBack();
      paintFeed();
      return data;
    });
  }

  function paintBack() {
    if (shelfBack) shelfBack.hidden = !cwd;
  }

  function refreshOrg() {
    return get("/api/host/org").then(function (snap) {
      if (snap) orgSnap = snap;
    }).catch(function () {});
  }

  function folderTitleText(title) {
    var max = window.matchMedia("(max-width: 560px)").matches ? 5 : 15;
    var s = String(title || "");
    if (s.length <= max) return s;
    return s.slice(0, max) + "...";
  }

  function tileEpText(item) {
    if (!item) return "";
    if (item.kind === "org") {
      var label = folderTitleText(item.title || "");
      if (label) return label;
      var count = Number(item.page_count) || 0;
      return count > 1 ? count + "本" : "資料夾";
    }
    if (item.kind === "video") return item.duration ? clock(item.duration) : "";
    return item.page_count ? item.page_count + "頁" : "";
  }

  function pickedItems() {
    var out = [];
    selected.forEach(function (id) {
      if (catalog[id]) out.push(catalog[id]);
    });
    return out;
  }

  function folderOk() {
    var items = pickedItems();
    var folders = items.filter(function (it) { return it && it.kind === "org"; });
    var books = items.filter(function (it) { return it && it.kind !== "org"; });
    if (folders.length >= 2 && !books.length) return false;
    return books.length > 0 || folders.length === 1;
  }

  function flashNote(text) {
    var p = document.getElementById("askText");
    var actions = askMask && askMask.querySelector(".ask-actions");
    if (!askMask || !p) return;
    askFn = null;
    p.textContent = text;
    if (actions) actions.hidden = true;
    askMask.classList.add("is-note");
    askMask.classList.remove("is-out");
    askMask.hidden = false;
    if (noteTimer) window.clearTimeout(noteTimer);
    noteTimer = window.setTimeout(function () {
      askMask.classList.add("is-out");
      noteTimer = window.setTimeout(function () {
        if (!askMask.classList.contains("is-note")) return;
        askMask.hidden = true;
        askMask.classList.remove("is-note", "is-out");
        if (actions) actions.hidden = false;
        noteTimer = 0;
      }, 280);
    }, 1600);
  }

  function openActTitle(text) {
    var title = document.getElementById("actTitle");
    if (title) title.textContent = text;
  }

  function openActBody() {
    var body = document.getElementById("actBody");
    if (!actMask || !body) return null;
    body.innerHTML = "";
    actMask.hidden = false;
    return body;
  }

  function restoreActShell() {
    var body = document.getElementById("actBody");
    if (!body) return;
    body.innerHTML =
      "<p>重掃全部收藏。已齊的本會跳過，只補缺頁與壞頁。</p>" +
      '<button type="button" class="tag-apply" id="actGo"><span class="tag-apply-face">確認</span></button>';
    var go = document.getElementById("actGo");
    if (go) {
      go.addEventListener("click", function () {
        if (busy) return;
        busy = true;
        setJobRun(true);
        closeAct();
        post("/api/host/item", { op: "private_favorites" }).then(function () {
          busy = false;
          jobsMask.hidden = false;
          refreshJobs();
        }).catch(function () {
          busy = false;
          setJobRun(false);
        });
      });
    }
  }

  function closeAct() {
    if (actMask) actMask.hidden = true;
    actItem = null;
    form = null;
    restoreActShell();
  }

  function addConfirm(body, fn, label) {
    var btn = document.createElement("button");
    btn.type = "button";
    btn.className = "tag-apply";
    btn.innerHTML = '<span class="tag-apply-face">' + (label || "確認") + "</span>";
    btn.addEventListener("click", fn);
    body.appendChild(btn);
  }

  function formSteps(kind, item) {
    if (kind === "new_org") return [{ key: "title", label: "資料夾名稱" }];
    if (kind === "rename_org") return [{ key: "title", label: "名稱", value: item && item.title }];
    return [];
  }

  function paintForm() {
    var title = document.getElementById("actTitle");
    var body = document.getElementById("actBody");
    if (!form || !body) return;
    var step = form.steps[form.idx];
    if (title) title.textContent = step.label;
    body.innerHTML = "";
    var err = document.createElement("p");
    err.className = "err";
    err.id = "hostFormErr";
    body.appendChild(err);
    var row = document.createElement("div");
    row.className = "apple-row";
    var input = document.createElement("input");
    input.autocomplete = "off";
    input.value = form.data[step.key] || step.value || "";
    row.appendChild(input);
    body.appendChild(row);
    addConfirm(body, function () { advance(input.value); });
    input.addEventListener("keydown", function (ev) {
      if (ev.key === "Enter") {
        ev.preventDefault();
        advance(input.value);
      }
    });
    window.setTimeout(function () { input.focus(); }, 50);
  }

  function formErr(text) {
    var err = document.getElementById("hostFormErr");
    if (err) err.textContent = text;
  }

  function advance(value) {
    if (!form) return;
    var step = form.steps[form.idx];
    form.data[step.key] = value;
    submitForm();
  }

  function startForm(kind, item) {
    actItem = item || null;
    form = { kind: kind, item: item || null, steps: formSteps(kind, item), idx: 0, data: {} };
    paintForm();
    if (actMask) actMask.hidden = false;
  }

  function submitForm() {
    if (!form) return;
    var kind = form.kind;
    var data = form.data;
    var item = form.item;
    var req;
    if (kind === "new_org") {
      req = post("/api/host/org", {
        op: "folder_create",
        title: data.title || "",
        books: (item && item.books) || [],
        tab: shelfTab() === "fav" ? "manga" : shelfTab(),
      });
    } else if (kind === "rename_org" && item) {
      req = post("/api/host/org", { op: "folder_rename", folder: item.id, title: data.title || "" });
    } else {
      return;
    }
    req.then(function () {
      closeAct();
      clearSelect();
      return reloadShelf();
    }).then(refreshOrg).catch(function (err) {
      formErr((err && err.error) || "請再試一次");
    });
  }

  function openFolderSheet() {
    var books = pickedItems().filter(function (it) { return it.kind !== "org"; });
    var folders = pickedItems().filter(function (it) { return it.kind === "org"; });
    if (!books.length && !folders.length) return;
    if (folders.length >= 2 && !books.length) {
      flashNote("資料夾間無法合併");
      return;
    }
    if (!books.length && folders.length) {
      startForm("rename_org", folders[0]);
      return;
    }
    openActTitle("資料夾");
    var body = openActBody();
    if (!body) return;
    var picked = new Set(folders.map(function (it) { return it.id; }));
    var row = document.createElement("div");
    row.className = "tag-row";
    (orgSnap.folders || []).forEach(function (it) {
      var chip = document.createElement("button");
      chip.type = "button";
      chip.className = "tag-chip" + (picked.has(it.id) ? " is-on" : "");
      chip.textContent = it.title || "資料夾";
      chip.addEventListener("click", function () {
        if (picked.has(it.id)) picked.delete(it.id);
        else picked.add(it.id);
        chip.classList.toggle("is-on", picked.has(it.id));
      });
      row.appendChild(chip);
    });
    var make = document.createElement("button");
    make.type = "button";
    make.className = "tag-chip";
    make.textContent = "新建…";
    make.addEventListener("click", function () {
      startForm("new_org", { books: books.map(function (it) { return it.id; }) });
    });
    row.appendChild(make);
    body.appendChild(row);
    addConfirm(body, function () {
      var ids = Array.from(picked);
      if (!ids.length) {
        closeAct();
        return;
      }
      post("/api/host/org", {
        op: "assign",
        books: books.map(function (it) { return it.id; }),
        folders: ids,
      }).then(function () {
        closeAct();
        clearSelect();
        return reloadShelf();
      }).then(refreshOrg).catch(function (err) {
        flashNote((err && err.error) || "放不進資料夾");
      });
    });
  }

  function clearSelect() {
    selected = new Set();
    selectMode = false;
    paintPicks();
  }

  function enterSelect(id) {
    selectMode = true;
    if (id) selected.add(id);
    paintPicks();
  }

  function togglePick(id) {
    if (selected.has(id)) selected.delete(id);
    else selected.add(id);
    selectMode = selected.size > 0;
    paintPicks();
  }

  function paintPicks() {
    document.querySelectorAll("#feed .tile").forEach(function (el) {
      el.classList.toggle("is-pick", selected.has(el.dataset.id));
    });
    showRail(selectMode && selected.size > 0);
    if (selectMode && selected.size > 0) paintRailHeart();
    document.documentElement.classList.toggle("is-select", selectMode);
  }

  function paintRailHeart() {
    var rail = document.getElementById("photo-rail");
    var heart = rail && rail.querySelector(".rail-heart");
    if (!heart) return;
    var ids = Array.from(selected);
    var loved = ids.length > 0 && ids.every(function (id) {
      return catalog[id] && catalog[id].favorite;
    });
    heart.classList.toggle("is-on", loved);
  }

  function showRail(on) {
    var rail = document.getElementById("photo-rail");
    if (rail) rail.hidden = !on;
    document.documentElement.classList.toggle("has-rail", !!on);
    if (on) {
      paintRailHeart();
      var folder = rail && rail.querySelector(".rail-folder");
      if (folder) folder.classList.toggle("is-off", !folderOk());
    } else if (rail) {
      var heart = rail.querySelector(".rail-heart");
      if (heart) heart.classList.remove("is-on");
    }
  }

  function ensureRail() {
    var rail = document.getElementById("photo-rail");
    if (!rail || rail.dataset.ready) return rail;
    rail.dataset.ready = "1";
    var folder = insButton("rail-folder", FOLDER, "資料夾");
    folder.addEventListener("click", function (ev) {
      ev.preventDefault();
      ev.stopPropagation();
      if (!folderOk()) {
        flashNote("資料夾間無法合併");
        return;
      }
      openFolderSheet();
    });
    var cover = insButton("rail-cover", CAMERA, "換封面");
    cover.addEventListener("click", function (ev) {
      ev.preventDefault();
      ev.stopPropagation();
      if (!bookCoverInput) return;
      bookCoverInput.value = "";
      bookCoverInput.click();
    });
    var heart = insButton("rail-heart", HEART_RAIL, "愛心");
    heart.addEventListener("click", function (ev) {
      ev.preventDefault();
      ev.stopPropagation();
      toggleHeart();
    });
    rail.appendChild(folder);
    rail.appendChild(cover);
    rail.appendChild(heart);
    return rail;
  }

  function toggleHeart() {
    var items = pickedItems();
    if (!items.length) return;
    var orgIds = items.filter(function (it) { return it.kind === "org"; }).map(function (it) { return it.id; });
    var media = items.filter(function (it) { return it.kind !== "org"; });
    var anyOff = items.some(function (it) { return !it.favorite; });
    var chain = Promise.resolve();
    if (orgIds.length) {
      chain = chain.then(function () {
        return post("/api/host/org", { op: "favorite", ids: orgIds, on: anyOff });
      });
    }
    if (media.length) {
      var patch = {};
      media.forEach(function (it) { patch[it.id] = anyOff; });
      chain = chain.then(function () {
        return post("/api/prefs", { favorites: patch });
      });
    }
    chain.then(function () {
      clearSelect();
      return reloadShelf();
    }).then(refreshOrg);
  }

  function bindTile(btn, item) {
    var press = 0;
    var sx = 0;
    var sy = 0;
    var fromHold = false;
    function clearPress() {
      if (press) {
        window.clearTimeout(press);
        press = 0;
      }
    }
    btn.addEventListener("pointerdown", function (ev) {
      if (ev.button && ev.button !== 0) return;
      sx = ev.clientX;
      sy = ev.clientY;
      fromHold = false;
      clearPress();
      press = window.setTimeout(function () {
        press = 0;
        fromHold = true;
        if (selectMode) togglePick(item.id);
        else enterSelect(item.id);
      }, 400);
    });
    btn.addEventListener("pointermove", function (ev) {
      if (!press) return;
      if (Math.abs(ev.clientX - sx) > 14 || Math.abs(ev.clientY - sy) > 14) clearPress();
    });
    btn.addEventListener("pointerup", clearPress);
    btn.addEventListener("pointercancel", clearPress);
    ["contextmenu", "selectstart", "dragstart"].forEach(function (name) {
      btn.addEventListener(name, function (ev) { ev.preventDefault(); }, true);
    });
    btn.addEventListener("click", function (ev) {
      if (fromHold) {
        ev.preventDefault();
        ev.stopImmediatePropagation();
        return;
      }
      if (selectMode) {
        ev.preventDefault();
        ev.stopImmediatePropagation();
        togglePick(item.id);
      }
    }, true);
  }

  function insButton(className, svg, label) {
    var btn = document.createElement("button");
    btn.type = "button";
    btn.className = "ins-icon " + className;
    btn.setAttribute("aria-label", label);
    btn.title = label;
    btn.innerHTML = '<span class="ins-ring"></span><span class="ins-face">' + svg + "</span>";
    return btn;
  }

  function applyLayoutClass() {
    if (feed) feed.classList.toggle("news-list", mode === "video" && !!listMode);
    if (layoutBtn) {
      layoutBtn.hidden = mode !== "video";
      layoutBtn.classList.toggle("is-live", !!listMode);
      var face = layoutBtn.querySelector(".ins-face");
      if (face) face.innerHTML = listMode ? GRID : LIST;
      layoutBtn.setAttribute("aria-label", listMode ? "封面格子" : "橫條排列");
      layoutBtn.title = listMode ? "封面格子" : "橫條排列";
    }
    if (mode === "video" && listMode) showRail(false);
  }

  function toggleLayout() {
    if (mode !== "video") pickMode("video");
    listMode = !listMode;
    try { localStorage.setItem(LAYOUT_KEY, listMode ? "list" : "grid"); } catch (e) {}
    paintFeed();
  }

  function paintMarquee(host, text) {
    if (!host) return;
    var label = String(text || "");
    host.setAttribute("data-marquee", label);
    host.setAttribute("title", label);
    armMarquee(host);
    requestAnimationFrame(function () {
      requestAnimationFrame(function () { armMarquee(host); });
    });
  }

  function armMarquee(host) {
    if (!host) return;
    var label = host.getAttribute("data-marquee") || "";
    host.classList.remove("is-run");
    host.style.removeProperty("--marquee-s");
    host.innerHTML = "";
    var a = document.createElement("span");
    a.textContent = label;
    host.appendChild(a);
    if (host.clientWidth > 0 && a.scrollWidth > host.clientWidth + 2) {
      host.classList.add("is-run");
      host.style.setProperty("--marquee-s", Math.max(8, Math.round((a.scrollWidth + 40) / 36)) + "s");
      var b = document.createElement("span");
      b.textContent = label;
      b.setAttribute("aria-hidden", "true");
      host.appendChild(b);
    }
  }

  function refreshMarquees(root) {
    (root || document).querySelectorAll("[data-marquee]").forEach(armMarquee);
  }

  function bindMarqueeResize() {
    if (window.__famiMarqueeBound) return;
    window.__famiMarqueeBound = true;
    var t = 0;
    function kick() {
      window.clearTimeout(t);
      t = window.setTimeout(function () { refreshMarquees(document); }, 80);
    }
    window.addEventListener("resize", kick);
    if (window.visualViewport) window.visualViewport.addEventListener("resize", kick);
  }

  bindMarqueeResize();

  function filmRow(item) {
    catalog[item.id] = item;
    var row = document.createElement("div");
    row.className = "news-row";
    row.dataset.id = item.id;
    var face = document.createElement("div");
    face.className = "row-face";
    var title = document.createElement("strong");
    paintMarquee(title, item.title || "");
    var ops = document.createElement("div");
    ops.className = "row-ops";
    var time = document.createElement("span");
    time.textContent = item.duration ? clock(item.duration) : "";
    var play = insButton("row-play", PLAY, "播放");
    play.addEventListener("click", function (ev) {
      ev.preventDefault();
      ev.stopPropagation();
      if (busy || selectMode) return;
      if (!item.readable) return;
      openWatch(item);
    });
    var loved = !!item.favorite;
    var heart = insButton("row-heart" + (loved ? " is-loved" : ""), loved ? HEART : HEART_RAIL, loved ? "取消最愛" : "加入最愛");
    heart.addEventListener("click", function (ev) {
      ev.preventDefault();
      ev.stopPropagation();
      selected = new Set([item.id]);
      toggleHeart();
    });
    if (time.textContent) ops.appendChild(time);
    ops.appendChild(play);
    ops.appendChild(heart);
    face.appendChild(title);
    face.appendChild(ops);
    row.appendChild(face);
    row.addEventListener("click", function () {
      if (busy || selectMode) return;
      if (!item.readable) return;
      openWatch(item);
    });
    return row;
  }

  function paintFeed() {
    revokeThumbs();
    feed.innerHTML = "";
    feed.classList.toggle("is-film", mode === "video");
    applyLayoutClass();
    var items = allItems;
    if (!cwd) {
      items = allItems.filter(function (item) {
        if (mode === "fav") return item.favorite;
        if (mode === "video") return item.kind === "video" || item.tab === "video";
        return item.kind === "org" || (item.kind !== "video" && item.tab !== "video");
      });
    }
    items = items.filter(function (item) { return item.favorite; }).concat(
      items.filter(function (item) { return !item.favorite; })
    );
    items.forEach(function (item, index) {
      catalog[item.id] = item;
      if (mode === "video" && listMode) {
        feed.appendChild(filmRow(item));
        return;
      }
      var tile = document.createElement("button");
      tile.type = "button";
      tile.className = item.kind === "video" || item.tab === "video" ? "tile tile-film" : "tile";
      tile.setAttribute("data-id", item.id || "");
      if (item.kind === "org") tile.dataset.kind = "org";
      if (item.has_cover) {
        var img = document.createElement("img");
        img.alt = item.title || "";
        img.decoding = "async";
        if (index < FIRST) img.loading = "eager";
        img.addEventListener("error", function () {
          img.removeAttribute("src");
          img.hidden = true;
        });
        tile.appendChild(img);
        watchThumb(img, item, index < FIRST);
      } else if (item.kind === "org") {
        var mark = document.createElement("span");
        mark.className = "tile-plus";
        mark.innerHTML = FOLDER;
        tile.appendChild(mark);
      }
      var shield = document.createElement("span");
      shield.className = "tile-shield";
      tile.appendChild(shield);
      if (item.favorite) {
        var mark = document.createElement("span");
        mark.className = "tile-heart";
        mark.innerHTML = HEART;
        tile.appendChild(mark);
      }
      var meta = document.createElement("span");
      meta.className = "tile-ep";
      meta.textContent = tileEpText(item);
      if (!meta.textContent) meta.hidden = true;
      tile.appendChild(meta);
      var pct = document.createElement("span");
      pct.className = "tile-pct";
      var label = readLabel(item);
      if (label) pct.textContent = label;
      else pct.hidden = true;
      tile.appendChild(pct);
      bindTile(tile, item);
      tile.addEventListener("click", function () {
        if (busy || selectMode) return;
        if (item.kind === "org") {
          cwd = item.id;
          clearSelect();
          reloadShelf();
          return;
        }
        if (!item.readable) return;
        if (item.kind === "video") openWatch(item);
        else openReader(item);
      });
      feed.appendChild(tile);
    });
    refreshMarquees(feed);
    paintPicks();
  }

  function tileNode(item) {
    if (!feed || !item || !item.id) return null;
    var tiles = feed.querySelectorAll(".tile");
    for (var i = 0; i < tiles.length; i++) {
      if (tiles[i].dataset.id === item.id) return tiles[i];
    }
    return null;
  }

  function tileCover(item) {
    var tile = tileNode(item);
    if (!tile) return "";
    var img = tile.querySelector("img");
    if (img && (img.currentSrc || img.src)) return img.currentSrc || img.src;
    return "";
  }

  function sizeBridgeCover(coverEl, item) {
    if (!coverEl) return;
    coverEl.style.width = "";
    coverEl.style.height = "";
    var tile = tileNode(item);
    if (!tile) return;
    var box = tile.getBoundingClientRect();
    if (box.width < 8 || box.height < 8) return;
    coverEl.style.width = Math.round(box.width) + "px";
    coverEl.style.height = Math.round(box.height) + "px";
  }

  function watchingUrl(item) {
    var q = new URLSearchParams();
    q.set("video", item.id);
    q.set("k", KEY);
    q.set("wv", "10");
    return "./watch.html?" + q.toString() + "#k=" + encodeURIComponent(KEY);
  }

  function readingUrl(item, extra) {
    var q = new URLSearchParams();
    q.set("book", item.id);
    q.set("k", KEY);
    var end = (extra && extra.end) || (item.finished ? "1" : "");
    if (end) q.set("end", end);
    return "./read.html?" + q.toString() + "#k=" + encodeURIComponent(KEY);
  }

  function rememberReading(item, cover) {
    try {
      sessionStorage.setItem("yroom.reading", JSON.stringify({
        book: item.id,
        k: KEY,
        kind: item.kind || "",
        end: item.finished ? "1" : "",
        cover: cover || "",
      }));
    } catch (e) {}
  }

  function stayOverlayUrl(n) {
    var raw = (location.hash || "").replace(/^#/, "").replace(/&?stay=\d+/g, "").replace(/&$/, "");
    return location.pathname + location.search + "#" + (raw ? raw + "&stay=" + n : "stay=" + n);
  }

  function cleanOverlayUrl() {
    var raw = (location.hash || "").replace(/^#/, "").replace(/&?stay=\d+/g, "").replace(/&$/, "");
    return location.pathname + location.search + (raw ? "#" + raw : "");
  }

  function padOverlay() {
    if (!readerOpen) return;
    try {
      readerStaySeq += 1;
      history.pushState({ yroomReader: 1, n: readerStaySeq }, "", stayOverlayUrl(readerStaySeq));
      readerStaySeq += 1;
      history.pushState({ yroomReader: 1, n: readerStaySeq }, "", stayOverlayUrl(readerStaySeq));
    } catch (e) {}
  }

  function closeReader() {
    var layer = document.getElementById("reader-layer");
    var frame = document.getElementById("reader-frame");
    readerOpen = false;
    document.documentElement.classList.remove("is-reading");
    if (layer) {
      layer.hidden = true;
      layer.classList.remove("is-live");
    }
    if (frame) {
      try { frame.src = "about:blank"; } catch (e) {}
    }
    try { sessionStorage.removeItem("yroom.reading"); } catch (e) {}
    try { history.replaceState({}, "", cleanOverlayUrl()); } catch (e) {}
    window.clearTimeout(readerReadyTimer);
    window.clearTimeout(hintTimer);
  }

  function showReaderLive() {
    var layer = document.getElementById("reader-layer");
    if (!layer || !readerOpen) return;
    layer.classList.add("is-live");
    window.clearTimeout(readerReadyTimer);
    window.clearTimeout(hintTimer);
    var hint = document.getElementById("reader-hint");
    if (hint) hint.hidden = true;
  }

  function prefetchReader(item) {
    if (!item || !item.id || !KEY) return;
    var origin = vault();
    if (!origin) return;
    if (prefetchCtl && prefetchCtl._book === item.id) return;
    if (prefetchCtl) prefetchCtl.abort();
    prefetchCtl = new AbortController();
    prefetchCtl._book = item.id;
    var signal = prefetchCtl.signal;
    var bid = encodeURIComponent(item.id);
    var tok = encodeURIComponent(KEY);
    [
      "./read.html",
      "./read.css?v=15",
      origin + "/static/reader.js?v=27",
      origin + "/static/css/global.css?v=20",
      origin + "/static/css/read.css?v=20",
      origin + "/static/css/navImage.css?v=20",
      origin + "/static/css/navMenu.css?v=20",
      origin + "/static/css/config.css?v=20",
      origin + "/static/css/mybook.css?v=20",
    ].forEach(function (url) {
      fetch(url, { signal: signal, mode: "cors", credentials: "omit" }).catch(function () {});
    });
    var auth = "?book=" + bid + "&k=" + tok;
    Promise.all([
      fetch(origin + "/api/book" + auth, { signal: signal, mode: "cors" }).then(function (r) { return r.json(); }),
      fetch(origin + "/api/prefs" + auth, { signal: signal, mode: "cors" }).then(function (r) { return r.json(); }).catch(function () { return {}; }),
    ]).then(function (pair) {
      var book = pair[0] || {};
      var prefs = pair[1] || {};
      var leaves = book.leaves || [];
      if (!leaves.length) return;
      var posKey = book.positionKey || item.id;
      var idx = 0;
      if (prefs.finished && prefs.finished[posKey]) {
        idx = Math.max(0, leaves.length - 1);
      } else {
        var saved = prefs.positions && prefs.positions[posKey];
        if (Number.isFinite(saved)) idx = Math.max(0, Math.min(saved, leaves.length - 1));
      }
      [leaves[idx], leaves[idx + 1], leaves[idx - 1]].forEach(function (leaf) {
        if (!leaf || !leaf.src) return;
        var im = new Image();
        im.decoding = "async";
        im.src = origin + "/pages/" + encodeURIComponent(leaf.src) + "?book=" + bid + "&k=" + tok;
      });
    }).catch(function () {});
  }

  function openWatch(item, opts) {
    if (!item || !item.id) return;
    var layer = document.getElementById("reader-layer");
    var frame = document.getElementById("reader-frame");
    var coverEl = document.getElementById("reader-bridge-cover");
    var hint = document.getElementById("reader-hint");
    var bridge = document.getElementById("reader-bridge");
    if (!layer || !frame) {
      location.replace(watchingUrl(item));
      return;
    }
    var cover = (opts && opts.cover) || tileCover(item);
    if (!cover && item.has_cover) cover = coverUrl(item);
    if (coverEl) {
      if (cover) {
        coverEl.hidden = false;
        coverEl.src = cover;
        sizeBridgeCover(coverEl, item);
      } else {
        coverEl.removeAttribute("src");
        coverEl.hidden = true;
      }
    }
    if (bridge) bridge.classList.toggle("has-cover", !!cover);
    window.clearTimeout(hintTimer);
    if (hint) {
      hint.hidden = false;
      var wait = hint.querySelector(".read-wait");
      if (wait) wait.textContent = "打開影片";
    }
    rememberReading(item, cover);
    document.documentElement.classList.add("is-reading");
    layer.hidden = false;
    layer.classList.remove("is-live");
    var wasOpen = readerOpen;
    readerOpen = true;
    if (!wasOpen) padOverlay();
    var url = watchingUrl(item);
    try {
      if (frame.getAttribute("src") === url && frame.contentWindow) {
        frame.contentWindow.location.replace(url);
      } else {
        frame.src = url;
      }
    } catch (e) {
      frame.src = url;
    }
    window.clearTimeout(readerReadyTimer);
    readerReadyTimer = window.setTimeout(showReaderLive, 15000);
  }

  function openReader(item, opts) {
    if (!item || !item.id) return;
    var layer = document.getElementById("reader-layer");
    var frame = document.getElementById("reader-frame");
    var coverEl = document.getElementById("reader-bridge-cover");
    var hint = document.getElementById("reader-hint");
    var bridge = document.getElementById("reader-bridge");
    if (!layer || !frame) {
      location.replace(readingUrl(item, opts));
      return;
    }
    var cover = (opts && opts.cover) || tileCover(item);
    if (!cover && item.has_cover) cover = coverUrl(item);
    if (coverEl) {
      if (cover) {
        coverEl.hidden = false;
        coverEl.src = cover;
        sizeBridgeCover(coverEl, item);
      } else {
        coverEl.removeAttribute("src");
        coverEl.hidden = true;
        coverEl.style.width = "";
        coverEl.style.height = "";
      }
    }
    if (bridge) bridge.classList.toggle("has-cover", !!cover);
    window.clearTimeout(hintTimer);
    if (hint) {
      hint.hidden = false;
      var wait = hint.querySelector(".read-wait");
      if (wait) wait.textContent = "讀取中";
    }
    rememberReading(item, cover);
    document.documentElement.classList.add("is-reading");
    layer.hidden = false;
    layer.classList.remove("is-live");
    var wasOpen = readerOpen;
    readerOpen = true;
    if (!wasOpen) padOverlay();
    prefetchReader(item);
    var url = readingUrl(item, opts);
    try {
      if (frame.getAttribute("src") === url && frame.contentWindow) {
        frame.contentWindow.location.replace(url);
      } else {
        frame.src = url;
      }
    } catch (e) {
      frame.src = url;
    }
    window.clearTimeout(readerReadyTimer);
    readerReadyTimer = window.setTimeout(showReaderLive, 15000);
  }

  function openSaved(data) {
    if (!data || !data.book) return;
    var item = {
      id: data.book,
      kind: data.kind || (String(data.book).indexOf("video/") === 0 ? "video" : ""),
      finished: data.end === "1",
      has_cover: !!data.cover,
    };
    if (item.kind === "video") openWatch(item, { cover: data.cover });
    else openReader(item, { end: data.end, cover: data.cover });
  }

  function pickMode(next) {
    mode = next === "fav" ? "fav" : (next === "video" ? "video" : "manga");
    document.querySelectorAll("#mode-bar .mode-btn").forEach(function (el) {
      el.classList.toggle("is-on", el.dataset.mode === mode);
    });
    cwd = "";
    parentCwd = "";
    clearSelect();
    reloadShelf();
  }

  function ensureLayoutToggle() {
    var bar = document.getElementById("mode-bar");
    if (!bar || layoutBtn) return;
    layoutBtn = insButton("layout-toggle", listMode ? GRID : LIST, listMode ? "封面格子" : "橫條排列");
    layoutBtn.addEventListener("click", function () { toggleLayout(); });
    bar.appendChild(layoutBtn);
    applyLayoutClass();
  }

  function placeMenu() {
    if (!gear || !menu || menu.hidden) return;
    var box = gear.getBoundingClientRect();
    var pad = 10;
    var vv = window.visualViewport;
    var vw = vv ? vv.width : window.innerWidth;
    var vh = vv ? vv.height : window.innerHeight;
    var vo = vv ? vv.offsetTop : 0;
    var vl = vv ? vv.offsetLeft : 0;
    var mw = menu.offsetWidth || 220;
    var mh = menu.offsetHeight || 200;
    var left = box.right - mw;
    if (left < vl + pad) left = vl + pad;
    if (left + mw > vl + vw - pad) left = Math.max(vl + pad, vl + vw - mw - pad);
    var top = box.bottom + 8;
    if (top + mh > vo + vh - pad) top = box.top - mh - 8;
    if (top < vo + pad) top = vo + pad;
    menu.style.position = "fixed";
    menu.style.right = "auto";
    menu.style.bottom = "auto";
    menu.style.left = Math.round(left) + "px";
    menu.style.top = Math.round(top) + "px";
  }

  function closeMenu() {
    menu.hidden = true;
    catcher.hidden = true;
    gear.setAttribute("aria-expanded", "false");
    gear.classList.remove("is-live");
    document.documentElement.classList.remove("settings-open");
    if (menu.parentNode !== document.getElementById("album-settings")) {
      document.getElementById("album-settings").appendChild(menu);
    }
  }

  function openMenu() {
    catcher.hidden = false;
    document.body.appendChild(catcher);
    document.body.appendChild(menu);
    menu.hidden = false;
    gear.setAttribute("aria-expanded", "true");
    gear.classList.add("is-live");
    document.documentElement.classList.add("settings-open");
    requestAnimationFrame(placeMenu);
  }

  gear.addEventListener("click", function (ev) {
    ev.preventDefault();
    ev.stopPropagation();
    if (menu.hidden) openMenu();
    else closeMenu();
  });
  catcher.addEventListener("pointerdown", function (ev) {
    ev.preventDefault();
    ev.stopPropagation();
  });
  catcher.addEventListener("click", function (ev) {
    ev.preventDefault();
    ev.stopPropagation();
    closeMenu();
  });
  menu.addEventListener("pointerdown", function (ev) { ev.stopPropagation(); });
  menu.addEventListener("click", function (ev) {
    var btn = ev.target.closest(".settings-entry");
    if (!btn || btn.classList.contains("is-run")) return;
    closeMenu();
    var job = btn.getAttribute("data-job");
    if (job === "cover" && coverInput) coverInput.click();
    if (job === "backdrop" && backdropInput) backdropInput.click();
    if (job === "private") {
      restoreActShell();
      actMask.hidden = false;
    }
    if (job === "jobs") {
      jobsMask.hidden = false;
      refreshJobs();
    }
  });

  document.getElementById("actClose").addEventListener("click", closeAct);
  actMask.addEventListener("pointerup", function (ev) {
    if (ev.target === actMask) closeAct();
  });
  restoreActShell();
  if (askMask) {
    var askNo = document.getElementById("askNo");
    var askYes = document.getElementById("askYes");
    if (askNo) askNo.addEventListener("click", function () { askMask.hidden = true; askFn = null; });
    if (askYes) askYes.addEventListener("click", function () {
      var fn = askFn;
      askMask.hidden = true;
      askFn = null;
      if (fn) fn();
    });
    if (window.YRoomGate && window.YRoomGate.lockSheetPage) window.YRoomGate.lockSheetPage(askMask);
  }
  if (shelfBack) {
    shelfBack.addEventListener("click", function (ev) {
      ev.preventDefault();
      cwd = parentCwd || "";
      clearSelect();
      reloadShelf();
    });
  }

  if (window.YRoomGate && window.YRoomGate.lockSheetPage) {
    if (actMask) window.YRoomGate.lockSheetPage(actMask);
    if (jobsMask) window.YRoomGate.lockSheetPage(jobsMask);
  }
  document.getElementById("jobsClose").addEventListener("click", function () {
    jobsMask.hidden = true;
  });
  jobsMask.addEventListener("pointerup", function (ev) {
    if (ev.target === jobsMask) jobsMask.hidden = true;
  });

  function jobLine(row) {
    var title = row.title || "擷取私藏";
    var phase = row.phase || row.state || "";
    var pct = row.percent != null ? row.percent + "%" : "";
    return [title, phase, pct].filter(Boolean).join("  ");
  }

  function refreshJobs() {
    get("/api/host/jobs").then(function (snap) {
      jobsBody.innerHTML = "";
      var rows = (snap && (snap.active || snap.items)) || [];
      if (!rows.length) {
        jobsBody.textContent = "目前沒有工作";
        setJobRun(false);
        return;
      }
      var running = false;
      rows.forEach(function (row) {
        var p = document.createElement("p");
        p.textContent = jobLine(row);
        jobsBody.appendChild(p);
        if (row.state === "running" || row.state === "queued") running = true;
      });
      setJobRun(running);
    }).catch(function () {
      if (!jobsBody.textContent) jobsBody.textContent = "目前連不上佇列";
    });
  }

  document.querySelectorAll("#mode-bar .mode-btn").forEach(function (btn) {
    btn.addEventListener("click", function () {
      pickMode(btn.dataset.mode);
    });
  });
  ensureLayoutToggle();

  if (homeInstalled) {
    homeInstalled.addEventListener("click", function () {
      try { localStorage.setItem("yroom.installed", "1"); } catch (e) {}
      if (homeInstall) homeInstall.hidden = true;
    });
  }

  function enterAfterGate(token) {
    KEY = token || KEY;
    window.YROOM_VIEW_KEY = KEY;
    hall.classList.remove("is-invite");
    hall.classList.add("is-booting");
    var panel = document.getElementById("invite-panel");
    if (panel) panel.hidden = true;
    if (status) {
      status.hidden = false;
      status.textContent = "正在連接書櫃…";
    }
    var wait = document.getElementById("invite-wait") || document.getElementById("boot-wait");
    if (wait) wait.hidden = false;
    askDoor({ stay: true });
  }

  function afterDoor(door) {
    if (door && door.kind !== "album") {
      failGate();
      scheduleReconnect();
      return;
    }
    if (window.YRoomGate) {
      window.YRoomGate.savePersonal(KEY);
    }
    var gate = window.YRoomGate;
    var meAsk = gate
      ? gate.apiRetry("/api/me", KEY, { timeout: 20000, tries: 3 }).then(function (x) { return x && x.j; })
      : get("/api/me");
    meAsk.then(function (me) {
      if (!me) throw new Error("no_me");
      renderMe(me);
      showHome();
      ensureRail();
      if (homeInstall && typeof navigator.standalone === "boolean" && !navigator.standalone) {
        var seen = "";
        try { seen = localStorage.getItem("yroom.installed") || ""; } catch (e) {}
        if (!seen) {
          if (window.YRoomGate && window.YRoomGate.pinKey) window.YRoomGate.pinKey(KEY);
          homeInstall.hidden = false;
        }
      }
      refreshOrg();
      if (gate) {
        return gate.apiRetry(shelfPath(), KEY, { timeout: 20000, tries: 3 }).then(function (x) { return x && x.j; });
      }
      return get(shelfPath());
    }).then(function (data) {
      if (!data) return;
      allItems = data.items || [];
      cwd = data.cwd || "";
      parentCwd = data.parent || "";
      catalog = {};
      allItems.forEach(function (item) { catalog[item.id] = item; });
      paintBack();
      paintFeed();
      requestAnimationFrame(layoutStage);
      refreshJobs();
      setInterval(refreshJobs, 4000);
      if (window.__yroomPendingRead) {
        var pending = window.__yroomPendingRead;
        window.__yroomPendingRead = null;
        openSaved(pending);
      }
    }).catch(function () {
      failGate();
      scheduleReconnect();
    });
  }

  function dropBadKey() {
    KEY = "";
    window.YROOM_VIEW_KEY = "";
    try { localStorage.removeItem("yroom.viewKey"); } catch (e) {}
    try {
      var path = location.pathname.replace(/[^/]+$/, "") || "/";
      document.cookie = "yroom.viewKey=; path=" + path + "; max-age=0";
    } catch (e) {}
  }

  function askDoor(opts) {
    var stay = !!(opts && opts.stay);
    var stored = "";
    try { stored = localStorage.getItem("yroom.viewKey") || ""; } catch (e) {}
    KEY = KEY || window.YROOM_VIEW_KEY || stored || (window.YRoomGate && window.YRoomGate.currentKey()) || "";
    if (!KEY) {
      if (!stay && window.YRoomDoor && window.YRoomDoor.open) window.YRoomDoor.open();
      else failGate("請從數字門進入");
      return;
    }
    var ask = window.YRoomGate
      ? window.YRoomGate.apiRetry("/api/door", KEY, { timeout: 20000, tries: 3 })
      : get("/api/door").then(function (door) { return { res: { ok: true }, j: door }; });
    ask.then(function (x) {
      if (x && x.res && x.res.status === 401) {
        var fallback = window.YROOM_VIEW_KEY || stored;
        if (fallback && fallback !== KEY) {
          KEY = fallback;
          askDoor(opts);
          return;
        }
        if (!stay && window.YRoomDoor && window.YRoomDoor.open) window.YRoomDoor.open();
        else failGate();
        scheduleReconnect();
        return;
      }
      if (!x || !x.j || (x.res && !x.res.ok)) {
        failGate();
        scheduleReconnect();
        return;
      }
      afterDoor(x.j);
    }).catch(function () {
      failGate();
      scheduleReconnect();
    });
  }

  function boot() {
    if (window.YRoomGate && window.YRoomGate.refreshOrigin) {
      window.YRoomGate.refreshOrigin().then(askDoor);
      return;
    }
    askDoor();
  }

  if (bookCoverInput) {
    bookCoverInput.addEventListener("change", function () {
      var file = bookCoverInput.files && bookCoverInput.files[0];
      bookCoverInput.value = "";
      if (!file || coverBusy) return;
      var ids = Array.from(selected).filter(function (id) {
        return catalog[id] && catalog[id].kind !== "org";
      });
      if (!ids.length) return;
      coverBusy = true;
      showWaitCard("更換封面中");
      waitTimer = window.setInterval(tickWait, 280);
      var btn = document.querySelector(".rail-cover");
      if (btn) btn.classList.add("is-run");
      var chain = Promise.resolve();
      ids.forEach(function (id) {
        chain = chain.then(function () {
          var fd = new FormData();
          fd.append("cover", file, file.name || "cover.jpg");
          return postFile(
            vault() + "/api/host/cover?k=" + encodeURIComponent(KEY) + "&book=" + encodeURIComponent(id),
            fd,
            setWaitPct
          );
        });
      });
      chain.then(function () {
        setWaitPct(100);
        clearSelect();
        return reloadShelf();
      }).finally(function () {
        hideWaitCard();
        coverBusy = false;
        if (btn) btn.classList.remove("is-run");
      });
    });
  }

  if (coverInput) coverInput.addEventListener("change", function () {
    var file = coverInput.files && coverInput.files[0];
    if (!file) return;
    var entry = document.querySelector('.settings-entry[data-job="cover"]');
    setJobRun(true, entry);
    var fd = new FormData();
    fd.append("cover", file);
    fetch(vault() + "/api/cover?k=" + encodeURIComponent(KEY), { method: "POST", body: fd })
      .then(function () { return refreshMe(); })
      .finally(function () {
        setJobRun(false, entry);
        coverInput.value = "";
      });
  });

  if (backdropInput) backdropInput.addEventListener("change", function () {
    var file = backdropInput.files && backdropInput.files[0];
    if (!file || waitBusy) {
      backdropInput.value = "";
      return;
    }
    waitBusy = true;
    showWaitCard("更換背景中");
    waitTimer = window.setInterval(tickWait, 280);
    var entry = document.querySelector('.settings-entry[data-job="backdrop"]');
    setJobRun(true, entry);
    var fd = new FormData();
    fd.append("backdrop", file);
    postFile(vault() + "/api/backdrop?k=" + encodeURIComponent(KEY), fd, function (n) {
      if (waitTimer) {
        window.clearInterval(waitTimer);
        waitTimer = 0;
      }
      setWaitPct(n);
    }).then(function () {
      setWaitPct(100);
      return refreshMe();
    }).finally(function () {
      hideWaitCard();
      setJobRun(false, entry);
      waitBusy = false;
      backdropInput.value = "";
    });
  });

  var readerBack = document.getElementById("reader-back");
  if (readerBack) {
    readerBack.addEventListener("pointerup", function (ev) {
      if (ev.pointerType === "mouse" && ev.button !== 0) return;
      ev.preventDefault();
      if (Date.now() - bridgeBackAt < 400) return;
      bridgeBackAt = Date.now();
      closeReader();
    });
    readerBack.addEventListener("click", function (ev) {
      ev.preventDefault();
      if (Date.now() - bridgeBackAt < 400) return;
      bridgeBackAt = Date.now();
      closeReader();
    });
  }

  window.addEventListener("message", function (ev) {
    if (ev.origin !== location.origin) return;
    var kind = ev.data && ev.data.fami;
    if (kind === "close-reader") closeReader();
    else if (kind === "reader-ready") showReaderLive();
    else if (kind === "reader-loading" && readerOpen) {
      var layer = document.getElementById("reader-layer");
      if (layer) layer.classList.remove("is-live");
    }
  });
  window.addEventListener("popstate", function () {
    if (readerOpen) {
      padOverlay();
      return;
    }
    if (/stay=\d+/.test(location.hash || "")) {
      try { history.replaceState({}, "", cleanOverlayUrl()); } catch (e) {}
    }
  });
  window.addEventListener("resize", layoutStage);
  if (window.visualViewport) window.visualViewport.addEventListener("resize", layoutStage);

  window.YRoomShelf = {
    openSaved: openSaved,
    closeReader: closeReader,
    enterAfterGate: enterAfterGate,
  };

  if (!window.YROOM_NEED_GATE) {
    hall.classList.remove("is-invite");
    hall.classList.add("is-booting");
    if (status && !status.textContent) status.textContent = "正在連接書櫃…";
    var wait = document.getElementById("invite-wait") || document.getElementById("boot-wait");
    if (wait) wait.hidden = false;
    boot();
  }
})();
