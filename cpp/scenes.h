// 预设场景构建（同时收集面光源列表供 NEE）
#pragma once

#include "hittable.h"
#include "material.h"
#include "quad.h"
#include "sphere.h"
#include <vector>

// scene_id:
// 0 = 经典三球
// 1 = 玻璃聚焦
// 2 = 金属走廊
// 3 = 康奈尔箱
// 4 = 多球 BVH 测试
inline void build_scene(int scene_id, hittable_list &world,
                        std::vector<shared_ptr<quad>> &lights) {
  world.clear();
  lights.clear();

  if (scene_id == 1) {
    auto ground = make_shared<lambertian>(color(0.35, 0.35, 0.4));
    world.add(make_shared<sphere>(point3(0, -1000, 0), 1000, ground));

    auto glass = make_shared<dielectric>(1.5);
    auto glass_bubble = make_shared<dielectric>(1.0 / 1.5);
    auto red = make_shared<lambertian>(color(0.65, 0.05, 0.05));
    auto chrome = make_shared<metal>(color(0.8, 0.8, 0.9), 0.05);

    world.add(make_shared<sphere>(point3(0, 1, 0), 1.0, glass));
    world.add(make_shared<sphere>(point3(0, 1, 0), 0.8, glass_bubble));
    world.add(make_shared<sphere>(point3(-2.2, 1, 0), 1.0, red));
    world.add(make_shared<sphere>(point3(2.2, 1, 0), 1.0, chrome));
    return;
  }

  if (scene_id == 2) {
    auto ground = make_shared<metal>(color(0.7, 0.7, 0.75), 0.15);
    world.add(make_shared<sphere>(point3(0, -1000, 0), 1000, ground));

    auto gold = make_shared<metal>(color(0.8, 0.6, 0.2), 0.2);
    auto chrome = make_shared<metal>(color(0.9, 0.9, 0.95), 0.0);
    auto blue = make_shared<lambertian>(color(0.1, 0.2, 0.5));

    for (int i = -2; i <= 2; ++i) {
      world.add(make_shared<sphere>(point3(i * 1.4, 0.5, 0), 0.5, (i % 2 == 0) ? gold : chrome));
    }
    world.add(make_shared<sphere>(point3(0, 1.6, -1.5), 0.8, blue));
    return;
  }

  if (scene_id == 3) {
    auto red = make_shared<lambertian>(color(0.65, 0.05, 0.05));
    auto green = make_shared<lambertian>(color(0.12, 0.45, 0.15));
    auto white = make_shared<lambertian>(color(0.73, 0.73, 0.73));
    auto light_mat = make_shared<diffuse_light>(color(15, 15, 15));

    world.add(make_shared<quad>(point3(-1, 0, -1), vec3(0, 0, 2), vec3(0, 2, 0), red));
    world.add(make_shared<quad>(point3(1, 0, 1), vec3(0, 0, -2), vec3(0, 2, 0), green));
    world.add(make_shared<quad>(point3(-1, 0, -1), vec3(2, 0, 0), vec3(0, 0, 2), white));
    world.add(make_shared<quad>(point3(-1, 2, 1), vec3(2, 0, 0), vec3(0, 0, -2), white));
    world.add(make_shared<quad>(point3(-1, 0, -1), vec3(2, 0, 0), vec3(0, 2, 0), white));

    auto light_quad =
        make_shared<quad>(point3(-0.35, 1.99, -0.35), vec3(0.7, 0, 0), vec3(0, 0, 0.7), light_mat);
    world.add(light_quad);
    lights.push_back(light_quad);

    world.add(make_shared<sphere>(point3(-0.35, 0.35, 0.15), 0.35, white));
    world.add(make_shared<sphere>(point3(0.4, 0.35, -0.25), 0.35,
                                  make_shared<metal>(color(0.9, 0.9, 0.95), 0.05)));
    world.add(make_shared<sphere>(point3(0.05, 0.25, 0.45), 0.25, make_shared<dielectric>(1.5)));
    return;
  }

  if (scene_id == 4) {
    auto ground_mat = make_shared<lambertian>(color(0.48, 0.48, 0.48));
    world.add(make_shared<quad>(point3(-12, 0, -12), vec3(24, 0, 0), vec3(0, 0, 24), ground_mat));

    world.add(make_shared<sphere>(point3(0, 1, 0), 1.0, make_shared<dielectric>(1.5)));
    world.add(make_shared<sphere>(point3(-4, 1, 0), 1.0, make_shared<lambertian>(color(0.4, 0.2, 0.1))));
    world.add(make_shared<sphere>(point3(4, 1, 0), 1.0, make_shared<metal>(color(0.7, 0.6, 0.5), 0.0)));

    for (int a = -7; a < 8; a++) {
      for (int b = -7; b < 8; b++) {
        int h = a * 73856093 ^ b * 19349663;
        auto u = ((h & 1023) / 1023.0);
        auto v = (((h >> 10) & 1023) / 1023.0);
        auto choose = (((h >> 20) & 1023) / 1023.0);
        point3 center(a + 0.9 * u, 0.2, b + 0.9 * v);

        if ((center - point3(0, 1, 0)).length() < 1.3) continue;
        if ((center - point3(-4, 1, 0)).length() < 1.3) continue;
        if ((center - point3(4, 1, 0)).length() < 1.3) continue;

        shared_ptr<material> mat;
        if (choose < 0.75) {
          auto albedo = color(0.2 + 0.6 * u, 0.15 + 0.5 * v, 0.2 + 0.5 * (1 - u));
          mat = make_shared<lambertian>(albedo);
        } else if (choose < 0.92) {
          mat = make_shared<metal>(color(0.6 + 0.3 * u, 0.6 + 0.3 * v, 0.7), 0.1 + 0.3 * v);
        } else {
          mat = make_shared<dielectric>(1.5);
        }
        world.add(make_shared<sphere>(center, 0.2, mat));
      }
    }
    return;
  }

  auto ground_material = make_shared<lambertian>(color(0.5, 0.5, 0.5));
  world.add(make_shared<sphere>(point3(0, -1000, 0), 1000, ground_material));

  auto material_center = make_shared<lambertian>(color(0.1, 0.2, 0.5));
  auto material_left = make_shared<dielectric>(1.5);
  auto material_bubble = make_shared<dielectric>(1.0 / 1.5);
  auto material_right = make_shared<metal>(color(0.8, 0.6, 0.2), 0.0);

  world.add(make_shared<sphere>(point3(0, 1, 0), 1.0, material_center));
  world.add(make_shared<sphere>(point3(-2, 1, 0), 1.0, material_left));
  world.add(make_shared<sphere>(point3(-2, 1, 0), 0.8, material_bubble));
  world.add(make_shared<sphere>(point3(2, 1, 0), 1.0, material_right));
}
