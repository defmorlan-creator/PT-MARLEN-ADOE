
const items = [
  "TIMA SHELL",
  "TIMA PERTAMINA",
  "TIMA MPX",
  "TIMA YAMAHA",
  "Botol MPX",
  "Botol Shell",
  "Botol Enduro",
  "Botol Federal",
  "Botol Yamaha",
  "Botol Gear Yamaha",
  "Botol Gear AHM",
  "Botol SPX",
  "Tutup MPX",
  "Tutup Yamaha",
  "Tutup Shell",
  "Tutup Federal",
  "Tutup Gear AHM",
  "Tutup Gear Yamaha",
  "Tutup Pertamina"
];

const STORAGE_KEY = "timaInventoryPro";

let transactions = [];

try {
  transactions = JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
  if (!Array.isArray(transactions)) transactions = [];
} catch {
  transactions = [];
}

const form = document.getElementById("inventoryForm");
const itemSelect = document.getElementById("item");
const stockTable = document.getElementById("stockTable");
const historyTable = document.getElementById("historyTable");

document.getElementById("date").value =
  new Date().toLocaleDateString("en-CA");

items.forEach(item => {
  const option = document.createElement("option");
  option.value = item;
  option.textContent = item;
  itemSelect.appendChild(option);
});

function saveData() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(transactions));
}

function getStock() {
  const stock = {};

  items.forEach(item => {
    stock[item] = 0;
  });

  transactions.forEach(transaction => {
    if (!stock.hasOwnProperty(transaction.item)) return;

    if (transaction.type === "masuk") {
      stock[transaction.item] += transaction.quantity;
    } else {
      stock[transaction.item] -= transaction.quantity;
    }
  });

  return stock;
}

function renderStock() {
  const stock = getStock();

  stockTable.innerHTML = "";

  items.forEach((item, index) => {
    const row = document.createElement("tr");
    row.innerHTML = `
      <td>${index + 1}</td>
      <td>${item}</td>
      <td>${stock[item]}</td>
    `;
    stockTable.appendChild(row);
  });

  document.getElementById("totalItems").textContent = items.length;

  const total = Object.values(stock).reduce((sum, value) => sum + value, 0);
  document.getElementById("totalStock").textContent = total;

  document.getElementById("totalTransactions").textContent =
    transactions.length;
}

function getFilteredTransactions() {
  const search = document.getElementById("search").value.toLowerCase();
  const date = document.getElementById("filterDate").value;

  return transactions.filter(transaction => {
    const matchesSearch =
      transaction.item.toLowerCase().includes(search) ||
      transaction.notes.toLowerCase().includes(search);

    const matchesDate = !date || transaction.date === date;

    return matchesSearch && matchesDate;
  });
}

function renderHistory() {
  const filtered = getFilteredTransactions();

  historyTable.innerHTML = "";

  if (filtered.length === 0) {
    historyTable.innerHTML =
      '<tr><td colspan="6">Belum ada transaksi.</td></tr>';
    return;
  }

  filtered.forEach(transaction => {
    const row = document.createElement("tr");
    const typeText =
      transaction.type === "masuk" ? "Masuk" : "Keluar";

    const typeClass =
      transaction.type === "masuk" ? "incoming" : "outgoing";

    const dateCell = document.createElement("td");
    dateCell.textContent = transaction.date;

    const itemCell = document.createElement("td");
    itemCell.textContent = transaction.item;

    const typeCell = document.createElement("td");
    typeCell.textContent = typeText;
    typeCell.className = typeClass;

    const quantityCell = document.createElement("td");
    quantityCell.textContent = transaction.quantity;

    const notesCell = document.createElement("td");
    notesCell.textContent = transaction.notes;

    const actionCell = document.createElement("td");
    const deleteButton = document.createElement("button");
    deleteButton.textContent = "Hapus";
    deleteButton.className = "delete-btn";
    deleteButton.addEventListener("click", () => {
      deleteTransaction(transaction.id);
    });

    actionCell.appendChild(deleteButton);

    row.append(
      dateCell,
      itemCell,
      typeCell,
      quantityCell,
      notesCell,
      actionCell
    );

    historyTable.appendChild(row);
  });
}

function renderAll() {
  renderStock();
  renderHistory();
}

form.addEventListener("submit", function(event) {
  event.preventDefault();

  const date = document.getElementById("date").value;
  const item = itemSelect.value;
  const type = document.getElementById("type").value;
  const quantity = Number(document.getElementById("quantity").value);
  const notes = document.getElementById("notes").value.trim();

  if (!date || !item || !Number.isInteger(quantity) || quantity <= 0) {
    alert("Periksa kembali tanggal, barang, dan jumlah.");
    return;
  }

  if (type === "keluar") {
    const currentStock = getStock()[item];

    if (quantity > currentStock) {
      alert("Stok tidak mencukupi! Stok tersedia: " + currentStock);
      return;
    }
  }

  transactions.unshift({
    id: Date.now() + Math.random(),
    date,
    item,
    type,
    quantity,
    notes
  });

  saveData();
  form.reset();

  document.getElementById("date").value =
    new Date().toLocaleDateString("en-CA");

  renderAll();
  alert("Transaksi berhasil disimpan!");
});

function deleteTransaction(id) {
  if (!confirm("Yakin ingin menghapus transaksi ini?")) return;

  transactions = transactions.filter(transaction => transaction.id !== id);

  saveData();
  renderAll();
}

document.getElementById("search").addEventListener("input", renderHistory);
document.getElementById("filterDate").addEventListener("change", renderHistory);

document.getElementById("printBtn").addEventListener("click", () => {
  window.print();
});

document.getElementById("pdfBtn").addEventListener("click", () => {
  if (!window.jspdf || !window.jspdf.jsPDF) {
    alert("Library PDF belum dimuat. Periksa koneksi internet lalu coba lagi.");
    return;
  }

  const { jsPDF } = window.jspdf;
  const doc = new jsPDF("landscape", "mm", "a4");

  const stock = getStock();
  const filtered = getFilteredTransactions();

  doc.setFontSize(18);
  doc.text("TIMA INVENTORY PRO", 14, 15);

  doc.setFontSize(10);
  doc.text("Laporan Stok Barang dan Riwayat Transaksi", 14, 22);

  doc.autoTable({
    startY: 28,
    head: [["No", "Nama Barang", "Stok"]],
    body: items.map((item, index) => [
      index + 1,
      item,
      stock[item]
    ]),
    theme: "grid",
    styles: { fontSize: 9 }
  });

  doc.autoTable({
    startY: doc.lastAutoTable.finalY + 10,
    head: [[
      "Tanggal",
      "Nama Barang",
      "Jenis",
      "Jumlah",
      "Keterangan"
    ]],
    body: filtered.map(transaction => [
      transaction.date,
      transaction.item,
      transaction.type === "masuk" ? "Masuk" : "Keluar",
      transaction.quantity,
      transaction.notes
    ]),
    theme: "grid",
    styles: { fontSize: 8 }
  });

  doc.save("Laporan-TIMA-INVENTORY-PRO.pdf");
});

renderAll();
