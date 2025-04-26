// // bedrock-test.js
// const {
//     BedrockRuntimeClient,
//     InvokeModelCommand,
//   } = require("@aws-sdk/client-bedrock-runtime");
  
// //   const client = new BedrockRuntimeClient({
// //     region: "us-west-2",
// //     credentials: {
// //       accessKeyId: "你的ACCESS_KEY",      // <-- 記得替換
// //       secretAccessKey: "你的SECRET_KEY",  // <-- 記得替換
// //     },
// //   });
  
//   async function main() {
//     const input = {
//       prompt: "\n\nHuman: 用一句話說明台灣的小吃文化\n\nAssistant:",
//       max_tokens_to_sample: 300,
//       temperature: 0.7,
//       top_k: 250,
//       top_p: 1,
//       stop_sequences: ["\n\nHuman:"],
//     };
  
//     const command = new InvokeModelCommand({
//       modelId: "anthropic.claude-3-haiku-20240307-v1:0",
//       contentType: "application/json",
//       accept: "application/json",
//       body: JSON.stringify(input),
//     });
  
//     try {
//       const response = await client.send(command);
//       const responseBody = JSON.parse(new TextDecoder().decode(response.body));
//       console.log("結果：", responseBody.completion);
//     } catch (err) {
//       console.error("錯誤：", err);
//     }
//   }
  
//   main(); // 記得執行
  