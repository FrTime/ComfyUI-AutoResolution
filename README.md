# ComfyUI-AutoResolution

A single ComfyUI node that picks the width and height for you from the aspect ratio of an input image. You set the megapixels, and the node keeps the image's exact shape.

The node shows the output size live, so you see the resolution you'll get before you queue.

```
in:  1080 x 1920  ·  9:16
out: 768 x 1376  ·  ≈9:16  ·  1.01 MP
```

## Why

The core **Resolution Selector** node only knows a few preset ratios (1:1, 9:16, 16:9 and so on). For image-to-video and img2img you usually want the output to match the image you're feeding in. Otherwise you have to switch the preset every time you change images. This node reads the ratio straight from the image.

## Installation

### ComfyUI Manager

Not on the registry yet. Use the manual install below.

### Manual

```bash
cd ComfyUI/custom_nodes
git clone https://github.com/FrTime/ComfyUI-AutoResolution.git
```

Restart ComfyUI. It has no extra dependencies.

## Usage

Find **Auto Resolution (From Image)** under `utils`, or search "Auto Resolution".

1. Connect an `IMAGE` (e.g. from **Load Image**) to `image`.
2. Set `megapixels`.
3. Connect `width` and `height` to your latent, video or resize node.

### Inputs

| Input | Default | Description |
|---|---|---|
| `image` | | Image whose aspect ratio is used. Only its size is read. |
| `megapixels` | `1.0` | Target area. `1.0` = 1024×1024 worth of pixels. |
| `multiple` | `32` | Width and height are each rounded to the nearest multiple of this. |

### Outputs

| Output | Type | Description |
|---|---|---|
| `width` | `INT` | Output width in pixels |
| `height` | `INT` | Output height in pixels |

### Choosing `multiple`

Most models need dimensions divisible by a certain number. If they aren't, the image gets padded or cropped, or the model errors.

| Model family | `multiple` |
|---|---|
| SD 1.5 / SDXL | 8 |
| Flux, Wan, Qwen-Image | 16 |
| MiniMax H3 | 32 |

32 works for all of the above, which is why it's the default. Rounding can shift the ratio by a percent or two. A smaller multiple keeps it closer.

### Live preview

Two green lines under the widgets show the input and output sizes with their aspect ratios, plus the output megapixels. A ratio prefixed with `≈` is within 3% of that common ratio, which is normal after rounding to `multiple`. The lines update when you load a new image or change a widget. It reads the size from the upstream node's image preview, so it works with **Load Image** and anything else that shows a preview. If the image comes from a node without a preview, the lines fill in after the first run.

## How the size is calculated

This is the same math as the core Resolution Selector, using the image's own ratio:

```
scale  = sqrt(megapixels * 1024² / (src_w * src_h))
width  = round(src_w * scale / multiple) * multiple
height = round(src_h * scale / multiple) * multiple
```

## License

MIT
