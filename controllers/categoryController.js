const admin = require("firebase-admin");

exports.create = async (req, res) => {
  try {
    const { category_name, feedbackId } = req.body;
    const db = admin.firestore();

    const categoriesRef = db.collection("categories");
    const categoriesSnapshot = await categoriesRef
      .orderBy("categoryNumber", "desc")
      .limit(1)
      .get();

    let lastCategoryNumber = 0;

    if (!categoriesSnapshot.empty) {
      const lastDoc = categoriesSnapshot.docs[0];
      lastCategoryNumber = lastDoc.data().categoryNumber;
    }

    const newCategoryNumber = lastCategoryNumber + 1;
    const newCategoryId = `Category${newCategoryNumber}`;

    let feedbackArray = [];
    if (feedbackId) {
      const feedbackRef = db.collection("feedbacks").doc(feedbackId);
      const feedbackSnapshot = await feedbackRef.get();
      if (!feedbackSnapshot.exists) {
        console.log(`Feedback not found for ID: ${feedbackId}`);
        return res.status(400).json({
          status: false,
          message: "Feedback Not Found",
        });
      }
      feedbackArray.push(feedbackId);
    }

    await categoriesRef.doc(newCategoryId).set({
      categoryNumber: newCategoryNumber,
      categoryId: newCategoryId,
      category_name: category_name,
      feedback: feedbackArray,
    });

    res.status(201).json({
      success: true,
      message: "Category created successfully",
      categoryId: newCategoryId,
    });
  } catch (error) {
    console.error("Error creating Category:", error);
    res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
};

exports.getCategories = async (req, res) => {
  try {
    const db = admin.firestore();
    const categoriesRef = db.collection("categories");

    const categoriesSnapshot = await categoriesRef.get();
    if (categoriesSnapshot.empty) {
      return res.status(404).json({
        success: false,
        message: "No Categories Found",
      });
    }

    let categories = [];
    for (const doc of categoriesSnapshot.docs) {
      const categoriesData = doc.data();

      const feedbacksData = await Promise.all(
        categoriesData.feedback.map(async (feedbackId) => {
          const feedbackRef = db.collection("feedbacks").doc(feedbackId);
          const feedbackSnapshot = await feedbackRef.get();
          return feedbackSnapshot.exists
            ? {
                feedbackIdId: feedbackSnapshot.id,
                rating: feedbackSnapshot.data().rating,
                userId: feedbackSnapshot.data().userId,
                courseid: feedbackSnapshot.data().courseId,
                feedback_text: feedbackSnapshot.data().feedback_text,
              }
            : null;
        })
      );

      categories.push({
        id: doc.id,
        category_name: categoriesData.category_name,
        feedback: feedbacksData,
      });
    }

    res.status(200).json({
      success: true,
      data: categories,
    });
  } catch (error) {
    console.error("Error fetching categories:", error);
    res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
};

exports.getById = async (req, res) => {
  try {
    const { categoryId } = req.params;
    const db = admin.firestore();

    const categoryRef = db.collection("categories").doc(categoryId);
    const categorySnapshot = await categoryRef.get();

    if (categorySnapshot.exists) {
      const foundCategory = categorySnapshot.data();

      const feedbacksData = await Promise.all(
        foundCategory.feedback.map(async (feedbackId) => {
          const feedbackRef = db.collection("feedbacks").doc(feedbackId);
          const feedbackSnapshot = await feedbackRef.get();
          return feedbackSnapshot.exists ? feedbackSnapshot.data() : null;
        })
      );

      const responseData = {
        id: categoryId,
        category_name: foundCategory.category_name,
        feedback: feedbacksData,
      };

      res.status(200).json({
        success: true,
        data: responseData,
      });
    } else {
      res.status(404).json({
        success: false,
        message: "Category not found",
      });
    }
  } catch (error) {
    console.error("Error fetching category by ID:", error);
    res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
};

exports.update = async (req, res) => {
  try {
    const { categoryId } = req.params;
    const { category_name, feedbackId } = req.body;
    const db = admin.firestore();
    const ref = db.collection("categories");

    const snapshot = await ref.where("categoryId", "==", categoryId).get();

    if (snapshot.empty) {
      console.log("Category not found for ID:", categoryId);
      return res.status(404).json({
        success: false,
        message: "Category not found",
      });
    }

    const categoryDoc = snapshot.docs[0];
    const existingCategory = categoryDoc.data();

    const updatedFeedback = existingCategory.feedback || [];
    if (feedbackId && !updatedFeedback.includes(feedbackId)) {
      updatedFeedback.push(feedbackId);
    }

    await ref.doc(categoryDoc.id).update({
      category_name: category_name || existingCategory.category_name,
      feedback: updatedFeedback,
    });

    res.status(200).json({
      status: true,
      message: "Category updated successfully",
    });
  } catch (error) {
    console.error("Error updating category by ID:", error);
    res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
};

exports.delete = async (req, res) => {
  try {
    const { categoryId } = req.params;
    const db = admin.firestore();
    const categoryRef = db.collection("categories").doc(categoryId);

    const categorySnapshot = await categoryRef.get();

    if (!categorySnapshot.exists) {
      return res.status(404).json({
        success: false,
        message: "Category not found",
      });
    }

    await categoryRef.delete();

    res.status(200).json({
      success: true,
      message: "Category deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting category by ID:", error);
    res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
};
