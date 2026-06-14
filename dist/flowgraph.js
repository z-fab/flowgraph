var __defProp = Object.defineProperty;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __esm = (fn2, res) => function __init() {
  return fn2 && (res = (0, fn2[__getOwnPropNames(fn2)[0]])(fn2 = 0)), res;
};
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};

// src/admission.js
function admissionMode(node) {
  var _a;
  return ((_a = node.admission) == null ? void 0 : _a.mode) || "queue";
}
function admissionMax(node) {
  var _a, _b;
  return (_b = (_a = node.admission) == null ? void 0 : _a.max) != null ? _b : null;
}
function hasCircuit(node) {
  return node.circuit != null;
}
function hasRetry(node) {
  var _a;
  return ((_a = node.retry) == null ? void 0 : _a.backEdge) != null;
}
function isJoinGate(node) {
  var _a;
  const from = (_a = node.gate) == null ? void 0 : _a.from;
  return from === "all-edges" || Array.isArray(from);
}
function tryAdmit(node, state, inEdgeId) {
  var _a, _b;
  const mode = admissionMode(node);
  const max = admissionMax(node);
  if (mode === "slot") {
    const cap = max != null ? max : 1;
    if (state.slots >= cap) return { accepted: false, overflow: true };
    state.slots += 1;
    state.buffer += 1;
    state.bufferByEdge[inEdgeId] = (state.bufferByEdge[inEdgeId] || 0) + 1;
    return { accepted: true, slots: state.slots };
  }
  if (mode === "batch") {
    const batchMax = max != null ? max : 10;
    const step = (_b = (_a = node.admission) == null ? void 0 : _a.step) != null ? _b : 1;
    state.fill = Math.min(batchMax, state.fill + step);
    state.flushing = false;
    if (state.fill < batchMax) {
      return { accepted: false, accumulating: true };
    }
    state.fill = 0;
    state.buffer += 1;
    state.flushing = true;
    return { accepted: true, flush: true };
  }
  const occ = state.buffer + (state.processing ? 1 : 0);
  if (max != null && occ >= max) return { accepted: false, overflow: true };
  state.buffer += 1;
  state.bufferByEdge[inEdgeId] = (state.bufferByEdge[inEdgeId] || 0) + 1;
  return { accepted: true };
}
function releaseSlot(state) {
  state.slots = Math.max(0, state.slots - 1);
}
function estimateAdmissionPillHeight(node) {
  var _a;
  const mode = admissionMode(node);
  const pillH = 18;
  const gap = 3;
  const pad = 5;
  if (mode === "slot") return pad + pillH * 3 + gap * 2;
  if (isJoinGate(node)) return pad + pillH * 2 + gap;
  if (hasCircuit(node) || ((_a = node.admission) == null ? void 0 : _a.rejectEdge)) return pad + pillH * 2 + gap;
  return pad + pillH;
}
var init_admission = __esm({
  "src/admission.js"() {
  }
});

// src/compose-pills.js
function buildPillsBottom(node, state, metrics = {}) {
  var _a, _b, _c, _d, _e2;
  if (!node || !state) return [];
  const pills = [];
  const rejects = (_b = (_a = metrics.rejects) != null ? _a : state.rejects) != null ? _b : 0;
  if (node.type === "port") {
    if (node.showReceived) pills.push({ text: String(state.received || 0) });
    return pills;
  }
  const mode = admissionMode(node);
  const rejectEdge = (_c = node.admission) == null ? void 0 : _c.rejectEdge;
  if (mode === "slot") {
    const cap = (_d = admissionMax(node)) != null ? _d : 1;
    const slots = state.slots || 0;
    let tone = null;
    if (slots >= cap) tone = "danger";
    else if (slots > 0) tone = "warning";
    pills.push({ text: `${slots}/${cap}`, tone });
    if (state.processing) pills.push({ icon: "\xB7\xB7\xB7", animated: true });
    if (rejectEdge) {
      pills.push({ icon: "circle-x", text: String(rejects), tone: rejects > 0 ? "danger" : null });
    }
    return pills;
  }
  if (mode === "batch") {
    const max2 = (_e2 = admissionMax(node)) != null ? _e2 : 10;
    if (state.flushing) pills.push({ text: "flush", animated: true });
    else if (state.fill > 0) pills.push({ text: `${state.fill}/${max2}`, progress: state.fill / max2 });
    if (state.processing) pills.push({ icon: "\xB7\xB7\xB7", animated: true });
    return pills;
  }
  if (isJoinGate(node)) {
    if (state.waiting) pills.push({ text: "waiting", tone: "warning" });
    if (state.processing) pills.push({ icon: "\xB7\xB7\xB7", animated: true });
    const gate = node.gate || { count: 1 };
    if (Array.isArray(gate.from) && state.waiting) {
      const ready = gate.from.filter((eid) => (state.bufferByEdge[eid] || 0) >= (gate.count || 1)).length;
      pills.push({ text: `${ready}/${gate.from.length}`, tone: "primary" });
    }
    return pills;
  }
  if (hasRetry(node) && state.retries > 0) {
    pills.push({ text: `retry ${state.retries}/${node.retry.maxRetries || 3}`, tone: "warning" });
  }
  if (hasCircuit(node)) {
    const st2 = state.circuitState || "closed";
    if (st2 !== "closed") {
      pills.push({ text: st2.toUpperCase(), tone: st2 === "open" ? "danger" : "warning" });
    }
    pills.push({ icon: "circle-x", text: String(rejects), tone: rejects > 0 ? "danger" : null });
  }
  const max = admissionMax(node);
  if (state.buffer > 0 || max != null) {
    const occ = state.buffer + (state.processing ? 1 : 0);
    const text = max != null ? `${occ}/${max}` : `queue ${state.buffer}`;
    pills.push({ text, tone: state.buffer > 0 ? "warning" : null });
  }
  if (state.waiting) pills.push({ text: "waiting", tone: "warning" });
  if (state.processing) pills.push({ icon: "\xB7\xB7\xB7", animated: true });
  if (rejectEdge && !hasCircuit(node)) {
    pills.push({ icon: "circle-x", text: String(rejects), tone: rejects > 0 ? "danger" : null });
  }
  return pills;
}
function estimateBottomPillHeight(node) {
  return estimateAdmissionPillHeight(node);
}
var init_compose_pills = __esm({
  "src/compose-pills.js"() {
    init_admission();
  }
});

