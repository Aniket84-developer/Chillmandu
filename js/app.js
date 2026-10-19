// ===== Hunger End Pro – Main App Logic (Final Fix) =====

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

  if (!countEl || !itemsEl || !totalEl || !checkoutBtn) return;

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
        <img src="${item.image || 'https://via.placeholder.com/70'}" alt="${item.name}"
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

// Global Event listeners setup on DOMContentLoaded
document.addEventListener('DOMContentLoaded', function() {
  const openCartBtn = document.getElementById('openCart');
  if (openCartBtn) {
    openCartBtn.addEventListener('click', () => {
      document.getElementById('cartOverlay').classList.add('open');
      document.getElementById('cartSidebar').classList.add('open');
    });
  }

  const closeCartBtn = document.getElementById('closeCart');
  if (closeCartBtn) closeCartBtn.addEventListener('click', closeCart);

  const cartOverlay = document.getElementById('cartOverlay');
  if (cartOverlay) cartOverlay.addEventListener('click', closeCart);

  const checkoutBtn = document.getElementById('checkoutBtn');
  if (checkoutBtn) {
    checkoutBtn.addEventListener('click', () => {
      closeCart();
      const modal = document.getElementById('checkoutModal');
      if (modal) modal.classList.add('open');
      
      // Initialize map the moment checkout opens so it renders correctly
      setTimeout(() => {
        if (typeof initDeliveryMap === 'function') {
          initDeliveryMap();
        }
      }, 200);
    });
  }

  const checkoutModal = document.getElementById('checkoutModal');
  if (checkoutModal) {
    checkoutModal.addEventListener('click', (e) => {
      if (e.target === checkoutModal) {
        checkoutModal.classList.remove('open');
      }
    });
  }

  document.querySelectorAll('.cat-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.cat-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      currentCategory = btn.dataset.cat;
      const searchInput = document.getElementById('searchInput');
      renderMenu(searchInput ? searchInput.value : '');
    });
  });

  const searchBtn = document.getElementById('searchBtn');
  if (searchBtn) {
    searchBtn.addEventListener('click', () => {
      const searchInput = document.getElementById('searchInput');
      renderMenu(searchInput ? searchInput.value : '');
    });
  }

  const searchInput = document.getElementById('searchInput');
  if (searchInput) {
    searchInput.addEventListener('keyup', (e) => {
      if (e.key === 'Enter') renderMenu(e.target.value);
    });
  }

  const orderForm = document.getElementById('orderForm');
  if (orderForm) {
    orderForm.addEventListener('submit', (e) => {
      e.preventDefault();

      const order = {
        id: Date.now(),
        customer: {
          name: document.getElementById('customerName').value.trim(),
          phone: document.getElementById('customerPhone').value.trim(),
          whatsapp: document.getElementById('customerWhatsapp').value.trim() || document.getElementById('customerPhone').value.trim(),
          address: document.getElementById('customerAddress').value.trim(),
          landmark: document.getElementById('customerLandmark') ? document.getElementById('customerLandmark').value.trim() : ''
        },
        items: cart,
        total: getCartTotal(),
        coupon: document.getElementById('couponCode') ? document.getElementById('couponCode').value.trim() : '',
        time: new Date().toLocaleString('en-NP')
      };

      const orders = JSON.parse(localStorage.getItem('hungerOrders') || '[]');
      orders.push(order);
      localStorage.setItem('hungerOrders', JSON.stringify(orders));

      cart = [];
      saveCart();
      updateCartUI();

      if (checkoutModal) checkoutModal.classList.remove('open');
      orderForm.reset();

      alert('✅ Order placed successfully!\n\nOrder ID: ' + order.id + '\nTotal: ₨ ' + order.total + '\n\nWe will contact you soon.');
    });
  }

  // Start
  loadMenu();
  updateCartUI();
});

