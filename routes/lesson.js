const router = require("express").Router();
const express = require("express");
const lessonController = require("../controllers/lessonController");
const multer = require("multer");

router.use(express.json());
const upload = multer();

router.post("/create", upload.none(), lessonController.create);
router.get("/getall", lessonController.getLessons);
router.get("/getbyid/:lessonId", lessonController.getById);
router.put("/update/:lessonId", upload.none(), lessonController.update);
router.delete("/delete/:lessonId", lessonController.delete);

module.exports = router;
