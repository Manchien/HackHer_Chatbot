import { useState, useRef } from "react";
import Lottie from "lottie-react";
import happyAnimation from "../animations/happy.json";
import sadAnimation from "../animations/sad.json";
import neutralAnimation from "../animations/neutral.json";

export default function VoiceBot() {
  const [emotion, setEmotion] = useState("neutral");
  const [transcript, setTranscript] = useState("");
  const [listening, setListening] = useState(false);
  const recognitionRef = useRef(null);
  const transcriptRef = useRef(""); // 用來儲存語音辨識過程中的所有文字

  const animations = {
    happy: happyAnimation,
    sad: sadAnimation,
    neutral: neutralAnimation,
  };

  const startListening = async () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("此瀏覽器不支援語音辨識 😢");
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = "zh-TW";
    recognition.interimResults = true;
    recognition.continuous = true;

    recognition.onstart = () => setListening(true);
    recognition.onend = () => {
      setListening(false);
      handleUpload(); // 當結束錄音時，上傳資料
    };

    recognition.onresult = (event) => {
      const text = event.results[0][0].transcript;
      console.log("語音辨識結果：", text);

      // 將所有的語音辨識結果累加
      transcriptRef.current = event.results[0][0].transcript;

      if (text.trim() === "") {
        setTranscript("空的");
      } else {
        setTranscript(transcriptRef.current);
      }

      // 情緒判斷邏輯
      if (text.includes("開心") || text.includes("快樂")) setEmotion("happy");
      else if (text.includes("難過") || text.includes("不爽")) setEmotion("sad");
      else setEmotion("neutral");
    };

    recognitionRef.current = recognition;
    recognition.start();
  };

  const stopListening = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      setListening(false);
    }
  };

  // 上傳語音辨識結果
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

  return (
    <div className="flex flex-col items-center gap-4">
      <Lottie animationData={animations[emotion]} style={{ height: 200 }} />

      <button
        onClick={listening ? stopListening : startListening}
        className="bg-purple-400 text-white px-4 py-2 rounded"
      >
        🎤 {listening ? "結束語音輸入" : "開始語音輸入"}
      </button>

      <p className="mt-2 text-lg text-gray-700">📝 {transcript}</p>

      <div className="flex gap-2">
        <button onClick={() => setEmotion("happy")} className="bg-green-300 px-4 py-2 rounded">😊 Happy</button>
        <button onClick={() => setEmotion("neutral")} className="bg-gray-300 px-4 py-2 rounded">😐 Neutral</button>
        <button onClick={() => setEmotion("sad")} className="bg-blue-300 px-4 py-2 rounded">😢 Sad</button>
      </div>
    </div>
  );
}
