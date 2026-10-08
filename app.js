const app = document.getElementById("app");

const defaultState = {
  loggedIn: false,
  student: {
    name: "Ananya",
    email: "ananya@edureach.edu",
    level: 3
  },
  xp: 180,
  streak: 5,
  completedLessons: [],
  quizResults: {},
  badges: ["first-login"],
  lastCourse: "cs101",
  pointsHistory: [
    { label: "Course started", xp: 20, date: "Today" },
    { label: "Daily streak", xp: 30, date: "Yesterday" }
  ]
};


/* =========================================================
   FIREBASE SESSION HELPERS
   ========================================================= */

function getSessionUser() {
  try {
    const savedUser = sessionStorage.getItem("edureachUser");

    if (!savedUser) {
      return null;
    }

    return JSON.parse(savedUser);
  } catch (error) {
    console.error("Unable to read Firebase session:", error);
    return null;
  }
}


function syncStateWithFirebaseSession(currentState) {
  const sessionUser = getSessionUser();

  /*
   * IMPORTANT:
   * We do NOT trust the old localStorage "loggedIn" value.
   *
   * The user is considered logged in only when our Firebase
   * auth-ui.js has created the edureachUser session.
   */

  if (!sessionUser) {
    currentState.loggedIn = false;
    return currentState;
  }

  currentState.loggedIn = true;

  if (sessionUser.name) {
    currentState.student.name = sessionUser.name;
  }

  if (sessionUser.email) {
    currentState.student.email = sessionUser.email;
  }

  if (typeof sessionUser.xp === "number") {
    currentState.xp = sessionUser.xp;
  }

  if (typeof sessionUser.streak === "number") {
    currentState.streak = sessionUser.streak;
  }

  if (typeof sessionUser.level === "number") {
    currentState.student.level = sessionUser.level;
  }

  return currentState;
}


/* =========================================================
   APPLICATION STATE
   ========================================================= */

let state = loadState();

let route =
  location.hash.replace("#/", "") ||
  (state.loggedIn ? "dashboard" : "home");

let selectedCourse = null;
let selectedModule = null;
let selectedLesson = null;

let currentQuiz = [];
let quizAnswers = [];
let currentQuestion = 0;


/* =========================================================
   LOAD / SAVE STATE
   ========================================================= */

function loadState() {
  try {
    const saved = JSON.parse(
      localStorage.getItem("edureach-state")
    );

    let loadedState = saved
      ? { ...defaultState, ...saved }
      : structuredClone(defaultState);

    loadedState = syncStateWithFirebaseSession(loadedState);

    return loadedState;

  } catch (error) {
    console.error("Unable to load EduReach state:", error);

    const freshState = structuredClone(defaultState);

    return syncStateWithFirebaseSession(freshState);
  }
}


function saveState() {
  localStorage.setItem(
    "edureach-state",
    JSON.stringify(state)
  );
}


/* =========================================================
   ROUTING
   ========================================================= */

function go(path) {
  location.hash = `/${path}`;
}


window.addEventListener("hashchange", () => {
  route =
    location.hash.replace("#/", "") ||
    (state.loggedIn ? "dashboard" : "home");

  render();
});


/* =========================================================
   COURSE / LESSON HELPERS
   ========================================================= */

function flattenLessons(course) {
  return course.modules.flatMap(
    module => module.lessons
  );
}


function courseProgress(course) {
  const lessons = flattenLessons(course);

  if (!lessons.length) {
    return 0;
  }

  const done = lessons.filter(
    lesson =>
      state.completedLessons.includes(lesson.id)
  ).length;

  return Math.round(
    done / lessons.length * 100
  );
}


function totalLessons() {
  return COURSES.reduce(
    (sum, course) =>
      sum + flattenLessons(course).length,
    0
  );
}


function completedCount() {
  return state.completedLessons.length;
}


function levelFromXP(xp) {
  return Math.floor(xp / 100) + 1;
}


function xpIntoLevel(xp) {
  return xp % 100;
}


/* =========================================================
   XP / PROGRESS
   ========================================================= */

function addXP(amount, reason) {
  state.xp += amount;

  state.pointsHistory.unshift({
    label: reason,
    xp: amount,
    date: "Just now"
  });

  if (
    state.xp >= 100 &&
    !state.badges.includes("xp-100")
  ) {
    state.badges.push("xp-100");
  }

  saveState();
}


function completeLesson(lesson) {
  if (
    !state.completedLessons.includes(lesson.id)
  ) {
    state.completedLessons.push(lesson.id);

    addXP(
      lesson.xp,
      `Completed: ${lesson.title}`
    );
  }

  checkBadges();

  saveState();
}


function checkBadges() {
  if (
    completedCount() >= 3 &&
    !state.badges.includes("quick-learner")
  ) {
    state.badges.push("quick-learner");
  }

  if (
    completedCount() >= 5 &&
    !state.badges.includes("learning-star")
  ) {
    state.badges.push("learning-star");
  }

  if (
    state.streak >= 7 &&
    !state.badges.includes("streak-master")
  ) {
    state.badges.push("streak-master");
  }
}


function badgeInfo(id) {
  const map = {
    "first-login": [
      "🌱",
      "First Step",
      "Started your EduReach journey"
    ],

    "xp-100": [
      "⚡",
      "XP Starter",
      "Earned 100 XP"
    ],

    "quick-learner": [
      "🚀",
      "Quick Learner",
      "Completed 3 lessons"
    ],

    "learning-star": [
      "⭐",
      "Learning Star",
      "Completed 5 lessons"
    ],

    "streak-master": [
      "🔥",
      "Streak Master",
      "Reached a 7-day streak"
    ]
  };

  return (
    map[id] ||
    [
      "🏅",
      "Achievement",
      "Keep learning!"
    ]
  );
}


