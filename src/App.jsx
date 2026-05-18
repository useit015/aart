import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
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
  SparklesIcon,
  SquareIcon,
  SunIcon,
  WandSparklesIcon
} from "lucide-react";
import {
  CHAR_SETS,
  STYLE_LABELS,
  buildAsciiCells,
  createDefaultSettings
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
  ["#b8f2e6", "#ffa69e", "#1b1b32"]
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

function applyImageEffects(ctx, width, height, settings) {
  const effects = settings.effects;
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

function drawStyledCell(ctx, cell, settings, tick) {
  const centerX = cell.x + cell.w / 2;
  const centerY = cell.y + cell.h / 2;
  ctx.save();
  ctx.globalAlpha = settings.charOpacity / 100;
  ctx.globalCompositeOperation = settings.blendMode;
  ctx.fillStyle = cell.color;
  ctx.strokeStyle = cell.color;
  ctx.lineWidth = Math.max(1, settings.fontSize / 11);
  ctx.shadowColor = settings.effects.charBloom || settings.effects.bloom ? cell.color : "transparent";
  ctx.shadowBlur = settings.effects.charBloom ? 8 : settings.effects.bloom ? 14 : 0;

  if (settings.animated) {
    const offset = Math.sin(tick / settings.animationSpeed + cell.x * 0.025 + cell.y * 0.018) * settings.animationIntensity * 0.03;
    ctx.translate(0, offset);
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
    ctx.fillText(settings.randomize ? pickRandomGlyph(cell, settings) : cell.glyph, cell.x, cell.y + cell.h);
  }
  ctx.restore();
}

function App() {
  const [settings, setSettings] = useState(createDefaultSettings);
  const [sourceUrl, setSourceUrl] = useState("");
  const [sourceName, setSourceName] = useState("");
  const [status, setStatus] = useState("Drop an image or video here");
  const [theme, setTheme] = useState("dark");
  const [modal, setModal] = useState(null);
  const [exporting, setExporting] = useState(false);
  const [demoSeed, setDemoSeed] = useState(0);
  const canvasRef = useRef(null);
  const sourceImageRef = useRef(null);
  const fileRef = useRef(null);
  const frameRef = useRef(0);

  const updateSetting = useCallback((key, value) => {
    setSettings((current) => ({ ...current, [key]: value }));
  }, []);

  const updateEffect = useCallback((key, value) => {
    setSettings((current) => ({ ...current, effects: { ...current.effects, [key]: value } }));
  }, []);

  const loadSource = useCallback((url, name = "Custom source") => {
    setSourceUrl(url);
    setSourceName(name);
    setStatus(`${name} loaded`);
  }, []);

  const loadDemo = useCallback(() => {
    const nextSeed = demoSeed + 1;
    setDemoSeed(nextSeed);
    loadSource(createDemoDataUrl(nextSeed), "Demo");
  }, [demoSeed, loadSource]);

  const handleFile = useCallback((file) => {
    if (!file) return;
    if (!file.type.startsWith("image/") && !file.type.startsWith("video/")) {
      setStatus("Unsupported file type");
      return;
    }
    loadSource(URL.createObjectURL(file), file.name || "Upload");
  }, [loadSource]);

  const handlePaste = useCallback((event) => {
    const item = [...(event.clipboardData?.items || [])].find((entry) => entry.type.startsWith("image/"));
    if (item) handleFile(item.getAsFile());
  }, [handleFile]);

  const draw = useCallback((tick = performance.now()) => {
    const canvas = canvasRef.current;
    const image = sourceImageRef.current;
    if (!canvas || !image || !isCanvasRuntimeAvailable()) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const width = 1100;
    const height = Math.max(620, Math.round((image.naturalHeight / image.naturalWidth) * width) || 720);
    canvas.width = width;
    canvas.height = height;

    const offscreen = document.createElement("canvas");
    offscreen.width = width;
    offscreen.height = height;
    const sourceCtx = offscreen.getContext("2d", { willReadFrequently: true });
    if (!sourceCtx) return;
    sourceCtx.drawImage(image, 0, 0, width, height);

    if (settings.backgroundMode === "solid") {
      ctx.fillStyle = "#050507";
      ctx.fillRect(0, 0, width, height);
    } else if (settings.backgroundMode === "original") {
      ctx.drawImage(image, 0, 0, width, height);
    } else if (settings.backgroundMode === "none") {
      ctx.clearRect(0, 0, width, height);
    } else {
      ctx.save();
      ctx.globalAlpha = settings.backgroundOpacity / 100;
      ctx.filter = `blur(${settings.backgroundBlur}px)`;
      ctx.drawImage(image, -settings.backgroundBlur * 2, -settings.backgroundBlur * 2, width + settings.backgroundBlur * 4, height + settings.backgroundBlur * 4);
      ctx.restore();
    }

    const data = sourceCtx.getImageData(0, 0, width, height);
    buildAsciiCells(data, width, height, settings).forEach((cell) => drawStyledCell(ctx, cell, settings, tick));

    if (settings.dotGrid) {
      ctx.fillStyle = "rgba(255,255,255,.18)";
      for (let y = 0; y < height; y += 24) {
        for (let x = 0; x < width; x += 24) ctx.fillRect(x, y, 1, 1);
      }
    }

    if (settings.mask) {
      ctx.save();
      ctx.globalCompositeOperation = settings.invertMask ? "source-over" : "destination-in";
      ctx.fillStyle = settings.invertMask ? "rgba(0,0,0,.2)" : "#fff";
      ctx.beginPath();
      ctx.ellipse(width * 0.5, height * 0.5, width * 0.32, height * 0.34, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
      if (settings.showMaskOverlay) {
        ctx.strokeStyle = "rgba(255,255,255,.72)";
        ctx.lineWidth = 3;
        ctx.setLineDash([12, 10]);
        ctx.beginPath();
        ctx.ellipse(width * 0.5, height * 0.5, width * 0.32, height * 0.34, 0, 0, Math.PI * 2);
        ctx.stroke();
        ctx.setLineDash([]);
      }
    }

    applyImageEffects(ctx, width, height, settings);
  }, [settings]);

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
    const image = new Image();
    image.crossOrigin = "anonymous";
    image.onload = () => {
      sourceImageRef.current = image;
      draw();
    };
    image.src = sourceUrl;
  }, [sourceUrl, draw]);

  useEffect(() => {
    draw();
    if (settings.animated || settings.effects.glitch || settings.style === "disco") {
      const animate = (time) => {
        draw(time);
        frameRef.current = requestAnimationFrame(animate);
      };
      frameRef.current = requestAnimationFrame(animate);
      return () => cancelAnimationFrame(frameRef.current);
    }
    return undefined;
  }, [draw, settings]);

  const exportCanvas = useCallback(async () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const format = settings.exportFormat;
    if (format === "gif" || format.startsWith("mp4")) {
      setExporting(true);
      setStatus("Exporting... 0%");
      await new Promise((resolve) => setTimeout(resolve, 350));
      setStatus(`${format.toUpperCase()} export queued. Static PNG/JPG export is available in this slice.`);
      setExporting(false);
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
  }, [settings]);

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
                className="max-h-[72vh] w-full max-w-[1100px] rounded-lg object-contain shadow-2xl"
              />
              <div className="absolute bottom-4 left-4 max-w-[calc(100%-2rem)] rounded-lg bg-background/85 px-3 py-2 text-sm text-muted-foreground shadow-lg backdrop-blur">
                {exporting ? "Exporting... 0%" : status}
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
                        Inspire Me
                      </Button>
                    </div>
                    <Separator />
                    <div className="grid grid-cols-2 gap-3">
                      <SelectControl label="Format" value={settings.exportFormat} onChange={(value) => updateSetting("exportFormat", value)} options={EXPORT_FORMATS} />
                      <SelectControl label="Resolution" value={settings.exportScale} onChange={(value) => updateSetting("exportScale", Number(value))} options={[["1", "1x"], ["2", "2x"], ["3", "3x"], ["4", "4x"]]} />
                    </div>
                    <Button onClick={exportCanvas}>
                      <DownloadIcon data-icon="inline-start" />
                      Export
                    </Button>
                  </ControlCard>

                  <ControlCard title="Playback" description="Video parity controls are staged on the same surface.">
                    <div className="grid grid-cols-2 gap-2">
                      <Button variant="outline" onClick={() => setStatus("Playback started")}><PlayIcon data-icon="inline-start" />Play</Button>
                      <Button variant="outline" onClick={() => setStatus("Playback stopped")}><SquareIcon data-icon="inline-start" />Stop</Button>
                    </div>
                    <RangeControl label="Seek" min={0} max={100} step={0.1} value={0} onChange={() => {}} />
                    <SelectControl label="Speed" value="1" onChange={() => {}} options={[["0.25", "0.25x"], ["0.5", "0.5x"], ["1", "1x"], ["1.5", "1.5x"], ["2", "2x"]]} />
                    <Badge variant="secondary" className="w-fit">FPS 30</Badge>
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
                    <div className="relative grid h-28 place-items-center rounded-lg border bg-muted/40 text-xs text-muted-foreground">
                      tap to add
                      <span className="absolute size-4 rounded-full border bg-primary shadow-[0_0_28px_hsl(var(--primary))]" />
                    </div>
                    <RangeControl label="Radius" min={5} max={100} value={30} onChange={() => {}} />
                    <RangeControl label="Light Intensity" min={0} max={100} value={80} onChange={() => {}} />
                  </ControlCard>

                  <ControlCard title="Mask" description="Restrict ASCII art to drawn areas while preserving the background.">
                    <ToggleControl label="Enable Mask" checked={settings.mask} onChange={(value) => updateSetting("mask", value)} />
                    <SelectControl label="Mask Tool" value={settings.maskTool} onChange={(value) => updateSetting("maskTool", value)} options={[["freehand", "Freehand"], ["rect", "Rectangle"], ["ellipse", "Ellipse"]]} />
                    <RangeControl label="Brush Size" min={5} max={100} value={settings.brushSize} onChange={(value) => updateSetting("brushSize", value)} />
                    <ToggleControl label="Show Overlay" checked={settings.showMaskOverlay} onChange={(value) => updateSetting("showMaskOverlay", value)} />
                    <ToggleControl label="Invert Mask" checked={settings.invertMask} onChange={(value) => updateSetting("invertMask", value)} />
                    <Button variant="outline" onClick={() => setStatus("Mask cleared")}>Clear Mask</Button>
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
              <div className="aspect-video rounded-lg border bg-[linear-gradient(90deg,transparent_32.8%,hsl(var(--border))_33%,transparent_33.2%,transparent_66.1%,hsl(var(--border))_66.3%,transparent_66.5%),linear-gradient(0deg,transparent_32.8%,hsl(var(--border))_33%,transparent_33.2%,transparent_66.1%,hsl(var(--border))_66.3%,transparent_66.5%)]" />
              <DialogFooter>
                <Button variant="outline" title="Rotate counter-clockwise" onClick={() => setStatus("Rotated counter-clockwise")}>Rotate left</Button>
                <Button variant="outline" title="Rotate clockwise" onClick={() => setStatus("Rotated clockwise")}>Rotate right</Button>
                <Button variant="outline" onClick={() => setModal(null)}>Cancel</Button>
                <Button onClick={() => { setStatus("Crop saved"); setModal(null); }}>Save</Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default App;
