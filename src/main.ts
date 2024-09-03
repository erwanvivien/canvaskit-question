import "./style.css";

import {
  ArrayBufferTarget as MP4ArrayBufferTarget,
  Muxer as MP4Muxer,
} from "mp4-muxer";

// The file contains your MP3 chunks
import packets from "./mp3chunk.json";

const base64toUint8Array = (base64: string): Uint8Array => {
  const binaryString = window.atob(base64);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }

  return bytes;
};

const main = async () => {
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
      data: base64toUint8Array(packet.data),
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