/* =========================================================
   MAIN APP LAYOUT
   ========================================================= */

function layout(
  content,
  active = "dashboard"
) {
  return `
    <div class="app-shell">

      <aside class="sidebar">

        <div
          class="brand"
          onclick="go('dashboard')"
        >
          <div class="brand-mark">E</div>

          <div>
            <strong>EduReach</strong>
            <span>Learn beyond limits</span>
          </div>
        </div>


        <nav>

          <button
            class="${active === "dashboard" ? "active" : ""}"
            onclick="go('dashboard')"
          >
            🏠
            <span>Dashboard</span>
          </button>


          <button
            class="${active === "courses" ? "active" : ""}"
            onclick="go('courses')"
          >
            📚
            <span>Courses</span>
          </button>


          <button
            class="${active === "progress" ? "active" : ""}"
            onclick="go('progress')"
          >
            📈
            <span>Progress</span>
          </button>


          <button
            class="${active === "profile" ? "active" : ""}"
            onclick="go('profile')"
          >
            👤
            <span>Profile</span>
          </button>

        </nav>


        <div class="sidebar-bottom">

          <div class="offline-card">

            <div class="status-dot"></div>

            <div>
              <strong>Offline ready</strong>

              <small>
                Your progress is saved locally
              </small>
            </div>

          </div>


          <button
            class="logout"
            onclick="logout()"
          >
            ↪ Log out
          </button>

        </div>

      </aside>


      <main class="main-content">

        <header class="topbar">

          <div class="mobile-brand">

            <span class="brand-mark small">
              E
            </span>

            <strong>EduReach</strong>

          </div>


          <div class="topbar-spacer"></div>


          <div class="streak-pill">
            🔥 ${state.streak} day streak
          </div>


          <div class="xp-pill">
            ⚡ ${state.xp} XP
          </div>


          <button
            class="avatar"
            onclick="go('profile')"
          >
            ${state.student.name.charAt(0)}
          </button>

        </header>


        ${content}

      </main>

    </div>
  `;
}


/* =========================================================
   RENDER ROUTER
   ========================================================= */

function render() {

  /*
   * Protect all student pages.
   *
   * If Firebase session does not exist,
   * the user cannot access dashboard/courses/etc.
   */

  if (
    !state.loggedIn &&
    route !== "login" &&
    route !== "home"
  ) {
    go("login");
    return;
  }


  if (route === "home") {
    return renderHome();
  }


  if (route === "login") {
    return renderLogin();
  }


  if (route === "courses") {
    return renderCourses();
  }


  if (route === "course") {
    return renderCourseDetails();
  }


  if (route === "module") {
    return renderModule();
  }


  if (route === "lesson") {
    return renderLesson();
  }


  if (route === "quiz") {
    return renderQuiz();
  }


  if (route === "result") {
    return renderResult();
  }


  if (route === "progress") {
    return renderProgress();
  }


  if (route === "profile") {
    return renderProfile();
  }


  renderDashboard();
}


/* =========================================================
   HOME PAGE
   ========================================================= */

function renderHome() {

  app.innerHTML = `
    <div class="landing">

      <nav class="landing-nav">

        <div class="brand dark">

          <div class="brand-mark">
            E
          </div>

          <strong>EduReach</strong>

        </div>


        <button
          class="btn btn-primary"
          onclick="go('login')"
        >
          Student Login →
        </button>

      </nav>


      <section class="hero">

        <div class="hero-copy">

          <span class="eyebrow">
            🌱 LEARN • GROW • ACHIEVE
          </span>


          <h1>
            Learning that<br>
            <span>moves with you.</span>
          </h1>


          <p>
            Access lessons, videos, quizzes and
            progress tracking —
            even when connectivity is limited.
          </p>


          <div class="hero-actions">

            <button
              class="btn btn-primary btn-large"
              onclick="go('login')"
            >
              Start Learning ✨
            </button>


            <button
              class="btn btn-light btn-large"
              onclick="go('courses')"
            >
              Explore Courses
            </button>

          </div>


          <div class="hero-trust">

            <span>
              ✓ Offline-friendly
            </span>

            <span>
              ✓ Gamified learning
            </span>

            <span>
              ✓ Student-first
            </span>

          </div>

        </div>


        <div class="hero-visual">

          <div class="floating-card points">

            ⚡

            <strong>
              +40 XP
            </strong>

            <small>
              Quiz completed
            </small>

          </div>


          <div class="dashboard-mock">

            <div class="mock-top">

              <span>
                Good morning, Ananya 👋
              </span>

              <span>
                🔥 5
              </span>

            </div>


            <div class="mock-progress">

              <small>
                Weekly progress
              </small>

              <strong>
                72%
              </strong>

              <div class="progress">
                <i style="width:72%"></i>
              </div>

            </div>


            <div class="mock-courses">

              <div>
                💻
                <b>Programming</b>
                <span>65%</span>
              </div>


              <div>
                ⚛️
                <b>Physics</b>
                <span>40%</span>
              </div>


              <div>
                📐
                <b>Mathematics</b>
                <span>20%</span>
              </div>

            </div>

          </div>


          <div class="floating-card badge">

            🏆

            <strong>
              New badge!
            </strong>

            <small>
              Quick Learner
            </small>

          </div>

        </div>

      </section>


      <section class="feature-strip">

        <div>
          <b>📚</b>
          <strong>Micro-learning</strong>
          <span>Short lessons made easier</span>
        </div>


        <div>
          <b>🎮</b>
          <strong>Gamified</strong>
          <span>XP, badges & streaks</span>
        </div>


        <div>
          <b>📶</b>
          <strong>Offline-first</strong>
          <span>Keep learning with low connectivity</span>
        </div>


        <div>
          <b>📈</b>
          <strong>Track progress</strong>
          <span>See how far you've come</span>
        </div>

      </section>

    </div>
  `;
}


