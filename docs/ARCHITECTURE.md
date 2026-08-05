# 架构深潜（简体中文）

本文用 Mermaid 把 **cpp-002** 的每条数据路径画清楚，方便对照 `cpp/` 源码阅读。

---

## 1. 从 UI 到像素的完整链路

```mermaid
flowchart TB
  subgraph Browser
    User[用户拖拽/调参]
    RAF[requestAnimationFrame]
    Canvas[Canvas 2D ImageData]
  end

  subgraph TS["src/lib/raytracer.ts"]
    CCall[Module.ccall / cwrap]
    HEAP[HEAPU8 视图]
  end

  subgraph CPP["C++ WASM"]
    RT[renderer]
    CAM[camera]
    WORLD[hittable_list]
    MAT[material]
    ACC[float RGB accum]
    RGBA[uint8 RGBA]
  end

  User --> CCall
  RAF --> CCall
  CCall -->|rt_render_pass| RT
  RT --> CAM
  CAM --> WORLD
  WORLD --> MAT
  MAT --> CAM
  RT --> ACC
  ACC --> RGBA
  RGBA --> HEAP
  HEAP --> Canvas
```

---

## 2. `ray_color` 状态机

```mermaid
stateDiagram-v2
  [*] --> CheckDepth
  CheckDepth --> ReturnBlack: depth <= 0
  CheckDepth --> TraceWorld: depth > 0
  TraceWorld --> Sky: 未命中
  TraceWorld --> Scatter: 命中物体
  Scatter --> ReturnBlack: 材质吸收
  Scatter --> CheckDepth: 发出 scattered 射线 depth-1
  Sky --> [*]
  ReturnBlack --> [*]
```

对应代码：`cpp/camera.h` → `camera::ray_color`。

---

## 3. 球求交几何

```mermaid
flowchart LR
  O[射线原点 O] --> OC[oc = C - O]
  D[方向 D] --> A["a = D·D"]
  OC --> H["h = D·oc"]
  OC --> Cterm["c = oc·oc - r²"]
  A --> Disc["Δ = h² - a·c"]
  H --> Disc
  Cterm --> Disc
  Disc -->|Δ < 0| Miss[未命中]
  Disc -->|Δ ≥ 0| Roots["t = (h ± √Δ) / a"]
  Roots --> Pick[取 ray_t 内最近根]
```

对应代码：`cpp/sphere.h`。

---

## 4. 材质分支

```mermaid
flowchart TB
  Hit[hit_record] --> M{动态类型}
  M -->|lambertian| L["scattered = N + random_unit\nattenuation = albedo"]
  M -->|metal| Me["reflected + fuzz * random\n需在法线同侧"]
  M -->|dielectric| D{全反射或 Schlick?}
  D -->|是| Refl[reflect]
  D -->|否| Refr[refract]
```

对应代码：`cpp/material.h`。

---

## 5. 相机成像平面

```mermaid
flowchart TB
  Look[lookfrom / lookat / vup] --> Basis[正交基 u,v,w]
  FOV[vfov + focus_dist] --> VP[viewport 宽高]
  Basis --> VP
  VP --> Pixel00[pixel00_loc]
  VP --> Delta[pixel_delta_u/v]
  Pixel00 --> Sample[像素中心 + 单位方块抖动]
  Defocus[defocus_angle] --> Disk[光圈圆盘采样]
  Sample --> Ray[ray origin→sample]
  Disk --> Ray
```

对应代码：`cpp/camera.h` → `initialize` / `get_ray`。

---

## 6. 渐进累加

设像素颜色估计为随机变量 \(X_i\)，则：

\[
\hat{L}_N = \frac{1}{N}\sum_{i=1}^{N} X_i
\]

实现上我们在 `accum` 里存 \(\sum X_i\)，显示时除以 `samples_done`。  
每调用一次 `render_pass(spp)`，\(N \mathrel{+}= spp\)。

```mermaid
sequenceDiagram
  participant JS
  participant R as renderer
  Note over JS,R: pass 1 spp=1 → 噪点大
  JS->>R: render_pass(1)
  R-->>JS: samples=1
  Note over JS,R: pass 50 → 明显干净
  JS->>R: render_pass(1) × 49
  R-->>JS: samples=50
```

---

## 7. WASM 导出表

| C 符号 | 作用 |
| --- | --- |
| `rt_init(w,h,scene)` | 分配缓冲、建场景、重置相机 |
| `rt_set_camera(...)` | 更新相机并清空累加 |
| `rt_set_scene(id)` | 切换场景 |
| `rt_set_max_depth(d)` | 最大反弹 |
| `rt_render_pass(spp)` | 再采样 spp 次 |
| `rt_rgba_ptr` | RGBA8 指针（HEAP 偏移） |
| `rt_samples` | 当前累计样本数 |

---

## 8. 下一步可以做什么

- BVH 加速大量球体
- 纹理 / 棋盘地面
- 四边形光源与重要性采样
- OpenMP / SIMD 或 WebWorker 多实例并行

每加一块，建议先画一张 Mermaid，再写对应 C++ 头文件。
