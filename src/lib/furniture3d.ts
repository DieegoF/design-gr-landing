// Maqueta 3D ilustrativa de muebles a medida (concepto, no es el mueble final).
// Se carga solo en el navegador (three.js) desde el componente Configurator.
/* eslint-disable @typescript-eslint/no-explicit-any */
import * as THREE from "three";

export type FurnitureKind = "placard" | "cocina" | "biblio" | "rack" | "vanit";

export interface TypeDef {
  lab: string;
  tipo: string;
  W: [number, number, number];
  H: [number, number, number];
  D: [number, number, number];
  n: [number, number, number];
  nl: string;
  hl: string;
}

export const TYPES: Record<FurnitureKind, TypeDef> = {
  placard: { lab: "Placard / vestidor", tipo: "Placard / vestidor", W: [120, 400, 240], H: [200, 270, 250], D: [50, 70, 60], n: [2, 6, 4], nl: "Puertas", hl: "Alto" },
  cocina: { lab: "Cocina", tipo: "Cocina", W: [120, 400, 260], H: [200, 250, 220], D: [55, 65, 60], n: [2, 8, 4], nl: "Puertas por fila", hl: "Alto hasta alacenas" },
  biblio: { lab: "Biblioteca", tipo: "Escritorio / biblioteca", W: [80, 360, 200], H: [180, 270, 220], D: [25, 45, 35], n: [2, 6, 3], nl: "Columnas", hl: "Alto" },
  rack: { lab: "Rack TV", tipo: "Mueble TV / living", W: [140, 360, 220], H: [150, 270, 240], D: [35, 50, 40], n: [2, 6, 3], nl: "Módulos", hl: "Alto del panel" },
  vanit: { lab: "Baño", tipo: "Mueble de baño", W: [50, 140, 80], H: [40, 70, 50], D: [40, 55, 46], n: [1, 4, 2], nl: "Puertas", hl: "Alto del mueble" },
};

export interface MaterialDef {
  grp: "Melamina" | "Laqueado" | "Madera maciza";
  css: string;
}

export const MATERIALS: Record<string, MaterialDef> = {
  "Melamina blanca": { grp: "Melamina", css: "#efece6" },
  "Melamina gris grafito": { grp: "Melamina", css: "#4a4a48" },
  "Melamina roble": { grp: "Melamina", css: "linear-gradient(90deg,#c9a072,#a87b50,#c79e70,#b0835a)" },
  "Laqueado verde salvia": { grp: "Laqueado", css: "#8fa38c" },
  "Laqueado negro mate": { grp: "Laqueado", css: "#1f1f1f" },
  "Madera maciza nogal": { grp: "Madera maciza", css: "linear-gradient(90deg,#7a5234,#5a3a24,#7d5638,#4f331f)" },
};

export interface FurnitureState {
  k: FurnitureKind;
  W: number;
  H: number;
  D: number;
  n: number;
  m: string;
}

function woodTex(a: string, b: string, seed: number) {
  const c = document.createElement("canvas");
  c.width = c.height = 512;
  const g = c.getContext("2d")!;
  g.fillStyle = a;
  g.fillRect(0, 0, 512, 512);
  let r = seed;
  const rnd = () => {
    r = (r * 16807) % 2147483647;
    return r / 2147483647;
  };
  for (let i = 0; i < 140; i++) {
    const x = rnd() * 512,
      w = 0.6 + rnd() * 2.4,
      amp = 2 + rnd() * 6,
      f = 0.004 + rnd() * 0.012,
      ph = rnd() * 6;
    g.strokeStyle = b;
    g.globalAlpha = 0.08 + rnd() * 0.22;
    g.lineWidth = w;
    g.beginPath();
    for (let y = 0; y <= 512; y += 8) {
      const xx = x + Math.sin(y * f + ph) * amp;
      if (y) g.lineTo(xx, y);
      else g.moveTo(xx, y);
    }
    g.stroke();
  }
  g.globalAlpha = 1;
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.anisotropy = 4;
  return t;
}

