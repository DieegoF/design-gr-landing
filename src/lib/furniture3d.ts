// Maqueta 3D ilustrativa de muebles a medida (concepto, no es el mueble final).
// Se carga solo en el navegador (three.js) desde el componente Configurator.
/* eslint-disable @typescript-eslint/no-explicit-any */
import * as THREE from "three";
import {
  agrupar,
  despieceEscritorio,
  hoy,
  resumenPlacas,
  type Ficha,
  type Pieza,
} from "./despiece";

export type FurnitureKind = "escritorio" | "placard" | "cocina" | "biblio" | "rack" | "vanit";

export interface TypeDef {
  lab: string;
  tipo: string;
  W: [number, number, number];
  H: [number, number, number];
  D: [number, number, number];
  n: [number, number, number];
  nl: string;
  hl: string;
  /** Estantes: [mín, máx, por defecto] y texto del control. */
  e: [number, number, number];
  el: string;
}

export const TYPES: Record<FurnitureKind, TypeDef> = {
  escritorio: {
    lab: "Escritorio",
    tipo: "Escritorio",
    W: [90, 200, 130],
    H: [70, 80, 75],
    D: [45, 70, 50],
    n: [2, 5, 4],
    nl: "Cajones",
    hl: "Alto de la tapa",
    e: [0, 3, 1],
    el: "Estantes de la columna",
  },
  placard: {
    lab: "Placard / vestidor",
    tipo: "Placard / vestidor",
    W: [120, 400, 240],
    H: [200, 270, 250],
    D: [50, 70, 60],
    n: [2, 6, 4],
    nl: "Puertas",
    hl: "Alto",
    e: [0, 4, 1],
    el: "Estantes (por columna)",
  },
  cocina: {
    lab: "Cocina",
    tipo: "Cocina",
    W: [120, 400, 260],
    H: [200, 250, 220],
    D: [55, 65, 60],
    n: [2, 8, 4],
    nl: "Puertas por fila",
    hl: "Alto hasta alacenas",
    e: [0, 3, 1],
    el: "Estantes (por mueble)",
  },
  biblio: {
    lab: "Biblioteca",
    tipo: "Biblioteca / estantería",
    W: [80, 360, 200],
    H: [180, 270, 220],
    D: [25, 45, 35],
    n: [2, 6, 3],
    nl: "Columnas",
    hl: "Alto",
    e: [2, 8, 4],
    el: "Estantes (por columna)",
  },
  rack: {
    lab: "Rack TV",
    tipo: "Mueble TV / living",
    W: [140, 360, 220],
    H: [150, 270, 240],
    D: [35, 50, 40],
    n: [2, 6, 3],
    nl: "Módulos",
    hl: "Alto del panel",
    e: [0, 4, 0],
    el: "Estantes (a los costados)",
  },
  vanit: {
    lab: "Baño",
    tipo: "Mueble de baño",
    W: [50, 140, 80],
    H: [40, 70, 50],
    D: [40, 55, 46],
    n: [1, 4, 2],
    nl: "Puertas",
    hl: "Alto del mueble",
    e: [0, 2, 1],
    el: "Estantes interiores",
  },
};

export interface MaterialDef {
  grp: "Melamina" | "MDF";
  css: string;
}

/** Placas de melamina de 18 mm o MDF pintado/laqueado. */
export const MATERIALS: Record<string, MaterialDef> = {
  "Melamina blanca": { grp: "Melamina", css: "#efece6" },
  "Melamina gris grafito": { grp: "Melamina", css: "#4a4a48" },
  "Melamina roble": {
    grp: "Melamina",
    css: "linear-gradient(90deg,#c9a072,#a87b50,#c79e70,#b0835a)",
  },
  "Melamina nogal": {
    grp: "Melamina",
    css: "linear-gradient(90deg,#7a5234,#5a3a24,#7d5638,#4f331f)",
  },
  "Melamina gris claro": { grp: "Melamina", css: "#b9b6b0" },
  "Melamina negra": { grp: "Melamina", css: "#262626" },
  "MDF laqueado blanco": { grp: "MDF", css: "#f7f6f2" },
  "MDF laqueado negro mate": { grp: "MDF", css: "#1f1f1f" },
};

/** Espesor de placa (melamina 18 mm). */
export const ESPESOR_MM = 18;

export interface FurnitureState {
  k: FurnitureKind;
  W: number;
  H: number;
  D: number;
  n: number;
  /** Cantidad de estantes / repisas. */
  e: number;
  m: string;
  // ---- solo escritorio ----
  /** Qué va de cada lado bajo la tapa. */
  izq?: LadoEscritorio;
  der?: LadoEscritorio;
  /** Material de la tapa ("" = igual al cuerpo). */
  mt?: string;
  /** Material de puertas y frentes de cajón ("" = igual al cuerpo). Sirve para todos los muebles. */
  mf?: string;
  /** Repisas en la pared sobre el escritorio. */
  r?: number;
}

