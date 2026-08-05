# 架构深潜（简体中文）

本文用 Mermaid 把 **cpp-002** 的每条数据路径画清楚。

---

## 1. 渲染链路

```mermaid
flowchart TB
  UI[React UI] -->|rt_render_pass| RT[renderer]
  RT --> CAM[camera::ray_color]
  CAM --> ROOT[scene_root]
  ROOT -->|use_bvh| BVH[bvh_node]
  ROOT -->|关闭| LIST[hittable_list 暴力]
  BVH --> PRIM[sphere / quad]
  LIST --> PRIM
```

---

## 2. 含自发光的着色

```mermaid
flowchart TB
  Hit --> Emit[emitted]
  Emit --> Sc{scatter?}
  Sc -->|否| OutE[return emit]
  Sc -->|是| OutR[emit + att * recursive]
```

---

## 3. BVH

### 构建

```mermaid
flowchart TB
  Objs[物体列表] --> Box[算整体 AABB]
  Box --> Axis[选最长轴]
  Axis --> Sort[按该轴排序]
  Sort --> Split[对半切]
  Split --> L[左 bvh_node]
  Split --> R[右 bvh_node]
  L --> Parent[父 bbox = 并集]
  R --> Parent
```

### 查询

```mermaid
flowchart TB
  Ray[射线] --> N{vs 节点 AABB}
  N -->|miss| Skip[剪枝]
  N -->|hit| Kids[测左右子树]
  Kids --> Leaf[叶子: 真实几何]
```

复杂度直觉：暴力 \(O(n)\) 次物体测试；平衡 BVH 约 \(O(\log n)\)。

源码：`aabb.h`、`bvh.h`、`renderer.h`（`use_bvh`）。

---

## 4. 场景

| id | 内容 |
|----|------|
| 0 | 经典三球 |
| 1 | 玻璃气泡 |
| 2 | 金属走廊 |
| 3 | 康奈尔箱 + 面光 |
| 4 | 随机多球（BVH 测试） |

---

## 5. WASM API（节选）

| 符号 | 作用 |
|------|------|
| `rt_set_use_bvh` | 开关 BVH |
| `rt_primitive_count` | 图元数量 |
| `rt_set_debug_mode` | 0..3 调试 |
| `rt_set_scene` | 0..4 场景 |

---

## 6. 下一步

- 面光重要性采样（降噪）
- SAH 划分 BVH（更快构建质量）
- 三角 mesh