/* =========================================================
   LOGIN
   ========================================================= */

function renderLogin() {

  app.innerHTML = `
    <div class="login-page">

      <div class="login-art">

        <div class="brand dark">

          <div class="brand-mark">
            E
          </div>

          <strong>
            EduReach
          </strong>

        </div>


        <div class="login-art-copy">

          <span class="eyebrow">
            WELCOME BACK
          </span>


          <h1>
            Your learning journey starts here.
          </h1>


          <p>
            Learn at your pace, collect XP,
            unlock badges and keep moving forward.
          </p>


          <div class="mini-achievements">

            <span>
              🔥 5 day streak
            </span>

            <span>
              ⚡ 180 XP
            </span>

            <span>
              🏆 4 badges
            </span>

          </div>

        </div>

      </div>


      <div class="login-card-wrap">

        <form
          class="login-card"
          onsubmit="event.preventDefault(); login()"
        >

          <button
            type="button"
            class="back-btn"
            onclick="go('home')"
          >
            ← Back
          </button>


          <div class="login-icon">
            👋
          </div>


          <h2>
            Welcome back!
          </h2>


          <p>
            Sign in to continue learning.
          </p>


          <label>

            Email address

            <input
              id="loginEmail"
              type="email"
              placeholder="Enter your email"
              autocomplete="email"
              required
            >

          </label>


          <label>

            Password

            <input
              id="loginPassword"
              type="password"
              placeholder="Enter your password"
              autocomplete="current-password"
              required
            >

          </label>


          <button
            type="submit"
            class="btn btn-primary btn-large full"
            id="loginButton"
          >
            Login to EduReach
          </button>


          <small class="demo-note">
            Sign in using your EduReach Firebase account.
          </small>

        </form>

      </div>

    </div>
  `;
}


/* =========================================================
   FIREBASE LOGIN
   ========================================================= */

async function login() {

  const emailInput =
    document.getElementById("loginEmail");

  const passwordInput =
    document.getElementById("loginPassword");

  const button =
    document.getElementById("loginButton");


  if (!emailInput || !passwordInput || !button) {
    return;
  }


  const email =
    emailInput.value.trim();

  const password =
    passwordInput.value;


  if (!email || !password) {

    alert(
      "Please enter your email and password."
    );

    return;
  }


  try {

    button.disabled = true;
    button.textContent = "Logging in...";


    /*
     * auth-ui.js creates this function.
     */

    if (
      typeof window.eduReachFirebaseLogin !==
      "function"
    ) {

      throw new Error(
        "Firebase authentication is still loading. Please wait a moment and try again."
      );
    }


    const result =
      await window.eduReachFirebaseLogin(
        email,
        password
      );


    if (!result || !result.success) {

      alert(
        result?.message ||
        "Login failed. Please check your email and password."
      );

      button.disabled = false;
      button.textContent =
        "Login to EduReach";

      return;
    }


    /*
     * This frontend is the STUDENT portal.
     */

    const role =
      result.data?.role || "student";


    if (role !== "student") {

      alert(
        "This account is not a student account. Please use a student account to access the EduReach student portal."
      );


      try {

        if (
          typeof window.eduReachFirebaseLogout ===
          "function"
        ) {
          await window.eduReachFirebaseLogout();
        }

      } catch (logoutError) {

        console.error(
          "Unable to clear non-student session:",
          logoutError
        );

      }


      state.loggedIn = false;

      saveState();

      go("login");

      return;
    }


    /*
     * Firebase login was successful.
     */

    state.loggedIn = true;


    if (result.data) {

      state.student.name =
        result.data.name ||
        "Student";


      state.student.email =
        result.data.email ||
        email;


      if (
        typeof result.data.xp ===
        "number"
      ) {
        state.xp =
          result.data.xp;
      }


      if (
        typeof result.data.streak ===
        "number"
      ) {
        state.streak =
          result.data.streak;
      }


      if (
        typeof result.data.level ===
        "number"
      ) {
        state.student.level =
          result.data.level;
      }

    } else {

      state.student.email =
        email;

    }


    /*
     * First login badge.
     */

    if (
      !state.badges.includes("first-login")
    ) {

      state.badges.push(
        "first-login"
      );

    }


    saveState();


    /*
     * Go to the student dashboard.
     */

    go("dashboard");

  } catch (error) {

    console.error(
      "Firebase login error:",
      error
    );


    alert(
      error?.message ||
      "Unable to log in. Please check your Firebase setup and try again."
    );


    button.disabled = false;

    button.textContent =
      "Login to EduReach";
  }
}


/* =========================================================
   FIREBASE LOGOUT
   ========================================================= */

