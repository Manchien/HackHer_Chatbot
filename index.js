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

// 上傳文字到 S3
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
    console.error("❌ S3 上傳錯誤", err);
    res.status(500).json({ message: "S3 上傳失敗" });
  }
});

// 聊天接口
app.post("/chat", async (req, res) => {
  const userInput = req.body.prompt;

  const messages = [
    { role: "user", content: userInput },
  ];

  const input = {
    messages: messages,
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
    
    

    const responseBody = JSON.parse(new TextDecoder().decode(response.body));
    
    console.log("回應的內容：", responseBody);
    
    // 根據 API 的結構，這裡假設 responseBody 會包含一個 'choices' 陣列
    if (responseBody && responseBody.content && responseBody.content[0] && responseBody.content[0].text) {
      const reply = responseBody.content[0].text;  // 提取文本
      res.json({ text: reply });
    } else {
      res.status(500).json({ error: "無效的回應結構" });
    }
  } catch (err) {
    console.error("錯誤：", err);
    res.status(500).json({ error: "呼叫 Bedrock 失敗" });
  }
});

app.listen(3001, () => {
  console.log("✅ 後端伺服器已啟動：http://localhost:3001");
});