const std = (o: THREE.MeshStandardMaterialParameters) => new THREE.MeshStandardMaterial(o);

export class FurnitureScene {
  private R: THREE.WebGLRenderer;
  private scene = new THREE.Scene();
  private cam = new THREE.PerspectiveCamera(36, 1, 0.05, 60);
  private sun: THREE.DirectionalLight;
  private G = new THREE.Group();
  private P = new THREE.Group();
  private mats: Record<string, THREE.MeshStandardMaterial> = {};
  private M: Record<string, THREE.MeshStandardMaterial>;
  private doors: { p: THREE.Group; s: number }[] = [];
  private drawers: { g: THREE.Group; z0: number; dz: number }[] = [];
  private raf = 0;
  private ro: ResizeObserver;
  private io: IntersectionObserver;
  private visible = true;
  private first = true;
  private clock = new THREE.Clock();
  private drag: { x: number; y: number; yaw: number; pitch: number } | null = null;

  st: FurnitureState = { k: "placard", W: 240, H: 250, D: 60, n: 4, m: "Melamina blanca" };
  open = 0;
  openT = 0;
  person = false;
  front = false;
  touched = false;
  private yaw = -0.5;
  private yawT = -0.5;
  private pitch = 0.14;
  private pitchT = 0.14;
  private zoom = 1;
  private dist = 4;
  private distT = 4;
  private tgt = new THREE.Vector3();
  private tgtT = new THREE.Vector3();
  onInteract?: () => void;

