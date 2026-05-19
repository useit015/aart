import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { GIFEncoder, applyPalette, quantize } from "gifenc";
import {
  BugIcon,
  CropIcon,
  DownloadIcon,
  ImageUpIcon,
  InfoIcon,
  LayersIcon,
  MenuIcon,
  MoonIcon,
  PlayIcon,
  Redo2Icon,
  RotateCcwIcon,
  RotateCwIcon,
  SparklesIcon,
  SquareIcon,
  SunIcon,
  Trash2Icon,
  Undo2Icon,
  WandSparklesIcon
} from "lucide-react";
import {
  CHAR_SETS,
  QUALITY_PRESET_ORDER,
  QUALITY_PRESETS,
  STYLE_LABELS,
  applyQualityPreset,
  buildAsciiCells,
  clamp,
  computeAnimationTransform,
  createDefaultSettings,
  resolveBackgroundBlurFrame,
  resolvePostProcessingPlan
} from "./ascii.js";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";

const EXPORT_FORMATS = [
  ["png", "PNG"],
  ["jpg", "JPG"],
  ["gif", "GIF (Animated)"],
  ["mp4-video", "MP4 (Video)"],
  ["mp4-anim", "MP4 (Animation)"]
];

const EFFECTS = [
  ["colorOverlay", "Color Overlay"],
  ["vignette", "Vignette"],
  ["scanLines", "Scan Lines"],
  ["crt", "CRT Curvature"],
  ["chromatic", "Chromatic"],
  ["bloom", "Bloom"],
  ["charBloom", "Character Bloom"],
  ["charChromatic", "Character Chromatic"],
  ["filmGrain", "Film Grain"],
  ["glitch", "Glitch"],
  ["rgbSplit", "RGB Split"],
  ["blur", "Blur"],
  ["pixelate", "Pixelate"],
  ["halftone", "Halftone"],
  ["filmDust", "Film Dust"],
  ["sparkles", "Sparkles"]
];

const DEMO_PALETTES = [
  ["#ff2a7f", "#21d4fd", "#10101a"],
  ["#fed766", "#2ab7ca", "#2d3047"],
  ["#f25f5c", "#70c1b3", "#111111"],
  ["#b8f2e6", "#ffa69e", "#1b1b32"],
  ["#9b5de5", "#00f5d4", "#11151c"],
  ["#f15bb5", "#fee440", "#141414"]
];

const DEMO_PRESETS = Array.from({ length: 31 }, (_, index) => ({
  id: index + 1,
  label: `Demo ${String(index + 1).padStart(2, "0")}`
}));

const VIDEO_DEMO_PRESETS = Array.from({ length: 3 }, (_, index) => ({
  id: index + 1,
  label: `Video ${String(index + 1).padStart(2, "0")}`
}));

const IMAGE_EXTENSIONS = new Set(["avif", "bmp", "gif", "jpeg", "jpg", "png", "svg", "webp"]);
const VIDEO_EXTENSIONS = new Set(["avi", "m4v", "mkv", "mov", "mp4", "mpeg", "mpg", "ogv", "webm"]);
const UPLOAD_ACCEPT = [
  "image/*",
  "video/*",
  ...[...IMAGE_EXTENSIONS].map((extension) => `.${extension}`),
  ...[...VIDEO_EXTENSIONS].map((extension) => `.${extension}`)
].join(",");

const BACKGROUND_PALETTES = [
  ["#101820", "#fee715", "#1f7a8c"],
  ["#0b132b", "#5bc0be", "#fca311"],
  ["#2b2d42", "#ef233c", "#8d99ae"],
  ["#031d44", "#ff7d00", "#f9c74f"],
  ["#011627", "#2ec4b6", "#ff9f1c"],
  ["#121212", "#ff4d6d", "#48cae4"],
  ["#132a13", "#90a955", "#ecf39e"],
  ["#240046", "#ff9e00", "#9d4edd"],
  ["#001219", "#0a9396", "#ee9b00"],
  ["#22223b", "#c9ada7", "#f2e9e4"],
  ["#003049", "#d62828", "#f77f00"],
  ["#03045e", "#00b4d8", "#caf0f8"]
];

const BACKGROUND_PRESETS = Array.from({ length: 34 }, (_, index) => {
  const colors = BACKGROUND_PALETTES[index % BACKGROUND_PALETTES.length];
  return {
    id: index + 1,
    label: `Background ${String(index + 1).padStart(2, "0")}`,
    colors
  };
});

const CHANGELOG_ENTRIES = [
  {
    title: "Parity Rebuild",
    description: "31 demos, 34 backgrounds, video controls, GIF/MP4 exports, crop, lights, masks, and post-processing."
  },
  {
    title: "Editor Controls",
    description: "Cube and disco controls, effect intensity sliders, export duration/FPS, and a responsive shadcn shell."
  },
  {
    title: "Feedback",
    description: "Bug and feature reporting with captured technical details plus sent and retry states."
  }
];

const EFFECT_AMOUNT_CONTROLS = {
  vignette: "Vignette Amount",
  scanLines: "Scan Lines Amount",
  crt: "CRT Amount",
  chromatic: "Chromatic Amount",
  bloom: "Bloom Amount",
  charBloom: "Character Bloom Amount",
  charChromatic: "Character Chromatic Amount",
  filmGrain: "Film Grain Amount",
  glitch: "Glitch Amount",
  rgbSplit: "RGB Split Amount",
  blur: "Blur Amount",
  pixelate: "Pixelate Amount",
  halftone: "Halftone Amount",
  filmDust: "Film Dust Amount",
  sparkles: "Sparkles Amount"
};

const CROP_HANDLES = [
  ["nw", "top left", 0, 0],
  ["n", "top", 0.5, 0],
  ["ne", "top right", 1, 0],
  ["e", "right", 1, 0.5],
  ["se", "bottom right", 1, 1],
  ["s", "bottom", 0.5, 1],
  ["sw", "bottom left", 0, 1],
  ["w", "left", 0, 0.5]
];

function isCanvasRuntimeAvailable() {
  return typeof navigator === "undefined" || !/jsdom/i.test(navigator.userAgent);
}

function createDemoDataUrl(seed = 0) {
  if (!isCanvasRuntimeAvailable()) {
    return `data:image/svg+xml,${encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" width="920" height="640"><rect width="920" height="640" fill="#111018"/><text x="80" y="240" fill="#ffffff" font-family="monospace" font-size="96">GLYPH</text><text x="80" y="370" fill="#21d4fd" font-family="monospace" font-size="116">STUDIO ${seed}</text></svg>`)}`;
  }

  const canvas = document.createElement("canvas");
  canvas.width = 920;
  canvas.height = 640;
  const ctx = canvas.getContext("2d");
  if (!ctx) return "";
  const [a, b, c] = DEMO_PALETTES[seed % DEMO_PALETTES.length];
  const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
  gradient.addColorStop(0, a);
  gradient.addColorStop(0.52, b);
  gradient.addColorStop(1, c);
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.globalCompositeOperation = "screen";
  for (let i = 0; i < 24; i += 1) {
    const radius = 28 + ((i * 19 + seed * 11) % 115);
    const x = (i * 83 + seed * 127) % canvas.width;
    const y = (i * 47 + seed * 91) % canvas.height;
    const dot = ctx.createRadialGradient(x, y, 0, x, y, radius);
    dot.addColorStop(0, "rgba(255,255,255,.92)");
    dot.addColorStop(1, "rgba(255,255,255,0)");
    ctx.fillStyle = dot;
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalCompositeOperation = "source-over";
  ctx.fillStyle = "rgba(0,0,0,.28)";
  ctx.fillRect(0, canvas.height * 0.62, canvas.width, canvas.height * 0.38);
  ctx.fillStyle = "rgba(255,255,255,.87)";
  ctx.font = "700 86px ui-monospace, SFMono-Regular, Menlo, monospace";
  ctx.fillText("GLYPH", 86, 205);
  ctx.font = "700 116px ui-monospace, SFMono-Regular, Menlo, monospace";
  ctx.fillText("STUDIO", 84, 338);
  return canvas.toDataURL("image/png");
}

function createBackgroundDataUrl(seed = 0) {
  const preset = BACKGROUND_PRESETS[(seed - 1 + BACKGROUND_PRESETS.length) % BACKGROUND_PRESETS.length] || BACKGROUND_PRESETS[0];
  const [a, b, c] = preset.colors;
  if (!isCanvasRuntimeAvailable()) {
    return `data:image/svg+xml,${encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="760"><defs><linearGradient id="g" x1="0" x2="1" y1="0" y2="1"><stop stop-color="${a}"/><stop offset=".55" stop-color="${b}"/><stop offset="1" stop-color="${c}"/></linearGradient></defs><rect width="1200" height="760" fill="url(#g)"/></svg>`)}`;
  }

  const canvas = document.createElement("canvas");
  canvas.width = 1200;
  canvas.height = 760;
  const ctx = canvas.getContext("2d");
  if (!ctx) return "";
  const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
  gradient.addColorStop(0, a);
  gradient.addColorStop(0.5, b);
  gradient.addColorStop(1, c);
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.globalCompositeOperation = "screen";
  for (let i = 0; i < 42; i += 1) {
    const x = (i * 149 + seed * 83) % canvas.width;
    const y = (i * 89 + seed * 59) % canvas.height;
    const radius = 48 + ((i * 17 + seed * 23) % 160);
    const glow = ctx.createRadialGradient(x, y, 0, x, y, radius);
    glow.addColorStop(0, "rgba(255,255,255,.34)");
    glow.addColorStop(1, "rgba(255,255,255,0)");
    ctx.fillStyle = glow;
    ctx.fillRect(x - radius, y - radius, radius * 2, radius * 2);
  }
  ctx.globalCompositeOperation = "source-over";
  return canvas.toDataURL("image/png");
}

function downloadBlob(blob, filename) {
  const link = document.createElement("a");
  const url = URL.createObjectURL(blob);
  link.href = url;
  link.download = filename;
  link.click();
  window.setTimeout(() => URL.revokeObjectURL(url), 500);
}

function getCanvasPoint(event, canvas) {
  const rect = canvas.getBoundingClientRect();
  return getRelativePoint(event, rect);
}

function getRelativePoint(event, rect) {
  return {
    x: clamp((event.clientX - rect.left) / rect.width, 0, 1),
    y: clamp((event.clientY - rect.top) / rect.height, 0, 1)
  };
}

function getFileExtension(fileName = "") {
  const match = /\.([^.]+)$/.exec(fileName.toLowerCase());
  return match ? match[1] : "";
}

function getUploadKind(file) {
  const type = file.type || "";
  if (type.startsWith("image/")) return "image";
  if (type.startsWith("video/")) return "video";

  const extension = getFileExtension(file.name);
  if (IMAGE_EXTENSIONS.has(extension)) return "image";
  if (VIDEO_EXTENSIONS.has(extension)) return "video";
  return null;
}

function sanitizeCrop(crop) {
  const x = clamp(crop.x, 0, 0.95);
  const y = clamp(crop.y, 0, 0.95);
  return {
    x,
    y,
    w: clamp(crop.w, 0.05, 1 - x),
    h: clamp(crop.h, 0.05, 1 - y),
    rotation: Number(crop.rotation || 0)
  };
}

function cropFromHandle(startCrop, point, handle) {
  if (handle === "move") {
    return sanitizeCrop({
      ...startCrop,
      x: point.x - startCrop.w / 2,
      y: point.y - startCrop.h / 2
    });
  }

  let left = startCrop.x;
  let top = startCrop.y;
  let right = startCrop.x + startCrop.w;
  let bottom = startCrop.y + startCrop.h;

  if (handle.includes("w")) left = clamp(point.x, 0, right - 0.05);
  if (handle.includes("e")) right = clamp(point.x, left + 0.05, 1);
  if (handle.includes("n")) top = clamp(point.y, 0, bottom - 0.05);
  if (handle.includes("s")) bottom = clamp(point.y, top + 0.05, 1);

  return sanitizeCrop({
    ...startCrop,
    x: left,
    y: top,
    w: right - left,
    h: bottom - top
  });
}

function drawCroppedSource(ctx, source, sourceWidth, sourceHeight, width, height, crop) {
  const sx = clamp(crop.x, 0, 0.95) * sourceWidth;
  const sy = clamp(crop.y, 0, 0.95) * sourceHeight;
  const sw = clamp(crop.w, 0.05, 1 - crop.x) * sourceWidth;
  const sh = clamp(crop.h, 0.05, 1 - crop.y) * sourceHeight;
  ctx.save();
  ctx.translate(width / 2, height / 2);
  ctx.rotate(((crop.rotation || 0) * Math.PI) / 180);
  ctx.drawImage(source, sx, sy, sw, sh, -width / 2, -height / 2, width, height);
  ctx.restore();
}