// node_modules/@dagrejs/dagre/dist/dagre.esm.js
function me(e, n) {
  e[n] ? e[n]++ : e[n] = 1;
}
function Ee(e, n) {
  e[n] !== void 0 && !--e[n] && delete e[n];
}
function C(e, n, t, r) {
  let o = "" + n, i = "" + t;
  if (!e && o > i) {
    let s = o;
    o = i, i = s;
  }
  return o + "" + i + "" + (r === void 0 ? "\0" : r);
}
function gn(e, n, t, r) {
  let o = "" + n, i = "" + t;
  if (!e && o > i) {
    let a = o;
    o = i, i = a;
  }
  let s = { v: o, w: i };
  return r && (s.name = r), s;
}
function Y(e, n) {
  return C(e, n.v, n.w, n.name);
}
function mn(e) {
  let n = { options: { directed: e.isDirected(), multigraph: e.isMultigraph(), compound: e.isCompound() }, nodes: En(e), edges: Ln(e) }, t = e.graph();
  return t !== void 0 && (n.value = structuredClone(t)), n;
}
function En(e) {
  return e.nodes().map((n) => {
    let t = e.node(n), r = e.parent(n), o = { v: n };
    return t !== void 0 && (o.value = t), r !== void 0 && (o.parent = r), o;
  });
}
function Ln(e) {
  return e.edges().map((n) => {
    let t = e.edge(n), r = { v: n.v, w: n.w };
    return n.name !== void 0 && (r.name = n.name), t !== void 0 && (r.value = t), r;
  });
}
function yn(e) {
  let n = new p(e.options);
  return e.value !== void 0 && n.setGraph(e.value), e.nodes.forEach((t) => {
    n.setNode(t.v, t.value), t.parent && n.setParent(t.v, t.parent);
  }), e.edges.forEach((t) => {
    n.setEdge({ v: t.v, w: t.w, name: t.name }, t.value);
  }), n;
}
function we(e, n, t, r) {
  return Nn(e, String(n), t || wn, r || function(o) {
    return e.outEdges(o);
  });
}
function Nn(e, n, t, r) {
  let o = {}, i, s = 0, a = e.nodes(), d = function(c) {
    let h = t(c);
    o[c.v].distance + h < o[c.w].distance && (o[c.w] = { distance: o[c.v].distance + h, predecessor: c.v }, i = true);
  }, l = function() {
    a.forEach(function(c) {
      r(c).forEach(function(h) {
        let f = h.v === c ? h.v : h.w, g = f === h.v ? h.w : h.v;
        d({ v: f, w: g });
      });
    });
  };
  a.forEach(function(c) {
    let h = c === n ? 0 : Number.POSITIVE_INFINITY;
    o[c] = { distance: h, predecessor: "" };
  });
  let u = a.length;
  for (let c = 1; c < u && (i = false, s++, l(), !!i); c++) ;
  if (s === u - 1 && (i = false, l(), i)) throw new Error("The graph contains a negative weight cycle");
  return o;
}
function Gn(e) {
  let n = {}, t = [], r;
  function o(i) {
    i in n || (n[i] = true, r.push(i), e.successors(i).forEach(o), e.predecessors(i).forEach(o));
  }
  return e.nodes().forEach(function(i) {
    r = [], o(i), r.length && t.push(r);
  }), t;
}
function F(e, n, t, r) {
  let o = function(i) {
    return e.outEdges(i);
  };
  return vn(e, String(n), t || kn, r || o);
}
function vn(e, n, t, r) {
  let o = {}, i = new Ne(), s, a, d = function(l) {
    let u = l.v !== s ? l.v : l.w, c = o[u], h = t(l), f = a.distance + h;
    if (h < 0) throw new Error("dijkstra does not allow negative edge weights. Bad edge: " + l + " Weight: " + h);
    f < c.distance && (c.distance = f, c.predecessor = s, i.decrease(u, f));
  };
  for (e.nodes().forEach(function(l) {
    let u = l === n ? 0 : Number.POSITIVE_INFINITY;
    o[l] = { distance: u, predecessor: "" }, i.add(l, u);
  }); i.size() > 0 && (s = i.removeMin(), a = o[s], a.distance !== Number.POSITIVE_INFINITY); ) r(s).forEach(d);
  return o;
}
function _n(e, n, t) {
  return e.nodes().reduce(function(r, o) {
    return r[o] = F(e, o, n, t), r;
  }, {});
}
function Ge(e) {
  let n = 0, t = [], r = {}, o = [];
  function i(s) {
    let a = r[s] = { onStack: true, lowlink: n, index: n++ };
    if (t.push(s), e.successors(s).forEach(function(d) {
      d in r ? r[d].onStack && (a.lowlink = Math.min(a.lowlink, r[d].index)) : (i(d), a.lowlink = Math.min(a.lowlink, r[d].lowlink));
    }), a.lowlink === a.index) {
      let d = [], l;
      do
        l = t.pop(), r[l].onStack = false, d.push(l);
      while (s !== l);
      o.push(d);
    }
  }
  return e.nodes().forEach(function(s) {
    s in r || i(s);
  }), o;
}
function xn(e) {
  return Ge(e).filter(function(n) {
    return n.length > 1 || n.length === 1 && e.hasEdge(n[0], n[0]);
  });
}
function On(e, n, t) {
  return In(e, n || Tn, t || function(r) {
    return e.outEdges(r);
  });
}
function In(e, n, t) {
  let r = {}, o = e.nodes();
  return o.forEach(function(i) {
    r[i] = {}, r[i][i] = { distance: 0, predecessor: "" }, o.forEach(function(s) {
      i !== s && (r[i][s] = { distance: Number.POSITIVE_INFINITY, predecessor: "" });
    }), t(i).forEach(function(s) {
      let a = s.v === i ? s.w : s.v, d = n(s);
      r[i][a] = { distance: d, predecessor: i };
    });
  }), o.forEach(function(i) {
    let s = r[i];
    o.forEach(function(a) {
      let d = r[a];
      o.forEach(function(l) {
        let u = d[i], c = s[l], h = d[l], f = u.distance + c.distance;
        f < h.distance && (h.distance = f, h.predecessor = c.predecessor);
      });
    });
  }), r;
}
function ke(e) {
  let n = {}, t = {}, r = [];
  function o(i) {
    if (i in t) throw new D();
    i in n || (t[i] = true, n[i] = true, e.predecessors(i).forEach(o), delete t[i], r.push(i));
  }
  if (e.sinks().forEach(o), Object.keys(n).length !== e.nodeCount()) throw new D();
  return r;
}
function Cn(e) {
  try {
    ke(e);
  } catch (n) {
    if (n instanceof D) return false;
    throw n;
  }
  return true;
}
function Rn(e, n, t, r, o) {
  Array.isArray(n) || (n = [n]);
  let i = ((a) => {
    var d;
    return (d = e.isDirected() ? e.successors(a) : e.neighbors(a)) != null ? d : [];
  }), s = {};
  return n.forEach(function(a) {
    if (!e.hasNode(a)) throw new Error("Graph does not have node: " + a);
    o = ve(e, a, t === "post", s, i, r, o);
  }), o;
}
function ve(e, n, t, r, o, i, s) {
  return n in r || (r[n] = true, t || (s = i(s, n)), o(n).forEach(function(a) {
    s = ve(e, a, t, r, o, i, s);
  }), t && (s = i(s, n))), s;
}
function _e(e, n, t) {
  return Rn(e, n, t, function(r, o) {
    return r.push(o), r;
  }, []);
}
function Pn(e, n) {
  return _e(e, n, "post");
}
function Mn(e, n) {
  return _e(e, n, "pre");
}
function jn(e, n) {
  let t = new p(), r = {}, o = new Ne(), i;
  function s(d) {
    let l = d.v === i ? d.w : d.v, u = o.priority(l);
    if (u !== void 0) {
      let c = n(d);
      c < u && (r[l] = i, o.decrease(l, c));
    }
  }
  if (e.nodeCount() === 0) return t;
  e.nodes().forEach(function(d) {
    o.add(d, Number.POSITIVE_INFINITY), t.setNode(d);
  }), o.decrease(e.nodes()[0], 0);
  let a = false;
  for (; o.size() > 0; ) {
    if (i = o.removeMin(), i in r) t.setEdge(i, r[i]);
    else {
      if (a) throw new Error("Input graph is not connected: " + e);
      a = true;
    }
    e.nodeEdges(i).forEach(s);
  }
  return t;
}
function Sn(e, n, t, r) {
  return Fn(e, n, t, r != null ? r : ((o) => {
    let i = e.outEdges(o);
    return i != null ? i : [];
  }));
}
function Fn(e, n, t, r) {
  if (t === void 0) return F(e, n, t, r);
  let o = false, i = e.nodes();
  for (let s = 0; s < i.length; s++) {
    let a = r(i[s]);
    for (let d = 0; d < a.length; d++) {
      let l = a[d], u = l.v === i[s] ? l.v : l.w, c = u === l.v ? l.w : l.v;
      t({ v: u, w: c }) < 0 && (o = true);
    }
    if (o) return we(e, n, t, r);
  }
  return F(e, n, t, r);
}
function w(e, n, t, r) {
  let o = r;
  for (; e.hasNode(o); ) o = j(r);
  return t.dummy = n, e.setNode(o, t), o;
}
function xe(e) {
  let n = new p().setGraph(e.graph());
  return e.nodes().forEach((t) => n.setNode(t, e.node(t))), e.edges().forEach((t) => {
    let r = n.edge(t.v, t.w) || { weight: 0, minlen: 1 }, o = e.edge(t);
    n.setEdge(t.v, t.w, { weight: r.weight + o.weight, minlen: Math.max(r.minlen, o.minlen) });
  }), n;
}
function A(e) {
  let n = new p({ multigraph: e.isMultigraph() }).setGraph(e.graph());
  return e.nodes().forEach((t) => {
    e.children(t).length || n.setNode(t, e.node(t));
  }), e.edges().forEach((t) => {
    n.setEdge(t, e.edge(t));
  }), n;
}
function H(e, n) {
  let t = e.x, r = e.y, o = n.x - t, i = n.y - r, s = e.width / 2, a = e.height / 2;
  if (!o && !i) throw new Error("Not possible to find intersection inside of the rectangle");
  let d, l;
  return Math.abs(i) * s > Math.abs(o) * a ? (i < 0 && (a = -a), d = a * o / i, l = a) : (o < 0 && (s = -s), d = s, l = s * i / o), { x: t + d, y: r + l };
}
function N(e) {
  let n = k(X(e) + 1).map(() => []);
  return e.nodes().forEach((t) => {
    let r = e.node(t), o = r.rank;
    o !== void 0 && (n[o] || (n[o] = []), n[o][r.order] = t);
  }), n;
}
function Te(e) {
  let n = e.nodes().map((r) => {
    let o = e.node(r).rank;
    return o === void 0 ? Number.MAX_VALUE : o;
  }), t = L(Math.min, n);
  e.nodes().forEach((r) => {
    let o = e.node(r);
    Object.hasOwn(o, "rank") && (o.rank -= t);
  });
}
function Oe(e) {
  let n = e.nodes().map((s) => e.node(s).rank).filter((s) => s !== void 0), t = L(Math.min, n), r = [];
  e.nodes().forEach((s) => {
    let a = e.node(s).rank - t;
    r[a] || (r[a] = []), r[a].push(s);
  });
  let o = 0, i = e.graph().nodeRankFactor;
  Array.from(r).forEach((s, a) => {
    s === void 0 && a % i !== 0 ? --o : s !== void 0 && o && s.forEach((d) => e.node(d).rank += o);
  });
}
function q(e, n, t, r) {
  let o = { width: 0, height: 0 };
  return arguments.length >= 4 && (o.rank = t, o.order = r), w(e, "border", o, n);
}
function Dn(e, n = Ie) {
  let t = [];
  for (let r = 0; r < e.length; r += n) {
    let o = e.slice(r, r + n);
    t.push(o);
  }
  return t;
}
function L(e, n) {
  if (n.length > Ie) {
    let t = Dn(n);
    return e(...t.map((r) => e(...r)));
  } else return e(...n);
}
function X(e) {
  let t = e.nodes().map((r) => {
    let o = e.node(r).rank;
    return o === void 0 ? Number.MIN_VALUE : o;
  });
  return L(Math.max, t);
}
function Ce(e, n) {
  let t = { lhs: [], rhs: [] };
  return e.forEach((r) => {
    n(r) ? t.lhs.push(r) : t.rhs.push(r);
  }), t;
}
function P(e, n) {
  let t = Date.now();
  try {
    return n();
  } finally {
    console.log(e + " time: " + (Date.now() - t) + "ms");
  }
}
function M(e, n) {
  return n();
}
function j(e) {
  let n = ++An;
  return e + ("" + n);
}
function k(e, n, t = 1) {
  n == null && (n = e, e = 0);
  let r = (i) => i < n;
  t < 0 && (r = (i) => n < i);
  let o = [];
  for (let i = e; r(i); i += t) o.push(i);
  return o;
}
function T(e, n) {
  let t = {};
  for (let r of n) e[r] !== void 0 && (t[r] = e[r]);
  return t;
}
function O(e, n) {
  let t;
  return typeof n == "string" ? t = (r) => r[n] : t = n, Object.entries(e).reduce((r, [o, i]) => (r[o] = t(i, o), r), {});
}
function Re(e, n) {
  return e.reduce((t, r, o) => (t[r] = n[o], t), {});
}
function Pe(e) {
  e._prev._next = e._next, e._next._prev = e._prev, delete e._next, delete e._prev;
}
function Vn(e, n) {
  if (e !== "_next" && e !== "_prev") return n;
}
function Q(e, n) {
  if (e.nodeCount() <= 1) return [];
  let t = Yn(e, n || Wn);
  return Bn(t.graph, t.buckets, t.zeroIdx).flatMap((o) => e.outEdges(o.v, o.w) || []);
}
function Bn(e, n, t) {
  var a;
  let r = [], o = n[n.length - 1], i = n[0], s;
  for (; e.nodeCount(); ) {
    for (; s = i.dequeue(); ) $(e, n, t, s);
    for (; s = o.dequeue(); ) $(e, n, t, s);
    if (e.nodeCount()) {
      for (let d = n.length - 2; d > 0; --d) if (s = (a = n[d]) == null ? void 0 : a.dequeue(), s) {
        r = r.concat($(e, n, t, s, true) || []);
        break;
      }
    }
  }
  return r;
}
function $(e, n, t, r, o) {
  let i = [], s = o ? i : void 0;
  return (e.inEdges(r.v) || []).forEach((a) => {
    let d = e.edge(a), l = e.node(a.v);
    o && i.push({ v: a.v, w: a.w }), l.out -= d, J(n, t, l);
  }), (e.outEdges(r.v) || []).forEach((a) => {
    let d = e.edge(a), l = a.w, u = e.node(l);
    u.in -= d, J(n, t, u);
  }), e.removeNode(r.v), s;
}
function Yn(e, n) {
  let t = new p(), r = 0, o = 0;
  e.nodes().forEach((a) => {
    t.setNode(a, { v: a, in: 0, out: 0 });
  }), e.edges().forEach((a) => {
    let d = t.edge(a.v, a.w) || 0, l = n(a), u = d + l;
    t.setEdge(a.v, a.w, u);
    let c = t.node(a.v), h = t.node(a.w);
    o = Math.max(o, c.out += l), r = Math.max(r, h.in += l);
  });
  let i = zn(o + r + 3).map(() => new Me()), s = r + 1;
  return t.nodes().forEach((a) => {
    J(i, s, t.node(a));
  }), { graph: t, buckets: i, zeroIdx: s };
}
function J(e, n, t) {
  var r, o, i;
  t.out ? t.in ? (i = e[t.out - t.in + n]) == null || i.enqueue(t) : (o = e[e.length - 1]) == null || o.enqueue(t) : (r = e[0]) == null || r.enqueue(t);
}
function zn(e) {
  let n = [];
  for (let t = 0; t < e; t++) n.push(t);
  return n;
}
function je(e) {
  (e.graph().acyclicer === "greedy" ? Q(e, t(e)) : Hn(e)).forEach((r) => {
    let o = e.edge(r);
    e.removeEdge(r), o.forwardName = r.name, o.reversed = true, e.setEdge(r.w, r.v, o, j("rev"));
  });
  function t(r) {
    return (o) => r.edge(o).weight;
  }
}
function Hn(e) {
  let n = [], t = {}, r = {};
  function o(i) {
    Object.hasOwn(r, i) || (r[i] = true, t[i] = true, e.outEdges(i).forEach((s) => {
      Object.hasOwn(t, s.w) ? n.push(s) : o(s.w);
    }), delete t[i]);
  }
  return e.nodes().forEach(o), n;
}
function Se(e) {
  e.edges().forEach((n) => {
    let t = e.edge(n);
    if (t.reversed) {
      e.removeEdge(n);
      let r = t.forwardName;
      delete t.reversed, delete t.forwardName, e.setEdge(n.w, n.v, t, r);
    }
  });
}
function Fe(e) {
  e.graph().dummyChains = [], e.edges().forEach((n) => Xn(e, n));
}
function Xn(e, n) {
  let t = n.v, r = e.node(t).rank, o = n.w, i = e.node(o).rank, s = n.name, a = e.edge(n), d = a.labelRank;
  if (i === r + 1) return;
  e.removeEdge(n);
  let l, u, c;
  for (c = 0, ++r; r < i; ++c, ++r) a.points = [], u = { width: 0, height: 0, edgeLabel: a, edgeObj: n, rank: r }, l = w(e, "edge", u, "_d"), r === d && (u.width = a.width, u.height = a.height, u.dummy = "edge-label", u.labelpos = a.labelpos), e.setEdge(t, l, { weight: a.weight }, s), c === 0 && e.graph().dummyChains.push(l), t = l;
  e.setEdge(t, o, { weight: a.weight }, s);
}
function De(e) {
  e.graph().dummyChains.forEach((n) => {
    let t = e.node(n), r = t.edgeLabel, o;
    for (e.setEdge(t.edgeObj, r); t.dummy; ) o = e.successors(n)[0], e.removeNode(n), r.points.push({ x: t.x, y: t.y }), t.dummy === "edge-label" && (r.x = t.x, r.y = t.y, r.width = t.width, r.height = t.height), n = o, t = e.node(n);
  });
}
function S(e) {
  let n = {};
  function t(r) {
    let o = e.node(r);
    if (Object.hasOwn(n, r)) return o.rank;
    n[r] = true;
    let i = e.outEdges(r), s = i ? i.map((d) => d == null ? Number.POSITIVE_INFINITY : t(d.w) - e.edge(d).minlen) : [], a = L(Math.min, s);
    return a === Number.POSITIVE_INFINITY && (a = 0), o.rank = a;
  }
  e.sources().forEach(t);
}
function v(e, n) {
  return e.node(n.w).rank - e.node(n.v).rank - e.edge(n).minlen;
}
function Kn(e) {
  let n = new p({ directed: false }), t = e.nodes();
  if (t.length === 0) throw new Error("Graph must have at least one node");
  let r = t[0], o = e.nodeCount();
  n.setNode(r, {});
  let i, s;
  for (; $n(n, e) < o && (i = Jn(n, e), !!i); ) s = n.hasNode(i.v) ? v(e, i) : -v(e, i), Qn(n, e, s);
  return n;
}
function $n(e, n) {
  function t(r) {
    let o = n.nodeEdges(r);
    o && o.forEach((i) => {
      let s = i.v, a = r === s ? i.w : s;
      !e.hasNode(a) && !v(n, i) && (e.setNode(a, {}), e.setEdge(r, a, {}), t(a));
    });
  }
  return e.nodes().forEach(t), e.nodeCount();
}
function Jn(e, n) {
  return n.edges().reduce((r, o) => {
    let i = Number.POSITIVE_INFINITY;
    return e.hasNode(o.v) !== e.hasNode(o.w) && (i = v(n, o)), i < r[0] ? [i, o] : r;
  }, [Number.POSITIVE_INFINITY, null])[1];
}
function Qn(e, n, t) {
  e.nodes().forEach((r) => n.node(r).rank += t);
}
function x(e) {
  e = xe(e), S(e);
  let n = V(e);
  ee(n), Z(n, e);
  let t, r;
  for (; t = Ye(n); ) r = ze(n, e, t), He(n, e, t, r);
}
function Z(e, n) {
  let t = et(e, e.nodes());
  t = t.slice(0, t.length - 1), t.forEach((r) => nt(e, n, r));
}
function nt(e, n, t) {
  let o = e.node(t).parent, i = e.edge(t, o);
  i.cutvalue = We(e, n, t);
}
function We(e, n, t) {
  let o = e.node(t).parent, i = true, s = n.edge(t, o), a = 0;
  s || (i = false, s = n.edge(o, t)), a = s.weight;
  let d = n.nodeEdges(t);
  return d && d.forEach((l) => {
    let u = l.v === t, c = u ? l.w : l.v;
    if (c !== o) {
      let h = u === i, f = n.edge(l).weight;
      if (a += h ? f : -f, rt(e, t, c)) {
        let b = e.edge(t, c).cutvalue;
        a += h ? -b : b;
      }
    }
  }), a;
}
function ee(e, n) {
  arguments.length < 2 && (n = e.nodes()[0]), Be(e, {}, 1, n);
}
function Be(e, n, t, r, o) {
  let i = t, s = e.node(r);
  n[r] = true;
  let a = e.neighbors(r);
  return a && a.forEach((d) => {
    Object.hasOwn(n, d) || (t = Be(e, n, t, d, r));
  }), s.low = i, s.lim = t++, o ? s.parent = o : delete s.parent, t;
}
function Ye(e) {
  return e.edges().find((n) => e.edge(n).cutvalue < 0);
}
function ze(e, n, t) {
  let r = t.v, o = t.w;
  n.hasEdge(r, o) || (r = t.w, o = t.v);
  let i = e.node(r), s = e.node(o), a = i, d = false;
  return i.lim > s.lim && (a = s, d = true), n.edges().filter((u) => d === Ae(e, e.node(u.v), a) && d !== Ae(e, e.node(u.w), a)).reduce((u, c) => v(n, c) < v(n, u) ? c : u);
}
function He(e, n, t, r) {
  let o = t.v, i = t.w;
  e.removeEdge(o, i), e.setEdge(r.v, r.w, {}), ee(e), Z(e, n), tt(e, n);
}
function tt(e, n) {
  let t = e.nodes().find((o) => !e.node(o).parent);
  if (!t) return;
  let r = Zn(e, [t]);
  r = r.slice(1), r.forEach((o) => {
    let s = e.node(o).parent, a = n.edge(o, s), d = false;
    a || (a = n.edge(s, o), d = true), n.node(o).rank = n.node(s).rank + (d ? a.minlen : -a.minlen);
  });
}
function rt(e, n, t) {
  return e.hasEdge(n, t);
}
function Ae(e, n, t) {
  return t.low <= n.lim && n.lim <= t.lim;
}
function ot(e) {
  let n = e.graph().ranker;
  if (typeof n == "function") return n(e);
  switch (n) {
    case "network-simplex":
      qe(e);
      break;
    case "tight-tree":
      st(e);
      break;
    case "longest-path":
      it(e);
      break;
    case "none":
      break;
    default:
      qe(e);
  }
}
function st(e) {
  S(e), V(e);
}
function qe(e) {
  Ve(e);
}
function at(e) {
  let n = lt(e);
  e.graph().dummyChains.forEach((t) => {
    let r = e.node(t), o = r.edgeObj, i = dt(e, n, o.v, o.w), s = i.path, a = i.lca, d = 0, l = s[d], u = true;
    for (; t !== o.w; ) {
      if (r = e.node(t), u) {
        for (; (l = s[d]) !== a && e.node(l).maxRank < r.rank; ) d++;
        l === a && (u = false);
      }
      if (!u) {
        for (; d < s.length - 1 && e.node(s[d + 1]).minRank <= r.rank; ) d++;
        l = s[d];
      }
      l !== void 0 && e.setParent(t, l), t = e.successors(t)[0];
    }
  });
}
function dt(e, n, t, r) {
  let o = [], i = [], s = Math.min(n[t].low, n[r].low), a = Math.max(n[t].lim, n[r].lim), d;
  d = t;
  do
    d = e.parent(d), o.push(d);
  while (d && (n[d].low > s || a > n[d].lim));
  let l = d, u = r;
  for (; (u = e.parent(u)) !== l; ) i.push(u);
  return { path: o.concat(i.reverse()), lca: l };
}
function lt(e) {
  let n = {}, t = 0;
  function r(o) {
    let i = t;
    e.children(o).forEach(r), n[o] = { low: i, lim: t++ };
  }
  return e.children(_).forEach(r), n;
}
function Ke(e) {
  let n = w(e, "root", {}, "_root"), t = ut(e), r = Object.values(t), o = L(Math.max, r) - 1, i = 2 * o + 1;
  e.graph().nestingRoot = n, e.edges().forEach((a) => e.edge(a).minlen *= i);
  let s = ct(e) + 1;
  e.children(_).forEach((a) => $e(e, n, i, s, o, t, a)), e.graph().nodeRankFactor = i;
}
function $e(e, n, t, r, o, i, s) {
  var c;
  let a = e.children(s);
  if (!a.length) {
    s !== n && e.setEdge(n, s, { weight: 0, minlen: t });
    return;
  }
  let d = q(e, "_bt"), l = q(e, "_bb"), u = e.node(s);
  e.setParent(d, s), u.borderTop = d, e.setParent(l, s), u.borderBottom = l, a.forEach((h) => {
    var y;
    $e(e, n, t, r, o, i, h);
    let f = e.node(h), g = f.borderTop ? f.borderTop : h, b = f.borderBottom ? f.borderBottom : h, m = f.borderTop ? r : 2 * r, E = g !== b ? 1 : o - ((y = i[s]) != null ? y : 0) + 1;
    e.setEdge(d, g, { weight: m, minlen: E, nestingEdge: true }), e.setEdge(b, l, { weight: m, minlen: E, nestingEdge: true });
  }), e.parent(s) || e.setEdge(n, d, { weight: 0, minlen: o + ((c = i[s]) != null ? c : 0) });
}
function ut(e) {
  let n = {};
  function t(r, o) {
    let i = e.children(r);
    i && i.length && i.forEach((s) => t(s, o + 1)), n[r] = o;
  }
  return e.children(_).forEach((r) => t(r, 1)), n;
}
function ct(e) {
  return e.edges().reduce((n, t) => n + e.edge(t).weight, 0);
}
function Je(e) {
  let n = e.graph();
  e.removeNode(n.nestingRoot), delete n.nestingRoot, e.edges().forEach((t) => {
    e.edge(t).nestingEdge && e.removeEdge(t);
  });
}
function ft(e) {
  function n(t) {
    let r = e.children(t), o = e.node(t);
    if (r.length && r.forEach(n), Object.hasOwn(o, "minRank")) {
      o.borderLeft = [], o.borderRight = [];
      for (let i = o.minRank, s = o.maxRank + 1; i < s; ++i) Qe(e, "borderLeft", "_bl", t, o, i), Qe(e, "borderRight", "_br", t, o, i);
    }
  }
  e.children(_).forEach(n);
}
function Qe(e, n, t, r, o, i) {
  let s = { width: 0, height: 0, rank: i, borderType: n }, a = o[n][i - 1], d = w(e, "border", s, t);
  o[n][i] = d, e.setParent(d, r), a && e.setEdge(a, d, { weight: 1 });
}
function nn(e) {
  var t;
  let n = (t = e.graph().rankdir) == null ? void 0 : t.toLowerCase();
  (n === "lr" || n === "rl") && rn(e);
}
function tn(e) {
  var t;
  let n = (t = e.graph().rankdir) == null ? void 0 : t.toLowerCase();
  (n === "bt" || n === "rl") && bt(e), (n === "lr" || n === "rl") && (gt(e), rn(e));
}
function rn(e) {
  e.nodes().forEach((n) => en(e.node(n))), e.edges().forEach((n) => en(e.edge(n)));
}
function en(e) {
  let n = e.width;
  e.width = e.height, e.height = n;
}
function bt(e) {
  e.nodes().forEach((n) => ne(e.node(n))), e.edges().forEach((n) => {
    var r;
    let t = e.edge(n);
    (r = t.points) == null || r.forEach(ne), Object.hasOwn(t, "y") && ne(t);
  });
}
function ne(e) {
  e.y = -e.y;
}
function gt(e) {
  e.nodes().forEach((n) => te(e.node(n))), e.edges().forEach((n) => {
    var r;
    let t = e.edge(n);
    (r = t.points) == null || r.forEach(te), Object.hasOwn(t, "x") && te(t);
  });
}
function te(e) {
  let n = e.x;
  e.x = e.y, e.y = n;
}
function re(e) {
  let n = {}, t = e.nodes().filter((d) => !e.children(d).length), r = t.map((d) => e.node(d).rank), o = L(Math.max, r), i = k(o + 1).map(() => []);
  function s(d) {
    if (n[d]) return;
    n[d] = true;
    let l = e.node(d);
    i[l.rank].push(d);
    let u = e.successors(d);
    u && u.forEach(s);
  }
  return t.sort((d, l) => e.node(d).rank - e.node(l).rank).forEach(s), i;
}
function oe(e, n) {
  let t = 0;
  for (let r = 1; r < n.length; ++r) t += mt(e, n[r - 1], n[r]);
  return t;
}
function mt(e, n, t) {
  let r = Re(t, t.map((l, u) => u)), o = n.flatMap((l) => {
    let u = e.outEdges(l);
    return u ? u.map((c) => ({ pos: r[c.w], weight: e.edge(c).weight })).sort((c, h) => c.pos - h.pos) : [];
  }), i = 1;
  for (; i < t.length; ) i <<= 1;
  let s = 2 * i - 1;
  i -= 1;
  let a = new Array(s).fill(0), d = 0;
  return o.forEach((l) => {
    let u = l.pos + i;
    a[u] += l.weight;
    let c = 0;
    for (; u > 0; ) u % 2 && (c += a[u + 1]), u = u - 1 >> 1, a[u] += l.weight;
    d += l.weight * c;
  }), d;
}
function ie(e, n = []) {
  return n.map((t) => {
    let r = e.inEdges(t);
    if (!r || !r.length) return { v: t };
    {
      let o = r.reduce((i, s) => {
        let a = e.edge(s), d = e.node(s.v);
        return { sum: i.sum + a.weight * d.order, weight: i.weight + a.weight };
      }, { sum: 0, weight: 0 });
      return { v: t, barycenter: o.sum / o.weight, weight: o.weight };
    }
  });
}
function se(e, n) {
  let t = {};
  e.forEach((o, i) => {
    let s = { indegree: 0, in: [], out: [], vs: [o.v], i };
    o.barycenter !== void 0 && (s.barycenter = o.barycenter, s.weight = o.weight), t[o.v] = s;
  }), n.edges().forEach((o) => {
    let i = t[o.v], s = t[o.w];
    i !== void 0 && s !== void 0 && (s.indegree++, i.out.push(s));
  });
  let r = Object.values(t).filter((o) => !o.indegree);
  return Et(r);
}
function Et(e) {
  let n = [];
  function t(o) {
    return (i) => {
      i.merged || (i.barycenter === void 0 || o.barycenter === void 0 || i.barycenter >= o.barycenter) && Lt(o, i);
    };
  }
  function r(o) {
    return (i) => {
      i.in.push(o), --i.indegree === 0 && e.push(i);
    };
  }
  for (; e.length; ) {
    let o = e.pop();
    n.push(o), o.in.reverse().forEach(t(o)), o.out.forEach(r(o));
  }
  return n.filter((o) => !o.merged).map((o) => T(o, ["vs", "i", "barycenter", "weight"]));
}
function Lt(e, n) {
  let t = 0, r = 0;
  e.weight && (t += e.barycenter * e.weight, r += e.weight), n.weight && (t += n.barycenter * n.weight, r += n.weight), e.vs = n.vs.concat(e.vs), e.barycenter = t / r, e.weight = r, e.i = Math.min(n.i, e.i), n.merged = true;
}
function ae(e, n) {
  let t = Ce(e, (u) => Object.hasOwn(u, "barycenter")), r = t.lhs, o = t.rhs.sort((u, c) => c.i - u.i), i = [], s = 0, a = 0, d = 0;
  r.sort(yt(!!n)), d = on(i, o, d), r.forEach((u) => {
    d += u.vs.length, i.push(u.vs), s += u.barycenter * u.weight, a += u.weight, d = on(i, o, d);
  });
  let l = { vs: i.flat(1) };
  return a && (l.barycenter = s / a, l.weight = a), l;
}
function on(e, n, t) {
  let r;
  for (; n.length && (r = n[n.length - 1]).i <= t; ) n.pop(), e.push(r.vs), t++;
  return t;
}
function yt(e) {
  return (n, t) => n.barycenter < t.barycenter ? -1 : n.barycenter > t.barycenter ? 1 : e ? t.i - n.i : n.i - t.i;
}
function W(e, n, t, r) {
  let o = e.children(n), i = e.node(n), s = i ? i.borderLeft : void 0, a = i ? i.borderRight : void 0, d = {};
  s && (o = o.filter((h) => h !== s && h !== a));
  let l = ie(e, o);
  l.forEach((h) => {
    if (e.children(h.v).length) {
      let f = W(e, h.v, t, r);
      d[h.v] = f, Object.hasOwn(f, "barycenter") && Nt(h, f);
    }
  });
  let u = se(l, t);
  wt(u, d);
  let c = ae(u, r);
  if (s && a) {
    c.vs = [s, c.vs, a].flat(1);
    let h = e.predecessors(s);
    if (h && h.length) {
      let f = e.node(h[0]), g = e.predecessors(a), b = e.node(g[0]);
      Object.hasOwn(c, "barycenter") || (c.barycenter = 0, c.weight = 0), c.barycenter = (c.barycenter * c.weight + f.order + b.order) / (c.weight + 2), c.weight += 2;
    }
  }
  return c;
}
function wt(e, n) {
  e.forEach((t) => {
    t.vs = t.vs.flatMap((r) => n[r] ? n[r].vs : r);
  });
}
function Nt(e, n) {
  e.barycenter !== void 0 ? (e.barycenter = (e.barycenter * e.weight + n.barycenter * n.weight) / (e.weight + n.weight), e.weight += n.weight) : (e.barycenter = n.barycenter, e.weight = n.weight);
}
function de(e, n, t, r) {
  r || (r = e.nodes());
  let o = Gt(e), i = new p({ compound: true }).setGraph({ root: o }).setDefaultNodeLabel((s) => e.node(s));
  return r.forEach((s) => {
    let a = e.node(s), d = e.parent(s);
    if (a.rank === n || a.minRank <= n && n <= a.maxRank) {
      i.setNode(s), i.setParent(s, d || o);
      let l = e[t](s);
      l && l.forEach((u) => {
        let c = u.v === s ? u.w : u.v, h = i.edge(c, s), f = h !== void 0 ? h.weight : 0;
        i.setEdge(c, s, { weight: e.edge(u).weight + f });
      }), Object.hasOwn(a, "minRank") && i.setNode(s, { borderLeft: a.borderLeft[n], borderRight: a.borderRight[n] });
    }
  }), i;
}
function Gt(e) {
  let n;
  for (; e.hasNode(n = j("_root")); ) ;
  return n;
}
function le(e, n, t) {
  let r = {}, o;
  t.forEach((i) => {
    let s = e.parent(i), a, d;
    for (; s; ) {
      if (a = e.parent(s), a ? (d = r[a], r[a] = s) : (d = o, o = s), d && d !== s) {
        n.setEdge(d, s);
        return;
      }
      s = a;
    }
  });
}
function B(e, n = {}) {
  if (typeof n.customOrder == "function") {
    n.customOrder(e, B);
    return;
  }
  let t = X(e), r = sn(e, k(1, t + 1), "inEdges"), o = sn(e, k(t - 1, -1, -1), "outEdges"), i = re(e);
  if (an(e, i), n.disableOptimalOrderHeuristic) return;
  let s = Number.POSITIVE_INFINITY, a, d = n.constraints || [];
  for (let l = 0, u = 0; u < 4; ++l, ++u) {
    kt(l % 2 ? r : o, l % 4 >= 2, d), i = N(e);
    let c = oe(e, i);
    c < s ? (u = 0, a = Object.assign({}, i), s = c) : c === s && (a = structuredClone(i));
  }
  an(e, a);
}
function sn(e, n, t) {
  let r = /* @__PURE__ */ new Map(), o = (i, s) => {
    r.has(i) || r.set(i, []), r.get(i).push(s);
  };
  for (let i of e.nodes()) {
    let s = e.node(i);
    if (typeof s.rank == "number" && o(s.rank, i), typeof s.minRank == "number" && typeof s.maxRank == "number") for (let a = s.minRank; a <= s.maxRank; a++) a !== s.rank && o(a, i);
  }
  return n.map(function(i) {
    return de(e, i, t, r.get(i) || []);
  });
}
function kt(e, n, t) {
  let r = new p();
  e.forEach(function(o) {
    t.forEach((a) => r.setEdge(a.left, a.right));
    let i = o.graph().root, s = W(o, i, r, n);
    s.vs.forEach((a, d) => o.node(a).order = d), le(o, r, s.vs);
  });
}
function an(e, n) {
  Object.values(n).forEach((t) => t.forEach((r, o) => e.node(r).order = o));
}
function vt(e, n) {
  let t = {};
  function r(o, i) {
    let s = 0, a = 0, d = o.length, l = i[i.length - 1];
    return i.forEach((u, c) => {
      let h = xt(e, u), f = h ? e.node(h).order : d;
      (h || u === l) && (i.slice(a, c + 1).forEach((g) => {
        let b = e.predecessors(g);
        b && b.forEach((m) => {
          let E = e.node(m), y = E.order;
          (y < s || f < y) && !(E.dummy && e.node(g).dummy) && dn(t, m, g);
        });
      }), a = c + 1, s = f);
    }), i;
  }
  return n.length && n.reduce(r), t;
}
function _t(e, n) {
  let t = {};
  function r(i, s, a, d, l) {
    k(s, a).forEach((u) => {
      let c = i[u];
      if (c !== void 0 && e.node(c).dummy) {
        let h = e.predecessors(c);
        h && h.forEach((f) => {
          if (f === void 0) return;
          let g = e.node(f);
          g.dummy && (g.order < d || g.order > l) && dn(t, f, c);
        });
      }
    });
  }
  function o(i, s) {
    let a = -1, d = -1, l = 0;
    return s.forEach((u, c) => {
      if (e.node(u).dummy === "border") {
        let h = e.predecessors(u);
        if (h && h.length) {
          let f = h[0];
          if (f === void 0) return;
          d = e.node(f).order, r(s, l, c, a, d), l = c, a = d;
        }
      }
      r(s, l, s.length, d, i.length);
    }), s;
  }
  return n.length && n.reduce(o), t;
}
function xt(e, n) {
  if (e.node(n).dummy) {
    let t = e.predecessors(n);
    if (t) return t.find((r) => e.node(r).dummy);
  }
}
function dn(e, n, t) {
  if (n > t) {
    let o = n;
    n = t, t = o;
  }
  let r = e[n];
  r || (e[n] = r = {}), r[t] = true;
}
function Tt(e, n, t) {
  if (n > t) {
    let o = n;
    n = t, t = o;
  }
  let r = e[n];
  return r !== void 0 && Object.hasOwn(r, t);
}
function Ot(e, n, t, r) {
  let o = {}, i = {}, s = {};
  return n.forEach((a) => {
    a.forEach((d, l) => {
      o[d] = d, i[d] = d, s[d] = l;
    });
  }), n.forEach((a) => {
    let d = -1;
    a.forEach((l) => {
      let u = r(l);
      if (u && u.length) {
        let c = u.sort((f, g) => {
          let b = s[f], m = s[g];
          return (b !== void 0 ? b : 0) - (m !== void 0 ? m : 0);
        }), h = (c.length - 1) / 2;
        for (let f = Math.floor(h), g = Math.ceil(h); f <= g; ++f) {
          let b = c[f];
          if (b === void 0) continue;
          let m = s[b];
          if (m !== void 0 && i[l] === l && d < m && !Tt(t, l, b)) {
            let E = o[b];
            E !== void 0 && (i[b] = l, i[l] = o[l] = E, d = m);
          }
        }
      }
    });
  }), { root: o, align: i };
}
function It(e, n, t, r, o = false) {
  let i = {}, s = Ct(e, n, t, o), a = o ? "borderLeft" : "borderRight";
  function d(f, g) {
    let b = s.nodes().slice(), m = {}, E = b.pop();
    for (; E; ) {
      if (m[E]) f(E);
      else {
        m[E] = true, b.push(E);
        for (let y of g(E)) b.push(y);
      }
      E = b.pop();
    }
  }
  function l(f) {
    let g = s.inEdges(f);
    g ? i[f] = g.reduce((b, m) => {
      var I;
      let E = (I = i[m.v]) != null ? I : 0, y = s.edge(m);
      return Math.max(b, E + (y !== void 0 ? y : 0));
    }, 0) : i[f] = 0;
  }
  function u(f) {
    let g = s.outEdges(f), b = Number.POSITIVE_INFINITY;
    g && (b = g.reduce((E, y) => {
      let I = i[y.w], be = s.edge(y);
      return Math.min(E, (I !== void 0 ? I : 0) - (be !== void 0 ? be : 0));
    }, Number.POSITIVE_INFINITY));
    let m = e.node(f);
    b !== Number.POSITIVE_INFINITY && m.borderType !== a && (i[f] = Math.max(i[f] !== void 0 ? i[f] : 0, b));
  }
  function c(f) {
    return s.predecessors(f) || [];
  }
  function h(f) {
    return s.successors(f) || [];
  }
  return d(l, c), d(u, h), Object.keys(r).forEach((f) => {
    var b;
    let g = t[f];
    g !== void 0 && (i[f] = (b = i[g]) != null ? b : 0);
  }), i;
}
function Ct(e, n, t, r) {
  let o = new p(), i = e.graph(), s = jt(i.nodesep, i.edgesep, r);
  return n.forEach((a) => {
    let d;
    a.forEach((l) => {
      let u = t[l];
      if (u !== void 0) {
        if (o.setNode(u), d !== void 0) {
          let c = t[d];
          if (c !== void 0) {
            let h = o.edge(c, u);
            o.setEdge(c, u, Math.max(s(e, l, d), h || 0));
          }
        }
        d = l;
      }
    });
  }), o;
}
function Rt(e, n) {
  return Object.values(n).reduce((t, r) => {
    let o = Number.NEGATIVE_INFINITY, i = Number.POSITIVE_INFINITY;
    Object.entries(r).forEach(([a, d]) => {
      let l = St(e, a) / 2;
      o = Math.max(d + l, o), i = Math.min(d - l, i);
    });
    let s = o - i;
    return s < t[0] && (t = [s, r]), t;
  }, [Number.POSITIVE_INFINITY, null])[1];
}
function Pt(e, n) {
  let t = Object.values(n), r = L(Math.min, t), o = L(Math.max, t);
  ["u", "d"].forEach((i) => {
    ["l", "r"].forEach((s) => {
      let a = i + s, d = e[a];
      if (!d || d === n) return;
      let l = Object.values(d), u = r - L(Math.min, l);
      s !== "l" && (u = o - L(Math.max, l)), u && (e[a] = O(d, (c) => c + u));
    });
  });
}
function Mt(e, n = void 0) {
  let t = e.ul;
  return t ? O(t, (r, o) => {
    var s, a;
    if (n) {
      let d = n.toLowerCase(), l = e[d];
      if (l && l[o] !== void 0) return l[o];
    }
    let i = Object.values(e).map((d) => {
      let l = d[o];
      return l !== void 0 ? l : 0;
    }).sort((d, l) => d - l);
    return (((s = i[1]) != null ? s : 0) + ((a = i[2]) != null ? a : 0)) / 2;
  }) : {};
}
function ln(e) {
  let n = N(e), t = Object.assign(vt(e, n), _t(e, n)), r = {}, o;
  ["u", "d"].forEach((s) => {
    o = s === "u" ? n : Object.values(n).reverse(), ["l", "r"].forEach((a) => {
      a === "r" && (o = o.map((c) => Object.values(c).reverse()));
      let l = Ot(e, o, t, (c) => (s === "u" ? e.predecessors(c) : e.successors(c)) || []), u = It(e, o, l.root, l.align, a === "r");
      a === "r" && (u = O(u, (c) => -c)), r[s + a] = u;
    });
  });
  let i = Rt(e, r);
  return Pt(r, i), Mt(r, e.graph().align);
}
function jt(e, n, t) {
  return (r, o, i) => {
    let s = r.node(o), a = r.node(i), d = 0, l;
    if (d += s.width / 2, Object.hasOwn(s, "labelpos")) switch (s.labelpos.toLowerCase()) {
      case "l":
        l = -s.width / 2;
        break;
      case "r":
        l = s.width / 2;
        break;
    }
    if (l && (d += t ? l : -l), l = void 0, d += (s.dummy ? n : e) / 2, d += (a.dummy ? n : e) / 2, d += a.width / 2, Object.hasOwn(a, "labelpos")) switch (a.labelpos.toLowerCase()) {
      case "l":
        l = a.width / 2;
        break;
      case "r":
        l = -a.width / 2;
        break;
    }
    return l && (d += t ? l : -l), d;
  };
}
function St(e, n) {
  return e.node(n).width;
}
function un(e) {
  e = A(e), Ft(e), Object.entries(ln(e)).forEach(([n, t]) => e.node(n).x = t);
}
function Ft(e) {
  let n = N(e), t = e.graph(), r = t.ranksep, o = t.rankalign, i = 0;
  n.forEach((s) => {
    let a = s.reduce((d, l) => {
      var c;
      let u = (c = e.node(l).height) != null ? c : 0;
      return d > u ? d : u;
    }, 0);
    s.forEach((d) => {
      let l = e.node(d);
      o === "top" ? l.y = i + l.height / 2 : o === "bottom" ? l.y = i + a - l.height / 2 : l.y = i + a / 2;
    }), i += a + r;
  });
}
function he(e, n = {}) {
  let t = n.debugTiming ? P : M;
  return t("layout", () => {
    let r = t("  buildLayoutGraph", () => Xt(e));
    return t("  runLayout", () => Dt(r, t, n)), t("  updateInputGraph", () => At(e, r)), r;
  });
}
function Dt(e, n, t) {
  n("    makeSpaceForEdgeLabels", () => Ut(e)), n("    removeSelfEdges", () => rr(e)), n("    acyclic", () => je(e)), n("    nestingGraph.run", () => Ke(e)), n("    rank", () => Xe(A(e))), n("    injectEdgeLabelProxies", () => Kt(e)), n("    removeEmptyRanks", () => Oe(e)), n("    nestingGraph.cleanup", () => Je(e)), n("    normalizeRanks", () => Te(e)), n("    assignRankMinMax", () => $t(e)), n("    removeEdgeLabelProxies", () => Jt(e)), n("    normalize.run", () => Fe(e)), n("    parentDummyChains", () => Ue(e)), n("    addBorderSegments", () => Ze(e)), n("    order", () => B(e, t)), n("    insertSelfEdges", () => or(e)), n("    adjustCoordinateSystem", () => nn(e)), n("    position", () => un(e)), n("    positionSelfEdges", () => ir(e)), n("    removeBorderNodes", () => tr(e)), n("    normalize.undo", () => De(e)), n("    fixupEdgeLabelCoords", () => er(e)), n("    undoCoordinateSystem", () => tn(e)), n("    translateGraph", () => Qt(e)), n("    assignNodeIntersects", () => Zt(e)), n("    reversePoints", () => nr(e)), n("    acyclic.undo", () => Se(e));
}
function At(e, n) {
  e.nodes().forEach((t) => {
    let r = e.node(t), o = n.node(t);
    r && (r.x = o.x, r.y = o.y, r.order = o.order, r.rank = o.rank, n.children(t).length && (r.width = o.width, r.height = o.height));
  }), e.edges().forEach((t) => {
    let r = e.edge(t), o = n.edge(t);
    r.points = o.points, Object.hasOwn(o, "x") && (r.x = o.x, r.y = o.y);
  }), e.graph().width = n.graph().width, e.graph().height = n.graph().height;
}
function Xt(e) {
  let n = new p({ multigraph: true, compound: true }), t = ce(e.graph());
  return n.setGraph(Object.assign({}, Wt, ue(t, Vt), T(t, Bt))), e.nodes().forEach((r) => {
    let o = ce(e.node(r)), i = ue(o, Yt);
    Object.keys(cn).forEach((a) => {
      i[a] === void 0 && (i[a] = cn[a]);
    }), n.setNode(r, i);
    let s = e.parent(r);
    s !== void 0 && n.setParent(r, s);
  }), e.edges().forEach((r) => {
    let o = ce(e.edge(r));
    n.setEdge(r, Object.assign({}, Ht, ue(o, zt), T(o, qt)));
  }), n;
}
function Ut(e) {
  let n = e.graph();
  n.ranksep /= 2, e.edges().forEach((t) => {
    let r = e.edge(t);
    r.minlen *= 2, r.labelpos.toLowerCase() !== "c" && (n.rankdir === "TB" || n.rankdir === "BT" ? r.width += r.labeloffset : r.height += r.labeloffset);
  });
}
function Kt(e) {
  e.edges().forEach((n) => {
    let t = e.edge(n);
    if (t.width && t.height) {
      let r = e.node(n.v), i = { rank: (e.node(n.w).rank - r.rank) / 2 + r.rank, e: n };
      w(e, "edge-proxy", i, "_ep");
    }
  });
}
function $t(e) {
  let n = 0;
  e.nodes().forEach((t) => {
    let r = e.node(t);
    r.borderTop && (r.minRank = e.node(r.borderTop).rank, r.maxRank = e.node(r.borderBottom).rank, n = Math.max(n, r.maxRank));
  }), e.graph().maxRank = n;
}
function Jt(e) {
  e.nodes().forEach((n) => {
    let t = e.node(n);
    if (t.dummy === "edge-proxy") {
      let r = t;
      e.edge(r.e).labelRank = t.rank, e.removeNode(n);
    }
  });
}
function Qt(e) {
  let n = Number.POSITIVE_INFINITY, t = 0, r = Number.POSITIVE_INFINITY, o = 0, i = e.graph(), s = i.marginx || 0, a = i.marginy || 0;
  function d(l) {
    let u = l.x, c = l.y, h = l.width, f = l.height;
    n = Math.min(n, u - h / 2), t = Math.max(t, u + h / 2), r = Math.min(r, c - f / 2), o = Math.max(o, c + f / 2);
  }
  e.nodes().forEach((l) => d(e.node(l))), e.edges().forEach((l) => {
    let u = e.edge(l);
    Object.hasOwn(u, "x") && d(u);
  }), n -= s, r -= a, e.nodes().forEach((l) => {
    let u = e.node(l);
    u.x -= n, u.y -= r;
  }), e.edges().forEach((l) => {
    let u = e.edge(l);
    u.points.forEach((c) => {
      c.x -= n, c.y -= r;
    }), Object.hasOwn(u, "x") && (u.x -= n), Object.hasOwn(u, "y") && (u.y -= r);
  }), i.width = t - n + s, i.height = o - r + a;
}
function Zt(e) {
  e.edges().forEach((n) => {
    let t = e.edge(n), r = e.node(n.v), o = e.node(n.w), i, s;
    t.points ? (i = t.points[0], s = t.points[t.points.length - 1]) : (t.points = [], i = o, s = r), t.points.unshift(H(r, i)), t.points.push(H(o, s));
  });
}
function er(e) {
  e.edges().forEach((n) => {
    let t = e.edge(n);
    if (Object.hasOwn(t, "x")) switch ((t.labelpos === "l" || t.labelpos === "r") && (t.width -= t.labeloffset), t.labelpos) {
      case "l":
        t.x -= t.width / 2 + t.labeloffset;
        break;
      case "r":
        t.x += t.width / 2 + t.labeloffset;
        break;
    }
  });
}
function nr(e) {
  e.edges().forEach((n) => {
    let t = e.edge(n);
    t.reversed && t.points.reverse();
  });
}
function tr(e) {
  e.nodes().forEach((n) => {
    if (e.children(n).length) {
      let t = e.node(n), r = e.node(t.borderTop), o = e.node(t.borderBottom), i = e.node(t.borderLeft[t.borderLeft.length - 1]), s = e.node(t.borderRight[t.borderRight.length - 1]);
      t.width = Math.abs(s.x - i.x), t.height = Math.abs(o.y - r.y), t.x = i.x + t.width / 2, t.y = r.y + t.height / 2;
    }
  }), e.nodes().forEach((n) => {
    e.node(n).dummy === "border" && e.removeNode(n);
  });
}
function rr(e) {
  e.edges().forEach((n) => {
    if (n.v === n.w) {
      let t = e.node(n.v);
      t.selfEdges || (t.selfEdges = []), t.selfEdges.push({ e: n, label: e.edge(n) }), e.removeEdge(n);
    }
  });
}
function or(e) {
  N(e).forEach((t) => {
    let r = 0;
    t.forEach((o, i) => {
      let s = e.node(o);
      s.order = i + r, (s.selfEdges || []).forEach((a) => {
        w(e, "selfedge", { width: a.label.width, height: a.label.height, rank: s.rank, order: i + ++r, e: a.e, label: a.label }, "_se");
      }), delete s.selfEdges;
    });
  });
}
function ir(e) {
  e.nodes().forEach((n) => {
    let t = e.node(n);
    if (t.dummy === "selfedge") {
      let r = t, o = e.node(r.e.v), i = o.x + o.width / 2, s = o.y, a = t.x - i, d = o.height / 2;
      e.setEdge(r.e, r.label), e.removeNode(n), r.label.points = [{ x: i + 2 * a / 3, y: s - d }, { x: i + 5 * a / 6, y: s - d }, { x: i + a, y: s }, { x: i + 5 * a / 6, y: s + d }, { x: i + 2 * a / 3, y: s + d }], r.label.x = t.x, r.label.y = t.y;
    }
  });
}
function ue(e, n) {
  return O(T(e, n), Number);
}
function ce(e) {
  let n = {};
  return e && Object.entries(e).forEach(([t, r]) => {
    typeof t == "string" && (t = t.toLowerCase()), n[t] = r;
  }), n;
}
function fe(e) {
  let n = N(e), t = new p({ compound: true, multigraph: true }).setGraph({});
  return e.nodes().forEach((r) => {
    t.setNode(r, { label: r }), t.setParent(r, "layer" + e.node(r).rank);
  }), e.edges().forEach((r) => t.setEdge(r.v, r.w, {}, r.name)), n.forEach((r, o) => {
    let i = "layer" + o;
    t.setNode(i, { rank: "same" }), r.reduce((s, a) => (t.setEdge(s, a, { style: "invis" }), a));
  }), t;
}
var ge, hn, fn, pe, z, bn, Le, p, pn, ye, R, wn, Ne, kn, Tn, D, Ie, An, _, U, K, Me, Wn, V, Zn, et, Ve, Xe, it, Ue, Ze, Vt, Wt, Bt, Yt, cn, zt, Ht, qt, sr, To;
var init_dagre_esm = __esm({
  "node_modules/@dagrejs/dagre/dist/dagre.esm.js"() {
    ge = Object.defineProperty;
    hn = (e, n, t) => n in e ? ge(e, n, { enumerable: true, configurable: true, writable: true, value: t }) : e[n] = t;
    fn = (e, n) => {
      for (var t in n) ge(e, t, { get: n[t], enumerable: true });
    };
    pe = (e, n, t) => hn(e, typeof n != "symbol" ? n + "" : n, t);
    z = {};
    fn(z, { Graph: () => p, alg: () => R, json: () => ye, version: () => pn });
    bn = Object.defineProperty;
    Le = (e, n) => {
      for (var t in n) bn(e, t, { get: n[t], enumerable: true });
    };
    p = class {
      constructor(e) {
        this._isDirected = true, this._isMultigraph = false, this._isCompound = false, this._nodes = {}, this._in = {}, this._preds = {}, this._out = {}, this._sucs = {}, this._edgeObjs = {}, this._edgeLabels = {}, this._nodeCount = 0, this._edgeCount = 0, this._defaultNodeLabelFn = () => {
        }, this._defaultEdgeLabelFn = () => {
        }, e && (this._isDirected = "directed" in e ? e.directed : true, this._isMultigraph = "multigraph" in e ? e.multigraph : false, this._isCompound = "compound" in e ? e.compound : false), this._isCompound && (this._parent = {}, this._children = {}, this._children["\0"] = {});
      }
      isDirected() {
        return this._isDirected;
      }
      isMultigraph() {
        return this._isMultigraph;
      }
      isCompound() {
        return this._isCompound;
      }
      setGraph(e) {
        return this._label = e, this;
      }
      graph() {
        return this._label;
      }
      setDefaultNodeLabel(e) {
        return typeof e != "function" ? this._defaultNodeLabelFn = () => e : this._defaultNodeLabelFn = e, this;
      }
      nodeCount() {
        return this._nodeCount;
      }
      nodes() {
        return Object.keys(this._nodes);
      }
      sources() {
        return this.nodes().filter((e) => Object.keys(this._in[e]).length === 0);
      }
      sinks() {
        return this.nodes().filter((e) => Object.keys(this._out[e]).length === 0);
      }
      setNodes(e, n) {
        return e.forEach((t) => {
          n !== void 0 ? this.setNode(t, n) : this.setNode(t);
        }), this;
      }
      setNode(e, n) {
        return e in this._nodes ? (arguments.length > 1 && (this._nodes[e] = n), this) : (this._nodes[e] = arguments.length > 1 ? n : this._defaultNodeLabelFn(e), this._isCompound && (this._parent[e] = "\0", this._children[e] = {}, this._children["\0"][e] = true), this._in[e] = {}, this._preds[e] = {}, this._out[e] = {}, this._sucs[e] = {}, ++this._nodeCount, this);
      }
      node(e) {
        return this._nodes[e];
      }
      hasNode(e) {
        return e in this._nodes;
      }
      removeNode(e) {
        if (e in this._nodes) {
          let n = (t) => this.removeEdge(this._edgeObjs[t]);
          delete this._nodes[e], this._isCompound && (this._removeFromParentsChildList(e), delete this._parent[e], this.children(e).forEach((t) => {
            this.setParent(t);
          }), delete this._children[e]), Object.keys(this._in[e]).forEach(n), delete this._in[e], delete this._preds[e], Object.keys(this._out[e]).forEach(n), delete this._out[e], delete this._sucs[e], --this._nodeCount;
        }
        return this;
      }
      setParent(e, n) {
        if (!this._isCompound) throw new Error("Cannot set parent in a non-compound graph");
        if (n === void 0) n = "\0";
        else {
          n += "";
          for (let t = n; t !== void 0; t = this.parent(t)) if (t === e) throw new Error("Setting " + n + " as parent of " + e + " would create a cycle");
          this.setNode(n);
        }
        return this.setNode(e), this._removeFromParentsChildList(e), this._parent[e] = n, this._children[n][e] = true, this;
      }
      parent(e) {
        if (this._isCompound) {
          let n = this._parent[e];
          if (n !== "\0") return n;
        }
      }
      children(e = "\0") {
        if (this._isCompound) {
          let n = this._children[e];
          if (n) return Object.keys(n);
        } else {
          if (e === "\0") return this.nodes();
          if (this.hasNode(e)) return [];
        }
        return [];
      }
      predecessors(e) {
        let n = this._preds[e];
        if (n) return Object.keys(n);
      }
      successors(e) {
        let n = this._sucs[e];
        if (n) return Object.keys(n);
      }
      neighbors(e) {
        let n = this.predecessors(e);
        if (n) {
          let t = new Set(n);
          for (let r of this.successors(e)) t.add(r);
          return Array.from(t.values());
        }
      }
      isLeaf(e) {
        let n;
        return this.isDirected() ? n = this.successors(e) : n = this.neighbors(e), n.length === 0;
      }
      filterNodes(e) {
        let n = new this.constructor({ directed: this._isDirected, multigraph: this._isMultigraph, compound: this._isCompound });
        n.setGraph(this.graph()), Object.entries(this._nodes).forEach(([o, i]) => {
          e(o) && n.setNode(o, i);
        }), Object.values(this._edgeObjs).forEach((o) => {
          n.hasNode(o.v) && n.hasNode(o.w) && n.setEdge(o, this.edge(o));
        });
        let t = {}, r = (o) => {
          let i = this.parent(o);
          return !i || n.hasNode(i) ? (t[o] = i != null ? i : void 0, i != null ? i : void 0) : i in t ? t[i] : r(i);
        };
        return this._isCompound && n.nodes().forEach((o) => n.setParent(o, r(o))), n;
      }
      setDefaultEdgeLabel(e) {
        return typeof e != "function" ? this._defaultEdgeLabelFn = () => e : this._defaultEdgeLabelFn = e, this;
      }
      edgeCount() {
        return this._edgeCount;
      }
      edges() {
        return Object.values(this._edgeObjs);
      }
      setPath(e, n) {
        return e.reduce((t, r) => (n !== void 0 ? this.setEdge(t, r, n) : this.setEdge(t, r), r)), this;
      }
      setEdge(e, n, t, r) {
        let o, i, s, a, d = false;
        typeof e == "object" && e !== null && "v" in e ? (o = e.v, i = e.w, s = e.name, arguments.length === 2 && (a = n, d = true)) : (o = e, i = n, s = r, arguments.length > 2 && (a = t, d = true)), o = "" + o, i = "" + i, s !== void 0 && (s = "" + s);
        let l = C(this._isDirected, o, i, s);
        if (l in this._edgeLabels) return d && (this._edgeLabels[l] = a), this;
        if (s !== void 0 && !this._isMultigraph) throw new Error("Cannot set a named edge when isMultigraph = false");
        this.setNode(o), this.setNode(i), this._edgeLabels[l] = d ? a : this._defaultEdgeLabelFn(o, i, s);
        let u = gn(this._isDirected, o, i, s);
        return o = u.v, i = u.w, Object.freeze(u), this._edgeObjs[l] = u, me(this._preds[i], o), me(this._sucs[o], i), this._in[i][l] = u, this._out[o][l] = u, this._edgeCount++, this;
      }
      edge(e, n, t) {
        let r = arguments.length === 1 ? Y(this._isDirected, e) : C(this._isDirected, e, n, t);
        return this._edgeLabels[r];
      }
      edgeAsObj(e, n, t) {
        let r = arguments.length === 1 ? this.edge(e) : this.edge(e, n, t);
        return typeof r != "object" ? { label: r } : r;
      }
      hasEdge(e, n, t) {
        return (arguments.length === 1 ? Y(this._isDirected, e) : C(this._isDirected, e, n, t)) in this._edgeLabels;
      }
      removeEdge(e, n, t) {
        let r = arguments.length === 1 ? Y(this._isDirected, e) : C(this._isDirected, e, n, t), o = this._edgeObjs[r];
        if (o) {
          let i = o.v, s = o.w;
          delete this._edgeLabels[r], delete this._edgeObjs[r], Ee(this._preds[s], i), Ee(this._sucs[i], s), delete this._in[s][r], delete this._out[i][r], this._edgeCount--;
        }
        return this;
      }
      inEdges(e, n) {
        return this.isDirected() ? this.filterEdges(this._in[e], e, n) : this.nodeEdges(e, n);
      }
      outEdges(e, n) {
        return this.isDirected() ? this.filterEdges(this._out[e], e, n) : this.nodeEdges(e, n);
      }
      nodeEdges(e, n) {
        if (e in this._nodes) return this.filterEdges({ ...this._in[e], ...this._out[e] }, e, n);
      }
      _removeFromParentsChildList(e) {
        delete this._children[this._parent[e]][e];
      }
      filterEdges(e, n, t) {
        if (!e) return;
        let r = Object.values(e);
        return t ? r.filter((o) => o.v === n && o.w === t || o.v === t && o.w === n) : r;
      }
    };
    pn = "4.0.1";
    ye = {};
    Le(ye, { read: () => yn, write: () => mn });
    R = {};
    Le(R, { CycleException: () => D, bellmanFord: () => we, components: () => Gn, dijkstra: () => F, dijkstraAll: () => _n, findCycles: () => xn, floydWarshall: () => On, isAcyclic: () => Cn, postorder: () => Pn, preorder: () => Mn, prim: () => jn, shortestPaths: () => Sn, tarjan: () => Ge, topsort: () => ke });
    wn = () => 1;
    Ne = class {
      constructor() {
        this._arr = [], this._keyIndices = {};
      }
      size() {
        return this._arr.length;
      }
      keys() {
        return this._arr.map((e) => e.key);
      }
      has(e) {
        return e in this._keyIndices;
      }
      priority(e) {
        let n = this._keyIndices[e];
        if (n !== void 0) return this._arr[n].priority;
      }
      min() {
        if (this.size() === 0) throw new Error("Queue underflow");
        return this._arr[0].key;
      }
      add(e, n) {
        let t = this._keyIndices, r = String(e);
        if (!(r in t)) {
          let o = this._arr, i = o.length;
          return t[r] = i, o.push({ key: r, priority: n }), this._decrease(i), true;
        }
        return false;
      }
      removeMin() {
        this._swap(0, this._arr.length - 1);
        let e = this._arr.pop();
        return delete this._keyIndices[e.key], this._heapify(0), e.key;
      }
      decrease(e, n) {
        let t = this._keyIndices[e];
        if (t === void 0) throw new Error(`Key not found: ${e}`);
        let r = this._arr[t].priority;
        if (n > r) throw new Error(`New priority is greater than current priority. Key: ${e} Old: ${r} New: ${n}`);
        this._arr[t].priority = n, this._decrease(t);
      }
      _heapify(e) {
        let n = this._arr, t = 2 * e, r = t + 1, o = e;
        t < n.length && (o = n[t].priority < n[o].priority ? t : o, r < n.length && (o = n[r].priority < n[o].priority ? r : o), o !== e && (this._swap(e, o), this._heapify(o)));
      }
      _decrease(e) {
        let n = this._arr, t = n[e].priority, r;
        for (; e !== 0 && (r = e >> 1, !(n[r].priority < t)); ) this._swap(e, r), e = r;
      }
      _swap(e, n) {
        let t = this._arr, r = this._keyIndices, o = t[e], i = t[n];
        t[e] = i, t[n] = o, r[i.key] = e, r[o.key] = n;
      }
    };
    kn = () => 1;
    Tn = () => 1;
    D = class extends Error {
      constructor(...e) {
        super(...e);
      }
    };
    Ie = 65535;
    An = 0;
    _ = "\0";
    U = "3.0.0";
    K = class {
      constructor() {
        pe(this, "_sentinel");
        let n = {};
        n._next = n._prev = n, this._sentinel = n;
      }
      dequeue() {
        let n = this._sentinel, t = n._prev;
        if (t !== n) return Pe(t), t;
      }
      enqueue(n) {
        let t = this._sentinel;
        n._prev && n._next && Pe(n), n._next = t._next, t._next._prev = n, t._next = n, n._prev = t;
      }
      toString() {
        let n = [], t = this._sentinel, r = t._prev;
        for (; r !== t; ) n.push(JSON.stringify(r, Vn)), r = r._prev;
        return "[" + n.join(", ") + "]";
      }
    };
    Me = K;
    Wn = () => 1;
    V = Kn;
    ({ preorder: Zn, postorder: et } = R);
    Ve = x;
    x.initLowLimValues = ee;
    x.initCutValues = Z;
    x.calcCutValue = We;
    x.leaveEdge = Ye;
    x.enterEdge = ze;
    x.exchangeEdges = He;
    Xe = ot;
    it = S;
    Ue = at;
    Ze = ft;
    Vt = ["nodesep", "edgesep", "ranksep", "marginx", "marginy"];
    Wt = { ranksep: 50, edgesep: 20, nodesep: 50, rankdir: "TB", rankalign: "center" };
    Bt = ["acyclicer", "ranker", "rankdir", "align", "rankalign"];
    Yt = ["width", "height", "rank"];
    cn = { width: 0, height: 0 };
    zt = ["minlen", "weight", "width", "height", "labeloffset"];
    Ht = { minlen: 1, weight: 1, width: 0, height: 0, labeloffset: 10, labelpos: "r" };
    qt = ["labelpos"];
    sr = { graphlib: z, version: U, layout: he, debug: fe, util: { time: P, notime: M } };
    To = sr;
  }
});

