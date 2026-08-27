(function (w) {
  'use strict';

  var TRACK_KEY = 'wb_tracking';
  var LEAD_KEY  = 'wb_lead';

  function ssGet(k) { try { return w.sessionStorage.getItem(k); } catch (e) { return null; } }
  function ssSet(k, v) { try { w.sessionStorage.setItem(k, v); } catch (e) {} }
  function ssDel(k) { try { w.sessionStorage.removeItem(k); } catch (e) {} }

  function cookie(name) {
    var m = document.cookie.match('(^|;)\\s*' + name + '\\s*=\\s*([^;]+)');
    return m ? m.pop() : '';
  }

  // Meta לא תמיד יוצרת _fbc. אם יש fbclid ב-URL — בונים אותו ידנית.
  function ensureFbc() {
    var existing = cookie('_fbc');
    if (existing) return existing;
    var fbclid = new URLSearchParams(w.location.search).get('fbclid');
    if (!fbclid) return '';
    var fbc = 'fb.1.' + Date.now() + '.' + fbclid;
    try {
      document.cookie = '_fbc=' + fbc + ';path=/;max-age=7776000;SameSite=Lax';
    } catch (e) {}
    return fbc;
  }

  // נשמר פעם אחת בכניסה הראשונה לסשן. לא נדרס בעמודים הבאים.
  function initTracking() {
    var stored = ssGet(TRACK_KEY);
    if (stored) {
      try { return JSON.parse(stored); } catch (e) {}
    }
    var p = new URLSearchParams(w.location.search);
    var data = {
      fbc:          ensureFbc(),
      landing_url:  w.location.href.split('#')[0],
      referrer:     document.referrer || '',
      utm_source:   p.get('utm_source')   || '',
      utm_medium:   p.get('utm_medium')   || '',
      utm_campaign: p.get('utm_campaign') || '',
      utm_content:  p.get('utm_content')  || '',
      utm_term:     p.get('utm_term')     || '',
      ad_id:        p.get('ad_id')        || '',
      placement:    p.get('placement')    || '',
      site_source:  p.get('site')         || ''
    };
    ssSet(TRACK_KEY, JSON.stringify(data));
    return data;
  }

  var WBT = {
    // _fbp נקרא בזמן אמת — הפיקסל עשוי לכתוב אותו אחרי טעינת הדף
    context: function () {
      var t = initTracking();
      var out = {};
      for (var k in t) { if (t.hasOwnProperty(k)) out[k] = t[k]; }
      out.fbp = cookie('_fbp');
      out.fbc = t.fbc || cookie('_fbc') || ensureFbc();
      out.event_source_url = w.location.href.split('?')[0];
      return out;
    },

    newEventId: function () {
      if (w.crypto && w.crypto.randomUUID) return w.crypto.randomUUID();
      return 'e-' + Date.now() + '-' + Math.random().toString(16).slice(2);
    },

    setLead: function (lead) { ssSet(LEAD_KEY, JSON.stringify(lead || {})); },
    getLead: function () {
      try { return JSON.parse(ssGet(LEAD_KEY) || 'null'); } catch (e) { return null; }
    },
    clearLead: function () { ssDel(LEAD_KEY); },

    // keepalive מבטיח שהבקשה מסתיימת גם אחרי ניווט מהדף
    send: function (url, payload) {
      try {
        fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
          keepalive: true
        }).catch(function () {});
      } catch (e) {}
    }
  };

  w.WBT = WBT;
  initTracking();
})(window);
