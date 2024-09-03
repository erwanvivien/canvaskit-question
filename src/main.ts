import "./style.css";

import init, { Mp3Decoder, Mp3Packet } from "../mp3chunks/pkg/mp3chunks";
import { createMp3 } from "./mp3";
import {
  Muxer as MP4Muxer,
  ArrayBufferTarget as MP4ArrayBufferTarget,
} from "../mp4-muxer/src/index";

const main = async () => {
  await init();

  const audio = await fetch("/audio.wav");
  const bytes = await audio.arrayBuffer();
  const mp3 = await createMp3(bytes);

  const decoder = new Mp3Decoder(mp3);

  const packets: Mp3Packet[] = [];
  while (true) {
    const packet = decoder.decodeNextPacket();
    if (packet === undefined) {
      break;
    }

    packets.push(packet);
  }

  const target = new MP4ArrayBufferTarget();
  const mp4muxer = new MP4Muxer({
    target,
    fastStart: "in-memory",
    video: undefined,
    audio: {
      codec: "mp3",
      numberOfChannels: 2,
      sampleRate: 48000,
    },
  });

  let isFirst = true;
  for (const packet of packets) {
    const encodedAudioChunk = new EncodedAudioChunk({
      type: isFirst ? "key" : "delta",
      data: packet.data,
      duration: Number(packet.duration) * 1e6,
      timestamp: Number(packet.timestamp) * 1e6,
    });
    isFirst = false;

    mp4muxer.addAudioChunk(encodedAudioChunk);
  }

  mp4muxer.finalize();

  const blob = new Blob([target.buffer], { type: "video/mp4" });
  const url = URL.createObjectURL(blob);

  console.log(url);
};

main();
