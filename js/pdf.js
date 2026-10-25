/* Event Couture plan PDF: a small, dependency-free PDF writer (standard fonts, so it works offline in the app).
   ECPDF.plan(data) returns a Uint8Array. data = { kicker, title, lines[], palette[], sections[{ h, p, bullets[], rows[[left, note, right]], times[[time, text]], total[label, value] }], foot } */
(function () {
  'use strict';
  var WID = {"Helvetica":[278,278,355,556,556,889,667,191,333,333,389,584,278,333,278,278,556,556,556,556,556,556,556,556,556,556,278,278,584,584,584,556,1015,667,667,722,722,667,611,778,722,278,500,667,556,833,722,778,667,778,722,667,611,722,667,944,667,667,611,278,278,278,469,556,333,556,556,500,556,556,278,556,556,222,222,500,222,833,556,556,556,556,333,500,278,556,500,722,500,500,500,334,260,334,584,350,556,350,222,556,333,1000,556,556,333,1000,667,333,1000,350,611,350,350,222,222,333,333,350,556,1000,333,1000,500,333,944,350,500,667,278,333,556,556,556,556,260,556,333,737,370,556,584,333,737,333,400,584,333,333,333,556,537,278,333,333,365,556,834,834,834,611,667,667,667,667,667,667,1000,722,667,667,667,667,278,278,278,278,722,722,778,778,778,778,778,584,778,722,722,722,722,667,667,611,556,556,556,556,556,556,889,500,556,556,556,556,278,278,278,278,556,556,556,556,556,556,556,584,611,556,556,556,556,500,556,500],"Helvetica-Bold":[278,333,474,556,556,889,722,238,333,333,389,584,278,333,278,278,556,556,556,556,556,556,556,556,556,556,333,333,584,584,584,611,975,722,722,722,722,667,611,778,722,278,556,722,611,833,722,778,667,778,722,667,611,722,667,944,667,667,611,333,278,333,584,556,333,556,611,556,611,556,333,611,611,278,278,556,278,889,611,611,611,611,389,556,333,611,556,778,556,556,500,389,280,389,584,350,556,350,278,556,500,1000,556,556,333,1000,667,333,1000,350,611,350,350,278,278,500,500,350,556,1000,333,1000,556,333,944,350,500,667,278,333,556,556,556,556,280,556,333,737,370,556,584,333,737,333,400,584,333,333,333,611,556,278,333,333,365,556,834,834,834,611,722,722,722,722,722,722,1000,722,667,667,667,667,278,278,278,278,722,722,778,778,778,778,778,584,778,722,722,722,722,667,667,611,556,556,556,556,556,556,889,556,556,556,556,556,278,278,278,278,611,611,611,611,611,611,611,584,611,611,611,611,611,556,611,556],"Times-Roman":[250,333,408,500,500,833,778,180,333,333,500,564,250,333,250,278,500,500,500,500,500,500,500,500,500,500,278,278,564,564,564,444,921,722,667,667,722,611,556,722,722,333,389,722,611,889,722,722,556,722,667,556,611,722,722,944,722,722,611,333,278,333,469,500,333,444,500,444,500,444,333,500,500,278,278,500,278,778,500,500,500,500,333,389,278,500,500,722,500,500,444,480,200,480,541,350,500,350,333,500,444,1000,500,500,333,1000,556,333,889,350,611,350,350,333,333,444,444,350,500,1000,333,980,389,333,722,350,444,722,250,333,500,500,500,500,200,500,333,760,276,500,564,333,760,333,400,564,300,300,333,500,453,250,333,300,310,500,750,750,750,444,722,722,722,722,722,722,889,667,611,611,611,611,333,333,333,333,722,722,722,722,722,722,722,564,722,722,722,722,722,722,556,500,444,444,444,444,444,444,667,444,444,444,444,444,278,278,278,278,500,500,500,500,500,500,500,564,500,500,500,500,500,500,500,500],"Times-Italic":[250,333,420,500,500,833,778,214,333,333,500,675,250,333,250,278,500,500,500,500,500,500,500,500,500,500,333,333,675,675,675,500,920,611,611,667,722,611,611,722,722,333,444,667,556,833,667,722,611,722,611,500,556,722,611,833,611,556,556,389,278,389,422,500,333,500,500,444,500,444,278,500,500,278,278,444,278,722,500,500,500,500,389,389,278,500,444,667,444,444,389,400,275,400,541,350,500,350,333,500,556,889,500,500,333,1000,500,333,944,350,556,350,350,333,333,556,556,350,500,889,333,980,389,333,667,350,389,556,250,389,500,500,500,500,275,500,333,760,276,500,675,333,760,333,400,675,300,300,333,500,523,250,333,300,310,500,750,750,750,500,611,611,611,611,611,611,889,667,611,611,611,611,333,333,333,333,722,667,722,722,722,722,722,675,722,722,722,722,722,556,611,500,500,500,500,500,500,500,667,444,444,444,444,444,278,278,278,278,500,500,500,500,500,500,500,675,500,500,500,500,500,444,500,444]};
  var FONTS = { R: 'Helvetica', B: 'Helvetica-Bold', S: 'Times-Roman', I: 'Times-Italic' };
  var SPECIAL = { 0x20AC: 0x80, 0x201A: 0x82, 0x201E: 0x84, 0x2026: 0x85, 0x2018: 0x91, 0x2019: 0x92, 0x201C: 0x93, 0x201D: 0x94, 0x2022: 0x95, 0x2013: 0x96, 0x2014: 0x97, 0x2122: 0x99 };
  /* text to WinAnsi codes; anything the standard fonts can't draw (emoji, stars) is dropped */
  function codes(s) { var out = []; String(s == null ? '' : s).replace(/★\s?/g, '').replace(/[→]/g, '->').split('').forEach(function (ch) { var c = ch.charCodeAt(0); if (c === 9 || c === 10) c = 32; if (c >= 32 && c < 127) out.push(c); else if (c >= 160 && c <= 255) out.push(c); else if (SPECIAL[c]) out.push(SPECIAL[c]); }); return out; }
  function width(s, f, size) { var w = 0; codes(s).forEach(function (c) { w += WID[FONTS[f]][c - 32] || 500; }); return w * size / 1000; }
  function wrap(s, f, size, max) {
    var words = String(s == null ? '' : s).split(/\s+/).filter(Boolean), lines = [], cur = '';
    words.forEach(function (wd) { var t = cur ? cur + ' ' + wd : wd; if (width(t, f, size) <= max || !cur) cur = t; else { lines.push(cur); cur = wd; } });
    if (cur) lines.push(cur); return lines.length ? lines : [''];
  }
  function str(s) { return '(' + codes(s).map(function (c) { var ch = String.fromCharCode(c); return ch === '(' || ch === ')' || ch === '\\' ? '\\' + ch : ch; }).join('') + ')'; }
  function rgb(hex) { var m = /^#?([0-9a-f]{6})$/i.exec(hex || ''); if (!m) return '0 0 0'; var n = parseInt(m[1], 16); return [(n >> 16) & 255, (n >> 8) & 255, n & 255].map(function (v) { return (v / 255).toFixed(3); }).join(' '); }
  var PLUM = '#4B1235', TEXT = '#3A2F33', MUTED = '#6F6468', GOLD = '#B69A68', GOLDT = '#7D6438', LINE = '#E9E3DA';

  function plan(d) {
    var PW = 612, PH = 792, M = 56, CW = PW - 2 * M, pages = [], ops, y;
    function page() { ops = []; pages.push(ops); y = PH - M; }
    function text(x, yy, s, f, size, color) { ops.push('BT /' + f + ' ' + size + ' Tf ' + rgb(color || TEXT) + ' rg ' + x.toFixed(2) + ' ' + yy.toFixed(2) + ' Td ' + str(s) + ' Tj ET'); }
    function rule(x1, yy, x2, color, w) { ops.push(rgb(color || LINE) + ' RG ' + (w || 0.6) + ' w ' + x1 + ' ' + yy.toFixed(2) + ' m ' + x2 + ' ' + yy.toFixed(2) + ' l S'); }
    function dot(cx, cy, r, color) { var k = 0.5523 * r; ops.push(rgb(color) + ' rg ' + rgb(LINE) + ' RG 0.5 w ' + [cx + r, cy, 'm', cx + r, cy + k, cx + k, cy + r, cx, cy + r, 'c', cx - k, cy + r, cx - r, cy + k, cx - r, cy, 'c', cx - r, cy - k, cx - k, cy - r, cx, cy - r, 'c', cx + k, cy - r, cx + r, cy - k, cx + r, cy, 'c', 'B'].map(function (v) { return typeof v === 'number' ? v.toFixed(2) : v; }).join(' ')); }
    function need(h) { if (y - h < M + 24) page(); }
    function para(s, f, size, color, indent, lead) { indent = indent || 0; lead = lead || size * 1.45; wrap(s, f, size, CW - indent).forEach(function (ln) { need(lead); y -= lead; text(M + indent, y, ln, f, size, color); }); }
    page();
    /* masthead */
    text(M, y - 9, 'E V E N T   C O U T U R E', 'B', 7.5, GOLDT); text(PW - M - width('by Always Luxe', 'I', 9), y - 9, 'by Always Luxe', 'I', 9, GOLDT); y -= 18; rule(M, y, PW - M, GOLD, 0.8); y -= 30;
    if (d.kicker) { text(M, y, String(d.kicker).toUpperCase(), 'R', 8.5, MUTED); y -= 8; }
    wrap(d.title, 'S', 27, CW).forEach(function (ln) { y -= 30; text(M, y, ln, 'S', 27, PLUM); });
    y -= 4; (d.lines || []).forEach(function (l, i) { para(l, i ? 'R' : 'R', i ? 9.5 : 10.5, i ? MUTED : TEXT); });
    if ((d.palette || []).length) { y -= 18; d.palette.slice(0, 6).forEach(function (h, i) { dot(M + 8 + i * 22, y + 4, 8, h); }); y -= 8; }
    y -= 6;
    (d.sections || []).forEach(function (s) {
      need(64); y -= 34; text(M, y, s.h, 'S', 15, PLUM); y -= 7; rule(M, y, PW - M, GOLD, 0.5); y -= 4;
      if (s.p) { para(s.p, 'R', 10, TEXT); y -= 2; }
      (s.bullets || []).forEach(function (bl) { var ls = wrap(bl, 'R', 10, CW - 14); ls.forEach(function (ln, i) { need(14.5); y -= 14.5; if (!i) text(M + 2, y, '•', 'R', 10, GOLDT); text(M + 14, y, ln, 'R', 10, TEXT); }); });
      (s.rows || []).forEach(function (r) {
        var rw = r[2] ? width(r[2], 'R', 10) : 0, lw = CW - rw - 16;
        var left = wrap(r[0], 'B', 10, lw), note = r[1] ? [].concat.apply([], String(r[1]).split('\n').map(function (t) { return wrap(t, 'R', 8.5, lw); })) : [];
        need(14 * left.length + 11 * note.length + 8); y -= 4;
        left.forEach(function (ln, i) { y -= 14; text(M, y, ln, 'B', 10, TEXT); if (!i && r[2]) text(PW - M - rw, y, r[2], 'R', 10, TEXT); });
        note.forEach(function (ln) { y -= 11.5; text(M, y, ln, 'R', 8.5, MUTED); });
        y -= 5; rule(M, y, PW - M, LINE, 0.4);
      });
      (s.times || []).forEach(function (r) { var ls = wrap(r[1], 'R', 10, CW - 78); need(15 * ls.length + 4); ls.forEach(function (ln, i) { y -= 15; if (!i) text(M, y, r[0], 'B', 10, GOLDT); text(M + 78, y, ln, 'R', 10, TEXT); }); y -= 3; });
      if (s.total) { need(22); y -= 18; text(M, y, s.total[0], 'B', 10.5, PLUM); text(PW - M - width(s.total[1], 'B', 10.5), y, s.total[1], 'B', 10.5, PLUM); }
    });
    if (d.foot) { y -= 14; para(d.foot, 'I', 9, MUTED); }
    /* footers */
    pages.forEach(function (o, i) { ops = o; rule(M, M - 4, PW - M, LINE, 0.4); text(M, M - 18, 'Event Couture by Always Luxe', 'I', 8.5, MUTED); var pn = 'Page ' + (i + 1) + ' of ' + pages.length; text(PW - M - width(pn, 'R', 8), M - 18, pn, 'R', 8, MUTED); });
    /* assemble the file */
    var objs = [], fontIds = {}, n = 3;
    Object.keys(FONTS).forEach(function (k) { fontIds[k] = n; objs[n++] = '<< /Type /Font /Subtype /Type1 /BaseFont /' + FONTS[k] + ' /Encoding /WinAnsiEncoding >>'; });
    var res = '<< /Font << ' + Object.keys(FONTS).map(function (k) { return '/' + k + ' ' + fontIds[k] + ' 0 R'; }).join(' ') + ' >> >>';
    var kids = [];
    pages.forEach(function (o) { var body = o.join('\n'); var cid = n++; objs[cid] = '<< /Length ' + body.length + ' >>\nstream\n' + body + '\nendstream'; var pid = n++; objs[pid] = '<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ' + PW + ' ' + PH + '] /Resources ' + res + ' /Contents ' + cid + ' 0 R >>'; kids.push(pid); });
    objs[1] = '<< /Type /Catalog /Pages 2 0 R >>';
    objs[2] = '<< /Type /Pages /Kids [' + kids.map(function (k) { return k + ' 0 R'; }).join(' ') + '] /Count ' + kids.length + ' >>';
    var info = n++; objs[info] = '<< /Title <FEFF' + String(d.title || '').split('').map(function (ch) { return ('000' + ch.charCodeAt(0).toString(16)).slice(-4); }).join('') + '> /Producer (Event Couture) >>';
    var out = '%PDF-1.4\n%âãÏÓ\n', offs = [];
    for (var i = 1; i < n; i++) { offs[i] = out.length; out += i + ' 0 obj\n' + objs[i] + '\nendobj\n'; }
    var xref = out.length; out += 'xref\n0 ' + n + '\n0000000000 65535 f \n';
    for (i = 1; i < n; i++) out += ('0000000000' + offs[i]).slice(-10) + ' 00000 n \n';
    out += 'trailer\n<< /Size ' + n + ' /Root 1 0 R /Info ' + info + ' 0 R >>\nstartxref\n' + xref + '\n%%EOF';
    var bytes = new Uint8Array(out.length); for (i = 0; i < out.length; i++) bytes[i] = out.charCodeAt(i) & 255; return bytes;
  }
  window.ECPDF = { plan: plan, codes: codes };
})();
