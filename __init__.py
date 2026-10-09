"""Auto Resolution: width and height at an input image's aspect ratio for a megapixel target.

web/auto_resolution.js shows the resulting size on the node before you queue.
"""
import math

WEB_DIRECTORY = "web"


def fit_resolution(src_w, src_h, megapixels, multiple):
    # same math as core ResolutionSelector, with the image's exact ratio instead of a preset;
    # web/auto_resolution.js mirrors this for the live preview
    scale = math.sqrt(megapixels * 1024 * 1024 / (src_w * src_h))
    width = max(multiple, round(src_w * scale / multiple) * multiple)
    height = max(multiple, round(src_h * scale / multiple) * multiple)
    return width, height


class AutoResolution:
    @classmethod
    def INPUT_TYPES(cls):
        return {
            "required": {
                "image": ("IMAGE",),
                "megapixels": ("FLOAT", {"default": 1.0, "min": 0.1, "max": 16.0, "step": 0.01,
                                         "tooltip": "Target area. 1.0 MP = 1024x1024 worth of pixels."}),
                "multiple": ("INT", {"default": 32, "min": 8, "max": 128, "step": 8,
                                     "tooltip": "Width and height are rounded to this. Use what your model needs (8 for SD/SDXL, 16 for Flux/Wan, 32 for MiniMax H3)."}),
            },
        }

    RETURN_TYPES = ("INT", "INT")
    RETURN_NAMES = ("width", "height")
    FUNCTION = "calc"
    CATEGORY = "utils"
    DESCRIPTION = "Width and height at the input image's aspect ratio for a megapixel target."
    OUTPUT_NODE = True

    def calc(self, image, megapixels, multiple):
        src_h, src_w = image.shape[1], image.shape[2]
        width, height = fit_resolution(src_w, src_h, megapixels, multiple)
        return {"ui": {"text": [f"{src_w}x{src_h} -> {width} x {height}"]}, "result": (width, height)}


NODE_CLASS_MAPPINGS = {"AutoResolution": AutoResolution}
NODE_DISPLAY_NAME_MAPPINGS = {"AutoResolution": "Auto Resolution (From Image)"}
