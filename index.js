// index.js
const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const AWS = require("aws-sdk");

const app = express();
const { BedrockRuntimeClient, InvokeModelCommand } = require('@aws-sdk/client-bedrock-runtime');
const { defaultProvider } = require('@aws-sdk/credential-provider-node'); // 用來提供 AWS 憑證

const client = new BedrockRuntimeClient({
  region: 'us-west-2',
  credentials: defaultProvider(), // 這會自動獲取 AWS 的憑證
});
app.use(cors());
app.use(bodyParser.json());

// 設定 AWS IAM 憑證
AWS.config.update({
  accessKeyId: "",
  secretAccessKey: "",
  region: "us-west-2",
});

const s3 = new AWS.S3();

app.post("/upload", async (req, res) => {
  const text = req.body.text;

  if (!text) {
    return res.status(400).json({ message: "缺少文字內容" });
  }

  const params = {
    Bucket: "hackher", // 替換為你的 bucket 名稱
    Key: `transcripts/${Date.now()}.txt`,
    Body: text,
    ContentType: "text/plain",
  };

  try {
    await s3.putObject(params).promise();
    console.log("✅ 成功上傳到 S3！");
    res.json({ message: "上傳成功" });
  } catch (err) {
    console.error("❌ S3 上傳錯誤", err);  // ← 看這裡會印什麼錯
    res.status(500).json({ message: "S3 上傳失敗" });
  }
  
});

app.listen(3001, () => {
  console.log("✅ 後端伺服器已啟動：http://localhost:3001");
});


