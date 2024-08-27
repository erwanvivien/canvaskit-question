import "./style.css";

import { getCanvasKit } from "./canvaskit";

function assertDefined<T>(value: T): asserts value is NonNullable<T> {
  if (value === undefined || value === null) {
    throw new Error("Value is undefined");
  }
}

const main = async () => {
  const canvas = document.getElementById("canvas");
  assertDefined(canvas);
  if (!(canvas instanceof HTMLCanvasElement)) {
    throw new Error("Canvas is not an instance of HTMLCanvasElement");
  }

  const ck = await getCanvasKit();

  const image = new Image();
  image.src = "/download.png";
  await new Promise((resolve) => {
    image.onload = resolve;
  });

  const surface = ck.MakeWebGLCanvasSurface(canvas);
  assertDefined(surface);

  const skiaCanvas = surface.getCanvas();

  const paint = new ck.Paint();
  // paint.setColor(ck.Color4f(0.9, 0, 0, 1.0));
  // paint.setStyle(ck.PaintStyle.Stroke);
  // paint.setAntiAlias(true);
  // const rr = ck.RRectXY(ck.LTRBRect(10, 60, 210, 260), 25, 15);
  const skiaImage = ck.MakeImageFromCanvasImageSource(image);

  skiaCanvas.clear(ck.WHITE);

  // Draw with blur
  paint.setMaskFilter(ck.MaskFilter.MakeBlur(ck.BlurStyle.Normal, 2, false));
  skiaCanvas.drawImage(skiaImage, 10, 10, paint);
  paint.setMaskFilter(null);

  paint.delete();
  surface.flush();
};

main();
