const admin = require("firebase-admin");

exports.create = async (req, res) => {
  try {
    const { courseId, userId, feedback_text, rating } = req.body;

    const db = admin.firestore();

    const feedbacksRef = db.collection("feedbacks");

    const numericRating = parseFloat(rating);

    if (isNaN(numericRating) || numericRating < 0 || numericRating > 5) {
      return res.status(400).json({
        status: false,
        message: "Rating must be a number between 0 and 5",
      });
    }

    const feedbacksSnapshot = await feedbacksRef
      .orderBy("feedbackNumber", "desc")
      .limit(1)
      .get();

    let lastFeedbackNumber = 0;

    if (!feedbacksSnapshot.empty) {
      const lastDoc = feedbacksSnapshot.docs[0];
      lastFeedbackNumber = lastDoc.data().feedbackNumber;
    }

    const newFeedbackNumber = lastFeedbackNumber + 1;
    const newFeedbackId = `Feedback${newFeedbackNumber}`;

    const courseRef = db.collection("courses").doc(courseId);
    const courseSnapshot = await courseRef.get();
    if (!courseSnapshot.exists) {
      console.log(`Course not found for ID: ${courseId}`);
      return res.status(400).json({
        status: false,
        message: "Course Not Found",
      });
    }

    const userRef = db.collection("users").doc(userId);
    const userSnapshot = await userRef.get();
    if (!userSnapshot.exists) {
      console.log(`User not found for ID: ${userId}`);
      return res.status(400).json({
        status: false,
        message: "User Not Found",
      });
    }

    await feedbacksRef.doc(newFeedbackId).set({
      feedbackNumber: newFeedbackNumber,
      courseId,
      userId,
      feedback_text,
      rating: numericRating,
    });

    res.status(201).json({
      success: true,
      message: "Feedback created successfully",
      feedbackId: newFeedbackId,
    });
  } catch (error) {
    console.error("Error creating Feedback:", error);
    res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
};

exports.getFeedback = async (req, res) => {
  try {
    const db = admin.firestore();
    const feedbackRef = db.collection("feedbacks");

    const feedbackSnapshot = await feedbackRef.get();
    if (feedbackSnapshot.empty) {
      return res.status(404).json({
        success: false,
        message: "No Feedback found",
      });
    }

    let feedbacks = [];

    for (const doc of feedbackSnapshot.docs) {
      const feedbackData = doc.data();

      const userRef = db.collection("users").doc(feedbackData.userId);
      const userSnapshot = await userRef.get();

      const courseRef = db.collection("courses").doc(feedbackData.courseId);
      const courseSnapshot = await courseRef.get();

      feedbacks.push({
        id: doc.id,
        user: userSnapshot.exists ? userSnapshot.data() : null,
        course: courseSnapshot.exists ? courseSnapshot.data() : null,
        feedback_text: feedbackData.feedback_text,
        rating: feedbackData.rating,
      });
    }

    res.status(200).json({
      success: true,
      data: feedbacks,
    });
  } catch (error) {
    console.error("Error fetching courses:", error);
    res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
};

exports.getById = async (req, res) => {
  try {
    const { feedbackId } = req.params;
    const db = admin.firestore();
    const feedbackRef = db.collection("feedbacks").doc(feedbackId);

    const feedbackSnapshot = await feedbackRef.get();

    if (!feedbackSnapshot.exists) {
      return res.status(404).json({
        success: false,
        message: "Feedback not found",
      });
    }

    const feedbackData = feedbackSnapshot.data();

    const userRef = db.collection("users").doc(feedbackData.userId);
    const userSnapshot = await userRef.get();

    const courseRef = db.collection("courses").doc(feedbackData.courseId);
    const courseSnapshot = await courseRef.get();

    res.status(200).json({
      success: true,
      data: {
        id: feedbackSnapshot.id,
        user: userSnapshot.exists ? userSnapshot.data() : null,
        course: courseSnapshot.exists ? courseSnapshot.data() : null,
        feedback_text: feedbackData.feedback_text,
        rating: feedbackData.rating,
      },
    });
  } catch (error) {
    console.error("Error fetching feedback by ID:", error);
    res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
};

exports.update = async (req, res) => {
  try {
    const { feedbackId } = req.params;
    const { courseId, userId, feedback_text, rating } = req.body;

    console.log("Request Body:", req.body);

    const db = admin.firestore();
    const feedbackRef = db.collection("feedbacks").doc(feedbackId);

    const feedbackSnapshot = await feedbackRef.get();

    if (!feedbackSnapshot.exists) {
      return res.status(404).json({
        success: false,
        message: "Feedback not found",
      });
    }

    const existingFeedback = feedbackSnapshot.data();

    const updates = {};

    updates.feedback_text =
      feedback_text !== undefined &&
      feedback_text !== null &&
      feedback_text.trim() !== ""
        ? feedback_text
        : existingFeedback.feedback_text;

    if (rating !== undefined && rating !== null) {
      const numericRating = Number(rating);
      numericRating = 0;

      if (isNaN(numericRating) || numericRating < 1 || numericRating > 5) {
        return res.status(400).json({
          status: false,
          message: "Rating must be a number between 1 and 5",
        });
      }

      updates.rating = numericRating;
    } else {
      updates.rating = existingFeedback.rating;
    }

    updates.courseId =
      courseId !== undefined && courseId !== null && courseId.trim() !== ""
        ? courseId
        : existingFeedback.courseId;

    updates.userId =
      userId !== undefined && userId !== null && userId.trim() !== ""
        ? userId
        : existingFeedback.userId;

    console.log("Updates to Firestore:", updates);

    await feedbackRef.update(updates);

    res.status(200).json({
      success: true,
      message: "Feedback updated successfully",
    });
  } catch (error) {
    console.error("Error updating feedback by ID:", error);
    res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
};

exports.delete = async (req, res) => {
  try {
    const { feedbackId } = req.params;
    const db = admin.firestore();
    const feedbackRef = db.collection("feedbacks").doc(feedbackId);

    const feedbackSnapshot = await feedbackRef.get();
    if (!feedbackSnapshot.exists) {
      return res.status(404).json({
        success: false,
        message: "Feedback not found",
      });
    }

    await feedbackRef.delete();

    res.status(200).json({
      success: true,
      message: "Feedback deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting feedback by ID:", error);
    res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
};
