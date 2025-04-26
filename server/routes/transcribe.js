const express = require("express");
const router = express.Router();
const { startTranscription } = require("../services/awsTranscribe");

router.post("/", async (req, res) => {
  const audioStream = req.body.audioStream; // 通常要處理成 readable stream
  try {
    const response = await startTranscription(audioStream);
    res.json(response);
  } catch (err) {
    console.error("Transcribe 錯誤", err);
    res.status(500).json({ error: "Transcribe 失敗" });
  }
});

module.exports = router;
