import * as lamejs from "@breezystack/lamejs";

const getChannels = (audioBuffer: AudioBuffer): Float32Array[] =>
  Array.from({ length: audioBuffer.numberOfChannels }, (_, i) =>
    audioBuffer.getChannelData(i)
  );

const prepareData = (audioBuffer: AudioBuffer): Int16Array[] => {
  const { numberOfChannels } = audioBuffer;
  const bytesPerSample = 16 / 8;

  const channels = getChannels(audioBuffer);

  const int16arrays = Array.from(
    { length: numberOfChannels },
    () => new Int16Array(audioBuffer.length)
  );
  const views = int16arrays.map(
    (int16array) => new DataView(int16array.buffer)
  );

  for (let channIndex = 0; channIndex < channels.length; channIndex++) {
    for (
      let sampleIndex = 0;
      sampleIndex < channels[channIndex].length;
      sampleIndex++
    ) {
      const outputIndex = sampleIndex * bytesPerSample;

      const sample = channels[channIndex][sampleIndex];
      const int16Sample = sample * 0x8000;

      views[channIndex].setInt16(outputIndex, int16Sample, true);
    }
  }

  const mainSize = int16arrays[0].length;
  for (let i = 1; i < int16arrays.length; i += 1) {
    if (int16arrays[i].length !== mainSize) {
      throw new Error("Invalid size");
    }
  }

  return int16arrays;
};

export const createMp3 = async (file: ArrayBuffer): Promise<Uint8Array> => {
  const view = new DataView(file);

  const channelCount = view.getUint16(22, true); // channel count
  const sampleRate = view.getUint32(24, true); // sample rate
  const sampleCount = view.getUint32(40, true); // data chunk length

  // console.log("Channel Count: ", channelCount);
  // console.log("Sample Rate: ", sampleRate);
  // console.log("Sample Count: ", sampleCount / channelCount / 2);

  const offlineAudioContext = new OfflineAudioContext({
    numberOfChannels: channelCount,
    length: sampleCount / channelCount / 2, // We have 16 bits per sample
    sampleRate: sampleRate,
  });

  const audioBuffer = await offlineAudioContext.decodeAudioData(file);
  const channels = prepareData(audioBuffer);

  const kbps = 128; //encode 128kbps mp3
  const mp3encoder = new lamejs.Mp3Encoder(channels.length, sampleRate, kbps);
  const mp3Data = [];

  const sampleBlockSize = 1152; //can be anything but make it a multiple of 576 to make encoders life easier

  for (let i = 0; i < channels[0].length; i += sampleBlockSize) {
    const left = channels[0].slice(i, i + sampleBlockSize);
    const right =
      channelCount === 2
        ? channels[1].slice(i, i + sampleBlockSize)
        : undefined;

    const mp3buf = mp3encoder.encodeBuffer(left, right);
    if (mp3buf.length > 0) {
      mp3Data.push(mp3buf);
    }
  }
  const mp3buf = mp3encoder.flush(); //finish writing mp3

  if (mp3buf.length > 0) {
    mp3Data.push(new Int8Array(mp3buf));
  }

  const blob = new Blob(mp3Data, { type: "audio/mp3" });
  return new Uint8Array(await blob.arrayBuffer());
};
