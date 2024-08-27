import "./style.css";

import { getCanvasKit } from "./canvaskit";
import type { Canvas, Surface } from "canvaskit-wasm";

function assertDefined<T>(value: T): asserts value is NonNullable<T> {
  if (value === undefined || value === null) {
    throw new Error("Value is undefined");
  }
}

const app = document.getElementById("app");
assertDefined(app);

const main = async () => {
  const canvases: {
    domCanvas: HTMLCanvasElement;
    skiaCanvas: Canvas;
    surface: Surface;
  }[] = [];

  const ck = await getCanvasKit();

  // Change the number of canvases to 2 to see the issue
  // 1 works fine and draws the image with blur then a rounded rectangle
  // 2 only draws the image with blur then clears and draws the rect
  for (let i = 0; i < 1; i++) {
    const canvas = document.createElement("canvas");
    canvas.id = String(i);
    assertDefined(canvas);
    app.appendChild(canvas);

    const image = new Image();
    image.src = "/download.png";
    await new Promise((resolve) => {
      image.onload = resolve;
    });

    const surface = ck.MakeWebGLCanvasSurface(canvas);
    assertDefined(surface);

    const skiaCanvas = surface.getCanvas();

    canvases.push({
      domCanvas: canvas,
      skiaCanvas,
      surface,
    });

    const paint = new ck.Paint();
    const skiaImage = ck.MakeImageFromCanvasImageSource(image);

    skiaCanvas.clear(ck.WHITE);

    // Draw with blur
    paint.setMaskFilter(ck.MaskFilter.MakeBlur(ck.BlurStyle.Normal, 2, false));
    skiaCanvas.drawImage(skiaImage, 10, 10, paint);
    paint.setMaskFilter(null);

    paint.delete();
    surface.flush();
  }

  const paint = new ck.Paint();
  paint.setColor(ck.Color4f(0.9, 0, 0, 1));
  paint.setStyle(ck.PaintStyle.Stroke);
  paint.setStrokeWidth(5);
  // paint.setAntiAlias(true);
  const rr = ck.RRectXY(ck.LTRBRect(10, 60, 210, 260), 25, 15);

  canvases[0].skiaCanvas.drawRRect(rr, paint);
  canvases[0].surface.flush();
  paint.delete();
};

main();