// src/layout-dagre.js
var layout_dagre_exports = {};
__export(layout_dagre_exports, {
  dagreLayout: () => dagreLayout
});
function dagreLayout(nodes, edges, options = {}) {
  var _a, _b, _c, _d;
  const g = new To.graphlib.Graph();
  g.setDefaultEdgeLabel(() => ({}));
  g.setGraph({
    rankdir: options.direction || "LR",
    nodesep: (_a = options.nodeGap) != null ? _a : 60,
    ranksep: (_b = options.rankGap) != null ? _b : 90,
    marginx: (_c = options.padding) != null ? _c : 48,
    marginy: (_d = options.padding) != null ? _d : 48
  });
  nodes.forEach((n) => {
    var _a2, _b2, _c2, _d2;
    const w2 = (_b2 = (_a2 = n.size) == null ? void 0 : _a2.w) != null ? _b2 : 96;
    const h = ((_d2 = (_c2 = n.size) == null ? void 0 : _c2.h) != null ? _d2 : 56) + estimateBottomPillHeight(n);
    g.setNode(n.id, { width: w2, height: h });
  });
  edges.filter((e) => e.routing !== "loopback").forEach((e) => {
    if (g.hasNode(e.from) && g.hasNode(e.to)) g.setEdge(e.from, e.to);
  });
  To.layout(g);
  nodes.forEach((n) => {
    const pos = g.node(n.id);
    if (pos) {
      n.x = pos.x;
      n.y = pos.y;
    }
  });
  return nodes;
}
var init_layout_dagre = __esm({
  "src/layout-dagre.js"() {
    init_dagre_esm();
    init_compose_pills();
  }
});

