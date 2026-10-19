// ===== Hunger End Pro – Main App Logic (Updated) =====

let menu = [];
let cart = JSON.parse(localStorage.getItem('hungerCart')) || [];
let currentCategory = 'all';

// Load menu - first try localStorage (from admin), then JSON file
async function loadMenu() {
  const saved = localStorage.getItem('hungerMenu');
  if (saved) {
    menu = JSON.parse(saved);
    renderMenu();
    return;
  }

  try {
    const res = await fetch('data/menu.json');
    menu = await res.json();
    localStorage.setItem('hungerMenu', JSON.stringify(menu));
    renderMenu();
  } catch (err) {
    console.error('Failed to load menu:', err);
    document.getElementById('menuGrid').innerHTML = '<p>Failed to load menu. Please refresh.</p>';
  }
}

// Render menu cards
function renderMenu(filter = '') {
  const grid = document.getElementById('menuGrid');
  let items = menu.filter(item => item.available !== false);

  if (currentCategory !== 'all') {
    items = items.filter(item => item.category === currentCategory);
  }

  if (filter) {
    const q = filter.toLowerCase();
    items = items.filter(item =>
      item.name.toLowerCase().includes(q) ||
      (item.description && item.description.toLowerCase().includes(q))
    );
  }

  if (items.length === 0) {
    grid.innerHTML = '<p style="grid-column:1/-1;text-align:center;color:#6b7280;">No items found</p>';
    return;
  }

  grid.innerHTML = items.map(item => `
    <div class="card">
      <img src="${item.image || 'https://via.placeholder.com/400x300?text=Food'}" 
           alt="${item.name}" class="card-img" loading="lazy"
           onerror="this.src='https://via.placeholder.com/400x300?text=Food'">
      <div class="card-body">
        <h3 class="card-title">${item.name}</h3>
        <p class="card-desc">${item.description || ''}</p>
        <div class="card-footer">
          <span class="price">₨ ${item.price}</span>
          <button class="add-btn" onclick="addToCart(${item.id})" title="Add to cart">+</button>
        </div>
      </div>
    </div>
  `).join('');
}

// Cart functions
function addToCart(id) {
  const item = menu.find(m => m.id === id);
  if (!item) return;

  const existing = cart.find(c => c.id === id);
  if (existing) {
    existing.qty += 1;
  } else {
    cart.push({ ...item, qty: 1 });
  }
  saveCart();
  updateCartUI();
  showToast(item.name + ' added to cart');
}

function changeQty(id, delta) {
  const item = cart.find(c => c.id === id);
  if (!item) return;
  item.qty += delta;
  if (item.qty <= 0) {
    cart = cart.filter(c => c.id !== id);
  }
  saveCart();
  updateCartUI();
}

function removeFromCart(id) {
  cart = cart.filter(c => c.id !== id);
  saveCart();
  updateCartUI();
}

function saveCart() {
  localStorage.setItem('hungerCart', JSON.stringify(cart));
}

function getCartTotal() {
  return cart.reduce((sum, item) => sum + item.price * item.qty, 0);
}

function updateCartUI() {
  const countEl = document.getElementById('cartCount');
  const itemsEl = document.getElementById('cartItems');
  const totalEl = document.getElementById('cartTotal');
  const checkoutBtn = document.getElementById('checkoutBtn');

  const totalQty = cart.reduce((sum, i) => sum + i.qty, 0);
  countEl.textContent = totalQty;

  if (cart.length === 0) {
    itemsEl.innerHTML = `
      <div class="empty-cart">
        <span>🛒</span>
        Your cart is empty
      </div>`;
    checkoutBtn.disabled = true;
  } else {
    itemsEl.innerHTML = cart.map(item => `
      <div class="cart-item">
        <img src="\( {item.image || 'https://via.placeholder.com/70'}" alt=" \){item.name}"
             onerror="this.src='https://via.placeholder.com/70'">
        <div class="cart-item-info">
          <div class="cart-item-name">${item.name}</div>
          <div class="cart-item-price">₨ ${item.price}</div>
          <div class="qty-controls">
            <button class="qty-btn" onclick="changeQty(${item.id}, -1)">−</button>
            <span>${item.qty}</span>
            <button class="qty-btn" onclick="changeQty(${item.id}, 1)">+</button>
            <button class="qty-btn" style="margin-left:auto;color:#ef4444;border-color:#ef4444;"
                    onclick="removeFromCart(${item.id})">×</button>
          </div>
        </div>
      </div>
    `).join('');
    checkoutBtn.disabled = false;
  }

  totalEl.textContent = '₨ ' + getCartTotal();
}

function showToast(msg) {
  const toast = document.createElement('div');
  toast.textContent = msg;
  toast.style.cssText = `
    position: fixed; bottom: 30px; left: 50%; transform: translateX(-50%);
    background: #16a34a; color: white; padding: 12px 24px; border-radius: 50px;
    font-weight: 600; z-index: 999; box-shadow: 0 4px 20px rgba(0,0,0,0.2);
  `;
  document.body.appendChild(toast);
  setTimeout(() => toast.remove(), 2000);
}

