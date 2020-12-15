const express = require("express");
const bcrypt = require("bcryptjs");
const User = require("../users/users-model");
const router = express.Router();

const checkPayload = (req, res, next) => {
  if (!req.body.username || !req.body.password) {
    res.status(401).json("bad payload");
  } else {
    next();
  }
};
const checkUsernameUnique = async (req, res, next) => {
  try {
    const rows = await User.findBy({ username: req.body.username });
    if (!rows.length) {
      next();
    } else {
      res.status(401).json("username taken");
    }
  } catch (err) {
    res.status(500).json("something failed tragically");
  }
};
const checkUsernameExists = async (req, res, next) => {
  try {
    const rows = await User.findBy({ username: req.body.username });
    if (rows.length) {
      req.userData = rows[0];
      next();
    } else {
      res.status(401).json("who is that exactly?");
    }
  } catch (err) {
    res.status(500).json("something failed tragically");
  }
};

router.post(
  "/register",
  checkPayload,
  checkUsernameUnique,
  async (req, res) => {
    console.log("registering");
    try {
      const hash = bcrypt.hashSync(req.body.password, 10);
      const newUser = await User.add({
        username: req.body.username,
        password: hash,
      });
      res.status(201).json(newUser);
    } catch (e) {
      res.status(500).json({ message: e.message });
    }
  }
);
router.post("/login", checkPayload, checkUsernameExists, (req, res) => {
  try {
    console.log("logging in");
    const verifies = bcrypt.compareSync(
      req.body.password,
      req.userData.password
    );
    if (verifies) {
      console.log("we should save a session for this user");
      req.session.user = req.userData;
      res.json(`Welcome back, ${req.userData.username}`);
    } else {
      res.status(401).json("bad credentials");
    }
  } catch (e) {
    res.status(500).json("something failed tragically");
  }
});
router.get("/logout", (req, res) => {
  if (req.session) {
    req.session.destroy((err) => {
      if (err) {
        res.json("you can not leave");
      } else {
        res.json("goodbye");
      }
    });
  } else {
    res.json("there was no session");
  }
});

module.exports = router;
