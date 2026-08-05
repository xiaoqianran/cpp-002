# 架构

## 两层收口后

```mermaid
flowchart TB
  subgraph app["前端"]
    Cfg["EngineConfig"]
    Hook["useEngine / applyConfig"]
  end
  subgraph cpp["C++"]
    E["engine"]
    Cam["camera 只出射线"]
    PT["path_tracer 积分"]
    Film["accum film"]
    Scene["scenes + bvh"]
  end
  Cfg --> Hook --> E
  E --> Cam
  E --> PT
  E --> Film
  E --> Scene
```

## C++ 职责

| 模块 | 职责 |
|------|------|
| `config.h` | EngineConfig / CameraPose / TraceFlags |
| `camera.h` | get_ray only |
| `path_tracer.h` | 渲染方程 · NEE · MIS · RR · debug |
| `engine.h` | 编排 + film + 兼容旧 setter |
| `scenes.h` | 几何与 lights |
| `wasm_bridge.cpp` | C API → engine |

## 前端

| 模块 | 职责 |
|------|------|
| `engine/types.ts` | 唯一 Config |
| `engine/useEngine.ts` | 投影 + rAF |
| `lab/*` | UI |
| `App.tsx` | 壳 |

## 同步

- 重建：scene / res / flags / depth / debug → `applyConfig`
- 相机：orbit / fov / defocus → `applyCameraOnly` → `engine.set_pose`
