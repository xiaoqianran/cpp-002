// cpp-002 光线追踪公共头文件
#pragma once

#include <cmath>
#include <cstdlib>
#include <limits>
#include <memory>
#include <random>

using std::make_shared;
using std::shared_ptr;

const double infinity = std::numeric_limits<double>::infinity();
const double pi = 3.1415926535897932385;

inline double degrees_to_radians(double degrees) {
  return degrees * pi / 180.0;
}

inline std::mt19937 &rng() {
  static thread_local std::mt19937 gen{[] {
    std::seed_seq seq{0xC0FFEEu, 0xBEEFu, 0xA11CEu, 0x5EED1234u};
    return std::mt19937{seq};
  }()};
  return gen;
}

inline double random_double() {
  static thread_local std::uniform_real_distribution<double> distribution(0.0, 1.0);
  return distribution(rng());
}

inline double random_double(double min, double max) {
  return min + (max - min) * random_double();
}

inline int random_int(int min, int max) {
  // 含端点 [min, max]
  return static_cast<int>(random_double(min, max + 1));
}

inline double clamp(double x, double min, double max) {
  if (x < min) return min;
  if (x > max) return max;
  return x;
}
