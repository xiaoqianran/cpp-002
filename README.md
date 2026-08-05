# cpp-002 · C++ 光线追踪学习器

C++ 路径追踪 → Emscripten WASM → 浏览器渐进渲染。中文课程对照 GAMES101 / Shirley / PBRT。

- 仓库：https://github.com/xiaoqianran/cpp-002  
- 演示：https://xiaoqianran.github.io/cpp-002/

## 系列定位

**cpp-002** 已讲完「光线怎么积出正确能量」。

下一课 **[cpp-003](https://github.com/xiaoqianran/cpp-003)** 讲：真实资产怎么进场景、怎么被 BVH 加速、怎么贴上细节——仍是路径追踪，但内容从「球和墙」升级到「能放下一个模型」。

---

## 架构（三刀后）

```text
UI → EngineConfig → rt_apply / rt_apply_pose → engine
                         camera · path_tracer · film · scene
```

| 层 | 路径 |
|----|------|
| 壳 | `src/App.tsx` |
| 配置/引擎钩子 | `src/engine/*` |
| 实验台 UI | `src/lab/*` |
| 课程 | `src/curriculum/*` + `src/components/Curriculum.tsx` |
| C++ 内核 | `cpp/`（见 `cpp/README.md`） |

详情：[docs/ARCHITECTURE.md](./docs/ARCHITECTURE.md) · 课程大纲：[docs/COURSE.md](./docs/COURSE.md)

## 能力

- 朗伯 / 金属 / 玻璃 / 面光 · 康奈尔箱  
- NEE · MIS · 俄罗斯轮盘 · SAH-BVH  
- 调试：法线 / 深度 / 发光体  
- **扫描线渐进 + 自适应行预算**（拖拽更跟手）  
- 10 章完整课程（可一键跳转实验）

## 命令

```bash
npm run dev          # 预览 0.0.0.0:8080
npm run build:wasm   # 编译 public/raytracer.*
npm run build        # 生产静态站
npm run build:cli    # bin/raytracer_cli
```

推送 `main` → GitHub Actions → Pages（`BASE_PATH=/cpp-002/`）。
