// 可命中物体接口 + 命中记录
#pragma once

#include "ray.h"
#include "rt_common.h"
#include <vector>

class material;

// 一次命中：交点、法线、材质、参数 t、是否正面
class hit_record {
public:
  point3 p;
  vec3 normal;
  shared_ptr<material> mat;
  double t;
  bool front_face;

  // 统一把法线翻到「对着入射射线」一侧，并记录是否正面
  void set_face_normal(const ray &r, const vec3 &outward_normal) {
    front_face = dot(r.direction(), outward_normal) < 0;
    normal = front_face ? outward_normal : -outward_normal;
  }
};

// 抽象可命中体
class hittable {
public:
  virtual ~hittable() = default;
  virtual bool hit(const ray &r, interval ray_t, hit_record &rec) const = 0;
};

// 物体列表：世界场景的容器
class hittable_list : public hittable {
public:
  std::vector<shared_ptr<hittable>> objects;

  hittable_list() {}
  hittable_list(shared_ptr<hittable> object) { add(object); }

  void clear() { objects.clear(); }
  void add(shared_ptr<hittable> object) { objects.push_back(object); }

  bool hit(const ray &r, interval ray_t, hit_record &rec) const override {
    hit_record temp_rec;
    bool hit_anything = false;
    auto closest_so_far = ray_t.max;

    for (const auto &object : objects) {
      if (object->hit(r, interval(ray_t.min, closest_so_far), temp_rec)) {
        hit_anything = true;
        closest_so_far = temp_rec.t;
        rec = temp_rec;
      }
    }
    return hit_anything;
  }
};
