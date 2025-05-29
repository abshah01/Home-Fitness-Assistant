// ================================
// Home Fitness Assistant App Logic
// ================================

document.addEventListener("DOMContentLoaded", () => {
  const userNumberField = document.getElementById("userNumber");
  const registrationForm = document.getElementById("registrationForm");
  const planSection = document.getElementById("planSection");
  const planDetails = document.getElementById("planDetails");
  const startWorkoutBtn = document.getElementById("startWorkoutBtn");
  const workoutSession = document.getElementById("workoutSession");
  const currentExerciseDisplay = document.getElementById("currentExercise");
  const timerDisplay = document.getElementById("timerDisplay");
  const finishExerciseBtn = document.getElementById("finishExerciseBtn");
  const motivationMessage = document.getElementById("motivationMessage");
  const alarmSound = document.getElementById("alarmSound");

  // Serial User Number from localStorage or start from 1
  let lastUserNumber = parseInt(localStorage.getItem("lastUserNumber")) || 0;

  // Variables to hold user data and workout session
  let userData = null;
  let workoutPlan = null;
  let workoutExercises = [];
  let currentExerciseIndex = 0;
  let exerciseTimer = null;
  let alarmTimeout = null;

  // Assign user number serially on page load (waiting for registration)
  function assignUserNumber() {
    lastUserNumber++;
    localStorage.setItem("lastUserNumber", lastUserNumber);
    return lastUserNumber.toString().padStart(2, "0");
  }

  // Workout routines by body type and goal
  const routines = {
    chubby: {
      fit: {
        exercises: [
          { name: "30-sec Jumping Jacks", duration: 30 },
          { name: "30-sec Bodyweight Squats", duration: 30 },
          { name: "30-sec Wall Push-ups", duration: 30 },
          { name: "30-sec March in Place", duration: 30 }
        ],
        diet: "Focus on a balanced diet with calorie deficit. Eat more veggies, lean proteins, and drink lots of water."
      },
      sixpack: {
        exercises: [
          { name: "20 Crunches", duration: 40 },
          { name: "20 Bicycle Crunches", duration: 40 },
          { name: "Plank - 30 seconds", duration: 30 },
          { name: "Mountain Climbers - 30 seconds", duration: 30 }
        ],
        diet: "Cut sugars and refined carbs. Increase protein intake to help fat loss while maintaining muscle."
      },
      bodybuilder: {
        exercises: [
          { name: "Push-ups - 15 reps", duration: 45 },
          { name: "Squats - 20 reps", duration: 45 },
          { name: "Lunges - 15 reps each leg", duration: 45 },
          { name: "Plank - 40 seconds", duration: 40 }
        ],
        diet: "High protein, moderate carbs, healthy fats. Eat frequent small meals to fuel muscle growth."
      }
    },
    slim: {
      fit: {
        exercises: [
          { name: "Light Jog - 1 min", duration: 60 },
          { name: "Bodyweight Push-ups - 15 reps", duration: 40 },
          { name: "Jumping Jacks - 30 sec", duration: 30 },
          { name: "Lunges - 15 each leg", duration: 45 }
        ],
        diet: "Eat calorie-rich nutritious food, including nuts, dairy, and lean proteins. Aim to gain healthy weight."
      },
      sixpack: {
        exercises: [
          { name: "Crunches - 30 reps", duration: 45 },
          { name: "Leg Raises - 20 reps", duration: 40 },
          { name: "Plank - 45 seconds", duration: 45 },
          { name: "Russian Twists - 30 reps", duration: 40 }
        ],
        diet: "Protein focus with moderate carbs and healthy fats. Eat complex carbs to fuel workouts."
      },
      bodybuilder: {
        exercises: [
          { name: "Push-ups - 20 reps", duration: 50 },
          { name: "Squats - 25 reps", duration: 50 },
          { name: "Dips (use chair) - 15 reps", duration: 45 },
          { name: "Plank - 1 min", duration: 60 }
        ],
        diet: "High protein and calorie surplus. Include lean meats, eggs, nuts, and veggies."
      }
    },
    bulk: {
      fit: {
        exercises: [
          { name: "Brisk Walk - 2 mins", duration: 120 },
          { name: "Push-ups - 20 reps", duration: 50 },
          { name: "Bodyweight Squats - 20 reps", duration: 50 },
          { name: "Stretching - 2 mins", duration: 120 }
        ],
        diet: "Maintain balanced calories to keep muscle and reduce fat."
      },
      sixpack: {
        exercises: [
          { name: "Crunches - 40 reps", duration: 60 },
          { name: "Leg Raises - 30 reps", duration: 50 },
          { name: "Plank - 1 min", duration: 60 },
          { name: "Mountain Climbers - 45 sec", duration: 45 }
        ],
        diet: "Cut fats and sugars carefully, increase protein intake for definition."
      },
      bodybuilder: {
        exercises: [
          { name: "Push-ups - 25 reps", duration: 60 },
          { name: "Squats - 30 reps", duration: 60 },
          { name: "Lunges - 20 reps each leg", duration: 60 },
          { name: "Plank - 1 min 30 sec", duration: 90 }
        ],
        diet: "High protein, moderate carbs. Focus on muscle maintenance."
      }
    }
  };

  // Motivational messages array
  const motivationMessages = [
    "Keep it up! You're doing amazing! 💪",
    "Almost there! Stay strong! 🔥",
    "Great job! One step closer! 🚀",
    "You got this! Keep pushing! ✨",
    "Feel the burn, love the results! ❤️"
  ];

  // Show popup notification (simple)
  function showPopup(message) {
    const popup = document.createElement("div");
    popup.classList.add("popup");
    popup.textContent = message;
    document.body.appendChild(popup);

    setTimeout(() => {
      popup.classList.add("fadeout");
      setTimeout(() => document.body.removeChild(popup), 700);
    }, 2500);
  }

  // Play sound effect helper
  function playSound() {
    alarmSound.currentTime = 0;
    alarmSound.play();
  }

  // Validate and process registration form
  registrationForm.addEventListener("submit", (e) => {
    e.preventDefault();

    // Assign serial user number
    const assignedNumber = assignUserNumber();
    userNumberField.value = assignedNumber;

    // Read input values
    const photoInput = document.getElementById("photo");
    const height = document.getElementById("height").value.trim();
    const weight = +document.getElementById("weight").value;
    const bodyType = document.getElementById("bodyType").value;
    const goal = document.getElementById("goal").value;
    const alarmTime = document.getElementById("alarmTime").value;

    if (!photoInput.files[0]) {
      alert("Please upload a photo.");
      return;
    }
    if (!height || !weight || !bodyType || !goal || !alarmTime) {
      alert("Please fill in all fields.");
      return;
    }

    // Store user data
    userData = {
      userNumber: assignedNumber,
      height,
      weight,
      bodyType,
      goal,
      alarmTime,
      photo: URL.createObjectURL(photoInput.files[0])
    };

    // Generate workout plan
    workoutPlan = routines[bodyType][goal];

    // Show plan section and hide form
    registrationForm.classList.add("hidden");
    planSection.classList.remove("hidden");

    // Display plan details
    let planText = `Hello User #${userData.userNumber}!\n\nYour Exercises:\n`;
    workoutPlan.exercises.forEach((ex, i) => {
      planText += `${i + 1}. ${ex.name} - approx. ${ex.duration} sec\n`;
    });
    planText += `\nDiet Advice:\n${workoutPlan.diet}`;

    planDetails.textContent = planText;

    // Setup alarm
    setupAlarm(userData.alarmTime);

    showPopup("Registration successful! Your plan is ready.");
  });

  // Setup alarm clock using setTimeout & setInterval
  function setupAlarm(timeStr) {
    if (alarmTimeout) clearTimeout(alarmTimeout);

    const [hours, minutes] = timeStr.split(":").map(Number);
    const now = new Date();
    const alarmDate = new Date();

    alarmDate.setHours(hours, minutes, 0, 0);

    // If alarm time already passed today, set for next day
    if (alarmDate <= now) alarmDate.setDate(alarmDate.getDate() + 1);

    const timeToAlarm = alarmDate - now;

    alarmTimeout = setTimeout(() => {
      playSound();
      alert("⏰ Time for your daily workout! Let's get moving!");
      setupAlarm(timeStr); // reset alarm for next day
    }, timeToAlarm);
  }

  // Start workout session button
  startWorkoutBtn.addEventListener("click", () => {
    if (!workoutPlan) return;

    workoutExercises = workoutPlan.exercises;
    currentExerciseIndex = 0;

    planSection.classList.add("hidden");
    workoutSession.classList.remove("hidden");

    startExercise();
  });

  // Start individual exercise with timer
  function startExercise() {
    if (currentExerciseIndex >= workoutExercises.length) {
      currentExerciseDisplay.textContent = "🎉 Workout Complete! Great job!";
      timerDisplay.textContent = "";
      finishExerciseBtn.disabled = true;
      motivationMessage.textContent = "Remember to stay consistent!";
      return;
    }

    const exercise = workoutExercises[currentExerciseIndex];
    currentExerciseDisplay.textContent = `Exercise ${currentExerciseIndex + 1} of ${workoutExercises.length}: ${exercise.name}`;
    timerDisplay.textContent = formatTime(exercise.duration);
    finishExerciseBtn.disabled = true;
    motivationMessage.textContent = "Get ready...";

    let timeLeft = exercise.duration;

    if (exerciseTimer) clearInterval(exerciseTimer);
    exerciseTimer = setInterval(() => {
      timeLeft--;
      timerDisplay.textContent = formatTime(timeLeft);

      if (timeLeft <= 5 && timeLeft > 0) {
        motivationMessage.textContent = motivationMessages[Math.floor(Math.random() * motivationMessages.length)];
      }

      if (timeLeft <= 0) {
        clearInterval(exerciseTimer);
        finishExerciseBtn.disabled = false;
        motivationMessage.textContent = "Done? Click 'Finished Exercise' to continue.";
        playSound();
      }
    }, 1000);
  }

  // Format seconds as MM:SS
  function formatTime(seconds) {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m > 0 ? m + ":" : ""}${s.toString().padStart(2, "0")}`;
  }

  // Finish exercise button click
  finishExerciseBtn.addEventListener("click", () => {
    currentExerciseIndex++;
    startExercise();
  });

  // Assign user number on page load
  userNumberField.value = assignUserNumber();
});
