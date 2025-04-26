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
const exampleMessages = require("./training/exampleMessages.json");

app.use(cors());
app.use(bodyParser.json());

// 設定 AWS IAM 憑證
AWS.config.update({
  accessKeyId: "",
  secretAccessKey: "",
  region: "us-west-2",
});

const s3 = new AWS.S3();
const chatHistory = [
  {
    role: "user",
    content: [
      {
        type: "text",
        text: `你的設定：你的名字叫做Energy，EnerBot 這個名稱靈感來自於「Energy Industry 能量產業」，石化製造屬於一種能量產業。名稱中的「Energy」象徵著能量與活力，你的外表是綠色的火焰，象徵能量的同時又不忘記節能，EnerBot 不僅希望激發員工的效能與活力，同時期望長春集團石化製造在台灣作為能量(energy)供應的象徵。你是個有智慧的助手，回答問題時請詳細且清楚。`
      }
      //, ...exampleMessages
    ]
  }
];

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

  const refinedUserInput = `\n\n請用簡短（50字內）、專業且人性化的方式回答。回答時避免冗長與過多解釋。`;
  chatHistory.push({ role: "user", content: refinedUserInput });

  const input = {
    messages: chatHistory,
    max_tokens: 300,
    temperature: 0.8,
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
    // console.log("API 回應：", response);
    // 嘗試解析 body
    
    const body = JSON.parse(new TextDecoder().decode(response.body));
    console.log("解析後的 body：", body);

    let assistantMessage = "";
    if (body?.content && Array.isArray(body.content) && body.content.length > 0) {
      assistantMessage = body.content[0].text || "";
    } else {
      console.error("Claude回傳格式異常：", body);
      assistantMessage = "很抱歉，目前無法取得回覆內容。";
    }

    chatHistory.push({ role: "assistant", content: assistantMessage }); // ✨ 把機器人回應也存起來！
    console.log("🤖 Claude 回應：", assistantMessage) ;
    res.json({ text: assistantMessage });
  } catch (err) {
    console.error("錯誤：", err);
    res.status(500).json({ error: "呼叫 Bedrock 失敗" });
  }
});


const polly = new AWS.Polly({
  region: "us-west-2", // 你選擇的 region
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
});

app.post("/polly", async (req, res) => {
  const { text } = req.body;
  const params = {
    OutputFormat: "mp3",
    Text: text,
    VoiceId: "Zhiyu", // 中文女聲（也可以換成 MIZUKI, Matthew 之類的）
    LanguageCode: "cmn-CN",
  };

  try {
    const data = await polly.synthesizeSpeech(params).promise();
    res.set({
      "Content-Type": "audio/mpeg",
      "Content-Length": data.AudioStream.length,
    });
    res.send(data.AudioStream);
  } catch (err) {
    console.error("Polly error:", err);
    res.status(500).send("Polly 合成失敗");
  }
});

app.listen(3001, () => {
  console.log("✅ 後端伺服器已啟動：http://localhost:3001");
});