function closeCart() {
  const cartOverlay = document.getElementById('cartOverlay');
  const cartSidebar = document.getElementById('cartSidebar');
  if (cartOverlay) cartOverlay.classList.remove('open');
  if (cartSidebar) cartSidebar.classList.remove('open');
}

// ===== Google Maps & Landmark Feature =====
let deliveryMap;
let deliveryMarker;
let addressAutocomplete;
let mapInitialized = false;

function initDeliveryMap() {
  const addressInput = document.getElementById("deliveryAddress");
  const mapElement = document.getElementById("deliveryMap");
  const message = document.getElementById("locationMessage");

  if (!addressInput || !mapElement) return;

  // Prevent re-initializing if already loaded
  if (mapInitialized && deliveryMap) {
    google.maps.event.trigger(deliveryMap, "resize");
    return;
  }

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

  mapInitialized = true;

  function saveLocationByLandmark(position) {
    const latInput = document.getElementById("deliveryLat");
    const lngInput = document.getElementById("deliveryLng");
    if (latInput) latInput.value = position.lat();
    if (lngInput) lngInput.value = position.lng();

    deliveryMarker.setPosition(position);
    deliveryMap.panTo(position);

    const geocoder = new google.maps.Geocoder();
    geocoder.geocode({ location: position }, (results, status) => {
      if (status === "OK" && results && results.length > 0) {
        let landmark = "";
        
        for (let result of results) {
          for (let component of result.address_components) {
            if (
              component.types.includes("point_of_interest") || 
              component.types.includes("establishment") ||
              component.types.includes("premise") ||
              component.types.includes("sublocality_level_1")
            ) {
              landmark = component.long_name;
              break;
            }
          }
          if (landmark) break;
        }

        if (!landmark && results[0].address_components.length > 0) {
          landmark = results[0].address_components[0].long_name;
        }

        const finalAddressValue = landmark ? `Near ${landmark}` : results[0].formatted_address;
        
        addressInput.value = finalAddressValue;
        addressInput.dispatchEvent(new Event('input', { bubbles: true }));
        addressInput.dispatchEvent(new Event('change', { bubbles: true }));

        if (message) message.textContent = "Nearest landmark selected successfully.";
      } else {
        if (message) message.textContent = "Coordinates saved, but landmark lookup failed.";
      }
    });
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
      if (message) message.textContent = "Please select an address from the suggestions.";
      return;
    }

    const position = place.geometry.location;
    const latInput = document.getElementById("deliveryLat");
    const lngInput = document.getElementById("deliveryLng");
    if (latInput) latInput.value = position.lat();
    if (lngInput) lngInput.value = position.lng();

    deliveryMarker.setPosition(position);
    deliveryMap.panTo(position);
    deliveryMap.setZoom(16);

    addressInput.value = place.formatted_address || place.name || addressInput.value;
    if (message) message.textContent = "Location selected successfully.";
  });

  deliveryMarker.addListener("dragend", () => {
    const position = deliveryMarker.getPosition();
    saveLocationByLandmark(position);
  });

  const useMyLocationBtn = document.getElementById("useMyLocation");
  if (useMyLocationBtn && !useMyLocationBtn.dataset.listenerAttached) {
    useMyLocationBtn.dataset.listenerAttached = "true";
    useMyLocationBtn.addEventListener("click", () => {
      if (!navigator.geolocation) {
        if (message) message.textContent = "Your browser does not support location access.";
        return;
      }

      if (message) message.textContent = "Finding your current location...";

      navigator.geolocation.getCurrentPosition(
        (position) => {
          const point = new google.maps.LatLng(
            position.coords.latitude,
            position.coords.longitude
          );

          deliveryMap.setCenter(point);
          deliveryMap.setZoom(17);

          // Automatically extract and fill the nearest landmark
          saveLocationByLandmark(point);
        },
        () => {
          if (message) message.textContent = "Location unavailable. Allow location permission or search manually.";
        },
        { enableHighAccuracy: true, timeout: 12000, maximumAge: 0 }
      );
    });
  }
}
