use symphonia::core::{
    formats::{FormatOptions, FormatReader},
    io::MediaSourceStream,
    meta::MetadataOptions,
    probe::Hint,
};

#[cfg(feature = "wasm")]
use wasm_bindgen::prelude::*;

#[cfg_attr(feature = "wasm", wasm_bindgen)]
pub struct Mp3Decoder {
    format: Box<dyn FormatReader>,
}

#[cfg_attr(feature = "wasm", wasm_bindgen)]
pub struct Mp3Packet {
    /// The packet data in MP3 format.
    #[allow(dead_code)]
    data: Vec<u8>,
    /// The duration of the packet in seconds.
    #[allow(dead_code)]
    duration: f64,
    /// The timestamp of the packet in seconds.
    #[allow(dead_code)]
    timestamp: f64,
}

#[cfg_attr(feature = "wasm", wasm_bindgen)]
impl Mp3Packet {
    #[cfg_attr(feature = "wasm", wasm_bindgen(getter))]
    pub fn data(&self) -> Vec<u8> {
        self.data.clone()
    }

    #[cfg_attr(feature = "wasm", wasm_bindgen(getter))]
    pub fn duration(&self) -> f64 {
        self.duration
    }

    #[cfg_attr(feature = "wasm", wasm_bindgen(getter))]
    pub fn timestamp(&self) -> f64 {
        self.timestamp
    }
}

#[cfg_attr(feature = "wasm", wasm_bindgen)]
impl Mp3Decoder {
    /// Create a new MP3 decoder.
    ///
    /// Will probe the media source stream to determine the format of the data.
    #[cfg_attr(feature = "wasm", wasm_bindgen(constructor))]
    pub fn new(data: Vec<u8>) -> Self {
        let cursor = std::io::Cursor::new(data);

        // Create the media source stream using the boxed media source from above.
        let mss = MediaSourceStream::new(Box::new(cursor), Default::default());

        // Create a hint to help the format registry guess what format reader is appropriate. In this
        // example we'll leave it empty.
        let hint = Hint::new();

        // Use the default options when reading and decoding.
        let format_opts: FormatOptions = Default::default();
        let metadata_opts: MetadataOptions = Default::default();

        // Probe the media source stream for a format.
        let probed = symphonia::default::get_probe()
            .format(&hint, mss, &format_opts, &metadata_opts)
            .unwrap();

        Self {
            // Get the format reader yielded by the probe operation.
            format: probed.format,
        }
    }

    /// Demux an MP3 file into packets.
    #[cfg_attr(feature = "wasm", wasm_bindgen(js_name = decodeNextPacket))]
    pub fn decode_mp3_to_packets(&mut self) -> Option<Mp3Packet> {
        let default_track = self.format.default_track().unwrap();
        let time_base = default_track
            .codec_params
            .time_base
            .unwrap_or_else(Default::default);
        let default_track_id = default_track.id;

        loop {
            // Get the next packet from the format reader.
            let packet = self.format.next_packet();
            let Ok(packet) = packet else {
                return None;
            };

            // If the packet does not belong to the selected track, skip it.
            if packet.track_id() != default_track_id {
                continue;
            }

            let duration = time_base.calc_time(packet.dur);
            let duration = duration.seconds as f64 + duration.frac;

            let timestamp = time_base.calc_time(packet.ts);
            let timestamp = timestamp.seconds as f64 + timestamp.frac;

            return Some(Mp3Packet {
                data: packet.data.to_vec(),
                duration,
                timestamp,
            });
        }
    }
}
