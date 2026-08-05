// 预设场景构建
#pragma once

#include "hittable.h"
#include "material.h"
#include "quad.h"
#include "sphere.h"

// scene_id:
// 0 = 经典三球 + 地面
// 1 = 玻璃聚焦
// 2 = 金属走廊
// 3 = 康奈尔箱（红绿墙 + 天花板面光）
inline void build_scene(int scene_id, hittable_list &world) {
  world.clear();

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
    // 康奈尔箱：房间约 x,z ∈ [-1,1]，y ∈ [0,2]
    auto red = make_shared<lambertian>(color(0.65, 0.05, 0.05));
    auto green = make_shared<lambertian>(color(0.12, 0.45, 0.15));
    auto white = make_shared<lambertian>(color(0.73, 0.73, 0.73));
    auto light = make_shared<diffuse_light>(color(15, 15, 15));

    // 左墙 x=-1（红）
    world.add(make_shared<quad>(point3(-1, 0, -1), vec3(0, 0, 2), vec3(0, 2, 0), red));
    // 右墙 x=+1（绿）
    world.add(make_shared<quad>(point3(1, 0, 1), vec3(0, 0, -2), vec3(0, 2, 0), green));
    // 地板 y=0
    world.add(make_shared<quad>(point3(-1, 0, -1), vec3(2, 0, 0), vec3(0, 0, 2), white));
    // 天花板 y=2
    world.add(make_shared<quad>(point3(-1, 2, 1), vec3(2, 0, 0), vec3(0, 0, -2), white));
    // 后墙 z=-1
    world.add(make_shared<quad>(point3(-1, 0, -1), vec3(2, 0, 0), vec3(0, 2, 0), white));

    // 天花板面光（略低于顶，避免 z-fight）
    world.add(make_shared<quad>(point3(-0.35, 1.99, -0.35), vec3(0.7, 0, 0), vec3(0, 0, 0.7), light));

    // 箱内物体：白漫反射球 + 金属球 + 玻璃球
    world.add(make_shared<sphere>(point3(-0.35, 0.35, 0.15), 0.35, white));
    world.add(make_shared<sphere>(point3(0.4, 0.35, -0.25), 0.35, make_shared<metal>(color(0.9, 0.9, 0.95), 0.05)));
    world.add(make_shared<sphere>(point3(0.05, 0.25, 0.45), 0.25, make_shared<dielectric>(1.5)));
    return;
  }

  // 默认：经典三球
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
