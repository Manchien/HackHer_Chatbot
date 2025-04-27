# HackHer_Chatbot

aws genAI黑客松

### 步驟一：設定 AWS CLI

> 若沒有AWS CLI需先下載

```
aws configure
```

```
AWS Access Key ID [None]: YOUR_ACCESS_KEY
AWS Secret Access Key [None]: YOUR_SECRET_KEY
Default region name [None]: us-west-2
Default output format [None]: json
```

### 步驟二：啟動環境

```
git clone https://github.com/Manchien/HackHer_Chatbot.git
cd HackHer_Chatbot
```

* 前端：

```
cd hackher-chatbot
npm rum dev
```

* 後端：

```
node index.js
```

* 本機執行： http://localhost:5173/

### 使用事項：

啟動請說：`Energy,啟動對話模式`

打斷請說：`等一下` 、`暫停` 、直接說其他話打斷

結束請說：`結束對話模式`

### 注意事項：

1. 頁面重新整理後，由於網頁語音限制，需先點擊一次螢幕後才可說話
2. 有些設備聲音可能會有麥克風直接收到喇叭聲音的情況，建議戴耳機
3. 環境吵雜，機器人敏感，可能會被一直打斷
