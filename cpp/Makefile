# cpp-002：分层目录 + WASM / CLI
EMCC ?= emcc
CXX ?= g++

ROOT := .
WEB_OUT := ../public
CLI_OUT := ../bin

INCLUDES := -I$(ROOT) -I$(ROOT)/math -I$(ROOT)/geo -I$(ROOT)/mat -I$(ROOT)/scene

WASM_FLAGS := -O3 -std=c++17 $(INCLUDES) \
	-s WASM=1 \
	-s MODULARIZE=1 \
	-s EXPORT_NAME=createRayTracerModule \
	-s ALLOW_MEMORY_GROWTH=1 \
	-s EXPORTED_RUNTIME_METHODS='["ccall","cwrap","HEAPU8","HEAPF64"]' \
	-s EXPORTED_FUNCTIONS='["_rt_init","_rt_set_camera","_rt_set_scene","_rt_set_max_depth","_rt_set_background","_rt_set_debug_mode","_rt_set_use_bvh","_rt_set_use_nee","_rt_set_use_mis","_rt_set_use_rr","_rt_apply_config","_rt_reset","_rt_render_pass","_rt_width","_rt_height","_rt_samples","_rt_scene","_rt_debug_mode","_rt_use_bvh","_rt_use_nee","_rt_use_mis","_rt_use_rr","_rt_primitive_count","_rt_light_count","_rt_rgba_ptr","_rt_rgba_bytes","_malloc","_free"]' \
	-s NO_EXIT_RUNTIME=1 \
	-s ENVIRONMENT=web \
	--no-entry

.PHONY: all wasm cli clean

all: wasm cli

wasm:
	@mkdir -p $(WEB_OUT)
	$(EMCC) $(ROOT)/api/wasm_bridge.cpp $(WASM_FLAGS) -o $(WEB_OUT)/raytracer.js
	@echo "WASM → $(WEB_OUT)/raytracer.js + raytracer.wasm"

cli:
	@mkdir -p $(CLI_OUT)
	$(CXX) -O3 -std=c++17 $(INCLUDES) $(ROOT)/api/main_cli.cpp -o $(CLI_OUT)/raytracer_cli
	@echo "CLI → $(CLI_OUT)/raytracer_cli"

clean:
	rm -f $(WEB_OUT)/raytracer.js $(WEB_OUT)/raytracer.wasm
	rm -f $(CLI_OUT)/raytracer_cli