async function logout() {

  try {

    if (
      typeof window.eduReachFirebaseLogout ===
      "function"
    ) {

      await window.eduReachFirebaseLogout();

    }

  } catch (error) {

    console.error(
      "Firebase logout error:",
      error
    );

  }


  /*
   * Always clear the frontend login state,
   * even if Firebase logout reports an error.
   */

  state.loggedIn = false;


  try {
    sessionStorage.removeItem(
      "edureachUser"
    );
  } catch (error) {
    console.error(
      "Unable to clear session:",
      error
    );
  }


  saveState();


  go("login");
}


/* =========================================================
   DASHBOARD
   ========================================================= */

function renderDashboard() {

  const level =
    levelFromXP(state.xp);

  const levelXP =
    xpIntoLevel(state.xp);


  const overall =
    Math.round(
      COURSES.reduce(
        (a, c) =>
          a + courseProgress(c),
        0
      ) / COURSES.length
    );


  app.innerHTML = layout(`

    <section class="page">

      <div class="welcome-row">

        <div>

          <span class="eyebrow">
            STUDENT DASHBOARD
          </span>


          <h1>
            Hello, ${state.student.name} 👋
          </h1>


          <p>
            Keep going — you're building
            a great learning habit.
          </p>

        </div>


        <button
          class="btn btn-primary"
          onclick="go('courses')"
        >
          Explore Courses →
        </button>

      </div>


      <div class="hero-stats">

        <div class="level-card">

          <div class="level-top">

            <span class="level-badge">
              LEVEL ${level}
            </span>


            <strong>
              ${state.xp} XP
            </strong>

          </div>


          <h3>
            Learning Explorer
          </h3>


          <p>
            ${100 - levelXP}
            XP to Level ${level + 1}
          </p>


          <div class="progress">
            <i
              style="width:${levelXP}%"
            ></i>
          </div>

        </div>


        <div class="stat-card">

          <div class="stat-icon purple">
            📚
          </div>

          <strong>
            ${COURSES.length}
          </strong>

          <span>
            Courses
          </span>

        </div>


        <div class="stat-card">

          <div class="stat-icon green">
            ✓
          </div>

          <strong>
            ${completedCount()}
          </strong>

          <span>
            Lessons completed
          </span>

        </div>


        <div class="stat-card">

          <div class="stat-icon orange">
            🏆
          </div>

          <strong>
            ${state.badges.length}
          </strong>

          <span>
            Badges earned
          </span>

        </div>

      </div>


      <div class="section-head">

        <div>

          <h2>
            Continue Learning
          </h2>

          <p>
            Pick up where you left off.
          </p>

        </div>


        <button
          class="text-btn"
          onclick="go('courses')"
        >
          View all →
        </button>

      </div>


      <div class="course-grid">
        ${COURSES
          .map(courseCard)
          .join("")}
      </div>


      <div class="dashboard-bottom">

        <div class="panel">

          <div class="panel-head">

            <h2>
              🔥 Your streak
            </h2>

            <span>
              Keep it going!
            </span>

          </div>


          <div class="streak-big">

            ${state.streak}

            <small>
              days
            </small>

          </div>


          <div class="week-row">

            ${["M","T","W","T","F","S","S"]
              .map((d, i) => `
                <div
                  class="${i < state.streak % 7 ? "done" : ""}"
                >

                  <span>
                    ${d}
                  </span>

                  <b>
                    ${
                      i < state.streak % 7
                        ? "✓"
                        : "•"
                    }
                  </b>

                </div>
              `)
              .join("")}

          </div>

        </div>


        <div class="panel">

          <div class="panel-head">

            <h2>
              🏅 Recent achievements
            </h2>


            <button
              class="text-btn"
              onclick="go('profile')"
            >
              See all
            </button>

          </div>


          <div class="achievement-list">

            ${state.badges
              .slice(-3)
              .reverse()
              .map(id => {

                const b =
                  badgeInfo(id);

                return `
                  <div class="achievement">

                    <div class="achievement-icon">
                      ${b[0]}
                    </div>


                    <div>

                      <strong>
                        ${b[1]}
                      </strong>

                      <small>
                        ${b[2]}
                      </small>

                    </div>

                  </div>
                `;

              })
              .join("")}

          </div>

        </div>

      </div>

    </section>

  `, "dashboard");
}


/* =========================================================
   COURSE CARD
   ========================================================= */

function courseCard(course) {

  const p =
    courseProgress(course);


  return `
    <article
      class="course-card"
      onclick="openCourse('${course.id}')"
    >

      <div
        class="course-cover ${course.color}"
      >

        <span>
          ${course.icon}
        </span>

        <small>
          ${course.category}
        </small>

        <b>
          ${course.difficulty}
        </b>

      </div>


      <div class="course-body">

        <div class="course-meta">

          <span>
            ${course.duration}
          </span>

          <span>
            ${flattenLessons(course).length}
            lessons
          </span>

        </div>


        <h3>
          ${course.title}
        </h3>


        <p>
          ${course.description}
        </p>


        <div class="course-progress">

          <div class="progress">

            <i
              style="width:${p}%"
            ></i>

          </div>


          <strong>
            ${p}%
          </strong>

        </div>

      </div>

    </article>
  `;
}


/* =========================================================
   COURSES
   ========================================================= */

function renderCourses() {

  app.innerHTML = layout(`

    <section class="page">

      <div class="page-title">

        <span class="eyebrow">
          LEARNING LIBRARY
        </span>


        <h1>
          Explore Courses
        </h1>


        <p>
          Choose a course and learn
          one small step at a time.
        </p>

      </div>


      <div class="course-toolbar">

        <div class="search-box">

          🔎

          <input
            id="courseSearch"
            oninput="filterCourses()"
            placeholder="Search courses..."
          >

        </div>


        <div class="filter-pills">

          <button class="selected">
            All
          </button>

          <button>
            Computer Science
          </button>

          <button>
            Science
          </button>

          <button>
            Mathematics
          </button>

        </div>

      </div>


      <div
        id="courseResults"
        class="course-grid wide"
      >

        ${COURSES
          .map(courseCard)
          .join("")}

      </div>

    </section>

  `, "courses");
}


