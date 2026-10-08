// Ready-to-use login/register/logout helpers for the EduReach UI.
// Connect your existing form elements to these functions.

import { registerStudent, loginUser, logoutUser, listenToAuth } from "./auth.js";

export async function handleStudentRegistration(name, email, password) {
  return await registerStudent(name, email, password);
}

export async function handleLogin(email, password) {
  const result = await loginUser(email, password);

  if (!result.success) return result;

  // Keep the role so your existing single-page app can route the UI.
  sessionStorage.setItem("edureachUser", JSON.stringify({
    uid: result.user.uid,
    email: result.user.email,
    ...result.data
  }));

  const role = result.data.role;

  if (role === "student") {
    window.location.hash = "#dashboard";
  } else if (role === "teacher") {
    window.location.hash = "#teacher";
  } else if (role === "admin") {
    window.location.hash = "#admin";
  }

  return result;
}

export async function handleLogout() {
  sessionStorage.removeItem("edureachUser");
  await logoutUser();
}

export function protectPage(onLoggedOut) {
  return listenToAuth((user) => {
    if (!user && typeof onLoggedOut === "function") {
      onLoggedOut();
    }
  });
}
