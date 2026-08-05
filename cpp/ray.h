// 射线：P(t) = origin + t * direction
#pragma once

#include "vec3.h"

class ray {
public:
  ray() {}
  ray(const point3 &origin, const vec3 &direction) : orig(origin), dir(direction) {}

  const point3 &origin() const { return orig; }
  const vec3 &direction() const { return dir; }

  // 参数化点：t>0 为射线前方
  point3 at(double t) const { return orig + t * dir; }

private:
  point3 orig;
  vec3 dir;
};