  constructor(
    private canvas: HTMLCanvasElement,
    private container: HTMLElement,
  ) {
    const R = new THREE.WebGLRenderer({ canvas, antialias: true, preserveDrawingBuffer: true });
    R.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    R.shadowMap.enabled = true;
    R.shadowMap.type = THREE.PCFSoftShadowMap;
    this.R = R;
    this.scene.background = new THREE.Color("#efe8de");
    this.scene.add(new THREE.HemisphereLight(0xffffff, 0xb8a68e, 1.75));
    const sun = new THREE.DirectionalLight(0xffffff, 1.95);
    sun.position.set(1.4, 4.6, 5.2);
    sun.castShadow = true;
    sun.shadow.mapSize.set(2048, 2048);
    Object.assign(sun.shadow.camera, { left: -4, right: 4, top: 4, bottom: -1, near: 0.5, far: 14 });
    sun.shadow.bias = -0.0004;
    sun.shadow.radius = 4;
    this.sun = sun;
    this.scene.add(sun);
    const fill = new THREE.DirectionalLight(0xfff4e6, 0.55);
    fill.position.set(-3, 2, 3);
    this.scene.add(fill);
    const floor = new THREE.Mesh(new THREE.PlaneGeometry(30, 30), std({ color: "#cdbca4", roughness: 0.9 }));
    floor.rotation.x = -Math.PI / 2;
    floor.receiveShadow = true;
    this.scene.add(floor);
    const wall = new THREE.Mesh(new THREE.PlaneGeometry(30, 10), std({ color: "#e6dccd", roughness: 0.95 }));
    wall.position.set(0, 5, -0.004);
    wall.receiveShadow = true;
    this.scene.add(wall);
    this.scene.add(this.G);
    this.scene.add(this.P);

    this.mats = {
      "Melamina blanca": std({ color: "#f1eee8", roughness: 0.55 }),
      "Melamina gris grafito": std({ color: "#4b4b49", roughness: 0.6 }),
      "Melamina roble": std({ map: woodTex("#c99f70", "#7d5530", 11), roughness: 0.62 }),
      "Laqueado verde salvia": std({ color: "#8ea28b", roughness: 0.32 }),
      "Laqueado negro mate": std({ color: "#232323", roughness: 0.45 }),
      "Madera maciza nogal": std({ map: woodTex("#78502f", "#3a2414", 23), roughness: 0.5 }),
    };
    this.M = {
      INT: std({ color: "#ece7df", roughness: 0.7 }),
      BACK: std({ color: "#ddd6cb", roughness: 0.8 }),
      METAL: std({ color: "#9aa0a3", metalness: 0.85, roughness: 0.3 }),
      HANDLE: std({ color: "#1c1c1c", metalness: 0.5, roughness: 0.4 }),
      COUNTER: std({ color: "#3b3c3d", roughness: 0.35 }),
      STEEL: std({ color: "#c5c9cc", metalness: 0.9, roughness: 0.25 }),
      GLASS: std({ color: "#111111", roughness: 0.15 }),
      TV: std({ color: "#0d0d0f", roughness: 0.2 }),
      SCREEN: std({ color: "#1c2430", roughness: 0.1, metalness: 0.2 }),
      CER: std({ color: "#fbfbfa", roughness: 0.2 }),
      BASIN: std({ color: "#dfe3e4", roughness: 0.15 }),
      MIRROR: std({ color: "#b7c4c7", metalness: 0.1, roughness: 0.08, emissive: "#8fa2a8", emissiveIntensity: 0.15 }),
      PERSON: std({ color: "#b9b1a6", roughness: 0.9, transparent: true, opacity: 0.85 }),
      SPLASH: std({ color: "#e7e1d8", roughness: 0.4 }),
      SLATBACK: std({ color: "#2a2622", roughness: 0.9 }),
      RING: std({ color: "#3a3a3a", roughness: 0.3 }),
      SINKIN: std({ color: "#7f8487", metalness: 0.8, roughness: 0.4 }),
    };
    const legs = new THREE.Mesh(new THREE.CylinderGeometry(0.13, 0.11, 0.86, 20), this.M.PERSON);
    legs.position.y = 0.43;
    const torso = new THREE.Mesh(new THREE.CylinderGeometry(0.19, 0.15, 0.62, 20), this.M.PERSON);
    torso.position.y = 1.17;
    const head = new THREE.Mesh(new THREE.SphereGeometry(0.11, 20, 16), this.M.PERSON);
    head.position.y = 1.59;
    [legs, torso, head].forEach((m) => {
      m.castShadow = true;
      this.P.add(m);
    });
    this.P.visible = false;

    canvas.addEventListener("pointerdown", this.onDown);
    window.addEventListener("pointermove", this.onMove);
    window.addEventListener("pointerup", this.onUp);
    window.addEventListener("pointercancel", this.onUp);
    canvas.addEventListener("wheel", this.onWheel, { passive: false });
    this.ro = new ResizeObserver(() => this.resize());
    this.ro.observe(container);
    this.io = new IntersectionObserver((es) => {
      const v = es[0].isIntersecting;
      if (v && !this.visible) this.first = true;
      this.visible = v;
    });
    this.io.observe(container);
    this.resize();
    this.loop();
  }

  dispose() {
    cancelAnimationFrame(this.raf);
    this.ro.disconnect();
    this.io.disconnect();
    this.canvas.removeEventListener("pointerdown", this.onDown);
    window.removeEventListener("pointermove", this.onMove);
    window.removeEventListener("pointerup", this.onUp);
    window.removeEventListener("pointercancel", this.onUp);
    this.canvas.removeEventListener("wheel", this.onWheel);
    this.clear();
    this.R.dispose();
  }

  set(p: Partial<FurnitureState>) {
    Object.assign(this.st, p);
    this.build();
  }

  setType(k: FurnitureKind) {
    const t = TYPES[k];
    this.set({ k, W: t.W[2], H: t.H[2], D: t.D[2], n: t.n[2] });
  }

  toggleOpen() {
    this.openT = this.openT ? 0 : 1;
    return !!this.openT;
  }

  togglePerson() {
    this.person = !this.person;
    this.build();
    return this.person;
  }

  toggleFront() {
    this.front = !this.front;
    this.yawT = this.front ? 0 : -0.5;
    this.pitchT = this.front ? 0.04 : 0.14;
    this.touched = true;
    return this.front;
  }

  snapshot() {
    this.R.render(this.scene, this.cam);
    return this.canvas.toDataURL("image/jpeg", 0.85);
  }

