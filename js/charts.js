window.StatecraftCharts = (function () {
  function ctx2d(canvas) {
    const ctx = canvas.getContext("2d");
    const ratio = window.devicePixelRatio || 1;
    const cssW = canvas.clientWidth || canvas.width;
    const cssH = canvas.clientHeight || Math.round(cssW * (canvas.height / canvas.width));
    canvas.width = Math.round(cssW * ratio);
    canvas.height = Math.round(cssH * ratio);
    ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
    return { ctx, w: cssW, h: cssH };
  }

  function roundRect(ctx, x, y, w, h, r) {
    const rr = Math.min(r, w / 2, h / 2);
    ctx.beginPath();
    ctx.moveTo(x + rr, y);
    ctx.arcTo(x + w, y, x + w, y + h, rr);
    ctx.arcTo(x + w, y + h, x, y + h, rr);
    ctx.arcTo(x, y + h, x, y, rr);
    ctx.arcTo(x, y, x + w, y, rr);
    ctx.closePath();
  }

  function ellipsize(ctx, text, maxW) {
    const t = String(text || "");
    if (ctx.measureText(t).width <= maxW) return t;
    let s = t;
    while (s.length > 1 && ctx.measureText(s + "…").width > maxW) s = s.slice(0, -1);
    return s + "…";
  }

  function chamber(canvas, seats, opts) {
    opts = opts || {};
    const { ctx, w, h } = ctx2d(canvas);
    ctx.clearRect(0, 0, w, h);
    const n = Math.max(seats.length, 1);
    const title = opts.title || "The table";
    const unit = opts.unit || "place";
    const pad = Math.max(78, Math.min(w, h) * 0.13);
    const cx = w / 2;
    const cy = h / 2;
    const maxR = Math.max(80, Math.min(cx, cy) - pad);
    const tableR = maxR * (n > 18 ? 0.2 : n > 14 ? 0.24 : 0.28);
    const seatR = maxR * 0.58;
    const labelR = maxR * 0.78;
    const chairW = n > 18 ? 18 : 24;
    const chairH = n > 18 ? 16 : 20;
    const dot = n > 18 ? 8 : n > 14 ? 10 : 12;
    const fontMain = n > 18 ? 9 : n > 14 ? 10 : 11;

    ctx.beginPath();
    ctx.fillStyle = "#121820";
    ctx.arc(cx, cy, tableR + 16, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.fillStyle = "#1b2430";
    ctx.arc(cx, cy, tableR, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.strokeStyle = "rgba(212, 137, 74, 0.45)";
    ctx.lineWidth = 3;
    ctx.arc(cx, cy, Math.max(8, tableR - 6), 0, Math.PI * 2);
    ctx.stroke();
    ctx.beginPath();
    ctx.strokeStyle = "rgba(232, 238, 244, 0.06)";
    ctx.lineWidth = 1;
    ctx.arc(cx, cy, tableR + 22, 0, Math.PI * 2);
    ctx.stroke();

    ctx.fillStyle = "#f0b27a";
    ctx.font = "600 12px Cormorant Garamond, serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(ellipsize(ctx, title, tableR * 2.2), cx, cy - 8);
    ctx.fillStyle = "#8b9aab";
    ctx.font = "11px Manrope, sans-serif";
    ctx.fillText(n === 1 ? "1 " + unit : n + " " + unit + "s", cx, cy + 10);

    const maxLabel = Math.max(88, ((2 * Math.PI * labelR) / n) * 1.12);

    seats.forEach((seat, i) => {
      const ang = -Math.PI / 2 + (i / n) * Math.PI * 2;
      const x = cx + Math.cos(ang) * seatR;
      const y = cy + Math.sin(ang) * seatR;

      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(ang + Math.PI / 2);
      ctx.fillStyle = "#252e3a";
      roundRect(ctx, -chairW / 2, -3, chairW, chairH, 6);
      ctx.fill();
      ctx.restore();

      ctx.beginPath();
      ctx.fillStyle = seat.color || "#3d4a57";
      ctx.arc(x, y, seat.leader ? dot + 2 : dot, 0, Math.PI * 2);
      ctx.fill();
      ctx.lineWidth = seat.inOffice ? 3 : 2;
      ctx.strokeStyle = seat.inOffice ? "#f0b27a" : "rgba(8,12,16,0.55)";
      ctx.stroke();

      const lx = cx + Math.cos(ang) * labelR;
      const ly = cy + Math.sin(ang) * labelR;
      const c = Math.cos(ang);
      const s = Math.sin(ang);
      ctx.textAlign = c > 0.38 ? "left" : c < -0.38 ? "right" : "center";
      ctx.textBaseline = s > 0.38 ? "bottom" : s < -0.38 ? "top" : "middle";
      ctx.font = "600 " + fontMain + "px Manrope, sans-serif";
      ctx.fillStyle = "#e8eef4";
      ctx.fillText(ellipsize(ctx, seat.ministry || "Vacant", maxLabel), lx, ly);
      const subGap = fontMain + 3;
      const subY = s > 0.38 ? ly - subGap : s < -0.38 ? ly + subGap : ly + subGap;
      ctx.font = (fontMain - 1) + "px Manrope, sans-serif";
      ctx.fillStyle = "#8b9aab";
      ctx.fillText(ellipsize(ctx, seat.member || seat.party || "", maxLabel), lx, subY);
    });
  }

  function bars(canvas, items) {
    const { ctx, w, h } = ctx2d(canvas);
    ctx.clearRect(0, 0, w, h);
    const pad = { l: 8, r: 56, t: 8, b: 8 };
    const max = Math.max(1, ...items.map((d) => d.value));
    const rowH = (h - pad.t - pad.b) / Math.max(items.length, 1);
    items.forEach((d, i) => {
      const y = pad.t + i * rowH + 6;
      const bh = Math.max(10, rowH - 14);
      const bw = ((w - pad.l - pad.r) * d.value) / max;
      ctx.fillStyle = "rgba(232,238,244,0.04)";
      roundRect(ctx, pad.l, y, w - pad.l - pad.r, bh, 6);
      ctx.fill();
      ctx.fillStyle = d.color;
      roundRect(ctx, pad.l, y, Math.max(4, bw), bh, 6);
      ctx.fill();
      ctx.fillStyle = "#e8eef4";
      ctx.font = "600 12px Manrope, sans-serif";
      ctx.textAlign = "left";
      ctx.fillText(d.label, pad.l + 8, y + bh / 2 + 4);
      ctx.textAlign = "right";
      ctx.fillStyle = "#f0b27a";
      ctx.fillText(`${d.value.toFixed(1)}%`, w - 8, y + bh / 2 + 4);
    });
  }

  function lines(canvas, labels, series) {
    const { ctx, w, h } = ctx2d(canvas);
    ctx.clearRect(0, 0, w, h);
    const pad = { l: 36, r: 12, t: 16, b: 28 };
    const innerW = w - pad.l - pad.r;
    const innerH = h - pad.t - pad.b;
    ctx.strokeStyle = "rgba(232,238,244,0.08)";
    ctx.lineWidth = 1;
    for (let i = 0; i <= 4; i++) {
      const y = pad.t + (innerH * i) / 4;
      ctx.beginPath();
      ctx.moveTo(pad.l, y);
      ctx.lineTo(w - pad.r, y);
      ctx.stroke();
    }
    const xs = (i) => pad.l + (labels.length <= 1 ? innerW / 2 : (innerW * i) / (labels.length - 1));
    const ys = (v) => pad.t + innerH * (1 - v / 100);
    series.forEach((s) => {
      ctx.beginPath();
      ctx.strokeStyle = s.color;
      ctx.lineWidth = 2.2;
      s.values.forEach((v, i) => {
        const x = xs(i);
        const y = ys(v);
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      });
      ctx.stroke();
      s.values.forEach((v, i) => {
        ctx.beginPath();
        ctx.fillStyle = s.color;
        ctx.arc(xs(i), ys(v), 3.5, 0, Math.PI * 2);
        ctx.fill();
      });
    });
    ctx.fillStyle = "#8b9aab";
    ctx.font = "11px Manrope, sans-serif";
    ctx.textAlign = "center";
    labels.forEach((lb, i) => ctx.fillText(lb, xs(i), h - 8));
  }

  function pie(canvas, slices) {
    const { ctx, w, h } = ctx2d(canvas);
    ctx.clearRect(0, 0, w, h);
    const total = slices.reduce((s, d) => s + d.value, 0) || 1;
    const cx = w * 0.38;
    const cy = h / 2;
    const r = Math.min(h * 0.4, w * 0.28);
    let a = -Math.PI / 2;
    slices.forEach((d) => {
      const da = (d.value / total) * Math.PI * 2;
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.arc(cx, cy, r, a, a + da);
      ctx.closePath();
      ctx.fillStyle = d.color;
      ctx.fill();
      a += da;
    });
    ctx.beginPath();
    ctx.fillStyle = "#121920";
    ctx.arc(cx, cy, r * 0.52, 0, Math.PI * 2);
    ctx.fill();
  }

  function grouped(canvas, revenue, spending) {
    const { ctx, w, h } = ctx2d(canvas);
    ctx.clearRect(0, 0, w, h);
    const max = Math.max(revenue, spending, 1);
    const pad = 28;
    const bw = Math.min(120, (w - 80) / 3);
    const base = h - 28;
    const scale = (h - 60) / max;
    const bars = [
      { x: w * 0.28 - bw / 2, v: revenue, c: "#5b8def", l: "Revenue" },
      { x: w * 0.62 - bw / 2, v: spending, c: "#e06c75", l: "Spending" }
    ];
    bars.forEach((b) => {
      const bh = b.v * scale;
      ctx.fillStyle = b.c;
      roundRect(ctx, b.x, base - bh, bw, bh, 8);
      ctx.fill();
      ctx.fillStyle = "#e8eef4";
      ctx.font = "600 12px Manrope, sans-serif";
      ctx.textAlign = "center";
      ctx.fillText(b.l, b.x + bw / 2, h - 8);
      ctx.fillStyle = "#f0b27a";
      ctx.fillText(`$${b.v.toFixed(1)}bn`, b.x + bw / 2, base - bh - 8);
    });
    ctx.strokeStyle = "rgba(232,238,244,0.12)";
    ctx.beginPath();
    ctx.moveTo(pad, base);
    ctx.lineTo(w - pad, base);
    ctx.stroke();
  }

  function waterfallHistory(canvas, points) {
    const { ctx, w, h } = ctx2d(canvas);
    ctx.clearRect(0, 0, w, h);
    if (!points.length) {
      ctx.fillStyle = "#8b9aab";
      ctx.font = "13px Manrope, sans-serif";
      ctx.textAlign = "center";
      ctx.fillText("Snapshots appear as you change the budget.", w / 2, h / 2);
      return;
    }
    const pad = { l: 44, r: 12, t: 18, b: 28 };
    const innerW = w - pad.l - pad.r;
    const innerH = h - pad.t - pad.b;
    const mag = Math.max(8, ...points.map((p) => Math.abs(p.surplus)));
    const zero = pad.t + innerH / 2;
    const unit = innerH / 2 / mag;
    ctx.strokeStyle = "rgba(232,238,244,0.2)";
    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    ctx.moveTo(pad.l, zero);
    ctx.lineTo(w - pad.r, zero);
    ctx.stroke();
    ctx.setLineDash([]);
    const gap = innerW / points.length;
    const bw = Math.max(8, gap * 0.55);
    points.forEach((p, i) => {
      const x = pad.l + gap * i + (gap - bw) / 2;
      const bh = p.surplus * unit;
      ctx.fillStyle = p.surplus >= 0 ? "#7dcea0" : "#e06c75";
      if (bh >= 0) roundRect(ctx, x, zero - bh, bw, Math.max(2, bh), 4);
      else roundRect(ctx, x, zero, bw, Math.max(2, -bh), 4);
      ctx.fill();
      ctx.fillStyle = "#8b9aab";
      ctx.font = "10px Manrope, sans-serif";
      ctx.textAlign = "center";
      ctx.fillText(p.label, x + bw / 2, h - 8);
    });
    ctx.fillStyle = "#8b9aab";
    ctx.font = "10px Manrope, sans-serif";
    ctx.textAlign = "right";
    ctx.fillText("surplus", pad.l - 6, pad.t + 8);
    ctx.fillText("deficit", pad.l - 6, h - pad.b);
  }

  function gauge(canvas, value, color, suffix) {
    const { ctx, w, h } = ctx2d(canvas);
    ctx.clearRect(0, 0, w, h);
    const cx = w / 2;
    const cy = h * 0.72;
    const r = Math.min(w, h) * 0.46;
    const start = Math.PI;
    const end = Math.PI * 2;
    ctx.lineWidth = 14;
    ctx.strokeStyle = "#2a3542";
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.arc(cx, cy, r, start, end);
    ctx.stroke();
    const t = Math.max(0, Math.min(100, value)) / 100;
    ctx.strokeStyle = color;
    ctx.beginPath();
    ctx.arc(cx, cy, r, start, start + Math.PI * t);
    ctx.stroke();
    ctx.fillStyle = "#e8eef4";
    ctx.font = "700 28px Cormorant Garamond, serif";
    ctx.textAlign = "center";
    ctx.fillText(`${Math.round(value)}${suffix || ""}`, cx, cy - 4);
  }

  return { chamber, bars, lines, pie, grouped, waterfallHistory, gauge };
})();
