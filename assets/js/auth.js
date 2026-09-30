/* Dilshad.OS auth client — FastAPI backend */
(function (w) {
  var BASE = 'https://learning-fastapi-api.onrender.com';
  var K = { a: 'dilshad.access', r: 'dilshad.refresh', u: 'dilshad.user' };
  function save(p) {
    try {
      if (p.access_token) localStorage.setItem(K.a, p.access_token);
      if (p.refresh_token) localStorage.setItem(K.r, p.refresh_token);
    } catch (_) {}
  }
  function clear() { try { localStorage.removeItem(K.a); localStorage.removeItem(K.r); localStorage.removeItem(K.u); } catch (_) {} }
  function getA() { try { return localStorage.getItem(K.a) || ''; } catch (_) { return ''; } }
  function getR() { try { return localStorage.getItem(K.r) || ''; } catch (_) { return ''; } }
  async function api(path, opts) {
    opts = opts || {};
    var headers = { 'Content-Type': 'application/json' };
    var tok = getA();
    if (opts.auth !== false && tok) headers['Authorization'] = 'Bearer ' + tok;
    var res = await fetch(BASE + path, {
      method: opts.method || 'GET',
      headers: headers,
      body: opts.body ? JSON.stringify(opts.body) : undefined
    });
    var data = null;
    try { data = await res.json(); } catch (_) {}
    if (!res.ok) {
      var msg = (data && (data.detail || data.message)) || ('Request failed (' + res.status + ')');
      if (Array.isArray(msg)) msg = msg.map(function (e) { return e.msg || e; }).join(', ');
      var err = new Error(msg); err.status = res.status; err.data = data; throw err;
    }
    return data;
  }
  async function login(email, password) {
    var pair = await api('/api/v1/auth/login', { method: 'POST', auth: false, body: { email: email, password: password } });
    save(pair);
    try { var me = await api('/api/v1/users/me', {}); localStorage.setItem(K.u, JSON.stringify(me)); } catch (_) {}
    return pair;
  }
  async function refresh() {
    var rt = getR(); if (!rt) throw new Error('No session — please log in.');
    var pair = await api('/api/v1/auth/refresh', { method: 'POST', auth: false, body: { refresh_token: rt } });
    save(pair); return pair;
  }
  async function ensureAuth() {
    if (getA()) { try { return await api('/api/v1/users/me', {}); } catch (e) { if (e.status !== 401) throw e; } }
    await refresh();
    return api('/api/v1/users/me', {});
  }
  w.DilshadAuth = {
    BASE: BASE, api: api, login: login, refresh: refresh, ensureAuth: ensureAuth, clear: clear,
    getAccess: getA, getRefresh: getR,
    me: function () { try { return JSON.parse(localStorage.getItem(K.u) || 'null'); } catch (_) { return null; } }
  };
})(window);