function filterCourses() {

  const searchInput =
    document.getElementById(
      "courseSearch"
    );


  if (!searchInput) {
    return;
  }


  const q =
    searchInput.value
      .toLowerCase();


  document.getElementById(
    "courseResults"
  ).innerHTML =

    COURSES
      .filter(course =>
        `${course.title} ${course.category}`
          .toLowerCase()
          .includes(q)
      )
      .map(courseCard)
      .join("");
}


function openCourse(id) {

  selectedCourse =
    COURSES.find(
      course => course.id === id
    );


  if (!selectedCourse) {
    return;
  }


  state.lastCourse = id;

  saveState();

  go("course");
}


/* =========================================================
   COURSE DETAILS
   ========================================================= */

function renderCourseDetails() {

  if (!selectedCourse) {

    selectedCourse =
      COURSES.find(
        course =>
          course.id === state.lastCourse
      ) ||
      COURSES[0];

  }


  const p =
    courseProgress(selectedCourse);


  app.innerHTML = layout(`

    <section class="page">

      <button
        class="back-link"
        onclick="go('courses')"
      >
        ← Back to courses
      </button>


      <div
        class="course-detail-hero ${selectedCourse.color}"
      >

        <div>

          <span class="eyebrow light">
            ${selectedCourse.category}
          </span>


          <h1>
            ${selectedCourse.title}
          </h1>


          <p>
            ${selectedCourse.description}
          </p>


          <div class="detail-tags">

            <span>
              🎯 ${selectedCourse.difficulty}
            </span>

            <span>
              ⏱ ${selectedCourse.duration}
            </span>

            <span>
              📚
              ${flattenLessons(selectedCourse).length}
              lessons
            </span>

          </div>

        </div>


        <div class="course-hero-icon">
          ${selectedCourse.icon}
        </div>

      </div>


      <div class="detail-layout">

        <div>

          <div class="section-head">

            <div>

              <h2>
                Course Modules
              </h2>

              <p>
                Follow the modules in order
                or jump to any lesson.
              </p>

            </div>

          </div>


          <div class="module-list">

            ${selectedCourse.modules
              .map((m, i) => `

                <article class="module-card">

                  <div class="module-number">
                    ${String(i + 1).padStart(2, "0")}
                  </div>


                  <div class="module-main">

                    <div>

                      <h3>
                        ${m.title}
                      </h3>

                      <p>
                        ${m.description}
                      </p>

                    </div>


                    <button
                      class="btn btn-secondary"
                      onclick="openModule('${selectedCourse.id}','${m.id}')"
                    >
                      Open Module →
                    </button>

                  </div>


                  <div class="lesson-mini-list">

                    ${m.lessons
                      .map(l => `

                        <div>

                          <span>

                            ${
                              state.completedLessons.includes(l.id)
                                ? "✓"
                                : l.type === "video"
                                ? "▶"
                                : l.type === "quiz"
                                ? "✦"
                                : "📖"
                            }

                          </span>


                          ${l.title}


                          <small>
                            ${l.duration}
                            ·
                            +${l.xp} XP
                          </small>

                        </div>

                      `)
                      .join("")}

                  </div>

                </article>

              `)
              .join("")}

          </div>

        </div>


        <aside class="course-side">

          <div class="panel progress-panel">

            <span class="eyebrow">
              YOUR PROGRESS
            </span>


            <div class="circle-progress">
              <strong>
                ${p}%
              </strong>
            </div>


            <h3>
              ${
                p === 100
                  ? "Course completed!"
                  : "Keep going!"
              }
            </h3>


            <p>
              ${completedCount()}
              lessons completed across
              your learning journey.
            </p>

          </div>


          <div class="panel">

            <h3>
              What you'll learn
            </h3>


            <ul class="check-list">

              <li>
                Core concepts explained simply
              </li>

              <li>
                Short interactive lessons
              </li>

              <li>
                Knowledge-check quizzes
              </li>

              <li>
                XP and achievement rewards
              </li>

            </ul>

          </div>

        </aside>

      </div>

    </section>

  `, "courses");
}


function openModule(
  courseId,
  moduleId
) {

  selectedCourse =
    COURSES.find(
      course => course.id === courseId
    );


  if (!selectedCourse) {
    return;
  }


  selectedModule =
    selectedCourse.modules.find(
      module => module.id === moduleId
    );


  if (!selectedModule) {
    return;
  }


  go("module");
}


/* =========================================================
   MODULE
   ========================================================= */

