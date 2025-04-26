const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
require("dotenv").config();

const app = express();
app.use(cors());
app.use(bodyParser.json());

// 路由引入
const uploadRoute = require("./routes/upload");
app.use("/upload", uploadRoute);

app.listen(3001, () => {
  console.log("✅ 後端伺服器已啟動：http://localhost:3001");
});
