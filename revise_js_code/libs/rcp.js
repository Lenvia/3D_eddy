/* Menucool rgba Color Picker v2018.9.23. menucool.com/rgba-color-picker */
var MenuCoolRgbaColorPickerOptions = {
    initOnPageLoad: true
},
rgbaColorPicker = function(E) {
    "use strict";
    var e = function(a, c, b) {
        if (a.addEventListener) a.addEventListener(c, b, false);
        else a.attachEvent && a.attachEvent("on" + c,
        function(c) {
            c.preventDefault = function() {
                c.returnValue = false
            };
            b.call(a, c)
        })
    },
    D = function(a) {
        return ! a ? 0 : /\bcolor\b/.test(a)
    },
    d = "length",
    n = function(a) {
        return document.createElement(a)
    },
    z = function(b) {
        if (b[d] && b[0] == "#") {
            var a = b.substring(1).split("");
            if (a[d] == 3) a = [a[0], a[0], a[1], a[1], a[2], a[2]];
            if (a[d] == 6) b = "#" + a.join("");
            else b = ""
        }
        return b
    },
    A = function(c) {
        var b = 0;
        if (/^#([A-Fa-f0-9]{3}){1,2}$/.test(c)) {
            var a = z(c);
            a = "0x" + a.substring(1);
            b = [a >> 16 & 255, a >> 8 & 255, a & 255]
        }
        return b
    },
    x = function(c, b) {
        var a = A(c);
        return a ? "rgba(" + a.join(",") + "," + b + ")": o
    },
    w = function(h, f) {
        var e = "",
        b = h.match(/rgba\((\d+),(\d+),(\d+),([.\d]+)/i);
        if (b) {
            for (var g = A(f), c = [], d = +b[4], a = 0; a < 3; a++) c.push(Math.floor( + b[a + 1] * d + +g[a] * (1 - d)));
            e = l(c.join(","))
        }
        return e
    },
    t = function(b) {
        var a = b.toString(16).toUpperCase();
        return a[d] == 1 ? "0" + a: a
    },
    l = function(b) {
        var a = b.split(",");
        return "#" + t( + a[0]) + t( + a[1]) + t( + a[2])
    },
    s = function(a) {
        a = a.replace(/\s+/g, "").toLowerCase();
        var d = [o];
        if (!a || a == q) d = [a];
        else if (a[0] == "#") {
            if (/^#([a-f0-9]{3}){1,2}$/.test(a)) d = [a]
        } else if (/^rgba\(\d+,\d+,\d+,[\.\d]+\)$/.test(a)) {
            var c = a.match(/^rgba\((\d+,\d+,\d+),([\.\d]+)\)$/);
            if (c) if (v(c[1]) && +c[2] <= 1) d = [l(c[1]), +c[2]]
        } else if (/^rgb\(\d+,\d+,\d+\)$/.test(a)) {
            var c = a.match(/^rgb\((\d+,\d+,\d+)\)$/);
            if (v(c[1])) d = [l(c[1])]
        } else {
            i[b][f] = q;
            i[b][f] = a;
            var e = F(i)[f];
            if (e.indexOf("rgb(") != -1) d = [l(e.replace("rgb(", "").replace(")", ""))]
        }
        return d
    },
    C = function(a) {
        a = a.substring(1);
        var e = parseInt(a.substr(0, 2), 16),
        d = parseInt(a.substr(2, 2), 16),
        c = parseInt(a.substr(4, 2), 16),
        b = (e * 299 + d * 587 + c * 114) / 1e3;
        return b >= 188 ? "#000": "#fff"
    },
    r = function(b) {
        var a = s(b);
        if (a[d] == 2) a = w(b, "#FFFFFF");
        else a = a[0];
        if (a[d] && a[0] == "#") a = z(a);
        return a[d] == 7 ? C(a) : "#000"
    },
    v = function(c) {
        for (var b = c.split(","), a = 0; a < b[d]; a++) if ( + b[a] < 0 || +b[a] > 255) return 0;
        return 1
    },
    G = navigator.userAgent.match(/(iPad|iPhone|iPod)/g) ? true: false,
    j = G ? "touchstart": "click",
    m = "className",
    b = "style",
    f = "backgroundColor",
    h = "display",
    c = "value",
    o = "invalid",
    g = "appendChild",
    q = "transparent",
    H = "undefined",
    F = function(a) {
        if (window.getComputedStyle) var c = window.getComputedStyle(a, null);
        else if (a.currentStyle) c = a.currentStyle;
        else c = a[b];
        return c
    },
    a,
    i,
    p,
    k,
    u = function() {
        if (a) {
            if ( + a.w[c] == 1) var d = a.a[c];
            else d = a.v[c];
            a.R[a.i][c] = d;
            a.r[b][h] = "none";
            a.R[a.i].onchange()
        }
    },
    B = function() {
        var a = this;
        a.a = a.c = a.e = null;
        a.i = -1;
        a.R = [];
        a.S = [];
        a.d()
    };
    B.prototype = {
        f: function(a) {
            var b = n("div");
            if (!a) {
                a = this.r;
                b[m] = "separator"
            } else b[m] = "clear";
            a[g](b)
        },
        g: function(c, d, e) {
            var a = n("div");
            if (c == "TT") {
                a[m] = "transChooser";
                a.setAttribute("rgb", q)
            } else {
                a[b][f] = "#" + c + e + d;
                a.setAttribute("rgb", "#" + c + e + d)
            }
            return a
        },
        h: function(a) {
            a = a ? a: window.event;
            a.cancelBubble = true;
            a.h && a.h()
        },
        j: function() {
            for (var a = this,
            c, b = a.e,
            j = ["00", "11", "22", "33", "44", "55", "66", "77", "88", "99", "AA", "BB", "CC", "DD", "EE", "F6", "FF", "TT"], i = 0; i < 18; i++) {
                c = a.g(j[i], j[i], j[i]);
                b[g](c)
            }
            a.f(b);
            for (var e = ["00", "33", "66", "99", "CC", "FF"], d = 0; d < 6; d++) {
                for (var h = 0; h < 3; h++) for (var f = 0; f < 6; f++) {
                    c = a.g(e[h], e[f], e[d]);
                    b[g](c)
                }
                a.f(b)
            }
            a.f(b);
            for (var d = 0; d < 6; d++) {
                for (var h = 3; h < 6; h++) for (var f = 0; f < 6; f++) {
                    c = a.g(e[h], e[f], e[d]);
                    b[g](c)
                }
                a.f(b)
            }
        },
        k: function(c, d) {
            var b;
            switch (d) {
            case 1:
                b = "span";
                break;
            case 2:
            case 3:
                b = "input";
                break;
            case 4:
                b = "button";
                break;
            default:
                b = "div"
            }
            var a = n(b);
            if (c[0] == "#") a.id = c.substring(1);
            else a[m] = c;
            if (d == 2) {
                a.type = "text";
                a.setAttribute("spellcheck", "false")
            } else if (d == 3) a.type = "range";
            c != "#colorpicker" && c != "colorChooser" && this.r[g](a);
            return a
        },
        d: function() {
            var a = this;
            a.r = a.k("#colorpicker");
            e(a.r, j, a.h);
            p = n("h4");
            a.r[g](p);
            i = a.k("w1");
            a.c = a.k("w2");
            a.f();
            a.a = a.k("w1", 2);
            a.v = a.k("w2", 2);
            a.f();
            var d = a.k("btnOK", 4);
            d.setAttribute("type", "button");
            d.innerHTML = "OK";
            var f = a.k("opacitySpan", 1);
            f.innerHTML = "Opacity";
            a.w = a.k("rgbaRange", 3);
            a.f();
            a.e = a.k("#colorContainer");
            e(a.e, "mouseover",
            function(b) {
                a.m(b, 1)
            });
            e(a.e, "mouseout",
            function(b) {
                a.m(b, 2)
            });
            e(a.e, j,
            function(b) {
                a.m(b, 3)
            });
            a.w[c] = 1;
            a.w.min = 0;
            a.w.max = 1;
            a.w.step = .1;
            e(a.w, "input",
            function() {
                a.t(a.a[c])
            });
            e(a.w, "change",
            function() {
                try {
                    a.t(a.a[c])
                } catch(b) {}
            });
            a.j();
            a.o();
            e(document.documentElement, j,
            function() {
                a.r[b][h] = "none"
            });
            e(d, j, u)
        },
        m: function(d, e) {
            if (e == 2) var b = k;
            else {
                if (d.target) var c = d.target;
                else c = d.srcElement;
                if (c.id != "colorContainer") {
                    b = c.getAttribute("rgb");
                    if (e == 3) {
                        k = b;
                        u()
                    }
                }
            }
            b && a.t(b)
        },
        o: function() {
            for (var k = document.getElementsByTagName("input"), a = this, i = 0; i < k[d]; i++) if (D(k[i][m])) {
                var c = a.R[d];
                a.R[c] = k[i];
                a.R[c].i = c;
                a.S[c] = a.k("colorChooser", 1);
                a.S[c].i = c;
                a.R[c].parentNode.insertBefore(a.S[c], a.R[c].nextSibling);
                e(a.R[c], j,
                function(c) {
                    if (a.r.previousSibling != this || a.r[b][h] == "none") {
                        a.i = this.i;
                        a.S[a.i][g](a.r)[b][h] = "block";
                        a.s(this)
                    }
                    a.h(c)
                });
                a.R[c].onchange = function() {
                    var a = this.value;
                    this[b][f] = a;
                    this[b].color = r(a);
                    typeof OnColorChanged !== "undefined" && OnColorChanged(a, this)
                };
                a.R[c].onchange()
            }
        },
        s: function(j) {
            var a = this,
            e = s(j[c]);
            k = e[0];
            a.w[c] = e[d] == 2 ? e[1] : 1;
            if (k == o) {
                i[b][f] = a.c[b][f] = q;
                a.a[c] = a.v[c] = o
            } else a.t(k);
            var g = j.getAttribute("data-title");
            p.innerHTML = g ? g: "";
            p[b][h] = g ? "block": "none"
        },
        t: function(d) {
            var e = +a.w[c];
            i[b][f] = a.a[c] = d && d[0] == "#" ? d.toUpperCase() : d;
            a.c[b][f] = a.v[c] = d && d[0] == "#" ? x(d, e) : d
        }
    };
    var y = function() {
        if (!a) a = new B
    };
    E.initOnPageLoad && e(window, "load", y);
    return {
        refresh: function() {
            for (var b = 0,
            c = a.R.length; b < c; b++) a.R[b].onchange()
        },
        setStyle: function(a) {
            a[b][f] = a.value;
            a[b].color = r(a.value)
        },
        hexAlphaToRgba: x,
        rgbToHex: l,
        rgbaToHex: w,
        getContrastColor: r,
        getParsedColors: s,
        close: function() {
            a.r[b][h] = "none"
        },
        init: y
    }
} (MenuCoolRgbaColorPickerOptions)