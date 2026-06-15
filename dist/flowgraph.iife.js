var FlowGraph = (() => {
  var __defProp = Object.defineProperty;
  var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
  var __getOwnPropNames = Object.getOwnPropertyNames;
  var __hasOwnProp = Object.prototype.hasOwnProperty;
  var __esm = (fn2, res) => function __init() {
    return fn2 && (res = (0, fn2[__getOwnPropNames(fn2)[0]])(fn2 = 0)), res;
  };
  var __export = (target, all) => {
    for (var name in all)
      __defProp(target, name, { get: all[name], enumerable: true });
  };
  var __copyProps = (to, from, except, desc) => {
    if (from && typeof from === "object" || typeof from === "function") {
      for (let key of __getOwnPropNames(from))
        if (!__hasOwnProp.call(to, key) && key !== except)
          __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
    }
    return to;
  };
  var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

  // src/compose-pills.js
  function estimateBottomPillHeight(node) {
    const pills = node == null ? void 0 : node.pillBottom;
    if (!(pills == null ? void 0 : pills.length)) return 0;
    const pillH = 18;
    const gap = 3;
    const pad = 5;
    return pad + pillH * pills.length + gap * Math.max(0, pills.length - 1);
  }
  var init_compose_pills = __esm({
    "src/compose-pills.js"() {
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

  // src/iife.js
  var iife_exports = {};
  __export(iife_exports, {
    default: () => iife_default
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

  // src/flow-player.js
  var STEP_KINDS = ["travel", "dwell", "parallel", "setPill", "setEffect", "wait", "focus", "narrate"];
  function parseStep(raw, index) {
    if (!raw || typeof raw !== "object") throw new Error(`FlowGraph: invalid step at index ${index}`);
    const kind = STEP_KINDS.find((k2) => raw[k2] != null);
    if (!kind) throw new Error(`FlowGraph: unknown step at index ${index}`);
    const data = raw[kind];
    if (kind === "parallel") {
      if (!Array.isArray(data)) throw new Error(`FlowGraph: parallel step at ${index} must be an array`);
      return {
        kind,
        parallel: data.map((s, i) => parseStep(s, index * 100 + i)),
        title: raw.title || null,
        description: raw.description || null
      };
    }
    return {
      kind,
      ...data,
      title: data.title || raw.title || null,
      description: data.description || raw.description || null
    };
  }
  function normalizeTrack(raw, index, defaults) {
    var _a, _b, _c, _d;
    const steps = (_a = raw.steps) == null ? void 0 : _a.map((s, i) => parseStep(s, i));
    if (!(steps == null ? void 0 : steps.length)) throw new Error(`FlowGraph: track "${raw.id || index}" needs steps`);
    return {
      id: raw.id || `track-${index}`,
      label: raw.label || raw.id || `Track ${index + 1}`,
      steps,
      loop: (_b = raw.loop) != null ? _b : defaults.loop,
      playInterval: (_c = raw.playInterval) != null ? _c : defaults.playInterval,
      offset: (_d = raw.offset) != null ? _d : 0
    };
  }
  function normalizeScenario(raw) {
    var _a, _b, _c, _d, _e2, _f, _g, _h;
    const defaults = {
      loop: raw.loop !== false,
      playInterval: (_a = raw.playInterval) != null ? _a : 400,
      defaultMode: raw.defaultMode || "play",
      speed: (_b = raw.speed) != null ? _b : 1,
      tracksPresentation: raw.tracksPresentation || "parallel",
      narration: {
        showOnCanvas: ((_c = raw.narration) == null ? void 0 : _c.showOnCanvas) === true,
        position: ((_d = raw.narration) == null ? void 0 : _d.position) || "top-left",
        maxWidth: (_f = (_e2 = raw.narration) == null ? void 0 : _e2.maxWidth) != null ? _f : 320
      }
    };
    let tracks;
    if ((_g = raw.tracks) == null ? void 0 : _g.length) {
      tracks = raw.tracks.map((t, i) => normalizeTrack(t, i, defaults));
    } else if ((_h = raw.steps) == null ? void 0 : _h.length) {
      tracks = [normalizeTrack({ id: "main", label: "Principal", steps: raw.steps }, 0, defaults)];
    } else {
      throw new Error("FlowGraph: scenario.steps or scenario.tracks is required");
    }
    return { ...defaults, tracks, steps: tracks[0].steps };
  }
  var FlowPlayer = class {
    constructor(track, scenario, hooks = {}) {
      this.track = track;
      this.scenario = scenario;
      this.hooks = hooks;
      this.stepIndex = 0;
      this.playing = false;
      this._playTimer = null;
      this.atNodeId = null;
      this.speed = 1;
    }
    get trackId() {
      return this.track.id;
    }
    get steps() {
      return this.track.steps;
    }
    peek() {
      return this.steps[this.stepIndex] || null;
    }
    reset() {
      this.stepIndex = 0;
      this.atNodeId = null;
      this.stopPlay();
    }
    stopPlay() {
      this.playing = false;
      if (this._playTimer) clearTimeout(this._playTimer);
      this._playTimer = null;
    }
    startPlay(delayMs = 0) {
      if (this.playing) return;
      this.playing = true;
      this._playTimer = setTimeout(() => this._scheduleNextPlay(), this._scaled(delayMs));
    }
    _scaled(ms) {
      return Math.max(0, ms / (this.speed || 1));
    }
    _scheduleNextPlay() {
      if (!this.playing) return;
      this.runNext(false).then((step) => {
        var _a, _b;
        if (!this.playing) return;
        if (!step) {
          const canLoop = this.track.loop && !this._forceNoLoop;
          if (canLoop) {
            this.stepIndex = 0;
            this._playTimer = setTimeout(
              () => this._scheduleNextPlay(),
              this._scaled(this.track.playInterval)
            );
          } else {
            this.playing = false;
            (_b = (_a = this.hooks).onTrackEnd) == null ? void 0 : _b.call(_a, this.trackId);
          }
          return;
        }
        const extra = step.kind === "wait" ? step.ms || 0 : this.track.playInterval;
        this._playTimer = setTimeout(() => this._scheduleNextPlay(), this._scaled(extra));
      });
    }
    async runNext(manual = false) {
      var _a, _b, _c, _d;
      if (this.stepIndex >= this.steps.length) {
        const canLoop = this.track.loop && !this._forceNoLoop && !manual;
        if (canLoop) {
          this.stepIndex = 0;
        } else {
          if (!manual) (_b = (_a = this.hooks).onTrackEnd) == null ? void 0 : _b.call(_a, this.trackId);
          return null;
        }
      }
      const step = this.steps[this.stepIndex];
      this.stepIndex += 1;
      await this._execute(step, manual);
      (_d = (_c = this.hooks).onStep) == null ? void 0 : _d.call(_c, step, this.trackId);
      return step;
    }
    async runPrev() {
      if (this.stepIndex <= 1) return null;
      this.stepIndex -= 2;
      return this.runNext(true);
    }
    async _execute(step, manual) {
      var _a, _b, _c, _d;
      const stepIndex = this.stepIndex - 1;
      if (step.kind !== "parallel") {
        (_b = (_a = this.hooks).onStepStart) == null ? void 0 : _b.call(_a, step, manual, this.trackId, { stepIndex, subIndex: -1 });
      }
      await this._executeCore(step, manual);
      if (step.kind !== "parallel") {
        this._emitNarration(step);
        (_d = (_c = this.hooks).onStep) == null ? void 0 : _d.call(_c, step, this.trackId);
      }
    }
    _emitNarration(step) {
      var _a, _b, _c, _d;
      if (!((_b = (_a = this.hooks).shouldNarrate) == null ? void 0 : _b.call(_a))) return;
      if (!step.title && !step.description) return;
      (_d = (_c = this.hooks).onNarration) == null ? void 0 : _d.call(_c, step.title, step.description, this.trackId);
    }
    async _executeCore(step, manual) {
      var _a, _b, _c, _d, _e2, _f, _g, _h, _i, _j, _k, _l;
      switch (step.kind) {
        case "travel":
          await ((_b = (_a = this.hooks).travel) == null ? void 0 : _b.call(_a, step, manual, this.trackId));
          break;
        case "dwell":
          await ((_d = (_c = this.hooks).dwell) == null ? void 0 : _d.call(_c, step, manual, this.trackId));
          break;
        case "parallel":
          await this._executeParallel(step, manual);
          break;
        case "setPill":
          (_f = (_e2 = this.hooks).setPill) == null ? void 0 : _f.call(_e2, step, this.trackId);
          break;
        case "setEffect":
          (_h = (_g = this.hooks).setEffect) == null ? void 0 : _h.call(_g, step, this.trackId);
          break;
        case "wait":
          if (!manual && step.ms > 0) await this._sleep(step.ms);
          break;
        case "focus":
          (_j = (_i = this.hooks).focus) == null ? void 0 : _j.call(_i, step, this.trackId);
          break;
        case "narrate":
          if (!manual && step.ms > 0 && !((_l = (_k = this.hooks).shouldSkipNarratePause) == null ? void 0 : _l.call(_k))) {
            await this._sleep(step.ms);
          }
          break;
        default:
          break;
      }
    }
    async _executeParallel(step, manual) {
      var _a, _b, _c, _d, _e2, _f;
      const items = step.parallel;
      const sequential = (_b = (_a = this.hooks).shouldSequentialParallel) == null ? void 0 : _b.call(_a);
      const stepIndex = this.stepIndex - 1;
      if (sequential) {
        for (let i = 0; i < items.length; i++) {
          const sub = items[i];
          if (sub.delay) await this._sleep(sub.delay);
          (_d = (_c = this.hooks).onStepStart) == null ? void 0 : _d.call(_c, sub, manual, this.trackId, {
            stepIndex,
            subIndex: i,
            parallel: true
          });
          await this._executeCore(sub, manual);
          this._emitNarration(sub);
          (_f = (_e2 = this.hooks).onStep) == null ? void 0 : _f.call(_e2, sub, this.trackId);
          if (!manual && i < items.length - 1) await this._sleep(220);
        }
        return;
      }
      await Promise.all(items.map(async (sub) => {
        const delay = sub.delay || 0;
        await this._sleep(delay);
        return this._execute(sub, manual);
      }));
    }
    _sleep(ms) {
      return new Promise((r) => setTimeout(r, this._scaled(ms)));
    }
  };
  var MultiTrackPlayer = class {
    constructor(config, hooks) {
      var _a;
      this.config = config;
      this.scenario = config.scenario;
      this.hooks = {
        ...hooks,
        onTrackEnd: (trackId) => {
          var _a2;
          if (this._narrativeSequential) this._advanceNarrativeTrack();
          (_a2 = hooks.onTrackEnd) == null ? void 0 : _a2.call(hooks, trackId);
        }
      };
      this.players = this.scenario.tracks.map(
        (track) => new FlowPlayer(track, this.scenario, this.hooks)
      );
      this.activeTrackId = ((_a = this.players[0]) == null ? void 0 : _a.trackId) || "main";
      this.narrativeTrackIndex = 0;
      this.speed = this.scenario.speed || 1;
      this._narrativePlaying = false;
    }
    get tracks() {
      return this.scenario.tracks;
    }
    player(id) {
      return this.players.find((p2) => p2.trackId === id);
    }
    activePlayer() {
      return this.player(this.activeTrackId) || this.players[0];
    }
    setSpeed(s) {
      this.speed = s;
      this.players.forEach((p2) => {
        p2.speed = s;
      });
    }
    reset() {
      var _a, _b;
      this.players.forEach((p2) => p2.reset());
      this.narrativeTrackIndex = 0;
      this._narrativeSequential = false;
      (_b = (_a = this.hooks).onReset) == null ? void 0 : _b.call(_a);
    }
    stopAll() {
      this.players.forEach((p2) => p2.stopPlay());
      this._narrativeSequential = false;
    }
    startParallel() {
      this.stopAll();
      this.players.forEach((p2) => {
        p2.speed = this.speed;
        p2.startPlay(p2.track.offset || 0);
      });
    }
    startNarrativeSequential() {
      this.stopAll();
      this._narrativeSequential = true;
      this._narrativeTrackIndex = 0;
      this._startNarrativeTrack(0);
    }
    _startNarrativeTrack(index) {
      const p2 = this.players[index];
      if (!p2) {
        if (this.scenario.loop) {
          this._startNarrativeTrack(0);
        } else {
          this._narrativeSequential = false;
        }
        return;
      }
      this.narrativeTrackIndex = index;
      this.activeTrackId = p2.trackId;
      p2.reset();
      p2._forceNoLoop = true;
      p2.speed = this.speed;
      p2.startPlay(p2.track.offset || 0);
    }
    _advanceNarrativeTrack() {
      if (!this._narrativeSequential) return;
      this._startNarrativeTrack(this.narrativeTrackIndex + 1);
    }
    async stepNext() {
      return this.activePlayer().runNext(true);
    }
    async stepPrev() {
      return this.activePlayer().runPrev();
    }
  };

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
    controls: {
      toolbar: true,
      playPause: true,
      zoomReset: true,
      reset: true,
      layout: false,
      step: true,
      fullscreen: true,
      metricsDrawer: false,
      speed: true
    },
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
  var VALID_ROUTING = /* @__PURE__ */ new Set(["bezier", "straight", "loopback", "orthogonal"]);
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
  function normalizeNode(n, theme) {
    var _a;
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
      pillBottom: normalizePills(n.pillBottom),
      metrics: n.metrics ? {
        queue: n.metrics.queue ? { max: (_a = n.metrics.queue.max) != null ? _a : null } : null,
        count: n.metrics.count === true
      } : null
    };
  }
  function normalizeEdge(e, theme) {
    var _a, _b, _c, _d, _e2;
    const routing = e.routing || "bezier";
    if (!VALID_ROUTING.has(routing)) {
      throw new Error(`FlowGraph: unknown routing "${routing}" on edge "${e.id || `${e.from}-${e.to}`}"`);
    }
    const strokeRaw = e.stroke || {};
    const dashMap = { solid: null, dash: "6 4", dot: "2 3" };
    const dashVal = strokeRaw.dash;
    const dash = dashVal == null ? null : dashMap[dashVal] || dashVal;
    return {
      id: edgeId(e.from, e.to, e.id),
      from: e.from,
      to: e.to,
      routing,
      loopSide: e.loopSide || null,
      speed: (_a = e.speed) != null ? _a : null,
      animated: e.animated === true,
      stroke: {
        color: resolveColor(strokeRaw.color || e.color, theme),
        width: (_c = (_b = strokeRaw.width) != null ? _b : e.width) != null ? _c : 2,
        dash
      },
      label: e.label ? typeof e.label === "string" ? { text: e.label, icon: null, animated: false, progress: null, position: "above" } : {
        text: e.label.text || null,
        icon: e.label.icon || null,
        animated: e.label.animated,
        progress: (_d = e.label.progress) != null ? _d : null,
        position: e.label.position || "above",
        offset: (_e2 = e.label.offset) != null ? _e2 : null
      } : null,
      token: normalizeToken(e.token, theme)
    };
  }
  function normalizeTokenTypes(raw, theme, tokenDefault) {
    const types = { default: { ...tokenDefault } };
    if (!raw) return types;
    Object.entries(raw).forEach(([key, val]) => {
      types[key] = normalizeToken({ ...tokenDefault, ...val }, theme) || { ...tokenDefault };
    });
    return types;
  }
  function parseConfig(raw) {
    var _a, _b;
    if (!raw || !raw.nodes || !raw.edges) {
      throw new Error("FlowGraph: config requires nodes[] and edges[]");
    }
    if (!raw.scenario) {
      throw new Error("FlowGraph: config requires scenario (v2 visual format)");
    }
    const theme = { ...DEFAULTS.theme, ...raw.theme || {} };
    const viewport = { ...DEFAULTS.viewport, ...raw.viewport || {} };
    if ((_a = raw.viewport) == null ? void 0 : _a.background) {
      viewport.background = { ...DEFAULTS.viewport.background || {}, ...raw.viewport.background };
    }
    const zoom = { ...DEFAULTS.zoom, ...raw.zoom || {} };
    const layout = { ...DEFAULTS.layout, ...raw.layout || {} };
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
    const tokenTypes = normalizeTokenTypes(raw.tokenTypes, theme, tokenDefault);
    const scenario = normalizeScenario(raw.scenario);
    return {
      title: raw.title || null,
      viewport,
      zoom,
      theme,
      layout,
      tokenDefault,
      tokenTypes,
      scenario,
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
      incoming
    };
  }
  function resolveTokenType(config, typeKey, edge) {
    const base = { ...config.tokenTypes.default || config.tokenDefault };
    if (typeKey && config.tokenTypes[typeKey]) Object.assign(base, config.tokenTypes[typeKey]);
    if (edge == null ? void 0 : edge.token) Object.assign(base, edge.token);
    if (base.color) base.color = resolveColor(base.color, config.theme);
    return base;
  }

  // src/edge-orthogonal.js
  var LANE_GAP = 20;
  function nodeBounds(node) {
    const { w: w2, h } = node.size;
    const hw = w2 / 2;
    if (node.shape === "circle") return { hw, hh: hw };
    return { hw, hh: h / 2 };
  }
  function boundaryOnSide(node, side, lane = 0) {
    const { hw, hh } = nodeBounds(node);
    switch (side) {
      case "right":
        return { x: node.x + hw, y: node.y + lane, side };
      case "left":
        return { x: node.x - hw, y: node.y + lane, side };
      case "top":
        return { x: node.x + lane, y: node.y - hh, side };
      case "bottom":
        return { x: node.x + lane, y: node.y + hh, side };
      default:
        return { x: node.x + hw, y: node.y + lane, side: "right" };
    }
  }
  function pickSides(fromNode, toNode) {
    const dx = toNode.x - fromNode.x;
    const dy = toNode.y - fromNode.y;
    if (Math.abs(dx) >= Math.abs(dy) * 0.65) {
      return dx >= 0 ? { exit: "right", enter: "left" } : { exit: "left", enter: "right" };
    }
    return dy >= 0 ? { exit: "bottom", enter: "top" } : { exit: "top", enter: "bottom" };
  }
  function isHorizontalSide(side) {
    return side === "left" || side === "right";
  }
  function buildOrthogonalPoints(fromNode, toNode, anchorOff = {}) {
    const lane = anchorOff.lane || 0;
    const sides = pickSides(fromNode, toNode);
    const p0 = boundaryOnSide(fromNode, sides.exit, isHorizontalSide(sides.exit) ? lane : 0);
    const p3 = boundaryOnSide(toNode, sides.enter, isHorizontalSide(sides.enter) ? lane : 0);
    const pts = [p0];
    if (sides.exit === "right" && sides.enter === "left") {
      const midX = (p0.x + p3.x) / 2 + lane * 0.2;
      if (Math.abs(p0.y - p3.y) < 4) {
        if (lane !== 0) {
          pts.push({ x: p0.x + 16, y: p0.y }, { x: p0.x + 16, y: p0.y + lane }, { x: p3.x - 16, y: p0.y + lane }, { x: p3.x - 16, y: p3.y });
        } else {
          pts.push({ x: p3.x, y: p0.y });
        }
      } else {
        pts.push({ x: midX, y: p0.y }, { x: midX, y: p3.y });
      }
      pts.push(p3);
      return pts;
    }
    if (sides.exit === "left" && sides.enter === "right") {
      const midX = (p0.x + p3.x) / 2 - lane * 0.2;
      if (Math.abs(p0.y - p3.y) < 4) {
        if (lane !== 0) {
          pts.push({ x: p0.x - 16, y: p0.y }, { x: p0.x - 16, y: p0.y + lane }, { x: p3.x + 16, y: p0.y + lane }, { x: p3.x + 16, y: p3.y });
        } else {
          pts.push({ x: p3.x, y: p0.y });
        }
      } else {
        pts.push({ x: midX, y: p0.y }, { x: midX, y: p3.y });
      }
      pts.push(p3);
      return pts;
    }
    if (sides.exit === "bottom" && sides.enter === "top") {
      const midY = p0.y + Math.max(40, (p3.y - p0.y) * 0.45) + lane * 0.35;
      if (Math.abs(p0.x - p3.x) < 4) {
        pts.push({ x: p0.x, y: p3.y });
      } else {
        pts.push({ x: p0.x, y: midY }, { x: p3.x, y: midY });
      }
      pts.push(p3);
      return pts;
    }
    if (sides.exit === "top" && sides.enter === "bottom") {
      const midY = p0.y - Math.max(40, (p0.y - p3.y) * 0.45) - lane * 0.35;
      if (Math.abs(p0.x - p3.x) < 4) {
        pts.push({ x: p0.x, y: p3.y });
      } else {
        pts.push({ x: p0.x, y: midY }, { x: p3.x, y: midY });
      }
      pts.push(p3);
      return pts;
    }
    if (isHorizontalSide(sides.exit)) {
      pts.push({ x: p3.x, y: p0.y });
    } else {
      pts.push({ x: p0.x, y: p3.y });
    }
    pts.push(p3);
    return pts;
  }
  function polylineToPath(points) {
    if (!points.length) return "";
    return points.map((p2, i) => `${i === 0 ? "M" : "L"} ${p2.x} ${p2.y}`).join(" ");
  }
  function polylineLength(points) {
    let len = 0;
    for (let i = 1; i < points.length; i++) {
      len += Math.hypot(points[i].x - points[i - 1].x, points[i].y - points[i - 1].y);
    }
    return len;
  }
  function pointOnPolyline(points, t) {
    var _a, _b;
    const total = polylineLength(points);
    if (total < 1) return { x: ((_a = points[0]) == null ? void 0 : _a.x) || 0, y: ((_b = points[0]) == null ? void 0 : _b.y) || 0, angle: 0, segment: 0 };
    const target = Math.max(0, Math.min(1, t)) * total;
    let acc = 0;
    for (let i = 1; i < points.length; i++) {
      const a = points[i - 1];
      const b = points[i];
      const segLen = Math.hypot(b.x - a.x, b.y - a.y);
      if (acc + segLen >= target) {
        const u = segLen > 0 ? (target - acc) / segLen : 0;
        const x2 = a.x + (b.x - a.x) * u;
        const y = a.y + (b.y - a.y) * u;
        const angle = Math.abs(b.x - a.x) >= Math.abs(b.y - a.y) ? 0 : Math.PI / 2;
        return { x: x2, y, angle, segment: i - 1, horizontal: Math.abs(b.y - a.y) < 1 };
      }
      acc += segLen;
    }
    const last = points[points.length - 1];
    return { x: last.x, y: last.y, angle: 0, segment: points.length - 2, horizontal: true };
  }
  function labelOnPolyline(points, lane = 0) {
    let best = null;
    let bestLen = 0;
    for (let i = 1; i < points.length; i++) {
      const a = points[i - 1];
      const b = points[i];
      const len = Math.hypot(b.x - a.x, b.y - a.y);
      const horizontal = Math.abs(b.y - a.y) < 2;
      if (horizontal && len > bestLen) {
        bestLen = len;
        best = {
          x: (a.x + b.x) / 2,
          y: (a.y + b.y) / 2 - 12 - lane * 0.15,
          angle: 0
        };
      }
    }
    if (best) return best;
    return pointOnPolyline(points, 0.5);
  }
  function computeOrthogonalLanes(edges, nodesById) {
    const fromGroups = {};
    const offsets = {};
    edges.forEach((edge) => {
      if (edge.routing !== "orthogonal") return;
      const fromNode = nodesById[edge.from];
      const toNode = nodesById[edge.to];
      if (!fromNode || !toNode) return;
      const key = `${edge.from}:${edge.routing}`;
      if (!fromGroups[key]) fromGroups[key] = [];
      fromGroups[key].push({ edge, angle: Math.atan2(toNode.y - fromNode.y, toNode.x - fromNode.x) });
      if (!offsets[edge.id]) offsets[edge.id] = {};
      offsets[edge.id].lane = 0;
    });
    Object.values(fromGroups).forEach((group) => {
      if (group.length <= 1) return;
      group.sort((a, b) => a.angle - b.angle);
      const n = group.length;
      group.forEach((item, i) => {
        if (!offsets[item.edge.id]) offsets[item.edge.id] = {};
        offsets[item.edge.id].lane = (i - (n - 1) / 2) * LANE_GAP;
      });
    });
    return offsets;
  }

  // src/geometry.js
  init_compose_pills();
  var NS = "http://www.w3.org/2000/svg";
  var ANGLE_SPREAD = 0.16;
  var LATERAL_SPREAD = 18;
  var LABEL_T_SPREAD = 0.14;
  function nodeBounds2(node) {
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
    const { hw, hh } = nodeBounds2(node);
    const cos = Math.cos(angleRad);
    const sin = Math.sin(angleRad);
    if (node.shape === "circle") {
      return { x: node.x + cos * hw, y: node.y + sin * hw };
    }
    return rayRectIntersect(node.x, node.y, cos, sin, hw, hh);
  }
  function computeEdgeAnchorOffsets(edges, nodesById) {
    const orthoLanes = computeOrthogonalLanes(edges, nodesById);
    const fromGroups = {};
    const toGroups = {};
    const offsets = { ...orthoLanes };
    edges.forEach((edge) => {
      const fromNode = nodesById[edge.from];
      const toNode = nodesById[edge.to];
      if (!fromNode || !toNode) return;
      if (edge.routing === "orthogonal") return;
      const angle = Math.atan2(toNode.y - fromNode.y, toNode.x - fromNode.x);
      const kf = `${edge.from}:out`;
      const kt2 = `${edge.to}:in`;
      if (!fromGroups[kf]) fromGroups[kf] = [];
      if (!toGroups[kt2]) toGroups[kt2] = [];
      fromGroups[kf].push({ edge, angle });
      toGroups[kt2].push({ edge, angle });
      if (!offsets[edge.id]) {
        offsets[edge.id] = { fromAngle: 0, toAngle: 0, labelT: 0.5, lateral: 0, loopScale: 1, lane: 0 };
      }
    });
    function spreadAngle(groups, field) {
      Object.values(groups).forEach((group) => {
        if (group.length <= 1) return;
        group.sort((a, b) => a.angle - b.angle);
        const n = group.length;
        const angleStep = Math.min(0.32, ANGLE_SPREAD + (n - 2) * 0.04);
        group.forEach((item, i) => {
          const delta = (i - (n - 1) / 2) * angleStep;
          offsets[item.edge.id][field] = delta;
          if (field === "fromAngle") {
            const lat = (i - (n - 1) / 2) * LATERAL_SPREAD;
            offsets[item.edge.id].lateral = lat;
            offsets[item.edge.id].loopScale = 1 + Math.abs(i - (n - 1) / 2) * 0.24;
            offsets[item.edge.id].labelT = 0.28 + i / Math.max(1, n - 1) * LABEL_T_SPREAD;
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
  function loopbackControls(p0, p3, fromNode, toNode, loopSide, lateral = 0, loopScale = 1) {
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
    const bulge = Math.max(52, len * 0.32 + 42) * loopScale;
    const latShift = lateral * 0.4;
    const p1 = {
      x: p0.x + nx * (bulge * 0.55 + latShift) + dx * 0.12,
      y: p0.y + ny * (bulge * 0.55 + latShift) + dy * 0.12
    };
    const p2 = {
      x: p3.x + nx * (bulge * 0.55 + latShift) - dx * 0.12,
      y: p3.y + ny * (bulge * 0.55 + latShift) - dy * 0.12
    };
    return { p0, p1, p2, p3 };
  }
  function forwardControls(p0, p3, angleOut, angleIn, lateral = 0) {
    const dx = p3.x - p0.x;
    const dy = p3.y - p0.y;
    const dist = Math.hypot(dx, dy) || 1;
    const cpOffset = Math.min(dist * 0.45, 90);
    const perpX = -Math.sin(angleOut) * lateral;
    const perpY = Math.cos(angleOut) * lateral;
    const blend = 0.6;
    return {
      p0,
      p1: {
        x: p0.x + Math.cos(angleOut) * cpOffset + perpX * blend,
        y: p0.y + Math.sin(angleOut) * cpOffset + perpY * blend
      },
      p2: {
        x: p3.x + Math.cos(angleIn) * cpOffset + perpX * blend,
        y: p3.y + Math.sin(angleIn) * cpOffset + perpY * blend
      },
      p3
    };
  }
  function edgePathControls(fromNode, toNode, routing, anchorOffsets, loopSide) {
    const off = anchorOffsets || { fromAngle: 0, toAngle: 0 };
    if (routing === "orthogonal") {
      const points = buildOrthogonalPoints(fromNode, toNode, off);
      return { kind: "polyline", points };
    }
    if (routing === "loopback") {
      const baseAngle2 = Math.atan2(toNode.y - fromNode.y, toNode.x - fromNode.x);
      const angleOut2 = baseAngle2 + (off.fromAngle || 0);
      const angleIn2 = baseAngle2 + Math.PI + (off.toAngle || 0);
      const p02 = boundaryPointAtAngle(fromNode, angleOut2);
      const p32 = boundaryPointAtAngle(toNode, angleIn2);
      return {
        kind: "cubic",
        ...loopbackControls(p02, p32, fromNode, toNode, loopSide, off.lateral || 0, off.loopScale || 1)
      };
    }
    const baseAngle = Math.atan2(toNode.y - fromNode.y, toNode.x - fromNode.x);
    const angleOut = baseAngle + (off.fromAngle || 0);
    const angleIn = baseAngle + Math.PI + (off.toAngle || 0);
    const p0 = boundaryPointAtAngle(fromNode, angleOut);
    const p3 = boundaryPointAtAngle(toNode, angleIn);
    if (routing === "straight") {
      return { kind: "line", p0, p3 };
    }
    return { kind: "cubic", ...forwardControls(p0, p3, angleOut, angleIn, off.lateral || 0) };
  }
  function buildEdgePath(fromNode, toNode, routing, anchorOffsets, loopSide) {
    const ctrl = edgePathControls(fromNode, toNode, routing, anchorOffsets, loopSide);
    if (ctrl.kind === "polyline") return polylineToPath(ctrl.points);
    if (ctrl.kind === "line") return `M ${ctrl.p0.x} ${ctrl.p0.y} L ${ctrl.p3.x} ${ctrl.p3.y}`;
    return `M ${ctrl.p0.x} ${ctrl.p0.y} C ${ctrl.p1.x} ${ctrl.p1.y}, ${ctrl.p2.x} ${ctrl.p2.y}, ${ctrl.p3.x} ${ctrl.p3.y}`;
  }
  function edgePathSamplePoints(fromNode, toNode, routing, anchorOffsets, loopSide) {
    const ctrl = edgePathControls(fromNode, toNode, routing, anchorOffsets, loopSide);
    if (ctrl.kind === "polyline") return ctrl.points;
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
        return { x: pt.x + nx * off, y: pt.y + ny * off, angle: Math.atan2(dy, dx) };
      case "left":
        return { x: pt.x - dx / mag * off, y: pt.y - dy / mag * off, angle: Math.atan2(dy, dx) };
      case "right":
        return { x: pt.x + dx / mag * off, y: pt.y + dy / mag * off, angle: Math.atan2(dy, dx) };
      case "center":
        return { x: pt.x, y: pt.y, angle: Math.atan2(dy, dx) };
      case "above":
      default:
        return { x: pt.x - nx * off, y: pt.y - ny * off, angle: Math.atan2(dy, dx) };
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
      const { hw, hh } = nodeBounds2(n);
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
      const { hw, hh } = nodeBounds2(n);
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
      getTransform: () => ({ scale: state.scale, tx: state.tx, ty: state.ty }),
      focusOnNodes(fromId, toId, nodesById, padding = 48) {
        const ids = [fromId, toId].filter(Boolean);
        const nodes = ids.map((id) => nodesById[id]).filter(Boolean);
        if (!nodes.length) return;
        let minX = Infinity;
        let minY = Infinity;
        let maxX = -Infinity;
        let maxY = -Infinity;
        nodes.forEach((n) => {
          minX = Math.min(minX, n.x - 36);
          maxX = Math.max(maxX, n.x + 36);
          minY = Math.min(minY, n.y - 36);
          maxY = Math.max(maxY, n.y + 36);
        });
        const bx = minX - padding;
        const by = minY - padding;
        const bw = maxX - minX + padding * 2;
        const bh = maxY - minY + padding * 2;
        const rect = svg.getBoundingClientRect();
        if (!rect.width || !rect.height || !bw || !bh) return;
        const sx = rect.width / bw;
        const sy = rect.height / bh;
        state.scale = Math.min(sx, sy, zoomCfg.max || 2.5);
        state.scale = Math.max(state.scale, zoomCfg.min || 0.4);
        state.tx = (rect.width - bw * state.scale) / 2 - bx * state.scale;
        state.ty = (rect.height - bh * state.scale) / 2 - by * state.scale;
        applyTransform(state.scale, state.tx, state.ty);
      }
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
      const off = anchorOffsets[edge.id] || { fromAngle: 0, toAngle: 0, labelT: 0.5, lane: 0 };
      const ctrl = edgePathControls(fromNode, toNode, edge.routing, off, edge.loopSide);
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
      edgeViews[edge.id] = { g, path, labelGroup, edge, anchorOff: off, ctrl };
    });
    function updateLabels() {
      Object.values(edgeViews).forEach(({ path, labelGroup, edge, anchorOff, ctrl }) => {
        if (!labelGroup || !edge.label) return;
        if (edge.routing === "orthogonal" && (ctrl == null ? void 0 : ctrl.kind) === "polyline") {
          const pos2 = labelOnPolyline(ctrl.points, (anchorOff == null ? void 0 : anchorOff.lane) || 0);
          labelGroup.g.setAttribute("transform", `translate(${pos2.x},${pos2.y})`);
          return;
        }
        const t = 0.5;
        const baseOff = edge.label.offset != null ? edge.label.offset : 18;
        const posLabel = edge.label.position === "center" ? "above" : edge.label.position || "above";
        const pos = labelPosition(path, posLabel, baseOff, t);
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
          view.ctrl = edgePathControls(fromNode, toNode, edge.routing, off, edge.loopSide);
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
      setStepActive(edgeId2, active) {
        const view = edgeViews[edgeId2];
        if (!view) return;
        view.g.classList.toggle("fg-edge-step-active", !!active);
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
    return { shell, topSlot, bottomSlot };
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
      const { shell, topSlot, bottomSlot } = buildNodeContent(node);
      const fo = document.createElementNS(NS3, "foreignObject");
      fo.setAttribute("x", String(-w2 / 2 - chrome.left));
      fo.setAttribute("y", String(-h / 2 - chrome.top));
      fo.setAttribute("width", String(w2 + chrome.left + chrome.right));
      fo.setAttribute("height", String(h + chrome.top + chrome.bottom));
      fo.setAttribute("class", "fg-node-fo");
      fo.appendChild(shell);
      g.appendChild(fo);
      nodesLayer.appendChild(g);
      nodeViews[node.id] = { g, shape, fo, node, topSlot, bottomSlot };
    });
    return {
      nodeViews,
      setPillsTop(nodeId, pills) {
        const view = nodeViews[nodeId];
        if (!view) return;
        view.topSlot.innerHTML = "";
        (pills || []).forEach((p2) => view.topSlot.appendChild(renderPillEl(p2, "top")));
        if (typeof window !== "undefined" && window.lucide) {
          window.lucide.createIcons({ nodes: view.topSlot.querySelectorAll("[data-lucide]") });
        }
      },
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
        view.g.classList.remove("fg-effect-pulse", "fg-effect-blink", "fg-effect-processing", "fg-effect-waiting", "fg-effect-active", "fg-effect-open");
        if (effect) view.g.classList.add(`fg-effect-${effect}`);
      },
      setActive(nodeId, active) {
        const view = nodeViews[nodeId];
        if (!view) return;
        view.g.classList.toggle("fg-node-active", !!active);
      },
      setStepActive(nodeId, active) {
        const view = nodeViews[nodeId];
        if (!view) return;
        view.g.classList.toggle("fg-node-step-active", !!active);
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
    shapeEl.setAttribute("fill", tokenCfg.color || "#7C3AED");
  }
  function addTokenLabel(inner, text, size) {
    let labelEl = inner.querySelector(".fg-token-label");
    if (!labelEl) {
      labelEl = document.createElementNS(NS4, "text");
      labelEl.setAttribute("class", "fg-token-label");
      labelEl.setAttribute("text-anchor", "middle");
      labelEl.setAttribute("dominant-baseline", "central");
      inner.appendChild(labelEl);
    }
    const fontSize = Math.max(6, Math.round(size * 0.85));
    labelEl.setAttribute("font-size", String(fontSize));
    labelEl.setAttribute("fill", "#fff");
    labelEl.textContent = text;
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
    if (tokenCfg.label) {
      addTokenLabel(inner, tokenCfg.label, size);
    }
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
    const label = inner.querySelector(".fg-token-label");
    if (tokenCfg.label) {
      addTokenLabel(inner, tokenCfg.label, tokenCfg.size || 7);
    } else if (label) {
      label.remove();
    }
  }
  function placeTokenAt(token, t) {
    const progress = token.reverse ? 1 - t : t;
    const pt = pathPointAt(token.path, progress);
    let angle = pt.angle;
    if (token.reverse) angle += Math.PI;
    token.el.setAttribute("transform", `translate(${pt.x},${pt.y}) rotate(${angle * 180 / Math.PI})`);
  }
  var ParticleSystem = class {
    constructor(layer, edgeRenderer, config) {
      this.layer = layer;
      this.edgeRenderer = edgeRenderer;
      this.config = config;
      this.pool = [];
      this.active = [];
      this.maxParticles = config.maxParticles || 200;
      this.speedMultiplier = 1;
    }
    setSpeedMultiplier(m) {
      this.speedMultiplier = m || 1;
    }
    spawn(options) {
      const { edgeId: edgeId2, tokenCfg, onArrive, delay = 0, reverse = false } = options;
      if (this.active.length >= this.maxParticles) return null;
      const path = this.edgeRenderer.getPath(edgeId2);
      if (!path) return null;
      const id = nextTokenId++;
      const cfg = { ...this.config.tokenDefault, ...tokenCfg };
      const el = this._acquireElement(cfg);
      el.setAttribute("data-token-id", String(id));
      el.style.opacity = "0";
      this.layer.appendChild(el);
      const edge = this.config.edgesById[edgeId2];
      const speed = tokenCfg && tokenCfg.speed || (edge == null ? void 0 : edge.speed) || this.config.tokenDefault.speed || 120;
      const token = {
        id,
        edgeId: edgeId2,
        el,
        tokenCfg: cfg,
        progress: 0,
        delay,
        delayLeft: delay,
        onArrive,
        path,
        done: false,
        speed,
        reverse: !!reverse
      };
      placeTokenAt(token, 0);
      this.active.push(token);
      this.edgeRenderer.setActive(edgeId2, true, token.tokenCfg.color);
      return token;
    }
    _acquireElement(tokenCfg) {
      if (this.pool.length) {
        const el = this.pool.pop();
        el.className.baseVal = "fg-token";
        updateTokenElement(el, tokenCfg);
        return el;
      }
      return createTokenShape(tokenCfg);
    }
    _release(token) {
      token.el.remove();
      token.el.className.baseVal = "fg-token";
      this.pool.push(token.el);
    }
    update(dt2) {
      const edgeCounts = {};
      const toRemove = [];
      const speedMul = this.speedMultiplier || 1;
      this.active.forEach((token) => {
        if (token.delayLeft > 0) {
          token.delayLeft -= dt2;
          return;
        }
        token.el.style.opacity = "1";
        const pathLen = token.path.getTotalLength() || 1;
        const dist = token.speed * speedMul * (dt2 / 1e3);
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
      this.active.slice().forEach((t) => {
        t.el.remove();
        this.pool.push(t.el);
      });
      this.active = [];
      Object.keys(this.edgeRenderer.edgeViews || {}).forEach((edgeId2) => {
        this.edgeRenderer.setActive(edgeId2, false);
      });
    }
    travel(edgeId2, tokenCfg, reverse = false) {
      return new Promise((resolve) => {
        this.spawn({
          edgeId: edgeId2,
          tokenCfg,
          reverse,
          onArrive: () => resolve()
        });
      });
    }
  };

  // src/node-stats.js
  var NodeStats = class {
    constructor(nodes) {
      this.queue = {};
      this.through = {};
      nodes.forEach((n) => {
        var _a, _b;
        if ((_a = n.metrics) == null ? void 0 : _a.queue) this.queue[n.id] = 0;
        if ((_b = n.metrics) == null ? void 0 : _b.count) this.through[n.id] = 0;
      });
    }
    reset() {
      Object.keys(this.queue).forEach((id) => {
        this.queue[id] = 0;
      });
      Object.keys(this.through).forEach((id) => {
        this.through[id] = 0;
      });
    }
    onArrive(nodeId) {
      if (this.queue[nodeId] !== void 0) this.queue[nodeId] += 1;
      if (this.through[nodeId] !== void 0) this.through[nodeId] += 1;
    }
    onDepart(nodeId) {
      if (this.queue[nodeId] !== void 0) {
        this.queue[nodeId] = Math.max(0, this.queue[nodeId] - 1);
      }
    }
    pillsFor(nodeId, node) {
      var _a;
      if (!(node == null ? void 0 : node.metrics)) return [];
      const pills = [];
      const q2 = this.queue[nodeId];
      if (q2 !== void 0) {
        const max = (_a = node.metrics.queue) == null ? void 0 : _a.max;
        if (max) {
          const tone = q2 >= max ? "danger" : q2 > max * 0.7 ? "warning" : "primary";
          pills.push({
            text: `${q2}/${max}`,
            tone,
            progress: Math.min(1, q2 / max)
          });
        } else {
          pills.push({ text: `q ${q2}`, tone: q2 > 0 ? "warning" : "primary" });
        }
      }
      const t = this.through[nodeId];
      if (t !== void 0) {
        pills.push({ text: `\u21B3 ${t}`, tone: "success" });
      }
      return pills;
    }
    hasAutoMetrics() {
      return Object.keys(this.queue).length > 0 || Object.keys(this.through).length > 0;
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
    "circle-x": '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="m15 9-6 6M9 9l6 6"/></svg>',
    "skip-forward": '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M5 5v14l8-7-8-7zM19 5v14"/></svg>',
    "footprints": '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 16v2h4v-2H4zM10 8V6H6v2h4zM16 12v-2h-4v2h4zM19 16v2h-4v-2h4z"/></svg>',
    "chevron-up": '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m18 15-6-6-6 6"/></svg>',
    "chevron-down": '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m6 9 6 6 6-6"/></svg>',
    "minimize-2": '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 14h6v6M20 10h-6V4M14 10l7-7M3 21l7-7"/></svg>',
    "grip-horizontal": '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="5" cy="12" r="1"/><circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/></svg>'
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

  // src/ui/step-controls.js
  var SPEEDS = [1, 1.5, 2, 3, 5];
  function updateModeButtons(instance) {
    var _a;
    const mode = instance.playbackMode || "play";
    (_a = instance._modeBtns) == null ? void 0 : _a.forEach((btn) => {
      const active = btn.dataset.mode === mode;
      btn.setAttribute("aria-pressed", active ? "true" : "false");
      btn.classList.toggle("fg-btn-mode-active", active);
    });
    if (instance._speedWrap) {
      instance._speedWrap.hidden = mode === "narrative";
    }
  }
  function mountModeControls(cluster, instance, config) {
    var _a, _b;
    if (((_a = config.controls) == null ? void 0 : _a.step) === false) return;
    const wrap = document.createElement("div");
    wrap.className = "fg-mode-switch";
    wrap.setAttribute("role", "group");
    wrap.setAttribute("aria-label", "Modo de reprodu\xE7\xE3o");
    const modes = [
      { id: "play", label: "Anima\xE7\xE3o cont\xEDnua", icon: "play" },
      { id: "narrative", label: "Modo narrativa", icon: "book-open" },
      { id: "step", label: "Passo a passo", icon: "footprints" }
    ];
    instance._modeBtns = [];
    modes.forEach((m) => {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "fg-btn fg-btn-mode";
      btn.dataset.mode = m.id;
      btn.setAttribute("aria-label", m.label);
      btn.innerHTML = iconMarkup(m.icon);
      btn.addEventListener("click", (e) => {
        e.stopPropagation();
        if (instance.playbackMode === m.id) return;
        instance.setPlaybackMode(m.id);
        if (m.id === "step" && !instance.running) instance.start();
        if (m.id !== "step" && instance.running && !instance.player.players.some((p2) => p2.playing)) {
          instance._startAutoPlayback();
        }
      });
      wrap.appendChild(btn);
      instance._modeBtns.push(btn);
    });
    cluster.appendChild(wrap);
    if (((_b = config.controls) == null ? void 0 : _b.speed) !== false) {
      const speedWrap = document.createElement("div");
      speedWrap.className = "fg-speed-wrap";
      const sel = document.createElement("select");
      sel.className = "fg-speed-select";
      sel.setAttribute("aria-label", "Velocidade da anima\xE7\xE3o");
      SPEEDS.forEach((s) => {
        const opt = document.createElement("option");
        opt.value = String(s);
        opt.textContent = `${s}\xD7`;
        sel.appendChild(opt);
      });
      sel.value = String(instance.playSpeed || 1);
      sel.addEventListener("change", (e) => {
        e.stopPropagation();
        instance.setPlaySpeed(parseFloat(sel.value, 10));
      });
      speedWrap.appendChild(sel);
      cluster.appendChild(speedWrap);
      instance._speedWrap = speedWrap;
      instance._speedSelect = sel;
    }
    hydrateIcons(wrap);
    updateModeButtons(instance);
  }

  // src/ui/fullscreen.js
  function onEsc(instance, e) {
    if (e.key === "Escape") closeFullscreen(instance);
  }
  function openFullscreen(instance) {
    if (instance._fullscreenOpen) return;
    const { container, root } = instance;
    const overlay = document.createElement("div");
    overlay.className = "fg-fullscreen-overlay";
    const shell = document.createElement("div");
    shell.className = "fg-fullscreen-shell";
    const closeBtn = document.createElement("button");
    closeBtn.type = "button";
    closeBtn.className = "fg-btn fg-fullscreen-close";
    closeBtn.setAttribute("aria-label", "Fechar tela cheia");
    closeBtn.innerHTML = iconMarkup("circle-x");
    closeBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      closeFullscreen(instance);
    });
    const placeholder = document.createElement("div");
    placeholder.className = "fg-fullscreen-placeholder";
    placeholder.hidden = true;
    container.insertBefore(placeholder, root);
    shell.appendChild(closeBtn);
    shell.appendChild(root);
    overlay.appendChild(shell);
    document.body.appendChild(overlay);
    const prevHeight = root.style.height;
    const prevMinHeight = root.style.minHeight;
    root.style.height = "100%";
    root.style.minHeight = "0";
    root.classList.add("fg-fullscreen-root");
    document.body.classList.add("fg-fullscreen-active");
    instance._fullscreenOpen = true;
    instance._fullscreenState = { overlay, shell, placeholder, prevHeight, prevMinHeight };
    overlay.addEventListener("click", (e) => {
      if (e.target === overlay) closeFullscreen(instance);
    });
    document.addEventListener("keydown", instance._fsEsc = (e) => onEsc(instance, e));
    if (instance._fullscreenBtn) {
      instance._fullscreenBtn.innerHTML = iconMarkup("minimize-2");
      hydrateIcons(instance._fullscreenBtn);
      instance._fullscreenBtn.setAttribute("aria-label", "Fechar tela cheia");
    }
    requestAnimationFrame(() => instance.fit());
    hydrateIcons(closeBtn);
  }
  function closeFullscreen(instance) {
    const state = instance._fullscreenState;
    if (!state) return;
    const { overlay, placeholder, prevHeight, prevMinHeight } = state;
    const { root, container } = instance;
    container.insertBefore(root, placeholder);
    placeholder.remove();
    overlay.remove();
    root.style.height = prevHeight;
    root.style.minHeight = prevMinHeight;
    root.classList.remove("fg-fullscreen-root");
    document.body.classList.remove("fg-fullscreen-active");
    if (instance._fsEsc) {
      document.removeEventListener("keydown", instance._fsEsc);
      instance._fsEsc = null;
    }
    instance._fullscreenOpen = false;
    instance._fullscreenState = null;
    if (instance._fullscreenBtn) {
      instance._fullscreenBtn.innerHTML = iconMarkup("maximize-2");
      hydrateIcons(instance._fullscreenBtn);
      instance._fullscreenBtn.setAttribute("aria-label", "Expandir diagrama");
    }
    requestAnimationFrame(() => instance.fit());
  }
  function toggleFullscreen(instance) {
    if (instance._fullscreenOpen) closeFullscreen(instance);
    else openFullscreen(instance);
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
    const showToolbar = ctrls.toolbar !== false && (ctrls.playPause !== false || ctrls.step !== false || ctrls.fullscreen !== false || ctrls.zoomReset !== false || ctrls.reset !== false || ctrls.layout);
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
    const modeWrap = document.createElement("div");
    modeWrap.className = "fg-controls-group fg-controls-group-mode";
    cluster.appendChild(modeWrap);
    mountModeControls(modeWrap, instance, config);
    const transportWrap = document.createElement("div");
    transportWrap.className = "fg-controls-group fg-controls-group-transport";
    const viewWrap = document.createElement("div");
    viewWrap.className = "fg-controls-group fg-controls-group-view";
    if (ctrls.playPause !== false) {
      const playBtn = makeBtn("fg-btn", "Play ou pausar anima\xE7\xE3o", "pause");
      playBtn.setAttribute("aria-pressed", "true");
      playBtn.dataset.iconPlay = "play";
      playBtn.dataset.iconPause = "pause";
      playBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        if (instance.running) instance.pause();
        else instance.start();
      });
      transportWrap.appendChild(playBtn);
      instance._playBtn = playBtn;
    }
    if (ctrls.reset !== false) {
      const resetBtn = makeBtn("fg-btn", "Reiniciar anima\xE7\xE3o", "rotate-ccw");
      resetBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        instance.reset();
      });
      transportWrap.appendChild(resetBtn);
    }
    if (transportWrap.childElementCount) cluster.appendChild(transportWrap);
    if (ctrls.zoomReset !== false) {
      const fitBtn = makeBtn("fg-btn", "Centralizar diagrama", "crosshair");
      fitBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        instance.fit();
      });
      viewWrap.appendChild(fitBtn);
    }
    if (ctrls.fullscreen !== false) {
      const fsBtn = makeBtn("fg-btn", "Expandir diagrama", "maximize-2");
      fsBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        toggleFullscreen(instance);
      });
      viewWrap.appendChild(fsBtn);
      instance._fullscreenBtn = fsBtn;
    }
    if (ctrls.layout) {
      const layoutBtn = makeBtn("fg-btn", "Auto-layout", "layout-grid");
      layoutBtn.addEventListener("click", (e) => {
        var _a;
        e.stopPropagation();
        (_a = instance.applyAutoLayout) == null ? void 0 : _a.call(instance);
      });
      viewWrap.appendChild(layoutBtn);
    }
    if (viewWrap.childElementCount) cluster.appendChild(viewWrap);
    bar.appendChild(cluster);
    const dock = document.createElement("div");
    dock.className = "fg-chrome-dock";
    dock.appendChild(bar);
    chrome.appendChild(dock);
    root.appendChild(chrome);
    instance._chrome = chrome;
    instance._chromeDock = dock;
    hydrateIcons(chrome);
    updateModeButtons(instance);
    return chrome;
  }
  function updatePlayButton(instance) {
    if (!instance._playBtn) return;
    const running = instance.running;
    const icon = running ? instance._playBtn.dataset.iconPause : instance._playBtn.dataset.iconPlay;
    instance._playBtn.innerHTML = iconMarkup(icon);
    hydrateIcons(instance._playBtn);
    instance._playBtn.setAttribute("aria-pressed", running ? "true" : "false");
    instance._playBtn.setAttribute("aria-label", running ? "Pausar anima\xE7\xE3o" : "Iniciar anima\xE7\xE3o");
  }
  function syncChromePinned(instance) {
    var _a;
    (_a = instance.root) == null ? void 0 : _a.classList.toggle("fg-chrome-pinned", instance.playbackMode === "step");
  }

  // src/ui/step-bar.js
  function mountStepBar(parent, instance, config) {
    var _a;
    if (((_a = config.controls) == null ? void 0 : _a.step) === false) return null;
    const bar = document.createElement("div");
    bar.className = "fg-step-bar";
    bar.style.display = "none";
    bar.setAttribute("role", "toolbar");
    bar.setAttribute("aria-label", "Navega\xE7\xE3o passo a passo");
    const trackWrap = document.createElement("div");
    trackWrap.className = "fg-step-bar-tracks";
    trackWrap.hidden = true;
    const prevBtn = document.createElement("button");
    prevBtn.type = "button";
    prevBtn.className = "fg-btn fg-step-prev";
    prevBtn.setAttribute("aria-label", "Passo anterior");
    prevBtn.innerHTML = `${iconMarkup("chevron-left")}<span>Voltar</span>`;
    prevBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      instance.stepPrev();
    });
    const nextBtn = document.createElement("button");
    nextBtn.type = "button";
    nextBtn.className = "fg-btn fg-step-next fg-step-next-btn";
    nextBtn.setAttribute("aria-label", "Pr\xF3ximo passo");
    nextBtn.innerHTML = `<span>Pr\xF3ximo</span>${iconMarkup("chevron-right")}`;
    nextBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      instance.stepNext();
    });
    bar.appendChild(trackWrap);
    bar.appendChild(prevBtn);
    bar.appendChild(nextBtn);
    parent.appendChild(bar);
    instance._stepBar = {
      el: bar,
      trackWrap,
      prevBtn,
      nextBtn,
      show() {
        bar.style.display = "flex";
      },
      hide() {
        bar.style.display = "none";
      },
      setTracks(tracks, activeId, onSelect) {
        if (!tracks || tracks.length < 2) {
          trackWrap.hidden = true;
          trackWrap.innerHTML = "";
          return;
        }
        trackWrap.hidden = false;
        trackWrap.innerHTML = "";
        tracks.forEach((t) => {
          const btn = document.createElement("button");
          btn.type = "button";
          btn.className = "fg-step-track-btn";
          btn.textContent = t.label;
          btn.setAttribute("aria-pressed", t.id === activeId ? "true" : "false");
          if (t.id === activeId) btn.classList.add("fg-step-track-active");
          btn.addEventListener("click", (e) => {
            e.stopPropagation();
            onSelect(t.id);
          });
          trackWrap.appendChild(btn);
        });
      }
    };
    hydrateIcons(bar);
    return instance._stepBar;
  }
  function updateStepBar(instance) {
    const bar = instance._stepBar;
    if (!bar) return;
    const player = instance.player;
    const active = player.activePlayer();
    const remaining = Math.max(0, active.steps.length - active.stepIndex);
    const animating = !!instance._stepping;
    bar.prevBtn.disabled = animating || active.stepIndex <= 1;
    bar.nextBtn.disabled = animating || remaining <= 0 && !instance.config.scenario.loop;
    bar.nextBtn.classList.toggle("fg-step-next-busy", animating);
    bar.setTracks(
      player.tracks,
      player.activeTrackId,
      (id) => instance.setActiveTrack(id)
    );
  }

  // src/ui/track-select.js
  function mountTrackSelect(container, instance, { onSelect } = {}) {
    const wrap = document.createElement("div");
    wrap.className = "fg-track-select-wrap";
    const label = document.createElement("label");
    label.className = "fg-track-select-label";
    label.textContent = "Cen\xE1rio";
    const sel = document.createElement("select");
    sel.className = "fg-track-select";
    sel.setAttribute("aria-label", "Selecionar cen\xE1rio");
    label.appendChild(sel);
    wrap.appendChild(label);
    sel.addEventListener("change", (e) => {
      e.stopPropagation();
      onSelect == null ? void 0 : onSelect(sel.value);
    });
    container.appendChild(wrap);
    function sync() {
      var _a, _b;
      const tracks = ((_a = instance.player) == null ? void 0 : _a.tracks) || [];
      const activeId = (_b = instance.player) == null ? void 0 : _b.activeTrackId;
      const prev = sel.value;
      sel.innerHTML = "";
      tracks.forEach((t) => {
        const opt = document.createElement("option");
        opt.value = t.id;
        opt.textContent = t.label;
        sel.appendChild(opt);
      });
      if (tracks.length < 2) {
        wrap.hidden = true;
        return;
      }
      wrap.hidden = false;
      sel.value = tracks.some((t) => t.id === prev) ? prev : activeId;
    }
    return { wrap, sel, sync };
  }

  // src/ui/narration-overlay.js
  function mountNarrationOverlay(root, config, instance) {
    var _a;
    const narr = ((_a = config.scenario) == null ? void 0 : _a.narration) || {};
    const el = document.createElement("div");
    el.className = `fg-narration fg-narration-${narr.position || "top-left"}`;
    el.hidden = true;
    const titleEl = document.createElement("div");
    titleEl.className = "fg-narration-title";
    const descEl = document.createElement("div");
    descEl.className = "fg-narration-desc";
    const trackSlot = document.createElement("div");
    trackSlot.className = "fg-narration-track-slot";
    el.appendChild(titleEl);
    el.appendChild(descEl);
    el.appendChild(trackSlot);
    root.appendChild(el);
    if (narr.maxWidth) el.style.maxWidth = `${narr.maxWidth}px`;
    let trackSelect = null;
    if (instance) {
      trackSelect = mountTrackSelect(trackSlot, instance, {
        onSelect: (id) => instance.setActiveTrack(id)
      });
      trackSlot.hidden = true;
    }
    return {
      el,
      trackSelect,
      set(title, description) {
        titleEl.textContent = title || "";
        descEl.textContent = description || "";
        const hasText = !!(title || description);
        const hasTracks = trackSelect && !trackSelect.wrap.hidden;
        el.hidden = !hasText && !hasTracks;
      },
      show(v2) {
        if (!v2) {
          el.hidden = true;
          return;
        }
        const hasText = !!(titleEl.textContent || descEl.textContent);
        const hasTracks = trackSelect && !trackSelect.wrap.hidden;
        el.hidden = !hasText && !hasTracks;
      },
      setTrackPickerVisible(visible) {
        if (!trackSelect) return;
        trackSlot.hidden = !visible;
        trackSelect.sync();
        const hasText = !!(titleEl.textContent || descEl.textContent);
        el.hidden = !visible && !hasText;
      },
      syncTracks() {
        trackSelect == null ? void 0 : trackSelect.sync();
      }
    };
  }

  // src/ui/narration-drawer.js
  function formatKind(kind) {
    const map = {
      travel: "Deslocamento",
      dwell: "Processamento",
      setPill: "Estado",
      setEffect: "Efeito",
      narrate: "Narra\xE7\xE3o",
      focus: "Foco"
    };
    return map[kind] || kind;
  }
  function buildNarrationItems(steps) {
    const items = [];
    if (!steps) return items;
    steps.forEach((step, stepIndex) => {
      if (step.kind === "parallel") {
        step.parallel.forEach((sub, subIndex) => {
          if (sub.kind === "wait") return;
          items.push({
            key: `${stepIndex}:${subIndex}`,
            stepIndex,
            subIndex,
            title: sub.title || formatKind(sub.kind),
            description: sub.description || ""
          });
        });
        return;
      }
      if (step.kind === "wait") return;
      items.push({
        key: String(stepIndex),
        stepIndex,
        subIndex: -1,
        title: step.title || formatKind(step.kind),
        description: step.description || ""
      });
    });
    return items;
  }

  // src/ui/scenario-panel.js
  function attachDrag(panel, handle) {
    let dragging = false;
    let startX = 0;
    let startY = 0;
    let origX = 0;
    let origY = 0;
    handle.addEventListener("pointerdown", (e) => {
      var _a;
      if (e.target.closest("button, select, label")) return;
      dragging = true;
      startX = e.clientX;
      startY = e.clientY;
      const rect = panel.getBoundingClientRect();
      const parent = ((_a = panel.offsetParent) == null ? void 0 : _a.getBoundingClientRect()) || { left: 0, top: 0 };
      origX = rect.left - parent.left;
      origY = rect.top - parent.top;
      handle.setPointerCapture(e.pointerId);
      e.preventDefault();
    });
    handle.addEventListener("pointermove", (e) => {
      if (!dragging) return;
      const dx = e.clientX - startX;
      const dy = e.clientY - startY;
      panel.style.left = `${origX + dx}px`;
      panel.style.top = `${origY + dy}px`;
      panel.style.right = "auto";
    });
    handle.addEventListener("pointerup", () => {
      dragging = false;
    });
    handle.addEventListener("pointercancel", () => {
      dragging = false;
    });
  }
  function mountScenarioPanel(root, instance, config) {
    var _a;
    const narr = ((_a = config.scenario) == null ? void 0 : _a.narration) || {};
    if (!narr.showOnCanvas) return null;
    const panel = document.createElement("aside");
    panel.className = "fg-scenario-panel";
    panel.setAttribute("aria-label", "Painel do cen\xE1rio");
    panel.hidden = true;
    panel.style.top = "12px";
    panel.style.right = "12px";
    const header = document.createElement("div");
    header.className = "fg-scenario-panel-header";
    header.innerHTML = `
    <span class="fg-scenario-panel-grip" aria-hidden="true">${iconMarkup("grip-horizontal")}</span>
    <div class="fg-scenario-panel-heading">
      <div class="fg-scenario-panel-title"></div>
      <div class="fg-scenario-panel-sub">Roteiro</div>
    </div>
  `;
    const list = document.createElement("div");
    list.className = "fg-scenario-panel-list";
    list.setAttribute("role", "list");
    const footer = document.createElement("div");
    footer.className = "fg-scenario-panel-footer";
    const trackWrap = document.createElement("div");
    trackWrap.className = "fg-scenario-panel-tracks";
    let trackSelect = mountTrackSelect(trackWrap, instance, {
      onSelect: (id) => instance.setActiveTrack(id)
    });
    const nav = document.createElement("div");
    nav.className = "fg-scenario-panel-nav";
    const prevBtn = document.createElement("button");
    prevBtn.type = "button";
    prevBtn.className = "fg-scenario-nav-btn";
    prevBtn.innerHTML = `${iconMarkup("chevron-left")} Voltar`;
    prevBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      instance.stepPrev();
    });
    const nextBtn = document.createElement("button");
    nextBtn.type = "button";
    nextBtn.className = "fg-scenario-nav-btn fg-scenario-nav-next";
    nextBtn.innerHTML = `Pr\xF3ximo ${iconMarkup("chevron-right")}`;
    nextBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      instance.stepNext();
    });
    nav.appendChild(prevBtn);
    nav.appendChild(nextBtn);
    footer.appendChild(trackWrap);
    footer.appendChild(nav);
    panel.appendChild(header);
    panel.appendChild(list);
    panel.appendChild(footer);
    root.appendChild(panel);
    const titleEl = header.querySelector(".fg-scenario-panel-title");
    titleEl.textContent = config.title || "Cen\xE1rio";
    attachDrag(panel, header);
    hydrateIcons(panel);
    const state = { items: [], activeIndex: -1, rowEls: [] };
    function renderRows() {
      list.innerHTML = "";
      state.rowEls = state.items.map((item, i) => {
        const row = document.createElement("div");
        row.className = "fg-scenario-panel-item";
        row.setAttribute("role", "listitem");
        const title = document.createElement("div");
        title.className = "fg-scenario-panel-item-title";
        title.textContent = item.title;
        const desc = document.createElement("div");
        desc.className = "fg-scenario-panel-item-desc";
        desc.textContent = item.description;
        row.appendChild(title);
        if (item.description) row.appendChild(desc);
        list.appendChild(row);
        return row;
      });
      applyStates();
    }
    function applyStates() {
      state.rowEls.forEach((row, i) => {
        row.classList.remove("fg-scenario-panel-item--past", "fg-scenario-panel-item--active", "fg-scenario-panel-item--future");
        if (state.activeIndex < 0) row.classList.add("fg-scenario-panel-item--future");
        else if (i < state.activeIndex) row.classList.add("fg-scenario-panel-item--past");
        else if (i === state.activeIndex) row.classList.add("fg-scenario-panel-item--active");
        else row.classList.add("fg-scenario-panel-item--future");
      });
      const activeRow = state.rowEls[state.activeIndex];
      if (activeRow) activeRow.scrollIntoView({ block: "nearest", behavior: "smooth" });
    }
    const api = {
      el: panel,
      footer,
      prevBtn,
      nextBtn,
      trackWrap,
      trackSelect,
      setTrackSteps(steps) {
        state.items = buildNarrationItems(steps);
        state.activeIndex = -1;
        renderRows();
      },
      setActiveIndex(index) {
        if (!state.items.length) return;
        state.activeIndex = Math.max(-1, Math.min(index, state.items.length - 1));
        applyStates();
      },
      reset() {
        state.activeIndex = -1;
        applyStates();
      },
      show(visible, { stepMode = false } = {}) {
        panel.hidden = !visible;
        root.classList.toggle("fg-scenario-panel-open", !!visible && stepMode);
        footer.hidden = !stepMode;
        const chromeTitle = root.querySelector(".fg-chrome-header");
        if (chromeTitle) chromeTitle.hidden = !!visible && stepMode;
      },
      setTracks() {
        trackSelect.sync();
      },
      updateNav({ prevDisabled, nextDisabled, busy }) {
        prevBtn.disabled = !!prevDisabled;
        nextBtn.disabled = !!nextDisabled;
        nextBtn.classList.toggle("fg-scenario-nav-busy", !!busy);
      },
      resolveIndex(step, meta) {
        if ((meta == null ? void 0 : meta.parallelIndex) != null && (meta == null ? void 0 : meta.stepIndex) != null) {
          const idx = state.items.findIndex(
            (it2) => it2.stepIndex === meta.stepIndex && it2.subIndex === meta.parallelIndex
          );
          if (idx >= 0) return idx;
        }
        if ((meta == null ? void 0 : meta.stepIndex) != null) {
          const idx = state.items.findIndex((it2) => it2.stepIndex === meta.stepIndex && it2.subIndex === -1);
          if (idx >= 0) return idx;
        }
        if (step == null ? void 0 : step.title) {
          const idx = state.items.findIndex((it2) => it2.title === step.title);
          if (idx >= 0) return idx;
        }
        return Math.min(state.activeIndex + 1, state.items.length - 1);
      }
    };
    return api;
  }
  function updateScenarioPanel(instance) {
    const panel = instance._scenarioPanel;
    if (!panel) return;
    const player = instance.player;
    const active = player.activePlayer();
    const remaining = Math.max(0, active.steps.length - active.stepIndex);
    const animating = !!instance._stepping;
    panel.updateNav({
      prevDisabled: animating || active.stepIndex <= 1,
      nextDisabled: animating || remaining <= 0 && !instance.config.scenario.loop,
      busy: animating
    });
    panel.setTracks();
  }

  // src/scenario-labels.js
  function nodeLabel(config, nodeId) {
    var _a;
    if (!nodeId) return "";
    return ((_a = config.nodesById[nodeId]) == null ? void 0 : _a.label) || nodeId;
  }
  function travelTitle(config, edgeId2) {
    var _a;
    const e = config.edgesById[edgeId2];
    if (!e) return edgeId2;
    const from = nodeLabel(config, e.from);
    const to = nodeLabel(config, e.to);
    const el = (_a = e.label) == null ? void 0 : _a.text;
    return el ? `${from} \u2192 ${to} \xB7 ${el}` : `${from} \u2192 ${to}`;
  }
  function travelDescription(config, edgeId2, direction = "forward") {
    var _a;
    const e = config.edgesById[edgeId2];
    if (!e) return "";
    const from = nodeLabel(config, direction === "reverse" ? e.to : e.from);
    const to = nodeLabel(config, direction === "reverse" ? e.from : e.to);
    const el = (_a = e.label) == null ? void 0 : _a.text;
    return el ? `Pacote viaja de ${from} para ${to} pela aresta \xAB${el}\xBB.` : `Pacote viaja de ${from} para ${to}.`;
  }
  function dwellTitle(config, nodeId) {
    return `Em ${nodeLabel(config, nodeId)}`;
  }
  function dwellDescription(config, nodeId, effect) {
    const name = nodeLabel(config, nodeId);
    if (effect === "processing") return `Processando em ${name}.`;
    if (effect === "waiting") return `Aguardando em ${name}.`;
    if (effect === "open") return `Circuit breaker aberto em ${name}.`;
    return `Ativo em ${name}.`;
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

  // src/index.js
  var NS5 = "http://www.w3.org/2000/svg";
  var CSS_HREF = "flowgraph.css";
  var PLAYBACK_MODES = ["play", "narrative", "step"];
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
      this.playbackMode = this.config.scenario.defaultMode || "play";
      if (!PLAYBACK_MODES.includes(this.playbackMode)) this.playbackMode = "play";
      this.playSpeed = this.config.scenario.speed || 1;
      this._stepping = false;
      this._atNodeId = null;
      this._stepHighlight = { nodeId: null, edgeId: null, edgeIds: [] };
      this.nodeStats = new NodeStats(this.config.nodes);
      if (this.config.injectStyles) injectStylesheet();
      this._mount();
      this._bindPlayer();
      this._applyPlaybackMode(this.playbackMode, { initial: true });
      if (this.config.autoStart) this.start();
    }
    _mount() {
      var _a;
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
      this._narration = mountNarrationOverlay(root, cfg, this);
      createChrome(root, this, cfg);
      this._scenarioPanel = mountScenarioPanel(root, this, cfg);
      if (!this._scenarioPanel) {
        mountStepBar(this._chromeDock || root, this, cfg);
      }
      this.container.appendChild(root);
      const nodeDrag = ((_a = cfg.interaction) == null ? void 0 : _a.nodeDrag) !== false;
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
    _shouldNarrate() {
      return this.playbackMode === "narrative" || this.playbackMode === "step";
    }
    _shouldHighlight() {
      return this.playbackMode === "narrative";
    }
    _isManual() {
      return this.playbackMode === "step";
    }
    _refreshNodeMetrics(nodeId) {
      const node = this.config.nodesById[nodeId];
      if (!(node == null ? void 0 : node.metrics)) return;
      const auto = this.nodeStats.pillsFor(nodeId, node);
      if (auto.length) this.nodeRenderer.setPillsBottom(nodeId, auto);
    }
    _syncScenarioPanel() {
      var _a, _b, _c, _d, _e2, _f, _g, _h;
      const narr = (_b = (_a = this.config.scenario) == null ? void 0 : _a.narration) == null ? void 0 : _b.showOnCanvas;
      const stepMode = this.playbackMode === "step";
      const narrativeMode = this.playbackMode === "narrative";
      (_c = this._scenarioPanel) == null ? void 0 : _c.show(!!(narr && stepMode), { stepMode });
      if (narrativeMode && narr) {
        (_d = this._narration) == null ? void 0 : _d.setTrackPickerVisible(true);
        (_e2 = this._narration) == null ? void 0 : _e2.syncTracks();
      } else {
        (_f = this._narration) == null ? void 0 : _f.setTrackPickerVisible(false);
      }
      if (stepMode && narr) {
        (_g = this._scenarioPanel) == null ? void 0 : _g.setTrackSteps(this.player.activePlayer().steps);
        updateScenarioPanel(this);
      }
      (_h = this._stepBar) == null ? void 0 : _h.hide();
    }
    _bindPlayer() {
      const cfg = this.config;
      const hooks = {
        shouldNarrate: () => this._shouldNarrate(),
        shouldSkipNarratePause: () => this.playbackMode === "play",
        shouldSequentialParallel: () => this.playbackMode !== "play",
        onReset: () => {
          var _a, _b;
          this.particles.clear();
          this.particles.setSpeedMultiplier(this.playSpeed);
          this._applyStepHighlight(null);
          this.nodeStats.reset();
          cfg.nodes.forEach((n) => {
            this.nodeRenderer.setEffect(n.id, null);
            this.nodeRenderer.setActive(n.id, false);
            if (n.metrics) this._refreshNodeMetrics(n.id);
          });
          this._atNodeId = null;
          (_a = this._narration) == null ? void 0 : _a.set("", "");
          (_b = this._scenarioPanel) == null ? void 0 : _b.reset();
          this._syncScenarioPanel();
        },
        onStepStart: (step, _manual, _trackId, meta) => {
          if (this.playbackMode !== "step" || !this._scenarioPanel) return;
          const idx = this._scenarioPanel.resolveIndex(step, meta);
          if (idx >= 0) this._scenarioPanel.setActiveIndex(idx);
        },
        onNarration: () => {
          updateScenarioPanel(this);
          updateStepBar(this);
        },
        onStep: () => {
          updateScenarioPanel(this);
          updateStepBar(this);
        },
        travel: (step, manual, trackId) => this._runTravel(step, manual, trackId),
        dwell: (step, manual) => this._runDwell(step, manual),
        setPill: (step) => {
          const node = cfg.nodesById[step.node];
          if (!node) return;
          if (step.pill != null) {
            node.pillTop = [{ text: String(step.pill), tone: step.tone || "primary" }];
          }
          this.nodeRenderer.setPillsTop(step.node, node.pillTop);
        },
        setEffect: (step) => {
          const effect = step.effect || null;
          this.nodeRenderer.setEffect(step.node, effect);
          this.nodeRenderer.setActive(step.node, !!effect);
          if (effect === "open") {
            const node = cfg.nodesById[step.node];
            if (node) {
              node.pillTop = [{ text: "open", tone: "danger" }];
              this.nodeRenderer.setPillsTop(step.node, node.pillTop);
            }
          }
        },
        focus: (step) => {
          var _a, _b, _c, _d;
          if (!this._shouldHighlight()) return;
          if (step.edge) {
            const e = cfg.edgesById[step.edge];
            (_b = (_a = this.viewport).focusOnNodes) == null ? void 0 : _b.call(_a, e == null ? void 0 : e.from, e == null ? void 0 : e.to, cfg.nodesById);
          } else if (step.node) {
            (_d = (_c = this.viewport).focusOnNodes) == null ? void 0 : _d.call(_c, step.node, step.node, cfg.nodesById);
          }
        }
      };
      this.player = new MultiTrackPlayer(cfg, hooks);
      this.player.setSpeed(this.playSpeed);
      this._syncScenarioPanel();
    }
    _scaled(ms) {
      return Math.max(0, ms / (this.playSpeed || 1));
    }
    _stepBeat(ms) {
      return new Promise((r) => setTimeout(r, this._scaled(ms)));
    }
    _applyStepHighlight(highlight) {
      var _a, _b, _c;
      if (!this._shouldHighlight()) {
        (_a = this.root) == null ? void 0 : _a.classList.remove("fg-step-focus", "fg-narrative-focus");
        const prev2 = this._stepHighlight;
        if (prev2.nodeId) this.nodeRenderer.setStepActive(prev2.nodeId, false);
        if (prev2.edgeId) this.edgeRenderer.setStepActive(prev2.edgeId, false);
        this._stepHighlight = { nodeId: null, edgeId: null, edgeIds: [] };
        return;
      }
      const prev = this._stepHighlight;
      if (prev.nodeId) this.nodeRenderer.setStepActive(prev.nodeId, false);
      if (prev.edgeId) this.edgeRenderer.setStepActive(prev.edgeId, false);
      this._stepHighlight = { nodeId: null, edgeId: null, edgeIds: [] };
      (_b = this.root) == null ? void 0 : _b.classList.remove("fg-step-focus", "fg-narrative-focus");
      if (!highlight) return;
      const focusClass = this.playbackMode === "step" ? "fg-step-focus" : "fg-narrative-focus";
      (_c = this.root) == null ? void 0 : _c.classList.add(focusClass);
      const phase = highlight.phase || "default";
      if (phase === "depart" || phase === "origin") {
        const fromId = highlight.fromNodeId || highlight.nodeId;
        if (fromId) {
          this.nodeRenderer.setStepActive(fromId, true);
          this._stepHighlight.nodeId = fromId;
        }
        if (highlight.edgeId) {
          this.edgeRenderer.setStepActive(highlight.edgeId, true);
          this._stepHighlight.edgeId = highlight.edgeId;
        }
        return;
      }
      if (phase === "moving" && highlight.edgeId) {
        this.edgeRenderer.setStepActive(highlight.edgeId, true);
        this._stepHighlight.edgeId = highlight.edgeId;
        return;
      }
      if (phase === "arrive") {
        const toId = highlight.toNodeId || highlight.nodeId;
        if (toId) {
          this.nodeRenderer.setStepActive(toId, true);
          this._stepHighlight.nodeId = toId;
        }
        return;
      }
      if (highlight.nodeId) {
        this.nodeRenderer.setStepActive(highlight.nodeId, true);
        this._stepHighlight.nodeId = highlight.nodeId;
      }
      if (highlight.edgeId) {
        this.edgeRenderer.setStepActive(highlight.edgeId, true);
        this._stepHighlight.edgeId = highlight.edgeId;
      }
    }
    async _runTravel(step, manual) {
      var _a, _b, _c, _d;
      const cfg = this.config;
      const edge = cfg.edgesById[step.edge];
      if (!edge) return;
      const reverse = step.direction === "reverse";
      const fromId = reverse ? edge.to : edge.from;
      const toId = reverse ? edge.from : edge.to;
      const tokenCfg = resolveTokenType(cfg, step.token || "default", edge);
      step.title = step.title || travelTitle(cfg, step.edge);
      step.description = step.description || travelDescription(cfg, step.edge, step.direction || "forward");
      if (this._shouldNarrate()) {
        if (this.playbackMode === "narrative" || !((_a = this._scenarioPanel) == null ? void 0 : _a.el) || this._scenarioPanel.el.hidden) {
          (_b = this._narration) == null ? void 0 : _b.set(step.title, step.description);
        }
      }
      const skipMetrics = step.countMetrics === false || tokenCfg.countMetrics === false;
      const fromNode = cfg.nodesById[fromId];
      if ((fromNode == null ? void 0 : fromNode.metrics) && !skipMetrics) {
        this.nodeStats.onDepart(fromId);
        this._refreshNodeMetrics(fromId);
      }
      this._atNodeId = fromId;
      this.player.activePlayer().atNodeId = fromId;
      if (this._shouldHighlight()) {
        this._applyStepHighlight({ phase: "depart", fromNodeId: fromId, edgeId: step.edge });
        (_d = (_c = this.viewport).focusOnNodes) == null ? void 0 : _d.call(_c, fromId, toId, cfg.nodesById);
        if (!manual) await this._stepBeat(120);
      }
      if (this._shouldHighlight()) {
        this._applyStepHighlight({ phase: "moving", edgeId: step.edge });
      }
      await this.particles.travel(step.edge, tokenCfg, reverse);
      const toNode = cfg.nodesById[toId];
      if ((toNode == null ? void 0 : toNode.metrics) && !skipMetrics) {
        this.nodeStats.onArrive(toId);
        this._refreshNodeMetrics(toId);
      }
      this._atNodeId = toId;
      this.player.activePlayer().atNodeId = toId;
      if (this._shouldHighlight()) {
        this._applyStepHighlight({ phase: "arrive", toNodeId: toId });
        if (!manual) await this._stepBeat(150);
      } else {
        this._applyStepHighlight(null);
      }
    }
    async _runDwell(step, manual) {
      var _a, _b;
      const cfg = this.config;
      step.title = step.title || dwellTitle(cfg, step.node);
      step.description = step.description || dwellDescription(cfg, step.node, step.effect);
      if (this._shouldNarrate()) {
        if (this.playbackMode === "narrative" || !((_a = this._scenarioPanel) == null ? void 0 : _a.el) || this._scenarioPanel.el.hidden) {
          (_b = this._narration) == null ? void 0 : _b.set(step.title, step.description);
        }
      }
      this._atNodeId = step.node;
      this.player.activePlayer().atNodeId = step.node;
      if (this._shouldHighlight()) {
        this._applyStepHighlight({ nodeId: step.node, phase: "default" });
      }
      const node = cfg.nodesById[step.node];
      const effect = step.effect || "processing";
      const savedPillTop = (node == null ? void 0 : node.pillTop) ? [...node.pillTop] : [];
      this.nodeRenderer.setEffect(step.node, effect);
      this.nodeRenderer.setActive(step.node, true);
      if (effect === "processing") {
        this.nodeRenderer.setPillsTop(step.node, [
          { text: "running", tone: "warning", animated: true, icon: "\xB7\xB7\xB7" }
        ]);
      }
      const base = manual ? 280 : step.ms || 500;
      const ms = this.playbackMode === "play" ? base * 0.55 : base;
      await this._stepBeat(ms);
      this.nodeRenderer.setEffect(step.node, null);
      this.nodeRenderer.setActive(step.node, false);
      if (effect === "processing" && node) {
        this.nodeRenderer.setPillsTop(step.node, savedPillTop);
      }
      if (!this._shouldHighlight()) this._applyStepHighlight(null);
    }
    setPlaybackMode(mode) {
      if (!PLAYBACK_MODES.includes(mode) || mode === this.playbackMode) return;
      const keepRunning = this.running;
      this._resetPlaybackState();
      this._applyPlaybackMode(mode);
      if (keepRunning) {
        this.running = true;
        if (!this._raf) {
          this._lastTs = 0;
          this._raf = requestAnimationFrame((t) => this._tick(t));
        }
        if (mode !== "step") this._startAutoPlayback();
      }
      updatePlayButton(this);
    }
    _resetPlaybackState() {
      var _a, _b;
      this.player.stopAll();
      this.player.reset();
      this._applyStepHighlight(null);
      this._atNodeId = null;
      (_a = this._narration) == null ? void 0 : _a.set("", "");
      (_b = this._scenarioPanel) == null ? void 0 : _b.reset();
      requestAnimationFrame(() => this.viewport.fit());
    }
    setPlaySpeed(speed) {
      this.playSpeed = speed;
      this.player.setSpeed(speed);
      this.particles.setSpeedMultiplier(speed);
      if (this._speedSelect) this._speedSelect.value = String(speed);
      updateScenarioPanel(this);
    }
    setActiveTrack(trackId) {
      var _a;
      this.player.activeTrackId = trackId;
      updateStepBar(this);
      this._syncScenarioPanel();
      const peek = this.player.activePlayer().peek();
      if (peek && this._shouldNarrate()) {
        (_a = this._narration) == null ? void 0 : _a.set(peek.title || "", peek.description || "");
      }
      if (this.running && this.playbackMode === "narrative") {
        this._startNarrativeTrack();
      }
    }
    _applyPlaybackMode(mode, { initial = false } = {}) {
      var _a, _b, _c, _d, _e2, _f;
      this.playbackMode = mode;
      PLAYBACK_MODES.forEach((m) => {
        var _a2;
        return (_a2 = this.root) == null ? void 0 : _a2.classList.remove(`fg-mode-${m}`);
      });
      (_a = this.root) == null ? void 0 : _a.classList.add(`fg-mode-${mode}`);
      if (mode === "play") {
        (_b = this._stepBar) == null ? void 0 : _b.hide();
        (_c = this._narration) == null ? void 0 : _c.set("", "");
        this._applyStepHighlight(null);
      } else if (mode === "narrative") {
        (_d = this._stepBar) == null ? void 0 : _d.hide();
        const peek = this.player.activePlayer().peek();
        if (peek) (_e2 = this._narration) == null ? void 0 : _e2.set(peek.title || "", peek.description || "");
      } else if (mode === "step") {
        const peek = this.player.activePlayer().peek();
        if (peek && !this._scenarioPanel) (_f = this._narration) == null ? void 0 : _f.set(peek.title || "", peek.description || "");
      }
      syncChromePinned(this);
      updateModeButtons(this);
      updateStepBar(this);
      updatePlayButton(this);
      this._syncScenarioPanel();
      if (!initial && mode !== "step" && this.running) {
        this._startAutoPlayback();
      }
    }
    _startAutoPlayback() {
      this.player.stopAll();
      if (this.playbackMode === "play") {
        this.player.startParallel();
      } else if (this.playbackMode === "narrative") {
        this._startNarrativeTrack();
      }
    }
    _startNarrativeTrack() {
      const p2 = this.player.activePlayer();
      if (!p2) return;
      this.player.stopAll();
      p2.reset();
      p2._forceNoLoop = true;
      p2.speed = this.player.speed;
      p2.startPlay(p2.track.offset || 0);
    }
    async stepNext() {
      if (this.playbackMode !== "step" || this._stepping) return null;
      this._stepping = true;
      updateStepBar(this);
      updateScenarioPanel(this);
      try {
        return await this.player.stepNext();
      } finally {
        this._stepping = false;
        updateStepBar(this);
        updateScenarioPanel(this);
      }
    }
    async stepPrev() {
      if (this.playbackMode !== "step" || this._stepping) return null;
      this._stepping = true;
      updateStepBar(this);
      updateScenarioPanel(this);
      try {
        return await this.player.stepPrev();
      } finally {
        this._stepping = false;
        updateStepBar(this);
        updateScenarioPanel(this);
      }
    }
    /** @deprecated use setPlaybackMode('step') */
    enableStepMode() {
      this.setPlaybackMode("step");
    }
    /** @deprecated use setPlaybackMode('play') */
    disableStepMode() {
      this.setPlaybackMode("play");
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
      this.particles.setSpeedMultiplier(this.playSpeed);
      this._raf = requestAnimationFrame((t) => this._tick(t));
      if (this.playbackMode !== "step") this._startAutoPlayback();
      updatePlayButton(this);
    }
    pause() {
      this.running = false;
      this.player.stopAll();
      if (this._raf) cancelAnimationFrame(this._raf);
      this._raf = null;
      updatePlayButton(this);
    }
    reset() {
      const mode = this.playbackMode;
      this.pause();
      this.player.reset();
      this._applyStepHighlight(null);
      this._atNodeId = null;
      this.running = true;
      this._lastTs = 0;
      this._raf = requestAnimationFrame((t) => this._tick(t));
      if (mode !== "step") this._startAutoPlayback();
      updatePlayButton(this);
      updateModeButtons(this);
      updateStepBar(this);
    }
    destroy() {
      this.pause();
      closeFullscreen(this);
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
      this.viewport.updateBounds(graphBoundsWithEdges(
        this.config.nodes,
        this.config.edges,
        this.config.nodesById,
        this.config.viewport.padding
      ));
      requestAnimationFrame(() => this.viewport.fit());
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

  // src/iife.js
  var iife_default = FlowGraph;
  return __toCommonJS(iife_exports);
})();
