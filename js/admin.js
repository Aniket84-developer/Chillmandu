// ===== Hunger End Pro – Admin Panel (Fixed) =====

const ADMIN_PASSWORD = 'admin123';
const MENU_KEY = 'hungerMenu';
const ORDERS_KEY = 'hungerOrders';

let menu = [];

// Wait until page is fully loaded
document.addEventListener('DOMContentLoaded', function() {

  // Check if already logged in
  if (sessionStorage.getItem('adminLoggedIn') === 'true') {
    showAdminPanel();
  }

  // Login button
  const loginBtn = document.getElementById('loginBtn');
  if (loginBtn) {
    loginBtn.addEventListener('click', function() {
      const pass = document.getElementById('adminPassword').value;
      if (pass === ADMIN_PASSWORD) {
        sessionStorage.setItem('adminLoggedIn', 'true');
        showAdminPanel();
      } else {
        alert('Wrong password! Try: admin123');
      }
    });
  }

  // Enter key support
  const passwordInput = document.getElementById('adminPassword');
  if (passwordInput) {
    passwordInput.addEventListener('keyup', function(e) {
      if (e.key === 'Enter') {
        document.getElementById('loginBtn').click();
      }
    });
  }

  // Logout button
  const logoutBtn = document.getElementById('logoutBtn');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', function() {
      sessionStorage.removeItem('adminLoggedIn');
      location.reload();
    });
  }

  // Add item form
  const addForm = document.getElementById('addItemForm');
  if (addForm) {
    addForm.addEventListener('submit', function(e) {
      e.preventDefault();
      const newId = menu.length > 0 ? Math.max(...menu.map(m => m.id)) + 1 : 1;

      const newItem = {
        id: newId,
        name: document.getElementById('newName').value.trim(),
        price: Number(document.getElementById('newPrice').value),
        category: document.getElementById('newCategory').value,
        description: document.getElementById('newDesc').value.trim() || 'Delicious item',
        image: document.getElementById('newImage').value.trim() || 'https://via.placeholder.com/400x300?text=Food',
        available: true
      };

      menu.push(newItem);
      saveMenu();
      document.getElementById('addItemForm').reset();
      alert('Item added successfully!');
    });
  }
});

function showAdminPanel() {
  document.getElementById('loginBox').style.display = 'none';
  document.getElementById('adminPanel').classList.add('active');
  loadMenuData();
  loadOrders();
}

async function loadMenuData() {
  const saved = localStorage.getItem(MENU_KEY);
  if (saved) {
    menu = JSON.parse(saved);
  } else {
    try {
      const res = await fetch('../data/menu.json');
      menu = await res.json();
      localStorage.setItem(MENU_KEY, JSON.stringify(menu));
    } catch (err) {
      console.error(err);
      menu = [];
    }
  }
  renderMenuTable();
  updateStats();
}

function saveMenu() {
  localStorage.setItem(MENU_KEY, JSON.stringify(menu));
  renderMenuTable();
  updateStats();
}

function renderMenuTable() {
  const tbody = document.getElementById('menuTableBody');
  if (!tbody) return;
  tbody.innerHTML = menu.map(item => `
    <tr>
      <td>${item.id}</td>
      <td><strong>${item.name}</strong></td>
      <td>${item.category}</td>
      <td>₨ ${item.price}</td>
      <td>${item.available ? '✅ Yes' : '❌ No'}</td>
      <td>
        <button class="btn-sm btn-edit" onclick="editPrice(${item.id})">Edit Price</button>
        <button class="btn-sm btn-delete" onclick="toggleAvailable(\( {item.id})"> \){item.available ? 'Hide' : 'Show'}</button>
        <button class="btn-sm btn-delete" onclick="deleteItem(${item.id})">Delete</button>
      </td>
    </tr>
  `).join('');
}

function updateStats() {
  const itemsEl = document.getElementById('statItems');
  const ordersEl = document.getElementById('statOrders');
  if (itemsEl) itemsEl.textContent = menu.length;
  if (ordersEl) {
    const orders = JSON.parse(localStorage.getItem(ORDERS_KEY) || '[]');
    ordersEl.textContent = orders.length;
  }
}

function editPrice(id) {
  const item = menu.find(m => m.id === id);
  if (!item) return;
  const newPrice = prompt(`New price for "${item.name}"`, item.price);
  if (newPrice !== null && !isNaN(newPrice) && Number(newPrice) > 0) {
    item.price = Number(newPrice);
    saveMenu();
  }
}

function toggleAvailable(id) {
  const item = menu.find(m => m.id === id);
  if (item) {
    item.available = !item.available;
    saveMenu();
  }
}

function deleteItem(id) {
  if (confirm('Delete this item?')) {
    menu = menu.filter(m => m.id !== id);
    saveMenu();
  }
}

function loadOrders() {
  const orders = JSON.parse(localStorage.getItem(ORDERS_KEY) || '[]');
  const list = document.getElementById('ordersList');
  if (!list) return;

  if (orders.length === 0) {
    list.innerHTML = '<p style="color:#6b7280;">No orders yet.</p>';
    return;
  }

  const recent = orders.slice().reverse().slice(0, 10);
  list.innerHTML = recent.map(o => `
    <div style="border:1px solid #e5e7eb;border-radius:12px;padding:16px;margin-bottom:12px;">
      <strong>Order #${o.id}</strong> - ₨ ${o.total}<br>
      ${o.customer.name} | ${o.customer.phone}<br>
      ${o.customer.address}
    </div>
  `).join('');
}
