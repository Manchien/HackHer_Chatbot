import { useState, useRef } from "react";
import Lottie from "lottie-react";
import happyAnimation from "../animations/happy.json";
import sadAnimation from "../animations/sad.json";
import neutralAnimation from "../animations/neutral.json";
let silenceTimer = null; // 靜音計時器
let restartTimer = null;
export default function VoiceBot() {
  const [emotion, setEmotion] = useState("neutral");
  const [transcript, setTranscript] = useState("");
  const [aiReply, setAiReply] = useState(""); // 新增 AI 回應
  const [listening, setListening] = useState(false);
  const recognitionRef = useRef(null);
  const transcriptRef = useRef("");

  const animations = {
    happy: happyAnimation,
    sad: sadAnimation,
    neutral: neutralAnimation,
  };

  const startListening = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("此瀏覽器不支援語音辨識 😢");
      return;
    }
  
    const recognition = new SpeechRecognition();
    recognition.lang = "zh-TW";
    recognition.interimResults = false;  // 改這裡
    recognition.continuous = false;      // 改這裡，說完就停 → 方便觸發處理邏輯
  
    recognition.onstart = () => setListening(true);
  
    recognition.onresult = async (event) => {
      const text = event.results[0][0].transcript;
      transcriptRef.current = text;
      setTranscript(text);
  
      // 情緒判斷
      if (text.includes("開心") || text.includes("快樂")) setEmotion("happy");
      else if (text.includes("難過") || text.includes("不爽")) setEmotion("sad");
      else setEmotion("neutral");
  
      // 傳給 Claude
      const response = await sendMessageToBedrock(text);
      setAiReply(response);
  
      // Claude 回答完再重新啟動語音辨識
      setTimeout(() => {
        startListening();
      }, 500);
    };
  
    recognition.onerror = (e) => {
      console.error("❌ 語音錯誤", e);
      setListening(false);
    };
  
    recognition.onend = () => {
      setListening(false);  // 等 result 結束後會自動再開始
    };
  
    recognitionRef.current = recognition;
    recognition.start();
  };

  const stopListening = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      clearTimeout(silenceTimer);
      clearTimeout(restartTimer);
      setListening(false);
    }
  };

  const handleUpload = async () => {
    try {
      const response = await fetch("http://localhost:3001/upload", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: transcriptRef.current }),
      });
      const data = await response.json();
      console.log("儲存成功：", data);
    } catch (error) {
      console.error("上傳錯誤", error);
    }
  };

  const sendMessageToBedrock = async (message) => {
    const res = await fetch("http://localhost:3001/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ prompt: message }),
    });
    const data = await res.json();
    return data.text;
  };

  return (
    <div className="flex flex-col items-center gap-4 p-4 max-w-lg mx-auto">
      <Lottie animationData={animations[emotion]} style={{ height: 200 }} />

      <button
        onClick={listening ? stopListening : startListening}
        className="bg-purple-500 hover:bg-purple-600 text-white px-4 py-2 rounded-lg transition"
      >
        🎤 {listening ? "結束語音輸入" : "開始語音輸入"}
      </button>

      <div className="mt-4 w-full bg-gray-100 p-4 rounded shadow text-left">
        <p className="text-sm text-gray-500">🎙️ 語音輸入：</p>
        <p className="text-lg text-gray-800">{transcript}</p>
      </div>

      <div className="w-full bg-white p-4 rounded shadow text-left">
        <p className="text-sm text-gray-500">🤖 AI 回應：</p>
        <p className="text-lg text-green-700">{aiReply}</p>
      </div>

      <div className="flex gap-2 mt-2">
        <button onClick={() => setEmotion("happy")} className="bg-green-300 px-4 py-2 rounded">😊 Happy</button>
        <button onClick={() => setEmotion("neutral")} className="bg-gray-300 px-4 py-2 rounded">😐 Neutral</button>
        <button onClick={() => setEmotion("sad")} className="bg-blue-300 px-4 py-2 rounded">😢 Sad</button>
      </div>
    </div>
  );
}
