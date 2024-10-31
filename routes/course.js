const router = require("express").Router();
const express = require("express");
const courseController = require("../controllers/courseController");
const multer = require("multer");

router.use(express.json());
const upload = multer();

router.post("/create", upload.none(), courseController.create);
router.get("/getall", courseController.getCourses);
router.get("/getbyid/:courseId", courseController.getById);
router.put("/update/:courseId", upload.none(), courseController.update);
router.delete("/delete/:courseId", courseController.delete);

module.exports = router;
