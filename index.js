const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");

const mongoose = require("mongoose");

//import routes
const signup = require("./routes/signup");
const login = require("./routes/login");
const me = require("./routes/me");

const app = express();
app.use(cors());
app.use(bodyParser.json());
mongoose.connect("mongodb://localhost:27017/test-auth", {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});
app.get("/", (req, res) => {
  res.json({ message: "API is working" });
});

app.use(signup);
app.use(login);
app.use(me);

app.listen(3010, (req, res) => {
  console.log("server started at port 3010");
});