// src/layout.js
function autoLayout(nodes, edges, options = {}) {
  var _a, _b, _c, _d;
  const rankGap = (_a = options.rankGap) != null ? _a : 140;
  const nodeGap = (_b = options.nodeGap) != null ? _b : 100;
  const direction = options.direction || "LR";
  const padding = (_c = options.padding) != null ? _c : 60;
  const incoming = {};
  const outgoing = {};
  edges.forEach((e) => {
    if (!outgoing[e.from]) outgoing[e.from] = [];
    if (!incoming[e.to]) incoming[e.to] = [];
    outgoing[e.from].push(e);
    incoming[e.to].push(e);
  });
  const layers = {};
  const visited = /* @__PURE__ */ new Set();
  const roots = nodes.filter((n) => {
    var _a2;
    return !((_a2 = incoming[n.id]) == null ? void 0 : _a2.length) || n.role === "source";
  });
  const queue = roots.length ? roots.map((n) => n.id) : nodes.map((n) => n.id);
  queue.forEach((id) => {
    layers[id] = 0;
    visited.add(id);
  });
  let guard = 0;
  while (queue.length && guard++ < nodes.length * 3) {
    const id = queue.shift();
    const rank = (_d = layers[id]) != null ? _d : 0;
    (outgoing[id] || []).forEach((e) => {
      var _a2;
      const next = e.to;
      layers[next] = Math.max((_a2 = layers[next]) != null ? _a2 : 0, rank + 1);
      if (!visited.has(next)) {
        visited.add(next);
        queue.push(next);
      }
    });
  }
  nodes.forEach((n) => {
    if (layers[n.id] == null) layers[n.id] = 0;
  });
  const byRank = {};
  nodes.forEach((n) => {
    const r = layers[n.id];
    if (!byRank[r]) byRank[r] = [];
    byRank[r].push(n);
  });
  Object.keys(byRank).forEach((rank) => {
    byRank[rank].forEach((n, i) => {
      if (!options.force && n.x != null && n.y != null) return;
      if (direction === "LR") {
        n.x = padding + Number(rank) * rankGap;
        n.y = padding + i * nodeGap;
      } else {
        n.x = padding + i * nodeGap;
        n.y = padding + Number(rank) * rankGap;
      }
    });
  });
  return nodes;
}
function needsLayout(nodes) {
  return nodes.some((n) => n.x == null || n.y == null);
}

// src/config.js
var DEFAULTS = {
  viewport: { width: "100%", height: 420, padding: 40 },
  zoom: { enabled: true, min: 0.4, max: 2.5, wheel: true },
  theme: {
    background: "#FAFAF8",
    font: "DM Sans, system-ui, sans-serif",
    primary: "#7C3AED",
    success: "#3D6B52",
    warning: "#D97706",
    danger: "#9B1C1C",
    border: "#CEC9BF",
    text: "#1C1917",
    textMuted: "#57534E",
    pillSurface: "#FFFFFF"
  },
  tokens: { shape: "circle", size: 7, speed: 120, color: "#7C3AED" },
  layout: { engine: "layered", direction: "LR", rankGap: 140, nodeGap: 100 },
  metrics: { nodePanel: true, nodeDrawer: true, systemPanel: true, globalDrawer: true, windowSec: 30, charts: true },
  randomness: { enabled: false, duration: { jitter: 0.2 }, speed: { jitter: 0.1 }, sources: { jitter: 0.15 } },
  controls: { toolbar: true, playPause: true, zoomReset: true, metricsDrawer: true, reset: true, layout: false },
  interaction: { nodeDrag: true, nodeSelect: true },
  maxParticles: 200
};
var TONE_COLORS = {
  primary: "#7C3AED",
  success: "#3D6B52",
  warning: "#D97706",
  danger: "#9B1C1C"
};
var VALID_TYPES = /* @__PURE__ */ new Set(["port", "process"]);
function edgeId(from, to, explicit) {
  return explicit || `${from}-${to}`;
}
function resolveColor(color, theme) {
  if (!color) return theme.border;
  if (TONE_COLORS[color]) return TONE_COLORS[color];
  return color;
}
function normalizeToken(token, theme) {
  if (!token) return null;
  const t = { ...token };
  if (t.color) t.color = resolveColor(t.color, theme);
  return t;
}
function normalizePills(arr) {
  if (!arr) return [];
  const list = Array.isArray(arr) ? arr : [arr];
  return list.map((p2) => typeof p2 === "string" ? { text: p2 } : { ...p2 });
}
function defaultShape(type, role, rawShape) {
  if (rawShape) return rawShape === "circle" ? "circle" : "rect";
  if (type === "port" && (role === "source" || role === "terminal")) return "circle";
  return "rect";
}
function defaultSize(shape) {
  return shape === "circle" ? { w: 64, h: 64 } : { w: 96, h: 56 };
}
function normalizeEmit(raw, rejectEdge) {
  var _a, _b;
  if (!raw) {
    if (rejectEdge) return { mode: "excludeReject", count: 1 };
    return { mode: "all", count: 1 };
  }
  const mode = raw.mode || "all";
  if (mode === "map") {
    return { mode: "map", map: raw.map || {}, count: (_a = raw.count) != null ? _a : 1, token: raw.token };
  }
  return { mode, count: (_b = raw.count) != null ? _b : 1, token: raw.token, map: raw.map };
}
function normalizeGate(raw) {
  var _a, _b, _c;
  const g = raw == null ? void 0 : raw.gate;
  if (!g) return { count: 1, from: "any" };
  if (Array.isArray(g.from)) return { count: (_a = g.count) != null ? _a : 1, from: g.from };
  if (g.from === "all-edges") return { count: (_b = g.count) != null ? _b : 1, from: "all-edges" };
  return { count: (_c = g.count) != null ? _c : 1, from: g.from || "any" };
}
function normalizeAdmission(raw) {
  var _a, _b;
  const a = raw.admission;
  if (!a) {
    return { mode: "queue", max: null, step: 1, rejectEdge: null };
  }
  return {
    mode: a.mode || "queue",
    max: (_a = a.max) != null ? _a : null,
    step: (_b = a.step) != null ? _b : 1,
    rejectEdge: a.rejectEdge || null
  };
}
function normalizeRetry(raw) {
  var _a;
  if (!raw.retry) return null;
  return {
    backEdge: raw.retry.backEdge,
    maxRetries: (_a = raw.retry.maxRetries) != null ? _a : 3
  };
}
function normalizeCircuit(raw) {
  var _a, _b, _c;
  if (!raw.circuit) return null;
  const c = raw.circuit;
  return {
    failureRate: (_a = c.failureRate) != null ? _a : 0.25,
    failureThreshold: (_b = c.failureThreshold) != null ? _b : 5,
    recoveryMs: (_c = c.recoveryMs) != null ? _c : 8e3,
    acceptEdge: c.acceptEdge || null,
    fallbackEdge: c.fallbackEdge || null
  };
}
function normalizeNode(n, theme) {
  var _a, _b;
  const type = n.type || "process";
  if (!VALID_TYPES.has(type)) {
    throw new Error(`FlowGraph: unknown node type "${type}" on "${n.id}"`);
  }
  const role = n.role || (type === "port" ? "sink" : null);
  const shape = defaultShape(type, role, n.shape);
  const size = { ...defaultSize(shape), ...n.size || {} };
  const style = {
    fill: "#fff",
    stroke: theme.border,
    strokeWidth: 1.5,
    radius: shape === "circle" ? size.w / 2 : 8,
    ...n.style || {}
  };
  if (n.tone && TONE_COLORS[n.tone]) style.stroke = TONE_COLORS[n.tone];
  const admission = normalizeAdmission(n);
  const gate = type === "process" ? normalizeGate(n) : { count: 1, from: "any" };
  const emit = type === "process" ? normalizeEmit(n.emit, admission.rejectEdge) : null;
  const retry = type === "process" ? normalizeRetry(n) : null;
  const circuit = type === "process" ? normalizeCircuit(n) : null;
  return {
    id: n.id,
    x: n.x,
    y: n.y,
    type,
    role,
    label: shape === "circle" ? null : n.label || n.id,
    shape,
    size,
    icon: n.icon || null,
    tone: n.tone || null,
    style,
    pillTop: normalizePills(n.pillTop),
    pillBottom: [],
    duration: type === "process" ? (_a = n.duration) != null ? _a : 800 : 0,
    durationJitter: n.durationJitter,
    admission,
    gate,
    emit,
    retry,
    circuit,
    rejectToken: normalizeToken(n.rejectToken, theme),
    showReceived: n.showReceived === true,
    emitToken: ((_b = n.emit) == null ? void 0 : _b.token) || n.emitToken || null
  };
}
function normalizeEdge(e, theme) {
  var _a, _b, _c, _d, _e2;
  const strokeRaw = e.stroke || {};
  const dashMap = { solid: null, dash: "6 4", dot: "2 3" };
  const dashVal = strokeRaw.dash;
  const dash = dashVal == null ? null : dashMap[dashVal] || dashVal;
  return {
    id: edgeId(e.from, e.to, e.id),
    from: e.from,
    to: e.to,
    routing: e.routing || "bezier",
    loopSide: e.loopSide || null,
    weight: (_a = e.weight) != null ? _a : null,
    speed: (_b = e.speed) != null ? _b : null,
    animated: e.animated === true,
    stroke: {
      color: resolveColor(strokeRaw.color || e.color, theme),
      width: (_d = (_c = strokeRaw.width) != null ? _c : e.width) != null ? _d : 2,
      dash
    },
    label: e.label ? typeof e.label === "string" ? { text: e.label, icon: null, animated: false, progress: null } : { text: e.label.text || null, icon: e.label.icon || null, animated: e.label.animated, progress: (_e2 = e.label.progress) != null ? _e2 : null } : null,
    token: normalizeToken(e.token, theme)
  };
}
function parseConfig(raw) {
  var _a, _b;
  if (!raw || !raw.nodes || !raw.edges) {
    throw new Error("FlowGraph: config requires nodes[] and edges[]");
  }
  const theme = { ...DEFAULTS.theme, ...raw.theme || {} };
  const viewport = { ...DEFAULTS.viewport, ...raw.viewport || {} };
  if ((_a = raw.viewport) == null ? void 0 : _a.background) {
    viewport.background = { ...DEFAULTS.viewport.background || {}, ...raw.viewport.background };
  }
  const zoom = { ...DEFAULTS.zoom, ...raw.zoom || {} };
  const layout = { ...DEFAULTS.layout, ...raw.layout || {} };
  const metrics = { ...DEFAULTS.metrics, ...raw.metrics || {} };
  const randomness = { ...DEFAULTS.randomness, ...raw.randomness || {} };
  const tokenDefault = normalizeToken({ ...DEFAULTS.tokens, ...raw.tokens || {} }, theme) || { ...DEFAULTS.tokens };
  let nodes = raw.nodes.map((n) => normalizeNode(n, theme));
  const edges = raw.edges.map((e) => normalizeEdge(e, theme));
  if (needsLayout(nodes)) {
    nodes = autoLayout(nodes, edges, {
      direction: layout.direction,
      rankGap: layout.rankGap,
      nodeGap: layout.nodeGap,
      padding: viewport.padding || 60
    });
  }
  const nodesById = {};
  nodes.forEach((n) => {
    nodesById[n.id] = n;
  });
  const edgesById = {};
  edges.forEach((e) => {
    edgesById[e.id] = e;
  });
  const outgoing = {};
  const incoming = {};
  edges.forEach((e) => {
    if (!outgoing[e.from]) outgoing[e.from] = [];
    if (!incoming[e.to]) incoming[e.to] = [];
    outgoing[e.from].push(e);
    incoming[e.to].push(e);
  });
  const sources = (raw.sources || []).map((s, i) => {
    var _a2, _b2;
    const edgeRef = s.edge || (s.from && s.to ? edgeId(s.from, s.to) : null);
    if (!edgeRef) throw new Error(`FlowGraph: source[${i}] needs edge or from/to`);
    const edge = edgesById[edgeRef] || edges.find((e) => e.from === s.from && e.to === s.to);
    if (!edge) throw new Error(`FlowGraph: source[${i}] references unknown edge "${edgeRef}"`);
    return {
      id: s.id || `source-${i}`,
      edgeId: edge.id,
      interval: s.interval != null ? s.interval : 1400,
      delay: (_a2 = s.delay) != null ? _a2 : 0,
      jitter: s.jitter || ((_b2 = randomness.sources) == null ? void 0 : _b2.jitter) || 0,
      burst: s.burst || { count: 1, spacing: 60 },
      token: normalizeToken({ ...tokenDefault, ...s.token || {} }, theme) || { ...tokenDefault },
      enabled: s.enabled !== false
    };
  });
  return {
    title: raw.title || null,
    viewport,
    zoom,
    theme,
    layout,
    metrics,
    randomness,
    tokenDefault,
    maxParticles: (_b = raw.maxParticles) != null ? _b : DEFAULTS.maxParticles,
    controls: { ...DEFAULTS.controls, ...raw.controls || {} },
    interaction: { ...DEFAULTS.interaction, ...raw.interaction || {} },
    injectStyles: raw.injectStyles === true,
    autoStart: raw.autoStart !== false,
    nodes,
    nodesById,
    edges,
    edgesById,
    outgoing,
    incoming,
    sources
  };
}
function resolveTokenConfig(config, fromNode, edge) {
  var _a;
  const base = { ...config.tokenDefault };
  if (fromNode == null ? void 0 : fromNode.emitToken) Object.assign(base, fromNode.emitToken);
  if (edge == null ? void 0 : edge.token) Object.assign(base, edge.token);
  const rejectId = (_a = fromNode == null ? void 0 : fromNode.admission) == null ? void 0 : _a.rejectEdge;
  if ((fromNode == null ? void 0 : fromNode.rejectToken) && (edge == null ? void 0 : edge.id) === rejectId) Object.assign(base, fromNode.rejectToken);
  if (base.color) base.color = resolveColor(base.color, config.theme);
  return base;
}
function applyNodePatch(config, nodeId, patch) {
  const node = config.nodesById[nodeId];
  if (!node) throw new Error(`FlowGraph: unknown node "${nodeId}"`);
  if (patch.duration != null) node.duration = Number(patch.duration);
  if (patch.showReceived != null) node.showReceived = !!patch.showReceived;
  if (patch.admission) {
    node.admission = { ...node.admission, ...patch.admission };
  }
  if (patch.gate) {
    const { mode, count } = patch.gate;
    if (mode === "all") node.gate = { count: count != null ? count : 1, from: "all-edges" };
    else node.gate = { count: count != null ? count : 1, from: "any" };
  }
  if (patch.retry) {
    node.retry = { ...node.retry, ...patch.retry };
  }
  if (patch.circuit) {
    node.circuit = { ...node.circuit, ...patch.circuit };
  }
  if (patch.weights && typeof patch.weights === "object") {
    Object.entries(patch.weights).forEach(([edgeId2, weight]) => {
      const edge = config.edgesById[edgeId2];
      if (edge && edge.from === nodeId) edge.weight = Number(weight);
    });
    node.emit = { ...node.emit, mode: "weighted" };
  }
  const idx = config.nodes.findIndex((n) => n.id === nodeId);
  if (idx >= 0) config.nodes[idx] = node;
  return node;
}

// src/geometry.js
init_compose_pills();
var NS = "http://www.w3.org/2000/svg";
var ANGLE_SPREAD = 0.14;
var LABEL_T_SPREAD = 0.12;
function nodeBounds(node) {
  const { w: w2, h } = node.size;
  const hw = w2 / 2;
  const hh = h / 2;
  if (node.shape === "circle") return { hw, hh: hw };
  return { hw, hh };
}
function rayRectIntersect(cx, cy, cos, sin, hw, hh) {
  let t = Infinity;
  if (cos > 1e-9) t = Math.min(t, hw / cos);
  if (cos < -1e-9) t = Math.min(t, -hw / cos);
  if (sin > 1e-9) t = Math.min(t, hh / sin);
  if (sin < -1e-9) t = Math.min(t, -hh / sin);
  if (!Number.isFinite(t) || t <= 0) t = Math.max(hw, hh);
  return { x: cx + cos * t, y: cy + sin * t };
}
function boundaryPointAtAngle(node, angleRad) {
  const { hw, hh } = nodeBounds(node);
  const cos = Math.cos(angleRad);
  const sin = Math.sin(angleRad);
  if (node.shape === "circle") {
    return { x: node.x + cos * hw, y: node.y + sin * hw };
  }
  return rayRectIntersect(node.x, node.y, cos, sin, hw, hh);
}
function isLoopbackEdge(fromNode, toNode, routing) {
  if (routing === "loopback") return true;
  if (routing === "straight") return false;
  return toNode.x < fromNode.x - 20;
}
function computeEdgeAnchorOffsets(edges, nodesById) {
  const fromGroups = {};
  const toGroups = {};
  const offsets = {};
  edges.forEach((edge) => {
    const fromNode = nodesById[edge.from];
    const toNode = nodesById[edge.to];
    if (!fromNode || !toNode) return;
    const angle = Math.atan2(toNode.y - fromNode.y, toNode.x - fromNode.x);
    const kf = `${edge.from}:out`;
    const kt2 = `${edge.to}:in`;
    if (!fromGroups[kf]) fromGroups[kf] = [];
    if (!toGroups[kt2]) toGroups[kt2] = [];
    fromGroups[kf].push({ edge, angle });
    toGroups[kt2].push({ edge, angle });
    offsets[edge.id] = { fromAngle: 0, toAngle: 0, labelT: 0.5 };
  });
  function spreadAngle(groups, field) {
    Object.values(groups).forEach((group) => {
      if (group.length <= 1) return;
      group.sort((a, b) => a.angle - b.angle);
      group.forEach((item, i) => {
        const delta = (i - (group.length - 1) / 2) * ANGLE_SPREAD;
        offsets[item.edge.id][field] = delta;
        if (field === "fromAngle") {
          offsets[item.edge.id].labelT = 0.38 + i / Math.max(1, group.length - 1) * LABEL_T_SPREAD;
        }
      });
    });
  }
  spreadAngle(fromGroups, "fromAngle");
  spreadAngle(toGroups, "toAngle");
  return offsets;
}
function cubicAt(p0, p1, p2, p3, t) {
  const u = 1 - t;
  return {
    x: u * u * u * p0.x + 3 * u * u * t * p1.x + 3 * u * t * t * p2.x + t * t * t * p3.x,
    y: u * u * u * p0.y + 3 * u * u * t * p1.y + 3 * u * t * t * p2.y + t * t * t * p3.y
  };
}
function sampleCubic(p0, p1, p2, p3, steps = 24) {
  const pts = [];
  for (let i = 0; i <= steps; i++) pts.push(cubicAt(p0, p1, p2, p3, i / steps));
  return pts;
}
function loopSidePreference(fromNode, toNode, loopSide) {
  if (loopSide === "above" || loopSide === "below") return loopSide;
  const goingBack = toNode.x < fromNode.x - 8;
  return goingBack ? "below" : "above";
}
function loopbackControls(p0, p3, fromNode, toNode, loopSide) {
  const dx = p3.x - p0.x;
  const dy = p3.y - p0.y;
  const len = Math.hypot(dx, dy) || 1;
  let nx = -dy / len;
  let ny = dx / len;
  const side = loopSidePreference(fromNode, toNode, loopSide);
  const wantDown = side === "below";
  if (wantDown && ny < 0) {
    nx = -nx;
    ny = -ny;
  }
  if (!wantDown && ny > 0) {
    nx = -nx;
    ny = -ny;
  }
  const bulge = Math.max(52, len * 0.32 + 42);
  const p1 = { x: p0.x + nx * bulge * 0.55 + dx * 0.12, y: p0.y + ny * bulge * 0.55 + dy * 0.12 };
  const p2 = { x: p3.x + nx * bulge * 0.55 - dx * 0.12, y: p3.y + ny * bulge * 0.55 - dy * 0.12 };
  return { p0, p1, p2, p3 };
}
function forwardControls(p0, p3, angleOut, angleIn) {
  const dx = p3.x - p0.x;
  const dy = p3.y - p0.y;
  const dist = Math.hypot(dx, dy) || 1;
  const cpOffset = Math.min(dist * 0.45, 90);
  return {
    p0,
    p1: { x: p0.x + Math.cos(angleOut) * cpOffset, y: p0.y + Math.sin(angleOut) * cpOffset },
    p2: { x: p3.x + Math.cos(angleIn) * cpOffset, y: p3.y + Math.sin(angleIn) * cpOffset },
    p3
  };
}
function edgePathControls(fromNode, toNode, routing, anchorOffsets, loopSide) {
  const baseAngle = Math.atan2(toNode.y - fromNode.y, toNode.x - fromNode.x);
  const off = anchorOffsets || { fromAngle: 0, toAngle: 0 };
  const angleOut = baseAngle + (off.fromAngle || 0);
  const angleIn = baseAngle + Math.PI + (off.toAngle || 0);
  const p0 = boundaryPointAtAngle(fromNode, angleOut);
  const p3 = boundaryPointAtAngle(toNode, angleIn);
  if (routing === "straight") {
    return { kind: "line", p0, p3 };
  }
  if (routing === "loopback" || isLoopbackEdge(fromNode, toNode, routing)) {
    return { kind: "cubic", ...loopbackControls(p0, p3, fromNode, toNode, loopSide) };
  }
  return { kind: "cubic", ...forwardControls(p0, p3, angleOut, angleIn) };
}
function buildEdgePath(fromNode, toNode, routing, anchorOffsets, loopSide) {
  const ctrl = edgePathControls(fromNode, toNode, routing, anchorOffsets, loopSide);
  if (ctrl.kind === "line") return `M ${ctrl.p0.x} ${ctrl.p0.y} L ${ctrl.p3.x} ${ctrl.p3.y}`;
  return `M ${ctrl.p0.x} ${ctrl.p0.y} C ${ctrl.p1.x} ${ctrl.p1.y}, ${ctrl.p2.x} ${ctrl.p2.y}, ${ctrl.p3.x} ${ctrl.p3.y}`;
}
function edgePathSamplePoints(fromNode, toNode, routing, anchorOffsets, loopSide) {
  const ctrl = edgePathControls(fromNode, toNode, routing, anchorOffsets, loopSide);
  if (ctrl.kind === "line") return [ctrl.p0, ctrl.p3];
  return sampleCubic(ctrl.p0, ctrl.p1, ctrl.p2, ctrl.p3);
}
function createPathElement(d, className) {
  const path = document.createElementNS(NS, "path");
  path.setAttribute("d", d);
  path.setAttribute("fill", "none");
  if (className) path.setAttribute("class", className);
  return path;
}
function pathPointAt(pathEl, t) {
  const len = pathEl.getTotalLength();
  const clamped = Math.max(0, Math.min(1, t));
  const pt = pathEl.getPointAtLength(clamped * len);
  const pt2 = pathEl.getPointAtLength(Math.min(len, clamped * len + 1));
  const angle = Math.atan2(pt2.y - pt.y, pt2.x - pt.x);
  return { x: pt.x, y: pt.y, angle, length: len };
}
function labelPosition(pathEl, position, offset, t) {
  const at2 = t != null ? t : 0.5;
  const len = pathEl.getTotalLength();
  const pt = pathEl.getPointAtLength(at2 * len);
  const pt2 = pathEl.getPointAtLength(Math.min(len, at2 * len + 1));
  const dx = pt2.x - pt.x;
  const dy = pt2.y - pt.y;
  const mag = Math.hypot(dx, dy) || 1;
  const nx = -dy / mag;
  const ny = dx / mag;
  let off = offset != null ? offset : 20;
  if (len < 70) off = Math.max(off, 26);
  else if (len < 120) off = Math.max(off, 22);
  switch (position) {
    case "below":
      return { x: pt.x - nx * off, y: pt.y - ny * off, angle: Math.atan2(dy, dx) };
    case "left":
      return { x: pt.x - dx / mag * off, y: pt.y - dy / mag * off, angle: Math.atan2(dy, dx) };
    case "right":
      return { x: pt.x + dx / mag * off, y: pt.y + dy / mag * off, angle: Math.atan2(dy, dx) };
    case "center":
      return { x: pt.x, y: pt.y, angle: Math.atan2(dy, dx) };
    case "above":
    default:
      return { x: pt.x + nx * off, y: pt.y + ny * off, angle: Math.atan2(dy, dx) };
  }
}
function pillChrome(node) {
  var _a;
  const top = (((_a = node.pillTop) == null ? void 0 : _a.length) || 0) > 0 ? 24 : 0;
  const bottom = estimateBottomPillHeight(node);
  return { top, bottom, left: 0, right: 0 };
}
function graphBounds(nodes, padding) {
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  nodes.forEach((n) => {
    const { hw, hh } = nodeBounds(n);
    const chrome = pillChrome(n);
    minX = Math.min(minX, n.x - hw - chrome.left);
    minY = Math.min(minY, n.y - hh - chrome.top);
    maxX = Math.max(maxX, n.x + hw + chrome.right);
    maxY = Math.max(maxY, n.y + hh + chrome.bottom);
  });
  const pad = padding || 40;
  return {
    x: minX - pad,
    y: minY - pad,
    width: maxX - minX + pad * 2,
    height: maxY - minY + pad * 2
  };
}
function graphBoundsWithEdges(nodes, edges, nodesById, padding) {
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  nodes.forEach((n) => {
    const { hw, hh } = nodeBounds(n);
    const chrome = pillChrome(n);
    minX = Math.min(minX, n.x - hw - chrome.left);
    minY = Math.min(minY, n.y - hh - chrome.top);
    maxX = Math.max(maxX, n.x + hw + chrome.right);
    maxY = Math.max(maxY, n.y + hh + chrome.bottom);
  });
  const anchorOffsets = computeEdgeAnchorOffsets(edges, nodesById);
  edges.forEach((edge) => {
    const fromNode = nodesById[edge.from];
    const toNode = nodesById[edge.to];
    if (!fromNode || !toNode) return;
    const pts = edgePathSamplePoints(fromNode, toNode, edge.routing, anchorOffsets[edge.id], edge.loopSide);
    pts.forEach((p2) => {
      minX = Math.min(minX, p2.x);
      minY = Math.min(minY, p2.y);
      maxX = Math.max(maxX, p2.x);
      maxY = Math.max(maxY, p2.y);
    });
  });
  const pad = padding || 40;
  if (!Number.isFinite(minX)) return graphBounds(nodes, padding);
  return {
    x: minX - pad,
    y: minY - pad,
    width: maxX - minX + pad * 2,
    height: maxY - minY + pad * 2
  };
}
function nodeShapePath(node) {
  const { w: w2, h } = node.size;
  const hw = w2 / 2;
  const hh = h / 2;
  const x2 = -hw;
  const y = -hh;
  if (node.shape === "circle") {
    return `M 0 ${-hw} A ${hw} ${hw} 0 1 1 0 ${hw} A ${hw} ${hw} 0 1 1 0 ${-hw} Z`;
  }
  const r = node.style.radius || 8;
  return `M ${x2 + r} ${y} H ${x2 + w2 - r} Q ${x2 + w2} ${y} ${x2 + w2} ${y + r} V ${y + h - r} Q ${x2 + w2} ${y + h} ${x2 + w2 - r} ${y + h} H ${x2 + r} Q ${x2} ${y + h} ${x2} ${y + h - r} V ${y + r} Q ${x2} ${y} ${x2 + r} ${y} Z`;
}

