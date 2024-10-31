const router = require("express").Router();
const express = require("express");
const categoryController = require("../controllers/categoryController");
const multer = require("multer");

router.use(express.json());
const upload = multer();

router.post("/create", upload.none(), categoryController.create);
router.get("/getall", categoryController.getCategories);
router.get("/getbyid/:categoryId", categoryController.getById);
router.put("/update/:categoryId", upload.none(), categoryController.update);
router.delete("/delete/:categoryId", categoryController.delete);

module.exports = router;
