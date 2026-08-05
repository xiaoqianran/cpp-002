/**
 * C++ WASM 光线追踪桥接层
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
  setScene: (sceneId: number) => void;
  setMaxDepth: (depth: number) => void;
  setDebugMode: (mode: number) => void;
  setUseBvh: (enabled: boolean) => void;
  setUseNee: (enabled: boolean) => void;
  setUseMis: (enabled: boolean) => void;
  setUseRr: (enabled: boolean) => void;
  reset: () => void;
  renderPass: (spp: number) => void;
  width: () => number;
  height: () => number;
  samples: () => number;
  useBvh: () => number;
  useNee: () => number;
  useMis: () => number;
  useRr: () => number;
  primitiveCount: () => number;
  lightCount: () => number;
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
  const normalizedPath = path.replace(/^\//, "");
  return `${normalizedBase}${normalizedPath}`;
}

let loaderPromise: Promise<void> | null = null;

function loadScript(src: string): Promise<void> {
  if (typeof window.createRayTracerModule === "function") {
    return Promise.resolve();
  }
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
        reject(new Error("createRayTracerModule 未找到，请确认 public/raytracer.js 已编译"));
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
  const jsUrl = assetUrl("raytracer.js");
  await loadScript(jsUrl);
  const factory = window.createRayTracerModule;
  if (!factory) {
    throw new Error("createRayTracerModule 未找到，请确认 public/raytracer.js 已编译");
  }

  const mod = await factory({
    locateFile: (path) => assetUrl(path),
  });

  const wrap =
    <T extends (...args: never[]) => unknown>(name: string, ret: string | null, args: string[]) =>
    (...a: Parameters<T>): ReturnType<T> =>
      mod.ccall(name, ret, args, a as unknown[]) as ReturnType<T>;

  const init = wrap<(w: number, h: number, s: number) => void>("rt_init", null, [
    "number",
    "number",
    "number",
  ]);
  const setCamera = wrap<
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
  ]);
  const setScene = wrap<(id: number) => void>("rt_set_scene", null, ["number"]);
  const setMaxDepth = wrap<(d: number) => void>("rt_set_max_depth", null, ["number"]);
  const setDebugMode = wrap<(m: number) => void>("rt_set_debug_mode", null, ["number"]);
  const setUseBvhRaw = wrap<(e: number) => void>("rt_set_use_bvh", null, ["number"]);
  const setUseNeeRaw = wrap<(e: number) => void>("rt_set_use_nee", null, ["number"]);
  const setUseMisRaw = wrap<(e: number) => void>("rt_set_use_mis", null, ["number"]);
  const setUseRrRaw = wrap<(e: number) => void>("rt_set_use_rr", null, ["number"]);
  const reset = wrap<() => void>("rt_reset", null, []);
  const renderPass = wrap<(spp: number) => void>("rt_render_pass", null, ["number"]);
  const width = wrap<() => number>("rt_width", "number", []);
  const height = wrap<() => number>("rt_height", "number", []);
  const samples = wrap<() => number>("rt_samples", "number", []);
  const useBvh = wrap<() => number>("rt_use_bvh", "number", []);
  const useNee = wrap<() => number>("rt_use_nee", "number", []);
  const useMis = wrap<() => number>("rt_use_mis", "number", []);
  const useRr = wrap<() => number>("rt_use_rr", "number", []);
  const primitiveCount = wrap<() => number>("rt_primitive_count", "number", []);
  const lightCount = wrap<() => number>("rt_light_count", "number", []);

  return {
    init,
    setCamera,
    setScene,
    setMaxDepth,
    setDebugMode,
    setUseBvh: (enabled: boolean) => setUseBvhRaw(enabled ? 1 : 0),
    setUseNee: (enabled: boolean) => setUseNeeRaw(enabled ? 1 : 0),
    setUseMis: (enabled: boolean) => setUseMisRaw(enabled ? 1 : 0),
    setUseRr: (enabled: boolean) => setUseRrRaw(enabled ? 1 : 0),
    reset,
    renderPass,
    width,
    height,
    samples,
    useBvh,
    useNee,
    useMis,
    useRr,
    primitiveCount,
    lightCount,
    rgba: () => {
      const ptr = mod._rt_rgba_ptr();
      const bytes = mod._rt_rgba_bytes();
      return new Uint8ClampedArray(mod.HEAPU8.buffer, ptr, bytes);
    },
  };
}