// src/viewport.js
function createViewport(svg, g, config, boundsRef) {
  const zoomCfg = config.zoom;
  function applyTransform(scale, tx, ty) {
    g.setAttribute("transform", `translate(${tx},${ty}) scale(${scale})`);
  }
  const state = { scale: 1, tx: 0, ty: 0 };
  function fit() {
    const rect = svg.getBoundingClientRect();
    const b = boundsRef;
    const bw = b.width;
    const bh = b.height;
    if (!rect.width || !rect.height || !bw || !bh) return;
    const sx = rect.width / bw;
    const sy = rect.height / bh;
    state.scale = Math.min(sx, sy, zoomCfg.max || 2.5);
    state.scale = Math.max(state.scale, zoomCfg.min || 0.4);
    state.tx = (rect.width - bw * state.scale) / 2 - b.x * state.scale;
    state.ty = (rect.height - bh * state.scale) / 2 - b.y * state.scale;
    applyTransform(state.scale, state.tx, state.ty);
  }
  function updateBounds(next) {
    Object.assign(boundsRef, next);
  }
  function resetZoom() {
    fit();
  }
  function screenToGraph(clientX, clientY) {
    const rect = svg.getBoundingClientRect();
    return {
      x: (clientX - rect.left - state.tx) / state.scale,
      y: (clientY - rect.top - state.ty) / state.scale
    };
  }
  if (zoomCfg.enabled !== false) {
    svg.addEventListener(
      "wheel",
      (e) => {
        if (zoomCfg.wheel === false) return;
        e.preventDefault();
        const delta = e.deltaY > 0 ? 0.9 : 1.1;
        const next = Math.min(zoomCfg.max || 2.5, Math.max(zoomCfg.min || 0.4, state.scale * delta));
        const rect = svg.getBoundingClientRect();
        const mx = e.clientX - rect.left;
        const my = e.clientY - rect.top;
        state.tx = mx - (mx - state.tx) / state.scale * next;
        state.ty = my - (my - state.ty) / state.scale * next;
        state.scale = next;
        applyTransform(state.scale, state.tx, state.ty);
      },
      { passive: false }
    );
    svg.addEventListener("mousedown", (e) => {
      var _a, _b;
      if (e.button !== 0) return;
      if ((_b = (_a = e.target).closest) == null ? void 0 : _b.call(_a, ".fg-node")) return;
      state.dragging = true;
      state.lastX = e.clientX;
      state.lastY = e.clientY;
      svg.classList.add("fg-dragging");
    });
    window.addEventListener("mousemove", (e) => {
      if (!state.dragging) return;
      state.tx += e.clientX - state.lastX;
      state.ty += e.clientY - state.lastY;
      state.lastX = e.clientX;
      state.lastY = e.clientY;
      applyTransform(state.scale, state.tx, state.ty);
    });
    window.addEventListener("mouseup", () => {
      if (!state.dragging) return;
      state.dragging = false;
      svg.classList.remove("fg-dragging");
    });
  }
  return {
    fit,
    resetZoom,
    updateBounds,
    screenToGraph,
    getTransform: () => ({ scale: state.scale, tx: state.tx, ty: state.ty })
  };
}

// src/render-edge.js
var NS2 = "http://www.w3.org/2000/svg";
function applyPathStroke(path, stroke, theme) {
  var _a;
  const color = stroke.color || theme.border;
  const width = (_a = stroke.width) != null ? _a : 2;
  path.style.setProperty("--fg-edge-color", color);
  path.style.setProperty("--fg-edge-width-custom", String(width));
  path.setAttribute("stroke", color);
  path.setAttribute("stroke-width", String(width));
}
function estimateLabelSize(text) {
  const len = (text || "").length;
  const charW = /[\d]/.test(text || "") ? 6.2 : 5.8;
  return { w: Math.max(52, len * charW + 20), h: 20 };
}
function createLabelGroup(text, labelCfg, theme) {
  const g = document.createElementNS(NS2, "g");
  g.setAttribute("class", "fg-edge-label-group");
  const { w: w2, h } = estimateLabelSize(text);
  const fill = labelCfg.background || labelCfg.fill || theme.pillSurface || "#FFFFFF";
  const color = labelCfg.color || theme.textMuted || "#57534E";
  const rect = document.createElementNS(NS2, "rect");
  rect.setAttribute("class", "fg-edge-label-bg");
  rect.setAttribute("x", String(-w2 / 2));
  rect.setAttribute("y", String(-h / 2));
  rect.setAttribute("width", String(w2));
  rect.setAttribute("height", String(h));
  rect.setAttribute("rx", String(h / 2));
  rect.setAttribute("fill", fill);
  const labelEl = document.createElementNS(NS2, "text");
  labelEl.setAttribute("class", "fg-edge-label");
  labelEl.setAttribute("text-anchor", "middle");
  labelEl.setAttribute("dominant-baseline", "middle");
  labelEl.setAttribute("fill", color);
  if (theme.font) labelEl.setAttribute("font-family", theme.font);
  labelEl.textContent = text;
  g.appendChild(rect);
  g.appendChild(labelEl);
  return { g, labelEl, rect, w: w2, h, labelCfg, baseText: text };
}
function renderEdges(edgesLayer, labelsLayer, edges, nodesById, theme) {
  const anchorOffsets = computeEdgeAnchorOffsets(edges, nodesById);
  const edgeViews = {};
  edges.forEach((edge) => {
    const fromNode = nodesById[edge.from];
    const toNode = nodesById[edge.to];
    if (!fromNode || !toNode) return;
    const off = anchorOffsets[edge.id] || { fromAngle: 0, toAngle: 0, labelT: 0.5 };
    const d = buildEdgePath(fromNode, toNode, edge.routing, off, edge.loopSide);
    const g = document.createElementNS(NS2, "g");
    g.setAttribute("class", "fg-edge");
    g.setAttribute("data-edge-id", edge.id);
    const path = createPathElement(d, "fg-edge-path");
    const stroke = edge.stroke || {};
    applyPathStroke(path, stroke, theme);
    path.setAttribute("stroke-linecap", "round");
    path.setAttribute("stroke-linejoin", "round");
    if (stroke.dash) path.setAttribute("stroke-dasharray", stroke.dash);
    if (edge.animated) g.classList.add("fg-edge-animated");
    g.appendChild(path);
    edgesLayer.appendChild(g);
    let labelGroup = null;
    if (edge.label && edge.label.text) {
      labelGroup = createLabelGroup(edge.label.text, edge.label, theme);
      labelsLayer.appendChild(labelGroup.g);
    }
    edgeViews[edge.id] = { g, path, labelGroup, edge, anchorOff: off };
  });
  function updateLabels() {
    Object.values(edgeViews).forEach(({ path, labelGroup, edge, anchorOff }) => {
      var _a;
      if (!labelGroup || !edge.label) return;
      const rawT = (_a = anchorOff == null ? void 0 : anchorOff.labelT) != null ? _a : 0.5;
      const t = Math.max(0.34, Math.min(0.66, rawT));
      const baseOff = edge.label.offset != null ? edge.label.offset : 20;
      const pos = labelPosition(path, edge.label.position, baseOff, t);
      labelGroup.g.setAttribute("transform", `translate(${pos.x},${pos.y})`);
    });
  }
  updateLabels();
  return {
    edgeViews,
    anchorOffsets,
    updateLabels,
    updatePaths(nodesById2) {
      const offsets = computeEdgeAnchorOffsets(
        Object.values(edgeViews).map((v2) => v2.edge),
        nodesById2
      );
      Object.values(edgeViews).forEach((view) => {
        const { path, edge } = view;
        const fromNode = nodesById2[edge.from];
        const toNode = nodesById2[edge.to];
        if (!fromNode || !toNode) return;
        const off = offsets[edge.id] || view.anchorOff;
        view.anchorOff = off;
        const d = buildEdgePath(fromNode, toNode, edge.routing, off, edge.loopSide);
        path.setAttribute("d", d);
      });
      updateLabels();
    },
    setActive(edgeId2, active, color) {
      var _a;
      const view = edgeViews[edgeId2];
      if (!view) return;
      view.g.classList.toggle("fg-edge-active", !!active);
      if (active && color) applyPathStroke(view.path, { color, width: (_a = view.edge.stroke) == null ? void 0 : _a.width }, theme);
      else applyPathStroke(view.path, view.edge.stroke || {}, theme);
    },
    setDimmed(edgeId2, dimmed) {
      const view = edgeViews[edgeId2];
      if (!view) return;
      view.path.classList.toggle("fg-edge-dimmed", !!dimmed);
    },
    getPath(edgeId2) {
      var _a;
      return ((_a = edgeViews[edgeId2]) == null ? void 0 : _a.path) || null;
    }
  };
}

// src/render-node.js
var NS3 = "http://www.w3.org/2000/svg";
var XHTML = "http://www.w3.org/1999/xhtml";
function renderPillEl(pill, slot) {
  const el = document.createElement("span");
  el.className = `fg-pill fg-pill-${slot} fg-pill-${pill.tone || "neutral"}`;
  if (pill.animated) el.classList.add("fg-pill-animated");
  if (pill.progress != null) {
    const bar = document.createElement("span");
    bar.className = "fg-pill-progress";
    const fill = document.createElement("span");
    fill.className = "fg-pill-progress-fill";
    fill.style.width = `${Math.round(Math.min(1, Math.max(0, pill.progress)) * 100)}%`;
    bar.appendChild(fill);
    el.appendChild(bar);
  }
  if (pill.icon && pill.icon !== "\xB7\xB7\xB7") {
    const ic = document.createElement("span");
    ic.className = "fg-pill-icon";
    ic.innerHTML = `<i data-lucide="${pill.icon}"></i>`;
    el.appendChild(ic);
  } else if (pill.icon === "\xB7\xB7\xB7") {
    const dots = document.createElement("span");
    dots.className = "fg-pill-dots";
    dots.innerHTML = "<i></i><i></i><i></i>";
    el.appendChild(dots);
  }
  if (pill.text) {
    const tx = document.createElement("span");
    tx.className = "fg-pill-text";
    tx.textContent = pill.text;
    el.appendChild(tx);
  }
  return el;
}
function buildNodeContent(node) {
  const { w: w2, h } = node.size;
  const chrome = pillChrome(node);
  const foW = w2 + chrome.left + chrome.right;
  const foH = h + chrome.top + chrome.bottom;
  const shell = document.createElement("div");
  shell.className = "fg-node-shell";
  shell.setAttribute("xmlns", XHTML);
  shell.style.width = `${foW}px`;
  shell.style.height = `${foH}px`;
  if (chrome.top) shell.style.setProperty("--fg-chrome-top", `${chrome.top}px`);
  if (chrome.bottom) shell.style.setProperty("--fg-chrome-bottom", `${chrome.bottom}px`);
  const topSlot = document.createElement("div");
  topSlot.className = "fg-node-slot fg-node-slot-top";
  (node.pillTop || []).forEach((p2) => topSlot.appendChild(renderPillEl(p2, "top")));
  shell.appendChild(topSlot);
  const core = document.createElement("div");
  core.className = "fg-node-core";
  core.style.width = `${w2}px`;
  core.style.height = `${h}px`;
  if (node.icon) {
    const ic = document.createElement("span");
    ic.className = "fg-node-icon";
    ic.innerHTML = `<i data-lucide="${node.icon}"></i>`;
    core.appendChild(ic);
  }
  if (node.label && node.shape !== "circle") {
    const lbl = document.createElement("span");
    lbl.className = "fg-node-label";
    lbl.textContent = node.label;
    core.appendChild(lbl);
  }
  shell.appendChild(core);
  const bottomSlot = document.createElement("div");
  bottomSlot.className = "fg-node-slot fg-node-slot-bottom fg-node-bottom-pills";
  shell.appendChild(bottomSlot);
  return { shell, bottomSlot };
}
function renderNodes(nodesLayer, nodes, theme) {
  const nodeViews = {};
  nodes.forEach((node) => {
    const g = document.createElementNS(NS3, "g");
    g.setAttribute("class", "fg-node");
    g.setAttribute("data-node-id", node.id);
    g.setAttribute("transform", `translate(${node.x},${node.y})`);
    if (node.tone) g.classList.add(`fg-tone-${node.tone}`);
    const shape = document.createElementNS(NS3, "path");
    shape.setAttribute("class", "fg-node-shape");
    shape.setAttribute("d", nodeShapePath(node));
    shape.setAttribute("fill", node.style.fill || "#fff");
    shape.setAttribute("stroke", node.style.stroke || theme.border);
    shape.setAttribute("stroke-width", String(node.style.strokeWidth || 1.5));
    shape.setAttribute("stroke-linejoin", "round");
    g.appendChild(shape);
    const { w: w2, h } = node.size;
    const chrome = pillChrome(node);
    const { shell, bottomSlot } = buildNodeContent(node);
    const fo = document.createElementNS(NS3, "foreignObject");
    fo.setAttribute("x", String(-w2 / 2 - chrome.left));
    fo.setAttribute("y", String(-h / 2 - chrome.top));
    fo.setAttribute("width", String(w2 + chrome.left + chrome.right));
    fo.setAttribute("height", String(h + chrome.top + chrome.bottom));
    fo.setAttribute("class", "fg-node-fo");
    fo.appendChild(shell);
    g.appendChild(fo);
    nodesLayer.appendChild(g);
    nodeViews[node.id] = { g, shape, fo, node, bottomSlot };
  });
  return {
    nodeViews,
    setPillsBottom(nodeId, pills) {
      const view = nodeViews[nodeId];
      if (!view) return;
      view.bottomSlot.innerHTML = "";
      (pills || []).forEach((p2) => view.bottomSlot.appendChild(renderPillEl(p2, "bottom")));
      if (typeof window !== "undefined" && window.lucide) {
        window.lucide.createIcons({ nodes: view.bottomSlot.querySelectorAll("[data-lucide]") });
      }
    },
    setEffect(nodeId, effect) {
      const view = nodeViews[nodeId];
      if (!view) return;
      view.g.classList.remove("fg-effect-pulse", "fg-effect-blink", "fg-effect-processing", "fg-effect-waiting", "fg-effect-active");
      if (effect) view.g.classList.add(`fg-effect-${effect}`);
    },
    setActive(nodeId, active) {
      const view = nodeViews[nodeId];
      if (!view) return;
      view.g.classList.toggle("fg-node-active", !!active);
    },
    setSelected(nodeId, selected) {
      const view = nodeViews[nodeId];
      if (!view) return;
      view.g.classList.toggle("fg-node-selected", !!selected);
    },
    setPosition(nodeId, x2, y) {
      const view = nodeViews[nodeId];
      if (!view) return;
      view.node.x = x2;
      view.node.y = y;
      view.g.setAttribute("transform", `translate(${x2},${y})`);
    },
    refreshIcons() {
      if (typeof window !== "undefined" && window.lucide) {
        window.lucide.createIcons({ nodes: nodesLayer.querySelectorAll("[data-lucide]") });
      }
    }
  };
}

// src/particles.js
var NS4 = "http://www.w3.org/2000/svg";
var nextTokenId = 1;
function applyTokenColor(shapeEl, tokenCfg) {
  const color = tokenCfg.color || "#7C3AED";
  shapeEl.setAttribute("fill", color);
}
function createTokenShape(tokenCfg) {
  const shape = tokenCfg.shape || "circle";
  const size = tokenCfg.size || 7;
  const g = document.createElementNS(NS4, "g");
  g.setAttribute("class", "fg-token");
  const inner = document.createElementNS(NS4, "g");
  inner.setAttribute("class", "fg-token-inner");
  if (tokenCfg.effect) inner.classList.add(`fg-token-${tokenCfg.effect}`);
  let shapeEl;
  if (shape === "rect" || shape === "roundedRect") {
    shapeEl = document.createElementNS(NS4, "rect");
    const s = size * 2;
    shapeEl.setAttribute("class", "fg-token-shape");
    shapeEl.setAttribute("x", String(-size));
    shapeEl.setAttribute("y", String(-size));
    shapeEl.setAttribute("width", String(s));
    shapeEl.setAttribute("height", String(s));
    if (shape === "roundedRect") shapeEl.setAttribute("rx", String(size * 0.35));
  } else {
    shapeEl = document.createElementNS(NS4, "circle");
    shapeEl.setAttribute("class", "fg-token-shape");
    shapeEl.setAttribute("r", String(size));
  }
  applyTokenColor(shapeEl, tokenCfg);
  inner.appendChild(shapeEl);
  g.appendChild(inner);
  g._fgInner = inner;
  g._fgShape = shapeEl;
  return g;
}
function updateTokenElement(el, tokenCfg) {
  const inner = el._fgInner || el.querySelector(".fg-token-inner");
  const shapeEl = el._fgShape || el.querySelector(".fg-token-shape");
  if (!inner || !shapeEl) return;
  inner.className.baseVal = "fg-token-inner";
  if (tokenCfg.effect) inner.classList.add(`fg-token-${tokenCfg.effect}`);
  applyTokenColor(shapeEl, tokenCfg);
}
function placeTokenAt(token, t) {
  const pt = pathPointAt(token.path, t);
  token.el.setAttribute("transform", `translate(${pt.x},${pt.y}) rotate(${pt.angle * 180 / Math.PI})`);
}
var ParticleSystem = class {
  constructor(layer, edgeRenderer, config) {
    this.layer = layer;
    this.edgeRenderer = edgeRenderer;
    this.config = config;
    this.pool = [];
    this.active = [];
    this.maxParticles = config.maxParticles || 200;
  }
  spawn(options) {
    const { edgeId: edgeId2, tokenCfg, onArrive, delay = 0 } = options;
    if (this.active.length >= this.maxParticles) return null;
    const path = this.edgeRenderer.getPath(edgeId2);
    if (!path) return null;
    const id = nextTokenId++;
    const el = this._acquireElement(tokenCfg);
    el.setAttribute("data-token-id", String(id));
    el.style.opacity = "0";
    this.layer.appendChild(el);
    const token = {
      id,
      edgeId: edgeId2,
      el,
      tokenCfg: { ...this.config.tokenDefault, ...tokenCfg },
      progress: 0,
      delay,
      delayLeft: delay,
      onArrive,
      onSpawn: options.onSpawn || null,
      path,
      done: false,
      speed: tokenCfg && tokenCfg.speed || this.config.tokenDefault.speed || 120
    };
    placeTokenAt(token, 0);
    if (token.onSpawn) token.onSpawn(token);
    this.active.push(token);
    this.edgeRenderer.setActive(edgeId2, true, token.tokenCfg.color);
    return token;
  }
  _acquireElement(tokenCfg) {
    const cfg = { ...this.config.tokenDefault, ...tokenCfg };
    if (this.pool.length) {
      const el = this.pool.pop();
      el.className.baseVal = "fg-token";
      updateTokenElement(el, cfg);
      return el;
    }
    return createTokenShape(cfg);
  }
  _release(token) {
    token.el.remove();
    token.el.className.baseVal = "fg-token";
    this.pool.push(token.el);
  }
  update(dt2) {
    const edgeCounts = {};
    const toRemove = [];
    this.active.forEach((token) => {
      if (token.delayLeft > 0) {
        token.delayLeft -= dt2;
        return;
      }
      token.el.style.opacity = "1";
      const pathLen = token.path.getTotalLength() || 1;
      const dist = token.speed * (dt2 / 1e3);
      token.progress += dist / pathLen;
      if (token.progress >= 1) {
        token.progress = 1;
        token.done = true;
        toRemove.push(token);
        if (token.onArrive) token.onArrive(token);
      }
      placeTokenAt(token, token.progress);
      edgeCounts[token.edgeId] = (edgeCounts[token.edgeId] || 0) + 1;
    });
    toRemove.forEach((token) => {
      const idx = this.active.indexOf(token);
      if (idx >= 0) this.active.splice(idx, 1);
      this._release(token);
    });
    Object.keys(this.edgeRenderer.edgeViews || {}).forEach((edgeId2) => {
      if (!edgeCounts[edgeId2]) {
        this.edgeRenderer.setActive(edgeId2, false);
      }
    });
  }
  clear() {
    this.active.slice().forEach((t) => this._release(t));
    this.active = [];
    Object.keys(this.edgeRenderer.edgeViews || {}).forEach((edgeId2) => {
      this.edgeRenderer.setActive(edgeId2, false);
    });
  }
  countOnEdge(edgeId2) {
    return this.active.filter((t) => t.edgeId === edgeId2).length;
  }
};
function spawnBurst(particles, edgeId2, burst, tokenCfg, onArrive, onSpawn) {
  const count = (burst == null ? void 0 : burst.count) || 1;
  const spacing = (burst == null ? void 0 : burst.spacing) || 60;
  for (let i = 0; i < count; i++) {
    particles.spawn({
      edgeId: edgeId2,
      tokenCfg,
      onArrive,
      onSpawn,
      delay: i * spacing
    });
  }
}