function renderModule() {

  if (!selectedModule) {

    if (!selectedCourse) {
      go("courses");
      return;
    }

    selectedModule =
      selectedCourse.modules[0];

  }


  app.innerHTML = layout(`

    <section class="page narrow">

      <button
        class="back-link"
        onclick="go('course')"
      >
        ← Back to course
      </button>


      <div class="module-heading">

        <span class="module-chip">
          MODULE
        </span>


        <h1>
          ${selectedModule.title}
        </h1>


        <p>
          ${selectedModule.description}
        </p>

      </div>


      <div class="lesson-list">

        ${selectedModule.lessons
          .map((l, i) => `

            <article
              class="
                lesson-row
                ${
                  state.completedLessons.includes(l.id)
                    ? "completed"
                    : ""
                }
              "
              onclick="openLesson('${l.id}')"
            >

              <div class="lesson-number">

                ${
                  state.completedLessons.includes(l.id)
                    ? "✓"
                    : i + 1
                }

              </div>


              <div class="lesson-info">

                <div>

                  <span class="lesson-type">
                    ${l.type}
                  </span>


                  <h3>
                    ${l.title}
                  </h3>

                </div>


                <p>
                  ${l.content}
                </p>

              </div>


              <div class="lesson-right">

                <span>
                  ${l.duration}
                </span>

                <strong>
                  +${l.xp} XP
                </strong>


                <button class="icon-btn">
                  →
                </button>

              </div>

            </article>

          `)
          .join("")}

      </div>

    </section>

  `, "courses");
}


/* =========================================================
   FIND LESSON
   ========================================================= */

function findLesson(id) {

  for (const course of COURSES) {

    for (const module of course.modules) {

      for (const lesson of module.lessons) {

        if (lesson.id === id) {

          return {
            course,
            module,
            lesson
          };

        }

      }

    }

  }

  return null;
}


function openLesson(id) {

  const found =
    findLesson(id);


  if (!found) {
    return;
  }


  selectedCourse =
    found.course;

  selectedModule =
    found.module;

  selectedLesson =
    found.lesson;


  if (
    selectedLesson.type ===
    "quiz"
  ) {

    currentQuiz =
      QUIZZES[selectedLesson.id] ||
      [];

    quizAnswers = [];

    currentQuestion = 0;

    go("quiz");

  } else {

    go("lesson");

  }
}


/* =========================================================
   LESSON
   ========================================================= */

function renderLesson() {

  if (
    !selectedLesson ||
    !selectedCourse ||
    !selectedModule
  ) {

    go("courses");
    return;

  }


  app.innerHTML = layout(`

    <section class="page">

      <button
        class="back-link"
        onclick="go('module')"
      >
        ← Back to module
      </button>


      <div class="lesson-header">

        <span class="lesson-type">
          ${selectedLesson.type}
        </span>


        <h1>
          ${selectedLesson.title}
        </h1>


        <p>
          ${selectedCourse.title}
          ·
          ${selectedModule.title}
          ·
          ${selectedLesson.duration}
        </p>

      </div>


      <div class="lesson-layout">

        <div class="lesson-player">

          <div class="video-placeholder">

            <div class="play-ring">
              ▶
            </div>

            <span>
              Lesson media
            </span>

            <small>
              Replace this area with
              your uploaded video
            </small>

          </div>


          <div class="lesson-content">

            <h2>
              Today's lesson
            </h2>


            <p>
              ${selectedLesson.content}
            </p>


            <div class="tip-box">

              💡

              <div>

                <strong>
                  Learning tip
                </strong>


                <p>
                  Take a short note after
                  the lesson. Active recall
                  helps you remember more.
                </p>

              </div>

            </div>

          </div>


          <button
            class="btn btn-primary btn-large"
            onclick="finishLesson()"
          >
            ✓ Mark lesson as complete ·
            +${selectedLesson.xp} XP
          </button>

        </div>


        <aside class="lesson-sidebar">

          <h3>
            Course progress
          </h3>


          <div class="progress">

            <i
              style="
                width:${courseProgress(selectedCourse)}%
              "
            ></i>

          </div>


          <strong>
            ${courseProgress(selectedCourse)}%
            complete
          </strong>


          <hr>


          <h3>
            Up next
          </h3>


          ${flattenLessons(selectedCourse)
            .slice(0, 4)
            .map(l => `

              <div
                class="
                  next-lesson
                  ${
                    l.id === selectedLesson.id
                      ? "current"
                      : ""
                  }
                "
                onclick="openLesson('${l.id}')"
              >

                <span>

                  ${
                    l.type === "video"
                      ? "▶"
                      : l.type === "quiz"
                      ? "✦"
                      : "📖"
                  }

                </span>


                <div>

                  <strong>
                    ${l.title}
                  </strong>

                  <small>
                    ${l.duration}
                  </small>

                </div>

              </div>

            `)
            .join("")}

        </aside>

      </div>

    </section>

  `, "courses");
}


function finishLesson() {

  if (!selectedLesson) {
    return;
  }


  completeLesson(
    selectedLesson
  );


  if (
    selectedLesson.type ===
    "quiz"
  ) {

    go("quiz");

  } else {

    alert(
      `Lesson completed! +${selectedLesson.xp} XP 🎉`
    );

    go("module");

  }
}


/* =========================================================
   QUIZ
   ========================================================= */