export type LadoEscritorio = "cajonera" | "estantes" | "pata";

export const LADOS: Record<LadoEscritorio, string> = {
  cajonera: "Cajonera",
  estantes: "Columna con estantes",
  pata: "Pata lateral",
};

/** Ancho de cada módulo (cajonera o columna) en cm. */
export const MODULO_CM = 35;
/** Espacio libre mínimo para las piernas en cm. */
export const LIBRE_MIN_CM = 60;

/** Modelo más pedido: cajonera de 4 a la izquierda y columna con 1 estante a la derecha, todo blanco. */
export const ESCRITORIO_DEF: Partial<FurnitureState> = {
  W: 130,
  H: 75,
  D: 50,
  n: 4,
  e: 1,
  m: "Melamina blanca",
  izq: "cajonera",
  der: "estantes",
  mt: "",
  mf: "",
  r: 0,
};

const anchoLado = (l: LadoEscritorio | undefined) =>
  l === "pata" || !l ? ESPESOR_MM / 10 : MODULO_CM;

/** Centímetros libres entre los dos lados del escritorio. */
export function libreEscritorio(W: number, izq?: LadoEscritorio, der?: LadoEscritorio) {
  return Math.round(W - anchoLado(izq) - anchoLado(der));
}

/** ¿Este lado entra sin dejar menos de LIBRE_MIN_CM para las piernas? */
export function ladoEntra(st: FurnitureState, lado: "izq" | "der", v: LadoEscritorio) {
  const izq = lado === "izq" ? v : st.izq,
    der = lado === "der" ? v : st.der;
  return libreEscritorio(st.W, izq, der) >= LIBRE_MIN_CM;
}

