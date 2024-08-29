use symphonia::core::{
    formats::{FormatOptions, FormatReader},
    io::MediaSourceStream,
    meta::MetadataOptions,
    probe::Hint,
};

use wasm_bindgen::prelude::*;

#[wasm_bindgen]
pub struct Mp3Decoder {
    format: Box<dyn FormatReader>,
    default_track_id: u32,
}

#[wasm_bindgen]
impl Mp3Decoder {
    /// Create a new MP3 decoder.
    ///
    /// Will probe the media source stream to determine the format of the data.
    #[wasm_bindgen(constructor)]
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

        let format = probed.format;
        // Get the default track.
        let track_id = format.default_track().unwrap().id;

        Self {
            // Get the format reader yielded by the probe operation.
            format,
            default_track_id: track_id,
        }
    }

    /// Demux an MP3 file into packets.
    #[wasm_bindgen(js_name = decodeNextPacket)]
    pub fn decode_mp3_to_packets(&mut self) -> Option<Vec<u8>> {
        loop {
            // Get the next packet from the format reader.
            let packet = self.format.next_packet();
            let Ok(packet) = packet else {
                return None;
            };

            // If the packet does not belong to the selected track, skip it.
            if packet.track_id() != self.default_track_id {
                continue;
            }

            return Some(packet.data.to_vec());
        }
    }
}
