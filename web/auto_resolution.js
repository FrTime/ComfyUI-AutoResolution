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

function sourceSize(node) {
  const link = node.graph?.links?.[node.inputs?.find((i) => i.name === "image")?.link];
  const img = link && node.graph.getNodeById(link.origin_id)?.imgs?.[0];
  return img?.naturalWidth ? [img.naturalWidth, img.naturalHeight] : null;
}

function label(node) {
  const value = (name) => node.widgets.find((w) => w.name === name).value;
  const src = sourceSize(node);
  if (!src) return node.lastRun ?? "connect a Load Image (or queue once)";
  const [w, h] = fit(src[0], src[1], value("megapixels"), value("multiple"));
  const mp = ((w * h) / (1024 * 1024)).toFixed(2);
  return `${src[0]}x${src[1]} -> ${w} x ${h}  (${mp} MP)`;
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
        computeSize: (width) => [width, 24],
        draw(ctx, node, width, y) {
          ctx.save();
          ctx.fillStyle = "#8fd18f";
          ctx.font = "bold 13px sans-serif";
          ctx.textAlign = "center";
          ctx.fillText(label(node), width / 2, y + 16);
          ctx.restore();
        },
      });
      this.setSize(this.computeSize());
    };

    const onExecuted = nodeType.prototype.onExecuted;
    nodeType.prototype.onExecuted = function (message) {
      onExecuted?.apply(this, arguments);
      this.lastRun = message?.text?.[0] ?? this.lastRun;
      this.setDirtyCanvas(true, false);
    };
  },
});
