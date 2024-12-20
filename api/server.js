const express = require("express");
const serverless = require("serverless-http");
const mongoose = require("mongoose");
const dotenv = require("dotenv");
const passport = require("passport");
const cors = require("cors");
const bcrypt = require("bcrypt");

dotenv.config();

// 創建 Express 應用
const app = express();

// 設置 Passport
require("../config/passport")(passport);

const corsOptions = {
  origin: [
    "https://online-class-mkijdwl6a-vuannnnns-projects.vercel.app",
    "https://online-class-web.vercel.app",
    "https://online-class-web-git-main-vuannnnns-projects.vercel.app",
  ],
  methods: ["GET", "POST", "PUT", "DELETE"],
  allowedHeaders: ["Content-Type", "Authorization", "Other-Custom-Header"], // 添加其他自定義頭部
  credentials: true, // 確保允許攜帶憑證（例如 cookies 或 token）
};

mongoose.set("strictQuery", false); // 或者 true，根據你的需求選擇

let isConnected = false; // 跟踪 MongoDB 是否已經連接

// 連接 MongoDB
mongoose
  .connect(
    "mongodb+srv://wowo94440:<password>@onlineclass.g1jmm.mongodb.net/?retryWrites=true&w=majority&appName=OnlineClass",
    {
      serverSelectionTimeoutMS: 10000, // 設置超時為 5 秒
    }
  )
  .then(() => {
    console.log("成功連接到 MongoDB...");
  })
  .catch((e) => {
    console.error("連接錯誤:", e);
  });

// 使用中介軟體
app.use(cors(corsOptions));
app.options("*", cors(corsOptions)); // 允許所有的 OPTIONS 請求
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 引入路由
const { auth } = require("./auth");
// 設置路由
app.use("/api/user", auth);
app.use(
  "/api/courses",
  passport.authenticate("jwt", { session: false }),
  course
);

// 手動設置 CORS 標頭（防止某些情況下自動設置失敗）
// app.use((req, res, next) => {
//   res.header("Access-Control-Allow-Origin", corsOptions.origin.join(", "));
//   res.header("Access-Control-Allow-Methods", corsOptions.methods.join(", "));
//   res.header(
//     "Access-Control-Allow-Headers",
//     corsOptions.allowedHeaders.join(", ")
//   );
//   res.header("Access-Control-Allow-Credentials", corsOptions.credentials);
//   next();
// });

// 包裝成 Lambda 函數
module.exports.handler = serverless(app, {
  callbackWaitsForEmptyEventLoop: false, // 防止 Lambda 等待未完成的事件循環
});
