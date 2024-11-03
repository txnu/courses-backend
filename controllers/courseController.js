const admin = require("firebase-admin");

exports.create = async (req, res) => {
  try {
    const { course_name, course, description, userId, categoryId } = req.body;
    const db = admin.firestore();

    const courseRef = db.collection("courses");

    const courseSnapshot = await courseRef
      .orderBy("courseNumber", "desc")
      .limit(1)
      .get();

    let lastCourseNumber = 0;

    if (!courseSnapshot.empty) {
      const lastDoc = courseSnapshot.docs[0];
      lastCourseNumber = lastDoc.data().courseNumber;
    }
    const newCourseNumber = lastCourseNumber + 1;
    const newCourseId = `Course${newCourseNumber}`;

    const userRef = db.collection("users").doc(userId);
    const userSnapshot = await userRef.get();
    if (!userSnapshot.exists) {
      console.log(`User not found for ID: ${userId}`);
      return res.status(400).json({
        status: false,
        message: "User Not Found",
      });
    }

    const categoryRef = db.collection("categories").doc(categoryId);
    const categorySnapshot = await categoryRef.get();
    if (!categorySnapshot.exists) {
      return res.status(400).json({
        status: false,
        message: "Category Not Found",
      });
    }
    await courseRef.doc(newCourseId).set({
      courseNumber: newCourseNumber,
      courseId: newCourseId,
      course_name: course_name,
      course: course,
      description: description,
      userId: userId,
      categoryId: categoryId,
    });

    res.status(201).json({
      success: true,
      message: "Course created successfully",
      courseId: newCourseId,
    });
  } catch (error) {
    console.error("Error creating Course:", error);
    res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
};

exports.getCourses = async (req, res) => {
  try {
    const db = admin.firestore();
    const coursesRef = db.collection("courses");
    const coursesSnapshot = await coursesRef.get();

    if (coursesSnapshot.empty) {
      return res.status(404).json({
        success: false,
        message: "No courses found",
      });
    }

    let courses = [];
    for (const doc of coursesSnapshot.docs) {
      const courseData = doc.data();

      // Fetch user data
      const userRef = db.collection("users").doc(courseData.userId);
      const userSnapshot = await userRef.get();

      // Fetch category data
      const categoryRef = db
        .collection("categories")
        .doc(courseData.categoryId);
      const categorySnapshot = await categoryRef.get();

      let categoryData = categorySnapshot.exists
        ? categorySnapshot.data()
        : null;

      if (
        categoryData &&
        categoryData.feedback &&
        Array.isArray(categoryData.feedback)
      ) {
        const feedbackDataArray = [];

        for (const feedbackId of categoryData.feedback) {
          const feedbackRef = db.collection("feedbacks").doc(feedbackId);
          const feedbackSnapshot = await feedbackRef.get();

          if (feedbackSnapshot.exists) {
            feedbackDataArray.push(feedbackSnapshot.data());
          }
        }

        categoryData.feedback = feedbackDataArray;
      }

      courses.push({
        id: doc.id,
        course_name: courseData.course_name,
        course: courseData.course,
        description: courseData.description,
        user: userSnapshot.exists ? userSnapshot.data() : null,
        category: categoryData,
      });
    }

    res.status(200).json({
      success: true,
      data: courses,
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
    const { courseId } = req.params;
    const db = admin.firestore();

    const courseRef = db.collection("courses").doc(courseId);
    const courseSnapshot = await courseRef.get();

    if (!courseSnapshot.exists) {
      return res.status(404).json({
        success: false,
        message: "Course not found",
      });
    }

    const courseData = courseSnapshot.data();

    const userRef = db.collection("users").doc(courseData.userId);
    const userSnapshot = await userRef.get();

    const categoryRef = db.collection("categories").doc(courseData.categoryId);
    const categorySnapshot = await categoryRef.get();

    const courseResponse = {
      id: courseSnapshot.id,
      course_name: courseData.course_name,
      course: courseData.course,

      description: courseData.description,
      user: userSnapshot.exists ? userSnapshot.data() : null,
      category: categorySnapshot.exists ? categorySnapshot.data() : null,
    };

    res.status(200).json({
      success: true,
      data: courseResponse,
    });
  } catch (error) {
    console.error("Error fetching course by ID:", error);
    res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
};

exports.update = async (req, res) => {
  try {
    const { courseId } = req.params;
    if (!courseId) {
      return res.status(400).json({
        success: false,
        message: "Course ID must be provided",
      });
    }

    const { course_name, course, description, userId, categoryId } = req.body;
    const db = admin.firestore();

    const courseRef = db.collection("courses").doc(courseId);
    const courseSnapshot = await courseRef.get();

    if (!courseSnapshot.exists) {
      return res.status(404).json({
        success: false,
        message: "Course not found",
      });
    }

    const existingCourse = courseSnapshot.data();
    const updateData = {};

    if (course_name !== undefined) {
      updateData.course_name =
        course_name !== null ? course_name : existingCourse.course_name;
    }

    if (course !== undefined) {
      updateData.course = course !== null ? course : existingCourse.course;
    }

    if (description !== undefined) {
      updateData.description =
        description !== null ? description : existingCourse.description;
    }

    if (userId !== undefined) {
      if (userId === null || userId.trim() === "") {
        updateData.userId = existingCourse.userId;
      } else {
        const usersRef = db.collection("users").doc(userId);
        const usersSnapshot = await usersRef.get();
        if (!usersSnapshot.exists) {
          console.log(`User not found for ID: ${userId}`);
          return res.status(400).json({
            success: false,
            message: "User Not Found",
          });
        }
        updateData.userId = userId;
      }
    } else {
      updateData.userId = existingCourse.userId;
    }

    if (categoryId !== undefined) {
      if (categoryId === null || categoryId.trim() === "") {
        updateData.categoryId = existingCourse.categoryId;
      } else {
        const categoryRef = db.collection("categories").doc(categoryId);
        const categorySnapshot = await categoryRef.get();
        if (!categorySnapshot.exists) {
          console.log(`Category not found for ID: ${categoryId}`);
          return res.status(400).json({
            success: false,
            message: "Category Not Found",
          });
        }
        updateData.categoryId = categoryId;
      }
    } else {
      updateData.categoryId = existingCourse.categoryId;
    }

    Object.keys(updateData).forEach(
      (key) => updateData[key] === undefined && delete updateData[key]
    );

    if (Object.keys(updateData).length === 0) {
      return res.status(400).json({
        success: false,
        message: "No valid fields to update",
      });
    }

    await courseRef.update(updateData);

    res.status(200).json({
      success: true,
      message: "Course updated successfully",
    });
  } catch (error) {
    console.error("Error updating course by ID:", error);
    res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
};

exports.delete = async (req, res) => {
  try {
    const { courseId } = req.params;
    const db = admin.firestore();

    const courseRef = db.collection("courses").doc(courseId);
    const courseSnapshot = await courseRef.get();

    if (!courseSnapshot.exists) {
      return res.status(404).json({
        success: false,
        message: "Course not found",
      });
    }

    await courseRef.delete();

    res.status(200).json({
      success: true,
      message: "Course deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting course by ID:", error);
    res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
};