/** Si el ancho no alcanza, cambia módulos por patas (primero la derecha). */
export function ajustarEscritorio(st: FurnitureState): FurnitureState {
  if (st.k !== "escritorio") return st;
  const s = { ...st };
  if (libreEscritorio(s.W, s.izq, s.der) < LIBRE_MIN_CM && s.der !== "pata") s.der = "pata";
  if (libreEscritorio(s.W, s.izq, s.der) < LIBRE_MIN_CM && s.izq !== "pata") s.izq = "pata";
  return s;
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
  /** Material de los frentes (puertas y cajones) del mueble que se está armando. */
  private FM!: THREE.MeshStandardMaterial;
  private doors: { p: THREE.Group; s: number }[] = [];
  private drawers: { g: THREE.Group; z0: number; dz: number }[] = [];
  private raf = 0;
  private ro: ResizeObserver;
  private io: IntersectionObserver;
  private visible = true;
  private first = true;
  private clock = new THREE.Clock();
  private drag: { x: number; y: number; yaw: number; pitch: number } | null = null;

  st: FurnitureState = { k: "escritorio", ...ESCRITORIO_DEF } as FurnitureState;
  open = 0;
  openT = 0;
  /** Vista explotada: 0 = armado, 1 = piezas separadas. */
  explode = 0;
  explodeT = 0;
  private parts: { o: THREE.Object3D; base: THREE.Vector3; off: THREE.Vector3; decor: boolean }[] =
    [];
  /** Encuadre de cámara armado (A) y explotado (B). */
  private fitA = { d: 4, c: new THREE.Vector3() };
  private fitB = { d: 4, c: new THREE.Vector3() };
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
    Object.assign(sun.shadow.camera, {
      left: -4,
      right: 4,
      top: 4,
      bottom: -1,
      near: 0.5,
      far: 14,
    });
    sun.shadow.bias = -0.0004;
    sun.shadow.radius = 4;
    this.sun = sun;
    this.scene.add(sun);
    const fill = new THREE.DirectionalLight(0xfff4e6, 0.55);
    fill.position.set(-3, 2, 3);
    this.scene.add(fill);
    const floor = new THREE.Mesh(
      new THREE.PlaneGeometry(30, 30),
      std({ color: "#cdbca4", roughness: 0.9 }),
    );
    floor.rotation.x = -Math.PI / 2;
    floor.receiveShadow = true;
    this.scene.add(floor);
    const wall = new THREE.Mesh(
      new THREE.PlaneGeometry(30, 10),
      std({ color: "#e6dccd", roughness: 0.95 }),
    );
    wall.position.set(0, 5, -0.004);
    wall.receiveShadow = true;
    this.scene.add(wall);
    this.scene.add(this.G);
    this.scene.add(this.P);

    this.mats = {
      "Melamina blanca": std({ color: "#f1eee8", roughness: 0.55 }),
      "Melamina gris grafito": std({ color: "#4b4b49", roughness: 0.6 }),
      "Melamina roble": std({ map: woodTex("#c99f70", "#7d5530", 11), roughness: 0.62 }),
      "Melamina nogal": std({ map: woodTex("#78502f", "#3a2414", 23), roughness: 0.6 }),
      "Melamina gris claro": std({ color: "#bab7b1", roughness: 0.6 }),
      "Melamina negra": std({ color: "#272727", roughness: 0.55 }),
      "MDF laqueado blanco": std({ color: "#f8f7f3", roughness: 0.28 }),
      "MDF laqueado negro mate": std({ color: "#232323", roughness: 0.45 }),
    };
    this.M = {
      INT: std({ color: "#ece7df", roughness: 0.7 }),
      BACK: std({ color: "#ddd6cb", roughness: 0.8 }),
      METAL: std({ color: "#9aa0a3", metalness: 0.85, roughness: 0.3 }),
      COUNTER: std({ color: "#3b3c3d", roughness: 0.35 }),
      STEEL: std({ color: "#c5c9cc", metalness: 0.9, roughness: 0.25 }),
      GLASS: std({ color: "#111111", roughness: 0.15 }),
      TV: std({ color: "#0d0d0f", roughness: 0.2 }),
      SCREEN: std({ color: "#1c2430", roughness: 0.1, metalness: 0.2 }),
      CER: std({ color: "#fbfbfa", roughness: 0.2 }),
      BASIN: std({ color: "#dfe3e4", roughness: 0.15 }),
      MIRROR: std({
        color: "#b7c4c7",
        metalness: 0.1,
        roughness: 0.08,
        emissive: "#8fa2a8",
        emissiveIntensity: 0.15,
      }),
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
    this.set({
      k,
      W: t.W[2],
      H: t.H[2],
      D: t.D[2],
      n: t.n[2],
      e: t.e[2],
      ...(k === "escritorio" ? ESCRITORIO_DEF : {}),
    });
  }

  toggleOpen() {
    this.openT = this.openT ? 0 : 1;
    if (this.openT) this.explodeT = 0;
    return !!this.openT;
  }

  /** Separa el mueble pieza por pieza (o lo vuelve a armar). */
  toggleExplode() {
    this.explodeT = this.explodeT ? 0 : 1;
    if (this.explodeT) this.openT = 0;
    this.touched = true;
    return !!this.explodeT;
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
    // la imagen del pedido siempre sale con el mueble armado
    const ex = this.explode;
    this.explode = 0;
    this.applyPose();
    this.R.render(this.scene, this.cam);
    this.explode = ex;
    this.applyPose();
    return this.canvas.toDataURL("image/jpeg", 0.85);
  }

  /**
   * Despiece estimado a partir de las piezas de la maqueta (no del mueble final).
   * Incluye piezas de 18 mm, fondos de 3 mm, cajas de cajón, cantos y herrajes.
   */
  despiece(mueble: string, config: string): Ficha {
    const s = this.st;
    if (s.k === "escritorio")
      return despieceEscritorio(
        {
          W: s.W,
          H: s.H,
          D: s.D,
          n: s.n,
          e: s.e,
          r: s.r ?? 0,
          izq: s.izq ?? "cajonera",
          der: s.der ?? "estantes",
          modulo: MODULO_CM,
          m: s.m,
          mt: s.mt ?? "",
          mf: s.mf ?? "",
        },
        config,
      );
    const T = ESPESOR_MM / 1000;
    const nombreMat = new Map<THREE.Material, string>(
      Object.entries(this.mats).map(([k, v]) => [v, k]),
    );
    // interiores (cajas de cajón, estantes de placard) en melamina blanca: comparten placa con el cuerpo blanco
    const INTERIOR = "Melamina blanca";
    const FONDO = "Fondo fibrofácil";
    const mm = (v: number) => Math.round(v * 1000);
    const piezas: Pieza[] = [];
    let canto = 0;
    let cajones = 0;
    let bisagras = 0;
    const add = (
      pieza: string,
      material: string,
      esp: number,
      a: number,
      b: number,
      cantoMm = 0,
    ) => {
      piezas.push({
        pieza,
        material,
        esp,
        largo: Math.max(mm(a), mm(b)),
        ancho: Math.min(mm(a), mm(b)),
        cant: 1,
      });
      canto += cantoMm;
    };

    this.G.traverse((o) => {
      if (!(o instanceof THREE.Mesh) || !(o.geometry instanceof THREE.BoxGeometry)) return;
      const { width: w, height: h, depth: d } = o.geometry.parameters;
      const mat = o.material as THREE.Material;
      const ud = o.userData as { pieza?: string; cajon?: boolean };

      if (ud.cajon) {
        // caja del cajón: 2 laterales, frente y contrafrente interiores, piso de 3 mm
        cajones++;
        add("Lateral de cajón", INTERIOR, ESPESOR_MM, d, h, mm(d));
        add("Lateral de cajón", INTERIOR, ESPESOR_MM, d, h, mm(d));
        add(
          "Frente interior / contrafrente de cajón",
          INTERIOR,
          ESPESOR_MM,
          w - 2 * T,
          h,
          mm(w - 2 * T),
        );
        add(
          "Frente interior / contrafrente de cajón",
          INTERIOR,
          ESPESOR_MM,
          w - 2 * T,
          h,
          mm(w - 2 * T),
        );
        add("Piso de cajón", FONDO, 3, w, d);
        return;
      }

      let material = nombreMat.get(mat);
      if (!material) {
        if (mat === this.M.INT) material = INTERIOR;
        else if (mat === this.M.BACK) material = Math.min(w, h, d) < 0.012 ? FONDO : INTERIOR;
        else return; // herrajes, mesada, libros, electrodomésticos: no son piezas de placa
      }
      const min = Math.min(w, h, d);
      const fino = min < 0.012;
      const esp = fino && material === FONDO ? 3 : ESPESOR_MM;

      if (ud.pieza === "Puerta" || ud.pieza === "Frente de cajón") {
        if (ud.pieza === "Puerta") {
          bisagras += h < 0.9 ? 2 : h < 1.6 ? 3 : 4;
        }
        add(ud.pieza, material, esp, w, h, 2 * (mm(w) + mm(h)));
        return;
      }
      if (ud.pieza === "Tapa del escritorio") {
        add(ud.pieza, material, esp, w, d, 2 * (mm(w) + mm(d)));
        return;
      }
      if (fino) {
        // fondo: la cara grande es la que no es el espesor
        const [a, b] = w === min ? [h, d] : h === min ? [w, d] : [w, h];
        add("Fondo", material, esp, a, b);
        return;
      }
      // orientación según el eje del espesor
      if (Math.abs(w - T) < 1e-4) add("Lateral / división", material, esp, h, d, mm(h));
      else if (Math.abs(h - T) < 1e-4) add("Piso, techo o estante", material, esp, w, d, mm(w));
      else if (Math.abs(d - T) < 1e-4)
        // listón vertical (panel de listones del rack) o zócalo / travesaño horizontal
        add(
          w < 0.06 && h > w ? "Listón" : "Zócalo / travesaño",
          material,
          esp,
          w,
          h,
          w < 0.06 && h > w ? 0 : mm(w),
        );
      else add("Pieza", material, esp, Math.max(w, h, d), [w, h, d].sort((x, y) => x - y)[1]);
    });

    const grupos = agrupar(piezas);
    return {
      v: 1,
      mueble,
      fecha: hoy(),
      config,
      piezas: grupos,
      cantoM: Math.round(canto / 100) / 10,
      placas: resumenPlacas(grupos),
      herrajes: [
        { nombre: "Correderas (par por cajón)", cant: cajones },
        { nombre: "Bisagras", cant: bisagras },
      ].filter((x) => x.cant > 0),
    };
  }

  // ---------- construcción ----------
  private box(
    w: number,
    h: number,
    d: number,
    x: number,
    y: number,
    z: number,
    m: THREE.Material,
    par?: THREE.Object3D,
  ) {
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
  private door(
    x0: number,
    y0: number,
    w: number,
    h: number,
    z: number,
    m: THREE.Material,
    left: boolean,
  ) {
    const T = ESPESOR_MM / 1000;
    const p = new THREE.Group();
    p.position.set(left ? x0 : x0 + w, y0, z);
    this.G.add(p);
    const dx = left ? 1 : -1;
    this.box(w - 0.004, h - 0.004, T, (dx * w) / 2, h / 2, T / 2, m, p).userData.pieza = "Puerta";
    this.doors.push({ p, s: left ? -1 : 1 });
  }
  private drawer(
    x: number,
    y: number,
    w: number,
    h: number,
    z: number,
    d: number,
    m: THREE.Material,
  ) {
    const T = ESPESOR_MM / 1000;
    const g = new THREE.Group();
    g.position.set(x, y, z);
    this.G.add(g);
    this.box(w, h, T, 0, 0, 0, m, g).userData.pieza = "Frente de cajón";
    // la caja del cajón se dibuja como un bloque; en el despiece se abre en sus piezas
    this.box(w - 0.04, h * 0.7, d, 0, -h * 0.1, -d / 2, this.M.INT, g).userData.cajon = true;
    this.drawers.push({ g, z0: z, dz: Math.min(0.35, d * 0.8) });
  }
  private carcass(W: number, H: number, D: number, y0: number, m: THREE.Material, back = true) {
    const T = ESPESOR_MM / 1000;
    this.box(T, H, D, -W / 2 + T / 2, y0 + H / 2, D / 2, m);
    this.box(T, H, D, W / 2 - T / 2, y0 + H / 2, D / 2, m);
    this.box(W - 2 * T, T, D, 0, y0 + H - T / 2, D / 2, m);
    this.box(W - 2 * T, T, D, 0, y0 + T / 2, D / 2, m);
    if (back) this.box(W - 2 * T, H - 2 * T, 0.006, 0, y0 + H / 2, 0.006, this.M.BACK);
  }
  private colsX(W: number, n: number) {
    const T = ESPESOR_MM / 1000;
    const Wi = W - 2 * T,
      cw = (Wi - (n - 1) * T) / n,
      xs: number[] = [];
    for (let i = 0; i < n; i++) xs.push(-W / 2 + T + cw / 2 + i * (cw + T));
    return { cw, xs };
  }

  private escritorio(W: number, H: number, D: number, n: number, m: THREE.Material, e: number) {
    const T = ESPESOR_MM / 1000,
      M = this.M,
      st = this.st,
      mt = (st.mt && this.mats[st.mt]) || m,
      legH = H - T,
      mw = MODULO_CM / 100,
      izq = st.izq ?? "cajonera",
      der = st.der ?? "estantes";
    // tapa (puede ir en otro color)
    this.box(W, T, D, 0, H - T / 2, D / 2, mt).userData.pieza = "Tapa del escritorio";

    const BOOKC = ["#8a3b2e", "#2f4a3a", "#c9a35a", "#3f5872", "#d8cfc0"];
    const lado = (kind: LadoEscritorio, sgn: -1 | 1) => {
      // sgn -1 = izquierda, 1 = derecha; x0/x1 = borde exterior / interior del módulo
      if (kind === "pata") {
        this.box(T, legH, D - 0.02, sgn * (W / 2 - T / 2), legH / 2, D / 2, m);
        return sgn * (W / 2 - T);
      }
      const xo = sgn * (W / 2),
        xi = sgn * (W / 2 - mw),
        xc = (xo + xi) / 2,
        iw = mw - 2 * T,
        pl = 0.04,
        ih = legH - pl - T;
      this.box(T, legH, D - 0.02, xo - sgn * (T / 2), legH / 2, D / 2, m);
      this.box(T, legH, D - 0.02, xi + sgn * (T / 2), legH / 2, D / 2, m);
      this.box(iw, pl, T, xc, pl / 2, D - 0.04, m);
      this.box(iw, T, D - 0.02, xc, pl + T / 2, D / 2, m);
      this.box(iw, ih, 0.006, xc, pl + T + ih / 2, 0.012, M.BACK);
      if (kind === "cajonera") {
        const dh = ih / n;
        for (let k = 0; k < n; k++)
          this.drawer(
            xc,
            pl + T + dh * k + dh / 2,
            iw - 0.004,
            dh - 0.006,
            D - 0.022,
            D - 0.1,
            this.FM,
          );
      } else {
        const hs = ih / (e + 1);
        for (let k = 1; k <= e; k++) this.box(iw, T, D - 0.03, xc, pl + T + k * hs, D / 2, m);
        // unos libros en el hueco de arriba
        let bx = xc - iw / 2 + 0.02;
        const yb = pl + T + e * hs + T / 2,
          bhMax = Math.max(0.08, hs - 0.04);
        BOOKC.forEach((c, i) => {
          const bw = 0.025 + (i % 2) * 0.01,
            bh = Math.min(bhMax, 0.18 + (i % 3) * 0.02);
          if (bx + bw > xc + iw / 2 - 0.02) return;
          this.box(
            bw,
            bh,
            D * 0.6,
            bx + bw / 2,
            yb + bh / 2,
            D * 0.5,
            std({ color: c, roughness: 0.7 }),
          );
          bx += bw + 0.003;
        });
      }
      return xi;
    };
    const xL = lado(izq, -1),
      xR = lado(der, 1);

    // repisas en la pared (r)
    const r = st.r ?? 0,
      sw = Math.min(W * 0.7, 1.2),
      sx = -W / 2 + sw / 2 + 0.05;
    for (let k = 0; k < r; k++) {
      const sy = H + 0.62 + k * 0.36;
      this.box(sw, T, 0.24, sx, sy, 0.12, m);
      let bx = -W / 2 + 0.12 + (k % 2) * sw * 0.45;
      BOOKC.slice(0, 5 - (k % 3)).forEach((c, i) => {
        const bw = 0.03 + (i % 2) * 0.012,
          bh = 0.2 + ((i * 7 + k) % 5) * 0.012;
        this.box(
          bw,
          bh,
          0.17,
          bx + bw / 2,
          sy + T / 2 + bh / 2,
          0.12,
          std({ color: c, roughness: 0.7 }),
        );
        bx += bw + 0.004;
      });
    }

    // notebook en el centro del hueco libre
    const cx = (xL + xR) / 2,
      top = H;
    this.box(0.34, 0.012, 0.24, cx, top + 0.006, Math.min(D * 0.55, 0.3), M.STEEL);
    const scr = new THREE.Group();
    scr.position.set(cx, top + 0.012, Math.min(D * 0.55, 0.3) - 0.12);
    scr.rotation.x = -0.25;
    this.G.add(scr);
    this.box(0.34, 0.22, 0.008, 0, 0.11, 0, M.STEEL, scr);
    this.box(0.32, 0.2, 0.002, 0, 0.11, 0.005, M.SCREEN, scr);
  }

  private placard(W: number, H: number, D: number, n: number, m: THREE.Material, e: number) {
    const T = ESPESOR_MM / 1000,
      pl = 0.08,
      I = this.M.INT;
    this.carcass(W, H - pl, D, pl, m);
    this.box(W - 2 * T, pl, T, 0, pl / 2, D - 0.05, m);
    const cols = Math.ceil(n / 2),
      { cw, xs } = this.colsX(W, cols);
    xs.slice(1).forEach((x) =>
      this.box(T, H - pl - 2 * T, D - 0.02, x - cw / 2 - T / 2, pl + (H - pl) / 2, D / 2 - 0.01, I),
    );
    xs.forEach((x, i) => {
      const t = i % 3;
      if (t === 0 || t === 2) {
        this.box(cw, T, D - 0.03, x, H - 0.33, D / 2, I);
        this.cyl(0.012, cw, this.M.METAL, x, H - 0.42, D / 2, Math.PI / 2);
      }
      // columna de colgar: e estantes en la parte de abajo
      if (t === 0) {
        const z1 = H - 1.45,
          st = (z1 - pl) / (e + 1);
        for (let k = 1; k <= e; k++) this.box(cw, T, D - 0.03, x, pl + k * st, D / 2, I);
      }
      // columna de estantes: e + 3 estantes repartidos
      if (t === 1) {
        const c = e + 3,
          st = (H - 0.33 - pl) / (c + 1);
        this.box(cw, T, D - 0.03, x, H - 0.33, D / 2, I);
        for (let k = 1; k <= c; k++) this.box(cw, T, D - 0.03, x, pl + k * st, D / 2, I);
      }
      if (t === 2) {
        for (let k = 0; k < 3; k++)
          this.drawer(x, pl + 0.13 + k * 0.22, cw - 0.01, 0.2, D - 0.04, D - 0.1, I);
        this.box(cw, T, D - 0.03, x, pl + 0.7, D / 2, I);
      }
    });
    const dw = W / n;
    for (let i = 0; i < n; i++) this.door(-W / 2 + i * dw, pl, dw, H - pl, D, this.FM, i % 2 === 0);
  }

  private cocina(W: number, H: number, D: number, n: number, m: THREE.Material, e: number) {
    const T = ESPESOR_MM / 1000,
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
      [
        [-0.13, -0.1],
        [0.13, -0.1],
        [-0.13, 0.12],
        [0.13, 0.12],
      ].forEach(([a, b]) => this.cyl(0.075, 0.002, M.RING, W * 0.22 + a, top + 0.008, D / 2 + b));
    }
    const dw = W / n;
    for (let i = 0; i < n; i++)
      this.door(-W / 2 + i * dw, pl, dw, bh, D - 0.02, this.FM, i % 2 === 0);
    for (let k = 1; k <= e; k++)
      this.box(W - 2 * T, T, D - 0.06, 0, pl + (bh * k) / (e + 1), D / 2 - 0.02, M.INT);
    if (H >= 2) {
      const y0 = 1.45,
        uh = Math.min(0.9, H - y0),
        ud = 0.35;
      this.carcass(W, uh, ud, y0, m);
      for (let k = 1; k <= e; k++)
        this.box(W - 2 * T, T, ud - 0.02, 0, y0 + (uh * k) / (e + 1), ud / 2, M.INT);
      for (let i = 0; i < n; i++) this.door(-W / 2 + i * dw, y0, dw, uh, ud, this.FM, i % 2 === 0);
    }
  }

  private biblio(W: number, H: number, D: number, n: number, m: THREE.Material, e: number) {
    const T = ESPESOR_MM / 1000;
    this.carcass(W, H, D, 0, m, false);
    this.box(W - 2 * T, H - 2 * T, 0.008, 0, H / 2, 0.006, m);
    const { cw, xs } = this.colsX(W, n),
      low = 0.72;
    xs.slice(1).forEach((x) =>
      this.box(T, H - 2 * T, D - 0.01, x - cw / 2 - T / 2, H / 2, D / 2, m),
    );
    xs.forEach((x) => this.box(cw, T, D - 0.01, x, low, D / 2, m));
    const top = H - T,
      cnt = e + 1, // e estantes → e + 1 huecos
      step = (top - low) / cnt;
    let r = 5;
    const rnd = () => {
      r = (r * 16807) % 2147483647;
      return r / 2147483647;
    };
    const BOOKC = [
      "#8a3b2e",
      "#2f4a3a",
      "#c9a35a",
      "#3f5872",
      "#d8cfc0",
      "#6b4e3a",
      "#a65f3c",
      "#4a4a48",
    ];
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
            bh = Math.max(0.05, Math.min(step - 0.05, 0.17 + rnd() * 0.12));
          this.box(bw, bh, D * 0.7, xx + bw / 2, yb + bh / 2, D * 0.45, bm[Math.floor(rnd() * 8)]);
          xx += bw + 0.002;
        }
      }
    });
    xs.forEach((x, i) => this.door(x - cw / 2, T, cw, low - T, D, this.FM, i % 2 === 0));
  }

  private rack(W: number, H: number, D: number, n: number, m: THREE.Material, e: number) {
    const T = ESPESOR_MM / 1000,
      M = this.M;
    const sw = 0.03,
      gap = 0.016,
      SL = T,
      cnt = Math.floor((W + gap) / (sw + gap)),
      tot = cnt * sw + (cnt - 1) * gap;
    for (let i = 0; i < cnt; i++)
      this.box(sw, H, SL, -tot / 2 + sw / 2 + i * (sw + gap), H / 2, 0.012, m);
    this.box(tot, H, 0.008, 0, H / 2, 0.002, M.SLATBACK);
    const y0 = 0.2,
      bh = 0.42;
    this.carcass(W, bh, D, y0, m);
    this.box(W - 2 * T, T, D - 0.04, 0, y0 + bh / 2, D / 2, M.INT);
    const dw = W / n;
    for (let i = 0; i < n; i++) this.door(-W / 2 + i * dw, y0, dw, bh, D, this.FM, i % 2 === 0);
    const tw = Math.min(1.45, W * 0.55),
      th = tw * 0.5625,
      ty = Math.min(H - th / 2 - 0.1, y0 + bh + 0.32 + th / 2);
    this.box(tw, th, 0.035, 0, ty, 0.045, M.TV);
    this.box(tw - 0.02, th - 0.02, 0.002, 0, ty, 0.0635, M.SCREEN);
    // estantes flotantes a los costados de la tele (o arriba si no hay lugar)
    if (e > 0) {
      const side = (W - tw) / 2 - 0.1,
        yA = y0 + bh + 0.3,
        yB = H - 0.15;
      if (side >= 0.2) {
        const ew = Math.min(0.5, side),
          st = (yB - yA) / Math.max(1, e - 1);
        for (let k = 0; k < e; k++) {
          const y = e === 1 ? (yA + yB) / 2 : yA + k * st;
          [-1, 1].forEach((sg) => this.box(ew, T, 0.22, sg * (tw / 2 + 0.06 + ew / 2), y, 0.13, m));
        }
      } else {
        const ya = ty + th / 2 + 0.12;
        for (let k = 0; k < e && ya + k * 0.3 < H - 0.05; k++)
          this.box(Math.min(W - 0.1, 1.2), T, 0.22, 0, ya + k * 0.3, 0.13, m);
      }
    }
  }

  private vanit(W: number, H: number, D: number, n: number, m: THREE.Material, e: number) {
    const T = ESPESOR_MM / 1000,
      M = this.M,
      y0 = 0.35;
    this.carcass(W, H, D, y0, m);
    for (let k = 1; k <= e; k++)
      this.box(W - 2 * T, T, D - 0.04, 0, y0 + (H * k) / (e + 1), D / 2, M.INT);
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
    for (let i = 0; i < n; i++) this.door(-W / 2 + i * dw, y0, dw, H, D, this.FM, i % 2 === 0);
  }

  private clear() {
    while (this.G.children.length) {
      const o = this.G.children.pop()!;
      o.traverse((c: any) => c.geometry && c.geometry.dispose());
    }
    this.doors = [];
    this.drawers = [];
    this.parts = [];
  }

  /** ¿El objeto tiene al menos una pieza de placa? (si no, es decoración: libros, notebook, mesada…) */
  private esPieza(o: THREE.Object3D) {
    const piezas = new Set<THREE.Material>([...Object.values(this.mats), this.M.INT, this.M.BACK]);
    let si = false;
    o.traverse((c) => {
      if (c instanceof THREE.Mesh && piezas.has(c.material as THREE.Material)) si = true;
    });
    return si;
  }

  /** Calcula hacia dónde se mueve cada pieza en la vista explotada. */
  private prepararExplosion() {
    const piezas = this.G.children.filter((c) => this.esPieza(c));
    const caja = new THREE.Box3();
    piezas.forEach((c) => caja.expandByObject(c));
    const centro = caja.getCenter(new THREE.Vector3());
    const tam = caja.getSize(new THREE.Vector3());
    const k = 0.85;
    this.G.children.forEach((o) => {
      const decor = !piezas.includes(o);
      const c = new THREE.Box3().setFromObject(o).getCenter(new THREE.Vector3()).sub(centro);
      // separación proporcional a la distancia al centro, con un mínimo para que todo se despegue
      const off = new THREE.Vector3(
        c.x * k + Math.sign(c.x) * 0.04,
        c.y * k + Math.sign(c.y || 1) * 0.04,
        c.z * k * 0.6 + (c.z >= 0 ? 1 : -1) * Math.max(0.04, tam.z * 0.1),
      );
      this.parts.push({ o, base: o.position.clone(), off, decor });
    });
    // el frente de cada cajón también se separa de su caja
    this.drawers.forEach(({ g }) => {
      const frente = g.children.find((c) => c.userData.pieza === "Frente de cajón");
      if (frente)
        this.parts.push({
          o: frente,
          base: frente.position.clone(),
          off: new THREE.Vector3(0, 0, 0.14),
          decor: false,
        });
    });
  }

  build() {
    this.clear();
    const s = this.st,
      m = this.mats[s.m];
    this.FM = (s.mf && this.mats[s.mf]) || m;
    const args: [number, number, number, number, THREE.Material, number] = [
      s.W / 100,
      s.H / 100,
      s.D / 100,
      s.n,
      m,
      s.e,
    ];
    if (s.k === "escritorio") this.escritorio(...args);
    else if (s.k === "placard") this.placard(...args);
    else if (s.k === "cocina") this.cocina(...args);
    else if (s.k === "biblio") this.biblio(...args);
    else if (s.k === "rack") this.rack(...args);
    else this.vanit(...args);
    this.prepararExplosion();
    this.applyPose();
    this.P.position.set(s.W / 200 + 0.5, 0, Math.max(s.D / 100, 0.45) + 0.15);
    this.P.visible = this.person;
    // encuadre con el mueble armado y con las piezas separadas
    const ex = this.explode;
    let sz = new THREE.Vector3();
    for (const [e, fit] of [
      [1, this.fitB],
      [0, this.fitA],
    ] as const) {
      this.explode = e;
      this.applyPose();
      const bx = new THREE.Box3();
      this.parts.forEach((p) => {
        if (!(e && p.decor)) bx.expandByObject(p.o);
      });
      if (this.person) bx.expandByObject(this.P);
      sz = bx.getSize(new THREE.Vector3());
      bx.getCenter(fit.c);
      const half = Math.max(sz.y / 2, sz.x / 2 / this.cam.aspect) * (e ? 1.15 : 1.3);
      fit.d = half / Math.tan(THREE.MathUtils.degToRad(this.cam.fov / 2)) + sz.z * 0.6;
    }
    this.explode = ex;
    this.applyPose();
    this.encuadre();
    const sc = this.sun.shadow.camera as THREE.OrthographicCamera;
    sc.left = -Math.max(4, sz.x);
    sc.right = Math.max(4, sz.x);
    sc.updateProjectionMatrix();
  }

  /** Objetivo de cámara según si está armado o explotado. */
  private encuadre() {
    const t = this.explodeT;
    this.distT = this.fitA.d + (this.fitB.d - this.fitA.d) * t;
    this.tgtT.copy(this.fitA.c).lerp(this.fitB.c, t);
  }

  /** Aplica apertura de puertas/cajones y separación de piezas. */
  private applyPose() {
    const ex = this.explode;
    this.parts.forEach((p) => {
      p.o.position.copy(p.base).addScaledVector(p.off, ex);
      if (p.decor) p.o.visible = ex < 0.05;
    });
    const a = this.open * 1.55;
    this.doors.forEach((d) => (d.p.rotation.y = d.s * a));
    this.drawers.forEach((d) => (d.g.position.z += this.open * d.dz));
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
    const exMoving = Math.abs(this.explodeT - this.explode) > 0.001;
    if (exMoving) this.explode += (this.explodeT - this.explode) * 0.1;
    if (Math.abs(this.openT - this.open) > 0.001) this.open += (this.openT - this.open) * 0.12;
    if (exMoving || Math.abs(this.openT - this.open) > 0.0005) this.applyPose();
    this.encuadre();
    const c = Math.cos(this.pitch);
    this.cam.position.set(
      this.tgt.x + this.dist * c * Math.sin(this.yaw),
      this.tgt.y + this.dist * Math.sin(this.pitch),
      this.tgt.z + this.dist * c * Math.cos(this.yaw),
    );
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
    if (e.pointerType === "mouse")
      this.pitchT = Math.max(
        -0.05,
        Math.min(0.6, this.drag.pitch + (e.clientY - this.drag.y) * 0.005),
      );
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
