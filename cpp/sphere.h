// 球体：解析求交 (t^2 b·b + 2t b·(O-C) + |O-C|^2 - r^2 = 0)
#pragma once

#include "hittable.h"
#include "vec3.h"

class sphere : public hittable {
public:
  sphere(const point3 &center, double radius, shared_ptr<material> mat)
      : center(center), radius(std::fmax(0, radius)), mat(mat) {}

  bool hit(const ray &r, interval ray_t, hit_record &rec) const override {
    vec3 oc = center - r.origin();
    auto a = r.direction().length_squared();
    auto h = dot(r.direction(), oc); // 半 b，减少运算
    auto c = oc.length_squared() - radius * radius;
    auto discriminant = h * h - a * c;
    if (discriminant < 0) return false;

    auto sqrtd = std::sqrt(discriminant);

    // 找落在 ray_t 内的最近根
    auto root = (h - sqrtd) / a;
    if (!ray_t.surrounds(root)) {
      root = (h + sqrtd) / a;
      if (!ray_t.surrounds(root)) return false;
    }

    rec.t = root;
    rec.p = r.at(rec.t);
    vec3 outward_normal = (rec.p - center) / radius;
    rec.set_face_normal(r, outward_normal);
    rec.mat = mat;
    return true;
  }

private:
  point3 center;
  double radius;
  shared_ptr<material> mat;
};