function drawVideoDemoMotion(ctx, width, height, seed, timeSeconds) {
  const time = Number(timeSeconds || 0);
  const hue = (seed * 31 + time * 48) % 360;
  const sweep = (time % 6) / 6;
  ctx.save();
  ctx.globalCompositeOperation = "screen";
  const beam = ctx.createLinearGradient(width * (sweep - 0.35), 0, width * (sweep + 0.45), height);
  beam.addColorStop(0, "rgba(255,255,255,0)");
  beam.addColorStop(0.5, `hsla(${hue}, 95%, 68%, .62)`);
  beam.addColorStop(1, "rgba(255,255,255,0)");
  ctx.fillStyle = beam;
  ctx.fillRect(0, 0, width, height);

  for (let i = 0; i < 10; i += 1) {
    const x = ((i * 0.137 + time * (0.035 + i * 0.002) + seed * 0.019) % 1) * width;
    const y = (0.18 + ((i * 0.113 + Math.sin(time * 0.8 + i) * 0.08 + seed * 0.011) % 0.68)) * height;
    const radius = Math.max(22, Math.min(width, height) * (0.035 + ((i + seed) % 4) * 0.012));
    const glow = ctx.createRadialGradient(x, y, 0, x, y, radius * 3);
    glow.addColorStop(0, `hsla(${(hue + i * 34) % 360}, 100%, 72%, .72)`);
    glow.addColorStop(1, "rgba(255,255,255,0)");
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(x, y, radius * 3, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

function drawMaskGeometry(ctx, width, height, strokes, mode = "fill") {
  if (!strokes.length) return;

  strokes.forEach((stroke) => {
    const points = stroke.points || [];
    if (!points.length) return;
    const first = points[0];
    const last = points[points.length - 1] || first;
    const x = first.x * width;
    const y = first.y * height;
    const endX = last.x * width;
    const endY = last.y * height;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.lineWidth = stroke.brushSize || 30;

    if (stroke.tool === "rect") {
      const rectX = Math.min(x, endX);
      const rectY = Math.min(y, endY);
      const rectW = Math.max(Math.abs(endX - x), stroke.brushSize || 30);
      const rectH = Math.max(Math.abs(endY - y), stroke.brushSize || 30);
      mode === "stroke" ? ctx.strokeRect(rectX, rectY, rectW, rectH) : ctx.fillRect(rectX, rectY, rectW, rectH);
      return;
    }

    if (stroke.tool === "ellipse") {
      ctx.beginPath();
      ctx.ellipse(
        (x + endX) / 2,
        (y + endY) / 2,
        Math.max(Math.abs(endX - x) / 2, (stroke.brushSize || 30) / 2),
        Math.max(Math.abs(endY - y) / 2, (stroke.brushSize || 30) / 2),
        0,
        0,
        Math.PI * 2
      );
      mode === "stroke" ? ctx.stroke() : ctx.fill();
      return;
    }

    if (points.length === 1) {
      ctx.beginPath();
      ctx.arc(x, y, (stroke.brushSize || 30) / 2, 0, Math.PI * 2);
      mode === "stroke" ? ctx.stroke() : ctx.fill();
      return;
    }

    ctx.beginPath();
    ctx.moveTo(x, y);
    points.slice(1).forEach((point) => ctx.lineTo(point.x * width, point.y * height));
    ctx.stroke();
  });
}

async function nextAnimationFrame() {
  await new Promise((resolve) => requestAnimationFrame(resolve));
}

function cloneCanvasAtScale(canvas, scale = 1) {
  const exportCanvas = document.createElement("canvas");
  exportCanvas.width = Math.max(1, Math.round(canvas.width * scale));
  exportCanvas.height = Math.max(1, Math.round(canvas.height * scale));
  const exportCtx = exportCanvas.getContext("2d");
  exportCtx.imageSmoothingEnabled = false;
  exportCtx.drawImage(canvas, 0, 0, exportCanvas.width, exportCanvas.height);
  return exportCanvas;
}

function SelectControl({ label, value, onChange, options }) {
  return (
    <div className="flex flex-col gap-1.5">
      <Label className="text-xs text-muted-foreground">{label}</Label>
      <Select value={String(value)} onValueChange={onChange}>
        <SelectTrigger aria-label={label} className="w-full">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectGroup>
            {options.map(([optionValue, optionLabel]) => (
              <SelectItem key={optionValue} value={String(optionValue)}>
                {optionLabel}
              </SelectItem>
            ))}
          </SelectGroup>
        </SelectContent>
      </Select>
    </div>
  );
}

function RangeControl({ label, min, max, step = 1, value, suffix = "", onChange }) {
  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between gap-3">
        <Label className="text-xs text-muted-foreground">{label}</Label>
        <span className="min-w-12 text-right text-xs tabular-nums text-muted-foreground">
          {value}{suffix}
        </span>
      </div>
      <Slider
        aria-label={label}
        min={min}
        max={max}
        step={step}
        value={[Number(value)]}
        onValueChange={([next]) => onChange(next)}
      />
    </div>
  );
}

function ToggleControl({ label, checked, onChange }) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-lg border bg-card/60 px-3 py-2">
      <Label className="text-sm">{label}</Label>
      <Switch checked={checked} onCheckedChange={onChange} aria-label={label} />
    </div>
  );
}

function ControlCard({ title, description, children }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        {description ? <CardDescription>{description}</CardDescription> : null}
      </CardHeader>
      <CardContent className="flex flex-col gap-4">{children}</CardContent>
    </Card>
  );
}

function ChangelogPage({ onBack }) {
  return (
    <div className="min-h-screen bg-background p-4 lg:p-8">
      <main className="mx-auto flex max-w-3xl flex-col gap-6">
        <Button asChild variant="outline" className="w-fit">
          <a
            href="/"
            onClick={(event) => {
              event.preventDefault();
              onBack();
            }}
          >
            Back to Glyph Studio
          </a>
        </Button>
        <div className="flex flex-col gap-2">
          <Badge variant="secondary" className="w-fit">Public editor notes</Badge>
          <h1 className="text-4xl font-semibold tracking-tight">Changelog</h1>
          <p className="text-sm text-muted-foreground">
            Current editor surface, including controls, export behavior, and feedback states.
          </p>
        </div>
        <div className="flex flex-col gap-3">
          {CHANGELOG_ENTRIES.map((entry) => (
            <Card key={entry.title}>
              <CardHeader>
                <CardTitle>{entry.title}</CardTitle>
                <CardDescription>{entry.description}</CardDescription>
              </CardHeader>
            </Card>
          ))}
        </div>
      </main>
    </div>
  );
}

function snapshotCanvas(ctx, width, height) {
  const snapshot = document.createElement("canvas");
  snapshot.width = width;
  snapshot.height = height;
  snapshot.getContext("2d").drawImage(ctx.canvas, 0, 0, width, height);
  return snapshot;
}

function drawTintedSnapshot(ctx, snapshot, width, height, dx, color, alpha) {
  const tint = document.createElement("canvas");
  tint.width = width;
  tint.height = height;
  const tintCtx = tint.getContext("2d");
  tintCtx.drawImage(snapshot, 0, 0);
  tintCtx.globalCompositeOperation = "source-atop";
  tintCtx.fillStyle = color;
  tintCtx.fillRect(0, 0, width, height);
  ctx.save();
  ctx.globalCompositeOperation = "screen";
  ctx.globalAlpha = alpha;
  ctx.drawImage(tint, dx, 0, width, height);
  ctx.restore();
}

function applyPixelate(ctx, snapshot, width, height, amount) {
  const pixelCanvas = document.createElement("canvas");
  const pixelCtx = pixelCanvas.getContext("2d");
  const scale = 0.22 - amount * 0.16;
  pixelCanvas.width = Math.max(1, Math.round(width * scale));
  pixelCanvas.height = Math.max(1, Math.round(height * scale));
  pixelCtx.imageSmoothingEnabled = false;
  pixelCtx.drawImage(snapshot, 0, 0, pixelCanvas.width, pixelCanvas.height);
  ctx.save();
  ctx.imageSmoothingEnabled = false;
  ctx.globalAlpha = 0.4 + amount * 0.48;
  ctx.drawImage(pixelCanvas, 0, 0, pixelCanvas.width, pixelCanvas.height, 0, 0, width, height);
  ctx.restore();
}

