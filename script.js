
const PASSWORD = "marppilot";

function checkPassword() {
    const input = document.getElementById("password").value;
    if (input === PASSWORD) {
        document.getElementById("login-screen").style.display = "none";
        document.getElementById("app").style.display = "block";
        loadAll();
    } else {
        alert("Mot de passe incorrect");
    }
}

function switchTab(tabId) {
    document.querySelectorAll('.tab').forEach(tab => tab.style.display = 'none');
    document.getElementById(tabId).style.display = 'block';
}

// Dashboard
function addTask() {
    const taskInput = document.getElementById("new-task");
    const task = taskInput.value.trim();
    if (task) {
        const tasks = JSON.parse(localStorage.getItem("tasks") || "[]");
        tasks.push(task);
        localStorage.setItem("tasks", JSON.stringify(tasks));
        taskInput.value = "";
        renderTasks();
    }
}
function renderTasks() {
    const tasks = JSON.parse(localStorage.getItem("tasks") || "[]");
    const list = document.getElementById("task-list");
    list.innerHTML = "";
    tasks.forEach((task, index) => {
        const li = document.createElement("li");
        li.textContent = task;
        li.onclick = () => { tasks.splice(index, 1); localStorage.setItem("tasks", JSON.stringify(tasks)); renderTasks(); };
        list.appendChild(li);
    });
}

// Following
const categories = ["DeFi", "NFT", "L1/L2", "Watchlist"];
function loadCategories() {
    const select = document.getElementById("category-select");
    select.innerHTML = "";
    categories.forEach(cat => {
        const option = document.createElement("option");
        option.value = cat;
        option.textContent = cat;
        select.appendChild(option);
    });
}
function addFollowing() {
    const item = document.getElementById("new-following").value.trim();
    const category = document.getElementById("category-select").value;
    if (item && category) {
        const data = JSON.parse(localStorage.getItem("following") || "{}");
        data[category] = data[category] || [];
        data[category].push(item);
        localStorage.setItem("following", JSON.stringify(data));
        document.getElementById("new-following").value = "";
        renderFollowing();
    }
}
function renderFollowing() {
    const category = document.getElementById("category-select").value;
    const data = JSON.parse(localStorage.getItem("following") || "{}");
    const list = document.getElementById("following-list");
    list.innerHTML = "";
    (data[category] || []).forEach((item, index) => {
        const li = document.createElement("li");
        li.textContent = item;
        li.onclick = () => {
            data[category].splice(index, 1);
            localStorage.setItem("following", JSON.stringify(data));
            renderFollowing();
        };
        list.appendChild(li);
    });
}

// Notes
function saveNotes() {
    const content = document.getElementById("notes-area").value;
    localStorage.setItem("notes", content);
}
function loadNotes() {
    document.getElementById("notes-area").value = localStorage.getItem("notes") || "";
}

function loadAll() {
    loadCategories();
    renderTasks();
    renderFollowing();
    loadNotes();
}
