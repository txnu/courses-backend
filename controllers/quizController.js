const admin = require("firebase-admin");

exports.create = async (req, res) => {
  try {
    const { courseId, title, totalMarks } = req.body;
    const db = admin.firestore();

    const quizRef = db.collection("quizes");

    const quizSnapshot = await quizRef
      .orderBy("quizNumber", "desc")
      .limit(1)
      .get();

    let lastQuizNumber = 0;

    if (!quizSnapshot.empty) {
      const lastDoc = quizSnapshot.docs[0];
      lastQuizNumber = lastDoc.data().quizNumber;
    }
    const newQuizNumber = lastQuizNumber + 1;
    const newQuizId = `Quiz${newQuizNumber}`;

    const courseRef = db.collection("courses").doc(courseId);
    const courseSnapshot = await courseRef.get();
    if (!courseSnapshot.exists) {
      console.log(`Course not found for ID: ${courseId}`);
      return res.status(400).json({
        status: false,
        message: "Course Not Found",
      });
    }

    await quizRef.doc(newQuizId).set({
      quizNumber: newQuizNumber,
      title: title,
      totalMarks: totalMarks,
      courseId: courseId,
    });

    res.status(201).json({
      success: true,
      message: "Quiz created successfully",
      quizId: newQuizId,
    });
  } catch (error) {
    console.error("Error creating Course:", error);
    res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
};

exports.getQuizzes = async (req, res) => {
  try {
    const db = admin.firestore();
    const quizRef = db.collection("quizes");
    const quizSnapshot = await quizRef.get();

    if (quizRef.empty) {
      return res.status(404).json({
        success: false,
        message: "No Quiz found",
      });
    }

    let quizes = [];

    for (const doc of quizSnapshot.docs) {
      const quizData = doc.data();

      const courseRef = db.collection("courses").doc(quizData.courseId);
      const courseSnapshot = await courseRef.get();

      quizes.push({
        quizId: doc.id,
        course: courseSnapshot.exists ? courseSnapshot.data() : null,
        title: quizData.title,
        totalMarks: quizData.totalMarks,
      });
    }

    res.status(200).json({
      success: true,
      data: quizes,
    });
  } catch (error) {
    console.error("Error fetching quizes:", error);
    res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
};

exports.getById = async (req, res) => {
  try {
    const { quizId } = req.params;
    const db = admin.firestore();
    const quizRef = db.collection("quizes").doc(quizId);
    const quizSnapshot = await quizRef.get();

    if (!quizSnapshot.exists) {
      return res.status(404).json({
        success: false,
        message: "Quiz not found",
      });
    }

    const quizData = quizSnapshot.data();

    const courseRef = db.collection("courses").doc(quizData.courseId);
    const courseSnapshot = await courseRef.get();

    res.status(200).json({
      success: true,
      data: {
        quizId: quizSnapshot.id,
        title: quizData.title,
        totalMarks: quizData.totalMarks,
        course: courseSnapshot.exists ? courseSnapshot.data() : null,
      },
    });
  } catch (error) {
    console.error("Error fetching quiz by ID:", error);
    res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
};

exports.update = async (req, res) => {
  try {
    const { quizId } = req.params;
    const { courseId, title, totalMarks } = req.body;
    const db = admin.firestore();
    const quizRef = db.collection("quizes").doc(quizId);
    const quizSnapshot = await quizRef.get();

    if (!quizSnapshot.exists) {
      return res.status(404).json({
        success: false,
        message: "Quiz not found",
      });
    }

    const existingQuiz = quizSnapshot.data();

    const updatedData = {
      courseId: courseId !== undefined ? courseId : existingQuiz.courseId,
      title: title !== undefined ? title : existingQuiz.title,
      totalMarks:
        totalMarks !== undefined ? totalMarks : existingQuiz.totalMarks,
    };

    await quizRef.update(updatedData);

    res.status(200).json({
      success: true,
      message: "Quiz updated successfully",
      data: updatedData,
    });
  } catch (error) {
    console.error("Error updating quiz by ID:", error);
    res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
};

exports.delete = async (req, res) => {
  try {
    const { quizId } = req.params;
    const db = admin.firestore();
    const quizRef = db.collection("quizes").doc(quizId);
    const quizSnapshot = await quizRef.get();

    if (!quizSnapshot.exists) {
      return res.status(404).json({
        success: false,
        message: "Quiz not found",
      });
    }

    await quizRef.delete();

    res.status(200).json({
      success: true,
      message: "Quiz deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting quiz by ID:", error);
    res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
};

// QESTIONS

exports.createQuestion = async (req, res) => {
  try {
    const answerOptions = JSON.parse(req.body.answerOptions);
    const { quizId, questionText, correctAnswer } = req.body;

    if (!quizId) {
      return res.status(400).json({
        status: false,
        message: "Quiz ID is required",
      });
    }
    const db = admin.firestore();

    const questionRef = db.collection("quiz-questions");

    const questionSnapshot = await questionRef
      .orderBy("questionNumber", "desc")
      .limit(1)
      .get();

    let lastQuestionNumber = 0;

    if (!questionSnapshot.empty) {
      const lastDoc = questionSnapshot.docs[0];
      lastQuestionNumber = lastDoc.data().questionNumber;
    }
    const newQuestionNumber = lastQuestionNumber + 1;
    const newQuestionId = `Question${newQuestionNumber}`;

    const quizRef = db.collection("quizes").doc(quizId);
    const quizSnapshot = await quizRef.get();
    if (!quizSnapshot.exists) {
      console.log(`Quiz not found for ID: ${quizId}`);
      return res.status(400).json({
        status: false,
        message: "Quiz Not Found",
      });
    }

    await questionRef.doc(newQuestionId).set({
      questionNumber: newQuestionNumber,
      quizId: quizId,
      questionText: questionText,
      answerOptions: answerOptions,
      correctAnswer: correctAnswer,
    });

    res.status(201).json({
      success: true,
      message: "Question created successfully",
      quizId: newQuestionId,
    });
  } catch (error) {
    console.error("Error creating Course:", error);
    res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
};

exports.getQuestions = async (req, res) => {
  try {
    const db = admin.firestore();
    const questionRef = db.collection("quiz-questions");
    const questionSnapshot = await questionRef.get();

    if (questionRef.empty) {
      return res.status(404).json({
        success: false,
        message: "No Quiz found",
      });
    }

    let questions = [];

    for (const doc of questionSnapshot.docs) {
      const questionData = doc.data();

      const quizRef = db.collection("courses").doc(questionData.quizId);
      const quizSnapshot = await quizRef.get();

      questions.push({
        id: doc.id,
        quiz: quizSnapshot.exists ? quizSnapshot.data() : null,
        questionText: questionData.questionText,
        answerOptions: questionData.answerOptions,
        correctAnswer: questionData.correctAnswer,
      });
    }

    res.status(200).json({
      success: true,
      data: questions,
    });
  } catch (error) {
    console.error("Error fetching quizes:", error);
    res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
};

exports.getQuestionById = async (req, res) => {
  try {
    const { questionId } = req.params;
    const db = admin.firestore();
    const questionRef = db.collection("quiz-questions").doc(questionId);
    const questionSnapshot = await questionRef.get();

    // Check if the question exists
    if (!questionSnapshot.exists) {
      return res.status(404).json({
        success: false,
        message: "Question not found",
      });
    }

    const questionData = questionSnapshot.data();

    res.status(200).json({
      success: true,
      data: {
        id: questionSnapshot.id,
        ...questionData,
      },
    });
  } catch (error) {
    console.error("Error fetching question by ID:", error);
    res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
};

exports.updateQuestion = async (req, res) => {
  try {
    const { questionId } = req.params;
    const { questionText, answerOptions, correctAnswer } = req.body;
    const db = admin.firestore();
    const questionRef = db.collection("quiz-questions").doc(questionId);
    const questionSnapshot = await questionRef.get();

    if (!questionSnapshot.exists) {
      return res.status(404).json({
        success: false,
        message: "Question not found",
      });
    }

    await questionRef.update({
      questionText: questionText || questionSnapshot.data().questionText,
      answerOptions: answerOptions || questionSnapshot.data().answerOptions,
      correctAnswer: correctAnswer || questionSnapshot.data().correctAnswer,
    });

    res.status(200).json({
      success: true,
      message: "Question updated successfully",
    });
  } catch (error) {
    console.error("Error updating question by ID:", error);
    res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
};

exports.deleteQuestion = async (req, res) => {
  try {
    const { questionId } = req.params;
    const db = admin.firestore();
    const questionRef = db.collection("quiz-questions").doc(questionId);
    const questionSnapshot = await questionRef.get();

    if (!questionSnapshot.exists) {
      return res.status(404).json({
        success: false,
        message: "Question not found",
      });
    }

    await questionRef.delete();

    res.status(200).json({
      success: true,
      message: "Question deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting question by ID:", error);
    res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
};
