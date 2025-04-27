import { useState, useRef, useEffect } from "react";
import Lottie from "lottie-react";
import happyAnimation from "../animations/happy.json";
import sadAnimation from "../animations/sad.json";
import neutralAnimation from "../animations/neutral.json";
import talkAnimation from "../animations/talk.json";
import thinkAnimation from "../animations/think.json";
import angryAnimation from "../animations/angry.json";

let silenceTimer = null;
let restartTimer = null;
let flag = 0; // 0: 停止, 1: 開始
export default function VoiceBot() {
  const [emotion, setEmotion] = useState("neutral");
  const [transcript, setTranscript] = useState("");
  const [aiReply, setAiReply] = useState("");
  const [listening, setListening] = useState(false);
  const [activated, setActivated] = useState(false); // 👉 加一個是否啟動的狀態
  const recognitionRef = useRef(null);
  const transcriptRef = useRef("");
  // const activatedRef = useRef(false);

  const animations = {
    happy: happyAnimation,
    sad: sadAnimation,
    neutral: neutralAnimation,
    talk: talkAnimation,
    think: thinkAnimation,
    angry:angryAnimation,
  };

  const startListening = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("此瀏覽器不支援語音辨識 😢");
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = "zh-TW";
    recognition.interimResults = false;
    recognition.continuous = true;

    // recognition.onstart = () => setListening(true);

    recognition.onresult = async (event) => {
      const text = event.results[0][0].transcript.trim();
      // const speechResult = event.results[0][0].transcript.trim();
      transcriptRef.current = text;
      console.log("🎙️ 辨識到：", text);

      const lowerSpeech = text.toLowerCase(); // 小寫比較好判斷
       // ➡️ 判斷是不是暫停
      if (lowerSpeech.includes("等一下") || lowerSpeech.includes("暫停")) {
        stopPolly();
        setTranscript("⏸️ 暫停播放");
        setEmotion("angry");
        startListening();
        return; // 不繼續後面的送出流程
      }

      // 👉 判斷是否啟動或結束
      if (text.toLowerCase() === "energy啟動對話模式") {
        console.log("⚡ Energy Power Up - 啟動對話模式");
        
        // setActivated(true);
        // activatedRef.current = true;
        flag = 1; // 開始
        // console.log("1activatedRef.current", activatedRef.current);
        setTranscript("⚡ 啟動對話模式！");
        
        setTimeout(() => {
            startListening(); // 等 300ms 確保 activated = true
        }, 300);
    
        return;
     }
    

      if (text.toLowerCase() === "結束對話模式") {
        // setActivated(false);
        // activatedRef.current = false;
        // console.log("2activatedRef.current", activatedRef.current);
        flag = 0; // 停止
        stopPolly();
        console.log("🛑 Energy Power Down - 結束對話模式");
        setTranscript("🛑 結束對話模式！");
        setTimeout(startListening, 500);
        return;
      }

      console.log("1flag", flag);
      stopPolly();
      // 如果沒啟動，不處理對話
      if (flag == 0) {
        console.log("flag", flag);
        console.log("🧏 尚未啟動，忽略其他語音");
        setTimeout(startListening, 500);
        return;
      }
      
      // 如果啟動了，正常流程
      
      setTranscript(text);
      

      // 情緒判斷
      if (text.includes("開心") || text.includes("快樂")) setEmotion("happy");
      else if (text.includes("難過") || text.includes("不爽")) setEmotion("sad");
      else setEmotion("neutral");

      // 傳給 Claude
      const response = await sendMessageToBedrock(text);
      setAiReply(response);

      // 回答完再重新啟動聆聽
      setTimeout(() => {
        try {
          startListening();
        } catch (error) {
          console.error("重新啟動語音辨識失敗：", error);
        }
      }, 500);
    };

    recognition.onerror = (e) => {
      console.error("語音錯誤(可忽略)，未偵測到說話", e);
      setListening(false);
    
      if (e.error === "no-speech") {
        console.log("⚡ 沒聽到說話，自動重新啟動錄音...");
        setTimeout(() => {
          startListening();
        }, 500); // 0.5 秒後重啟
      }
    };

    recognition.onend = () => {
      setListening(false);
    };

    recognitionRef.current = recognition;
    recognition.start();
  };

  // const stopListening = () => {
  //   if (recognitionRef.current) {
  //     recognitionRef.current.stop();
  //     clearTimeout(silenceTimer);
  //     clearTimeout(restartTimer);
  //     setListening(false);
  //   }
  // };

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
    const replyText = data.text;
    setEmotion("talk");
    console.log("🤖 Claude 回應：", replyText);

    await playPolly(replyText);

    return replyText;
  };

  let currentAudio = null;

const playPolly = async (text) => {
  try {
    // 先停掉正在播放的
    if (currentAudio) {
      currentAudio.pause();
      currentAudio.currentTime = 0;
      currentAudio.src = "";
      currentAudio = null;
    }

    // 叫 API 拿新的語音
    const res = await fetch("http://localhost:3001/polly", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text }),
    });
    const audioBlob = await res.blob();
    const audioUrl = URL.createObjectURL(audioBlob);

    // 播放新的語音
    const audio = new Audio(audioUrl);
    currentAudio = audio; // **這次新的 audio 要存起來！**
    await currentAudio.play();
    console.log("🔊 Polly 播放中...");
    
  } catch (error) {
    console.error("Polly 播放失敗：", error);
  }
};

const stopPolly = () => {
  if (currentAudio) {
    currentAudio.pause();
    currentAudio.currentTime = 0;
    currentAudio.src = ""; 
    currentAudio = null;
    console.log("🛑 Polly 播放中斷");
  }
};


  useEffect(() => {
    startListening();
    return () => {
      // stopListening();
    };
  }, []);

  return (
    <div className="flex flex-col items-center gap-4 p-4 max-w-lg mx-auto">
      <Lottie animationData={animations[emotion]} style={{ height: 500 }} />

      {/* <button
        onClick={listening ? stopListening : startListening}
        className="bg-purple-500 hover:bg-purple-600 text-white px-4 py-2 rounded-lg transition"
      >
        🎤 {listening ? "結束語音輸入" : "開始語音輸入"}
      </button> */}

      {/* <div className="mt-4 w-full bg-gray-100 p-4 rounded shadow text-left">
        <p className="text-sm text-gray-500">🎙️ 語音輸入：</p>
        <p className="text-lg text-gray-800">{transcript}</p>
      </div>

      <div className="w-full bg-white p-4 rounded shadow text-left">
        <p className="text-sm text-gray-500">🤖 AI 回應：</p>
        <p className="text-lg text-green-700">{aiReply}</p>
      </div> */}
    </div>
  );
}
