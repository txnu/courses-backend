const admin = require("firebase-admin");
const multer = require("multer");

const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

exports.register = async (req, res) => {
  try {
    const { name, username, email, password, role = "student" } = req.body;

    if (!name || !username || !email || !password) {
      return res.status(400).json({
        success: false,
        message: "All fields (name, username, email, password) are required.",
      });
    }

    const validRoles = ["admin", "student", "instructor"];
    if (!validRoles.includes(role)) {
      return res.status(400).json({
        success: false,
        message:
          "Invalid role. Please provide a valid role (admin, student, instructor).",
      });
    }

    const db = admin.firestore();
    const usersRef = db.collection("users");

    const userSnapshot = await usersRef
      .orderBy("userNumber", "desc")
      .limit(1)
      .get();

    let lastUserNumber = 0;

    if (!userSnapshot.empty) {
      const lastDoc = userSnapshot.docs[0];
      lastUserNumber = lastDoc.data().userNumber;
    }
    const newUserNumber = lastUserNumber + 1; 
    const newUserId = `User${newUserNumber}`;

    await usersRef.doc(newUserId).set({
      userNumber: newUserNumber,
      name: name,
      username: username,
      email: email,
      password: password,
      role: role,
    });

    res.status(201).json({
      success: true,
      message: "User Registration Succesfully",
      userId: newUserId,
    });
  } catch (error) {
    console.error("Register Error:", error);
    res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
};

exports.login = async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({
        success: false,
        message: "Please provide both email and password.",
      });
    }

    const db = admin.firestore();
    const usersRef = db.collection("users");

    const userSnapshot = await usersRef
      .where("username", "==", username)
      .limit(1)
      .get();

    if (userSnapshot.empty) {
      return res.status(404).json({
        success: false,
        message: "User not found.",
      });
    }

    const userDoc = userSnapshot.docs[0];
    const userData = userDoc.data();

    if (userData.password !== password) {
      return res.status(401).json({
        success: false,
        message: "Incorrect password.",
      });
    }

    res.status(200).json({
      success: true,
      message: "Login successful",
      userId: userDoc.id,
      userData: {
        name: userData.name,
        username: username,
        email: userData.email,
        role: userData.role,
      },
    });
  } catch (error) {
    console.error("Login Error:", error);
    res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
};

exports.getUsers = async (req, res) => {
  try {
    const db = admin.firestore();
    const usersRef = db.collection("users");

    const snapshot = await usersRef.get();
    const users = [];

    if (snapshot.empty) {
      return res.status(404).json({
        success: false,
        message: "No users found.",
      });
    }

    snapshot.forEach((doc) => {
      const userData = doc.data();
      users.push({
        id: doc.id, // Get the document ID
        name: userData.name, // Spread the user data
        username: userData.username, // Spread the user data
        email: userData.email, // Spread the user data
        password: userData.password, // Spread the user data
        role: userData.role, // Spread the user data
      });
    });

    res.status(200).json({
      success: true,
      data: users,
    });
  } catch (error) {
    console.error("Error fetching users:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching users",
    });
  }
};
