// const firebase = require("firebase/app");
const express = require("express");
const app = express();
const cors = require("cors");
// require("firebase/database");

var admin = require("firebase-admin");

var serviceAccount = require("./serviceAccountKey.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  // databaseURL:
  //   "https://quiz-f0289-default-rtdb.asia-southeast1.firebasedatabase.app",
});

app.use(express.json());
app.use(cors());
app.use(express.urlencoded({ extended: true }));

app.use("/user", require("./routes/user"));
app.use("/course", require("./routes/course"));
app.use("/quiz", require("./routes/quiz"));
app.use("/feedback", require("./routes/feedback"));
app.use("/lesson", require("./routes/lesson"));
app.use("/category", require("./routes/category"));

app.listen(5001, () => {
  console.log("Berhasil terhubung ke Firestore");
});