// src/randomness.js
function applyJitter(base, jitter, enabled) {
  if (!enabled || !jitter) return base;
  const factor = 1 + (Math.random() * 2 - 1) * jitter;
  return Math.max(1, Math.round(base * factor));
}
function percentile(sorted, p2) {
  if (!sorted.length) return 0;
  const idx = Math.ceil(p2 / 100 * sorted.length) - 1;
  return sorted[Math.max(0, idx)];
}

// src/simulation.js
init_compose_pills();
init_admission();
var SimulationEngine = class {
  constructor(config, hooks) {
    this.config = config;
    this.hooks = hooks;
    this.running = false;
    this.nodeState = {};
    this.sourceTimers = {};
    this.processTimers = {};
    this.roundRobinIdx = {};
    this.tokenStarted = {};
    this.rtStart = null;
    this._initState();
  }
  _initState() {
    this.config.nodes.forEach((n) => {
      this.nodeState[n.id] = {
        buffer: 0,
        bufferByEdge: {},
        processing: false,
        waiting: false,
        flushing: false,
        fill: 0,
        slots: 0,
        retries: 0,
        rejects: 0,
        received: 0,
        waitSince: null,
        circuitState: n.circuit ? "closed" : null,
        failures: 0,
        openSince: null
      };
      this.roundRobinIdx[n.id] = 0;
    });
    this.rtStart = null;
  }
  _emit(event, payload) {
    if (this.hooks.onEvent) this.hooks.onEvent(event, payload);
  }
  _refreshPills(nodeId) {
    var _a, _b;
    if (!this.hooks.onPills) return;
    const node = this.config.nodesById[nodeId];
    const state = this.nodeState[nodeId];
    if (!node || !state) return;
    const metricsSlice = ((_b = (_a = this.hooks).getNodeMetrics) == null ? void 0 : _b.call(_a, nodeId)) || { rejects: state.rejects };
    this.hooks.onPills(nodeId, buildPillsBottom(node, state, metricsSlice));
  }
  _jitterDuration(ms) {
    var _a;
    const r = this.config.randomness;
    return applyJitter(ms, (_a = r.duration) == null ? void 0 : _a.jitter, r.enabled);
  }
  start() {
    if (this.running) return;
    this.running = true;
    this._emit("sim:start", {});
    this.config.sources.forEach((src) => {
      if (src.enabled === false) return;
      const kick = () => {
        this._fireSource(src);
        this._scheduleSource(src);
      };
      if (src.delay > 0) {
        this.sourceTimers[`${src.id}-delay`] = setTimeout(kick, src.delay);
      } else {
        kick();
      }
    });
  }
  pause() {
    this.running = false;
    Object.values(this.sourceTimers).forEach(clearTimeout);
    Object.values(this.processTimers).forEach(clearTimeout);
    this.sourceTimers = {};
    this.processTimers = {};
    this._emit("sim:pause", {});
  }
  reset() {
    this.pause();
    this._initState();
    if (this.hooks.onReset) this.hooks.onReset();
    this._emit("sim:reset", {});
  }
  patchNode(nodeId, node) {
    if (!this.config.nodesById[nodeId]) return;
    this.config.nodesById[nodeId] = node;
  }
  _evaluateCircuit(node, state) {
    var _a, _b, _c;
    const c = node.circuit;
    if (!c) return;
    const rate = (_a = c.failureRate) != null ? _a : 0.25;
    const threshold = (_b = c.failureThreshold) != null ? _b : 5;
    const recoveryMs = (_c = c.recoveryMs) != null ? _c : 8e3;
    const now = Date.now();
    if (state.circuitState === "open" && state.openSince && now - state.openSince >= recoveryMs) {
      state.circuitState = "half-open";
    }
    if (state.circuitState === "open") {
      this._refreshPills(node.id);
      return;
    }
    const failed = Math.random() < rate;
    if (failed) {
      state.failures += 1;
      if (this.hooks.onMetrics) this.hooks.onMetrics("reject", { nodeId: node.id });
      if (state.failures >= threshold) {
        state.circuitState = "open";
        state.openSince = now;
      }
    } else {
      state.failures = 0;
      if (state.circuitState === "half-open") state.circuitState = "closed";
    }
    this._refreshPills(node.id);
  }
  _scheduleSource(src) {
    if (!this.running) return;
    const jitter = src.jitter ? (Math.random() * 2 - 1) * src.jitter * src.interval : 0;
    const delay = Math.max(50, src.interval + jitter);
    this.sourceTimers[src.id] = setTimeout(() => {
      this._fireSource(src);
      this._scheduleSource(src);
    }, delay);
  }
  _fireSource(src) {
    if (!this.running) return;
    if (!this.rtStart) this.rtStart = Date.now();
    this._emit("token:spawn", { sourceId: src.id, edgeId: src.edgeId });
    if (this.hooks.spawnOnEdge) {
      this.hooks.spawnOnEdge(src.edgeId, src.token, src.burst, (token) => {
        this._handleArrive(src.edgeId, token);
      });
    }
  }
  emit(edgeId2, tokenCfg) {
    if (!this.hooks.spawnOnEdge) return;
    const edge = this.config.edgesById[edgeId2];
    if (!edge) return;
    this._emit("token:spawn", { edgeId: edgeId2, manual: true });
    const token = { ...this.config.tokenDefault, ...tokenCfg };
    this.hooks.spawnOnEdge(edgeId2, token, { count: 1, spacing: 0 }, (t) => {
      this._handleArrive(edgeId2, t);
    });
  }
  noteTokenSpawn(tokenId, edgeId2) {
    this.tokenStarted[tokenId] = Date.now();
  }
  _handleArrive(inEdgeId, token) {
    const edge = this.config.edgesById[inEdgeId];
    if (!edge) return;
    const nodeId = edge.to;
    const node = this.config.nodesById[nodeId];
    if (!node) return;
    if (this.tokenStarted[token == null ? void 0 : token.id]) delete this.tokenStarted[token == null ? void 0 : token.id];
    const state = this.nodeState[nodeId];
    if (this.hooks.onMetrics) this.hooks.onMetrics("arrive", { nodeId });
    if (node.type === "port") {
      this._handlePort(node, state, token, inEdgeId);
      return;
    }
    const result = tryAdmit(node, state, inEdgeId);
    if (result.overflow) {
      this._overflow(node, state, token, inEdgeId);
      return;
    }
    if (result.accumulating) {
      this._emit("token:arrive", { nodeId, tokenId: token == null ? void 0 : token.id, edgeId: inEdgeId, accumulating: true });
      this._refreshPills(nodeId);
      return;
    }
    if (result.slots != null && this.hooks.onMetrics) {
      this.hooks.onMetrics("queue", { nodeId, depth: result.slots });
    }
    this._emit("token:arrive", { nodeId, tokenId: token == null ? void 0 : token.id, edgeId: inEdgeId });
    this._refreshPills(nodeId);
    if (state.processing) return;
    if (this._gateSatisfied(node, state)) {
      state.waiting = false;
      this._startProcess(node, state);
    } else {
      state.waiting = true;
      if (this.hooks.onNodeWaiting) this.hooks.onNodeWaiting(nodeId);
      this._refreshPills(nodeId);
    }
  }
  _handlePort(node, state, token, inEdgeId) {
    this._emit("token:arrive", { nodeId: node.id, tokenId: token == null ? void 0 : token.id, edgeId: inEdgeId });
    state.received += 1;
    if (this.hooks.onMetrics) this.hooks.onMetrics("sink", { nodeId: node.id });
    if (node.showReceived) this._refreshPills(node.id);
    if (node.role === "terminal" && this.rtStart) {
      const rt2 = Date.now() - this.rtStart;
      this._emit("flow:complete", { nodeId: node.id, rtMs: rt2 });
      if (this.hooks.onMetrics) this.hooks.onMetrics("flowComplete", { rtMs: rt2 });
      this.rtStart = null;
    }
  }
  _overflow(node, state, token, inEdgeId) {
    var _a;
    state.rejects += 1;
    const rejectId = (_a = node.admission) == null ? void 0 : _a.rejectEdge;
    if (rejectId) {
      this._spawnReject(node, token, rejectId);
    } else {
      this._emit("token:drop", { nodeId: node.id, edgeId: inEdgeId, reason: "queue-full" });
    }
    if (this.hooks.onMetrics) this.hooks.onMetrics("reject", { nodeId: node.id });
    this._refreshPills(node.id);
  }
  _spawnReject(node, token, rejectEdgeId) {
    if (!rejectEdgeId || !this.hooks.spawnOnEdge) return;
    const edge = this.config.edgesById[rejectEdgeId];
    const tokenCfg = resolveTokenConfig(this.config, node, edge);
    this._emit("token:reject", { nodeId: node.id, edgeId: rejectEdgeId });
    this.hooks.spawnOnEdge(rejectEdgeId, tokenCfg, { count: 1, spacing: 0 }, (t) => {
      this._handleArrive(rejectEdgeId, t);
    });
  }
  _gateEdges(node) {
    const gate = node.gate || { count: 1, from: "any" };
    const incoming = this.config.incoming[node.id] || [];
    if (Array.isArray(gate.from)) {
      return incoming.filter((e) => gate.from.includes(e.id));
    }
    if (gate.from === "all-edges") {
      return incoming.filter((e) => e.routing !== "loopback");
    }
    return incoming;
  }
  _gateSatisfied(node, state) {
    const gate = node.gate || { count: 1, from: "any" };
    const need = gate.count || 1;
    if (gate.from === "all-edges" || Array.isArray(gate.from)) {
      const inc = this._gateEdges(node);
      return inc.length > 0 && inc.every((e) => (state.bufferByEdge[e.id] || 0) >= need);
    }
    return state.buffer >= need;
  }
  _consumeGate(node, state) {
    const gate = node.gate || { count: 1, from: "any" };
    const need = gate.count || 1;
    if (gate.from === "all-edges" || Array.isArray(gate.from)) {
      this._gateEdges(node).forEach((e) => {
        state.bufferByEdge[e.id] = Math.max(0, (state.bufferByEdge[e.id] || 0) - need);
      });
    } else {
      state.buffer = Math.max(0, state.buffer - need);
    }
  }
  _startProcess(node, state) {
    state.processing = true;
    state.waiting = false;
    state.waitSince = state.waitSince || Date.now();
    this._consumeGate(node, state);
    const duration = this._jitterDuration(node.duration || 800);
    const isFast = duration < 400;
    const effect = isFast ? "active" : "processing";
    this._emit("node:process:start", { nodeId: node.id, effect });
    if (this.hooks.onNodeProcessStart) this.hooks.onNodeProcessStart(node.id, effect);
    this._refreshPills(node.id);
    if (this.hooks.onMetrics) {
      this.hooks.onMetrics("processStart", { nodeId: node.id, waitMs: state.waitSince ? Date.now() - state.waitSince : 0 });
    }
    const t0 = Date.now();
    this.processTimers[node.id] = setTimeout(() => {
      var _a;
      state.processing = false;
      state.waitSince = null;
      const processMs = Date.now() - t0;
      if (((_a = node.admission) == null ? void 0 : _a.mode) === "slot") releaseSlot(state);
      state.flushing = false;
      this._emit("node:process:end", { nodeId: node.id });
      if (this.hooks.onNodeProcessEnd) this.hooks.onNodeProcessEnd(node.id);
      if (this.hooks.onMetrics) this.hooks.onMetrics("processEnd", { nodeId: node.id, processMs });
      this._refreshPills(node.id);
      if (hasCircuit(node)) this._evaluateCircuit(node, state);
      this._emitFromNode(node);
      if (this._gateSatisfied(node, state)) {
        this._startProcess(node, state);
      } else if (state.buffer > 0 || Object.values(state.bufferByEdge).some((n) => n > 0)) {
        state.waiting = true;
        this._refreshPills(node.id);
      }
    }, duration);
  }
  _emitFromNode(node) {
    const out = this._resolveOutgoing(node);
    if (!out.length) return;
    this._emit("node:emit", { nodeId: node.id });
    if (this.hooks.onMetrics) this.hooks.onMetrics("emit", { nodeId: node.id });
    const emitCfg = node.emit || { mode: "all", count: 1 };
    if (emitCfg.mode === "weighted") {
      const picked = this._pickWeighted(out);
      if (picked) this._spawnOnEdge(picked, 1, node);
      return;
    }
    if (emitCfg.mode === "round-robin") {
      const idx = this.roundRobinIdx[node.id] % out.length;
      this.roundRobinIdx[node.id] += 1;
      this._spawnOnEdge(out[idx], emitCfg.count || 1, node);
      return;
    }
    if (emitCfg.mode === "map" && emitCfg.map) {
      Object.keys(emitCfg.map).forEach((edgeId2) => {
        const e = this.config.edgesById[edgeId2];
        if (e) this._spawnOnEdge(e, emitCfg.map[edgeId2], node);
      });
      return;
    }
    out.forEach((e) => this._spawnOnEdge(e, emitCfg.count || 1, node));
  }
  _resolveOutgoing(node) {
    var _a, _b;
    let out = [...this.config.outgoing[node.id] || []];
    const emitCfg = node.emit || {};
    const rejectId = (_a = node.admission) == null ? void 0 : _a.rejectEdge;
    if (emitCfg.mode === "excludeReject" && rejectId) {
      out = out.filter((e) => e.id !== rejectId);
    }
    if (emitCfg.mode === "map" && emitCfg.map) {
      out = out.filter((e) => emitCfg.map[e.id] != null);
    }
    if (hasCircuit(node)) {
      const c = node.circuit;
      const st2 = ((_b = this.nodeState[node.id]) == null ? void 0 : _b.circuitState) || "closed";
      if (st2 === "open" && c.fallbackEdge) {
        const fb = this.config.edgesById[c.fallbackEdge];
        return fb ? [fb] : out;
      }
      if (c.acceptEdge) {
        const acc = this.config.edgesById[c.acceptEdge];
        return acc ? [acc] : out;
      }
    }
    if (hasRetry(node)) {
      const be = this.config.edgesById[node.retry.backEdge];
      const st2 = this.nodeState[node.id];
      if (st2 && st2.retries < (node.retry.maxRetries || 3) && be) {
        st2.retries += 1;
        this._refreshPills(node.id);
        return [be];
      }
    }
    return out;
  }
  _pickWeighted(edges) {
    const weights = edges.map((e) => {
      var _a;
      return (_a = e.weight) != null ? _a : 1;
    });
    const total = weights.reduce((a, b) => a + b, 0);
    let r = Math.random() * total;
    for (let i = 0; i < edges.length; i++) {
      r -= weights[i];
      if (r <= 0) return edges[i];
    }
    return edges[edges.length - 1];
  }
  _spawnOnEdge(edge, count, fromNode) {
    const n = count != null ? count : 1;
    for (let i = 0; i < n; i++) {
      if (!this.hooks.spawnOnEdge) continue;
      const tokenCfg = resolveTokenConfig(this.config, fromNode, edge);
      if (edge.speed) tokenCfg.speed = edge.speed;
      this.hooks.spawnOnEdge(
        edge.id,
        tokenCfg,
        { count: 1, spacing: i * 50 },
        (token) => this._handleArrive(edge.id, token)
      );
    }
  }
};

// src/metrics.js
var MetricsStore = class {
  constructor(config) {
    var _a, _b;
    this.windowSec = (_b = (_a = config.metrics) == null ? void 0 : _a.windowSec) != null ? _b : 30;
    this.nodes = {};
    this.system = { rtSamples: [], throughput: [], rejects: 0, completed: 0, lastRt: null };
    config.nodes.forEach((n) => {
      this.nodes[n.id] = {
        tokensIn: 0,
        tokensOut: 0,
        rejects: 0,
        received: 0,
        processTimes: [],
        waitTimes: [],
        emitSamples: [],
        arriveSamples: [],
        rejectSamples: [],
        state: "idle",
        queueDepth: 0
      };
    });
  }
  _trim(arr) {
    const cutoff = Date.now() - this.windowSec * 1e3;
    return arr.filter((x2) => x2.t >= cutoff);
  }
  recordArrive(nodeId) {
    const m = this.nodes[nodeId];
    if (m) {
      m.tokensIn += 1;
      m.queueDepth += 1;
      m.arriveSamples.push({ t: Date.now(), v: 1 });
      m.arriveSamples = this._trim(m.arriveSamples);
    }
  }
  recordProcessStart(nodeId, waitMs) {
    const m = this.nodes[nodeId];
    if (!m) return;
    m.state = "processing";
    if (waitMs) {
      m.waitTimes.push({ t: Date.now(), v: waitMs });
      m.waitTimes = this._trim(m.waitTimes);
    }
  }
  recordProcessEnd(nodeId, processMs) {
    const m = this.nodes[nodeId];
    if (!m) return;
    m.state = "idle";
    m.queueDepth = Math.max(0, m.queueDepth - 1);
    if (processMs) {
      m.processTimes.push({ t: Date.now(), v: processMs });
      m.processTimes = this._trim(m.processTimes);
    }
  }
  recordEmit(nodeId, count = 1) {
    const m = this.nodes[nodeId];
    if (!m) return;
    m.tokensOut += count;
    m.emitSamples.push({ t: Date.now(), v: count });
    m.emitSamples = this._trim(m.emitSamples);
  }
  recordReject(nodeId) {
    const m = this.nodes[nodeId];
    if (m) {
      m.rejects += 1;
      m.rejectSamples.push({ t: Date.now(), v: 1 });
      m.rejectSamples = this._trim(m.rejectSamples);
    }
    this.system.rejects += 1;
  }
  recordSink(nodeId) {
    const m = this.nodes[nodeId];
    if (m) {
      m.received += 1;
      m.tokensOut += 1;
      m.queueDepth = Math.max(0, m.queueDepth - 1);
    }
  }
  recordFlowComplete(rtMs) {
    this.system.lastRt = rtMs;
    this.system.completed += 1;
    this.system.rtSamples.push({ t: Date.now(), v: rtMs });
    this.system.rtSamples = this._trim(this.system.rtSamples);
    this.system.throughput.push({ t: Date.now(), v: 1 });
    this.system.throughput = this._trim(this.system.throughput);
  }
  setState(nodeId, state) {
    if (this.nodes[nodeId]) this.nodes[nodeId].state = state;
  }
  setQueueDepth(nodeId, depth) {
    if (this.nodes[nodeId]) this.nodes[nodeId].queueDepth = depth;
  }
  nodeStats(nodeId) {
    const m = this.nodes[nodeId];
    if (!m) return null;
    const proc = m.processTimes.map((x2) => x2.v).sort((a, b) => a - b);
    const wait = m.waitTimes.map((x2) => x2.v).sort((a, b) => a - b);
    return {
      ...m,
      p50Process: percentile(proc, 50),
      p90Process: percentile(proc, 90),
      p99Process: percentile(proc, 99),
      p50Wait: percentile(wait, 50)
    };
  }
  systemStats() {
    const rts = this.system.rtSamples.map((x2) => x2.v).sort((a, b) => a - b);
    const span = this.windowSec || 30;
    const tp = this.system.throughput.length / span;
    return {
      lastRt: this.system.lastRt,
      completed: this.system.completed,
      rejects: this.system.rejects,
      throughput: Math.round(tp * 10) / 10,
      p50Rt: percentile(rts, 50),
      p90Rt: percentile(rts, 90),
      p99Rt: percentile(rts, 99)
    };
  }
};

// src/ui/canvas-bg.js
function applyCanvasBackground(root, viewport, theme) {
  var _a, _b;
  const bg = (viewport == null ? void 0 : viewport.background) || {};
  const color = bg.color || theme.background || "#FAFAF8";
  const pattern = bg.pattern || "none";
  const patternColor = bg.patternColor || "#E8E4DC";
  const size = (_a = bg.patternSize) != null ? _a : 20;
  const opacity = (_b = bg.patternOpacity) != null ? _b : 0.55;
  root.style.setProperty("--fg-canvas-bg", color);
  root.style.setProperty("--fg-canvas-pattern-color", patternColor);
  root.style.setProperty("--fg-canvas-pattern-size", `${size}px`);
  root.style.setProperty("--fg-canvas-pattern-opacity", String(opacity));
  root.classList.remove("fg-canvas-dots", "fg-canvas-grid", "fg-canvas-cross");
  if (pattern && pattern !== "none") {
    root.classList.add(`fg-canvas-${pattern}`);
  }
}

// src/ui/icons.js
var FALLBACK = {
  play: '<svg viewBox="0 0 24 24" fill="currentColor" stroke="none"><path d="M8 5v14l11-7z"/></svg>',
  pause: '<svg viewBox="0 0 24 24" fill="currentColor" stroke="none"><path d="M6 5h4v14H6zm8 0h4v14h-4z"/></svg>',
  "maximize-2": '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7"/></svg>',
  crosshair: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M12 2v4M12 18v4M2 12h4M18 12h4"/></svg>',
  activity: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg>',
  "rotate-ccw": '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 12a9 9 0 1 0 3-6.7M3 3v6h6"/></svg>',
  "layout-grid": '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>',
  x: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 6 6 18M6 6l12 12"/></svg>',
  "circle-x": '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="m15 9-6 6M9 9l6 6"/></svg>'
};
function iconMarkup(name) {
  if (typeof window !== "undefined" && window.lucide) {
    return `<i data-lucide="${name}" aria-hidden="true"></i>`;
  }
  return FALLBACK[name] || `<span>${name}</span>`;
}
function hydrateIcons(container) {
  if (!container || typeof window === "undefined" || !window.lucide) return;
  window.lucide.createIcons({ nodes: container.querySelectorAll("[data-lucide]") });
}

