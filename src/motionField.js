const IDLE_EPSILON = 0.035;
const BURST_DURATION_MS = 1200;

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, Number(value)));
}

function cellKey(cell) {
  return [
    Math.round(Number(cell.x || 0) * 1000) / 1000,
    Math.round(Number(cell.y || 0) * 1000) / 1000,
    Math.round(Number(cell.w || 0) * 1000) / 1000,
    Math.round(Number(cell.h || 0) * 1000) / 1000
  ].join(":");
}

function seededNoise(x, y, z = 0) {
  const value = Math.sin(x * 127.1 + y * 311.7 + z * 74.7) * 43758.5453123;
  return value - Math.floor(value);
}

function settingsDisabled(settings = {}) {
  return !settings.interactiveMotion || settings.reducedMotion || settings.prefersReducedMotion;
}

function controlAmount(settings = {}) {
  return clamp(Number(settings.motionAmount ?? 45) / 100, 0, 1.5);
}

export function createMotionParticle(cell, index = 0, previous = null) {
  const key = cell.motionKey || cellKey(cell);
  const width = Number(cell.w || 0);
  const height = Number(cell.h || 0);
  const anchorX = Number(cell.x || 0) + width / 2;
  const anchorY = Number(cell.y || 0) + height / 2;
  const phase = previous?.phase ?? seededNoise(anchorX * 0.01, anchorY * 0.01, index) * Math.PI * 2;

  return {
    key,
    cell,
    anchorX,
    anchorY,
    x: previous ? previous.x : anchorX,
    y: previous ? previous.y : anchorY,
    vx: previous ? previous.vx : 0,
    vy: previous ? previous.vy : 0,
    phase,
    energy: previous ? previous.energy : 0,
    scale: previous ? previous.scale : 1,
    alpha: previous ? previous.alpha : 1,
    density: clamp(1 - Number(cell.luminance || 0) / 255, 0, 1)
  };
}

export function syncMotionField(cells = [], previousField = null, width = 1, height = 1) {
  const previousByKey = new Map((previousField?.particles || []).map((particle) => [particle.key, particle]));
  const particles = cells.map((cell, index) => {
    const key = cell.motionKey || cellKey(cell);
    const previous = previousByKey.get(key);
    return createMotionParticle({ ...cell, motionKey: key }, index, previous);
  });

  return {
    particles,
    width,
    height,
    time: previousField?.time || 0,
    lastActive: previousField?.lastActive || false
  };
}

export function isMotionFieldActive(settings = {}, pointer = {}, burst = {}, field = null) {
  if (settingsDisabled(settings)) return false;
  if (pointer.active && settings.pointerMode !== "off") return true;
  if (settings.idleMotion && settings.idleMotion !== "still") return true;
  if (burst?.active) return true;
  return Boolean((field?.particles || []).some((particle) => Math.hypot(particle.vx, particle.vy) > IDLE_EPSILON || particle.energy > IDLE_EPSILON));
}

