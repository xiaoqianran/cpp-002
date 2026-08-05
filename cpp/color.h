// 颜色写入：线性 → gamma，再量化到 0..255
#pragma once

#include "interval.h"
#include "vec3.h"

// 近似 gamma 2.0：sqrt
inline double linear_to_gamma(double linear_component) {
  if (linear_component > 0) return std::sqrt(linear_component);
  return 0;
}

// 将累加均值 color 写入 RGBA8 缓冲的一个像素
inline void write_color_rgba(unsigned char *pixel, const color &pixel_color) {
  auto r = linear_to_gamma(pixel_color.x());
  auto g = linear_to_gamma(pixel_color.y());
  auto b = linear_to_gamma(pixel_color.z());

  static const interval intensity(0.000, 0.999);
  pixel[0] = static_cast<unsigned char>(256 * intensity.clamp(r));
  pixel[1] = static_cast<unsigned char>(256 * intensity.clamp(g));
  pixel[2] = static_cast<unsigned char>(256 * intensity.clamp(b));
  pixel[3] = 255;
}
