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
  RotateCcwIcon,
  RotateCwIcon,
  SparklesIcon,
  SquareIcon,
  SunIcon,
  Trash2Icon,
  WandSparklesIcon
} from "lucide-react";
import {
  CHAR_SETS,
  STYLE_LABELS,
  buildAsciiCells,
  clamp,
  computeAnimationTransform,
  createDefaultSettings,
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

const DEMO_PRESETS = Array.from({ length: 6 }, (_, index) => ({
  id: index + 1,
  label: `Demo ${String(index + 1).padStart(2, "0")}`
}));

const BACKGROUND_PRESETS = [
  { id: 1, label: "Background 01", colors: ["#101820", "#fee715", "#1f7a8c"] },
  { id: 2, label: "Background 02", colors: ["#0b132b", "#5bc0be", "#fca311"] },
  { id: 3, label: "Background 03", colors: ["#2b2d42", "#ef233c", "#8d99ae"] },
  { id: 4, label: "Background 04", colors: ["#031d44", "#ff7d00", "#f9c74f"] }
];

function isCanvasRuntimeAvailable() {
  return typeof navigator === "undefined" || !/jsdom/i.test(navigator.userAgent);
}

function createDemoDataUrl(seed = 0) {
  if (!isCanvasRuntimeAvailable()) {
    return `data:image/svg+xml,${encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" width="920" height="640"><rect width="920" height="640" fill="#111018"/><text x="80" y="240" fill="#ffffff" font-family="monospace" font-size="96">ASCII</text><text x="80" y="370" fill="#21d4fd" font-family="monospace" font-size="128">MAGIC ${seed}</text></svg>`)}`;
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
  ctx.fillText("ASCII", 86, 205);
  ctx.font = "700 132px ui-monospace, SFMono-Regular, Menlo, monospace";
  ctx.fillText("MAGIC", 84, 338);
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
  return {
    x: clamp((event.clientX - rect.left) / rect.width, 0, 1),
    y: clamp((event.clientY - rect.top) / rect.height, 0, 1)
  };
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

function drawMaskGeometry(ctx, width, height, strokes, mode = "fill") {
  const drawDefault = () => {
    ctx.beginPath();
    ctx.ellipse(width * 0.5, height * 0.5, width * 0.32, height * 0.34, 0, 0, Math.PI * 2);
    mode === "stroke" ? ctx.stroke() : ctx.fill();
  };

  if (!strokes.length) {
    drawDefault();
    return;
  }

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

    ctx.beginPath();
    ctx.moveTo(x, y);
    points.slice(1).forEach((point) => ctx.lineTo(point.x * width, point.y * height));
    ctx.stroke();
  });
}

async function nextAnimationFrame() {
  await new Promise((resolve) => requestAnimationFrame(resolve));
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

function applyPixelate(ctx, snapshot, width, height) {
  const pixelCanvas = document.createElement("canvas");
  const pixelCtx = pixelCanvas.getContext("2d");
  const scale = 0.12;
  pixelCanvas.width = Math.max(1, Math.round(width * scale));
  pixelCanvas.height = Math.max(1, Math.round(height * scale));
  pixelCtx.imageSmoothingEnabled = false;
  pixelCtx.drawImage(snapshot, 0, 0, pixelCanvas.width, pixelCanvas.height);
  ctx.save();
  ctx.imageSmoothingEnabled = false;
  ctx.globalAlpha = 0.72;
  ctx.drawImage(pixelCanvas, 0, 0, pixelCanvas.width, pixelCanvas.height, 0, 0, width, height);
  ctx.restore();
}

function applyHalftone(ctx, width, height) {
  ctx.save();
  ctx.globalCompositeOperation = "multiply";
  for (let y = 0; y < height; y += 18) {
    for (let x = 0; x < width; x += 18) {
      const radius = 1.5 + ((x * 7 + y * 11) % 9);
      ctx.fillStyle = `rgba(0,0,0,${0.12 + radius / 80})`;
      ctx.beginPath();
      ctx.arc(x, y, radius, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  ctx.restore();
}

function applyGlitch(ctx, snapshot, width, height, tick) {
  ctx.save();
  for (let i = 0; i < 10; i += 1) {
    const sliceHeight = 6 + ((i * 17) % 28);
    const y = (i * 71 + Math.floor(tick / 35)) % height;
    const offset = ((i % 2 ? -1 : 1) * (8 + ((i * 13) % 24)));
    ctx.globalAlpha = 0.82;
    ctx.drawImage(snapshot, 0, y, width, sliceHeight, offset, y, width, sliceHeight);
  }
  ctx.restore();
}

function applyCrt(ctx, width, height) {
  ctx.save();
  ctx.fillStyle = "rgba(255,255,255,.05)";
  for (let y = 0; y < height; y += 4) ctx.fillRect(0, y, width, 1);
  const curve = ctx.createRadialGradient(width / 2, height / 2, width * 0.1, width / 2, height / 2, width * 0.78);
  curve.addColorStop(0, "rgba(255,255,255,.04)");
  curve.addColorStop(0.75, "rgba(0,0,0,.02)");
  curve.addColorStop(1, "rgba(0,0,0,.32)");
  ctx.fillStyle = curve;
  ctx.fillRect(0, 0, width, height);
  ctx.restore();
}

function applyImageEffects(ctx, width, height, settings, tick = 0) {
  const effects = settings.effects;
  const passes = resolvePostProcessingPlan(effects);
  if (!passes.length) return;
  const snapshot = snapshotCanvas(ctx, width, height);

  if (passes.includes("pixelate")) applyPixelate(ctx, snapshot, width, height);
  if (passes.includes("blur")) {
    ctx.save();
    ctx.globalAlpha = 0.58;
    ctx.filter = "blur(2.6px)";
    ctx.drawImage(snapshot, 0, 0, width, height);
    ctx.restore();
  }
  if (passes.includes("bloom")) {
    ctx.save();
    ctx.globalCompositeOperation = "screen";
    ctx.globalAlpha = 0.42;
    ctx.filter = "blur(10px) saturate(1.35)";
    ctx.drawImage(snapshot, 0, 0, width, height);
    ctx.restore();
  }
  if (passes.includes("chromatic") || passes.includes("rgb-split")) {
    const amount = passes.includes("rgb-split") ? 7 : 3;
    drawTintedSnapshot(ctx, snapshot, width, height, -amount, "rgb(255,40,100)", 0.38);
    drawTintedSnapshot(ctx, snapshot, width, height, amount, "rgb(30,210,255)", 0.34);
  }
  if (passes.includes("glitch")) applyGlitch(ctx, snapshot, width, height, tick);

  if (effects.colorOverlay) {
    ctx.save();
    ctx.globalAlpha = effects.colorOpacity / 100;
    ctx.globalCompositeOperation = effects.colorBlend;
    ctx.fillStyle = effects.color;
    ctx.fillRect(0, 0, width, height);
    ctx.restore();
  }
  if (effects.vignette) {
    const vignette = ctx.createRadialGradient(width / 2, height / 2, width * 0.15, width / 2, height / 2, width * 0.72);
    vignette.addColorStop(0, "rgba(0,0,0,0)");
    vignette.addColorStop(1, "rgba(0,0,0,.62)");
    ctx.fillStyle = vignette;
    ctx.fillRect(0, 0, width, height);
  }
  if (effects.scanLines) {
    ctx.fillStyle = "rgba(0,0,0,.2)";
    for (let y = 0; y < height; y += 6) ctx.fillRect(0, y, width, 1);
  }
  if (passes.includes("crt")) applyCrt(ctx, width, height);
  if (passes.includes("halftone")) applyHalftone(ctx, width, height);
  if (effects.filmGrain || effects.filmDust) {
    ctx.fillStyle = effects.filmDust ? "rgba(255,255,255,.28)" : "rgba(255,255,255,.12)";
    for (let i = 0; i < (effects.filmDust ? 120 : 800); i += 1) {
      ctx.fillRect(Math.random() * width, Math.random() * height, effects.filmDust ? 2 : 1, effects.filmDust ? 2 : 1);
    }
  }
  if (effects.sparkles) {
    ctx.fillStyle = "rgba(255,255,255,.85)";
    for (let i = 0; i < 30; i += 1) ctx.fillText("*", (i * 97) % width, (i * 53) % height);
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
  ctx.shadowBlur = settings.effects.charBloom ? 8 : settings.effects.bloom ? 14 : 0;

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
    ctx.fillRect(cell.x + 2, cell.y + 4, cell.w * 0.72, cell.h * 0.62);
    ctx.fillStyle = "rgba(255,255,255,.32)";
    ctx.fillRect(cell.x, cell.y + 1, cell.w * 0.72, 4);
    ctx.fillStyle = "rgba(0,0,0,.32)";
    ctx.fillRect(cell.x + cell.w * 0.62, cell.y + 5, 4, cell.h * 0.55);
  } else if (settings.style === "disco") {
    const hue = (cell.x + cell.y + tick * 0.04) % 360;
    ctx.fillStyle = `hsl(${hue}, 95%, ${45 + (1 - cell.luminance / 255) * 35}%)`;
    ctx.beginPath();
    ctx.arc(centerX, centerY, Math.max(2, cell.w * 0.42), 0, Math.PI * 2);
    ctx.fill();
  } else {
    ctx.font = `${settings.fontSize}px ui-monospace, SFMono-Regular, Menlo, monospace`;
    const glyph = settings.randomize ? pickRandomGlyph(cell, settings) : cell.glyph;
    if (settings.effects.charChromatic) {
      ctx.save();
      ctx.shadowBlur = 0;
      ctx.globalCompositeOperation = "screen";
      ctx.globalAlpha *= 0.6;
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
  const [crop, setCrop] = useState({ x: 0, y: 0, w: 1, h: 1, rotation: 0 });
  const [status, setStatus] = useState("Drop an image or video here");
  const [theme, setTheme] = useState("dark");
  const [modal, setModal] = useState(null);
  const [exporting, setExporting] = useState(false);
  const [demoSeed, setDemoSeed] = useState(0);
  const canvasRef = useRef(null);
  const sourceImageRef = useRef(null);
  const backgroundImageRef = useRef(null);
  const videoRef = useRef(null);
  const fileRef = useRef(null);
  const frameRef = useRef(0);
  const drawingStrokeRef = useRef(null);

  const activeLightIndex = useMemo(() => lights.findIndex((light) => light.id === activeLightId), [activeLightId, lights]);
  const activeLight = activeLightIndex >= 0 ? lights[activeLightIndex] : null;

  const updateSetting = useCallback((key, value) => {
    setSettings((current) => ({ ...current, [key]: value }));
  }, []);

  const updateEffect = useCallback((key, value) => {
    setSettings((current) => ({ ...current, effects: { ...current.effects, [key]: value } }));
  }, []);

  const loadSource = useCallback((url, name = "Custom source", kind = "image") => {
    setSourceUrl(url);
    setSourceName(name);
    setSourceKind(kind);
    if (kind === "video") {
      sourceImageRef.current = null;
      setVideoUrl(url);
    } else {
      setVideoUrl("");
      setIsPlaying(false);
      setSeek(0);
    }
    setStatus(`${name} loaded`);
  }, []);

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

  const loadBackgroundPreset = useCallback((id) => {
    setBackgroundUrl(createBackgroundDataUrl(id));
    setSettings((current) => ({ ...current, backgroundMode: "original", backgroundOpacity: 100 }));
    setStatus(`Background ${String(id).padStart(2, "0")} applied`);
  }, []);

  const handleFile = useCallback((file) => {
    if (!file) return;
    if (!file.type.startsWith("image/") && !file.type.startsWith("video/")) {
      setStatus("Unsupported file type");
      return;
    }
    loadSource(URL.createObjectURL(file), file.name || "Upload", file.type.startsWith("video/") ? "video" : "image");
  }, [loadSource]);

  const handlePaste = useCallback((event) => {
    const item = [...(event.clipboardData?.items || [])].find((entry) => entry.type.startsWith("image/"));
    if (item) handleFile(item.getAsFile());
  }, [handleFile]);

  const addLight = useCallback((point = { x: 0.5, y: 0.45 }) => {
    if (lights.length >= 4) {
      setStatus("Maximum of 4 lights reached");
      return;
    }
    const lightNumber = lights.length + 1;
    const id = `light-${Date.now()}-${lightNumber}`;
    const nextLight = {
      id,
      x: point.x,
      y: point.y,
      radius: 30,
      intensity: 80,
      blur: 20,
      rotation: 0
    };
    setLights((current) => [...current, nextLight]);
    setActiveLightId(id);
    setSettings((current) => ({ ...current, lights: true }));
    setStatus(`Light ${lightNumber} active`);
  }, [lights.length]);

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

  const updateCrop = useCallback((key, value) => {
    setCrop((current) => {
      const next = { ...current, [key]: value };
      if (key === "x") next.w = Math.min(next.w, 1 - next.x);
      if (key === "y") next.h = Math.min(next.h, 1 - next.y);
      return next;
    });
  }, []);

  const handleCanvasPointerDown = useCallback((event) => {
    const canvas = canvasRef.current;
    if (!canvas || (!settings.mask && !settings.lights)) return;
    event.preventDefault();
    const point = getCanvasPoint(event, canvas);

    if (settings.mask) {
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

    if (settings.lights) {
      const nearest = lights.find((light) => Math.hypot(light.x - point.x, light.y - point.y) < 0.06);
      if (nearest) {
        setActiveLightId(nearest.id);
        setStatus(`Light ${lights.findIndex((light) => light.id === nearest.id) + 1} active`);
      } else {
        addLight(point);
      }
    }
  }, [addLight, lights, settings.brushSize, settings.lights, settings.mask, settings.maskTool]);

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
      if (backgroundImage) {
        ctx.drawImage(backgroundImage, -settings.backgroundBlur * 2, -settings.backgroundBlur * 2, width + settings.backgroundBlur * 4, height + settings.backgroundBlur * 4);
      } else {
        drawCroppedSource(ctx, source, naturalWidth, naturalHeight, width + settings.backgroundBlur * 4, height + settings.backgroundBlur * 4, crop);
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
  }, [activeLightId, crop, lights, maskStrokes, settings, sourceKind]);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", theme === "dark");
  }, [theme]);

  useEffect(() => {
    window.addEventListener("paste", handlePaste);
    return () => window.removeEventListener("paste", handlePaste);
  }, [handlePaste]);

  useEffect(() => {
    if (!sourceUrl) loadDemo();
  }, []);

  useEffect(() => {
    if (!sourceUrl || sourceKind !== "image") return undefined;
    const image = new Image();
    image.crossOrigin = "anonymous";
    image.onload = () => {
      sourceImageRef.current = image;
      draw();
    };
    image.src = sourceUrl;
    return undefined;
  }, [draw, sourceKind, sourceUrl]);

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
    const maxWidth = 520;
    const scale = Math.min(1, maxWidth / Math.max(1, canvas.width));
    frameCanvas.width = Math.max(1, Math.round(canvas.width * scale));
    frameCanvas.height = Math.max(1, Math.round(canvas.height * scale));
    const frameCtx = frameCanvas.getContext("2d", { willReadFrequently: true });
    if (!frameCtx) throw new Error("GIF canvas unavailable");

    for (let frame = 0; frame < 10; frame += 1) {
      setStatus(`Exporting GIF... ${Math.round((frame / 10) * 100)}%`);
      draw(performance.now() + frame * 180);
      await nextAnimationFrame();
      frameCtx.clearRect(0, 0, frameCanvas.width, frameCanvas.height);
      frameCtx.drawImage(canvas, 0, 0, frameCanvas.width, frameCanvas.height);
      const { data, width, height } = frameCtx.getImageData(0, 0, frameCanvas.width, frameCanvas.height);
      const palette = quantize(data, 256, { format: "rgb444" });
      const index = applyPalette(data, palette, "rgb444");
      gif.writeFrame(index, width, height, { palette, delay: 110, repeat: 0 });
    }

    gif.finish();
    downloadBlob(new Blob([gif.bytes()], { type: "image/gif" }), "ascii-magic.gif");
    setStatus("Exported GIF animation");
    setExporting(false);
  }, [draw]);

  const exportRecordedVideo = useCallback(async (canvas, format) => {
    if (!canvas.captureStream || typeof MediaRecorder === "undefined") {
      setStatus("MP4 unavailable in this browser; exported PNG fallback");
      const blob = await new Promise((resolve) => canvas.toBlob(resolve, "image/png"));
      if (blob) downloadBlob(blob, "ascii-magic.png");
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
      if (blob) downloadBlob(blob, "ascii-magic.png");
      return;
    }

    setExporting(true);
    setStatus("Recording animation... 0%");
    const stream = canvas.captureStream(30);
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
      setStatus(`Recording animation... ${Math.min(99, Math.round(((time - startedAt) / 1800) * 100))}%`);
      if (time - startedAt < 1800) requestAnimationFrame(renderLoop);
    };
    requestAnimationFrame(renderLoop);
    await new Promise((resolve) => setTimeout(resolve, 1900));
    recorder.stop();
    await stopped;
    stream.getTracks().forEach((track) => track.stop());
    const extension = mimeType.includes("mp4") ? "mp4" : "webm";
    downloadBlob(new Blob(chunks, { type: mimeType }), `ascii-magic.${extension}`);
    setStatus(
      extension === "mp4"
        ? `Exported ${format === "mp4-video" ? "MP4 video" : "MP4 animation"}`
        : "MP4 unavailable; exported WebM fallback"
    );
    setExporting(false);
  }, [draw]);

  const exportCanvas = useCallback(async () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const format = settings.exportFormat;
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
    const exportCanvasEl = document.createElement("canvas");
    exportCanvasEl.width = canvas.width * settings.exportScale;
    exportCanvasEl.height = canvas.height * settings.exportScale;
    const exportCtx = exportCanvasEl.getContext("2d");
    exportCtx.imageSmoothingEnabled = false;
    exportCtx.drawImage(canvas, 0, 0, exportCanvasEl.width, exportCanvasEl.height);
    const mime = format === "jpg" ? "image/jpeg" : "image/png";
    const link = document.createElement("a");
    link.href = exportCanvasEl.toDataURL(mime, 0.92);
    link.download = `ascii-magic.${format === "jpg" ? "jpg" : "png"}`;
    link.click();
    setStatus(`Exported ${format.toUpperCase()} at ${settings.exportScale}x`);
  }, [exportGif, exportRecordedVideo, settings.exportFormat, settings.exportScale]);

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
    video?.pause();
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

  const effectControls = useMemo(() => EFFECTS.map(([key, label]) => (
    <ToggleControl key={key} label={label} checked={settings.effects[key]} onChange={(value) => updateEffect(key, value)} />
  )), [settings.effects, updateEffect]);

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
              <p className="text-xs text-muted-foreground">
                Wonder where these backgrounds are from? Check out <a className="underline underline-offset-4" href="https://backgrounds.supply">backgrounds.supply</a>
              </p>
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
                className="max-h-[72vh] w-full max-w-[1100px] touch-none rounded-lg object-contain shadow-2xl"
                onPointerDown={handleCanvasPointerDown}
                onPointerMove={handleCanvasPointerMove}
                onPointerUp={finishCanvasPointer}
                onPointerLeave={finishCanvasPointer}
              />
              {videoUrl ? (
                <video
                  ref={videoRef}
                  className="hidden"
                  src={videoUrl}
                  muted
                  playsInline
                  loop
                  onLoadedMetadata={(event) => {
                    const nextDuration = Number.isFinite(event.currentTarget.duration) ? event.currentTarget.duration : 100;
                    setDuration(Math.max(0.1, nextDuration));
                    draw();
                  }}
                  onLoadedData={() => draw()}
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
              <h1 className="text-2xl font-semibold tracking-tight">ASCII Magic</h1>
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
                  <a href="#changelog">Changelog</a>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          <ScrollArea className="xl:h-[calc(100vh-73px)]">
            <div className="p-4">
              <input ref={fileRef} hidden type="file" accept="image/*,video/*" onChange={(event) => handleFile(event.target.files[0])} />
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
                      <div className="grid grid-cols-3 gap-2">
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
                    <Separator />
                    <div className="flex flex-col gap-2">
                      <div className="flex items-center justify-between gap-3">
                        <Label className="text-sm font-medium">Background gallery</Label>
                        <Badge variant="outline">backdrops</Badge>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
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
                    <Badge variant="outline" className="w-fit">{sourceKind === "video" ? "Video source" : "Image source"}</Badge>
                  </ControlCard>
                </TabsContent>

                <TabsContent value="look" className="flex flex-col gap-4">
                  <ControlCard title="Render style" description="Character family, density, blend, and shape controls.">
                    <SelectControl label="Style" value={settings.style} onChange={(value) => updateSetting("style", value)} options={Object.entries(STYLE_LABELS)} />
                    {settings.style === "mosaic" && <SelectControl label="Tile Shape" value={settings.tileShape} onChange={(value) => updateSetting("tileShape", value)} options={[["square", "Square"], ["wide", "Wide"], ["tall", "Tall"]]} />}
                    <RangeControl label="Font Size" min={3} max={48} value={settings.fontSize} onChange={(value) => updateSetting("fontSize", value)} />
                    <SelectControl label="Character Set" value={settings.characterSet} onChange={(value) => setSettings((current) => ({ ...current, characterSet: value, characters: value === "custom" ? current.characters : CHAR_SETS[value] }))} options={[["standard", "Standard"], ["detailed", "Detailed"], ["minimal", "Minimal"], ["custom", "Custom"]]} />
                    <div className="flex flex-col gap-1.5">
                      <Label className="text-xs text-muted-foreground">Chars</Label>
                      <Input aria-label="Chars" value={settings.characters} onChange={(event) => updateSetting("characters", event.target.value)} />
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
                    <RangeControl label="Coverage" min={0} max={100} value={settings.coverage} suffix="%" onChange={(value) => updateSetting("coverage", value)} />
                    <RangeControl label="Edge Emphasis" min={0} max={100} value={settings.edgeEmphasis} suffix="%" onChange={(value) => updateSetting("edgeEmphasis", value)} />
                    <RangeControl label="Density" min={0} max={100} value={settings.density} suffix="%" onChange={(value) => updateSetting("density", value)} />
                    <RangeControl label="Brightness" min={-100} max={100} value={settings.brightness} onChange={(value) => updateSetting("brightness", value)} />
                    <RangeControl label="Contrast" min={-100} max={100} value={settings.contrast} onChange={(value) => updateSetting("contrast", value)} />
                  </ControlCard>
                </TabsContent>

                <TabsContent value="motion" className="flex flex-col gap-4">
                  <ControlCard title="Animation" description="Animated ASCII timing and reveal styles.">
                    <ToggleControl label="Animated ASCII" checked={settings.animated} onChange={(value) => updateSetting("animated", value)} />
                    <SelectControl label="Animation Style" value={settings.animationStyle} onChange={(value) => updateSetting("animationStyle", value)} options={[["wave", "Wave"], ["cascade-lr", "Cascade Left to Right"], ["cascade-rl", "Cascade Right to Left"], ["cascade-tb", "Cascade Top to Bottom"], ["reveal", "Reveal"], ["pulse", "Pulse"]]} />
                    <RangeControl label="Speed" min={1000} max={8000} step={100} value={settings.animationSpeed} suffix="ms" onChange={(value) => updateSetting("animationSpeed", value)} />
                    <RangeControl label="Intensity" min={0} max={100} value={settings.animationIntensity} suffix="%" onChange={(value) => updateSetting("animationIntensity", value)} />
                    <RangeControl label="Randomness" min={0} max={100} value={settings.animationRandomness} suffix="%" onChange={(value) => updateSetting("animationRandomness", value)} />
                  </ControlCard>

                  <ControlCard title="Lights" description="Place lights, shape glow, and push the ASCII surface.">
                    <ToggleControl label="Enable Lights" checked={settings.lights} onChange={(value) => updateSetting("lights", value)} />
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
                    <div className="relative h-28 overflow-hidden rounded-lg border bg-muted/40">
                      {lights.length ? lights.map((light, index) => (
                        <button
                          key={light.id}
                          type="button"
                          aria-label={`Select light ${index + 1}`}
                          className="absolute size-5 -translate-x-1/2 -translate-y-1/2 rounded-full border bg-primary text-[10px] font-semibold text-primary-foreground shadow-[0_0_28px_hsl(var(--primary))]"
                          style={{ left: `${light.x * 100}%`, top: `${light.y * 100}%` }}
                          onClick={() => {
                            setActiveLightId(light.id);
                            setStatus(`Light ${index + 1} active`);
                          }}
                        >
                          {index + 1}
                        </button>
                      )) : (
                        <div className="grid h-full place-items-center text-xs text-muted-foreground">tap preview or add a light</div>
                      )}
                    </div>
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
                    <ToggleControl label="Enable Mask" checked={settings.mask} onChange={(value) => updateSetting("mask", value)} />
                    {settings.mask ? (
                      <Button variant="secondary" onClick={() => setStatus("Draw Mask")}>
                        Draw Mask
                      </Button>
                    ) : null}
                    <SelectControl label="Mask Tool" value={settings.maskTool} onChange={(value) => updateSetting("maskTool", value)} options={[["freehand", "Freehand"], ["rect", "Rectangle"], ["ellipse", "Ellipse"]]} />
                    <RangeControl label="Brush Size" min={5} max={100} value={settings.brushSize} onChange={(value) => updateSetting("brushSize", value)} />
                    <ToggleControl label="Show Overlay" checked={settings.showMaskOverlay} onChange={(value) => updateSetting("showMaskOverlay", value)} />
                    <ToggleControl label="Invert Mask" checked={settings.invertMask} onChange={(value) => updateSetting("invertMask", value)} />
                    <Button variant="outline" onClick={() => { setMaskStrokes([]); setStatus("Mask cleared"); }}>Clear Mask</Button>
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
        <DialogContent className="sm:max-w-lg">
          {modal === "about" && (
            <>
              <DialogHeader>
                <DialogTitle>About</DialogTitle>
                <DialogDescription>ASCII Magic turns images and videos into stylized ASCII art with export-ready controls.</DialogDescription>
              </DialogHeader>
              <p className="text-sm text-muted-foreground">This recreation follows the public editor surface and keeps parity gaps visible for follow-up slices.</p>
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
                  <CardDescription className="break-all">{navigator.userAgent}</CardDescription>
                </CardHeader>
              </Card>
              <DialogFooter>
                <Button variant="outline" onClick={() => setModal(null)}>Cancel</Button>
                <Button onClick={() => { setStatus("Bug report ready to send"); setModal(null); }}>Send Report</Button>
              </DialogFooter>
            </>
          )}
          {modal === "feature" && (
            <>
              <DialogHeader>
                <DialogTitle>Suggest a Feature</DialogTitle>
                <DialogDescription>Share a parity gap or a new idea for the editor.</DialogDescription>
              </DialogHeader>
              <Textarea placeholder="What should ASCII Magic do next?" />
              <DialogFooter>
                <Button variant="outline" onClick={() => setModal(null)}>Cancel</Button>
                <Button onClick={() => { setStatus("Feature suggestion ready to send"); setModal(null); }}>Send Suggestion</Button>
              </DialogFooter>
            </>
          )}
          {modal === "crop" && (
            <>
              <DialogHeader>
                <DialogTitle>Crop & Rotate</DialogTitle>
                <DialogDescription>Adjust the source frame before rendering.</DialogDescription>
              </DialogHeader>
              <div className="relative aspect-video overflow-hidden rounded-lg border bg-[linear-gradient(90deg,transparent_32.8%,hsl(var(--border))_33%,transparent_33.2%,transparent_66.1%,hsl(var(--border))_66.3%,transparent_66.5%),linear-gradient(0deg,transparent_32.8%,hsl(var(--border))_33%,transparent_33.2%,transparent_66.1%,hsl(var(--border))_66.3%,transparent_66.5%)]">
                <div
                  className="absolute border-2 border-primary bg-primary/10 shadow-[0_0_0_999px_rgba(0,0,0,.38)]"
                  style={{
                    left: `${crop.x * 100}%`,
                    top: `${crop.y * 100}%`,
                    width: `${crop.w * 100}%`,
                    height: `${crop.h * 100}%`,
                    transform: `rotate(${crop.rotation}deg)`
                  }}
                >
                  <span className="absolute -left-1 -top-1 size-2 rounded-full bg-primary" />
                  <span className="absolute -right-1 -top-1 size-2 rounded-full bg-primary" />
                  <span className="absolute -bottom-1 -left-1 size-2 rounded-full bg-primary" />
                  <span className="absolute -bottom-1 -right-1 size-2 rounded-full bg-primary" />
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
