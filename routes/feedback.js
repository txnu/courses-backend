const router = require("express").Router();
const express = require("express");
const feedbackController = require("../controllers/feedbackController");
const multer = require("multer");

router.use(express.json());
const upload = multer();

router.post("/create", upload.none(), feedbackController.create);
router.get("/getall", feedbackController.getFeedback);
router.get("/getbyid/:feedbackId", feedbackController.getById);
router.put("/update/:feedbackId", upload.none(), feedbackController.update);
router.delete("/delete/:feedbackId", feedbackController.delete);

module.exports = router;
