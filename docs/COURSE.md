# cpp-002 完整课程大纲

> 对照 **GAMES101**（光线追踪章节）、**Peter Shirley 三部曲**、**PBRT** 核心思想，面向可运行的教学路径追踪器。

在线实验台顶部切换 **「完整课程」** 即可交互阅读；每课可 **打开本课实验** 同步场景/开关。

---

## 章节一览

| 章 | 主题 | 对应经典 |
|----|------|----------|
| 0 | 导论与渲染方程 | GAMES101 L13–14, Kajiya |
| 1 | 射线与几何求交 | GAMES101, Shirley W1 |
| 2 | 相机与 spp | Shirley ch.11, 蒙特卡洛 |
| 3 | 材质 BRDF | GAMES101 着色, Shirley W1 |
| 4 | 路径追踪与康奈尔箱 | GAMES101 L14–15 |
| 5 | NEE / MIS / RR | Shirley Rest, Veach, PBRT |
| 6 | AABB / SAH-BVH | GAMES101 L16, Shirley Next |
| 7 | Gamma 与色彩 | Shirley ch.7 |
| 8 | WASM 工程与调试 | 实践 |
| 9 | 练习与术语表 | 作业路线 |

---

## 推荐 8 小时路径

1. 第 0–1 章 + 法线/深度调试（1.5h）  
2. 第 2–3 章 + 三球/玻璃场景（1.5h）  
3. 第 4 章康奈尔箱长时间采样（1.5h）  
4. 第 5 章开关 NEE/MIS 对比噪点（2h）  
5. 第 6 章多球 BVH ms 对比（1h）  
6. 第 8–9 章工程与练习（0.5h+）  

---

## 源码阅读顺序

```
vec3.h → ray.h → sphere.h → material.h → camera.h(get_ray)
  → camera.h(ray_color) → quad.h → scenes.h
  → camera.h(NEE/MIS/RR) → aabb.h → bvh.h
  → renderer.h → wasm_bridge.cpp → src/lib/raytracer.ts
```

---

## 能力清单（教学渲染器）

- [x] 路径追踪 + 渐进 spp  
- [x] 朗伯余弦采样 / 金属 / 玻璃 / 面光  
- [x] 康奈尔箱间接染色  
- [x] NEE + MIS + 俄罗斯轮盘  
- [x] SAH-BVH + 可关对比  
- [x] 调试视图：法线 / 深度 / 发光  
- [x] 完整中文章节 + Mermaid + 自测 + 实验联动  
- [ ] 三角 mesh / 纹理（扩展）  
- [ ] 双向路径 / 体积光（扩展）  

详见交互课程 UI 与 [ARCHITECTURE.md](./ARCHITECTURE.md)。
