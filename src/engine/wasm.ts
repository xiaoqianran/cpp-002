/**
 * WASM 适配：apply / applyPose / renderPass(rows)
 */

export type RayTracerApi = {
  apply: (args: ApplyArgs) => void;
  applyPose: (args: PoseArgs) => void;
  reset: () => void;
  /** rowsBudget: 0=整帧；>0 扫描线预算 */
  renderPass: (spp: number, rowsBudget?: number) => void;
  samples: () => number;
  scanY: () => number;
  primitiveCount: () => number;
  lightCount: () => number;
  width: () => number;
  height: () => number;
  rgba: () => Uint8ClampedArray;
};

export type ApplyArgs = {
  width: number;
  height: number;
  sceneId: number;
  maxDepth: number;
  debugMode: number;
  bvh: boolean;
  nee: boolean;
  mis: boolean;
  rr: boolean;
  lx: number;
  ly: number;
  lz: number;
  ax: number;
  ay: number;
  az: number;
  vfov: number;
  defocus: number;
  focus: number;
  bg: [number, number, number];
};

export type PoseArgs = {
  lx: number;
  ly: number;
  lz: number;
  ax: number;
  ay: number;
  az: number;
  vfov: number;
  defocus: number;
  focus: number;
};

type EmscriptenModule = {
  ccall: (
    name: string,
    returnType: string | null,
    argTypes: string[],
    args: unknown[],
  ) => unknown;
  HEAPU8: Uint8Array;
  _rt_rgba_ptr: () => number;
  _rt_rgba_bytes: () => number;
};

declare global {
  interface Window {
    createRayTracerModule?: (opts?: {
      locateFile?: (path: string) => string;
    }) => Promise<EmscriptenModule>;
  }
}

function assetUrl(path: string): string {
  const base = import.meta.env.BASE_URL || "/";
  const normalizedBase = base.endsWith("/") ? base : `${base}/`;
  return `${normalizedBase}${path.replace(/^\//, "")}`;
}

let loaderPromise: Promise<void> | null = null;

function loadScript(src: string): Promise<void> {
  if (typeof window.createRayTracerModule === "function") return Promise.resolve();
  if (loaderPromise) return loaderPromise;

  loaderPromise = new Promise((resolve, reject) => {
    const s = document.createElement("script");
    s.src = src;
    s.async = true;
    s.onload = () => {
      if (typeof window.createRayTracerModule !== "function") {
        const g = globalThis as unknown as {
          createRayTracerModule?: Window["createRayTracerModule"];
        };
        if (typeof g.createRayTracerModule === "function") {
          window.createRayTracerModule = g.createRayTracerModule;
        }
      }
      if (typeof window.createRayTracerModule !== "function") {
        loaderPromise = null;
        reject(new Error("createRayTracerModule 未找到"));
        return;
      }
      resolve();
    };
    s.onerror = () => {
      loaderPromise = null;
      reject(new Error(`无法加载 ${src}`));
    };
    document.body.appendChild(s);
  });
  return loaderPromise;
}

export async function createRayTracer(): Promise<RayTracerApi> {
  await loadScript(assetUrl("raytracer.js"));
  const factory = window.createRayTracerModule;
  if (!factory) throw new Error("createRayTracerModule 未找到");

  const mod = await factory({ locateFile: (path) => assetUrl(path) });

  const wrap =
    <T extends (...args: never[]) => unknown>(name: string, ret: string | null, args: string[]) =>
    (...a: Parameters<T>): ReturnType<T> =>
      mod.ccall(name, ret, args, a as unknown[]) as ReturnType<T>;

  const nums = (n: number) => Array(n).fill("number") as string[];

  const applyRaw = wrap<
    (
      ...args: [
        number,
        number,
        number,
        number,
        number,
        number,
        number,
        number,
        number,
        number,
        number,
        number,
        number,
        number,
        number,
        number,
        number,
        number,
        number,
        number,
        number,
      ]
    ) => void
  >("rt_apply", null, nums(21));

  const applyPoseRaw = wrap<
    (
      ...args: [
        number,
        number,
        number,
        number,
        number,
        number,
        number,
        number,
        number,
      ]
    ) => void
  >("rt_apply_pose", null, nums(9));

  const renderRaw = wrap<(spp: number, rows: number) => void>("rt_render_pass", null, [
    "number",
    "number",
  ]);

  return {
    apply: (a) =>
      applyRaw(
        a.width,
        a.height,
        a.sceneId,
        a.maxDepth,
        a.debugMode,
        a.bvh ? 1 : 0,
        a.nee ? 1 : 0,
        a.mis ? 1 : 0,
        a.rr ? 1 : 0,
        a.lx,
        a.ly,
        a.lz,
        a.ax,
        a.ay,
        a.az,
        a.vfov,
        a.defocus,
        a.focus,
        a.bg[0],
        a.bg[1],
        a.bg[2],
      ),
    applyPose: (a) =>
      applyPoseRaw(a.lx, a.ly, a.lz, a.ax, a.ay, a.az, a.vfov, a.defocus, a.focus),
    reset: wrap<() => void>("rt_reset", null, []),
    renderPass: (spp, rowsBudget = 0) => renderRaw(spp, rowsBudget),
    samples: wrap<() => number>("rt_samples", "number", []),
    scanY: wrap<() => number>("rt_scan_y", "number", []),
    primitiveCount: wrap<() => number>("rt_primitive_count", "number", []),
    lightCount: wrap<() => number>("rt_light_count", "number", []),
    width: wrap<() => number>("rt_width", "number", []),
    height: wrap<() => number>("rt_height", "number", []),
    rgba: () => {
      const ptr = mod._rt_rgba_ptr();
      const bytes = mod._rt_rgba_bytes();
      return new Uint8ClampedArray(mod.HEAPU8.buffer, ptr, bytes);
    },
  };
}
