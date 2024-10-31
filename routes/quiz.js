const router = require("express").Router();
const express = require("express");
const quizController = require("../controllers/quizController");
const multer = require("multer");

router.use(express.json());
const upload = multer();

router.post("/create", upload.none(), quizController.create);
router.get("/getall", quizController.getQuizzes);
router.get("/getbyid/:quizId", quizController.getById);
router.put("/update/:quizId", upload.none(), quizController.update);
router.delete("/delete/:quizId", quizController.delete);

//Question
router.post("/create_question", upload.none(), quizController.createQuestion);
router.get("/getall_question", quizController.getQuestions);
router.get("/getbyid_question/:questionId", quizController.getQuestionById);
router.put("/update_question/:questionId", quizController.updateQuestion);
router.delete("/delete_question/:questionId", quizController.deleteQuestion);

module.exports = router;
