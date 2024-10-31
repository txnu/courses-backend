const router = require("express").Router();
const express = require("express");
const userController = require("../controllers/userController");
const multer = require("multer");

router.use(express.json());
const upload = multer();

router.get("/getall", userController.getUsers);
router.post("/register", upload.none(), userController.register);
router.post("/login", upload.none(), userController.login);

module.exports = router;