function renderQuiz() {

  if (!selectedLesson) {
    go("courses");
    return;
  }


  if (!currentQuiz.length) {

    app.innerHTML = layout(`

      <section class="page empty-state">

        <div>
          ✦
        </div>


        <h1>
          Quiz coming soon
        </h1>


        <button
          class="btn btn-primary"
          onclick="go('module')"
        >
          Back to module
        </button>

      </section>

    `);

    return;
  }


  const q =
    currentQuiz[currentQuestion];


  const selected =
    quizAnswers[currentQuestion];


  const progress =
    Math.round(
      currentQuestion /
      currentQuiz.length *
      100
    );


  app.innerHTML = layout(`

    <section class="page narrow">

      <button
        class="back-link"
        onclick="go('module')"
      >
        ← Exit quiz
      </button>


      <div class="quiz-top">

        <div>

          <span class="eyebrow">
            KNOWLEDGE CHECK
          </span>


          <h1>
            ${selectedLesson.title}
          </h1>

        </div>


        <strong>
          ${currentQuestion + 1}
          /
          ${currentQuiz.length}
        </strong>

      </div>


      <div class="quiz-progress">

        <i
          style="width:${progress}%"
        ></i>

      </div>


      <div class="quiz-card">

        <span class="question-number">
          QUESTION ${currentQuestion + 1}
        </span>


        <h2>
          ${q.q}
        </h2>


        <div class="option-list">

          ${q.options
            .map((o, i) => `

              <button
                class="
                  option
                  ${
                    selected === i
                      ? "selected"
                      : ""
                  }
                "
                onclick="selectAnswer(${i})"
              >

                <span>
                  ${String.fromCharCode(65 + i)}
                </span>


                ${o}


                <b>

                  ${
                    selected === i
                      ? "✓"
                      : ""
                  }

                </b>

              </button>

            `)
            .join("")}

        </div>


        <button
          class="btn btn-primary btn-large full"
          ${
            selected === undefined
              ? "disabled"
              : ""
          }
          onclick="nextQuestion()"
        >

          ${
            currentQuestion ===
            currentQuiz.length - 1
              ? "Finish Quiz 🏆"
              : "Next Question →"
          }

        </button>

      </div>

    </section>

  `, "courses");
}


function selectAnswer(i) {

  quizAnswers[
    currentQuestion
  ] = i;

  renderQuiz();
}


function nextQuestion() {

  if (
    currentQuestion <
    currentQuiz.length - 1
  ) {

    currentQuestion++;

    renderQuiz();

    return;
  }


  const score =
    currentQuiz.reduce(
      (s, q, i) =>
        s +
        (
          quizAnswers[i] ===
          q.answer
            ? 1
            : 0
        ),
      0
    );


  const pct =
    Math.round(
      score /
      currentQuiz.length *
      100
    );


  state.quizResults[
    selectedLesson.id
  ] = {

    score,

    total:
      currentQuiz.length,

    pct,

    date:
      new Date()
        .toLocaleDateString()

  };


  addXP(
    Math.max(
      10,
      score * 15
    ),
    `Quiz: ${selectedLesson.title}`
  );


  completeLesson(
    selectedLesson
  );


  saveState();


  go("result");
}


/* =========================================================
   QUIZ RESULT
   ========================================================= */

function renderResult() {

  if (!selectedLesson) {
    go("courses");
    return;
  }


  const r =
    state.quizResults[
      selectedLesson.id
    ] ||
    {
      score: 0,
      total: currentQuiz.length,
      pct: 0
    };


  const passed =
    r.pct >= 60;


  app.innerHTML = layout(`

    <section class="page result-page">

      <div class="result-card">

        <div class="result-icon">
          ${passed ? "🏆" : "💪"}
        </div>


        <span class="eyebrow">

          ${
            passed
              ? "GREAT JOB!"
              : "KEEP PRACTISING"
          }

        </span>


        <h1>

          ${
            passed
              ? "Quiz completed!"
              : "Nice attempt!"
          }

        </h1>


        <p>

          You scored
          ${r.score}
          out of
          ${r.total}
          questions.

        </p>


        <div class="score-ring">

          <strong>
            ${r.pct}%
          </strong>

          <span>
            Score
          </span>

        </div>


        <div class="result-rewards">

          <div>

            <span>
              ⚡
            </span>

            <strong>
              +${Math.max(
                10,
                r.score * 15
              )}
            </strong>

            <small>
              XP earned
            </small>

          </div>


          <div>

            <span>
              🎯
            </span>

            <strong>
              ${r.score}/${r.total}
            </strong>

            <small>
              Correct
            </small>

          </div>


          <div>

            <span>
              🔥
            </span>

            <strong>
              ${state.streak}
            </strong>

            <small>
              Day streak
            </small>

          </div>

        </div>


        ${
          passed
            ? `
              <div class="success-note">
                🎉 Your progress has been
                updated and your learning
                streak continues!
              </div>
            `
            : `
              <div class="success-note">
                Review the lesson and try again.
                Every attempt helps you learn.
              </div>
            `
        }


        <div class="result-actions">

          <button
            class="btn btn-primary"
            onclick="go('module')"
          >
            Continue Learning →
          </button>


          <button
            class="btn btn-light"
            onclick="go('progress')"
          >
            View Progress
          </button>

        </div>

      </div>

    </section>

  `, "courses");
}


/* =========================================================
   PROGRESS
   ========================================================= */

