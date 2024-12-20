const router = require("express").Router();
const registerValidation = require("../validation").registerValidation;
const loginValidation = require("../validation").loginValidation;
const User = require("../models").user;
const jwt = require("jsonwebtoken");

router.use((req, res, next) => {
  console.log("正在接收一個跟auth有關的請求");
  next();
});

router.get("/testAPI", (req, res) => {
  return res.send("成功連結auth route...");
});

router.post("/register", async (req, res) => {
  //確認數據是否符合規範
  let { error } = registerValidation(req.body);
  if (error) return res.status(400).send(error.details[0].message);

  // 確認信箱是否被註冊過
  const emailExist = await User.findOne({ email: req.body.email });
  if (emailExist) return res.status(400).send("此信箱已經被註冊過了。。。");

  // 製作新用戶
  let { email, username, password, role } = req.body;
  let newUser = new User({ email, username, password, role });
  try {
    let savedUser = await newUser.save();
    return res.send({
      msg: "使用者成功儲存。",
      savedUser,
    });
  } catch (e) {
    return res.status(500).send("無法儲存使用者。。。");
  }
});

const express = require("express");
const cors = require("cors");
const app = express();

// 配置 CORS 中間件
const corsOptions = {
  origin: "https://online-class-web.vercel.app", // 允許的前端域名
  methods: "GET,POST,PUT,DELETE", // 允許的 HTTP 方法
  allowedHeaders: "Content-Type,Authorization", // 允許的標頭
  credentials: true, // 如果需要發送 cookie 或授權頭
};

app.use(cors(corsOptions));

app.post("/login", async (req, res) => {
  try {
    // 確認數據是否符合規範
    const { error } = loginValidation(req.body);
    if (error)
      return res.status(400).json({ message: error.details[0].message });

    // 確認信箱是否被註冊過
    const foundUser = await User.findOne({ email: req.body.email });
    if (!foundUser) {
      return res
        .status(401)
        .json({ message: "無法找到使用者。請確認信箱是否正確。" });
    }

    // 比對密碼
    const isMatch = await new Promise((resolve, reject) => {
      foundUser.comparePassword(req.body.password, (err, match) => {
        if (err) return reject(err);
        resolve(match);
      });
    });

    if (!isMatch) {
      return res.status(401).json({ message: "密碼錯誤" });
    }

    // 製作 JSON Web Token
    const tokenObject = { _id: foundUser._id, email: foundUser.email };
    const token = jwt.sign(tokenObject, process.env.JWT_SECRET);

    return res.json({
      message: "成功登入",
      token: "JWT " + token,
      user: {
        _id: foundUser._id,
        email: foundUser.email,
        name: foundUser.name,
      },
    });
  } catch (err) {
    console.error("伺服器錯誤:", err);
    return res.status(500).json({ message: "伺服器發生錯誤，請稍後再試。" });
  }
});

// router.post("/login", async (req, res) => {
//   //確認數據是否符合規範
//   let { error } = loginValidation(req.body);
//   if (error) return res.status(400).send(error.details[0].message);

//   // 確認信箱是否被註冊過
//   const foundUser = await User.findOne({ email: req.body.email });
//   if (!foundUser) {
//     return res.status(401).send("無法找到使用者。請確認信箱是否正確。");
//   }

//   foundUser.comparePassword(req.body.password, (err, isMatch) => {
//     if (err) return res.status(500).send(err);

//     if (isMatch) {
//       // 製作json web token
//       const tokenObject = { _id: foundUser._id, email: foundUser.email };
//       const token = jwt.sign(tokenObject, process.env.PASSPORT_SECRET);
//       return res.send({
//         message: "成功登入",
//         token: "JWT " + token,
//         user: foundUser,
//       });
//     } else {
//       return res.status(401).send("密碼錯誤");
//     }
//   });
// });

module.exports = router;
