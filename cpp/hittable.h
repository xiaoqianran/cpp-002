// 可命中物体接口 + 命中记录 + 列表
#pragma once

#include "aabb.h"
#include "ray.h"
#include "rt_common.h"
#include <vector>

class material;

class hit_record {
public:
  point3 p;
  vec3 normal;
  shared_ptr<material> mat;
  double t;
  bool front_face;

  void set_face_normal(const ray &r, const vec3 &outward_normal) {
    front_face = dot(r.direction(), outward_normal) < 0;
    normal = front_face ? outward_normal : -outward_normal;
  }
};

class hittable {
public:
  virtual ~hittable() = default;
  virtual bool hit(const ray &r, interval ray_t, hit_record &rec) const = 0;
  virtual aabb bounding_box() const = 0;
};

class hittable_list : public hittable {
public:
  std::vector<shared_ptr<hittable>> objects;
  aabb bbox;
  bool bbox_init = false;

  hittable_list() {}
  hittable_list(shared_ptr<hittable> object) { add(object); }

  void clear() {
    objects.clear();
    bbox_init = false;
  }

  void add(shared_ptr<hittable> object) {
    objects.push_back(object);
    if (!bbox_init) {
      bbox = object->bounding_box();
      bbox_init = true;
    } else {
      bbox = aabb(bbox, object->bounding_box());
    }
  }

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

  aabb bounding_box() const override { return bbox; }
};