// Event listeners
document.addEventListener('DOMContentLoaded', function() {
  document.getElementById('openCart').addEventListener('click', () => {
    document.getElementById('cartOverlay').classList.add('open');
    document.getElementById('cartSidebar').classList.add('open');
  });

  document.getElementById('closeCart').addEventListener('click', closeCart);
  document.getElementById('cartOverlay').addEventListener('click', closeCart);

  document.getElementById('checkoutBtn').addEventListener('click', () => {
    closeCart();
    document.getElementById('checkoutModal').classList.add('open');
  });

  document.getElementById('checkoutModal').addEventListener('click', (e) => {
    if (e.target === document.getElementById('checkoutModal')) {
      document.getElementById('checkoutModal').classList.remove('open');
    }
  });

  document.querySelectorAll('.cat-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.cat-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      currentCategory = btn.dataset.cat;
      renderMenu(document.getElementById('searchInput').value);
    });
  });

  document.getElementById('searchBtn').addEventListener('click', () => {
    renderMenu(document.getElementById('searchInput').value);
  });

  document.getElementById('searchInput').addEventListener('keyup', (e) => {
    if (e.key === 'Enter') renderMenu(e.target.value);
  });

  document.getElementById('orderForm').addEventListener('submit', (e) => {
    e.preventDefault();

    const order = {
      id: Date.now(),
      customer: {
        name: document.getElementById('customerName').value.trim(),
        phone: document.getElementById('customerPhone').value.trim(),
        whatsapp: document.getElementById('customerWhatsapp').value.trim() || document.getElementById('customerPhone').value.trim(),
        address: document.getElementById('customerAddress').value.trim(),
        landmark: document.getElementById('customerLandmark').value.trim()
      },
      items: cart,
      total: getCartTotal(),
      coupon: document.getElementById('couponCode').value.trim(),
      time: new Date().toLocaleString('en-NP')
    };

    const orders = JSON.parse(localStorage.getItem('hungerOrders') || '[]');
    orders.push(order);
    localStorage.setItem('hungerOrders', JSON.stringify(orders));

    cart = [];
    saveCart();
    updateCartUI();

    document.getElementById('checkoutModal').classList.remove('open');
    document.getElementById('orderForm').reset();

    alert('✅ Order placed successfully!\n\nOrder ID: ' + order.id + '\nTotal: ₨ ' + order.total + '\n\nWe will contact you soon.');
  });

  // Start
  loadMenu();
  updateCartUI();
});

function closeCart() {
  document.getElementById('cartOverlay').classList.remove('open');
  document.getElementById('cartSidebar').classList.remove('open');
}

let deliveryMap;
let deliveryMarker;
let addressAutocomplete;

function initDeliveryMap() {
  const addressInput = document.getElementById("deliveryAddress");
  const mapElement = document.getElementById("deliveryMap");
  const message = document.getElementById("locationMessage");

  if (!addressInput || !mapElement) return;

  const kathmandu = { lat: 27.7172, lng: 85.3240 };

  deliveryMap = new google.maps.Map(mapElement, {
    center: kathmandu,
    zoom: 13,
    mapTypeControl: false,
    streetViewControl: false
  });

  deliveryMarker = new google.maps.Marker({
    map: deliveryMap,
    position: kathmandu,
    draggable: true
  });

  function saveLocation(place, position) {
    document.getElementById("deliveryLat").value = position.lat();
    document.getElementById("deliveryLng").value = position.lng();

    deliveryMarker.setPosition(position);
    deliveryMap.panTo(position);

    if (place) {
      addressInput.value = place;
    }

    message.textContent = "Location selected successfully.";

    // Update coordinates when the customer moves the marker.
    deliveryMarker.setDraggable(true);
  }

  addressAutocomplete = new google.maps.places.Autocomplete(
    addressInput,
    {
      fields: ["formatted_address", "geometry", "name"],
      componentRestrictions: { country: "np" }
    }
  );

  addressAutocomplete.addListener("place_changed", () => {
    const place = addressAutocomplete.getPlace();

    if (!place.geometry || !place.geometry.location) {
      message.textContent =
        "Please select an address from the suggestions.";
      return;
    }

    const position = place.geometry.location;

    saveLocation(
      place.formatted_address || place.name || addressInput.value,
      position
    );

    deliveryMap.setZoom(16);
  });

  deliveryMarker.addListener("dragend", () => {
    const position = deliveryMarker.getPosition();

    document.getElementById("deliveryLat").value = position.lat();
    document.getElementById("deliveryLng").value = position.lng();

    const geocoder = new google.maps.Geocoder();

    geocoder.geocode({ location: position }, (results, status) => {
      if (status === "OK" && results[0]) {
        addressInput.value = results[0].formatted_address;
        message.textContent = "Pin location updated.";
      } else {
        message.textContent =
          "Pin coordinates saved. Address lookup was unavailable.";
      }
    });
  });

  document.getElementById("useMyLocation")
    .addEventListener("click", () => {
      if (!navigator.geolocation) {
        message.textContent =
          "Your browser does not support location access.";
        return;
      }

      message.textContent = "Finding your location...";

      navigator.geolocation.getCurrentPosition(
        (position) => {
          const point = {
            lat: position.coords.latitude,
            lng: position.coords.longitude
          };

          deliveryMap.setCenter(point);
          deliveryMap.setZoom(17);

          saveLocation(
            addressInput.value,
            new google.maps.LatLng(point.lat, point.lng)
          );

          new google.maps.Geocoder().geocode(
            { location: point },
            (results, status) => {
              if (status === "OK" && results[0]) {
                addressInput.value = results[0].formatted_address;
                message.textContent =
                  "Your current location has been selected.";
              }
            }
          );
        },
        () => {
          message.textContent =
            "Location unavailable. Allow location permission or search manually.";
        },
        { enableHighAccuracy: true, timeout: 12000 }
      );
    });
}

// Keep the existing form submission code in your app.js.
