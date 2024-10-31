const admin = require("firebase-admin");

exports.create = async (req, res) => {
  try {
    const { courseId, title, content } = req.body;
    const db = admin.firestore();

    const lessonRef = db.collection("lessons");

    const lessonSnapshot = await lessonRef
      .orderBy("lessonNumber", "desc")
      .limit(1)
      .get();

    let lastLessonNumber = 0;

    if (!lessonSnapshot.empty) {
      const lastDoc = lessonSnapshot.docs[0];
      lastLessonNumber = lastDoc.data().lessonNumber;
    }

    const newLessonNumber = lastLessonNumber + 1;
    const newLessonId = `Lesson${newLessonNumber}`;

    const courseRef = db.collection("courses").doc(courseId);
    const courseSnapshot = await courseRef.get();
    if (!courseSnapshot.exists) {
      return res.status(400).json({
        status: false,
        message: "Course Not Found",
      });
    }
    await lessonRef.doc(newLessonId).set({
      courseId,
      title,
      content,
      lessonNumber: newLessonNumber,
    });

    res.status(201).json({
      success: true,
      message: "Lesson created successfully",
      lessonId: newLessonId,
    });
  } catch (error) {
    console.error("Error creating Lesson:", error);
    res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
};

exports.getLessons = async (req, res) => {
  try {
    const db = admin.firestore();
    const lessonRef = db.collection("lessons");

    const lessonSnapshot = await lessonRef.get();
    if (lessonSnapshot.empty) {
      return res.status(404).json({
        success: false,
        message: "No Lessons found",
      });
    }

    let lessons = [];

    for (const doc of lessonSnapshot.docs) {
      const lessonData = doc.data();

      const courseRef = db.collection("courses").doc(lessonData.courseId);
      const courseSnapshot = await courseRef.get();

      lessons.push({
        id: doc.id,
        title: lessonData.title,
        content: lessonData.content,
        course: courseSnapshot.exists ? courseSnapshot.data() : null,
      });
    }

    res.status(200).json({
      success: true,
      data: lessons,
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
    const { lessonId } = req.params;
    const db = admin.firestore();
    const lessonRef = db.collection("lessons").doc(lessonId);
    const lessonSnapshot = await lessonRef.get();

    // Check if the lesson exists
    if (!lessonSnapshot.exists) {
      return res.status(404).json({
        success: false,
        message: "Lesson not found",
      });
    }

    const lessonData = lessonSnapshot.data();
    const courseRef = db.collection("courses").doc(lessonData.courseId);
    const courseSnapshot = await courseRef.get();

    // Fetch course data
    const courseData = courseSnapshot.exists ? courseSnapshot.data() : null;

    res.status(200).json({
      success: true,
      data: {
        lessonId: lessonId,
        title: lessonData.title,
        content: lessonData.content,
        course: courseData,
      },
    });
  } catch (error) {
    console.error("Error fetching lesson by ID:", error);
    res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
};

exports.update = async (req, res) => {
  try {
    const { lessonId } = req.params;
    const { courseId, title, content } = req.body;
    const db = admin.firestore();
    const lessonRef = db.collection("lessons").doc(lessonId);
    const lessonSnapshot = await lessonRef.get();

    if (!lessonSnapshot.exists) {
      return res.status(404).json({
        success: false,
        message: "Lesson not found",
      });
    }

    const updates = {};
    if (courseId !== undefined) updates.courseId = courseId;
    if (title !== undefined) updates.title = title;
    if (content !== undefined) updates.content = content;

    await lessonRef.update(updates);

    res.status(200).json({
      success: true,
      message: "Lesson updated successfully",
    });
  } catch (error) {
    console.error("Error updating lesson by ID:", error);
    res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
};

exports.delete = async (req, res) => {
  try {
    const { lessonId } = req.params;
    const db = admin.firestore();
    const lessonRef = db.collection("lessons").doc(lessonId);
    const lessonSnapshot = await lessonRef.get();

    if (!lessonSnapshot.exists) {
      return res.status(404).json({
        success: false,
        message: "Lesson not found",
      });
    }

    await lessonRef.delete();

    res.status(200).json({
      success: true,
      message: "Lesson deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting lesson by ID:", error);
    res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
};