function applyHalftone(ctx, width, height, amount) {
  ctx.save();
  ctx.globalCompositeOperation = "multiply";
  const gap = 24 - amount * 12;
  for (let y = 0; y < height; y += gap) {
    for (let x = 0; x < width; x += gap) {
      const radius = 1.5 + ((x * 7 + y * 11) % (4 + amount * 10));
      ctx.fillStyle = `rgba(0,0,0,${0.08 + amount * 0.18 + radius / 90})`;
      ctx.beginPath();
      ctx.arc(x, y, radius, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  ctx.restore();
}

function applyGlitch(ctx, snapshot, width, height, tick, amount) {
  ctx.save();
  const slices = 4 + Math.round(amount * 12);
  for (let i = 0; i < slices; i += 1) {
    const sliceHeight = 6 + ((i * 17) % 28);
    const y = (i * 71 + Math.floor(tick / 35)) % height;
    const offset = ((i % 2 ? -1 : 1) * (4 + amount * 32 + ((i * 13) % 12)));
    ctx.globalAlpha = 0.82;
    ctx.drawImage(snapshot, 0, y, width, sliceHeight, offset, y, width, sliceHeight);
  }
  ctx.restore();
}

function applyCrt(ctx, width, height, amount) {
  ctx.save();
  ctx.fillStyle = `rgba(255,255,255,${0.025 + amount * 0.055})`;
  for (let y = 0; y < height; y += 4) ctx.fillRect(0, y, width, 1);
  const curve = ctx.createRadialGradient(width / 2, height / 2, width * 0.1, width / 2, height / 2, width * 0.78);
  curve.addColorStop(0, "rgba(255,255,255,.04)");
  curve.addColorStop(0.75, "rgba(0,0,0,.02)");
  curve.addColorStop(1, `rgba(0,0,0,${0.16 + amount * 0.34})`);
  ctx.fillStyle = curve;
  ctx.fillRect(0, 0, width, height);
  ctx.restore();
}

function applyImageEffects(ctx, width, height, settings, tick = 0) {
  const effects = settings.effects;
  const passes = resolvePostProcessingPlan(effects);
  if (!passes.length) return;
  const snapshot = snapshotCanvas(ctx, width, height);
  const amount = (key, fallback = 50) => Number(effects[`${key}Amount`] ?? fallback) / 100;

  if (passes.includes("pixelate")) applyPixelate(ctx, snapshot, width, height, amount("pixelate"));
  if (passes.includes("blur")) {
    ctx.save();
    ctx.globalAlpha = 0.28 + amount("blur") * 0.58;
    ctx.filter = `blur(${1 + amount("blur") * 5}px)`;
    ctx.drawImage(snapshot, 0, 0, width, height);
    ctx.restore();
  }
  if (passes.includes("bloom")) {
    ctx.save();
    ctx.globalCompositeOperation = "screen";
    ctx.globalAlpha = 0.2 + amount("bloom") * 0.58;
    ctx.filter = `blur(${4 + amount("bloom") * 18}px) saturate(${1.1 + amount("bloom") * 0.7})`;
    ctx.drawImage(snapshot, 0, 0, width, height);
    ctx.restore();
  }
  if (passes.includes("chromatic") || passes.includes("rgb-split")) {
    const splitAmount = passes.includes("rgb-split") ? amount("rgbSplit") : amount("chromatic");
    const offset = 2 + splitAmount * (passes.includes("rgb-split") ? 13 : 7);
    drawTintedSnapshot(ctx, snapshot, width, height, -offset, "rgb(255,40,100)", 0.24 + splitAmount * 0.28);
    drawTintedSnapshot(ctx, snapshot, width, height, offset, "rgb(30,210,255)", 0.22 + splitAmount * 0.25);
  }
  if (passes.includes("glitch")) applyGlitch(ctx, snapshot, width, height, tick, amount("glitch"));

  if (effects.colorOverlay) {
    ctx.save();
    ctx.globalAlpha = effects.colorOpacity / 100;
    ctx.globalCompositeOperation = effects.colorBlend;
    ctx.fillStyle = effects.color;
    ctx.fillRect(0, 0, width, height);
    ctx.restore();
  }
  if (effects.vignette) {
    const vignette = ctx.createRadialGradient(width / 2, height / 2, width * (0.22 - amount("vignette") * 0.1), width / 2, height / 2, width * 0.72);
    vignette.addColorStop(0, "rgba(0,0,0,0)");
    vignette.addColorStop(1, `rgba(0,0,0,${0.24 + amount("vignette") * 0.62})`);
    ctx.fillStyle = vignette;
    ctx.fillRect(0, 0, width, height);
  }
  if (effects.scanLines) {
    ctx.fillStyle = `rgba(0,0,0,${0.08 + amount("scanLines") * 0.32})`;
    for (let y = 0; y < height; y += 6) ctx.fillRect(0, y, width, 1);
  }
  if (passes.includes("crt")) applyCrt(ctx, width, height, amount("crt"));
  if (passes.includes("halftone")) applyHalftone(ctx, width, height, amount("halftone"));
  if (effects.filmGrain || effects.filmDust) {
    const dustAmount = effects.filmDust ? amount("filmDust") : amount("filmGrain");
    ctx.fillStyle = effects.filmDust ? `rgba(255,255,255,${0.08 + dustAmount * 0.32})` : `rgba(255,255,255,${0.04 + dustAmount * 0.16})`;
    for (let i = 0; i < (effects.filmDust ? 40 + dustAmount * 180 : 200 + dustAmount * 1000); i += 1) {
      ctx.fillRect(Math.random() * width, Math.random() * height, effects.filmDust ? 2 : 1, effects.filmDust ? 2 : 1);
    }
  }
  if (effects.sparkles) {
    ctx.fillStyle = "rgba(255,255,255,.85)";
    for (let i = 0; i < 12 + amount("sparkles") * 48; i += 1) ctx.fillText("*", (i * 97) % width, (i * 53) % height);
  }
}

function pickRandomGlyph(cell, settings) {
  const chars = settings.characters || CHAR_SETS.standard;
  const index = Math.abs(Math.floor((cell.x * 13 + cell.y * 7 + cell.luminance) % chars.length));
  return chars[index] || cell.glyph;
}

function drawStyledCell(ctx, cell, settings, tick, width, height) {
  const centerX = cell.x + cell.w / 2;
  const centerY = cell.y + cell.h / 2;
  const transform = computeAnimationTransform(cell, settings, tick, width, height);
  ctx.save();
  ctx.globalAlpha = (settings.charOpacity / 100) * transform.alpha;
  ctx.globalCompositeOperation = settings.blendMode;
  ctx.fillStyle = cell.color;
  ctx.strokeStyle = cell.color;
  ctx.lineWidth = Math.max(1, settings.fontSize / 11);
  ctx.shadowColor = settings.effects.charBloom || settings.effects.bloom ? cell.color : "transparent";
  ctx.shadowBlur = settings.effects.charBloom ? 3 + (settings.effects.charBloomAmount / 100) * 14 : settings.effects.bloom ? 14 : 0;

  if (settings.animated) {
    ctx.translate(centerX + transform.x, centerY + transform.y);
    ctx.scale(transform.scale, transform.scale);
    ctx.translate(-centerX, -centerY);
  }

  if (settings.style === "dots") {
    ctx.beginPath();
    ctx.arc(centerX, centerY, Math.max(1, (cell.w * (1 - cell.luminance / 280)) / 2), 0, Math.PI * 2);
    ctx.fill();
  } else if (settings.style === "lines") {
    ctx.beginPath();
    ctx.moveTo(cell.x, centerY);
    ctx.lineTo(cell.x + cell.w, centerY);
    ctx.stroke();
  } else if (settings.style === "diagonal") {
    ctx.beginPath();
    ctx.moveTo(cell.x, cell.y + cell.h);
    ctx.lineTo(cell.x + cell.w, cell.y);
    ctx.stroke();
  } else if (settings.style === "cross") {
    ctx.beginPath();
    ctx.moveTo(cell.x, centerY);
    ctx.lineTo(cell.x + cell.w, centerY);
    ctx.moveTo(centerX, cell.y);
    ctx.lineTo(centerX, cell.y + cell.h);
    ctx.stroke();
  } else if (settings.style === "diamond") {
    ctx.beginPath();
    ctx.moveTo(centerX, cell.y);
    ctx.lineTo(cell.x + cell.w, centerY);
    ctx.lineTo(centerX, cell.y + cell.h);
    ctx.lineTo(cell.x, centerY);
    ctx.closePath();
    ctx.stroke();
  } else if (settings.style === "block-chars") {
    const blocks = "█▓▒░ ";
    const block = blocks[Math.min(blocks.length - 1, Math.round((cell.luminance / 255) * (blocks.length - 1)))] || "█";
    ctx.font = `${settings.fontSize}px ui-monospace, SFMono-Regular, Menlo, monospace`;
    ctx.fillText(block, cell.x, cell.y + cell.h);
  } else if (settings.style === "mixed") {
    const variant = Math.abs(Math.floor(cell.x * 17 + cell.y * 31 + cell.luminance)) % 4;
    if (variant === 0) {
      ctx.beginPath();
      ctx.arc(centerX, centerY, Math.max(1, cell.w * 0.28), 0, Math.PI * 2);
      ctx.fill();
    } else if (variant === 1) {
      ctx.beginPath();
      ctx.moveTo(cell.x, cell.y + cell.h);
      ctx.lineTo(cell.x + cell.w, cell.y);
      ctx.stroke();
    } else if (variant === 2) {
      ctx.strokeRect(cell.x, cell.y, cell.w * 0.82, cell.h * 0.82);
    } else {
      ctx.beginPath();
      ctx.moveTo(centerX, cell.y);
      ctx.lineTo(cell.x + cell.w, centerY);
      ctx.lineTo(centerX, cell.y + cell.h);
      ctx.lineTo(cell.x, centerY);
      ctx.closePath();
      ctx.stroke();
    }
  } else if (["pixel", "lego", "mosaic"].includes(settings.style)) {
    ctx.beginPath();
    ctx.roundRect(cell.x, cell.y, cell.w * 0.92, cell.h * 0.92, settings.style === "lego" ? 3 : 0);
    ctx.fill();
    if (settings.style === "lego") {
      ctx.fillStyle = "rgba(255,255,255,.28)";
      ctx.beginPath();
      ctx.arc(centerX, centerY, Math.min(cell.w, cell.h) * 0.18, 0, Math.PI * 2);
      ctx.fill();
    }
  } else if (settings.style === "braille") {
    ctx.font = `${settings.fontSize}px ui-monospace, SFMono-Regular, Menlo, monospace`;
    ctx.fillText("⣿⣶⣤⡀"[Math.round((1 - cell.luminance / 255) * 5)] || "⠂", cell.x, cell.y + cell.h);
  } else if (settings.style === "3d") {
    const topShade = Number(settings.cubeTopShade || 1.35);
    const lightSide = Number(settings.cubeLightSide || 1);
    const darkSide = Number(settings.cubeDarkSide || 0.55);
    const outline = Number(settings.cubeOutline || 0);
    const shade = (alpha) => `rgba(255,255,255,${Math.max(0, Math.min(0.88, alpha))})`;
    const shadow = (alpha) => `rgba(0,0,0,${Math.max(0, Math.min(0.82, alpha))})`;
    ctx.beginPath();
    ctx.moveTo(centerX, cell.y);
    ctx.lineTo(cell.x + cell.w, cell.y + cell.h * 0.28);
    ctx.lineTo(centerX, cell.y + cell.h * 0.58);
    ctx.lineTo(cell.x, cell.y + cell.h * 0.28);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = shade((topShade - 1) * 0.36);
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(settings.cubeFlipLight ? cell.x : cell.x + cell.w, cell.y + cell.h * 0.28);
    ctx.lineTo(centerX, cell.y + cell.h * 0.58);
    ctx.lineTo(centerX, cell.y + cell.h);
    ctx.lineTo(settings.cubeFlipLight ? cell.x : cell.x + cell.w, cell.y + cell.h * 0.7);
    ctx.closePath();
    ctx.fillStyle = shade(lightSide * 0.18);
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(settings.cubeFlipLight ? cell.x + cell.w : cell.x, cell.y + cell.h * 0.28);
    ctx.lineTo(centerX, cell.y + cell.h * 0.58);
    ctx.lineTo(centerX, cell.y + cell.h);
    ctx.lineTo(settings.cubeFlipLight ? cell.x + cell.w : cell.x, cell.y + cell.h * 0.7);
    ctx.closePath();
    ctx.fillStyle = shadow((1 - darkSide) * 0.36);
    ctx.fill();
    if (outline > 0) {
      ctx.strokeStyle = "rgba(255,255,255,.22)";
      ctx.lineWidth = outline;
      ctx.strokeRect(cell.x, cell.y, cell.w, cell.h);
    }
  } else if (settings.style === "disco") {
    const randomOffset = settings.discoRandomize ? (cell.x * 3 + cell.y * 5 + (settings.discoSeed || 0) * 97) : 0;
    const hue = (randomOffset + (cell.x + cell.y) * (settings.discoUniformity / 120) + tick * 0.04) % 360;
    const gradient = ctx.createLinearGradient(cell.x, cell.y, cell.x, cell.y + cell.h);
    gradient.addColorStop(0, `hsl(${hue}, 95%, ${68 + (1 - cell.luminance / 255) * 18}%)`);
    gradient.addColorStop(0.54, `hsl(${(hue + 22) % 360}, 82%, ${42 + (1 - cell.luminance / 255) * 24}%)`);
    gradient.addColorStop(1, `hsl(${(hue + 50) % 360}, 74%, ${24 + (1 - cell.luminance / 255) * 18}%)`);
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.moveTo(centerX, cell.y);
    ctx.lineTo(cell.x + cell.w, centerY);
    ctx.lineTo(centerX, cell.y + cell.h);
    ctx.lineTo(cell.x, centerY);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = "rgba(255,255,255,.24)";
    ctx.stroke();
  } else {
    ctx.font = `${settings.fontSize}px ui-monospace, SFMono-Regular, Menlo, monospace`;
    const glyph = settings.randomize ? pickRandomGlyph(cell, settings) : cell.glyph;
    if (settings.effects.charChromatic) {
      ctx.save();
      ctx.shadowBlur = 0;
      ctx.globalCompositeOperation = "screen";
      ctx.globalAlpha *= 0.25 + (settings.effects.charChromaticAmount / 100) * 0.75;
      ctx.fillStyle = "rgb(255,42,127)";
      ctx.fillText(glyph, cell.x - 2, cell.y + cell.h);
      ctx.fillStyle = "rgb(33,212,253)";
      ctx.fillText(glyph, cell.x + 2, cell.y + cell.h);
      ctx.restore();
    }
    ctx.fillStyle = cell.color;
    ctx.fillText(glyph, cell.x, cell.y + cell.h);
  }
  ctx.restore();
}

function App() {
  const [settings, setSettings] = useState(createDefaultSettings);
  const [sourceUrl, setSourceUrl] = useState("");
  const [sourceName, setSourceName] = useState("");
  const [sourceKind, setSourceKind] = useState("image");
  const [videoUrl, setVideoUrl] = useState("");
  const [isPlaying, setIsPlaying] = useState(false);
  const [seek, setSeek] = useState(0);
  const [duration, setDuration] = useState(100);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [backgroundUrl, setBackgroundUrl] = useState("");
  const [lights, setLights] = useState([]);
  const [activeLightId, setActiveLightId] = useState(null);
  const [maskStrokes, setMaskStrokes] = useState([]);
  const [canvasTool, setCanvasTool] = useState("none");
  const [crop, setCrop] = useState({ x: 0, y: 0, w: 1, h: 1, rotation: 0 });
  const [cropHistory, setCropHistory] = useState([]);
  const [cropFuture, setCropFuture] = useState([]);
  const [status, setStatus] = useState("Drop an image or video here");
  const [theme, setTheme] = useState("dark");
  const [modal, setModal] = useState(null);
  const [exporting, setExporting] = useState(false);
  const [demoSeed, setDemoSeed] = useState(0);
  const [fileMeta, setFileMeta] = useState(null);
  const [sourceStats, setSourceStats] = useState(null);
  const [feedbackState, setFeedbackState] = useState({ bug: "idle", feature: "idle" });
  const [route, setRoute] = useState(() => (typeof window === "undefined" ? "/" : window.location.pathname));
  const canvasRef = useRef(null);
  const sourceImageRef = useRef(null);
  const backgroundImageRef = useRef(null);
  const videoRef = useRef(null);
  const fileRef = useRef(null);
  const frameRef = useRef(0);
  const drawingStrokeRef = useRef(null);
  const cropDragRef = useRef(null);
  const lightDragRef = useRef(null);
  const analyticsEventsRef = useRef([]);

  const activeLightIndex = useMemo(() => lights.findIndex((light) => light.id === activeLightId), [activeLightId, lights]);
  const activeLight = activeLightIndex >= 0 ? lights[activeLightIndex] : null;

  const navigate = useCallback((path) => {
    window.history.pushState({}, "", path);
    setRoute(path);
  }, []);

  const trackEvent = useCallback((name, detail = {}) => {
    const event = {
      name,
      detail,
      at: new Date().toISOString()
    };
    analyticsEventsRef.current = [...analyticsEventsRef.current.slice(-99), event];
    window.__GLYPH_STUDIO_EVENTS__ = analyticsEventsRef.current;
    window.dispatchEvent(new CustomEvent("glyph-studio:analytics", { detail: event }));
  }, []);

  const updateSetting = useCallback((key, value) => {
    trackEvent("setting_change", { key, value });
    setSettings((current) => ({ ...current, [key]: value }));
  }, [trackEvent]);

  const selectQualityPreset = useCallback((presetId) => {
    if (presetId === "custom") {
      trackEvent("quality_preset_change", { preset: presetId });
      setSettings((current) => ({ ...current, qualityPreset: "custom" }));
      setStatus("Custom quality preset selected");
      return;
    }

    const preset = QUALITY_PRESETS[presetId];
    trackEvent("quality_preset_change", { preset: presetId });
    setSettings((current) => applyQualityPreset(current, presetId));
    setStatus(`${preset?.label || "Custom"} quality preset applied`);
  }, [trackEvent]);

  const updateQualitySetting = useCallback((key, value) => {
    trackEvent("setting_change", { key, value, qualityPreset: "custom" });
    setSettings((current) => ({ ...current, [key]: value, qualityPreset: "custom" }));
  }, [trackEvent]);

  const updateCharacterSet = useCallback((value) => {
    trackEvent("setting_change", { key: "characterSet", value, qualityPreset: "custom" });
    setSettings((current) => ({
      ...current,
      characterSet: value,
      characters: value === "custom" ? current.characters : CHAR_SETS[value],
      qualityPreset: "custom"
    }));
  }, [trackEvent]);

  const updateEffect = useCallback((key, value) => {
    trackEvent("post_fx_change", { key, value });
    setSettings((current) => ({ ...current, effects: { ...current.effects, [key]: value } }));
  }, [trackEvent]);

  const loadSource = useCallback((url, name = "Custom source", kind = "image", meta = null) => {
    setSourceUrl(url);
    setSourceName(name);
    setSourceKind(kind);
    setSourceStats(null);
    setFileMeta(meta || {
      name,
      type: kind === "video" ? "video/*" : kind === "video-demo" ? "generated/video-demo" : "generated/image",
      size: 0
    });
    trackEvent("source_loaded", { kind, name });
    if (kind === "video") {
      sourceImageRef.current = null;
      setVideoUrl(url);
    } else {
      setVideoUrl("");
      setIsPlaying(false);
      setSeek(0);
    }
    setStatus(`${name} loaded`);
  }, [trackEvent]);

  const loadDemo = useCallback(() => {
    const nextSeed = demoSeed + 1;
    setDemoSeed(nextSeed);
    loadSource(createDemoDataUrl(nextSeed), "Demo");
  }, [demoSeed, loadSource]);

  const loadDemoPreset = useCallback((id) => {
    setDemoSeed(id);
    setMaskStrokes([]);
    setCrop({ x: 0, y: 0, w: 1, h: 1, rotation: 0 });
    loadSource(createDemoDataUrl(id), `Demo ${String(id).padStart(2, "0")}`);
  }, [loadSource]);

  const loadVideoDemoPreset = useCallback((id) => {
    const seed = 100 + id;
    setDemoSeed(seed);
    setMaskStrokes([]);
    setCrop({ x: 0, y: 0, w: 1, h: 1, rotation: 0 });
    setDuration(8);
    setSeek(0);
    setIsPlaying(true);
    setSettings((current) => ({ ...current, animated: true, animationStyle: id === 1 ? "wave" : id === 2 ? "cascade-lr" : "pulse" }));
    loadSource(createDemoDataUrl(seed), `Video Demo ${String(id).padStart(2, "0")}`, "video-demo");
  }, [loadSource]);

  const loadBackgroundPreset = useCallback((id) => {
    setBackgroundUrl(createBackgroundDataUrl(id));
    setSettings((current) => ({ ...current, backgroundMode: "original", backgroundOpacity: 100 }));
    trackEvent("background_gallery_select", { id });
    setStatus(`Background ${String(id).padStart(2, "0")} applied`);
  }, [trackEvent]);

  const handleFile = useCallback((file) => {
    if (!file) return;
    const uploadKind = getUploadKind(file);
    if (!uploadKind) {
      setStatus("Unsupported file type");
      return;
    }
    loadSource(URL.createObjectURL(file), file.name || "Upload", uploadKind, {
      name: file.name || "Upload",
      type: file.type || `${uploadKind}/*`,
      size: file.size || 0
    });
  }, [loadSource]);

  const handlePaste = useCallback((event) => {
    const item = [...(event.clipboardData?.items || [])].find((entry) => entry.type.startsWith("image/"));
    if (item) handleFile(item.getAsFile());
  }, [handleFile]);

  const activateLightTool = useCallback(() => {
    setSettings((current) => ({
      ...current,
      lights: true,
      fontSize: Math.max(Number(current.fontSize || 0), 12)
    }));
    setCanvasTool("light");
    trackEvent("canvas_tool_change", { tool: "light" });
    setStatus("Light tool active");
  }, [trackEvent]);

  const activateMaskTool = useCallback(() => {
    setSettings((current) => ({ ...current, mask: true }));
    setCanvasTool("mask");
    trackEvent("canvas_tool_change", { tool: "mask" });
    setStatus("Draw Mask");
  }, [trackEvent]);

  const clearCanvasTool = useCallback(() => {
    setCanvasTool("none");
    trackEvent("canvas_tool_change", { tool: "none" });
    setStatus("Preview tool disabled");
  }, [trackEvent]);

  const toggleLights = useCallback((value) => {
    trackEvent("setting_change", { key: "lights", value });
    if (value) {
      activateLightTool();
      return;
    }
    setSettings((current) => ({ ...current, lights: false }));
    setCanvasTool((current) => (current === "light" ? "none" : current));
    setStatus("Lights disabled");
  }, [activateLightTool, trackEvent]);

  const toggleMask = useCallback((value) => {
    trackEvent("setting_change", { key: "mask", value });
    if (value) {
      activateMaskTool();
      return;
    }
    setSettings((current) => ({ ...current, mask: false }));
    setCanvasTool((current) => (current === "mask" ? "none" : current));
    setStatus("Mask disabled");
  }, [activateMaskTool, trackEvent]);

  const addLight = useCallback((point = { x: 0.5, y: 0.45 }) => {
    if (lights.length >= 4) {
      setStatus("Maximum of 4 lights reached");
      return;
    }
    const shouldBumpFont = Number(settings.fontSize || 0) < 12;
    const lightNumber = lights.length + 1;
    const id = `light-${Date.now()}-${lightNumber}`;
    const nextLight = {
      id,
      x: point.x,
      y: point.y,
      radius: 30,
      intensity: 80,
      blur: 0,
      rotation: 0
    };
    setLights((current) => [...current, nextLight]);
    setActiveLightId(id);
    setCanvasTool("light");
    setSettings((current) => ({ ...current, lights: true, fontSize: Math.max(Number(current.fontSize || 0), 12) }));
    trackEvent("light_add", { count: lightNumber });
    setStatus(shouldBumpFont ? "Bumped font size to 12 for lighting performance" : `Light ${lightNumber} active`);
  }, [lights.length, settings.fontSize, trackEvent]);

  const updateActiveLight = useCallback((key, value) => {
    setLights((current) => current.map((light) => (
      light.id === activeLightId ? { ...light, [key]: value } : light
    )));
  }, [activeLightId]);

  const deleteActiveLight = useCallback(() => {
    if (!activeLight) return;
    setLights((current) => current.filter((light) => light.id !== activeLight.id));
    setActiveLightId(null);
    setStatus("Light deleted");
  }, [activeLight]);

  const updateLightPosition = useCallback((id, point) => {
    setLights((current) => current.map((light) => (
      light.id === id ? { ...light, x: clamp(point.x, 0, 1), y: clamp(point.y, 0, 1) } : light
    )));
  }, []);

  const handleLightPadPointerDown = useCallback((event) => {
    if (event.target !== event.currentTarget) return;
    const point = getRelativePoint(event, event.currentTarget.getBoundingClientRect());
    addLight(point);
  }, [addLight]);

  const startLightPadDrag = useCallback((event, light, index) => {
    event.preventDefault();
    event.stopPropagation();
    const pad = event.currentTarget.closest("[data-light-pad]");
    if (!pad) return;
    lightDragRef.current = {
      id: light.id,
      rect: pad.getBoundingClientRect()
    };
    setActiveLightId(light.id);
    setStatus(`Light ${index + 1} active`);
    event.currentTarget.setPointerCapture?.(event.pointerId);
  }, []);

  const moveLightPadDrag = useCallback((event) => {
    const drag = lightDragRef.current;
    if (!drag) return;
    updateLightPosition(drag.id, getRelativePoint(event, drag.rect));
  }, [updateLightPosition]);

  const finishLightPadDrag = useCallback((event) => {
    if (!lightDragRef.current) return;
    lightDragRef.current = null;
    event.currentTarget.releasePointerCapture?.(event.pointerId);
    setStatus("Light moved");
  }, []);

  const commitCrop = useCallback((nextCrop) => {
    setCrop((current) => {
      setCropHistory((history) => [...history.slice(-19), current]);
      setCropFuture([]);
      return sanitizeCrop(typeof nextCrop === "function" ? nextCrop(current) : nextCrop);
    });
  }, []);

  const updateCrop = useCallback((key, value) => {
    commitCrop((current) => ({ ...current, [key]: value }));
  }, [commitCrop]);

  const undoCrop = useCallback(() => {
    setCropHistory((history) => {
      const previous = history[history.length - 1];
      if (!previous) return history;
      setCropFuture((future) => [crop, ...future].slice(0, 20));
      setCrop(previous);
      return history.slice(0, -1);
    });
  }, [crop]);

  const redoCrop = useCallback(() => {
    setCropFuture((future) => {
      const next = future[0];
      if (!next) return future;
      setCropHistory((history) => [...history.slice(-19), crop]);
      setCrop(next);
      return future.slice(1);
    });
  }, [crop]);

  const startCropDrag = useCallback((event, handle) => {
    event.preventDefault();
    event.stopPropagation();
    const surface = event.currentTarget.closest("[data-crop-surface]");
    if (!surface) return;
    cropDragRef.current = {
      handle,
      rect: surface.getBoundingClientRect(),
      startCrop: crop
    };
    setCropHistory((history) => [...history.slice(-19), crop]);
    setCropFuture([]);
    event.currentTarget.setPointerCapture?.(event.pointerId);
  }, [crop]);

  const moveCropDrag = useCallback((event) => {
    const drag = cropDragRef.current;
    if (!drag) return;
    const point = {
      x: clamp((event.clientX - drag.rect.left) / drag.rect.width, 0, 1),
      y: clamp((event.clientY - drag.rect.top) / drag.rect.height, 0, 1)
    };
    setCrop(cropFromHandle(drag.startCrop, point, drag.handle));
  }, []);

  const finishCropDrag = useCallback((event) => {
    if (!cropDragRef.current) return;
    cropDragRef.current = null;
    event.currentTarget.releasePointerCapture?.(event.pointerId);
    setStatus("Crop adjusted");
  }, []);

  const handleCanvasPointerDown = useCallback((event) => {
    const canvas = canvasRef.current;
    if (!canvas || canvasTool === "none") return;
    event.preventDefault();
    const point = getCanvasPoint(event, canvas);

    if (canvasTool === "mask" && settings.mask) {
      const id = `mask-${Date.now()}`;
      drawingStrokeRef.current = id;
      setMaskStrokes((current) => [...current, {
        id,
        tool: settings.maskTool,
        brushSize: settings.brushSize,
        points: [point]
      }]);
      setStatus("Draw Mask");
      event.currentTarget.setPointerCapture?.(event.pointerId);
      return;
    }

    if (canvasTool === "light" && settings.lights) {
      const nearest = lights.find((light) => Math.hypot(light.x - point.x, light.y - point.y) < 0.06);
      if (nearest) {
        setActiveLightId(nearest.id);
        setStatus(`Light ${lights.findIndex((light) => light.id === nearest.id) + 1} active`);
      } else {
        addLight(point);
      }
    }
  }, [addLight, canvasTool, lights, settings.brushSize, settings.lights, settings.mask, settings.maskTool]);

  const handleCanvasPointerMove = useCallback((event) => {
    if (!drawingStrokeRef.current || !settings.mask) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const point = getCanvasPoint(event, canvas);
    setMaskStrokes((current) => current.map((stroke) => (
      stroke.id === drawingStrokeRef.current ? { ...stroke, points: [...stroke.points, point] } : stroke
    )));
  }, [settings.mask]);

  const finishCanvasPointer = useCallback((event) => {
    if (drawingStrokeRef.current) {
      drawingStrokeRef.current = null;
      event.currentTarget?.releasePointerCapture?.(event.pointerId);
      setStatus("Mask updated");
    }
  }, []);

  const undoMaskStroke = useCallback(() => {
    setMaskStrokes((current) => current.slice(0, -1));
    setStatus("Mask stroke undone");
  }, []);

  const clearMask = useCallback(() => {
    setMaskStrokes([]);
    setStatus("Mask cleared");
  }, []);

  const draw = useCallback((tick = performance.now()) => {
    const canvas = canvasRef.current;
    const image = sourceImageRef.current;
    const video = videoRef.current;
    const useVideo = sourceKind === "video" && video && video.readyState >= 2 && video.videoWidth > 0;
    const source = useVideo ? video : image;
    if (!canvas || !source || !isCanvasRuntimeAvailable()) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const naturalWidth = useVideo ? video.videoWidth : image.naturalWidth;
    const naturalHeight = useVideo ? video.videoHeight : image.naturalHeight;
    const width = 1100;
    const cropAspect = (naturalHeight * crop.h) / Math.max(1, naturalWidth * crop.w);
    const rotated = Math.abs(crop.rotation % 180) === 90;
    const height = Math.max(620, Math.round((rotated ? 1 / cropAspect : cropAspect) * width) || 720);
    canvas.width = width;
    canvas.height = height;

    const offscreen = document.createElement("canvas");
    offscreen.width = width;
    offscreen.height = height;
    const sourceCtx = offscreen.getContext("2d", { willReadFrequently: true });
    if (!sourceCtx) return;
    drawCroppedSource(sourceCtx, source, naturalWidth, naturalHeight, width, height, crop);
    if (sourceKind === "video-demo") {
      drawVideoDemoMotion(sourceCtx, width, height, demoSeed, seek);
    }

    const backgroundImage = backgroundImageRef.current;

    if (settings.backgroundMode === "solid") {
      ctx.fillStyle = "#050507";
      ctx.fillRect(0, 0, width, height);
    } else if (settings.backgroundMode === "original") {
      if (backgroundImage) {
        ctx.drawImage(backgroundImage, 0, 0, width, height);
      } else {
        drawCroppedSource(ctx, source, naturalWidth, naturalHeight, width, height, crop);
      }
    } else if (settings.backgroundMode === "none") {
      ctx.clearRect(0, 0, width, height);
    } else {
      ctx.save();
      ctx.globalAlpha = settings.backgroundOpacity / 100;
      ctx.filter = `blur(${settings.backgroundBlur}px)`;
      const blurFrame = resolveBackgroundBlurFrame(width, height, settings.backgroundBlur);
      if (backgroundImage) {
        ctx.drawImage(backgroundImage, blurFrame.x, blurFrame.y, blurFrame.width, blurFrame.height);
      } else {
        ctx.translate(blurFrame.x, blurFrame.y);
        drawCroppedSource(ctx, source, naturalWidth, naturalHeight, blurFrame.width, blurFrame.height, crop);
      }
      ctx.restore();
    }

    if (settings.lights && lights.length) {
      ctx.save();
      ctx.globalCompositeOperation = "screen";
      lights.forEach((light) => {
        const x = light.x * width;
        const y = light.y * height;
        const radius = (Math.min(width, height) * light.radius) / 100;
        const glow = ctx.createRadialGradient(x, y, 0, x, y, radius);
        glow.addColorStop(0, `rgba(255,255,255,${light.intensity / 100})`);
        glow.addColorStop(0.35, `rgba(255,220,130,${(light.intensity / 100) * 0.35})`);
        glow.addColorStop(1, "rgba(255,255,255,0)");
        ctx.filter = `blur(${light.blur}px)`;
        ctx.fillStyle = glow;
        ctx.fillRect(x - radius, y - radius, radius * 2, radius * 2);
      });
      ctx.restore();
    }

    const data = sourceCtx.getImageData(0, 0, width, height);
    buildAsciiCells(data, width, height, settings).forEach((cell) => drawStyledCell(ctx, cell, settings, tick, width, height));

    if (settings.dotGrid) {
      ctx.fillStyle = "rgba(255,255,255,.18)";
      for (let y = 0; y < height; y += 24) {
        for (let x = 0; x < width; x += 24) ctx.fillRect(x, y, 1, 1);
      }
    }

    if (settings.mask) {
      ctx.save();
      ctx.globalCompositeOperation = settings.invertMask ? "destination-out" : "destination-in";
      ctx.fillStyle = "#fff";
      ctx.strokeStyle = "#fff";
      drawMaskGeometry(ctx, width, height, maskStrokes);
      ctx.restore();
      if (settings.showMaskOverlay) {
        ctx.save();
        ctx.strokeStyle = "rgba(255,255,255,.72)";
        ctx.lineWidth = 3;
        ctx.setLineDash([12, 10]);
        drawMaskGeometry(ctx, width, height, maskStrokes, "stroke");
        ctx.setLineDash([]);
        ctx.restore();
      }
    }

    if (settings.lights && lights.length) {
      ctx.save();
      lights.forEach((light, index) => {
        ctx.strokeStyle = light.id === activeLightId ? "rgba(255,255,255,.95)" : "rgba(255,255,255,.45)";
        ctx.fillStyle = light.id === activeLightId ? "rgba(255,255,255,.95)" : "rgba(255,255,255,.6)";
        ctx.lineWidth = light.id === activeLightId ? 4 : 2;
        ctx.beginPath();
        ctx.arc(light.x * width, light.y * height, 10, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        ctx.font = "700 24px ui-monospace, SFMono-Regular, Menlo, monospace";
        ctx.fillText(String(index + 1), light.x * width + 16, light.y * height - 16);
      });
      ctx.restore();
    }

    applyImageEffects(ctx, width, height, settings, tick);
  }, [activeLightId, crop, demoSeed, lights, maskStrokes, seek, settings, sourceKind]);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", theme === "dark");
  }, [theme]);

  useEffect(() => {
    const handlePopState = () => setRoute(window.location.pathname);
    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  useEffect(() => {
    window.addEventListener("paste", handlePaste);
    return () => window.removeEventListener("paste", handlePaste);
  }, [handlePaste]);

  useEffect(() => {
    if (!sourceUrl) loadDemo();
  }, []);

  useEffect(() => {
    if (!sourceUrl || sourceKind === "video") return undefined;
    const image = new Image();
    image.crossOrigin = "anonymous";
    image.onload = () => {
      sourceImageRef.current = image;
      const demoDuration = sourceKind === "video-demo" ? 8 : null;
      if (demoDuration) setDuration(demoDuration);
      setSourceStats({
        width: image.naturalWidth,
        height: image.naturalHeight,
        duration: demoDuration
      });
      draw();
    };
    image.src = sourceUrl;
    return undefined;
  }, [draw, sourceKind, sourceUrl]);

  useEffect(() => {
    if (!isPlaying || sourceKind !== "video-demo") return undefined;
    let frame = 0;
    let lastTime = performance.now();
    const advance = (time) => {
      const delta = ((time - lastTime) / 1000) * playbackRate;
      lastTime = time;
      setSeek((current) => {
        const next = current + delta;
        return next >= duration ? next % duration : next;
      });
      frame = requestAnimationFrame(advance);
    };
    frame = requestAnimationFrame(advance);
    return () => cancelAnimationFrame(frame);
  }, [duration, isPlaying, playbackRate, sourceKind]);

  useEffect(() => {
    if (!backgroundUrl) {
      backgroundImageRef.current = null;
      draw();
      return undefined;
    }
    const image = new Image();
    image.crossOrigin = "anonymous";
    image.onload = () => {
      backgroundImageRef.current = image;
      draw();
    };
    image.src = backgroundUrl;
    return undefined;
  }, [backgroundUrl, draw]);

  useEffect(() => {
    draw();
    if (settings.animated || settings.effects.glitch || settings.style === "disco" || isPlaying) {
      const animate = (time) => {
        draw(time);
        frameRef.current = requestAnimationFrame(animate);
      };
      frameRef.current = requestAnimationFrame(animate);
      return () => cancelAnimationFrame(frameRef.current);
    }
    return undefined;
  }, [draw, isPlaying, settings]);

  const exportGif = useCallback(async (canvas) => {
    setExporting(true);
    const gif = GIFEncoder();
    const frameCanvas = document.createElement("canvas");
    const maxWidth = 520 * Number(settings.exportScale || 1);
    const scale = Math.min(1, maxWidth / Math.max(1, canvas.width));
    frameCanvas.width = Math.max(1, Math.round(canvas.width * scale));
    frameCanvas.height = Math.max(1, Math.round(canvas.height * scale));
    const frameCtx = frameCanvas.getContext("2d", { willReadFrequently: true });
    if (!frameCtx) throw new Error("GIF canvas unavailable");

    const frameTotal = Math.max(2, Math.round(settings.exportDuration * settings.exportFps));
    const delay = Math.round(1000 / settings.exportFps);
    for (let frame = 0; frame < frameTotal; frame += 1) {
      setStatus(`Exporting GIF... ${Math.round((frame / frameTotal) * 100)}%`);
      draw(performance.now() + frame * delay);
      await nextAnimationFrame();
      frameCtx.clearRect(0, 0, frameCanvas.width, frameCanvas.height);
      frameCtx.drawImage(canvas, 0, 0, frameCanvas.width, frameCanvas.height);
      const { data, width, height } = frameCtx.getImageData(0, 0, frameCanvas.width, frameCanvas.height);
      const palette = quantize(data, 256, { format: "rgb444" });
      const index = applyPalette(data, palette, "rgb444");
      gif.writeFrame(index, width, height, { palette, delay, repeat: 0 });
    }

    gif.finish();
    downloadBlob(new Blob([gif.bytes()], { type: "image/gif" }), "glyph-studio.gif");
    setStatus(`Exported GIF animation (${settings.exportDuration}s @ ${settings.exportFps}fps)`);
    setExporting(false);
  }, [draw, settings.exportDuration, settings.exportFps, settings.exportScale]);

  const exportRecordedVideo = useCallback(async (canvas, format) => {
    if (!canvas.captureStream || typeof MediaRecorder === "undefined") {
      setStatus("MP4 unavailable in this browser; exported PNG fallback");
      const blob = await new Promise((resolve) => canvas.toBlob(resolve, "image/png"));
      if (blob) downloadBlob(blob, "glyph-studio.png");
      return;
    }

    const candidates = [
      "video/mp4;codecs=avc1.42E01E",
      "video/mp4",
      "video/webm;codecs=vp9",
      "video/webm"
    ];
    const mimeType = candidates.find((candidate) => MediaRecorder.isTypeSupported(candidate));
    if (!mimeType) {
      setStatus("Video export unsupported; exported PNG fallback");
      const blob = await new Promise((resolve) => canvas.toBlob(resolve, "image/png"));
      if (blob) downloadBlob(blob, "glyph-studio.png");
      return;
    }

    setExporting(true);
    setStatus("Recording animation... 0%");
    const durationMs = settings.exportDuration * 1000;
    const recordCanvas = cloneCanvasAtScale(canvas, settings.exportScale);
    const recordCtx = recordCanvas.getContext("2d");
    if (!recordCtx) throw new Error("Video export canvas unavailable");
    const stream = recordCanvas.captureStream(settings.exportFps);
    const chunks = [];
    const recorder = new MediaRecorder(stream, { mimeType });
    recorder.ondataavailable = (event) => {
      if (event.data.size) chunks.push(event.data);
    };
    const stopped = new Promise((resolve) => {
      recorder.onstop = resolve;
    });
    recorder.start();
    const startedAt = performance.now();
    const renderLoop = (time) => {
      draw(time);
      recordCtx.imageSmoothingEnabled = false;
      recordCtx.clearRect(0, 0, recordCanvas.width, recordCanvas.height);
      recordCtx.drawImage(canvas, 0, 0, recordCanvas.width, recordCanvas.height);
      setStatus(`Recording animation... ${Math.min(99, Math.round(((time - startedAt) / durationMs) * 100))}%`);
      if (time - startedAt < durationMs) requestAnimationFrame(renderLoop);
    };
    requestAnimationFrame(renderLoop);
    await new Promise((resolve) => setTimeout(resolve, durationMs + 120));
    recorder.stop();
    await stopped;
    stream.getTracks().forEach((track) => track.stop());
    const extension = mimeType.includes("mp4") ? "mp4" : "webm";
    downloadBlob(new Blob(chunks, { type: mimeType }), `glyph-studio.${extension}`);
    setStatus(
      extension === "mp4"
        ? `Exported ${format === "mp4-video" ? "MP4 video" : "MP4 animation"}`
        : "MP4 unavailable; exported WebM fallback"
    );
    setExporting(false);
  }, [draw, settings.exportDuration, settings.exportFps, settings.exportScale]);

  const exportCanvas = useCallback(async () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const format = settings.exportFormat;
    trackEvent("export_click", { format, scale: settings.exportScale, fps: settings.exportFps });
    try {
      if (format === "gif") {
        await exportGif(canvas);
        return;
      }
      if (format.startsWith("mp4")) {
        await exportRecordedVideo(canvas, format);
        return;
      }
    } catch (error) {
      setExporting(false);
      setStatus(error instanceof Error ? error.message : "Export failed");
      return;
    }
    const exportCanvasEl = cloneCanvasAtScale(canvas, settings.exportScale);
    const mime = format === "jpg" ? "image/jpeg" : "image/png";
    const link = document.createElement("a");
    link.href = exportCanvasEl.toDataURL(mime, 0.92);
    link.download = `glyph-studio.${format === "jpg" ? "jpg" : "png"}`;
    link.click();
    setStatus(`Exported ${format.toUpperCase()} at ${settings.exportScale}x`);
  }, [exportGif, exportRecordedVideo, settings.exportFormat, settings.exportFps, settings.exportScale, trackEvent]);

  const playVideo = useCallback(async () => {
    const video = videoRef.current;
    setIsPlaying(true);
    setStatus("Playback started");
    if (video && sourceKind === "video") {
      video.playbackRate = playbackRate;
      try {
        await video.play();
      } catch {
        setStatus("Playback ready; tap the preview if the browser blocks autoplay");
      }
    }
  }, [playbackRate, sourceKind]);

  const stopVideo = useCallback(() => {
    const video = videoRef.current;
    if (video) {
      video.pause();
      video.currentTime = 0;
    }
    setSeek(0);
    setIsPlaying(false);
    setStatus("Playback stopped");
    draw();
  }, [draw]);

  const updateSeek = useCallback((value) => {
    const next = Number(value);
    setSeek(next);
    const video = videoRef.current;
    if (video && sourceKind === "video") {
      video.currentTime = next;
      draw();
    }
  }, [draw, sourceKind]);

  const updatePlaybackRate = useCallback((value) => {
    const rate = Number(value);
    setPlaybackRate(rate);
    const video = videoRef.current;
    if (video) video.playbackRate = rate;
    setStatus(`Speed ${rate}x`);
  }, []);

  const updateVideoStats = useCallback((video) => {
    const nextDuration = Number.isFinite(video.duration) ? video.duration : 100;
    setDuration(Math.max(0.1, nextDuration));
    setSourceStats({
      width: video.videoWidth,
      height: video.videoHeight,
      duration: nextDuration
    });
    return nextDuration;
  }, []);

  const handleVideoMetadata = useCallback((event) => {
    const video = event.currentTarget;
    const nextDuration = updateVideoStats(video);
    setStatus("Preparing first video frame");
    try {
      if (video.readyState < 2 && nextDuration > 0) {
        video.currentTime = Math.min(0.01, nextDuration / 100);
      }
    } catch {
      // Some browsers reject tiny seeks before the first frame is decoded.
    }
    try {
      const playPromise = video.play?.();
      if (playPromise?.then) {
        playPromise
          .then(() => setIsPlaying(true))
          .catch(() => setStatus("Video ready; press Play to render frames"));
      }
    } catch {
      setStatus("Video ready; press Play to render frames");
    }
  }, [updateVideoStats]);

  const handleVideoFrameReady = useCallback((event) => {
    updateVideoStats(event.currentTarget);
    draw();
    setStatus(`${sourceName || "Video"} rendering`);
  }, [draw, sourceName, updateVideoStats]);

  const technicalDetails = useMemo(() => {
    const activeEffects = Object.entries(settings.effects)
      .filter(([, value]) => value === true)
      .map(([key]) => EFFECTS.find(([effectKey]) => effectKey === key)?.[1] || key)
      .join(", ") || "none";
    const canvas = canvasRef.current;
    const fileSize = fileMeta?.size ? `${Math.round(fileMeta.size / 1024)} KB` : "generated";
    const sourceResolution = sourceStats?.width
      ? `${sourceStats.width}x${sourceStats.height}${sourceStats.duration ? `, ${sourceStats.duration.toFixed(1)}s` : ""}`
      : "pending";
    const connection = navigator.connection?.effectiveType || navigator.connection?.type || "unknown";
    return [
      `Source: ${sourceName || "none"} (${sourceKind})`,
      `File: ${fileMeta?.name || "none"}, ${fileMeta?.type || "unknown"}, ${fileSize}`,
      `Source resolution: ${sourceResolution}`,
      `Canvas: ${canvas?.width || 0}x${canvas?.height || 0}`,
      `Screen: ${window.screen?.width || 0}x${window.screen?.height || 0}, DPR ${window.devicePixelRatio || 1}`,
      `Viewport: ${window.innerWidth || 0}x${window.innerHeight || 0}`,
      `Connection: ${connection}`,
      `Style: ${settings.style}`,
      `Export: ${settings.exportFormat} ${settings.exportScale}x ${settings.exportDuration}s ${settings.exportFps}fps`,
      `Effects: ${activeEffects}`,
      `Lights: ${lights.length}`,
      `Mask strokes: ${maskStrokes.length}`,
      `Analytics events: ${analyticsEventsRef.current.length}`,
      `UA: ${navigator.userAgent}`
    ].join(" | ");
  }, [fileMeta, lights.length, maskStrokes.length, settings, sourceKind, sourceName, sourceStats]);

  const effectControls = useMemo(() => EFFECTS.map(([key, label]) => (
    <React.Fragment key={key}>
      <ToggleControl label={label} checked={settings.effects[key]} onChange={(value) => updateEffect(key, value)} />
      {settings.effects[key] && EFFECT_AMOUNT_CONTROLS[key] ? (
        <RangeControl
          label={EFFECT_AMOUNT_CONTROLS[key]}
          min={0}
          max={100}
          value={settings.effects[`${key}Amount`] ?? 50}
          suffix="%"
          onChange={(value) => updateEffect(`${key}Amount`, value)}
        />
      ) : null}
    </React.Fragment>
  )), [settings.effects, updateEffect]);

  if (route === "/changelog") {
    return <ChangelogPage onBack={() => navigate("/")} />;
  }

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_16%_10%,rgba(255,42,127,.18),transparent_26%),radial-gradient(circle_at_80%_0%,rgba(33,212,253,.18),transparent_25%)]">
      <div className="grid min-h-screen grid-cols-1 xl:grid-cols-[minmax(0,1fr)_430px]">
        <section className="flex min-w-0 flex-col gap-4 p-4 lg:p-6">
          <Card className="border-dashed bg-card/70">
            <CardContent
              className="flex min-h-32 flex-col items-center justify-center gap-3 p-5 text-center"
              onClick={() => fileRef.current?.click()}
              onDragOver={(event) => event.preventDefault()}
              onDrop={(event) => {
                event.preventDefault();
                handleFile(event.dataTransfer.files[0]);
              }}
            >
              <div className="flex items-center gap-2">
                <ImageUpIcon data-icon="inline-start" />
                <p className="font-medium">Drop an image or video here</p>
              </div>
              <p className="text-sm text-muted-foreground">or click to browse / paste from clipboard</p>
              <Button variant="outline" onClick={(event) => { event.stopPropagation(); loadDemo(); }}>
                <WandSparklesIcon data-icon="inline-start" />
                Inspire Me
              </Button>
            </CardContent>
          </Card>

          <Card className="min-h-[62vh] overflow-hidden bg-card/60">
            <CardContent className="relative flex min-h-[62vh] items-center justify-center p-4 lg:p-8">
              <div className="absolute left-4 top-4 z-10 flex flex-wrap items-center gap-2">
                <Badge variant="secondary">{sourceName || "No source"}</Badge>
                <Badge variant="outline">{settings.style === "3d" ? "Cube" : STYLE_LABELS[settings.style]}</Badge>
                <Badge variant="outline">{settings.exportScale}x export</Badge>
              </div>
              <canvas
                ref={canvasRef}
                data-testid="ascii-canvas"
                aria-label="ASCII art preview"
                className={`max-h-[72vh] w-full max-w-[1100px] touch-none rounded-lg object-contain shadow-2xl ${
                  canvasTool === "mask" ? "cursor-crosshair" : canvasTool === "light" ? "cursor-cell" : ""
                }`}
                onPointerDown={handleCanvasPointerDown}
                onPointerMove={handleCanvasPointerMove}
                onPointerUp={finishCanvasPointer}
                onPointerLeave={finishCanvasPointer}
              />
              {videoUrl ? (
                <video
                  ref={videoRef}
                  aria-hidden="true"
                  autoPlay
                  className="pointer-events-none absolute size-px opacity-0"
                  src={videoUrl}
                  muted
                  playsInline
                  preload="auto"
                  loop
                  onCanPlay={handleVideoFrameReady}
                  onLoadedData={handleVideoFrameReady}
                  onLoadedMetadata={handleVideoMetadata}
                  onPause={() => setIsPlaying(false)}
                  onPlay={() => setIsPlaying(true)}
                  onSeeked={handleVideoFrameReady}
                  onTimeUpdate={(event) => setSeek(event.currentTarget.currentTime)}
                />
              ) : null}
              <div className="absolute bottom-4 left-4 max-w-[calc(100%-2rem)] rounded-lg bg-background/85 px-3 py-2 text-sm text-muted-foreground shadow-lg backdrop-blur">
                {status}
              </div>
            </CardContent>
          </Card>
        </section>

        <aside className="border-t bg-background/92 xl:max-h-screen xl:border-l xl:border-t-0">
          <div className="flex items-center justify-between gap-3 border-b p-4">
            <div>
              <h1 className="text-2xl font-semibold tracking-tight">Glyph Studio</h1>
              <p className="text-sm text-muted-foreground">Image-to-ASCII editor</p>
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button aria-label="Menu" variant="outline" size="icon">
                  <MenuIcon />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuGroup>
                  <DropdownMenuItem onClick={() => setTheme(theme === "dark" ? "light" : "dark")}>
                    {theme === "dark" ? <SunIcon data-icon="inline-start" /> : <MoonIcon data-icon="inline-start" />}
                    {theme === "dark" ? "Light Mode" : "Dark Mode"}
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setModal("bug")}>
                    <BugIcon data-icon="inline-start" />
                    Report a Bug
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setModal("feature")}>
                    <SparklesIcon data-icon="inline-start" />
                    Suggest a Feature
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setModal("about")}>
                    <InfoIcon data-icon="inline-start" />
                    About
                  </DropdownMenuItem>
                </DropdownMenuGroup>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <a
                    href="/changelog"
                    onClick={(event) => {
                      event.preventDefault();
                      navigate("/changelog");
                    }}
                  >
                    Changelog
                  </a>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          <ScrollArea className="xl:h-[calc(100vh-73px)]">
            <div className="p-4">
              <input ref={fileRef} hidden type="file" accept={UPLOAD_ACCEPT} onChange={(event) => handleFile(event.target.files[0])} />
              <Tabs defaultValue="source" className="gap-4">
                <TabsList className="grid w-full grid-cols-4">
                  <TabsTrigger value="source">Source</TabsTrigger>
                  <TabsTrigger value="look">Look</TabsTrigger>
                  <TabsTrigger value="motion">Motion</TabsTrigger>
                  <TabsTrigger value="finish">Finish</TabsTrigger>
                </TabsList>

                <TabsContent value="source" className="flex flex-col gap-4">
                  <ControlCard title="Source" description="Upload, paste, or load a tuned demo.">
                    <div className="grid grid-cols-2 gap-2">
                      <Button onClick={() => fileRef.current?.click()}>
                        <ImageUpIcon data-icon="inline-start" />
                        Upload Image / Video
                      </Button>
                      <Button variant="outline" onClick={loadDemo}>
                        <WandSparklesIcon data-icon="inline-start" />
                        Random Demo
                      </Button>
                    </div>
                    <div className="flex flex-col gap-2">
                      <div className="flex items-center justify-between gap-3">
                        <Label className="text-sm font-medium">Demo gallery</Label>
                        <Badge variant="outline">{DEMO_PRESETS.length} presets</Badge>
                      </div>
                      <div className="grid max-h-48 grid-cols-3 gap-2 overflow-y-auto pr-1">
                        {DEMO_PRESETS.map((demo) => (
                          <Button
                            key={demo.id}
                            variant={demoSeed === demo.id ? "secondary" : "outline"}
                            size="sm"
                            onClick={() => loadDemoPreset(demo.id)}
                          >
                            {demo.label}
                          </Button>
                        ))}
                      </div>
                    </div>
                    <div className="flex flex-col gap-2">
                      <div className="flex items-center justify-between gap-3">
                        <Label className="text-sm font-medium">Video demos</Label>
                        <Badge variant="outline">{VIDEO_DEMO_PRESETS.length} presets</Badge>
                      </div>
                      <div className="grid grid-cols-3 gap-2">
                        {VIDEO_DEMO_PRESETS.map((demo) => (
                          <Button
                            key={demo.id}
                            variant="outline"
                            size="sm"
                            onClick={() => loadVideoDemoPreset(demo.id)}
                          >
                            {demo.label}
                          </Button>
                        ))}
                      </div>
                    </div>
                    <Separator />
                    <div className="flex flex-col gap-2">
                      <div className="flex items-center justify-between gap-3">
                        <Label className="text-sm font-medium">Background gallery</Label>
                        <Badge variant="outline">34 curated backgrounds</Badge>
                      </div>
                      <div className="grid max-h-48 grid-cols-2 gap-2 overflow-y-auto pr-1">
                        {BACKGROUND_PRESETS.map((background) => (
                          <Button
                            key={background.id}
                            variant="outline"
                            size="sm"
                            className="justify-start gap-2"
                            onClick={() => loadBackgroundPreset(background.id)}
                          >
                            <span
                              aria-hidden="true"
                              className="size-5 rounded-sm border"
                              style={{ background: `linear-gradient(135deg, ${background.colors.join(", ")})` }}
                            />
                            {background.label}
                          </Button>
                        ))}
                      </div>
                    </div>
                    <Separator />
                    <div className="grid grid-cols-2 gap-3">
                      <SelectControl label="Format" value={settings.exportFormat} onChange={(value) => updateSetting("exportFormat", value)} options={EXPORT_FORMATS} />
                      <SelectControl label="Resolution" value={settings.exportScale} onChange={(value) => updateSetting("exportScale", Number(value))} options={[["1", "1x"], ["2", "2x"], ["3", "3x"], ["4", "4x"]]} />
                      <SelectControl label="Animation duration" value={settings.exportDuration} onChange={(value) => updateSetting("exportDuration", Number(value))} options={[["3", "3 seconds"], ["5", "5 seconds"], ["10", "10 seconds"], ["15", "15 seconds"]]} />
                      <SelectControl label="Frame rate" value={settings.exportFps} onChange={(value) => updateSetting("exportFps", Number(value))} options={[["15", "15 fps"], ["20", "20 fps"], ["24", "24 fps"], ["30", "30 fps"], ["60", "60 fps"]]} />
                    </div>
                    <Button onClick={exportCanvas} disabled={exporting}>
                      <DownloadIcon data-icon="inline-start" />
                      {exporting ? "Exporting" : "Export"}
                    </Button>
                  </ControlCard>

                  <ControlCard title="Playback" description="Video parity controls are staged on the same surface.">
                    <div className="grid grid-cols-2 gap-2">
                      <Button variant="outline" onClick={playVideo}><PlayIcon data-icon="inline-start" />Play</Button>
                      <Button variant="outline" onClick={stopVideo}><SquareIcon data-icon="inline-start" />Stop</Button>
                    </div>
                    <RangeControl label="Seek" min={0} max={Math.max(0.1, duration)} step={0.1} value={Number(seek.toFixed(1))} onChange={updateSeek} />
                    <SelectControl label="Speed" value={playbackRate} onChange={updatePlaybackRate} options={[["0.25", "0.25x"], ["0.5", "0.5x"], ["1", "1x"], ["1.5", "1.5x"], ["2", "2x"]]} />
                    <Badge variant="secondary" className="w-fit">FPS 30</Badge>
                    <Badge variant="outline" className="w-fit">{sourceKind.startsWith("video") ? "Video source" : "Image source"}</Badge>
                  </ControlCard>
                </TabsContent>

                <TabsContent value="look" className="flex flex-col gap-4">
                  <ControlCard title="Render style" description="Character family, density, blend, and shape controls.">
                    <SelectControl label="Style" value={settings.style} onChange={(value) => updateSetting("style", value)} options={Object.entries(STYLE_LABELS)} />
                    {settings.style === "mosaic" && <SelectControl label="Tile Shape" value={settings.tileShape} onChange={(value) => updateSetting("tileShape", value)} options={[["square", "Square"], ["wide", "Wide"], ["tall", "Tall"]]} />}
                    {settings.style === "3d" && (
                      <div className="flex flex-col gap-3 rounded-lg border bg-muted/30 p-3">
                        <Label className="text-sm font-medium">Cube controls</Label>
                        <RangeControl label="Cell Size" min={4} max={60} value={settings.cubeCellSize} onChange={(value) => updateSetting("cubeCellSize", value)} />
                        <RangeControl label="H. Spacing" min={50} max={180} value={settings.cubeHSpacing} suffix="%" onChange={(value) => updateSetting("cubeHSpacing", value)} />
                        <RangeControl label="V. Spacing" min={50} max={180} value={settings.cubeVSpacing} suffix="%" onChange={(value) => updateSetting("cubeVSpacing", value)} />
                        <RangeControl label="Top Shade" min={0.5} max={2} step={0.05} value={settings.cubeTopShade} onChange={(value) => updateSetting("cubeTopShade", value)} />
                        <RangeControl label="Light Side" min={0} max={2} step={0.05} value={settings.cubeLightSide} onChange={(value) => updateSetting("cubeLightSide", value)} />
                        <RangeControl label="Dark Side" min={0} max={1} step={0.05} value={settings.cubeDarkSide} onChange={(value) => updateSetting("cubeDarkSide", value)} />
                        <RangeControl label="Outline" min={0} max={8} value={settings.cubeOutline} onChange={(value) => updateSetting("cubeOutline", value)} />
                        <ToggleControl label="Flip Light" checked={settings.cubeFlipLight} onChange={(value) => updateSetting("cubeFlipLight", value)} />
                      </div>
                    )}
                    {settings.style === "disco" && (
                      <div className="flex flex-col gap-3 rounded-lg border bg-muted/30 p-3">
                        <Label className="text-sm font-medium">Disco controls</Label>
                        <RangeControl label="Uniformity" min={0} max={100} value={settings.discoUniformity} suffix="%" onChange={(value) => updateSetting("discoUniformity", value)} />
                        <div className="flex items-center justify-between gap-3 rounded-lg border bg-card/60 px-3 py-2">
                          <Label className="text-sm">Pattern</Label>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setSettings((current) => ({
                                ...current,
                                discoRandomize: true,
                                discoSeed: (current.discoSeed || 0) + 1
                              }));
                              trackEvent("disco_randomize", { seed: (settings.discoSeed || 0) + 1 });
                              setStatus("Disco pattern randomized");
                            }}
                          >
                            Randomize ↻
                          </Button>
                        </div>
                      </div>
                    )}
                    {settings.style !== "3d" ? (
                      <RangeControl label="Font Size" min={3} max={48} value={settings.fontSize} onChange={(value) => updateQualitySetting("fontSize", value)} />
                    ) : null}
                    <SelectControl label="Character Set" value={settings.characterSet} onChange={updateCharacterSet} options={[["standard", "Standard"], ["detailed", "Detailed"], ["minimal", "Minimal"], ["custom", "Custom"]]} />
                    <div className="flex flex-col gap-1.5">
                      <Label className="text-xs text-muted-foreground">Chars</Label>
                      <Input aria-label="Chars" value={settings.characters} onChange={(event) => updateQualitySetting("characters", event.target.value)} />
                    </div>
                    <SelectControl label="Blend Mode" value={settings.blendMode} onChange={(value) => updateSetting("blendMode", value)} options={[["source-over", "Normal"], ["overlay", "Overlay"], ["color-dodge", "Color Dodge"], ["screen", "Screen"], ["lighter", "Lighter"]]} />
                    <RangeControl label="Char Opacity" min={0} max={100} value={settings.charOpacity} suffix="%" onChange={(value) => updateSetting("charOpacity", value)} />
                    <div className="grid gap-2">
                      <ToggleControl label="Invert Mapping" checked={settings.invert} onChange={(value) => updateSetting("invert", value)} />
                      <ToggleControl label="Dot Grid Overlay" checked={settings.dotGrid} onChange={(value) => updateSetting("dotGrid", value)} />
                      <ToggleControl label="Randomize Characters" checked={settings.randomize} onChange={(value) => updateSetting("randomize", value)} />
                    </div>
                  </ControlCard>

                  <ControlCard title="Background" description="Source backdrop, blur, transparency, and image modes.">
                    <SelectControl label="Mode" value={settings.backgroundMode} onChange={(value) => updateSetting("backgroundMode", value)} options={[["blur", "Blurred Image"], ["solid", "Solid Black"], ["original", "Original Image"], ["none", "None (Transparent)"]]} />
                    <RangeControl label="Blur" min={0} max={60} value={settings.backgroundBlur} suffix="px" onChange={(value) => updateSetting("backgroundBlur", value)} />
                    <RangeControl label="Opacity" min={0} max={100} value={settings.backgroundOpacity} suffix="%" onChange={(value) => updateSetting("backgroundOpacity", value)} />
                  </ControlCard>

                  <ControlCard title="Intensity" description="Luminance, coverage, threshold, and color response.">
                    <div className="flex flex-col gap-2">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <Label className="text-xs text-muted-foreground">Quality Presets</Label>
                        <Badge variant="outline" className="max-w-full shrink-0">
                          Active quality preset: {QUALITY_PRESETS[settings.qualityPreset]?.label || "Custom"}
                        </Badge>
                      </div>
                      <div className="grid grid-cols-2 gap-2 sm:grid-cols-5">
                        {[...QUALITY_PRESET_ORDER, "custom"].map((presetId) => {
                          const label = QUALITY_PRESETS[presetId]?.label || "Custom";
                          return (
                            <Button
                              key={presetId}
                              type="button"
                              size="sm"
                              variant={settings.qualityPreset === presetId ? "secondary" : "outline"}
                              className="min-w-0"
                              aria-pressed={settings.qualityPreset === presetId}
                              onClick={() => selectQualityPreset(presetId)}
                            >
                              {label}
                            </Button>
                          );
                        })}
                      </div>
                    </div>
                    <RangeControl label="Coverage" min={0} max={100} value={settings.coverage} suffix="%" onChange={(value) => updateQualitySetting("coverage", value)} />
                    <RangeControl label="Edge Emphasis" min={0} max={100} value={settings.edgeEmphasis} suffix="%" onChange={(value) => updateQualitySetting("edgeEmphasis", value)} />
                    <RangeControl label="Density" min={0} max={100} value={settings.density} suffix="%" onChange={(value) => updateQualitySetting("density", value)} />
                    <RangeControl label="Brightness" min={-100} max={100} value={settings.brightness} onChange={(value) => updateQualitySetting("brightness", value)} />
                    <RangeControl label="Contrast" min={0} max={200} value={settings.contrast} onChange={(value) => updateQualitySetting("contrast", value)} />
                    <RangeControl label="Gamma" min={40} max={260} value={settings.gamma} suffix="%" onChange={(value) => updateQualitySetting("gamma", value)} />
                  </ControlCard>
                </TabsContent>

                <TabsContent value="motion" className="flex flex-col gap-4">
                  <ControlCard title="Preview Tool" description="Choose the active preview editing mode.">
                    <div className="grid grid-cols-3 gap-2">
                      <Button variant={canvasTool === "none" ? "secondary" : "outline"} onClick={clearCanvasTool}>
                        View Only
                      </Button>
                      <Button variant={canvasTool === "light" ? "secondary" : "outline"} onClick={activateLightTool}>
                        <SparklesIcon data-icon="inline-start" />
                        Light Tool
                      </Button>
                      <Button variant={canvasTool === "mask" ? "secondary" : "outline"} onClick={activateMaskTool}>
                        <LayersIcon data-icon="inline-start" />
                        Mask Tool
                      </Button>
                    </div>
                    <Badge variant="outline" className="w-fit">
                      Active tool: {canvasTool === "light" ? "Light" : canvasTool === "mask" ? "Mask" : "View Only"}
                    </Badge>
                  </ControlCard>

                  <ControlCard title="Animation" description="Animated ASCII timing and reveal styles.">
                    <ToggleControl label="Animated ASCII" checked={settings.animated} onChange={(value) => updateSetting("animated", value)} />
                    <SelectControl label="Animation Style" value={settings.animationStyle} onChange={(value) => updateSetting("animationStyle", value)} options={[["wave", "Wave"], ["cascade-lr", "Cascade Left to Right"], ["cascade-rl", "Cascade Right to Left"], ["cascade-tb", "Cascade Top to Bottom"], ["reveal", "Reveal"], ["pulse", "Pulse"]]} />
                    <RangeControl label="Speed" min={1} max={8} step={0.1} value={Number((settings.animationSpeed / 1000).toFixed(1))} suffix="s" onChange={(value) => updateSetting("animationSpeed", value * 1000)} />
                    <RangeControl label="Intensity" min={0} max={100} value={settings.animationIntensity} suffix="%" onChange={(value) => updateSetting("animationIntensity", value)} />
                    <RangeControl label="Randomness" min={0} max={100} value={settings.animationRandomness} suffix="%" onChange={(value) => updateSetting("animationRandomness", value)} />
                  </ControlCard>

                  <ControlCard title="Lights" description="Place lights, shape glow, and push the ASCII surface.">
                    <ToggleControl label="Enable Lights" checked={settings.lights} onChange={toggleLights} />
                    <Badge variant="outline" className="w-fit">{lights.length} / 4</Badge>
                    <div className="grid grid-cols-2 gap-2">
                      <Button variant="outline" onClick={() => addLight()}>
                        <SparklesIcon data-icon="inline-start" />
                        Add Light
                      </Button>
                      <Button variant="outline" disabled={!activeLight} onClick={deleteActiveLight}>
                        <Trash2Icon data-icon="inline-start" />
                        Delete
                      </Button>
                    </div>
                    <div
                      data-light-pad
                      className="relative h-28 touch-none overflow-hidden rounded-lg border bg-muted/40"
                      onPointerDown={handleLightPadPointerDown}
                      onPointerMove={moveLightPadDrag}
                      onPointerUp={finishLightPadDrag}
                      onPointerCancel={finishLightPadDrag}
                    >
                      {lights.length ? lights.map((light, index) => (
                        <button
                          key={light.id}
                          type="button"
                          aria-label={`Select light ${index + 1}`}
                          className="absolute size-5 -translate-x-1/2 -translate-y-1/2 rounded-full border bg-primary text-[10px] font-semibold text-primary-foreground shadow-[0_0_28px_hsl(var(--primary))]"
                          style={{ left: `${light.x * 100}%`, top: `${light.y * 100}%` }}
                          onPointerDown={(event) => startLightPadDrag(event, light, index)}
                          onPointerMove={moveLightPadDrag}
                          onPointerUp={finishLightPadDrag}
                          onPointerCancel={finishLightPadDrag}
                          onClick={() => {
                            setActiveLightId(light.id);
                            setStatus(`Light ${index + 1} active`);
                          }}
                        >
                          {index + 1}
                        </button>
                      )) : (
                        <div className="grid h-full place-items-center px-4 text-center text-xs text-muted-foreground">Tap to add a light</div>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Tap to add a light. Drag dots to move. Click a dot to select. Up to 4 lights.
                    </p>
                    {settings.lights && Number(settings.fontSize || 0) <= 12 ? (
                      <p className="text-xs text-muted-foreground">
                        Bumped font size to 12 - lighting at very small font sizes can stall the render. You can lower it back, but expect lag.
                      </p>
                    ) : null}
                    {activeLight ? (
                      <>
                        <Badge variant="secondary" className="w-fit">Light {activeLightIndex + 1} selected</Badge>
                        <RangeControl label="Light X" min={0} max={100} value={Math.round(activeLight.x * 100)} suffix="%" onChange={(value) => updateActiveLight("x", value / 100)} />
                        <RangeControl label="Light Y" min={0} max={100} value={Math.round(activeLight.y * 100)} suffix="%" onChange={(value) => updateActiveLight("y", value / 100)} />
                        <RangeControl label="Radius" min={5} max={100} value={activeLight.radius} onChange={(value) => updateActiveLight("radius", value)} />
                        <RangeControl label="Light Intensity" min={0} max={100} value={activeLight.intensity} onChange={(value) => updateActiveLight("intensity", value)} />
                        <RangeControl label="Blur" min={0} max={80} value={activeLight.blur} suffix="px" onChange={(value) => updateActiveLight("blur", value)} />
                        <RangeControl label="Rotation" min={0} max={360} value={activeLight.rotation} suffix="deg" onChange={(value) => updateActiveLight("rotation", value)} />
                      </>
                    ) : (
                      <Badge variant="outline" className="w-fit">No light selected</Badge>
                    )}
                  </ControlCard>

                  <ControlCard title="Mask" description="Restrict ASCII art to drawn areas while preserving the background.">
                    <ToggleControl label="Enable Mask" checked={settings.mask} onChange={toggleMask} />
                    <div className="flex flex-wrap items-center gap-2">
                      <Button variant={canvasTool === "mask" ? "secondary" : "outline"} onClick={activateMaskTool}>
                        <LayersIcon data-icon="inline-start" />
                        Draw Mask
                      </Button>
                      <Badge variant="outline">Mask strokes: {maskStrokes.length}</Badge>
                    </div>
                    <SelectControl label="Mask Tool" value={settings.maskTool} onChange={(value) => updateSetting("maskTool", value)} options={[["freehand", "Freehand"], ["rect", "Rectangle"], ["ellipse", "Ellipse"]]} />
                    <RangeControl label="Brush Size" min={5} max={100} value={settings.brushSize} onChange={(value) => updateSetting("brushSize", value)} />
                    <ToggleControl label="Show Overlay" checked={settings.showMaskOverlay} onChange={(value) => updateSetting("showMaskOverlay", value)} />
                    <ToggleControl label="Invert Mask" checked={settings.invertMask} onChange={(value) => updateSetting("invertMask", value)} />
                    <div className="grid grid-cols-2 gap-2">
                      <Button variant="outline" disabled={!maskStrokes.length} onClick={undoMaskStroke}>Undo Stroke</Button>
                      <Button variant="outline" disabled={!maskStrokes.length} onClick={clearMask}>Clear Mask</Button>
                    </div>
                  </ControlCard>
                </TabsContent>

                <TabsContent value="finish" className="flex flex-col gap-4">
                  <ControlCard title="Post-processing" description="Stack finish passes for a production export look.">
                    <div className="grid gap-2">{effectControls}</div>
                    {settings.effects.colorOverlay && (
                      <>
                        <div className="flex flex-col gap-1.5">
                          <Label className="text-xs text-muted-foreground">Color</Label>
                          <Input aria-label="Color" type="color" value={settings.effects.color} onChange={(event) => updateEffect("color", event.target.value)} />
                        </div>
                        <RangeControl label="Color Opacity" min={0} max={100} value={settings.effects.colorOpacity} suffix="%" onChange={(value) => updateEffect("colorOpacity", value)} />
                        <SelectControl label="Color Blend" value={settings.effects.colorBlend} onChange={(value) => updateEffect("colorBlend", value)} options={[["multiply", "Multiply"], ["overlay", "Overlay"], ["screen", "Screen"], ["color", "Color"], ["hue", "Hue"], ["saturation", "Saturation"], ["luminosity", "Luminosity"], ["soft-light", "Soft Light"], ["hard-light", "Hard Light"], ["color-burn", "Color Burn"], ["color-dodge", "Color Dodge"]]} />
                      </>
                    )}
                  </ControlCard>

                  <ControlCard title="Crop & Rotate" description="Full crop surface with rotate and save controls.">
                    <Button variant="outline" onClick={() => setModal("crop")}><CropIcon data-icon="inline-start" />Crop / Rotate</Button>
                  </ControlCard>

                  <Card id="changelog">
                    <CardHeader>
                      <CardTitle>Changelog</CardTitle>
                      <CardDescription>Demo gallery, crop editor, masks, lights, animated exports, and post-processing parity are tracked against the public changelog.</CardDescription>
                    </CardHeader>
                  </Card>
                </TabsContent>
              </Tabs>
            </div>
          </ScrollArea>
        </aside>
      </div>

      <Dialog open={Boolean(modal)} onOpenChange={(open) => !open && setModal(null)}>
        <DialogContent className={modal === "crop" ? "sm:max-w-4xl" : "sm:max-w-lg"}>
          {modal === "about" && (
            <>
              <DialogHeader>
                <DialogTitle>About</DialogTitle>
                <DialogDescription>Glyph Studio turns images and videos into stylized ASCII art with export-ready controls.</DialogDescription>
              </DialogHeader>
              <div className="flex flex-col gap-3 text-sm text-muted-foreground">
                <p>Built as a local image-to-ASCII editor with generated demo media, background workflows, and export-ready controls.</p>
              </div>
            </>
          )}
          {modal === "bug" && (
            <>
              <DialogHeader>
                <DialogTitle>Report a Bug</DialogTitle>
                <DialogDescription>Describe what happened and how to reproduce it.</DialogDescription>
              </DialogHeader>
              <Textarea placeholder="Tell us what went wrong..." />
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Technical details (auto-captured)</CardTitle>
                  <CardDescription className="break-all">{technicalDetails}</CardDescription>
                </CardHeader>
              </Card>
              <DialogFooter>
                {feedbackState.bug === "sent" ? (
                  <>
                    <Button disabled>Sent</Button>
                    <Button variant="outline" onClick={() => {
                      setFeedbackState((current) => ({ ...current, bug: "idle" }));
                      setStatus("Bug report ready to retry");
                    }}
                    >
                      Retry
                    </Button>
                  </>
                ) : (
                  <>
                    <Button variant="outline" onClick={() => setModal(null)}>Cancel</Button>
                    <Button onClick={() => {
                      setFeedbackState((current) => ({ ...current, bug: "sent" }));
                      setStatus("Bug report sent");
                    }}
                    >
                      Send Report
                    </Button>
                  </>
                )}
              </DialogFooter>
            </>
          )}
          {modal === "feature" && (
            <>
              <DialogHeader>
                <DialogTitle>Suggest a Feature</DialogTitle>
                <DialogDescription>Share a parity gap or a new idea for the editor.</DialogDescription>
              </DialogHeader>
              <Textarea placeholder="What should Glyph Studio do next?" />
              <DialogFooter>
                {feedbackState.feature === "sent" ? (
                  <>
                    <Button disabled>Sent</Button>
                    <Button variant="outline" onClick={() => {
                      setFeedbackState((current) => ({ ...current, feature: "idle" }));
                      setStatus("Feature suggestion ready to retry");
                    }}
                    >
                      Retry
                    </Button>
                  </>
                ) : (
                  <>
                    <Button variant="outline" onClick={() => setModal(null)}>Cancel</Button>
                    <Button onClick={() => {
                      setFeedbackState((current) => ({ ...current, feature: "sent" }));
                      setStatus("Feature suggestion sent");
                    }}
                    >
                      Send Suggestion
                    </Button>
                  </>
                )}
              </DialogFooter>
            </>
          )}
          {modal === "crop" && (
            <>
              <DialogHeader>
                <DialogTitle>Crop & Rotate</DialogTitle>
                <DialogDescription>Adjust the source frame before rendering.</DialogDescription>
              </DialogHeader>
              <div
                data-crop-surface
                className="relative aspect-video overflow-hidden rounded-lg border bg-[linear-gradient(90deg,transparent_32.8%,hsl(var(--border))_33%,transparent_33.2%,transparent_66.1%,hsl(var(--border))_66.3%,transparent_66.5%),linear-gradient(0deg,transparent_32.8%,hsl(var(--border))_33%,transparent_33.2%,transparent_66.1%,hsl(var(--border))_66.3%,transparent_66.5%)]"
              >
                <div
                  className="absolute cursor-move border-2 border-primary bg-primary/10 shadow-[0_0_0_999px_rgba(0,0,0,.38)]"
                  style={{
                    left: `${crop.x * 100}%`,
                    top: `${crop.y * 100}%`,
                    width: `${crop.w * 100}%`,
                    height: `${crop.h * 100}%`,
                    transform: `rotate(${crop.rotation}deg)`
                  }}
                  onPointerDown={(event) => startCropDrag(event, "move")}
                  onPointerMove={moveCropDrag}
                  onPointerUp={finishCropDrag}
                  onPointerCancel={finishCropDrag}
                >
                  {CROP_HANDLES.map(([handle, label, x, y]) => (
                    <button
                      key={handle}
                      type="button"
                      aria-label={`Crop handle ${label}`}
                      className="absolute size-4 -translate-x-1/2 -translate-y-1/2 rounded-full border bg-primary shadow-sm"
                      style={{ left: `${x * 100}%`, top: `${y * 100}%` }}
                      onPointerDown={(event) => startCropDrag(event, handle)}
                      onPointerMove={moveCropDrag}
                      onPointerUp={finishCropDrag}
                      onPointerCancel={finishCropDrag}
                    />
                  ))}
                </div>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <RangeControl label="Crop X" min={0} max={95} value={Math.round(crop.x * 100)} suffix="%" onChange={(value) => updateCrop("x", value / 100)} />
                <RangeControl label="Crop Y" min={0} max={95} value={Math.round(crop.y * 100)} suffix="%" onChange={(value) => updateCrop("y", value / 100)} />
                <RangeControl label="Width" min={5} max={Math.round((1 - crop.x) * 100)} value={Math.round(crop.w * 100)} suffix="%" onChange={(value) => updateCrop("w", value / 100)} />
                <RangeControl label="Height" min={5} max={Math.round((1 - crop.y) * 100)} value={Math.round(crop.h * 100)} suffix="%" onChange={(value) => updateCrop("h", value / 100)} />
                <RangeControl label="Rotation" min={-180} max={180} value={crop.rotation} suffix="deg" onChange={(value) => updateCrop("rotation", value)} />
              </div>
              <DialogFooter>
                <Button variant="outline" disabled={!cropHistory.length} onClick={undoCrop}>
                  <Undo2Icon data-icon="inline-start" />
                  Undo
                </Button>
                <Button variant="outline" disabled={!cropFuture.length} onClick={redoCrop}>
                  <Redo2Icon data-icon="inline-start" />
                  Redo
                </Button>
                <Button variant="outline" title="Rotate counter-clockwise" onClick={() => { updateCrop("rotation", crop.rotation - 90); setStatus("Rotated counter-clockwise"); }}>
                  <RotateCcwIcon data-icon="inline-start" />
                  Rotate left
                </Button>
                <Button variant="outline" title="Rotate clockwise" onClick={() => { updateCrop("rotation", crop.rotation + 90); setStatus("Rotated clockwise"); }}>
                  <RotateCwIcon data-icon="inline-start" />
                  Rotate right
                </Button>
                <Button variant="outline" onClick={() => setModal(null)}>Cancel</Button>
                <Button onClick={() => { draw(); setStatus("Crop saved"); setModal(null); }}>Save</Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default App;
