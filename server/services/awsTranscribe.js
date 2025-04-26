const { TranscribeStreamingClient, StartStreamTranscriptionCommand } = require("@aws-sdk/client-transcribe-streaming");

const client = new TranscribeStreamingClient({
  region: process.env.REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

const startTranscription = async (audioStream) => {
  const command = new StartStreamTranscriptionCommand({
    LanguageCode: "zh-TW",
    MediaSampleRateHertz: 16000,
    MediaEncoding: "pcm",
    AudioStream: audioStream, // Readable stream from client
  });

  return await client.send(command);
};

module.exports = { startTranscription };
