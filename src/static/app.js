document.addEventListener("DOMContentLoaded", () => {
  const activitiesList = document.getElementById("activities-list");
  const activitySelect = document.getElementById("activity");
  const signupForm = document.getElementById("signup-form");
  const messageDiv = document.getElementById("message");
  const authStatus = document.getElementById("auth-status");
  const signupHelp = document.getElementById("signup-help");
  const userMenuButton = document.getElementById("user-menu-button");
  const authModal = document.getElementById("auth-modal");
  const closeAuthModalButton = document.getElementById("close-auth-modal");
  const loginForm = document.getElementById("login-form");
  const logoutButton = document.getElementById("logout-button");

  let isTeacherLoggedIn = false;

  function showMessage(text, type = "info") {
    messageDiv.textContent = text;
    messageDiv.className = type;
    messageDiv.classList.remove("hidden");

    setTimeout(() => {
      messageDiv.classList.add("hidden");
    }, 5000);
  }

  function toggleAuthModal(show) {
    authModal.classList.toggle("hidden", !show);
  }

  function updateAuthUI(authState) {
    isTeacherLoggedIn = Boolean(authState.authenticated);

    signupForm.querySelectorAll("input, select, button[type='submit']").forEach((field) => {
      field.disabled = !isTeacherLoggedIn;
    });

    if (isTeacherLoggedIn) {
      authStatus.textContent = `Logged in as ${authState.name}`;
      signupHelp.textContent = "Teacher access enabled. You can register or unregister students.";
      signupHelp.className = "info-message success-text";
      userMenuButton.querySelector(".auth-label").textContent = "Teacher Menu";
      logoutButton.classList.remove("hidden");
    } else {
      authStatus.textContent = "Teacher login required for changes";
      signupHelp.textContent = "Students can view registrations, but only logged-in teachers can make changes.";
      signupHelp.className = "info-message";
      userMenuButton.querySelector(".auth-label").textContent = "Teacher Login";
      logoutButton.classList.add("hidden");
    }
  }

  async function fetchAuthStatus() {
    const response = await fetch("/auth/status", {
      credentials: "same-origin",
    });
    const authState = await response.json();
    updateAuthUI(authState);
    return authState;
  }

  async function fetchActivities() {
    try {
      const response = await fetch("/activities", {
        credentials: "same-origin",
      });
      const activities = await response.json();

      activitiesList.innerHTML = "";
      activitySelect.innerHTML = '<option value="">-- Select an activity --</option>';

      Object.entries(activities).forEach(([name, details]) => {
        const activityCard = document.createElement("div");
        activityCard.className = "activity-card";

        const spotsLeft = details.max_participants - details.participants.length;
        const participantsHTML =
          details.participants.length > 0
            ? `<div class="participants-section">
                <h5>Participants:</h5>
                <ul class="participants-list">
                  ${details.participants
                    .map((email) => {
                      const removeButton = isTeacherLoggedIn
                        ? `<button class="delete-btn" data-activity="${name}" data-email="${email}" aria-label="Remove ${email}">❌</button>`
                        : "";

                      return `<li><span class="participant-email">${email}</span>${removeButton}</li>`;
                    })
                    .join("")}
                </ul>
              </div>`
            : `<p><em>No participants yet</em></p>`;

        activityCard.innerHTML = `
          <h4>${name}</h4>
          <p>${details.description}</p>
          <p><strong>Schedule:</strong> ${details.schedule}</p>
          <p><strong>Availability:</strong> ${spotsLeft} spots left</p>
          <div class="participants-container">
            ${participantsHTML}
          </div>
        `;

        activitiesList.appendChild(activityCard);

        const option = document.createElement("option");
        option.value = name;
        option.textContent = name;
        activitySelect.appendChild(option);
      });

      if (isTeacherLoggedIn) {
        document.querySelectorAll(".delete-btn").forEach((button) => {
          button.addEventListener("click", handleUnregister);
        });
      }
    } catch (error) {
      activitiesList.innerHTML =
        "<p>Failed to load activities. Please try again later.</p>";
      console.error("Error fetching activities:", error);
    }
  }

  async function handleUnregister(event) {
    const button = event.target;
    const activity = button.getAttribute("data-activity");
    const email = button.getAttribute("data-email");

    try {
      const response = await fetch(
        `/activities/${encodeURIComponent(activity)}/unregister?email=${encodeURIComponent(email)}`,
        {
          method: "DELETE",
          credentials: "same-origin",
        }
      );

      const result = await response.json();

      if (response.ok) {
        showMessage(result.message, "success");
        fetchActivities();
      } else {
        if (response.status === 401) {
          updateAuthUI({ authenticated: false });
          toggleAuthModal(true);
        }
        showMessage(result.detail || "An error occurred", "error");
      }
    } catch (error) {
      showMessage("Failed to unregister. Please try again.", "error");
      console.error("Error unregistering:", error);
    }
  }

  userMenuButton.addEventListener("click", () => {
    toggleAuthModal(true);
  });

  closeAuthModalButton.addEventListener("click", () => {
    toggleAuthModal(false);
  });

  authModal.addEventListener("click", (event) => {
    if (event.target === authModal) {
      toggleAuthModal(false);
    }
  });

  loginForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const username = document.getElementById("username").value.trim();
    const password = document.getElementById("password").value;

    try {
      const response = await fetch("/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "same-origin",
        body: JSON.stringify({ username, password }),
      });

      const result = await response.json();

      if (response.ok) {
        updateAuthUI({ authenticated: true, name: result.name, username: result.username });
        loginForm.reset();
        toggleAuthModal(false);
        showMessage(result.message, "success");
        fetchActivities();
      } else {
        showMessage(result.detail || "Login failed", "error");
      }
    } catch (error) {
      showMessage("Failed to log in. Please try again.", "error");
      console.error("Error logging in:", error);
    }
  });

  logoutButton.addEventListener("click", async () => {
    try {
      const response = await fetch("/auth/logout", {
        method: "POST",
        credentials: "same-origin",
      });
      const result = await response.json();
      updateAuthUI({ authenticated: false });
      toggleAuthModal(false);
      showMessage(result.message, "info");
      fetchActivities();
    } catch (error) {
      showMessage("Failed to log out. Please try again.", "error");
      console.error("Error logging out:", error);
    }
  });

  signupForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    if (!isTeacherLoggedIn) {
      showMessage("Teacher login required", "error");
      toggleAuthModal(true);
      return;
    }

    const email = document.getElementById("email").value;
    const activity = document.getElementById("activity").value;

    try {
      const response = await fetch(
        `/activities/${encodeURIComponent(activity)}/signup?email=${encodeURIComponent(email)}`,
        {
          method: "POST",
          credentials: "same-origin",
        }
      );

      const result = await response.json();

      if (response.ok) {
        showMessage(result.message, "success");
        signupForm.reset();
        fetchActivities();
      } else {
        if (response.status === 401) {
          updateAuthUI({ authenticated: false });
          toggleAuthModal(true);
        }
        showMessage(result.detail || "An error occurred", "error");
      }
    } catch (error) {
      showMessage("Failed to sign up. Please try again.", "error");
      console.error("Error signing up:", error);
    }
  });

  fetchAuthStatus()
    .catch((error) => {
      console.error("Error checking auth status:", error);
      updateAuthUI({ authenticated: false });
    })
    .finally(fetchActivities);
});
