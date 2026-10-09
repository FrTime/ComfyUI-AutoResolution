import { app } from "../../scripts/app.js";

// Live "source -> output" size line on Auto Resolution. Reads the size of the image shown in
// the upstream node's preview, so it updates as soon as an image or widget changes.
// Mirrors fit_resolution() in __init__.py.
function fit(srcW, srcH, mp, multiple) {
  const scale = Math.sqrt((mp * 1024 * 1024) / (srcW * srcH));
  return [
    Math.max(multiple, Math.round((srcW * scale) / multiple) * multiple),
    Math.max(multiple, Math.round((srcH * scale) / multiple) * multiple),
  ];
}

const COMMON = [[1, 1], [5, 4], [4, 3], [3, 2], [16, 10], [16, 9], [2, 1], [21, 9]]
  .flatMap(([a, b]) => (a === b ? [[a, b]] : [[a, b], [b, a]]));

// a common ratio (exact, or "≈" within 3%), else the reduced ratio if it is small, else w/h as N:1
function ratio(w, h) {
  const off = ([a, b]) => Math.abs(Math.log((w * b) / (h * a)));
  const [a, b] = COMMON.reduce((best, c) => (off(c) < off(best) ? c : best));
  if (off([a, b]) < 1e-9) return `${a}:${b}`;
  if (off([a, b]) < 0.03) return `≈${a}:${b}`;
  const gcd = (x, y) => (y ? gcd(y, x % y) : x);
  const g = gcd(w, h);
  return w / g <= 32 && h / g <= 32 ? `${w / g}:${h / g}` : `${(w / h).toFixed(2)}:1`;
}

function sourceSize(node) {
  const link = node.graph?.links?.[node.inputs?.find((i) => i.name === "image")?.link];
  const img = link && node.graph.getNodeById(link.origin_id)?.imgs?.[0];
  return img?.naturalWidth ? [img.naturalWidth, img.naturalHeight] : null;
}

function lines(node) {
  const value = (name) => node.widgets.find((w) => w.name === name).value;
  const src = sourceSize(node) ?? node.lastSource;
  if (!src) return ["connect a Load Image (or queue once)"];
  const [w, h] = fit(src[0], src[1], value("megapixels"), value("multiple"));
  const mp = ((w * h) / (1024 * 1024)).toFixed(2);
  return [`in:  ${src[0]} x ${src[1]}  ·  ${ratio(src[0], src[1])}`, `out: ${w} x ${h}  ·  ${ratio(w, h)}  ·  ${mp} MP`];
}

app.registerExtension({
  name: "autoResolution",
  beforeRegisterNodeDef(nodeType, nodeData) {
    if (nodeData.name !== "AutoResolution") return;

    const onNodeCreated = nodeType.prototype.onNodeCreated;
    nodeType.prototype.onNodeCreated = function () {
      onNodeCreated?.apply(this, arguments);
      this.addCustomWidget({
        name: "output_size",
        type: "auto_resolution_output_size",
        serialize: false,
        computeSize: (width) => [width, 42],
        draw(ctx, node, width, y) {
          ctx.save();
          ctx.fillStyle = "#8fd18f";
          ctx.font = "bold 13px sans-serif";
          ctx.textAlign = "left";
          lines(node).forEach((text, i) => ctx.fillText(text, 15, y + 16 + i * 18));
          ctx.restore();
        },
      });
      this.setSize(this.computeSize());
    };

    const onExecuted = nodeType.prototype.onExecuted;
    nodeType.prototype.onExecuted = function (message) {
      onExecuted?.apply(this, arguments);
      this.lastSource = message?.source ?? this.lastSource;
      this.setDirtyCanvas(true, false);
    };
  },
});
