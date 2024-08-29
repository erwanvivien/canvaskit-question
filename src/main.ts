import "./style.css";

import init, { Mp3Decoder } from "../mp3chunks/pkg/mp3chunks";

const main = async () => {
  await init();

  const audio = await fetch("/audio.mp3");
  const bytes = await audio.arrayBuffer();
  const data = new Uint8Array(bytes);

  const decoder = new Mp3Decoder(data);

  while (true) {
    const packet = decoder.decodeNextPacket();
    if (packet === undefined) {
      break;
    }

    console.log(packet.length);
  }
};

main();
