// cpp-002 光线追踪公共头文件
// 用途：统一类型、常量、随机数，供向量/材质/场景共用。
#pragma once

#include <cmath>
#include <cstdlib>
#include <limits>
#include <memory>
#include <random>

// 常用别名：与《Ray Tracing in One Weekend》习惯一致
using std::make_shared;
using std::shared_ptr;

// 数学常量
const double infinity = std::numeric_limits<double>::infinity();
const double pi = 3.1415926535897932385;

// 角度 → 弧度
inline double degrees_to_radians(double degrees) {
  return degrees * pi / 180.0;
}

// 线程局部 PRNG：WASM 环境避免 random_device 不可用
inline std::mt19937 &rng() {
  static thread_local std::mt19937 gen{[] {
    std::seed_seq seq{0xC0FFEEu, 0xBEEFu, 0xA11CEu, 0x5EED1234u};
    return std::mt19937{seq};
  }()};
  return gen;
}

// [0,1) 均匀随机
inline double random_double() {
  static thread_local std::uniform_real_distribution<double> distribution(0.0, 1.0);
  return distribution(rng());
}

// [min, max) 均匀随机
inline double random_double(double min, double max) {
  return min + (max - min) * random_double();
}

// 钳制
inline double clamp(double x, double min, double max) {
  if (x < min) return min;
  if (x > max) return max;
  return x;
}
