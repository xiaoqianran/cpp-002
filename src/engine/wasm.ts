/**
 * WASM 适配层：唯一知道 emscripten ccall 的地方
 */

export type RayTracerApi = {
  init: (width: number, height: number, sceneId: number) => void;
  setCamera: (
    lx: number,
    ly: number,
    lz: number,
    ax: number,
    ay: number,
    az: number,
    vfov: number,
    defocus: number,
    focus: number,
  ) => void;
  setMaxDepth: (depth: number) => void;
  setDebugMode: (mode: number) => void;
  setUseBvh: (enabled: boolean) => void;
  setUseNee: (enabled: boolean) => void;
  setUseMis: (enabled: boolean) => void;
  setUseRr: (enabled: boolean) => void;
  reset: () => void;
  renderPass: (spp: number) => void;
  samples: () => number;
  primitiveCount: () => number;
  lightCount: () => number;
  width: () => number;
  height: () => number;
  rgba: () => Uint8ClampedArray;
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

  const setUseBvhRaw = wrap<(e: number) => void>("rt_set_use_bvh", null, ["number"]);
  const setUseNeeRaw = wrap<(e: number) => void>("rt_set_use_nee", null, ["number"]);
  const setUseMisRaw = wrap<(e: number) => void>("rt_set_use_mis", null, ["number"]);
  const setUseRrRaw = wrap<(e: number) => void>("rt_set_use_rr", null, ["number"]);

  return {
    init: wrap<(w: number, h: number, s: number) => void>("rt_init", null, [
      "number",
      "number",
      "number",
    ]),
    setCamera: wrap<
      (
        lx: number,
        ly: number,
        lz: number,
        ax: number,
        ay: number,
        az: number,
        vfov: number,
        defocus: number,
        focus: number,
      ) => void
    >("rt_set_camera", null, [
      "number",
      "number",
      "number",
      "number",
      "number",
      "number",
      "number",
      "number",
      "number",
    ]),
    setMaxDepth: wrap<(d: number) => void>("rt_set_max_depth", null, ["number"]),
    setDebugMode: wrap<(m: number) => void>("rt_set_debug_mode", null, ["number"]),
    setUseBvh: (e) => setUseBvhRaw(e ? 1 : 0),
    setUseNee: (e) => setUseNeeRaw(e ? 1 : 0),
    setUseMis: (e) => setUseMisRaw(e ? 1 : 0),
    setUseRr: (e) => setUseRrRaw(e ? 1 : 0),
    reset: wrap<() => void>("rt_reset", null, []),
    renderPass: wrap<(spp: number) => void>("rt_render_pass", null, ["number"]),
    samples: wrap<() => number>("rt_samples", "number", []),
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
