import type { Chapter } from "./types";

/**
 * cpp-002 完整课程
 * 对照：GAMES101 L13–L17、Shirley 三部曲、PBRT 核心思想（教学简化）
 */
export const CHAPTERS: Chapter[] = [
  {
    id: "ch00",
    index: 0,
    title: "导论与地图",
    subtitle: "你在学什么 · 和 GAMES101 / Shirley 怎么对应",
    lessons: [
      {
        id: "ch00-map",
        title: "课程地图与能力边界",
        minutes: 8,
        summary: "弄清路径追踪在图形学中的位置，以及本仓库实现了哪些、故意没做哪些。",
        refs: ["GAMES101 L13 光线追踪概述", "Shirley In One Weekend 前言"],
        blocks: [
          {
            type: "p",
            text: "真实感绘制的核心问题：给定三维场景与相机，估计每个像素接收到的辐射亮度 L。光栅化用投影+深度缓冲「画三角形」；光线追踪沿视线反向追光。",
          },
          {
            type: "mermaid",
            title: "两条主线",
            code: `flowchart LR
  subgraph Raster["光栅化 · GAMES101 前半"]
    T[三角形] --> P[投影]
    P --> Z[深度测试]
    Z --> S[着色]
  end
  subgraph RT["光线追踪 · 本仓库"]
    Ray[射线] --> Hit[求交]
    Hit --> Scatter[散射/发光]
    Scatter --> MC[蒙特卡洛积分]
  end`,
          },
          {
            type: "h",
            text: "本仓库已覆盖（教学渲染器主线）",
          },
          {
            type: "ul",
            items: [
              "射线参数方程、球/四边形求交",
              "针孔相机 + 景深光圈 + 像素抖动抗锯齿",
              "朗伯 / 金属 / 介质 / 面发光",
              "路径追踪 + 渐进累加 spp",
              "NEE 下一事件估计、MIS、俄罗斯轮盘",
              "AABB、SAH-BVH、调试视图",
              "C++ → WASM → 浏览器实验台",
            ],
          },
          {
            type: "h",
            text: "有意未做（进阶课/下一部）",
          },
          {
            type: "ul",
            items: [
              "三角网格 / 纹理 / 法线贴图",
              "光谱渲染、体积参与介质",
              "双向路径追踪 / 光子映射 / MLT",
              "GPU（OptiX / DXR / WebGPU）",
            ],
          },
          {
            type: "callout",
            tone: "tip",
            text: "建议学习节奏：左边「完整课程」按章读 → 点「打开本课实验」→ 右侧改参数亲眼看结果。读代码顺序见每课「源码地图」。",
          },
          {
            type: "compare",
            left: {
              title: "GAMES101",
              body: "课堂推导 Whitted 式递归、软影动机、加速结构直觉；作业偏实现片段。",
            },
            right: {
              title: "cpp-002",
              body: "可运行的完整路径追踪器 + 开关（NEE/MIS/BVH）+ 中文对照源码，强调「看见方差从哪来」。",
            },
          },
        ],
      },
      {
        id: "ch00-rendering-eq",
        title: "渲染方程一张图",
        minutes: 10,
        summary: "Kajiya 渲染方程是路径追踪的「圣经公式」——后面所有技巧都是在数值求它。",
        refs: ["GAMES101 L14", "Kajiya 1986", "PBRT §14"],
        blocks: [
          {
            type: "formula",
            title: "渲染方程（出射辐射）",
            latex: `L_o(x, ω_o) = L_e(x, ω_o) + ∫_Ω f_r(x, ω_i, ω_o) L_i(x, ω_i) (n·ω_i) dω_i`,
          },
          {
            type: "ul",
            items: [
              "L_e：自发光（本仓库 diffuse_light）",
              "f_r：BRDF（朗伯 albedo/π，金属近似镜面，玻璃用折射+Schlick）",
              "L_i：入射（递归 = 沿 -ω_i 再追一条路径）",
              "(n·ω_i)：几何余弦项",
            ],
          },
          {
            type: "mermaid",
            title: "代码如何对应方程",
            code: `flowchart TB
  Le["L_e → material.emitted"]
  Fr["f_r → brdf_lambert / scatter"]
  Li["L_i → ray_color 递归"]
  Cos["n·ω → cos_surf"]
  MC["积分 → 蒙特卡洛 / NEE / MIS"]
  Le --> Out[像素颜色]
  Fr --> Out
  Li --> Out
  Cos --> Out
  MC --> Out`,
          },
          {
            type: "map",
            rows: [
              { file: "cpp/camera.h", note: "ray_color_impl ≈ 求解渲染方程" },
              { file: "cpp/material.h", note: "emitted / brdf / scatter" },
              { file: "cpp/quad.h", note: "面光源采样支撑 NEE" },
            ],
          },
          {
            type: "quiz",
            q: "路径追踪对渲染方程的入射积分使用什么方法？",
            options: ["解析闭式解", "蒙特卡洛随机采样估计", "只做一次反射的 Whitted 式", "只靠光栅化插值"],
            answer: 1,
            explain: "半球积分一般无闭式解，用随机方向（及 NEE/MIS）估计期望。",
          },
        ],
        action: { label: "打开康奈尔箱（方程直觉）", sceneId: 3, debugMode: 0, useNee: true, useMis: true },
      },
    ],
  },
  {
    id: "ch01",
    index: 1,
    title: "射线与几何",
    subtitle: "参数直线 · 向量工具",
    lessons: [
      {
        id: "ch01-ray",
        title: "射线：P(t)=O+tD",
        minutes: 8,
        summary: "所有求交都是在解「射线上的点是否落在物体上」。",
        refs: ["GAMES101 L13", "Shirley ch.2–3"],
        blocks: [
          {
            type: "formula",
            title: "参数方程",
            latex: `P(t) = O + t D ,   t > 0`,
          },
          {
            type: "ul",
            items: [
              "O：起点（相机光心，或表面上一点）",
              "D：方向（实现里可不单位化，但很多公式假设单位向量）",
              "t：沿射线前进的参数；最近命中取最小合法 t",
            ],
          },
          {
            type: "code",
            title: "ray.h 概念",
            code: `class ray {
  point3 orig;
  vec3 dir;
  point3 at(double t) const { return orig + t * dir; }
};`,
          },
          {
            type: "map",
            rows: [
              { file: "cpp/ray.h", note: "射线" },
              { file: "cpp/vec3.h", note: "点/方向/颜色共用 vec3" },
              { file: "cpp/interval.h", note: "t 的合法区间 [tmin,tmax]" },
            ],
          },
        ],
        action: { label: "用法线视图看几何", sceneId: 0, debugMode: 1 },
      },
      {
        id: "ch01-sphere",
        title: "球体求交",
        minutes: 12,
        summary: "代入球方程得到关于 t 的二次方程——图形学第一道标准题。",
        refs: ["GAMES101 求交", "Shirley ch.6"],
        blocks: [
          {
            type: "formula",
            title: "球",
            latex: `|O + tD - C|² = r²  →  a t² + 2h t + c = 0`,
          },
          {
            type: "ol",
            items: [
              "判别式 Δ < 0：不相交",
              "Δ ≥ 0：两根，取落在 interval 内的最近根",
              "法线 n = (P-C)/r，再 set_face_normal 翻到朝向入射一侧",
            ],
          },
          {
            type: "mermaid",
            code: `flowchart TB
  R[射线] --> Q[二次方程]
  Q --> D{Δ}
  D -->|负| Miss
  D -->|正| Roots[两根]
  Roots --> Pick[最近合法 t]
  Pick --> N[法线 + 材质]`,
          },
          {
            type: "map",
            rows: [{ file: "cpp/sphere.h", note: "解析求交 + AABB" }],
          },
          {
            type: "callout",
            tone: "warn",
            text: "tmin 取 0.001 而不是 0：避免自交阴影痤疮（shadow acne）。",
          },
        ],
        action: { label: "经典三球 + 深度视图", sceneId: 0, debugMode: 2 },
      },
      {
        id: "ch01-quad",
        title: "四边形 / 面光",
        minutes: 10,
        summary: "康奈尔箱的墙和灯都是 quad：平面求交 + 参数 (α,β)∈[0,1]²。",
        refs: ["Shirley The Next Week ch.6"],
        blocks: [
          {
            type: "formula",
            latex: `P = Q + α u + β v ,  命中需 α,β ∈ [0,1]`,
          },
          {
            type: "ul",
            items: [
              "先与平面求 t，再投影到平面坐标",
              "sample_point()：α,β 均匀随机 → 面光采样",
              "area = |u × v|",
            ],
          },
          {
            type: "map",
            rows: [
              { file: "cpp/quad.h", note: "hit / sample_point / area" },
              { file: "cpp/scenes.h", note: "scene 3 组装箱子" },
            ],
          },
        ],
        action: { label: "康奈尔箱发光体调试", sceneId: 3, debugMode: 3 },
      },
    ],
  },
  {
    id: "ch02",
    index: 2,
    title: "相机与采样",
    subtitle: "针孔 · 景深 · 抗锯齿 · spp",
    lessons: [
      {
        id: "ch02-camera",
        title: "虚拟相机与主射线",
        minutes: 12,
        summary: "从 lookfrom/lookat/vfov 建立正交基底，把像素映射到成像平面上的射线。",
        refs: ["GAMES101 相机", "Shirley ch.11"],
        blocks: [
          {
            type: "ol",
            items: [
              "w = normalize(lookfrom - lookat)（看向 -w）",
              "u = normalize(vup × w)，v = w × u",
              "viewport 高 = 2 tan(vfov/2) * focus_dist",
              "像素中心 + 子像素抖动 → 抗锯齿",
            ],
          },
          {
            type: "mermaid",
            code: `flowchart TB
  Look[lookfrom/lookat] --> Basis[u v w]
  FOV[vfov] --> VP[viewport]
  Basis --> VP
  VP --> Jitter[像素抖动]
  Aperture[光圈] --> Origin[射线起点]
  Jitter --> Ray
  Origin --> Ray`,
          },
          {
            type: "callout",
            tone: "info",
            text: "景深：起点在光圈圆盘随机，对焦平面在 focus_dist。光圈越大虚化越强。",
          },
          {
            type: "map",
            rows: [{ file: "cpp/camera.h", note: "initialize / get_ray" }],
          },
        ],
        action: { label: "玻璃场景看景深", sceneId: 1, debugMode: 0 },
      },
      {
        id: "ch02-spp",
        title: "为什么要很多样本 spp",
        minutes: 10,
        summary: "每个像素是随机路径的平均值；N 越大方差越小，画面越干净。",
        refs: ["蒙特卡洛基础", "Shirley ch.8"],
        blocks: [
          {
            type: "formula",
            latex: `L̂_N = (1/N) Σ_{i=1}^N X_i   ,   Var(L̂_N) ≈ σ²/N`,
          },
          {
            type: "ul",
            items: [
              "X_i：一条完整路径的颜色贡献",
              "渐进渲染：每帧再加 spp，accum 累加后除以 samples_done",
              "状态栏里的 spp 就是 N",
            ],
          },
          {
            type: "callout",
            tone: "tip",
            text: "室内小灯场景方差巨大：同样 N，开 NEE/MIS 比关干净得多——这就是重要性采样的意义。",
          },
        ],
        action: { label: "康奈尔箱对比采样", sceneId: 3, useNee: true, useMis: true },
      },
    ],
  },
  {
    id: "ch03",
    index: 3,
    title: "材质与散射",
    subtitle: "朗伯 · 金属 · 玻璃 · 发光",
    lessons: [
      {
        id: "ch03-lambert",
        title: "朗伯漫反射",
        minutes: 12,
        summary: "理想哑光：BRDF = albedo/π；本仓库用余弦半球采样，权重与 pdf 相消为 albedo。",
        refs: ["GAMES101 着色", "Shirley ch.9"],
        blocks: [
          {
            type: "formula",
            latex: `f_r = ρ/π ,   pdf(ω) = cosθ/π  (余弦采样)  →  权重 ρ`,
          },
          {
            type: "code",
            title: "onb + 余弦方向",
            code: `onb uvw; uvw.build_from_w(rec.normal);
auto dir = uvw.local(random_cosine_direction());
scattered = ray(rec.p, dir);
attenuation = albedo;`,
          },
          {
            type: "map",
            rows: [
              { file: "cpp/material.h", note: "lambertian" },
              { file: "cpp/onb.h", note: "局部坐标系" },
            ],
          },
        ],
        action: { label: "三球场景", sceneId: 0, debugMode: 0 },
      },
      {
        id: "ch03-metal-glass",
        title: "金属与介质",
        minutes: 14,
        summary: "金属：反射 + fuzz；玻璃：Snell 折射 + Schlick 反射概率 + 全反射。",
        refs: ["GAMES101 反射折射", "Shirley ch.10"],
        blocks: [
          {
            type: "formula",
            title: "反射",
            latex: `R = V - 2 (V·N) N`,
          },
          {
            type: "formula",
            title: "Schlick 近似",
            latex: `R(θ) ≈ R0 + (1-R0)(1-cosθ)⁵`,
          },
          {
            type: "ul",
            items: [
              "空心玻璃 = 外球 η=1.5 + 内球 η=1/1.5（气泡场景）",
              "fuzz：反射方向加随机扰动，模糊高光",
              "金属/玻璃不做 NEE（高光 BRDF 应用专用采样，教学版从略）",
            ],
          },
        ],
        action: { label: "玻璃气泡场景", sceneId: 1 },
      },
      {
        id: "ch03-light",
        title: "自发光材质",
        minutes: 8,
        summary: "diffuse_light 不散射，只返回 emit；是 L_e 项。",
        refs: ["Shirley The Rest of Your Life ch.4"],
        blocks: [
          {
            type: "code",
            code: `class diffuse_light {
  color emitted(...) { return emit; }
  // scatter 默认 false
};`,
          },
          {
            type: "callout",
            tone: "info",
            text: "调试视图「发光体」只显示 emitted，用来确认灯几何是否朝向房间。",
          },
        ],
        action: { label: "只看灯", sceneId: 3, debugMode: 3 },
      },
    ],
  },
  {
    id: "ch04",
    index: 4,
    title: "路径追踪核心",
    subtitle: "递归 · 背景 · 间接光",
    lessons: [
      {
        id: "ch04-path",
        title: "从 Whitted 到 Path Tracing",
        minutes: 15,
        summary: "Whitted：镜面/折射确定性递归；Path Tracing：每步随机选方向，用多条路径平均。",
        refs: ["GAMES101 L14–15", "Kajiya"],
        blocks: [
          {
            type: "compare",
            left: {
              title: "Whitted 风格",
              body: "漫反射一次；镜面/折射沿反射折射方向继续。软影与漫反射间接光弱。",
            },
            right: {
              title: "路径追踪（本仓库）",
              body: "每步 scatter 随机方向；多次反弹自然产生间接光与染色（红墙染白球）。",
            },
          },
          {
            type: "code",
            title: "骨架",
            code: `color ray_color(ray r, depth):
  if depth==0: return 0
  if !hit: return background
  if light: return emit (或 MIS)
  if scatter:
    L = NEE(...)           // 可选
    L += att * ray_color(scattered)
    return L`,
          },
          {
            type: "map",
            rows: [{ file: "cpp/camera.h", note: "ray_color_impl" }],
          },
        ],
        action: { label: "看间接染色", sceneId: 3, debugMode: 0, useNee: true, maxDepth: 50 },
      },
      {
        id: "ch04-cornell",
        title: "康奈尔箱实验",
        minutes: 10,
        summary: "经典对照场景：封闭盒子 + 面光 + 红绿墙，检验间接光与能量。",
        refs: ["Cornell Box 历史", "GAMES101 示例"],
        blocks: [
          {
            type: "ul",
            items: [
              "背景必须是黑（无天空漏光）",
              "红墙/绿墙 → 地面与白球染色",
              "深度要够（默认 50）否则偏暗",
            ],
          },
          {
            type: "callout",
            tone: "tip",
            text: "先开「发光体」确认灯，再开「法线」确认墙朝内，最后回美观模式长时间采样。",
          },
        ],
        action: { label: "康奈尔箱全开", sceneId: 3, useNee: true, useMis: true, useRr: true },
      },
    ],
  },
  {
    id: "ch05",
    index: 5,
    title: "重要性采样全家桶",
    subtitle: "NEE · MIS · 俄罗斯轮盘",
    lessons: [
      {
        id: "ch05-nee",
        title: "NEE 下一事件估计",
        minutes: 15,
        summary: "小灯难被随机方向碰到 → 主动在灯面上采点，阴影射线测可见。",
        refs: ["Shirley Rest of Your Life ch.6", "PBRT 直接光"],
        blocks: [
          {
            type: "formula",
            latex: `L_direct = (ρ/π) L_e cosθ_s / pdf_ω
pdf_ω = (1/(N A)) · r² / cosθ_L`,
          },
          {
            type: "mermaid",
            code: `flowchart LR
  X[着色点] --> P[灯面随机点]
  P --> Shadow{遮挡?}
  Shadow -->|否| Add[加直接光]
  Shadow -->|是| Z[0]`,
          },
          {
            type: "callout",
            tone: "warn",
            text: "双重计数：开 NEE 后，间接路径撞灯不再加 emit（除非 MIS 加权）。相机射线直视灯仍要亮。",
          },
          {
            type: "map",
            rows: [{ file: "cpp/camera.h", note: "sample_direct_light" }],
          },
        ],
        action: { label: "NEE 开", sceneId: 3, useNee: true, useMis: false },
      },
      {
        id: "ch05-mis",
        title: "MIS 多重重要性采样",
        minutes: 15,
        summary: "NEE 与 BSDF 都能估计直接光；用平衡启发按 pdf 加权，方差更低。",
        refs: ["Veach MIS", "PBRT §13.10", "GAMES101 提及"],
        blocks: [
          {
            type: "formula",
            latex: `w(p,q) = p² / (p² + q²)   (balance heuristic 的 power 形式常用 β=2)`,
          },
          {
            type: "ul",
            items: [
              "NEE 贡献 × w(pdf_light, pdf_bsdf)",
              "BSDF 撞灯 × w(pdf_bsdf, pdf_light)",
              "某一策略 pdf→0 时权重自动交给另一策略",
            ],
          },
          {
            type: "quiz",
            q: "MIS 的主要目的是？",
            options: ["提高分辨率", "合并多种采样策略降低方差", "替代 BVH", "只用于金属"],
            answer: 1,
            explain: "无偏地组合策略，在各种光照配置下都更稳。",
          },
        ],
        action: { label: "NEE+MIS", sceneId: 3, useNee: true, useMis: true },
      },
      {
        id: "ch05-rr",
        title: "俄罗斯轮盘",
        minutes: 8,
        summary: "深路径贡献期望小：随机终止并重加权，保持无偏、节省算力。",
        refs: ["Arvo/Kirk", "PBRT 路径终止"],
        blocks: [
          {
            type: "formula",
            latex: `p = clamp(max(ρ), 0.05, 0.95)
若 ξ>p → 终止；否则 ρ ← ρ/p 并继续`,
          },
          {
            type: "callout",
            tone: "info",
            text: "本仓库在 bounce≥3 后启用。关 RR 更「老实」但更慢。",
          },
        ],
        action: { label: "RR 开", sceneId: 3, useRr: true },
      },
    ],
  },
  {
    id: "ch06",
    index: 6,
    title: "加速结构",
    subtitle: "AABB · BVH · SAH",
    lessons: [
      {
        id: "ch06-aabb",
        title: "AABB 与 slab 法",
        minutes: 10,
        summary: "盒子便宜：先测盒子再测真几何。",
        refs: ["GAMES101 L16", "Shirley Next Week ch.3"],
        blocks: [
          {
            type: "p",
            text: "射线与轴对齐盒子：对 x/y/z 三个区间做 slab 裁剪，ray_t 区间空则 miss。",
          },
          {
            type: "map",
            rows: [{ file: "cpp/aabb.h", note: "hit(ray, interval)" }],
          },
        ],
        action: { label: "多球场景", sceneId: 4, useBvh: true },
      },
      {
        id: "ch06-bvh",
        title: "BVH 与 SAH",
        minutes: 15,
        summary: "层次盒子：miss 则剪整枝。SAH 用表面积×物体数估计划分代价。",
        refs: ["GAMES101 加速", "Wald SAH", "Shirley Next Week"],
        blocks: [
          {
            type: "formula",
            latex: `Cost ≈ C_trav + (A_L N_L + A_R N_R) / A_parent`,
          },
          {
            type: "ul",
            items: [
              "构建：按轴排序，12 桶扫描找最低代价 mid",
              "查询：先 bbox，再左右子（近的可先测缩 tmax）",
              "超大地面球会毁掉剪枝 → 场景 4 用有限地面",
            ],
          },
          {
            type: "callout",
            tone: "tip",
            text: "在「随机多球」开关 BVH，看状态栏 ms：暴力 O(n) vs 约 O(log n)。",
          },
          {
            type: "map",
            rows: [{ file: "cpp/bvh.h", note: "SAH build + hit" }],
          },
        ],
        action: { label: "多球测 BVH", sceneId: 4, useBvh: true },
      },
    ],
  },
  {
    id: "ch07",
    index: 7,
    title: "色彩与输出",
    subtitle: "线性工作流 · Gamma",
    lessons: [
      {
        id: "ch07-gamma",
        title: "为什么要 Gamma",
        minutes: 8,
        summary: "物理在线性空间算；显示器近似 gamma 2.2。写入像素前做开方近似。",
        refs: ["GAMES101 颜色", "Shirley ch.7"],
        blocks: [
          {
            type: "formula",
            latex: `displayed ≈ √linear   (γ≈2 的粗近似)`,
          },
          {
            type: "map",
            rows: [
              { file: "cpp/color.h", note: "linear_to_gamma / write_color_rgba" },
              { file: "cpp/renderer.h", note: "accum 均值后 bake" },
            ],
          },
        ],
      },
    ],
  },
  {
    id: "ch08",
    index: 8,
    title: "工程与调试",
    subtitle: "WASM · 实验台 · 方法论",
    lessons: [
      {
        id: "ch08-wasm",
        title: "C++ 如何跑在网页里",
        minutes: 10,
        summary: "emcc 把渲染器编成 WASM；npm 只打包网页壳。",
        refs: ["Emscripten 文档"],
        blocks: [
          {
            type: "mermaid",
            code: `flowchart LR
  CPP[cpp/] -->|emcc| WASM[raytracer.wasm]
  WASM --> TS[raytracer.ts]
  TS --> UI[React 实验台]
  UI -->|rt_render_pass| WASM`,
          },
          {
            type: "map",
            rows: [
              { file: "cpp/wasm_bridge.cpp", note: "C API 导出" },
              { file: "src/lib/raytracer.ts", note: "JS 桥" },
              { file: "cpp/Makefile", note: "make wasm" },
            ],
          },
        ],
      },
      {
        id: "ch08-debug",
        title: "调试视图方法论",
        minutes: 8,
        summary: "黑图先看法线/深度/发光，再怀疑积分。",
        refs: ["工业调试习惯"],
        blocks: [
          {
            type: "ol",
            items: [
              "发光体：灯是否存在、朝向",
              "法线：墙是否朝内、球是否正确",
              "深度：相机是否在盒子里",
              "美观：再开 NEE/MIS 与 spp",
            ],
          },
        ],
        action: { label: "法线调试", sceneId: 3, debugMode: 1 },
      },
      {
        id: "ch08-controls",
        title: "轨道控制符号",
        minutes: 5,
        summary: "左右：抓住场景同向；上下：pitch 与 dy 同号。",
        refs: ["本仓库 controls 校准"],
        blocks: [
          {
            type: "code",
            code: `yaw   -= dx * sens   // 右拖场景右转
pitch += dy * sens   // 下拖俯仰`,
          },
        ],
      },
    ],
  },
  {
    id: "ch09",
    index: 9,
    title: "练习与进阶",
    subtitle: "作业清单 · 扩展路线",
    lessons: [
      {
        id: "ch09-exercises",
        title: "建议练习（由易到难）",
        minutes: 5,
        summary: "不会自动批改，但每项都能在实验台或源码里验证。",
        refs: ["GAMES101 作业精神", "Shirley 章末"],
        blocks: [
          {
            type: "ol",
            items: [
              "改天空色，观察户外场景氛围变化",
              "把灯亮度从 15 改成 5，比较 NEE 开关",
              "多球场景记录 BVH 开/关 ms",
              "实现第二个面光（双灯）并观察 MIS",
              "给 lambertian 加棋盘纹理（UV）",
              "阅读并实现简单三角 mesh + BVH",
            ],
          },
          {
            type: "callout",
            tone: "tip",
            text: "进阶阅读：PBRT 在线版、Veach 论文、GAMES202 实时引擎。",
          },
        ],
      },
      {
        id: "ch09-glossary",
        title: "术语表",
        minutes: 6,
        summary: "中英对照，考试/论文用。",
        refs: [],
        blocks: [
          {
            type: "ul",
            items: [
              "Radiance 辐射亮度 L",
              "BRDF 双向反射分布函数",
              "Path Tracing 路径追踪",
              "NEE Next Event Estimation",
              "MIS Multiple Importance Sampling",
              "BVH Bounding Volume Hierarchy",
              "SAH Surface Area Heuristic",
              "Russian Roulette 俄罗斯轮盘",
              "spp samples per pixel",
              "Albedo 反照率 ρ",
            ],
          },
        ],
      },
    ],
  },
];

export function allLessons() {
  return CHAPTERS.flatMap((c) => c.lessons.map((l) => ({ chapter: c, lesson: l })));
}

export function findLesson(id: string) {
  for (const c of CHAPTERS) {
    const l = c.lessons.find((x) => x.id === id);
    if (l) return { chapter: c, lesson: l };
  }
  return null;
}