function renderProgress() {

  const overall =
    Math.round(
      COURSES.reduce(
        (a, c) =>
          a + courseProgress(c),
        0
      ) / COURSES.length
    );


  app.innerHTML = layout(`

    <section class="page">

      <div class="page-title">

        <span class="eyebrow">
          YOUR JOURNEY
        </span>


        <h1>
          Progress & Achievements
        </h1>


        <p>
          Small steps add up to big progress.
        </p>

      </div>


      <div class="progress-overview">

        <div class="overall-card">

          <span class="eyebrow">
            OVERALL PROGRESS
          </span>


          <div class="overall-number">

            ${overall}

            <small>
              %
            </small>

          </div>


          <div class="progress">

            <i
              style="width:${overall}%"
            ></i>

          </div>


          <p>

            ${completedCount()}
            of
            ${totalLessons()}
            lessons completed

          </p>

        </div>


        <div class="xp-card">

          <span class="eyebrow">
            TOTAL XP
          </span>


          <strong>
            ${state.xp}
          </strong>


          <div class="xp-level">

            Level
            ${levelFromXP(state.xp)}

            ·

            ${xpIntoLevel(state.xp)}/100 XP

          </div>


          <div class="progress">

            <i
              style="
                width:${xpIntoLevel(state.xp)}%
              "
            ></i>

          </div>

        </div>


        <div class="streak-card">

          <span class="eyebrow">
            CURRENT STREAK
          </span>


          <strong>
            🔥 ${state.streak}
          </strong>


          <p>
            days of consistent learning
          </p>


          <div class="streak-dots">
            ● ● ● ● ● ○ ○
          </div>

        </div>

      </div>


      <div class="progress-grid">

        <div class="panel">

          <div class="panel-head">

            <h2>
              Course progress
            </h2>

          </div>


          ${COURSES
            .map(c => `

              <div class="course-progress-row">

                <span>
                  ${c.icon}
                </span>


                <div>

                  <strong>
                    ${c.title}
                  </strong>


                  <div class="progress">

                    <i
                      style="
                        width:${courseProgress(c)}%
                      "
                    ></i>

                  </div>

                </div>


                <b>
                  ${courseProgress(c)}%
                </b>

              </div>

            `)
            .join("")}

        </div>


        <div class="panel">

          <div class="panel-head">

            <h2>
              🏆 Badges
            </h2>


            <span>
              ${state.badges.length}
              earned
            </span>

          </div>


          <div class="badge-grid">

            ${state.badges
              .map(id => {

                const b =
                  badgeInfo(id);

                return `

                  <div class="badge-card">

                    <div>
                      ${b[0]}
                    </div>


                    <strong>
                      ${b[1]}
                    </strong>


                    <small>
                      ${b[2]}
                    </small>

                  </div>

                `;

              })
              .join("")}

          </div>

        </div>

      </div>

    </section>

  `, "progress");
}


/* =========================================================
   PROFILE
   ========================================================= */

function renderProfile() {

  const level =
    levelFromXP(state.xp);


  app.innerHTML = layout(`

    <section class="page">

      <div class="profile-hero">

        <div class="profile-avatar">

          ${state.student.name.charAt(0)}

        </div>


        <div>

          <span class="eyebrow">
            STUDENT PROFILE
          </span>


          <h1>
            ${state.student.name}
          </h1>


          <p>
            ${state.student.email}
          </p>


          <span class="level-tag">

            ⚡ Level ${level}

            Learning Explorer

          </span>

        </div>


        <button
          class="btn btn-light"
          onclick="editProfile()"
        >
          Edit Profile
        </button>

      </div>


      <div class="profile-grid">

        <div class="panel">

          <h2>
            Learning statistics
          </h2>


          <div class="profile-stat-list">

            <div>

              <span>
                ⚡
              </span>

              <strong>
                ${state.xp}
              </strong>

              <small>
                Total XP
              </small>

            </div>


            <div>

              <span>
                📚
              </span>

              <strong>
                ${completedCount()}
              </strong>

              <small>
                Lessons completed
              </small>

            </div>


            <div>

              <span>
                🔥
              </span>

              <strong>
                ${state.streak}
              </strong>

              <small>
                Day streak
              </small>

            </div>


            <div>

              <span>
                🏆
              </span>

              <strong>
                ${state.badges.length}
              </strong>

              <small>
                Badges earned
              </small>

            </div>

          </div>

        </div>


        <div class="panel">

          <h2>
            My achievements
          </h2>


          <div class="badge-grid">

            ${state.badges
              .map(id => {

                const b =
                  badgeInfo(id);

                return `

                  <div class="badge-card">

                    <div>
                      ${b[0]}
                    </div>


                    <strong>
                      ${b[1]}
                    </strong>


                    <small>
                      ${b[2]}
                    </small>

                  </div>

                `;

              })
              .join("")}

          </div>

        </div>

      </div>


      <div class="panel danger-panel">

        <h3>
          Demo data
        </h3>


        <p>
          Resetting will clear local learning
          progress on this browser.
        </p>


        <button
          class="btn btn-danger"
          onclick="resetData()"
        >
          Reset progress
        </button>

      </div>

    </section>

  `, "profile");
}


/* =========================================================
   EDIT PROFILE
   ========================================================= */

function editProfile() {

  const name =
    prompt(
      "Enter your name:",
      state.student.name
    );


  if (
    name &&
    name.trim()
  ) {

    state.student.name =
      name.trim();

    saveState();

    render();

  }
}


/* =========================================================
   RESET PROGRESS
   ========================================================= */

function resetData() {

  if (
    !confirm(
      "Reset all EduReach demo progress?"
    )
  ) {
    return;
  }


  /*
   * IMPORTANT:
   * Resetting learning progress should NOT
   * accidentally log the Firebase user out.
   */

  const wasLoggedIn =
    state.loggedIn;


  const currentSessionUser =
    getSessionUser();


  localStorage.removeItem(
    "edureach-state"
  );


  state =
    structuredClone(
      defaultState
    );


  state.loggedIn =
    wasLoggedIn;


  if (currentSessionUser) {

    if (currentSessionUser.name) {
      state.student.name =
        currentSessionUser.name;
    }

    if (currentSessionUser.email) {
      state.student.email =
        currentSessionUser.email;
    }

  }


  saveState();

  render();
}


/* =========================================================
   START APPLICATION
   ========================================================= */

render();
