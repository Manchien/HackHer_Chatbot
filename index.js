const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const AWS = require("aws-sdk");
const { BedrockRuntimeClient, InvokeModelCommand } = require("@aws-sdk/client-bedrock-runtime");
const { defaultProvider } = require("@aws-sdk/credential-provider-node");

const app = express();

// 初始化 AWS SDK for JavaScript v3 客戶端
const client = new BedrockRuntimeClient({
  region: "us-west-2",
  credentials: defaultProvider(), // 用來自動獲取 AWS 憑證
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
let chatHistory = [];
// 上傳文字到 S3
app.post("/upload", async (req, res) => {
  const text = req.body.text;
  const fileKey = "transcripts/chatlog.txt";

  if (!text) {
    return res.status(400).json({ message: "缺少文字內容" });
  }

  try {
    // 先嘗試讀取現有內容
    let existingContent = "";
    try {
      const existingObj = await s3.getObject({
        Bucket: "hackher",
        Key: fileKey,
      }).promise();

      existingContent = existingObj.Body.toString("utf-8");
    } catch (err) {
      if (err.code !== "NoSuchKey") throw err;
    }

    // 加上 timestamp
    const timestamp = new Date().toISOString();
    const newEntry = `[${timestamp}] ${text}`;

    // 接續內容
    const updatedContent = existingContent + "\n" + newEntry;

    // 上傳
    await s3.putObject({
      Bucket: "hackher",
      Key: fileKey,
      Body: updatedContent,
      ContentType: "text/plain",
    }).promise();

    console.log("✅ 成功續寫到 S3！");
    res.json({ message: "續寫成功" });
  } catch (err) {
    console.error("❌ S3 續寫錯誤", err);
    res.status(500).json({ message: "S3 續寫失敗" });
  }
});


// 聊天接口
app.post("/chat", async (req, res) => {
  const userInput = req.body.prompt;
  chatHistory.push({ role: "user", content: userInput });
  // const messages = [
  //   { role: "user", content: userInput },
  // ];

  const input = {
    messages: chatHistory,
    max_tokens: 4096,
    temperature: 0.7,
    top_p: 1,
    anthropic_version: "bedrock-2023-05-31",  // 設定 Anthropic 版本
  };

  // 使用正確的模型 ID，例如 claude-3
  const command = new InvokeModelCommand({
    modelId: "anthropic.claude-3-haiku-20240307-v1:0",  // 根據你的情況更改此 ID
    body: JSON.stringify(input),
    contentType: "application/json",
    accept: "application/json",
  });

  try {
    const response = await client.send(command);
    // 檢查返回的 raw response 內容
    console.log("API 回應：", response);
    // 嘗試解析 body
  
    const body = JSON.parse(new TextDecoder().decode(response.body));

    const assistantMessage = body.content[0].text;
    chatHistory.push({ role: "assistant", content: assistantMessage }); // ✨ 把機器人回應也存起來！

    res.json({ text: assistantMessage });
  } catch (err) {
    console.error("錯誤：", err);
    res.status(500).json({ error: "呼叫 Bedrock 失敗" });
  }
});

app.listen(3001, () => {
  console.log("✅ 後端伺服器已啟動：http://localhost:3001");
});