// src/ui/controls.js
function makeBtn(className, label, iconName) {
  const btn = document.createElement("button");
  btn.type = "button";
  btn.className = className;
  btn.setAttribute("aria-label", label);
  btn.innerHTML = iconMarkup(iconName);
  return btn;
}
function createChrome(root, instance, config) {
  var _a, _b, _c, _d;
  const chrome = document.createElement("div");
  chrome.className = "fg-chrome";
  const ctrls = config.controls || {};
  if (config.title && ctrls.title !== false) {
    const header = document.createElement("div");
    header.className = "fg-chrome-header";
    const title = document.createElement("h2");
    title.className = "fg-title";
    title.textContent = config.title;
    header.appendChild(title);
    chrome.appendChild(header);
  }
  const showToolbar = ctrls.toolbar !== false && (ctrls.playPause !== false || ctrls.zoomReset !== false || ctrls.reset !== false || ctrls.layout || ctrls.metricsDrawer !== false && ((_a = config.metrics) == null ? void 0 : _a.globalDrawer) !== false && ((_b = config.metrics) == null ? void 0 : _b.systemPanel) !== false);
  if (!showToolbar && !chrome.childElementCount) {
    instance._chrome = null;
    return null;
  }
  if (!showToolbar) {
    instance._chrome = chrome;
    root.appendChild(chrome);
    return chrome;
  }
  const bar = document.createElement("div");
  bar.className = "fg-controls";
  bar.setAttribute("role", "toolbar");
  bar.setAttribute("aria-label", "Controles do diagrama");
  const cluster = document.createElement("div");
  cluster.className = "fg-controls-cluster";
  cluster.addEventListener("mousedown", (e) => e.stopPropagation());
  cluster.addEventListener("pointerdown", (e) => e.stopPropagation());
  if (ctrls.playPause !== false) {
    const playBtn = makeBtn("fg-btn", "Play ou pausar simula\xE7\xE3o", "pause");
    playBtn.setAttribute("aria-pressed", "true");
    playBtn.dataset.iconPlay = "play";
    playBtn.dataset.iconPause = "pause";
    playBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      if (instance.running) instance.pause();
      else instance.start();
    });
    cluster.appendChild(playBtn);
    instance._playBtn = playBtn;
  }
  if (ctrls.zoomReset !== false) {
    const fitBtn = makeBtn("fg-btn", "Centralizar diagrama", "crosshair");
    fitBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      instance.fit();
    });
    cluster.appendChild(fitBtn);
  }
  const metricsOn = ctrls.metricsDrawer !== false && ((_c = config.metrics) == null ? void 0 : _c.globalDrawer) !== false && ((_d = config.metrics) == null ? void 0 : _d.systemPanel) !== false;
  if (metricsOn) {
    const metricsBtn = makeBtn("fg-btn", "M\xE9tricas globais", "activity");
    metricsBtn.setAttribute("aria-pressed", "false");
    metricsBtn.addEventListener("click", (e) => {
      var _a2;
      e.preventDefault();
      e.stopPropagation();
      (_a2 = instance.toggleGlobalDrawer) == null ? void 0 : _a2.call(instance);
    });
    cluster.appendChild(metricsBtn);
    instance._metricsBtn = metricsBtn;
  }
  if (ctrls.layout) {
    const layoutBtn = makeBtn("fg-btn", "Auto-layout", "layout-grid");
    layoutBtn.addEventListener("click", (e) => {
      var _a2;
      e.stopPropagation();
      (_a2 = instance.applyAutoLayout) == null ? void 0 : _a2.call(instance);
    });
    cluster.appendChild(layoutBtn);
  }
  if (ctrls.reset !== false) {
    const resetBtn = makeBtn("fg-btn", "Reiniciar simula\xE7\xE3o", "rotate-ccw");
    resetBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      instance.reset();
    });
    cluster.appendChild(resetBtn);
  }
  bar.appendChild(cluster);
  chrome.appendChild(bar);
  root.appendChild(chrome);
  instance._chrome = chrome;
  hydrateIcons(chrome);
  return chrome;
}
function updatePlayButton(instance) {
  if (!instance._playBtn) return;
  const running = instance.running;
  const icon = running ? instance._playBtn.dataset.iconPause : instance._playBtn.dataset.iconPlay;
  instance._playBtn.innerHTML = iconMarkup(icon);
  hydrateIcons(instance._playBtn);
  instance._playBtn.setAttribute("aria-pressed", running ? "true" : "false");
  instance._playBtn.setAttribute("aria-label", running ? "Pausar simula\xE7\xE3o" : "Iniciar simula\xE7\xE3o");
}
function syncGlobalMetricsButton(instance) {
  var _a, _b;
  if (!instance._metricsBtn) return;
  const open = (_b = (_a = instance._globalDrawer) == null ? void 0 : _a.isOpen()) != null ? _b : false;
  instance._metricsBtn.setAttribute("aria-pressed", open ? "true" : "false");
}
function syncChromePinned(instance) {
  var _a, _b, _c, _d, _e2;
  const pinned = ((_b = (_a = instance._globalDrawer) == null ? void 0 : _a.isOpen()) != null ? _b : false) || ((_d = (_c = instance._nodeDrawer) == null ? void 0 : _c.isOpen()) != null ? _d : false);
  (_e2 = instance.root) == null ? void 0 : _e2.classList.toggle("fg-chrome-pinned", pinned);
}

// src/interaction/drag.js
var THRESHOLD = 4;
function attachNodeDrag(instance) {
  var _a;
  if (((_a = instance.config.interaction) == null ? void 0 : _a.nodeDrag) === false) return;
  instance.config.nodes.forEach((node) => {
    var _a2;
    const g = (_a2 = instance.nodeRenderer.nodeViews[node.id]) == null ? void 0 : _a2.g;
    if (!g) return;
    let dragging = null;
    g.addEventListener("mousedown", (e) => {
      if (e.button !== 0) return;
      e.stopPropagation();
      dragging = {
        id: node.id,
        sx: e.clientX,
        sy: e.clientY,
        ox: node.x,
        oy: node.y,
        moved: false
      };
    });
    const onMove = (e) => {
      if (!dragging || dragging.id !== node.id) return;
      const dx = e.clientX - dragging.sx;
      const dy = e.clientY - dragging.sy;
      if (!dragging.moved && Math.hypot(dx, dy) < THRESHOLD) return;
      dragging.moved = true;
      const t0 = instance.viewport.screenToGraph(dragging.sx, dragging.sy);
      const t1 = instance.viewport.screenToGraph(e.clientX, e.clientY);
      node.x = dragging.ox + (t1.x - t0.x);
      node.y = dragging.oy + (t1.y - t0.y);
      instance.nodeRenderer.setPosition(node.id, node.x, node.y);
      instance.edgeRenderer.updatePaths(instance.config.nodesById);
    };
    const onUp = () => {
      if (!dragging || dragging.id !== node.id) return;
      if (dragging.moved) {
        instance._nodeJustDragged = true;
        instance._emit("layout:change", { nodeId: node.id, x: node.x, y: node.y });
      }
      dragging = null;
    };
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
  });
}

// src/ui/drawer.js
function blockCanvasPointer(el) {
  el.addEventListener("mousedown", (e) => e.stopPropagation());
  el.addEventListener("pointerdown", (e) => e.stopPropagation());
}
function createDrawer(root, options = {}) {
  var _a, _b;
  const {
    id,
    side = "right",
    width = 300,
    title = "",
    tabs = [],
    onClose,
    onOpen
  } = options;
  const backdrop = document.createElement("div");
  backdrop.className = "fg-drawer-backdrop";
  backdrop.setAttribute("aria-hidden", "true");
  const drawer = document.createElement("aside");
  drawer.className = `fg-drawer fg-drawer-${side}`;
  drawer.style.setProperty("--fg-drawer-width", `${width}px`);
  drawer.setAttribute("role", "dialog");
  drawer.setAttribute("aria-modal", "true");
  drawer.setAttribute("aria-hidden", "true");
  if (id) drawer.id = id;
  const header = document.createElement("div");
  header.className = "fg-drawer-header";
  const titleEl = document.createElement("h3");
  titleEl.className = "fg-drawer-title";
  titleEl.textContent = title;
  const closeBtn = document.createElement("button");
  closeBtn.type = "button";
  closeBtn.className = "fg-btn fg-btn-ghost fg-drawer-close";
  closeBtn.setAttribute("aria-label", "Fechar painel");
  closeBtn.innerHTML = iconMarkup("x");
  header.appendChild(titleEl);
  header.appendChild(closeBtn);
  const tabBar = document.createElement("div");
  tabBar.className = "fg-drawer-tabs";
  tabBar.setAttribute("role", "tablist");
  const bodies = {};
  tabs.forEach((tab, i) => {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "fg-drawer-tab";
    btn.setAttribute("role", "tab");
    btn.dataset.tab = tab.id;
    btn.textContent = tab.label;
    btn.setAttribute("aria-selected", i === 0 ? "true" : "false");
    tabBar.appendChild(btn);
    const panel = document.createElement("div");
    panel.className = "fg-drawer-panel";
    panel.dataset.tab = tab.id;
    panel.setAttribute("role", "tabpanel");
    panel.hidden = i !== 0;
    bodies[tab.id] = panel;
  });
  const bodyWrap = document.createElement("div");
  bodyWrap.className = "fg-drawer-body";
  Object.values(bodies).forEach((p2) => bodyWrap.appendChild(p2));
  drawer.appendChild(header);
  if (tabs.length > 1) drawer.appendChild(tabBar);
  drawer.appendChild(bodyWrap);
  root.appendChild(backdrop);
  root.appendChild(drawer);
  blockCanvasPointer(drawer);
  blockCanvasPointer(backdrop);
  let activeTab = ((_a = tabs[0]) == null ? void 0 : _a.id) || null;
  let openState = false;
  function setTab(tabId) {
    activeTab = tabId;
    tabBar.querySelectorAll(".fg-drawer-tab").forEach((b) => {
      const on2 = b.dataset.tab === tabId;
      b.classList.toggle("fg-drawer-tab-active", on2);
      b.setAttribute("aria-selected", on2 ? "true" : "false");
    });
    Object.entries(bodies).forEach(([tid, panel]) => {
      panel.hidden = tid !== tabId;
    });
  }
  tabBar.querySelectorAll(".fg-drawer-tab").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      e.stopPropagation();
      setTab(btn.dataset.tab);
    });
  });
  if (tabs[0]) {
    (_b = tabBar.querySelector(".fg-drawer-tab")) == null ? void 0 : _b.classList.add("fg-drawer-tab-active");
  }
  function open() {
    if (openState) return;
    openState = true;
    backdrop.setAttribute("aria-hidden", "false");
    drawer.setAttribute("aria-hidden", "false");
    backdrop.classList.add("fg-drawer-open");
    drawer.classList.add("fg-drawer-open");
    hydrateIcons(drawer);
    if (onOpen) onOpen();
  }
  function close() {
    if (!openState) return;
    openState = false;
    backdrop.classList.remove("fg-drawer-open");
    drawer.classList.remove("fg-drawer-open");
    backdrop.setAttribute("aria-hidden", "true");
    drawer.setAttribute("aria-hidden", "true");
    if (onClose) onClose();
  }
  closeBtn.addEventListener("click", (e) => {
    e.preventDefault();
    e.stopPropagation();
    close();
  });
  backdrop.addEventListener("click", (e) => {
    if (e.target !== backdrop) return;
    e.stopPropagation();
    close();
  });
  return {
    el: drawer,
    backdrop,
    open,
    close,
    setTitle(text) {
      titleEl.textContent = text;
    },
    setTab,
    getActiveTab: () => activeTab,
    panel(tabId) {
      return bodies[tabId];
    },
    isOpen: () => openState
  };
}

// src/charts.js
function renderSparkline(samples, options = {}) {
  var _a, _b, _c, _d, _e2, _f, _g, _h;
  const width = (_a = options.width) != null ? _a : 280;
  const height = (_b = options.height) != null ? _b : 48;
  const color = (_c = options.color) != null ? _c : "#7C3AED";
  const fill = (_d = options.fill) != null ? _d : `color-mix(in srgb, ${color} 12%, transparent)`;
  const label = (_e2 = options.label) != null ? _e2 : "";
  const unit = (_f = options.unit) != null ? _f : "";
  if (!(samples == null ? void 0 : samples.length)) {
    return `
      <div class="fg-sparkline-wrap">
        ${label ? `<div class="fg-sparkline-label">${label}</div>` : ""}
        <svg class="fg-sparkline fg-sparkline-empty" width="${width}" height="${height}" aria-hidden="true">
          <line x1="0" y1="${height / 2}" x2="${width}" y2="${height / 2}" stroke="currentColor" stroke-opacity="0.15"/>
        </svg>
        <span class="fg-sparkline-empty-text">Sem dados ainda</span>
      </div>`;
  }
  const values = samples.map((s) => s.v);
  let min = (_g = options.min) != null ? _g : Math.min(...values);
  let max = (_h = options.max) != null ? _h : Math.max(...values);
  if (min === max) {
    min -= 1;
    max += 1;
  }
  const pad = 4;
  const innerW = width - pad * 2;
  const innerH = height - pad * 2;
  const pts = values.map((v2, i) => {
    const x2 = pad + i / Math.max(1, values.length - 1) * innerW;
    const y = pad + innerH - (v2 - min) / (max - min) * innerH;
    return `${x2.toFixed(1)},${y.toFixed(1)}`;
  });
  const last = values[values.length - 1];
  const area = `${pad},${height - pad} ${pts.join(" ")} ${width - pad},${height - pad}`;
  return `
    <div class="fg-sparkline-wrap">
      ${label ? `<div class="fg-sparkline-label">${label}<span class="fg-sparkline-last">${last}${unit ? ` ${unit}` : ""}</span></div>` : ""}
      <svg class="fg-sparkline" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" role="img" aria-label="${label || "sparkline"}">
        <polygon class="fg-sparkline-area" points="${area}" fill="${fill}" />
        <polyline class="fg-sparkline-line" points="${pts.join(" ")}" fill="none" stroke="${color}" stroke-width="1.75" stroke-linejoin="round" stroke-linecap="round"/>
      </svg>
    </div>`;
}
function bucketBySecond(samples, windowSec = 30) {
  if (!(samples == null ? void 0 : samples.length)) return [];
  const now = Date.now();
  const start = now - windowSec * 1e3;
  const buckets = {};
  samples.forEach((s) => {
    var _a;
    if (s.t < start) return;
    const sec = Math.floor((s.t - start) / 1e3);
    buckets[sec] = (buckets[sec] || 0) + ((_a = s.v) != null ? _a : 1);
  });
  const maxSec = Math.floor((now - start) / 1e3);
  const out = [];
  for (let i = 0; i <= maxSec; i += 1) {
    out.push({ t: start + i * 1e3, v: buckets[i] || 0 });
  }
  return out;
}

// src/ui/node-metrics.js
init_admission();
function emitModeLabel(node) {
  const emit = node.emit || { mode: "all" };
  if (emit.mode === "weighted") return "weighted";
  if (emit.mode === "round-robin") return "round-robin";
  if (emit.mode === "map") return "map";
  if (emit.mode === "excludeReject") return "exclude reject";
  return emit.mode || "all";
}
function gateLabel(node) {
  const gate = node.gate || {};
  if (Array.isArray(gate.from)) return `${gate.from.length} edges`;
  if (gate.from === "all-edges") return `all edges \xD7${gate.count || 1}`;
  return `count \xD7${gate.count || 1}`;
}
function ratePerSec(samples, windowSec) {
  if (!(samples == null ? void 0 : samples.length)) return 0;
  return Math.round(samples.length / (windowSec || 30) * 10) / 10;
}
function fmtMs(v2) {
  return v2 != null && v2 !== "" ? `${v2} ms` : "\u2014";
}
function buildNodeInfoRows(node, stats, config) {
  var _a, _b, _c, _d, _e2, _f, _g;
  if (!node || !stats) return [];
  const rows = [["Estado", stats.state]];
  if (node.type === "port") {
    if (node.role === "source") {
      const src = (_a = config.sources) == null ? void 0 : _a.find((s) => {
        const edge = config.edgesById[s.edgeId];
        return (edge == null ? void 0 : edge.from) === node.id;
      });
      rows.push(["Emitidos", String(stats.tokensOut)]);
      if (src) {
        rows.push(["Intervalo", `${src.interval} ms`]);
        if (((_b = src.burst) == null ? void 0 : _b.count) > 1) {
          rows.push(["Burst", `${src.burst.count} / ${src.burst.spacing}ms`]);
        }
      }
    } else {
      rows.push(["Recebidos", String((_c = stats.received) != null ? _c : stats.tokensIn)]);
      rows.push(["Entrada", String(stats.tokensIn)]);
    }
    return rows;
  }
  const mode = admissionMode(node);
  if (mode === "slot") {
    rows.push(["Ocupa\xE7\xE3o", `${stats.queueDepth} / ${admissionMax(node)}`]);
    rows.push(["Entrada / Sa\xEDda", `${stats.tokensIn} / ${stats.tokensOut}`]);
    if ((_d = node.admission) == null ? void 0 : _d.rejectEdge) rows.push(["Rejeitados", String(stats.rejects)]);
  } else if (mode === "batch") {
    rows.push(["Batch max", String((_e2 = admissionMax(node)) != null ? _e2 : "\u2014")]);
    rows.push(["Entrada / Sa\xEDda", `${stats.tokensIn} / ${stats.tokensOut}`]);
  } else if (isJoinGate(node)) {
    rows.push(["Gate", gateLabel(node)]);
    rows.push(["Entrada / Sa\xEDda", `${stats.tokensIn} / ${stats.tokensOut}`]);
    rows.push(["Aguardando", String(stats.queueDepth)]);
  } else {
    rows.push(["Entrada / Sa\xEDda", `${stats.tokensIn} / ${stats.tokensOut}`]);
    rows.push(["Fila", String(stats.queueDepth)]);
    const max = admissionMax(node);
    if (max != null) rows.push(["Queue max", String(max)]);
    if ((_f = node.admission) == null ? void 0 : _f.rejectEdge) rows.push(["Rejeitados", String(stats.rejects)]);
  }
  if (hasCircuit(node)) {
    rows.push(["Circuito", (stats.circuitState || "closed").toUpperCase()]);
    rows.push(["Falhas", String(stats.rejects)]);
  }
  if (hasRetry(node)) {
    rows.push(["Max retries", String((_g = node.retry.maxRetries) != null ? _g : 3)]);
  }
  if (emitModeLabel(node) !== "all") {
    rows.push(["Emit", emitModeLabel(node)]);
  }
  return rows;
}
function buildNodeMetricRows(node, stats, config) {
  var _a, _b, _c;
  if (!node || !stats) return [];
  const windowSec = (_b = (_a = config.metrics) == null ? void 0 : _a.windowSec) != null ? _b : 30;
  const rows = [];
  if (node.type === "port" && node.role === "source") {
    rows.push(["Taxa emit", `${ratePerSec(stats.emitSamples, windowSec)}/s`]);
    rows.push(["Total emit", String(stats.tokensOut)]);
    return rows;
  }
  if (node.type === "port") {
    rows.push(["Taxa receb", `${ratePerSec(stats.arriveSamples, windowSec)}/s`]);
    rows.push(["Total receb", String((_c = stats.received) != null ? _c : stats.tokensIn)]);
    return rows;
  }
  rows.push(["p50 process", fmtMs(stats.p50Process)]);
  rows.push(["p90 process", fmtMs(stats.p90Process)]);
  rows.push(["p50 wait", fmtMs(stats.p50Wait)]);
  if (admissionMode(node) === "slot") {
    rows.push(["Rejeitados", String(stats.rejects)]);
  }
  rows.push(["Taxa sa\xEDda", `${ratePerSec(stats.emitSamples, windowSec)}/s`]);
  rows.push(["Emit mode", emitModeLabel(node)]);
  return rows;
}
function buildNodeCharts(node, stats, config) {
  var _a, _b, _c, _d, _e2, _f, _g, _h, _i, _j, _k;
  if (((_a = config.metrics) == null ? void 0 : _a.charts) === false || !stats) return "";
  const windowSec = (_c = (_b = config.metrics) == null ? void 0 : _b.windowSec) != null ? _c : 30;
  const primary = (_e2 = (_d = config.theme) == null ? void 0 : _d.primary) != null ? _e2 : "#7C3AED";
  const success = (_g = (_f = config.theme) == null ? void 0 : _f.success) != null ? _g : "#3D6B52";
  const warning = (_i = (_h = config.theme) == null ? void 0 : _h.warning) != null ? _i : "#D97706";
  const danger = (_k = (_j = config.theme) == null ? void 0 : _j.danger) != null ? _k : "#9B1C1C";
  const parts = [];
  if (node.type === "port" && node.role === "source") {
    parts.push(renderSparkline(
      bucketBySecond(stats.emitSamples || [], windowSec),
      { label: "Emiss\xF5es / s", unit: "/s", color: primary, width: 268, height: 52 }
    ));
    return parts.map((p2) => `<div class="fg-panel-section">${p2}</div>`).join("");
  }
  if (node.type === "port") {
    parts.push(renderSparkline(
      bucketBySecond(stats.arriveSamples || [], windowSec),
      { label: "Recebidos / s", unit: "/s", color: success, width: 268, height: 52 }
    ));
    return parts.map((p2) => `<div class="fg-panel-section">${p2}</div>`).join("");
  }
  parts.push(renderSparkline(stats.processTimes || [], {
    label: "Process time",
    unit: "ms",
    color: primary,
    width: 268,
    height: 52
  }));
  parts.push(renderSparkline(stats.waitTimes || [], {
    label: "Wait time",
    unit: "ms",
    color: warning,
    width: 268,
    height: 52
  }));
  parts.push(renderSparkline(
    bucketBySecond(stats.emitSamples || [], windowSec),
    { label: "Emiss\xF5es / s", unit: "/s", color: success, width: 268, height: 52 }
  ));
  if (admissionMode(node) === "slot") {
    parts.push(renderSparkline(
      bucketBySecond(stats.rejectSamples || [], windowSec),
      { label: "Rejei\xE7\xF5es / s", unit: "/s", color: danger, width: 268, height: 52 }
    ));
  }
  return parts.map((p2) => `<div class="fg-panel-section">${p2}</div>`).join("");
}

// src/ui/inspector.js
function renderInspectorForm(node, config) {
  var _a, _b, _c, _d, _e2, _f, _g, _h, _i, _j, _k, _l, _m, _n2, _o, _p, _q, _r, _s;
  const fields = [];
  if (node.type === "process") {
    fields.push(numField("duration", "Duration (ms)", node.duration));
    const mode = ((_a = node.admission) == null ? void 0 : _a.mode) || "queue";
    fields.push(selectField("admissionMode", "Admission", mode, [
      { value: "queue", label: "queue (FIFO)" },
      { value: "slot", label: "slot (sem\xE1foro)" },
      { value: "batch", label: "batch (micro-batch)" }
    ]));
    if (mode === "queue") {
      fields.push(numField("queueMax", "Queue max (vazio = \u221E)", (_c = (_b = node.admission) == null ? void 0 : _b.max) != null ? _c : "", 1, 0));
    }
    if (mode === "slot") {
      fields.push(numField("capacity", "Capacity", (_e2 = (_d = node.admission) == null ? void 0 : _d.max) != null ? _e2 : 2));
    }
    if (mode === "batch") {
      fields.push(numField("batchMax", "Batch size", (_g = (_f = node.admission) == null ? void 0 : _f.max) != null ? _g : 10));
      fields.push(numField("batchStep", "Step", (_i = (_h = node.admission) == null ? void 0 : _h.step) != null ? _i : 1));
    }
    if (mode === "queue" || mode === "slot") {
      fields.push(textField("rejectEdge", "Reject edge id", (_k = (_j = node.admission) == null ? void 0 : _j.rejectEdge) != null ? _k : ""));
    }
    if (isJoinGate2(node)) {
      const gateMode = ((_l = node.gate) == null ? void 0 : _l.from) === "all-edges" ? "all" : "count";
      fields.push(selectField("gateMode", "Gate sync", gateMode, [
        { value: "count", label: "count" },
        { value: "all", label: "all edges" }
      ]));
      fields.push(numField("gateCount", "Gate count", (_n2 = (_m = node.gate) == null ? void 0 : _m.count) != null ? _n2 : 1));
    }
    if (((_o = node.emit) == null ? void 0 : _o.mode) === "weighted") {
      (config.outgoing[node.id] || []).forEach((edge) => {
        var _a2, _b2;
        fields.push(numField(`weight_${edge.id}`, `Weight \xB7 ${((_a2 = edge.label) == null ? void 0 : _a2.text) || edge.id}`, (_b2 = edge.weight) != null ? _b2 : 1));
      });
    }
    if (node.retry) {
      fields.push(numField("maxRetries", "Max retries", (_p = node.retry.maxRetries) != null ? _p : 3));
    }
    if (node.circuit) {
      fields.push(numField("failureRate", "Failure rate (0\u20131)", (_q = node.circuit.failureRate) != null ? _q : 0.25, 0.01, 0, 1));
      fields.push(numField("failureThreshold", "Trip threshold", (_r = node.circuit.failureThreshold) != null ? _r : 5));
      fields.push(numField("recoveryMs", "Recovery (ms)", (_s = node.circuit.recoveryMs) != null ? _s : 8e3));
    }
  }
  if (node.type === "port") {
    fields.push(checkField("showReceived", "Show received pill", node.showReceived));
  }
  if (!fields.length) {
    return '<p class="fg-muted fg-panel-placeholder">Nenhum par\xE2metro edit\xE1vel para este tipo.</p>';
  }
  return `
    <form class="fg-inspector-form">
      ${fields.join("")}
      <button type="submit" class="fg-inspector-apply">Aplicar</button>
    </form>`;
}
function isJoinGate2(node) {
  var _a;
  const from = (_a = node.gate) == null ? void 0 : _a.from;
  return from === "all-edges" || Array.isArray(from);
}
function numField(name, label, value, step = 1, min = 0, max = null) {
  const maxAttr = max != null ? `max="${max}"` : "";
  return `
    <label class="fg-field">
      <span class="fg-field-label">${label}</span>
      <input class="fg-field-input" type="number" name="${name}" value="${value != null ? value : ""}" step="${step}" min="${min}" ${maxAttr} />
    </label>`;
}
function textField(name, label, value) {
  return `
    <label class="fg-field">
      <span class="fg-field-label">${label}</span>
      <input class="fg-field-input" type="text" name="${name}" value="${value != null ? value : ""}" />
    </label>`;
}
function selectField(name, label, value, options) {
  const opts = options.map((o) => `<option value="${o.value}"${o.value === value ? " selected" : ""}>${o.label}</option>`).join("");
  return `
    <label class="fg-field">
      <span class="fg-field-label">${label}</span>
      <select class="fg-field-input" name="${name}">${opts}</select>
    </label>`;
}
function checkField(name, label, checked) {
  return `
    <label class="fg-field fg-field-check">
      <input type="checkbox" name="${name}"${checked ? " checked" : ""} />
      <span class="fg-field-label">${label}</span>
    </label>`;
}
function readInspectorPatch(form, node) {
  const fd = new FormData(form);
  const patch = {};
  if (fd.has("duration")) patch.duration = Number(fd.get("duration"));
  if (fd.has("admissionMode")) {
    const mode = fd.get("admissionMode");
    const admission = { mode, step: 1, rejectEdge: fd.get("rejectEdge") || null };
    if (mode === "queue") {
      const raw = fd.get("queueMax");
      admission.max = raw === "" ? null : Number(raw);
    }
    if (mode === "slot") admission.max = Number(fd.get("capacity") || 2);
    if (mode === "batch") {
      admission.max = Number(fd.get("batchMax") || 10);
      admission.step = Number(fd.get("batchStep") || 1);
    }
    patch.admission = admission;
  }
  if (fd.has("gateMode") || fd.has("gateCount")) {
    patch.gate = {
      mode: fd.get("gateMode") || "count",
      count: Number(fd.get("gateCount") || 1)
    };
  }
  if (fd.has("maxRetries")) {
    patch.retry = { ...node.retry, maxRetries: Number(fd.get("maxRetries")) };
  }
  if (fd.has("failureRate")) {
    patch.circuit = {
      failureRate: Number(fd.get("failureRate")),
      failureThreshold: Number(fd.get("failureThreshold")),
      recoveryMs: Number(fd.get("recoveryMs"))
    };
  }
  if (form.querySelector('[name="showReceived"]')) {
    patch.showReceived = fd.get("showReceived") === "on";
  }
  const weights = {};
  fd.forEach((val, key) => {
    if (key.startsWith("weight_")) weights[key.slice(7)] = Number(val);
  });
  if (Object.keys(weights).length) patch.weights = weights;
  return patch;
}
function bindInspectorForm(form, instance, nodeId, onApplied) {
  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const node = instance.config.nodesById[nodeId];
    if (!node) return;
    instance.updateNode(nodeId, readInspectorPatch(form, node));
    if (onApplied) onApplied();
  });
}

