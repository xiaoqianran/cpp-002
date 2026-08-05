# C++ 内核

Header-only 教学路径追踪。入口两个：`make wasm` / `make cli`。

## 读代码顺序

```text
config.h         EngineConfig
math: vec3 ray interval aabb onb color rt_common
geo:  hittable sphere quad bvh
mat:  material
scene: scenes
camera.h         只出射线
path_tracer.h    NEE / MIS / RR
engine.h         apply / apply_pose / film
wasm_bridge.cpp  rt_apply · rt_apply_pose
main_cli.cpp
```

（文件扁平放在 `cpp/` 根下，避免 include 路径碎片；逻辑分层见文件名。）

## 主 API

```c
rt_apply(...完整配置 21 参数...);
rt_apply_pose(...相机 9 参数...);
rt_render_pass(spp);
rt_rgba_ptr / rt_samples / rt_primitive_count / ...
```

前端只应调用 `rt_apply` / `rt_apply_pose`。旧 `rt_set_*` 仍导出兼容。
