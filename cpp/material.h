// 材质：漫反射 / 金属 / 介质（玻璃）
#pragma once

#include "hittable.h"
#include "rt_common.h"
#include "vec3.h"

class material {
public:
  virtual ~material() = default;

  // 散射：输入入射射线与命中信息，输出衰减 attenuation 与出射 scattered
  virtual bool scatter(const ray &r_in, const hit_record &rec, color &attenuation,
                       ray &scattered) const = 0;
};

// ---------- Lambertian 漫反射 ----------
class lambertian : public material {
public:
  lambertian(const color &albedo) : albedo(albedo) {}

  bool scatter(const ray &, const hit_record &rec, color &attenuation,
               ray &scattered) const override {
    auto scatter_direction = rec.normal + random_unit_vector();
    // 退化：几乎零方向时改用法线
    if (scatter_direction.near_zero()) scatter_direction = rec.normal;
    scattered = ray(rec.p, scatter_direction);
    attenuation = albedo;
    return true;
  }

private:
  color albedo;
};

// ---------- Metal 金属（模糊反射） ----------
class metal : public material {
public:
  metal(const color &albedo, double fuzz) : albedo(albedo), fuzz(fuzz < 1 ? fuzz : 1) {}

  bool scatter(const ray &r_in, const hit_record &rec, color &attenuation,
               ray &scattered) const override {
    vec3 reflected = reflect(unit_vector(r_in.direction()), rec.normal);
    scattered = ray(rec.p, reflected + fuzz * random_unit_vector());
    attenuation = albedo;
    return (dot(scattered.direction(), rec.normal) > 0);
  }

private:
  color albedo;
  double fuzz;
};

// ---------- Dielectric 介质（折射 + Schlick 反射） ----------
class dielectric : public material {
public:
  dielectric(double refraction_index) : refraction_index(refraction_index) {}

  bool scatter(const ray &r_in, const hit_record &rec, color &attenuation,
               ray &scattered) const override {
    attenuation = color(1.0, 1.0, 1.0);
    double ri = rec.front_face ? (1.0 / refraction_index) : refraction_index;

    vec3 unit_direction = unit_vector(r_in.direction());
    double cos_theta = std::fmin(dot(-unit_direction, rec.normal), 1.0);
    double sin_theta = std::sqrt(1.0 - cos_theta * cos_theta);

    bool cannot_refract = ri * sin_theta > 1.0;
    vec3 direction;

    if (cannot_refract || reflectance(cos_theta, ri) > random_double())
      direction = reflect(unit_direction, rec.normal);
    else
      direction = refract(unit_direction, rec.normal, ri);

    scattered = ray(rec.p, direction);
    return true;
  }

private:
  double refraction_index;

  // Schlick 近似：视角掠射时玻璃更像镜子
  static double reflectance(double cosine, double refraction_index) {
    auto r0 = (1 - refraction_index) / (1 + refraction_index);
    r0 = r0 * r0;
    return r0 + (1 - r0) * std::pow((1 - cosine), 5);
  }
};