// src/ui/panels.js
function statCard(label, value) {
  return `<div class="fg-stat-card"><span class="fg-stat-label">${label}</span><span class="fg-stat-value">${value}</span></div>`;
}
function statsGrid(rows) {
  if (!rows.length) return '<p class="fg-muted fg-panel-placeholder">Sem m\xE9tricas para este n\xF3.</p>';
  return `<div class="fg-stat-grid">${rows.map(([l, v2]) => statCard(l, v2)).join("")}</div>`;
}
function fmtMs2(v2) {
  return v2 != null && v2 !== "" ? `${v2} ms` : "\u2014";
}
function renderConfigTab(instance, nodeId) {
  const drawer = instance._nodeDrawer;
  if (!drawer) return;
  const configTab = drawer.panel("config");
  const node = instance.config.nodesById[nodeId];
  if (!configTab || !node) return;
  configTab.innerHTML = renderInspectorForm(node, instance.config);
  const form = configTab.querySelector(".fg-inspector-form");
  if (form) bindInspectorForm(form, instance, nodeId, () => renderConfigTab(instance, nodeId));
}
function renderNodePanelContent(instance, nodeId, options = {}) {
  const { refreshConfig = true } = options;
  const drawer = instance._nodeDrawer;
  if (!drawer || !instance.metrics) return;
  const node = instance.config.nodesById[nodeId];
  const stats = instance.metrics.nodeStats(nodeId);
  if (!node || !stats) return;
  const cfg = instance.config;
  drawer.setTitle(node.label || node.id);
  const info = drawer.panel("info");
  if (info) {
    info.innerHTML = `
      <p class="fg-muted fg-drawer-subtitle">${node.type}${node.role ? ` \xB7 ${node.role}` : ""}</p>
      ${statsGrid(buildNodeInfoRows(node, stats, cfg))}
    `;
  }
  const metricsTab = drawer.panel("metrics");
  if (metricsTab) {
    const rows = buildNodeMetricRows(node, stats, cfg);
    metricsTab.innerHTML = statsGrid(rows) + buildNodeCharts(node, stats, cfg);
  }
  if (refreshConfig) renderConfigTab(instance, nodeId);
}
function mountGlobalDrawer(root, instance, config) {
  var _a, _b;
  if (((_a = config.metrics) == null ? void 0 : _a.globalDrawer) === false || ((_b = config.metrics) == null ? void 0 : _b.systemPanel) === false) return null;
  const drawer = createDrawer(root, {
    id: "fg-global-drawer",
    title: "M\xE9tricas globais",
    tabs: [
      { id: "overview", label: "Overview" },
      { id: "charts", label: "Charts" }
    ],
    onClose: () => {
      syncGlobalMetricsButton(instance);
      syncChromePinned(instance);
    },
    onOpen: () => {
      syncGlobalMetricsButton(instance);
      syncChromePinned(instance);
    }
  });
  instance._globalDrawer = drawer;
  return drawer;
}
function updateGlobalPanel(instance) {
  var _a, _b, _c, _d, _e2, _f, _g;
  const drawer = instance._globalDrawer;
  if (!drawer || !instance.metrics) return;
  const cfg = instance.config;
  const chartsOn = ((_a = cfg.metrics) == null ? void 0 : _a.charts) !== false;
  const windowSec = (_c = (_b = cfg.metrics) == null ? void 0 : _b.windowSec) != null ? _c : 30;
  const primary = (_e2 = (_d = cfg.theme) == null ? void 0 : _d.primary) != null ? _e2 : "#7C3AED";
  const s = instance.metrics.systemStats();
  const sys = instance.metrics.system;
  const overview = drawer.panel("overview");
  if (overview) {
    overview.innerHTML = statsGrid([
      ["RT", s.lastRt != null ? `${s.lastRt} ms` : "\u2014"],
      ["Throughput", `${s.throughput}/s`],
      ["p50 RT", fmtMs2(s.p50Rt)],
      ["p90 RT", fmtMs2(s.p90Rt)],
      ["Rejects", String(s.rejects)],
      ["Completed", String(s.completed)]
    ]);
  }
  const charts = drawer.panel("charts");
  if (charts) {
    if (!chartsOn) {
      charts.innerHTML = '<p class="fg-muted fg-panel-placeholder">Charts desativados (metrics.charts: false).</p>';
      return;
    }
    const rtSeries = sys.rtSamples || [];
    const tpSeries = bucketBySecond(sys.throughput || [], windowSec);
    charts.innerHTML = `
      <div class="fg-panel-section">
        ${renderSparkline(rtSeries, { label: "Response time", unit: "ms", color: primary, width: 268, height: 52 })}
      </div>
      <div class="fg-panel-section">
        ${renderSparkline(tpSeries, { label: "Throughput / s", unit: "/s", color: (_g = (_f = cfg.theme) == null ? void 0 : _f.success) != null ? _g : "#3D6B52", width: 268, height: 52 })}
      </div>`;
  }
}
function mountNodeDrawer(root, instance, config) {
  var _a, _b;
  if (((_a = config.metrics) == null ? void 0 : _a.nodeDrawer) === false && ((_b = config.metrics) == null ? void 0 : _b.nodePanel) === false) return null;
  const drawer = createDrawer(root, {
    id: "fg-node-drawer",
    side: "left",
    title: "N\xF3",
    tabs: [
      { id: "info", label: "Info" },
      { id: "metrics", label: "Metrics" },
      { id: "config", label: "Config" }
    ],
    onClose: () => {
      if (instance._selectedNode) {
        instance.nodeRenderer.setSelected(instance._selectedNode, false);
        instance._selectedNode = null;
        instance._clearEdgeHighlight();
      }
      syncChromePinned(instance);
    },
    onOpen: () => {
      syncChromePinned(instance);
    }
  });
  instance._nodeDrawer = drawer;
  return drawer;
}
function updateNodePanel(instance, nodeId) {
  const drawer = instance._nodeDrawer;
  if (!drawer || !instance.metrics) return;
  renderNodePanelContent(instance, nodeId);
  if (!drawer.isOpen()) drawer.open();
}
function refreshOpenPanels(instance) {
  var _a, _b;
  if ((_a = instance._globalDrawer) == null ? void 0 : _a.isOpen()) updateGlobalPanel(instance);
  if (((_b = instance._nodeDrawer) == null ? void 0 : _b.isOpen()) && instance._selectedNode) {
    const onConfig = instance._nodeDrawer.getActiveTab() === "config";
    renderNodePanelContent(instance, instance._selectedNode, { refreshConfig: !onConfig });
  }
}
function closeNodeDrawer(instance) {
  var _a;
  (_a = instance._nodeDrawer) == null ? void 0 : _a.close();
}

// src/index.js
var NS5 = "http://www.w3.org/2000/svg";
var CSS_HREF = "flowgraph.css";
function resolveTarget(target) {
  if (typeof target === "string") return document.querySelector(target);
  return target;
}
function injectStylesheet() {
  if (document.querySelector("link[data-flowgraph-css]")) return;
  const link = document.createElement("link");
  link.rel = "stylesheet";
  link.href = CSS_HREF;
  link.setAttribute("data-flowgraph-css", "1");
  document.head.appendChild(link);
}
var FlowGraphInstance = class {
  constructor(container, rawConfig) {
    this.container = container;
    this.config = parseConfig(rawConfig);
    this.listeners = {};
    this.running = false;
    this._raf = null;
    this._lastTs = 0;
    this.metrics = new MetricsStore(this.config);
    this._selectedNode = null;
    this._metricsTimer = null;
    if (this.config.injectStyles) injectStylesheet();
    this._mount();
    this._bindSimulation();
    if (this.config.autoStart) this.start();
  }
  _mount() {
    var _a, _b, _c, _d;
    const cfg = this.config;
    this.container.innerHTML = "";
    this.container.classList.add("fg-container");
    const root = document.createElement("div");
    root.className = "fg-root";
    root.style.setProperty("--fg-bg", cfg.theme.background);
    root.style.setProperty("--fg-font", cfg.theme.font);
    root.style.setProperty("--fg-primary", cfg.theme.primary);
    root.style.setProperty("--fg-border", cfg.theme.border);
    root.style.setProperty("--fg-text", cfg.theme.text);
    root.style.setProperty("--fg-text-muted", cfg.theme.textMuted);
    root.style.setProperty("--fg-edge-label-bg", cfg.theme.pillSurface || "#FFFFFF");
    applyCanvasBackground(root, cfg.viewport, cfg.theme);
    if (cfg.viewport.height) {
      root.style.height = typeof cfg.viewport.height === "number" ? `${cfg.viewport.height}px` : cfg.viewport.height;
    }
    if (cfg.viewport.width) {
      root.style.width = typeof cfg.viewport.width === "number" ? `${cfg.viewport.width}px` : cfg.viewport.width;
    }
    const canvasBg = document.createElement("div");
    canvasBg.className = "fg-canvas-bg";
    canvasBg.setAttribute("aria-hidden", "true");
    const svg = document.createElementNS(NS5, "svg");
    svg.setAttribute("class", "fg-svg");
    svg.setAttribute("xmlns", NS5);
    const viewportG = document.createElementNS(NS5, "g");
    viewportG.setAttribute("class", "fg-viewport");
    const edgesLayer = document.createElementNS(NS5, "g");
    edgesLayer.setAttribute("class", "fg-edges");
    const particlesLayer = document.createElementNS(NS5, "g");
    particlesLayer.setAttribute("class", "fg-particles");
    const labelsLayer = document.createElementNS(NS5, "g");
    labelsLayer.setAttribute("class", "fg-labels");
    const nodesLayer = document.createElementNS(NS5, "g");
    nodesLayer.setAttribute("class", "fg-nodes");
    viewportG.appendChild(edgesLayer);
    viewportG.appendChild(particlesLayer);
    viewportG.appendChild(labelsLayer);
    viewportG.appendChild(nodesLayer);
    svg.appendChild(viewportG);
    root.appendChild(canvasBg);
    root.appendChild(svg);
    this.root = root;
    this.svg = svg;
    this.viewportG = viewportG;
    this.bounds = graphBoundsWithEdges(cfg.nodes, cfg.edges, cfg.nodesById, cfg.viewport.padding);
    this.edgeRenderer = renderEdges(edgesLayer, labelsLayer, cfg.edges, cfg.nodesById, cfg.theme);
    this.nodeRenderer = renderNodes(nodesLayer, cfg.nodes, cfg.theme);
    this.particles = new ParticleSystem(particlesLayer, this.edgeRenderer, cfg);
    this.viewport = createViewport(svg, viewportG, cfg, this.bounds);
    mountGlobalDrawer(root, this, cfg);
    mountNodeDrawer(root, this, cfg);
    createChrome(root, this, cfg);
    this.container.appendChild(root);
    const nodeDrag = ((_a = cfg.interaction) == null ? void 0 : _a.nodeDrag) !== false;
    const nodeSelect = ((_b = cfg.interaction) == null ? void 0 : _b.nodeSelect) !== false;
    const nodeDrawerOn = ((_c = cfg.metrics) == null ? void 0 : _c.nodeDrawer) !== false && ((_d = cfg.metrics) == null ? void 0 : _d.nodePanel) !== false;
    cfg.nodes.forEach((n) => {
      var _a2;
      const g = (_a2 = this.nodeRenderer.nodeViews[n.id]) == null ? void 0 : _a2.g;
      if (!g) return;
      if (nodeDrag) g.style.cursor = "grab";
      else if (nodeSelect) g.style.cursor = "pointer";
      if (!nodeSelect) return;
      g.addEventListener("click", (e) => {
        e.stopPropagation();
        if (this._nodeJustDragged) {
          this._nodeJustDragged = false;
          return;
        }
        this.selectNode(n.id);
        if (nodeDrawerOn) updateNodePanel(this, n.id);
      });
    });
    if (nodeDrag) attachNodeDrag(this);
    this.nodeRenderer.refreshIcons();
    requestAnimationFrame(() => {
      this.edgeRenderer.updateLabels();
      this.viewport.fit();
    });
    if (typeof ResizeObserver !== "undefined") {
      this._ro = new ResizeObserver(() => this.viewport.fit());
      this._ro.observe(svg);
    }
  }
  selectNode(nodeId) {
    if (this._selectedNode && this._selectedNode !== nodeId) {
      this.nodeRenderer.setSelected(this._selectedNode, false);
    }
    this._selectedNode = nodeId;
    this.nodeRenderer.setSelected(nodeId, true);
    this._highlightEdges(nodeId);
  }
  _highlightEdges(nodeId) {
    const primary = this.config.theme.primary;
    this.config.edges.forEach((e) => {
      const hit = e.from === nodeId || e.to === nodeId;
      this.edgeRenderer.setActive(e.id, hit, hit ? primary : null);
      this.edgeRenderer.setDimmed(e.id, !hit);
    });
  }
  _clearEdgeHighlight() {
    this.config.edges.forEach((e) => {
      this.edgeRenderer.setActive(e.id, false);
      this.edgeRenderer.setDimmed(e.id, false);
    });
  }
  updateNode(nodeId, patch) {
    applyNodePatch(this.config, nodeId, patch);
    this.sim.patchNode(nodeId, this.config.nodesById[nodeId]);
    if (this._selectedNode === nodeId) this.refreshOpenPanels();
  }
  toggleGlobalDrawer() {
    var _a, _b;
    if ((_a = this._globalDrawer) == null ? void 0 : _a.isOpen()) {
      this._globalDrawer.close();
    } else {
      (_b = this._globalDrawer) == null ? void 0 : _b.open();
      updateGlobalPanel(this);
    }
    syncGlobalMetricsButton(this);
    syncChromePinned(this);
  }
  refreshGlobalPanel() {
    updateGlobalPanel(this);
  }
  refreshOpenPanels() {
    refreshOpenPanels(this);
  }
  _recomputeBounds() {
    this.viewport.updateBounds(graphBoundsWithEdges(
      this.config.nodes,
      this.config.edges,
      this.config.nodesById,
      this.config.viewport.padding
    ));
  }
  async applyAutoLayout(engine) {
    const layoutCfg = this.config.layout || {};
    const eng = engine || layoutCfg.engine || "layered";
    if (eng === "dagre") {
      const { dagreLayout: dagreLayout2 } = await Promise.resolve().then(() => (init_layout_dagre(), layout_dagre_exports));
      dagreLayout2(this.config.nodes, this.config.edges, { ...layoutCfg, force: true });
    } else {
      autoLayout(this.config.nodes, this.config.edges, { ...layoutCfg, force: true });
    }
    this.config.nodes.forEach((n) => {
      this.nodeRenderer.setPosition(n.id, n.x, n.y);
    });
    this.edgeRenderer.updatePaths(this.config.nodesById);
    this._recomputeBounds();
    requestAnimationFrame(() => this.viewport.fit());
    this._emit("layout:change", { engine: eng });
  }
  _bindSimulation() {
    const onSpawnTrack = (token, edgeId2) => {
      if (token == null ? void 0 : token.id) this.sim.noteTokenSpawn(token.id, edgeId2);
    };
    this.sim = new SimulationEngine(this.config, {
      onEvent: (event, payload) => {
        var _a;
        this._emit(event, payload);
        if (event === "token:spawn" && payload.sourceId) {
          const src = this.config.sources.find((s) => s.id === payload.sourceId);
          if (src) {
            const edge = this.config.edgesById[src.edgeId];
            if (edge == null ? void 0 : edge.from) {
              this.metrics.recordEmit(edge.from, ((_a = src.burst) == null ? void 0 : _a.count) || 1);
              if (this._selectedNode === edge.from) {
                this.refreshOpenPanels();
              }
            }
          }
        }
        if (event === "flow:complete") this.refreshOpenPanels();
      },
      spawnOnEdge: (edgeId2, tokenCfg, burst, onArrive) => {
        spawnBurst(
          this.particles,
          edgeId2,
          burst,
          tokenCfg,
          (token) => {
            if (onArrive) onArrive(token);
          },
          (token) => onSpawnTrack(token, edgeId2)
        );
      },
      getNodeMetrics: (nodeId) => {
        const s = this.metrics.nodeStats(nodeId);
        return s ? { rejects: s.rejects, queueDepth: s.queueDepth } : {};
      },
      onPills: (nodeId, pills) => {
        this.nodeRenderer.setPillsBottom(nodeId, pills);
      },
      onMetrics: (kind, data) => {
        if (kind === "arrive") this.metrics.recordArrive(data.nodeId);
        if (kind === "processStart") this.metrics.recordProcessStart(data.nodeId, data.waitMs);
        if (kind === "processEnd") this.metrics.recordProcessEnd(data.nodeId, data.processMs);
        if (kind === "emit") this.metrics.recordEmit(data.nodeId);
        if (kind === "reject") this.metrics.recordReject(data.nodeId);
        if (kind === "sink") this.metrics.recordSink(data.nodeId);
        if (kind === "flowComplete") this.metrics.recordFlowComplete(data.rtMs);
        if (kind === "queue") this.metrics.setQueueDepth(data.nodeId, data.depth);
        if (data == null ? void 0 : data.nodeId) this.sim._refreshPills(data.nodeId);
        this.refreshOpenPanels();
      },
      onNodeProcessStart: (nodeId, effect) => {
        this.nodeRenderer.setEffect(nodeId, effect);
        this.nodeRenderer.setActive(nodeId, true);
        this.metrics.setState(nodeId, "processing");
      },
      onNodeProcessEnd: (nodeId) => {
        this.nodeRenderer.setEffect(nodeId, null);
        this.nodeRenderer.setActive(nodeId, false);
        this.metrics.setState(nodeId, "idle");
      },
      onNodeWaiting: (nodeId) => {
        this.nodeRenderer.setEffect(nodeId, "waiting");
        this.metrics.setState(nodeId, "waiting");
      },
      onReset: () => {
        this.particles.clear();
        this.metrics = new MetricsStore(this.config);
        this.config.nodes.forEach((n) => {
          this.nodeRenderer.setEffect(n.id, null);
          this.nodeRenderer.setActive(n.id, false);
          this.sim._refreshPills(n.id);
        });
        this.refreshGlobalPanel();
        closeNodeDrawer(this);
      }
    });
  }
  _emit(event, payload) {
    (this.listeners[event] || []).forEach((fn2) => fn2(payload));
  }
  on(event, fn2) {
    if (!this.listeners[event]) this.listeners[event] = [];
    this.listeners[event].push(fn2);
    return this;
  }
  _tick(ts) {
    if (!this._lastTs) this._lastTs = ts;
    const dt2 = ts - this._lastTs;
    this._lastTs = ts;
    this.particles.update(dt2);
    this._raf = requestAnimationFrame((t) => this._tick(t));
  }
  start() {
    if (this.running) return;
    this.running = true;
    this._lastTs = 0;
    this.sim.start();
    this._raf = requestAnimationFrame((t) => this._tick(t));
    this._metricsTimer = setInterval(() => this.refreshOpenPanels(), 500);
    updatePlayButton(this);
  }
  pause() {
    this.running = false;
    this.sim.pause();
    if (this._raf) cancelAnimationFrame(this._raf);
    this._raf = null;
    if (this._metricsTimer) clearInterval(this._metricsTimer);
    updatePlayButton(this);
  }
  reset() {
    this.pause();
    this.sim.reset();
    updatePlayButton(this);
  }
  destroy() {
    this.pause();
    if (this._ro) this._ro.disconnect();
    this.container.innerHTML = "";
    this.container.classList.remove("fg-container");
  }
  fit() {
    this.viewport.fit();
  }
  getConfig() {
    return this.config;
  }
  toJSON() {
    return {
      title: this.config.title,
      viewport: { ...this.config.viewport, background: this.config.viewport.background },
      layout: this.config.layout,
      interaction: this.config.interaction,
      controls: this.config.controls,
      metrics: this.config.metrics,
      nodes: this.config.nodes.map((n) => ({
        id: n.id,
        type: n.type,
        role: n.role,
        label: n.label,
        icon: n.icon,
        tone: n.tone,
        shape: n.shape,
        x: n.x,
        y: n.y,
        duration: n.duration,
        admission: n.admission,
        gate: n.gate,
        emit: n.emit,
        retry: n.retry,
        circuit: n.circuit,
        pillTop: n.pillTop,
        showReceived: n.showReceived
      })),
      edges: this.config.edges.map(({ id, from, to, stroke, label, weight, speed, routing, loopSide, token }) => ({
        id,
        from,
        to,
        stroke,
        label,
        weight,
        speed,
        routing,
        loopSide,
        token
      })),
      sources: this.config.sources
    };
  }
  emit(edgeId2, tokenCfg) {
    this.sim.emit(edgeId2, tokenCfg);
  }
};
function create(target, config) {
  const container = resolveTarget(target);
  if (!container) throw new Error("FlowGraph: container not found");
  return new FlowGraphInstance(container, config);
}
async function createFromURL(target, url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`FlowGraph: failed to load ${url}`);
  return create(target, await res.json());
}
var FlowGraph = { create, createFromURL, parseConfig, autoLayout, needsLayout };
if (typeof window !== "undefined") {
  window.FlowGraph = FlowGraph;
}
var index_default = FlowGraph;
export {
  FlowGraph,
  MetricsStore,
  SimulationEngine,
  index_default as default,
  graphBounds,
  graphBoundsWithEdges,
  parseConfig
};
