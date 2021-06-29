const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const router = express.Router();
const User = require("../model/User");

router.post("/signup", async (req, res) => {
  console.log("now in /signup 😈");
  if (req.body.username && req.body.email && req.body.password) {
    const { username, email, password } = req.body;
    try {
      let user = await User.findOne({ email });
      if (user) {
        return res.status(400).json({
          message: "User Already Exists",
        });
      }
      let newUser = new User({
        username,
        email,
        password,
      });

      const salt = await bcrypt.genSalt(10);

      newUser.password = await bcrypt.hash(password, salt);
      await newUser.save();
      const payload = {
        user: {
          id: newUser.id,
        },
      };
      jwt.sign(
        payload,
        "randomString",
        {
          expiresIn: 10000,
        },
        (err, token) => {
          if (err) throw err;
          res.status(200).json({ token });
        }
      );
    } catch (error) {
      console.log(error.message);
      res.status(500).send("Error in saving");
    }
  } else {
    res.status(400).json({
      message: "information missing",
    });
  }
});

module.exports = router;
