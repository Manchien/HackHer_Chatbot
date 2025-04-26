const express = require("express");
const router = express.Router();
const { uploadToS3 } = require("../services/s3Client");

router.post("/", async (req, res) => {
  const text = req.body.text;

  if (!text) {
    return res.status(400).json({ message: "缺少文字內容" });
  }

  try {
    await uploadToS3(text);
    console.log("✅ 成功上傳到 S3！");
    res.json({ message: "上傳成功" });
  } catch (err) {
    console.error("❌ S3 上傳錯誤", err);
    res.status(500).json({ message: "S3 上傳失敗" });
  }
});

module.exports = router;
