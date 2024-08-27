import CanvasKitInit, { type CanvasKit } from "canvaskit-wasm";

let CanvasKitInstance: CanvasKit | undefined;

export const getCanvasKit = async (): Promise<CanvasKit> => {
  CanvasKitInstance ??= await CanvasKitInit({
    locateFile: (file) => "https://unpkg.com/canvaskit-wasm@latest/bin/" + file,
  });

  return CanvasKitInstance;
};
