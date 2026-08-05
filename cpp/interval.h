// 区间：用于合法命中距离 [t_min, t_max]
#pragma once

#include "rt_common.h"

class interval {
public:
  double min, max;

  interval() : min(+infinity), max(-infinity) {} // 默认空集
  interval(double min, double max) : min(min), max(max) {}

  double size() const { return max - min; }
  bool contains(double x) const { return min <= x && x <= max; }
  bool surrounds(double x) const { return min < x && x < max; }

  double clamp(double x) const {
    if (x < min) return min;
    if (x > max) return max;
    return x;
  }

  static const interval &empty() {
    static const interval v(+infinity, -infinity);
    return v;
  }
  static const interval &universe() {
    static const interval v(-infinity, +infinity);
    return v;
  }
};
