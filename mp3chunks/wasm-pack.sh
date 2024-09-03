#!/bin/sh

CARGO_MODE="--release"
TARGET_PATH="release"
BUILD_STD_FEATURES="panic_immediate_abort"

echo "Building with cargo mode: ${CARGO_MODE}"

OUTPUT_DIR="pkg"

cargo +nightly build ${CARGO_MODE} \
    --target wasm32-unknown-unknown \
    -Z "build-std=std,panic_abort" \
    -Z "build-std-features=${BUILD_STD_FEATURES}" \
    --features wasm && \

wasm-bindgen \
    --out-dir ${OUTPUT_DIR} \
    --web \
    "target/wasm32-unknown-unknown/${TARGET_PATH}/mp3chunks.wasm" && \

wasm-opt \
    -Oz \
    -o "${OUTPUT_DIR}/mp3chunks_bg.wasm" \
    "${OUTPUT_DIR}/mp3chunks_bg.wasm" && \

echo "Done!"