export function stepMotionField(field, settings = {}, pointer = {}, burst = {}, dt = 16, width = field?.width || 1, height = field?.height || 1) {
  if (!field?.particles?.length) return field;

  if (settingsDisabled(settings)) {
    field.particles.forEach((particle) => {
      particle.x = particle.anchorX;
      particle.y = particle.anchorY;
      particle.vx = 0;
      particle.vy = 0;
      particle.energy = 0;
      particle.scale = 1;
      particle.alpha = 1;
    });
    field.lastActive = false;
    return field;
  }

  const safeDt = clamp(Number(dt || 16), 1, 1400);
  const step = Math.min(safeDt / 16.67, 4);
  field.time = (field.time || 0) + safeDt;

  const amount = controlAmount(settings);
  const force = clamp(Number(settings.motionForce ?? 55) / 100, 0, 2) * amount;
  const radius = Math.max(1, Math.min(width, height) * clamp(Number(settings.motionRadius ?? 26), 0, 100) / 100);
  const radiusSquared = radius * radius;
  const spring = clamp(Number(settings.motionSpring ?? 70) / 100, 0, 1.5) * 0.32;
  const dampingSetting = clamp(Number(settings.motionDamping ?? 88) / 100, 0.5, 0.985);
  const damping = Math.pow(dampingSetting, step);
  const turbulence = clamp(Number(settings.motionTurbulence ?? 0) / 100, 0, 1.5) * amount;
  const pointerBoost = pointer.pressed ? 1.65 : 1;

  if (burst?.active) {
    burst.elapsed = Number(burst.elapsed || 0) + safeDt;
    if (burst.elapsed >= BURST_DURATION_MS) {
      burst.active = false;
    }
  }
  const burstProgress = burst?.active ? clamp(Number(burst.elapsed || 0) / BURST_DURATION_MS, 0, 1) : 1;
  const burstStrength = burst?.active ? Math.pow(1 - burstProgress, 2) * amount * 4.4 : 0;

  field.particles.forEach((particle) => {
    const dxAnchor = particle.anchorX - particle.x;
    const dyAnchor = particle.anchorY - particle.y;
    particle.vx += dxAnchor * spring * step;
    particle.vy += dyAnchor * spring * step;

    if (pointer.active && settings.pointerMode !== "off") {
      const dx = particle.x - Number(pointer.x || 0);
      const dy = particle.y - Number(pointer.y || 0);
      const distanceSquared = dx * dx + dy * dy;
      if (distanceSquared < radiusSquared) {
        const distance = Math.max(Math.sqrt(distanceSquared), 0.001);
        const falloff = Math.pow(1 - distance / radius, 2);
        const push = force * pointerBoost * falloff * 3.8 * step;
        if (settings.pointerMode === "attract") {
          particle.vx -= (dx / distance) * push * 0.9;
          particle.vy -= (dy / distance) * push * 0.9;
        } else if (settings.pointerMode === "vortex") {
          const tangentX = -dy / distance;
          const tangentY = dx / distance;
          particle.vx += tangentX * push * 1.15 - (dx / distance) * push * 0.25;
          particle.vy += tangentY * push * 1.15 - (dy / distance) * push * 0.25;
        } else {
          particle.vx += (dx / distance) * push;
          particle.vy += (dy / distance) * push;
        }
      }
    }

    if (burstStrength > 0) {
      const dx = particle.x - width / 2;
      const dy = particle.y - height / 2;
      const distance = Math.max(Math.hypot(dx, dy), 1);
      particle.vx += (dx / distance) * burstStrength * step;
      particle.vy += (dy / distance) * burstStrength * step;
    }

    if (turbulence > 0) {
      const noiseTime = field.time * 0.0008;
      const nx = seededNoise(particle.anchorX * 0.012, particle.anchorY * 0.012, noiseTime) - 0.5;
      const ny = seededNoise(particle.anchorX * 0.012 + 7.3, particle.anchorY * 0.012 + 3.1, noiseTime * 1.17) - 0.5;
      particle.vx += nx * turbulence * 0.34 * step;
      particle.vy += ny * turbulence * 0.34 * step;
    }

    if (settings.idleMotion && settings.idleMotion !== "still") {
      const idle = amount * 0.055 * step * (0.65 + particle.density * 0.7);
      const idleTime = field.time * 0.001;
      if (settings.idleMotion === "drift") {
        particle.vx += Math.sin(idleTime * 0.78 + particle.phase) * idle;
        particle.vy += Math.cos(idleTime * 0.93 + particle.phase * 1.3) * idle;
      } else if (settings.idleMotion === "orbit") {
        particle.vx += -(particle.y - particle.anchorY) * idle * 0.018;
        particle.vy += (particle.x - particle.anchorX) * idle * 0.018;
      } else if (settings.idleMotion === "breathe") {
        const breath = Math.sin(idleTime * 1.4 + particle.phase);
        particle.vx += dxAnchor * breath * idle * 0.06;
        particle.vy += dyAnchor * breath * idle * 0.06;
        particle.scale = 1 + breath * amount * 0.06;
        particle.alpha = clamp(0.9 + breath * 0.1, 0.68, 1);
      }
    } else {
      particle.scale += (1 - particle.scale) * 0.14 * step;
      particle.alpha += (1 - particle.alpha) * 0.18 * step;
    }

    particle.vx *= damping;
    particle.vy *= damping;
    particle.x += particle.vx * step;
    particle.y += particle.vy * step;

    const speed = Math.hypot(particle.vx, particle.vy);
    particle.energy = Math.max(speed, particle.energy * Math.pow(0.82, step));
    if (speed < 0.002 && Math.hypot(dxAnchor, dyAnchor) < 0.01) {
      particle.x = particle.anchorX;
      particle.y = particle.anchorY;
      particle.vx = 0;
      particle.vy = 0;
      particle.energy = 0;
    }
  });

  field.lastActive = isMotionFieldActive(settings, pointer, burst, field);
  return field;
}
