import "./style.css";

import init, { Mp3Decoder } from "../mp3chunks/pkg/mp3chunks";
import { createMp3 } from "./mp3";

const main = async () => {
  await init();

  const audio = await fetch("/audio.wav");
  const bytes = await audio.arrayBuffer();
  const mp3 = await createMp3(bytes);

  const decoder = new Mp3Decoder(mp3);

  while (true) {
    const packet = decoder.decodeNextPacket();
    if (packet === undefined) {
      break;
    }

    console.log(packet.length);
  }
};

main();
