const COURSES = [
  {
    id: "cs101",
    title: "Programming Fundamentals",
    category: "Computer Science",
    icon: "💻",
    color: "purple",
    difficulty: "Beginner",
    duration: "4 weeks",
    lessons: 6,
    description: "Build a strong foundation in programming with simple, practical examples.",
    modules: [
      {
        id: "m1",
        title: "Getting Started",
        description: "Understand programming, algorithms and problem solving.",
        lessons: [
          { id: "l1", title: "What is Programming?", type: "video", duration: "8 min", xp: 20, content: "Learn how programs work, why programming matters, and how instructions are translated into actions." },
          { id: "l2", title: "Algorithms & Flowcharts", type: "reading", duration: "10 min", xp: 20, content: "Explore algorithms as step-by-step solutions and use simple flowcharts to represent logic." }
        ]
      },
      {
        id: "m2",
        title: "Variables & Conditions",
        description: "Learn how programs store information and make decisions.",
        lessons: [
          { id: "l3", title: "Variables & Data Types", type: "video", duration: "9 min", xp: 25, content: "Understand variables, numbers, strings, booleans and how values change while a program runs." },
          { id: "l4", title: "If / Else Decisions", type: "reading", duration: "12 min", xp: 25, content: "Learn how conditions help a program choose between different actions." }
        ]
      },
      {
        id: "m3",
        title: "Loops & Practice",
        description: "Repeat actions efficiently and test your understanding.",
        lessons: [
          { id: "l5", title: "Loops", type: "video", duration: "11 min", xp: 30, content: "Use loops to repeat a block of instructions and avoid unnecessary repeated code." },
          { id: "l6", title: "Mini Coding Challenge", type: "quiz", duration: "8 min", xp: 40, content: "Test your programming fundamentals with a short challenge." }
        ]
      }
    ]
  },
  {
    id: "phy101",
    title: "Basic Physics",
    category: "Science",
    icon: "⚛️",
    color: "blue",
    difficulty: "Beginner",
    duration: "3 weeks",
    lessons: 5,
    description: "Discover motion, force and energy through everyday examples.",
    modules: [
      {
        id: "p1",
        title: "Motion",
        description: "Understand distance, speed and movement.",
        lessons: [
          { id: "p1l1", title: "Understanding Motion", type: "video", duration: "8 min", xp: 20, content: "Motion describes how an object's position changes with time. Learn using familiar examples." },
          { id: "p1l2", title: "Speed & Distance", type: "reading", duration: "9 min", xp: 20, content: "Explore the relationship between distance, time and speed." }
        ]
      },
      {
        id: "p2",
        title: "Force & Energy",
        description: "Learn the basic ideas behind forces and energy.",
        lessons: [
          { id: "p2l1", title: "Forces Around Us", type: "video", duration: "10 min", xp: 25, content: "Pushes and pulls are examples of forces. Explore how forces affect objects." },
          { id: "p2l2", title: "Energy Basics", type: "reading", duration: "10 min", xp: 25, content: "Learn about common forms of energy and how energy can be transferred." },
          { id: "p2l3", title: "Physics Checkpoint", type: "quiz", duration: "7 min", xp: 40, content: "A quick quiz to check your understanding." }
        ]
      }
    ]
  },
  {
    id: "math101",
    title: "Applied Mathematics",
    category: "Mathematics",
    icon: "📐",
    color: "orange",
    difficulty: "Intermediate",
    duration: "4 weeks",
    lessons: 6,
    description: "Connect mathematical concepts to practical and technical situations.",
    modules: [
      {
        id: "a1",
        title: "Numbers in Real Life",
        description: "Use numbers and percentages in everyday situations.",
        lessons: [
          { id: "a1l1", title: "Percentages", type: "video", duration: "9 min", xp: 20, content: "Learn to calculate and interpret percentages using practical examples." },
          { id: "a1l2", title: "Ratios & Proportions", type: "reading", duration: "11 min", xp: 20, content: "Understand ratios and proportions and where they are used." }
        ]
      },
      {
        id: "a2",
        title: "Problem Solving",
        description: "Break real-world problems into manageable steps.",
        lessons: [
          { id: "a2l1", title: "Reading Word Problems", type: "reading", duration: "10 min", xp: 25, content: "Learn a structured approach for identifying known values, unknowns and operations." },
          { id: "a2l2", title: "Practice Quiz", type: "quiz", duration: "8 min", xp: 40, content: "Apply your problem-solving skills." }
        ]
      }
    ]
  }
];

const QUIZZES = {
  l6: [
    { q: "Which structure repeats a block of instructions?", options: ["Loop", "Variable", "Comment", "String"], answer: 0 },
    { q: "Which value represents a yes/no condition?", options: ["Boolean", "Integer", "Array", "Float"], answer: 0 },
    { q: "What is an algorithm?", options: ["A device", "A step-by-step solution", "A color", "A file"], answer: 1 }
  ],
  p2l3: [
    { q: "A force is best described as a...", options: ["Push or pull", "Color", "Temperature", "Number"], answer: 0 },
    { q: "Which is a form of energy?", options: ["Sound", "Distance", "Shape", "Length"], answer: 0 },
    { q: "Speed relates distance to...", options: ["Time", "Color", "Mass only", "Shape"], answer: 0 }
  ],
  a2l2: [
    { q: "What should you identify first in a word problem?", options: ["The answer", "Known and unknown values", "The font", "The page number"], answer: 1 },
    { q: "25% means...", options: ["25 out of 100", "25 out of 10", "100 out of 25", "1 out of 25"], answer: 0 },
    { q: "A ratio compares...", options: ["Two quantities", "Only time", "Only money", "Two colors"], answer: 0 }
  ]
};
