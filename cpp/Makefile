# cpp-002 构建脚本
# - make wasm   : 浏览器 WASM
# - make cli    : 本地 g++ CLI（输出 PPM）
# - make all

EMSDK_ENV ?= /opt/emsdk/emsdk_env.sh
EMCC ?= emcc
CXX ?= g++

CPP_DIR := .
WEB_OUT := ../public
CLI_OUT := ../bin

WASM_FLAGS := -O3 -std=c++17 \
	-s WASM=1 \
	-s MODULARIZE=1 \
	-s EXPORT_NAME=createRayTracerModule \
	-s ALLOW_MEMORY_GROWTH=1 \
	-s EXPORTED_RUNTIME_METHODS='["ccall","cwrap","HEAPU8"]' \
	-s EXPORTED_FUNCTIONS='["_rt_init","_rt_set_camera","_rt_set_scene","_rt_set_max_depth","_rt_set_background","_rt_set_debug_mode","_rt_reset","_rt_render_pass","_rt_width","_rt_height","_rt_samples","_rt_scene","_rt_debug_mode","_rt_rgba_ptr","_rt_rgba_bytes","_malloc","_free"]' \
	-s NO_EXIT_RUNTIME=1 \
	-s ENVIRONMENT=web \
	--no-entry

.PHONY: all wasm cli clean

all: wasm cli

wasm:
	@mkdir -p $(WEB_OUT)
	@if [ -f "$(EMSDK_ENV)" ]; then . "$(EMSDK_ENV)"; fi; \
	$(EMCC) $(CPP_DIR)/wasm_bridge.cpp -I$(CPP_DIR) $(WASM_FLAGS) -o $(WEB_OUT)/raytracer.js
	@echo "WASM 输出: $(WEB_OUT)/raytracer.js + raytracer.wasm"

cli:
	@mkdir -p $(CLI_OUT)
	$(CXX) -O3 -std=c++17 $(CPP_DIR)/main_cli.cpp -I$(CPP_DIR) -o $(CLI_OUT)/raytracer_cli
	@echo "CLI 输出: $(CLI_OUT)/raytracer_cli"

clean:
	rm -f $(WEB_OUT)/raytracer.js $(WEB_OUT)/raytracer.wasm
	rm -f $(CLI_OUT)/raytracer_cli
