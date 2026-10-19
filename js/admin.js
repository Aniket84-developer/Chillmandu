// ===== Hunger End Pro – Admin Panel =====

const ADMIN_PASSWORD = 'admin123'; // Change this later for real use
const MENU_KEY = 'hungerMenu';
const ORDERS_KEY = 'hungerOrders';

let menu = [];

// Check if already logged in
if (sessionStorage.getItem('adminLoggedIn') === 'true') {
  showAdminPanel();
}

// Login
document.getElementById('loginBtn').addEventListener('click', () => {
  const pass = document.getElementById('adminPassword').value;
  if (pass === ADMIN_PASSWORD) {
    sessionStorage.setItem('adminLoggedIn', 'true');
    showAdminPanel();
  } else {
    alert('Wrong password! Try: admin123');
  }
});

document.getElementById('adminPassword').addEventListener('keyup', (e) => {
  if (e.key === 'Enter') document.getElementById('loginBtn').click();
});

// Logout
document.getElementById('logoutBtn')?.addEventListener('click', () => {
  sessionStorage.removeItem('adminLoggedIn');
  location.reload();
});

function showAdminPanel() {
  document.getElementById('loginBox').style.display = 'none';
  document.getElementById('adminPanel').classList.add('active');
  loadMenuData();
  loadOrders();
}

// Load menu (from localStorage or original JSON)
async function loadMenuData() {
  const saved = localStorage.getItem(MENU_KEY);
  if (saved) {
    menu = JSON.parse(saved);
  } else {
    try {
      const res = await fetch('data/menu.json');
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
  tbody.innerHTML = menu.map(item => `
    <tr>
      <td>${item.id}</td>
      <td><strong>${item.name}</strong></td>
      <td>${item.category}</td>
      <td>₨ ${item.price}</td>
      <td>${item.available ? '✅ Yes' : '❌ No'}</td>
      <td>
        <button class="btn-sm btn-edit" onclick="editPrice(${item.id})">Edit Price</button>
        <button class="btn-sm btn-delete" onclick="toggleAvailable(${item.id})">
          ${item.available ? 'Hide' : 'Show'}
        </button>
        <button class="btn-sm btn-delete" onclick="deleteItem(${item.id})">Delete</button>
      </td>
    </tr>
  `).join('');
}

function updateStats() {
  document.getElementById('statItems').textContent = menu.length;
  const orders = JSON.parse(localStorage.getItem(ORDERS_KEY) || '[]');
  document.getElementById('statOrders').textContent = orders.length;
}

// Add new item
document.getElementById('addItemForm').addEventListener('submit', (e) => {
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
  alert(`✅ "${newItem.name}" added successfully!`);
});

// Edit price
function editPrice(id) {
  const item = menu.find(m => m.id === id);
  if (!item) return;
  const newPrice = prompt(`New price for "\( {item.name}" (current: ₨ \){item.price})`, item.price);
  if (newPrice !== null && !isNaN(newPrice) && Number(newPrice) > 0) {
    item.price = Number(newPrice);
    saveMenu();
  }
}

// Toggle available
function toggleAvailable(id) {
  const item = menu.find(m => m.id === id);
  if (item) {
    item.available = !item.available;
    saveMenu();
  }
}

// Delete item
function deleteItem(id) {
  if (confirm('Are you sure you want to delete this item?')) {
    menu = menu.filter(m => m.id !== id);
    saveMenu();
  }
}

// Load recent orders
function loadOrders() {
  const orders = JSON.parse(localStorage.getItem(ORDERS_KEY) || '[]');
  const list = document.getElementById('ordersList');

  if (orders.length === 0) {
    list.innerHTML = '<p style="color:#6b7280;">No orders yet. Place a test order from the website.</p>';
    return;
  }

  // Show latest 10
  const recent = orders.slice().reverse().slice(0, 10);
  list.innerHTML = recent.map(o => `
    <div style="border:1px solid #e5e7eb;border-radius:12px;padding:16px;margin-bottom:12px;">
      <div style="display:flex;justify-content:space-between;margin-bottom:8px;">
        <strong>Order #${o.id}</strong>
        <span style="color:#16a34a;font-weight:600;">₨ ${o.total}</span>
      </div>
      <div style="font-size:14px;color:#4b5563;">
        <div>👤 ${o.customer.name} | 📞 ${o.customer.phone}</div>
        <div>📍 ${o.customer.address}</div>
        <div style="margin-top:6px;">
          \( {o.items.map(i => ` \){i.name} × ${i.qty}`).join(', ')}
        </div>
        <div style="margin-top:4px;font-size:12px;color:#9ca3af;">${o.time}</div>
      </div>
    </div>
  `).join('');
}
