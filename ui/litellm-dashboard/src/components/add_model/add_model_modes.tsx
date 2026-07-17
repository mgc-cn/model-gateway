// Define the available test modes
export const TEST_MODES = [
  { value: "chat", label: "Chat - /chat/completions", translationKey: "chat" },
  { value: "completion", label: "Completion - /completions", translationKey: "completion" },
  { value: "embedding", label: "Embedding - /embeddings", translationKey: "embedding" },
  { value: "audio_speech", label: "Audio Speech - /audio/speech", translationKey: "audioSpeech" },
  {
    value: "audio_transcription",
    label: "Audio Transcription - /audio/transcriptions",
    translationKey: "audioTranscription",
  },
  {
    value: "image_generation",
    label: "Image Generation - /images/generations",
    translationKey: "imageGeneration",
  },
  { value: "video_generation", label: "Video Generation - /videos", translationKey: "videoGeneration" },
  { value: "rerank", label: "Rerank - /rerank", translationKey: "rerank" },
  { value: "realtime", label: "Realtime - /realtime", translationKey: "realtime" },
  { value: "batch", label: "Batch - /batch", translationKey: "batch" },
  { value: "ocr", label: "OCR - /ocr", translationKey: "ocr" },
];

// Define the available auto router routing strategies
export const AUTO_ROUTER_MODES = [
  { value: "simple-shuffle", label: "Simple Shuffle - Random selection from available models" },
  { value: "least-busy", label: "Least Busy - Route to model with lowest current load" },
  { value: "latency-based", label: "Latency Based - Route to model with best response time" },
  { value: "cost-based", label: "Cost Based - Route to most cost-effective model" },
  { value: "usage-based", label: "Usage Based - Route based on historical usage patterns" },
  { value: "custom", label: "Custom - Use custom routing logic defined in config" },
];
