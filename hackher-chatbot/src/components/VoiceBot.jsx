import { useState, useRef } from "react";
import Lottie from "lottie-react";
import happyAnimation from "../animations/happy.json";
import sadAnimation from "../animations/sad.json";
import neutralAnimation from "../animations/neutral.json";

// AWS SDK 引入
import { TranscribeStreamingClient, StartStreamTranscriptionCommand } from "@aws-sdk/client-transcribe-streaming";

let silenceTimer = null; // 靜音計時器
let restartTimer = null;

// IAM 認證資訊 (注意：不要在公開的客戶端代碼中暴露這些憑證)
const accessKeyId = "";
const secretAccessKey = "";
const region = "us-west-2";  // 替換為你的 AWS 地區

export default function VoiceBot() {
  const [emotion, setEmotion] = useState("neutral");
  const [transcript, setTranscript] = useState(""); // 新增語音文字
  const [listening, setListening] = useState(false); // 語音辨識狀態
  const recognitionRef = useRef(null); // 語音辨識元件

  const animations = {
    happy: happyAnimation,
    sad: sadAnimation,
    neutral: neutralAnimation,
  };

  // AWS Transcribe 服務設定
  const client = new TranscribeStreamingClient({
    region,
    credentials: {
      accessKeyId,
      secretAccessKey,
    },
  });

  // 開始語音辨識
  const startListening = async () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("此瀏覽器不支援語音辨識 😢");
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = "zh-TW"; // 你可以更改為其他語言
    recognition.interimResults = true;
    recognition.continuous = true;

    recognition.onstart = () => setListening(true); // 開始語音辨識
    recognition.onend = () => setListening(false);  // 結束語音辨識

    recognition.onstart = () => {
      setListening(true);
      console.log("🎤 語音辨識已啟動");
    };
    recognition.onend = () => {
      setListening(false);
      console.log("🛑 語音辨識已結束");
      clearTimeout(silenceTimer); // 停止計時器

      // 等一段時間後自動重啟（例如：1 秒）
      restartTimer = setTimeout(() => {
        console.log("🔄 自動重啟語音辨識...");
        startListening();
      }, 1000);
    };

    recognition.onresult = async (event) => {
      const text = event.results[0][0].transcript;
      console.log("語音辨識結果：", text); // 印出語音辨識結果

      // 顯示空字串時顯示 "空的"
      if (text.trim() === "") {
        setTranscript("空的");
      } else {
        setTranscript(text);
      }

      // 情緒判斷邏輯
      if (text.includes("開心") || text.includes("快樂")) setEmotion("happy");
      else if (text.includes("難過") || text.includes("不爽")) setEmotion("sad");
      else setEmotion("neutral");

      // 🔁 重設靜音計時器
      clearTimeout(silenceTimer);
      silenceTimer = setTimeout(() => {
        console.log("⏱️ 1.5 秒未說話，自動停止語音辨識");
        stopListening(); // 自動停止
      }, 1500);

      recognitionRef.current = recognition;
      recognition.start();
    

      // 使用 AWS Transcribe 的 Streaming API
      const params = {
        LanguageCode: "zh-TW", // 設定語言
        MediaSampleRateHertz: 16000,
        MediaEncoding: "pcm", // 設定音頻格式
        AudioStream: new ReadableStream({
          start(controller) {
            const reader = new FileReader();
            reader.onload = () => {
              controller.enqueue(reader.result); // 將音訊流傳送給 AWS Transcribe
            };
            reader.readAsArrayBuffer(event.results[0][0].audio);
          }
        })
        
      };

      try {
        // 發送語音流至 Transcribe
        const command = new StartStreamTranscriptionCommand(params);
        const response = await client.send(command);
        console.log("Transcribe Response: ", response);
      } catch (error) {
        console.error("Transcribe Error: ", error);
      }
    };

    recognitionRef.current = recognition;
    recognition.start();
  };

  // 停止語音辨識
  const stopListening = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();  // 停止語音辨識
      clearTimeout(silenceTimer);
      clearTimeout(restartTimer);
      setListening(false);  // 更新狀態為停止
      
    }
  };

  return (
    <div className="flex flex-col items-center gap-4">
      <Lottie animationData={animations[emotion]} style={{ height: 200 }} />
      
      {/* 語音輸入按鈕 */}
      <button
        onClick={listening ? stopListening : startListening}
        className="bg-purple-400 text-white px-4 py-2 rounded"
      >
        🎤 {listening ? "聆聽中" : "開始語音輸入"}
      </button>

      {/* 顯示語音辨識結果 */}
      <p className="mt-2 text-lg text-gray-700">📝 {transcript}</p>

      <div className="flex gap-2">
        <button onClick={() => setEmotion("happy")} className="bg-green-300 px-4 py-2 rounded">😊 Happy</button>
        <button onClick={() => setEmotion("neutral")} className="bg-gray-300 px-4 py-2 rounded">😐 Neutral</button>
        <button onClick={() => setEmotion("sad")} className="bg-blue-300 px-4 py-2 rounded">😢 Sad</button>
      </div>
    </div>
  );
}
