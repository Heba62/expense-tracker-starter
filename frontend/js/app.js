const API_URL = "http://localhost:3000/api/expenses";

const expensesTableBody = document.querySelector(".expenseTableBody");
const totalAmount = document.querySelector(".total-amount");
const totalCount = document.querySelector(".total-count");
const highestAmount = document.querySelector(".highest-amount");
let editingId = null;

function toggleSpinner(show) {
  const spinner = document.getElementById("loading-spinner");
  if (spinner) {
    if (show) {
      spinner.classList.remove("d-none");
    } else {
      spinner.classList.add("d-none");
    }
  }
}

function showAlert(message, type = "danger") {
  const alertContainer = document.getElementById("alert-container");
  if (!alertContainer) return;

  alertContainer.innerHTML = `
    <div class="alert alert-${type} alert-dismissible fade show" role="alert">
      ${message}
      <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
    </div>
  `;
}

async function getExpenses() {
  const res = await fetch(API_URL);
  return await res.json();
}

async function addExpense(expenseData) {
  const res = await fetch(API_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(expenseData),
  });
  return await res.json();
}

async function deleteExpense(id) {
  const res = await fetch(`${API_URL}/${id}`, {
    method: "DELETE",
  });
  return await res.json();
}

async function updateExpense(id, expenseData) {
  const res = await fetch(`${API_URL}/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(expenseData),
  });
  return await res.json();
}

async function refresh() {
  try {
    toggleSpinner(true);
    const expenses = await getExpenses();
    renderTable(expenses);
    renderSummary(expenses);

    applyFilter();

    cachedExpenses = expenses;
    if (myChart) {
      myChart.destroy();
    }
    createChart(cachedExpenses, myChart ? myChart.config.type : "bar");

    // console.log(expenses);
  } catch (error) {
    console.error("Error details:", error);

    if (
      error.message.includes("Failed to fetch") ||
      error.name === "TypeError"
    ) {
      showAlert(
        "Sorry, the server is currently disconnected. Please ensure the server is running.",
      );
    } else if (
      error.status === 400 ||
      (error.message && error.message.includes("400"))
    ) {
      showAlert(
        error.message || "Invalid request (400). Please check the input data.",
      );
    } else {
      showAlert(
        error.message ||
          "An unexpected error occurred; please try again later.",
      );
    }
  } finally {
    toggleSpinner(false);
  }
}

const changeColor = document.getElementById("catColor");

async function renderTable(list) {
  expensesTableBody.innerHTML = "";
  list.forEach((item) => {
    const row = document.createElement("tr");

    row.innerHTML = `
            <td>${item.title}</td>
            <td>${item.amount}</td>
            <td><span class="catColor">${item.category}</span></td>
            <td>${item.date}</td>
            <td class="btn-table">
                <button class="edit" onclick="editExpense(${item.id}, '${item.title}', ${item.amount}, '${item.category}', '${item.date ? item.date.split("T")[0] : ""}')"><a href="#editForm">Edit</a></button>
                <button class="delete" onclick="deleteData(${item.id})">Delete</button>
            </td>
        `;

    const changeColor = row.querySelector(".catColor");
    if (item.category == "Food") {
      changeColor.style.backgroundColor = "rgba(75, 192, 192, 0.6)";
    } else if (item.category == "Bills") {
      changeColor.style.backgroundColor = "rgba(255, 99, 132, 0.6)";
    } else if (item.category == "Transport") {
      changeColor.style.backgroundColor = "rgba(153, 102, 255, 0.6)";
    } else if (item.category == "Entertainment") {
      changeColor.style.backgroundColor = "rgba(54, 162, 235, 0.6)";
    } else {
      changeColor.style.backgroundColor = "rgba(255, 206, 86, 0.6)";
    }
    expensesTableBody.appendChild(row);
  });
}

function renderSummary(list) {
  const totalCountF = list.length;
  totalCount.textContent = totalCountF + ` Expenses`;

  const totalAmountF = list.reduce((sum, item) => sum + Number(item.amount), 0);
  totalAmount.textContent = totalAmountF + ` JOD`;

  const highestAmountF =
    totalCountF > 0 ? Math.max(...list.map((item) => Number(item.amount))) : 0;
  highestAmount.textContent = highestAmountF + ` JOD`;
}

async function deleteData(id) {
  if (confirm("Are you sure you want to delete this expense?")) {
    await deleteExpense(id);
    refresh();
  }
}

function formatToInputDate(dateString) {
  if (!dateString) return "";

  if (dateString.includes("-") && dateString.indexOf("-") === 2) {
    const parts = dateString.split("-");
    if (parts[0].length === 2 && parts[2].length === 4) {
      return `${parts[2]}-${parts[1]}-${parts[0]}`;
    }
  }

  return dateString.split("T")[0];
}

function editExpense(id, title, amount, category, date) {
  editingId = id;
  document.getElementById("expense-title").value = title;
  document.getElementById("expense-amount").value = amount;
  document.getElementById("expense-category").value = category;
  document.getElementById("expense-date").value = formatToInputDate(date);

  document.getElementById("btn-add-expense").textContent = "Update Expense";
  document.getElementById("h3-add").textContent = "Update Expense";
}

const expenseForm = document.getElementById("expense-form");

expenseForm.addEventListener("submit", async (e) => {
  e.preventDefault();

  const newExpense = {
    title: document.getElementById("expense-title").value,
    amount: document.getElementById("expense-amount").value,
    category: document.getElementById("expense-category").value,
    date: document.getElementById("expense-date").value || undefined,
  };

  try {
    toggleSpinner(true);

    if (editingId == null) {
      await addExpense(newExpense);
    } else {
      await updateExpense(editingId, newExpense);
      editingId = null;
      document.getElementById("btn-add-expense").textContent = "Add Expense";
      document.getElementById("h3-add").textContent = "Add Expense";
    }

    expenseForm.reset();
    await refresh();
  } catch (error) {
    console.error("Error details:", error);

    if (
      error.message.includes("Failed to fetch") ||
      error.name === "TypeError"
    ) {
      showAlert(
        "Sorry, the server is currently disconnected. Please ensure the server is running.",
      );
    } else if (
      error.status === 400 ||
      (error.message && error.message.includes("400"))
    ) {
      showAlert(
        error.message || "Invalid request (400). Please check the input data.",
      );
    } else {
      showAlert(
        error.message ||
          "An unexpected error occurred; please try again later.",
      );
    }
  } finally {
    toggleSpinner(false);
  }
});

const categoryInput = document.getElementById("expense-category");
const dropdownItems = document.querySelectorAll(".itemCategory");

let selectedCategory = "";

dropdownItems.forEach((item) => {
  item.addEventListener("click", (e) => {
    selectedCategory = e.target.textContent;
    categoryInput.value = selectedCategory;
  });
});

async function applyFilter() {
  let filterCategory = "";
  const dropdownFilter = document.querySelectorAll(".filter");
  dropdownFilter.forEach((item) => {
    item.addEventListener("click", async (e) => {
      filterCategory = e.target.textContent.trim();

      const expenses = await getExpenses();
      let filteredList = expenses;

      if (filterCategory !== "All Categories") {
        filteredList = expenses.filter(
          (item) => item.category === filterCategory,
        );
      }

      renderTable(filteredList);
    });
  });
}

let myChart = null;
let cachedExpenses = [];

function setChartType(chartType) {
  if (cachedExpenses.length === 0) {
    cachedExpenses = expenses;
  }

  if (myChart) {
    myChart.destroy();
  }

  createChart(cachedExpenses, chartType);
}

function createChart(data, type) {
  const ctx = document.getElementById("myChart").getContext("2d");

  const categoryMap = {};
  data.forEach((item) => {
    const cat = item.category || "Other";
    const amt = parseFloat(item.amount) || 0;

    if (categoryMap[cat]) {
      categoryMap[cat] += amt;
    } else {
      categoryMap[cat] = amt;
    }
  });

  const labels = Object.keys(categoryMap);
  const amounts = Object.values(categoryMap);

  myChart = new Chart(ctx, {
    type: type,
    data: {
      labels: labels,
      datasets: [
        {
          label: "Expenses by Category",
          data: amounts,
          backgroundColor: [
            "rgba(255, 99, 132, 0.6)",
            "rgba(54, 162, 235, 0.6)",
            "rgba(255, 206, 86, 0.6)",
            "rgba(75, 192, 192, 0.6)",
            "rgba(153, 102, 255, 0.6)",
          ],
          borderWidth: 1,
        },
      ],
    },
    options: {
      scales: {
        y: {
          beginAtZero: true,
        },
      },
    },
  });
}

async function initChart() {
  cachedExpenses = await getExpenses();
  createChart(cachedExpenses, "bar");
}

const toggleBtn = document.getElementById("themeToggle");

const getPreferredTheme = () => {
  const savedTheme = localStorage.getItem("theme");
  if (savedTheme) return savedTheme;

  return window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";
};

const setTheme = (theme) => {
  document.documentElement.setAttribute("data-theme", theme);
  localStorage.setItem("theme", theme);
  toggleBtn.innerHTML =
    theme === "dark"
      ? '<i class="bi bi-brightness-high"></i>'
      : '<i class="fa-regular fa-moon"></i>';
};

setTheme(getPreferredTheme());

toggleBtn.addEventListener("click", () => {
  const currentTheme = document.documentElement.getAttribute("data-theme");
  const newTheme = currentTheme === "dark" ? "light" : "dark";
  setTheme(newTheme);
});

function sortTable(columnIndex) {
  const table = document.getElementById("myTable");
  const tbody = table.querySelector("tbody");
  const rows = Array.from(tbody.querySelectorAll("tr"));
  const th = table.querySelectorAll("th")[columnIndex];

  const isAscending = th.classList.contains("asc");
  const direction = isAscending ? -1 : 1;

  rows.sort((rowA, rowB) => {
    const cellA = rowA.children[columnIndex].innerText.trim();
    const cellB = rowB.children[columnIndex].innerText.trim();

    const numA = Number(cellA);
    const numB = Number(cellB);

    if (!isNaN(numA) && !isNaN(numB)) {
      return (numA - numB) * direction;
    } else {
      return cellA.localeCompare(cellB, "ar") * direction;
    }
  });

  table.querySelectorAll("th").forEach((header) => {
    header.classList.remove("asc", "desc");
  });

  th.classList.add(isAscending ? "desc" : "asc");

  rows.forEach((row) => tbody.appendChild(row));
}

function exportToCSV() {
  if (!cachedExpenses || cachedExpenses.length === 0) {
    showAlert("No expenses to export!", "warning");
    return;
  }

  const headers = ["ID", "Title", "Amount (JD)", "Category", "Date"];

  const rows = cachedExpenses.map((item) => [
    item.id || "",
    `"${(item.title || "").replace(/"/g, '""')}"`,
    item.amount || 0,
    item.category || "Other",
    item.date || "",
  ]);

  const csvContent = [
    headers.join(","),
    ...rows.map((row) => row.join(",")),
  ].join("\n");

  const blob = new Blob(["\uFEFF" + csvContent], {
    type: "text/csv;charset=utf-8;",
  });
  const url = URL.createObjectURL(blob);

  const link = document.createElement("a");
  link.setAttribute("href", url);
  link.setAttribute("download", "my_expenses_report.csv");
  document.body.appendChild(link);

  link.click();

  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

document
  .getElementById("export-csv-btn")
  .addEventListener("click", exportToCSV);

function searchTable() {
  const input = document.getElementById("searchInput");
  const filter = input.value.toLowerCase().trim();
  const rows = document.querySelectorAll("#myTable tbody tr");

  rows.forEach((row) => {
    const rowText = row.innerText.toLowerCase();

    if (rowText.includes(filter)) {
      row.style.display = "";
    } else {
      row.style.display = "none";
    }
  });
}

document.addEventListener("DOMContentLoaded", refresh);
