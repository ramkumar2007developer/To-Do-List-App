const taskInput = document.getElementById("taskInput");
const addButton = document.getElementById("addButton");
const taskTable = document.getElementById("task-table");
const searchBox = document.getElementById("searchBox");
const filterButtons = document.querySelectorAll(".filter button");
const emptyState = document.getElementById("emptyState");
const datePicker = document.getElementById("datePicker");
const resetButton = document.getElementById("resetButton");

const STORAGE_KEY = "todoTasks";

let taskCount = 0;
let tasks = [];
let currentFilter = "all";

function updateSerialNumbers() {
  const rows = taskTable.querySelectorAll("tr");
  rows.forEach((row, index) => {
    const serialCell = row.cells[0];
    if (serialCell) {
      serialCell.textContent = index + 1;
    }
  });
}

function updateEmptyState() {
  const rows = taskTable.querySelectorAll("tr");
  const hasVisibleRows = Array.from(rows).some(
    (row) => row.style.display !== "none",
  );
  emptyState.hidden = hasVisibleRows;
}

function filterTasks() {
  const searchText = searchBox.value.trim().toLowerCase();
  const rows = taskTable.querySelectorAll("tr");

  rows.forEach((row) => {
    const taskText = row.dataset.taskText || "";
    const matchesSearch = taskText.toLowerCase().includes(searchText);
    const isCompleted = row.classList.contains("completed");

    let matchesFilter = true;
    if (currentFilter === "pending") {
      matchesFilter = !isCompleted;
    } else if (currentFilter === "completed") {
      matchesFilter = isCompleted;
    }

    row.style.display = matchesSearch && matchesFilter ? "" : "none";
  });

  updateEmptyState();
}

function setFilter(filter) {
  currentFilter = filter;

  filterButtons.forEach((button) => {
    button.classList.toggle("active", button.dataset.filter === filter);
  });

  filterTasks();
}

function startEdit(row, editButton) {
  const taskTextSpan = row.querySelector(".task-text");
  if (!taskTextSpan) return;

  const currentText = taskTextSpan.textContent;
  const input = document.createElement("input");
  input.type = "text";
  input.value = currentText;
  input.className = "edit-input";

  taskTextSpan.replaceWith(input);
  editButton.dataset.mode = "editing";
  editButton.textContent = "Save";
  input.focus();

  input.addEventListener("keydown", (event) => {
    if (event.key === "Enter") {
      saveEdit(input, row, editButton);
    }
  });
}

function saveEdit(input, row, editButton) {
  const newText = input.value.trim();

  if (!newText) {
    alert("Task cannot be empty.");
    input.focus();
    return;
  }

  const updatedSpan = document.createElement("span");
  updatedSpan.className = "task-text";
  updatedSpan.textContent = newText;
  updatedSpan.classList.toggle(
    "completed-text",
    row.classList.contains("completed"),
  );

  input.replaceWith(updatedSpan);
  editButton.dataset.mode = "edit";
  editButton.textContent = "Edit";

  const task = tasks.find((item) => item.row === row);
  if (task) {
    task.text = newText;
  }
  row.dataset.taskText = newText;
  filterTasks();
}

function saveTasks() {
  try {
    const taskData = tasks.map((task) => ({
      text: task.text,
      completed: task.completed,
    }));
    localStorage.setItem(STORAGE_KEY, JSON.stringify(taskData));
  } catch (error) {
    console.error("Unable to save tasks:", error);
  }
}

function createTaskRow(taskText, completed = false) {
  taskCount += 1;

  const row = document.createElement("tr");
  const serialCell = document.createElement("td");
  serialCell.textContent = taskCount;

  const checkCell = document.createElement("td");
  const checkbox = document.createElement("input");
  checkbox.type = "checkbox";
  checkbox.className = "task-check";
  checkbox.checked = completed;
  checkCell.appendChild(checkbox);

  const taskCell = document.createElement("td");
  const taskTextSpan = document.createElement("span");
  taskTextSpan.className = "task-text";
  taskTextSpan.textContent = taskText;
  taskTextSpan.classList.toggle("completed-text", completed);
  taskCell.appendChild(taskTextSpan);

  const editCell = document.createElement("td");
  const editButton = document.createElement("button");
  editButton.type = "button";
  editButton.className = "edit-btn";
  editButton.textContent = "Edit";
  editButton.dataset.mode = "edit";
  editCell.appendChild(editButton);

  const actionCell = document.createElement("td");
  const deleteButton = document.createElement("button");
  deleteButton.type = "button";
  deleteButton.className = "delete-btn";
  deleteButton.textContent = "Delete";
  actionCell.appendChild(deleteButton);

  row.dataset.taskText = taskText;
  row.classList.toggle("completed", completed);
  row.append(serialCell, checkCell, taskCell, editCell, actionCell);

  checkbox.addEventListener("change", () => {
    const isCompleted = checkbox.checked;
    row.classList.toggle("completed", isCompleted);
    const currentTaskTextSpan = row.querySelector(".task-text");
    if (currentTaskTextSpan) {
      currentTaskTextSpan.classList.toggle("completed-text", isCompleted);
    }

    const task = tasks.find((item) => item.row === row);
    if (task) {
      task.completed = isCompleted;
    }

    saveTasks();
    filterTasks();
  });

  editButton.addEventListener("click", () => {
    if (editButton.dataset.mode === "editing") {
      const inputField = row.querySelector(".edit-input");
      if (inputField) {
        saveEdit(inputField, row, editButton);
      }
    } else {
      startEdit(row, editButton);
    }
  });

  deleteButton.addEventListener("click", () => {
    tasks = tasks.filter((item) => item.row !== row);
    row.remove();
    updateSerialNumbers();
    updateEmptyState();
    saveTasks();
  });

  tasks.push({ row, text: taskText, completed });
  taskTable.appendChild(row);
  filterTasks();

  return tasks[tasks.length - 1];
}

function addTask() {
  const taskText = taskInput.value.trim();

  if (!taskText) {
    alert("Please enter a task.");
    return;
  }

  createTaskRow(taskText);
  saveTasks();
  taskInput.value = "";
  taskInput.focus();
}

function loadTasks() {
  try {
    const savedTasks = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");

    if (!Array.isArray(savedTasks)) {
      return;
    }

    tasks = [];
    taskTable.innerHTML = "";
    taskCount = 0;

    savedTasks.forEach((taskData) => {
      createTaskRow(taskData.text, taskData.completed || false);
    });

    updateSerialNumbers();
    filterTasks();
    updateEmptyState();
  } catch (error) {
    console.error("Unable to load tasks:", error);
  }
}

addButton.addEventListener("click", addTask);

resetButton.addEventListener("click", () => {
  tasks = [];
  taskTable.innerHTML = "";
  taskCount = 0;
  updateEmptyState();
  saveTasks();
});

taskInput.addEventListener("keydown", function (event) {
  if (event.key === "Enter") {
    addTask();
  }
});

searchBox.addEventListener("input", filterTasks);

filterButtons.forEach((button) => {
  button.addEventListener("click", () => {
    setFilter(button.dataset.filter);
  });
});

function updateDateDisplay() {
  if (!datePicker.value) {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, "0");
    const day = String(now.getDate()).padStart(2, "0");
    datePicker.value = `${year}-${month}-${day}`;
  }
}

setFilter("all");
updateEmptyState();
updateDateDisplay();
loadTasks();

datePicker.addEventListener("change", updateDateDisplay);
