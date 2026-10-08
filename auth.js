import { auth, db } from "./firebase.js";

import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/11.10.0/firebase-auth.js";

import {
  doc,
  setDoc,
  getDoc,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/11.10.0/firebase-firestore.js";

export async function registerStudent(name, email, password) {
  try {
    const credential = await createUserWithEmailAndPassword(auth, email, password);
    const user = credential.user;

    await setDoc(doc(db, "users", user.uid), {
      name,
      email,
      role: "student",
      xp: 0,
      level: 1,
      streak: 0,
      createdAt: serverTimestamp()
    });

    return { success: true, user };
  } catch (error) {
    console.error("Registration error:", error);
    return { success: false, message: friendlyAuthError(error) };
  }
}

export async function loginUser(email, password) {
  try {
    const credential = await signInWithEmailAndPassword(auth, email, password);
    const user = credential.user;

    const snapshot = await getDoc(doc(db, "users", user.uid));

    if (!snapshot.exists()) {
      await signOut(auth);
      return {
        success: false,
        message: "Your Firebase login exists, but your EduReach user profile is missing."
      };
    }

    const data = snapshot.data();

    if (!["student", "teacher", "admin"].includes(data.role)) {
      await signOut(auth);
      return { success: false, message: "Invalid EduReach account role." };
    }

    return { success: true, user, data };
  } catch (error) {
    console.error("Login error:", error);
    return { success: false, message: friendlyAuthError(error) };
  }
}

export async function logoutUser() {
  await signOut(auth);
  window.location.hash = "#login";
  window.location.reload();
}

export function listenToAuth(callback) {
  return onAuthStateChanged(auth, callback);
}

export async function getCurrentUserProfile() {
  const user = auth.currentUser;
  if (!user) return null;

  const snapshot = await getDoc(doc(db, "users", user.uid));
  return snapshot.exists() ? { uid: user.uid, ...snapshot.data() } : null;
}

function friendlyAuthError(error) {
  switch (error.code) {
    case "auth/invalid-email":
      return "Please enter a valid email address.";
    case "auth/user-not-found":
    case "auth/invalid-credential":
      return "Incorrect email or password.";
    case "auth/wrong-password":
      return "Incorrect password.";
    case "auth/email-already-in-use":
      return "An account with this email already exists.";
    case "auth/weak-password":
      return "Password should be at least 6 characters.";
    case "auth/too-many-requests":
      return "Too many attempts. Please try again later.";
    default:
      return error.message || "Something went wrong. Please try again.";
  }
}