  // ---------- construcción ----------
  private box(w: number, h: number, d: number, x: number, y: number, z: number, m: THREE.Material, par?: THREE.Object3D) {
    const me = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), m);
    me.position.set(x, y, z);
    me.castShadow = me.receiveShadow = true;
    (par || this.G).add(me);
    return me;
  }
  private cyl(r: number, h: number, m: THREE.Material, x: number, y: number, z: number, rotZ = 0) {
    const c = new THREE.Mesh(new THREE.CylinderGeometry(r, r, h, 24), m);
    c.rotation.z = rotZ;
    c.position.set(x, y, z);
    c.castShadow = true;
    this.G.add(c);
    return c;
  }
  private door(x0: number, y0: number, w: number, h: number, z: number, m: THREE.Material, left: boolean, handleY: number) {
    const T = 0.018;
    const p = new THREE.Group();
    p.position.set(left ? x0 : x0 + w, y0, z);
    this.G.add(p);
    const dx = left ? 1 : -1;
    this.box(w - 0.004, h - 0.004, T, (dx * w) / 2, h / 2, T / 2, m, p);
    const hh = Math.min(0.22, h * 0.45);
    this.box(0.012, hh, 0.018, dx * (w - 0.035), handleY, T + 0.012, this.M.HANDLE, p);
    this.doors.push({ p, s: left ? -1 : 1 });
  }
  private drawer(x: number, y: number, w: number, h: number, z: number, d: number, m: THREE.Material) {
    const T = 0.018;
    const g = new THREE.Group();
    g.position.set(x, y, z);
    this.G.add(g);
    this.box(w, h, T, 0, 0, 0, m, g);
    this.box(w - 0.04, h * 0.7, d, 0, -h * 0.1, -d / 2, this.M.INT, g);
    this.box(0.18, 0.012, 0.018, 0, h * 0.25, T / 2 + 0.01, this.M.HANDLE, g);
    this.drawers.push({ g, z0: z, dz: Math.min(0.35, d * 0.8) });
  }
  private carcass(W: number, H: number, D: number, y0: number, m: THREE.Material, back = true) {
    const T = 0.018;
    this.box(T, H, D, -W / 2 + T / 2, y0 + H / 2, D / 2, m);
    this.box(T, H, D, W / 2 - T / 2, y0 + H / 2, D / 2, m);
    this.box(W - 2 * T, T, D, 0, y0 + H - T / 2, D / 2, m);
    this.box(W - 2 * T, T, D, 0, y0 + T / 2, D / 2, m);
    if (back) this.box(W - 2 * T, H - 2 * T, 0.006, 0, y0 + H / 2, 0.006, this.M.BACK);
  }
  private colsX(W: number, n: number) {
    const T = 0.018;
    const Wi = W - 2 * T,
      cw = (Wi - (n - 1) * T) / n,
      xs: number[] = [];
    for (let i = 0; i < n; i++) xs.push(-W / 2 + T + cw / 2 + i * (cw + T));
    return { cw, xs };
  }

  private placard(W: number, H: number, D: number, n: number, m: THREE.Material) {
    const T = 0.018,
      pl = 0.08,
      I = this.M.INT;
    this.carcass(W, H - pl, D, pl, m);
    this.box(W - 2 * T, pl, T, 0, pl / 2, D - 0.05, m);
    const cols = Math.ceil(n / 2),
      { cw, xs } = this.colsX(W, cols);
    xs.slice(1).forEach((x) => this.box(T, H - pl - 2 * T, D - 0.02, x - cw / 2 - T / 2, pl + (H - pl) / 2, D / 2 - 0.01, I));
    xs.forEach((x, i) => {
      const t = i % 3;
      if (t === 0 || t === 2) {
        this.box(cw, T, D - 0.03, x, H - 0.33, D / 2, I);
        this.cyl(0.012, cw, this.M.METAL, x, H - 0.42, D / 2, Math.PI / 2);
      }
      if (t === 0) this.box(cw, T, D - 0.03, x, pl + 0.3, D / 2, I);
      if (t === 1) for (let y = pl + 0.36; y < H - 0.2; y += 0.36) this.box(cw, T, D - 0.03, x, y, D / 2, I);
      if (t === 2) {
        for (let k = 0; k < 3; k++) this.drawer(x, pl + 0.13 + k * 0.22, cw - 0.01, 0.2, D - 0.04, D - 0.1, I);
        this.box(cw, T, D - 0.03, x, pl + 0.7, D / 2, I);
      }
    });
    const dw = W / n;
    for (let i = 0; i < n; i++) this.door(-W / 2 + i * dw, pl, dw, H - pl, D, m, i % 2 === 0, (H - pl) * 0.5);
  }

  private cocina(W: number, H: number, D: number, n: number, m: THREE.Material) {
    const T = 0.018,
      pl = 0.1,
      bh = 0.76,
      M = this.M;
    this.carcass(W, bh, D - 0.02, pl, m);
    this.box(W - 2 * T, pl, T, 0, pl / 2, D - 0.07, M.BACK);
    this.box(W + 0.02, 0.04, D + 0.01, 0, pl + bh + 0.02, D / 2, M.COUNTER);
    this.box(W, 0.6, 0.012, 0, pl + bh + 0.04 + 0.3, 0.006, M.SPLASH);
    const top = pl + bh + 0.04;
    this.box(0.5, 0.004, 0.38, -W * 0.22, top + 0.002, D / 2, M.STEEL);
    this.box(0.44, 0.005, 0.32, -W * 0.22, top + 0.003, D / 2, M.SINKIN);
    this.cyl(0.015, 0.28, M.STEEL, -W * 0.22, top + 0.14, 0.08);
    this.box(0.015, 0.015, 0.16, -W * 0.22, top + 0.27, 0.15, M.STEEL);
    if (W >= 1.6) {
      this.box(0.58, 0.006, 0.5, W * 0.22, top + 0.003, D / 2, M.GLASS);
      [[-0.13, -0.1], [0.13, -0.1], [-0.13, 0.12], [0.13, 0.12]].forEach(([a, b]) => this.cyl(0.075, 0.002, M.RING, W * 0.22 + a, top + 0.008, D / 2 + b));
    }
    const dw = W / n;
    for (let i = 0; i < n; i++) this.door(-W / 2 + i * dw, pl, dw, bh, D - 0.02, m, i % 2 === 0, bh - 0.08);
    this.box(W - 2 * T, T, D - 0.06, 0, pl + bh / 2, D / 2 - 0.02, M.INT);
    if (H >= 2) {
      const y0 = 1.45,
        uh = Math.min(0.9, H - y0),
        ud = 0.35;
      this.carcass(W, uh, ud, y0, m);
      this.box(W - 2 * T, T, ud - 0.02, 0, y0 + uh / 2, ud / 2, M.INT);
      for (let i = 0; i < n; i++) this.door(-W / 2 + i * dw, y0, dw, uh, ud, m, i % 2 === 0, 0.08);
    }
  }

  private biblio(W: number, H: number, D: number, n: number, m: THREE.Material) {
    const T = 0.018;
    this.carcass(W, H, D, 0, m, false);
    this.box(W - 2 * T, H - 2 * T, 0.008, 0, H / 2, 0.006, m);
    const { cw, xs } = this.colsX(W, n),
      low = 0.72;
    xs.slice(1).forEach((x) => this.box(T, H - 2 * T, D - 0.01, x - cw / 2 - T / 2, H / 2, D / 2, m));
    xs.forEach((x) => this.box(cw, T, D - 0.01, x, low, D / 2, m));
    const top = H - T,
      cnt = Math.max(1, Math.round((top - low) / 0.36)),
      step = (top - low) / cnt;
    let r = 5;
    const rnd = () => {
      r = (r * 16807) % 2147483647;
      return r / 2147483647;
    };
    const BOOKC = ["#8a3b2e", "#2f4a3a", "#c9a35a", "#3f5872", "#d8cfc0", "#6b4e3a", "#a65f3c", "#4a4a48"];
    const bm = BOOKC.map((c) => std({ color: c, roughness: 0.7 }));
    xs.forEach((x, ci) => {
      for (let k = 1; k < cnt; k++) this.box(cw, T, D - 0.01, x, low + k * step, D / 2, m);
      for (let k = 0; k < cnt; k++) {
        const yb = low + k * step + T / 2;
        if ((k + ci) % 3 === 2) {
          this.box(0.14, 0.14, 0.14, x + cw * 0.2, yb + 0.07, D * 0.5, bm[(k + ci) % 8]);
          continue;
        }
        let xx = x - cw / 2 + 0.02;
        const lim = x - cw / 2 + cw * (0.45 + rnd() * 0.4);
        while (xx < lim) {
          const bw = 0.022 + rnd() * 0.025,
            bh = Math.min(step - 0.05, 0.17 + rnd() * 0.12);
          this.box(bw, bh, D * 0.7, xx + bw / 2, yb + bh / 2, D * 0.45, bm[Math.floor(rnd() * 8)]);
          xx += bw + 0.002;
        }
      }
    });
    xs.forEach((x, i) => this.door(x - cw / 2, T, cw, low - T, D, m, i % 2 === 0, low * 0.75));
  }

  private rack(W: number, H: number, D: number, n: number, m: THREE.Material) {
    const T = 0.018,
      M = this.M;
    const sw = 0.03,
      gap = 0.016,
      cnt = Math.floor((W + gap) / (sw + gap)),
      tot = cnt * sw + (cnt - 1) * gap;
    for (let i = 0; i < cnt; i++) this.box(sw, H, 0.02, -tot / 2 + sw / 2 + i * (sw + gap), H / 2, 0.012, m);
    this.box(tot, H, 0.008, 0, H / 2, 0.002, M.SLATBACK);
    const y0 = 0.2,
      bh = 0.42;
    this.carcass(W, bh, D, y0, m);
    this.box(W - 2 * T, T, D - 0.04, 0, y0 + bh / 2, D / 2, M.INT);
    const dw = W / n;
    for (let i = 0; i < n; i++) this.door(-W / 2 + i * dw, y0, dw, bh, D, m, i % 2 === 0, bh - 0.07);
    const tw = Math.min(1.45, W * 0.55),
      th = tw * 0.5625,
      ty = Math.min(H - th / 2 - 0.1, y0 + bh + 0.32 + th / 2);
    this.box(tw, th, 0.035, 0, ty, 0.045, M.TV);
    this.box(tw - 0.02, th - 0.02, 0.002, 0, ty, 0.0635, M.SCREEN);
  }

  private vanit(W: number, H: number, D: number, n: number, m: THREE.Material) {
    const T = 0.018,
      M = this.M,
      y0 = 0.35;
    this.carcass(W, H, D, y0, m);
    this.box(W - 2 * T, T, D - 0.04, 0, y0 + H / 2, D / 2, M.INT);
    const top = y0 + H;
    this.box(W + 0.01, 0.03, D + 0.01, 0, top + 0.015, D / 2, M.CER);
    const bw = Math.min(0.5, W * 0.62),
      bd = D * 0.62;
    this.box(bw, 0.13, bd, 0, top + 0.03 + 0.065, D / 2 + 0.02, M.CER);
    this.box(bw - 0.04, 0.004, bd - 0.04, 0, top + 0.161, D / 2 + 0.02, M.BASIN);
    this.cyl(0.014, 0.22, M.STEEL, 0, top + 0.14, 0.05);
    this.box(0.016, 0.016, 0.12, 0, top + 0.24, 0.1, M.STEEL);
    this.box(Math.min(W, 0.9), 0.75, 0.012, 0, top + 0.32 + 0.375, 0.008, M.MIRROR);
    const dw = W / n;
    for (let i = 0; i < n; i++) this.door(-W / 2 + i * dw, y0, dw, H, D, m, i % 2 === 0, H - 0.07);
  }

  private clear() {
    while (this.G.children.length) {
      const o = this.G.children.pop()!;
      o.traverse((c: any) => c.geometry && c.geometry.dispose());
    }
    this.doors = [];
    this.drawers = [];
  }

  build() {
    this.clear();
    const s = this.st,
      m = this.mats[s.m];
    const args: [number, number, number, number, THREE.Material] = [s.W / 100, s.H / 100, s.D / 100, s.n, m];
    if (s.k === "placard") this.placard(...args);
    else if (s.k === "cocina") this.cocina(...args);
    else if (s.k === "biblio") this.biblio(...args);
    else if (s.k === "rack") this.rack(...args);
    else this.vanit(...args);
    this.applyOpen();
    this.P.position.set(s.W / 200 + 0.5, 0, Math.max(s.D / 100, 0.45) + 0.15);
    this.P.visible = this.person;
    const bx = new THREE.Box3().setFromObject(this.G);
    if (this.person) bx.expandByObject(this.P);
    const sz = bx.getSize(new THREE.Vector3());
    bx.getCenter(this.tgtT);
    const half = Math.max(sz.y / 2, sz.x / 2 / this.cam.aspect) * 1.3;
    this.distT = half / Math.tan(THREE.MathUtils.degToRad(this.cam.fov / 2)) + sz.z * 0.6;
    const sc = this.sun.shadow.camera as THREE.OrthographicCamera;
    sc.left = -Math.max(4, sz.x);
    sc.right = Math.max(4, sz.x);
    sc.updateProjectionMatrix();
  }

  private applyOpen() {
    const a = this.open * 1.55;
    this.doors.forEach((d) => (d.p.rotation.y = d.s * a));
    this.drawers.forEach((d) => (d.g.position.z = d.z0 + this.open * d.dz));
  }

  private resize() {
    const w = this.container.clientWidth,
      h = this.container.clientHeight;
    if (!w || !h) return;
    this.R.setSize(w, h, false);
    this.cam.aspect = w / h;
    this.cam.updateProjectionMatrix();
    this.build();
  }

  private loop = () => {
    this.raf = requestAnimationFrame(this.loop);
    if (!this.visible) return;
    const t = this.clock.getElapsedTime(),
      k = this.first ? 1 : 0.16;
    this.first = false;
    if (!this.touched) this.yawT = -0.5 + Math.sin(t * 0.45) * 0.32;
    this.yaw += (this.yawT - this.yaw) * k;
    this.pitch += (this.pitchT - this.pitch) * k;
    this.dist += (this.distT * this.zoom - this.dist) * k;
    this.tgt.lerp(this.tgtT, k);
    if (Math.abs(this.openT - this.open) > 0.001) {
      this.open += (this.openT - this.open) * 0.12;
      this.applyOpen();
    }
    const c = Math.cos(this.pitch);
    this.cam.position.set(this.tgt.x + this.dist * c * Math.sin(this.yaw), this.tgt.y + this.dist * Math.sin(this.pitch), this.tgt.z + this.dist * c * Math.cos(this.yaw));
    this.cam.lookAt(this.tgt);
    this.R.render(this.scene, this.cam);
  };

  private onDown = (e: PointerEvent) => {
    this.drag = { x: e.clientX, y: e.clientY, yaw: this.yawT, pitch: this.pitchT };
    this.touched = true;
    this.onInteract?.();
  };
  private onMove = (e: PointerEvent) => {
    if (!this.drag) return;
    this.yawT = Math.max(-1.25, Math.min(1.25, this.drag.yaw - (e.clientX - this.drag.x) * 0.008));
    if (e.pointerType === "mouse") this.pitchT = Math.max(-0.05, Math.min(0.6, this.drag.pitch + (e.clientY - this.drag.y) * 0.005));
    this.front = false;
  };
  private onUp = () => {
    this.drag = null;
  };
  private onWheel = (e: WheelEvent) => {
    e.preventDefault();
    this.zoom = Math.max(0.55, Math.min(1.6, this.zoom * (1 + e.deltaY * 0.001)));
  };
}
