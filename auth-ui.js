// EduReach Firebase authentication UI helpers

import {
  registerStudent,
  loginUser,
  logoutUser,
  listenToAuth
} from "./auth.js";


// ===============================
// STUDENT REGISTRATION
// ===============================

export async function handleStudentRegistration(name, email, password) {
  return await registerStudent(name, email, password);
}


// ===============================
// LOGIN
// ===============================

export async function handleLogin(email, password) {
  const result = await loginUser(email, password);

  if (!result.success) {
    return result;
  }

  // Save the logged-in user's Firebase information
  // so the existing EduReach app can use it.
  sessionStorage.setItem(
    "edureachUser",
    JSON.stringify({
      uid: result.user.uid,
      email: result.user.email,
      ...result.data
    })
  );

  const role = result.data.role;

  // Route according to the user's role
  if (role === "student") {
    window.location.hash = "#/dashboard";
  } else if (role === "teacher") {
    window.location.hash = "#/teacher";
  } else if (role === "admin") {
    window.location.hash = "#/admin";
  }

  return result;
}


// ===============================
// LOGOUT
// ===============================

export async function handleLogout() {
  sessionStorage.removeItem("edureachUser");
  await logoutUser();
}


// ===============================
// AUTH STATE PROTECTION
// ===============================

export function protectPage(onLoggedOut) {
  return listenToAuth((user) => {
    if (!user && typeof onLoggedOut === "function") {
      onLoggedOut();
    }
  });
}


// ===============================
// MAKE FIREBASE FUNCTIONS
// AVAILABLE TO app.js
// ===============================

window.eduReachFirebaseLogin = handleLogin;
window.eduReachFirebaseRegistration = handleStudentRegistration;
window.eduReachFirebaseLogout = handleLogout;
