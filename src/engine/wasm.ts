/**
 * WASM 适配：主路径 applyConfigPacked
 */

import { CONFIG_PACK_SIZE } from "./pack";

export type RayTracerApi = {
  applyConfigPacked: (packed: Float64Array, mode: 0 | 1) => void;
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
  _malloc: (n: number) => number;
  _free: (p: number) => void;
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

  const applyRaw = wrap<(ptr: number, n: number, mode: number) => void>(
    "rt_apply_config",
    null,
    ["number", "number", "number"],
  );

  return {
    applyConfigPacked: (packed: Float64Array, mode: 0 | 1) => {
      if (packed.length < CONFIG_PACK_SIZE) {
        throw new Error(`config pack 长度 ${packed.length} < ${CONFIG_PACK_SIZE}`);
      }
      const nbytes = CONFIG_PACK_SIZE * 8;
      const ptr = mod._malloc(nbytes);
      if (!ptr) throw new Error("WASM malloc 失败");
      try {
        // 经 HEAPU8 写入，避免 HEAPF64 视图对齐/过期问题
        const bytes = new Uint8Array(packed.buffer, packed.byteOffset, nbytes);
        mod.HEAPU8.set(bytes, ptr);
        applyRaw(ptr, CONFIG_PACK_SIZE, mode);
      } finally {
        mod._free(ptr);
      }
    },
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
      if (bytes <= 0) return new Uint8ClampedArray(0);
      // 内存增长后需从当前 buffer 切片
      return new Uint8ClampedArray(mod.HEAPU8.buffer, ptr, bytes);
    },
  };
}
