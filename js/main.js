const reviewStorageKey = "raptyle-reviews";
const cartStorageKey = "raptyle-cart";
const adminProductsStorageKey = "raptyle-admin-products";
const themeStorageKey = "raptyle-theme";

const defaultReviews = [
  {
    name: "Mert K.",
    product: "Signature White",
    rating: 5,
    comment:
      "Kumaş hissi beklentimin üstünde. Oversize kalıp tam oturuyor ve baskı ucuz durmuyor.",
  },
  {
    name: "Zeynep A.",
    product: "Night Eclipse",
    rating: 5,
    comment:
      "Siyah ton çok temiz. Minimal duruyor ama yine de dikkat çekiyor, tam istediğim gibi.",
  },
  {
    name: "Arda T.",
    product: "Shadow Ronin",
    rating: 4,
    comment:
      "Arka baskı çok güçlü görünüyor. Gri yüzey ve anime havası markaya ayrı bir kimlik veriyor.",
  },
];

const defaultAdminProducts = [
  {
    id: "signature-white",
    name: "Signature White",
    sku: "RPTYL-WHT-01",
    category: "Oversize Tişört",
    price: 1249,
    stock: 18,
    image: "./images/beyaz ön.jpg",
    description: "Minimal ön yüz ve güçlü anime arka kompozisyonuna sahip beyaz oversize parça.",
    archived: false,
  },
  {
    id: "shadow-ronin",
    name: "Shadow Ronin",
    sku: "RPTYL-GRY-01",
    category: "Anime Drop",
    price: 1349,
    stock: 9,
    image: "./images/gri_arka.jpg",
    description: "Yıkamalı gri görünüm üzerinde dramatik savaşçı illüstrasyonu.",
    archived: false,
  },
  {
    id: "night-eclipse",
    name: "Night Eclipse",
    sku: "RPTYL-BLK-01",
    category: "Limited Drop",
    price: 1299,
    stock: 0,
    image: "./images/siyah ön.jpg",
    description: "Derin siyah zemin üzerinde ay detayı ve sade streetwear duruşu.",
    archived: true,
  },
];

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function formatPrice(value) {
  return `${Number(value).toLocaleString("tr-TR")} TL`;
}

function readStorage(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : fallback;
  } catch {
    return fallback;
  }
}

function writeStorage(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

function loadReviews() {
  return readStorage(reviewStorageKey, defaultReviews);
}

function saveReviews(reviews) {
  writeStorage(reviewStorageKey, reviews);
}

function loadCart() {
  return readStorage(cartStorageKey, []);
}

function loadAdminProducts() {
  return readStorage(adminProductsStorageKey, defaultAdminProducts);
}

function saveAdminProducts(products) {
  writeStorage(adminProductsStorageKey, products);
}

function saveCart(cart) {
  writeStorage(cartStorageKey, cart);
  updateCartCount();
}

function makeProductId(name) {
  const slug = name
    .toLowerCase()
    .trim()
    .replaceAll("ı", "i")
    .replaceAll("ğ", "g")
    .replaceAll("ü", "u")
    .replaceAll("ş", "s")
    .replaceAll("ö", "o")
    .replaceAll("ç", "c")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");

  return `${slug || "urun"}-${Date.now()}`;
}

function updateCartCount() {
  const count = loadCart().reduce((sum, item) => sum + item.quantity, 0);
  document.querySelectorAll("[data-cart-count]").forEach((node) => {
    node.textContent = count;
  });
}

function applyTheme(theme) {
  const nextTheme = theme === "light" ? "light" : "dark";
  document.body.dataset.theme = nextTheme;
  document.querySelectorAll("[data-theme-toggle]").forEach((button) => {
    const isLight = nextTheme === "light";
    button.setAttribute("aria-pressed", String(isLight));
    button.setAttribute("aria-label", isLight ? "Koyu temaya geç" : "Açık temaya geç");
    const icon = button.querySelector(".theme-toggle-icon");
    if (icon) icon.textContent = isLight ? "☀" : "☾";
  });
}

function initThemeToggle() {
  const savedTheme = localStorage.getItem(themeStorageKey);
  applyTheme(savedTheme === "light" ? "light" : "dark");

  document.querySelectorAll("[data-theme-toggle]").forEach((button) => {
    button.addEventListener("click", () => {
      const nextTheme = document.body.dataset.theme === "light" ? "dark" : "light";
      localStorage.setItem(themeStorageKey, nextTheme);
      applyTheme(nextTheme);
    });
  });
}

function showToast(message) {
  let toast = document.querySelector(".toast");
  if (!toast) {
    toast = document.createElement("div");
    toast.className = "toast";
    toast.setAttribute("role", "status");
    toast.setAttribute("aria-live", "polite");
    document.body.appendChild(toast);
  }

  toast.textContent = message;
  toast.classList.add("show");
  window.clearTimeout(showToast.timeoutId);
  showToast.timeoutId = window.setTimeout(() => {
    toast.classList.remove("show");
  }, 1800);
}

function addToCart(product) {
  const cart = loadCart();
  const existing = cart.find((item) => item.id === product.id);

  if (existing) {
    existing.quantity += 1;
  } else {
    cart.push({ ...product, quantity: 1 });
  }

  saveCart(cart);
  showToast(`${product.name} sepete eklendi`);
}

function initAddToCartButtons() {
  document.querySelectorAll(".add-to-cart").forEach((button) => {
    button.addEventListener("click", () => {
      addToCart({
        id: button.dataset.productId,
        name: button.dataset.productName,
        price: Number(button.dataset.productPrice),
        image: button.dataset.productImage,
      });
    });
  });
}

function stars(rating) {
  return "★".repeat(rating) + "☆".repeat(5 - rating);
}

function renderReviews() {
  const reviewList = document.getElementById("review-list");
  const averageRating = document.getElementById("average-rating");
  if (!reviewList || !averageRating) return;

  const reviews = loadReviews();
  reviewList.innerHTML = reviews
    .map(
      (review) => `
        <article class="review-card">
          <div class="review-head">
            <div>
              <strong>${escapeHtml(review.name)}</strong>
              <span>${escapeHtml(review.product)}</span>
            </div>
            <div class="review-stars" aria-label="${review.rating} yıldız">${stars(review.rating)}</div>
          </div>
          <p>${escapeHtml(review.comment)}</p>
          <div class="review-meta">Topluluk değerlendirmesi</div>
        </article>
      `
    )
    .join("");

  const average =
    reviews.reduce((sum, review) => sum + Number(review.rating), 0) / reviews.length;
  averageRating.textContent = average.toFixed(1);
}

function initReviewForm() {
  const reviewForm = document.getElementById("review-form");
  if (!reviewForm) return;

  reviewForm.addEventListener("submit", (event) => {
    event.preventDefault();
    const formData = new FormData(reviewForm);
    const nextReview = {
      name: String(formData.get("name")).trim(),
      product: String(formData.get("product")),
      rating: Number(formData.get("rating")),
      comment: String(formData.get("comment")).trim(),
    };

    if (!nextReview.name || !nextReview.comment) return;

    saveReviews([nextReview, ...loadReviews()]);
    reviewForm.reset();
    renderReviews();
    showToast("Yorumun eklendi");
  });
}

function cartMarkup(item) {
  return `
    <article class="cart-item">
      <img src="${escapeHtml(item.image)}" alt="${escapeHtml(item.name)}" />
      <div>
        <h3>${escapeHtml(item.name)}</h3>
        <div class="cart-meta">Premium oversize anime tişört</div>
        <div class="quantity-row">
          <button class="quantity-button" type="button" data-action="decrease" data-id="${escapeHtml(item.id)}">-</button>
          <span>${item.quantity}</span>
          <button class="quantity-button" type="button" data-action="increase" data-id="${escapeHtml(item.id)}">+</button>
          <button class="remove-button" type="button" data-action="remove" data-id="${escapeHtml(item.id)}">Sil</button>
        </div>
      </div>
      <strong>${formatPrice(item.price * item.quantity)}</strong>
    </article>
  `;
}

function renderCart() {
  const cartItems = document.getElementById("cart-items");
  const cartSubtotal = document.getElementById("cart-subtotal");
  const cartTotal = document.getElementById("cart-total");
  const cartState = document.getElementById("cart-state");
  if (!cartItems || !cartSubtotal || !cartTotal || !cartState) return;

  const cart = loadCart();

  if (!cart.length) {
    cartState.innerHTML = `
      <div class="empty-cart">
        <h3>Sepetin şu an boş</h3>
        <p>Koleksiyondan ürün ekleyerek satın alma akışını buradan yönetebilirsin.</p>
        <a class="button primary" href="./koleksiyon.html">Koleksiyona Dön</a>
      </div>
    `;
    cartItems.innerHTML = "";
    cartSubtotal.textContent = "0 TL";
    cartTotal.textContent = "0 TL";
    return;
  }

  cartState.innerHTML = "";
  cartItems.innerHTML = cart.map(cartMarkup).join("");

  const subtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  cartSubtotal.textContent = formatPrice(subtotal);
  cartTotal.textContent = formatPrice(subtotal);

  cartItems.querySelectorAll("[data-action]").forEach((button) => {
    button.addEventListener("click", () => {
      const action = button.dataset.action;
      const id = button.dataset.id;
      const nextCart = loadCart()
        .map((item) => {
          if (item.id !== id) return item;
          if (action === "increase") return { ...item, quantity: item.quantity + 1 };
          if (action === "decrease") return { ...item, quantity: item.quantity - 1 };
          return item;
        })
        .filter((item) => {
          if (action === "remove" && item.id === id) return false;
          return item.quantity > 0;
        });

      saveCart(nextCart);
      renderCart();
    });
  });
}

function renderCheckout() {
  const checkoutItems = document.getElementById("checkout-items");
  const checkoutTotal = document.getElementById("checkout-total");
  if (!checkoutItems || !checkoutTotal) return;

  const cart = loadCart();
  if (!cart.length) {
    checkoutItems.innerHTML = `
      <div class="empty-cart">
        <h3>Ödeme için ürün yok</h3>
        <p>Ödeme sayfasına devam etmeden önce koleksiyondan ürün eklemelisin.</p>
        <a class="button primary" href="./koleksiyon.html">Koleksiyona Dön</a>
      </div>
    `;
    checkoutTotal.textContent = "0 TL";
    return;
  }

  checkoutItems.innerHTML = cart
    .map(
      (item) => `
        <article class="checkout-item">
          <img src="${escapeHtml(item.image)}" alt="${escapeHtml(item.name)}" />
          <div>
            <strong>${escapeHtml(item.name)}</strong>
            <span>${item.quantity} adet x ${formatPrice(item.price)}</span>
          </div>
          <b>${formatPrice(item.price * item.quantity)}</b>
        </article>
      `
    )
    .join("");

  const total = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  checkoutTotal.textContent = formatPrice(total);
}

function initCheckoutForm() {
  const form = document.getElementById("checkout-form");
  const status = document.getElementById("checkout-status");
  if (!form || !status) return;

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    if (!loadCart().length) {
      status.textContent =
        "Ödeme onayı oluşturmak için önce koleksiyondan en az bir ürün eklemelisin.";
      status.classList.remove("is-success");
      showToast("Sepet boş");
      return;
    }

    status.textContent =
      "Demo sipariş oluşturuldu. Gerçek ödeme alınmadı; bu ekran yalnızca satın alma akışını gösterir.";
    status.classList.add("is-success");
    showToast("Demo sipariş onaylandı");
  });
}

function productStatusLabel(product) {
  if (product.archived) return "Arşivde";
  if (Number(product.stock) === 0) return "Stok Yok";
  if (Number(product.stock) <= 5) return "Düşük Stok";
  return "Aktif Satış";
}

function productCardMarkup(product) {
  const archiveLabel = product.archived ? "Arşivden Çıkar" : "Arşivle";
  const stockLevel = Math.min(100, Math.max(0, Number(product.stock) * 4));
  return `
    <article class="admin-product-card ${product.archived ? "is-archived" : ""}">
      <img src="${escapeHtml(product.image)}" alt="${escapeHtml(product.name)}" />
      <div class="admin-product-content">
        <div class="admin-product-head">
          <div>
            <span>${escapeHtml(product.sku)}</span>
            <h3>${escapeHtml(product.name)}</h3>
          </div>
          <b>${productStatusLabel(product)}</b>
        </div>
        <p>${escapeHtml(product.description)}</p>
        <div class="admin-product-meta">
          <span>${escapeHtml(product.category)}</span>
          <span>${formatPrice(product.price)}</span>
          <span class="stock-chip">
            <b>${Number(product.stock)} stok</b>
            <i><em style="width: ${stockLevel}%"></em></i>
          </span>
        </div>
        <div class="admin-product-actions">
          <button class="button secondary small" type="button" data-admin-action="edit" data-id="${escapeHtml(product.id)}">Düzenle</button>
          <button class="button secondary small" type="button" data-admin-action="archive" data-id="${escapeHtml(product.id)}">${archiveLabel}</button>
        </div>
      </div>
    </article>
  `;
}

function renderAdminProducts() {
  const list = document.getElementById("admin-product-list");
  const activeCount = document.getElementById("admin-active-count");
  const archivedCount = document.getElementById("admin-archived-count");
  const lowStockCount = document.getElementById("admin-low-stock-count");
  const totalStock = document.getElementById("admin-total-stock");
  const totalStockBar = document.getElementById("admin-total-stock-bar");
  const totalStockNote = document.getElementById("admin-total-stock-note");
  if (!list) return;

  const products = loadAdminProducts();
  const activeProducts = products.filter((product) => !product.archived);
  const archivedProducts = products.filter((product) => product.archived);
  const lowStockProducts = activeProducts.filter((product) => Number(product.stock) <= 5);

  list.innerHTML = products.map(productCardMarkup).join("");

  if (activeCount) activeCount.textContent = activeProducts.length;
  if (archivedCount) archivedCount.textContent = archivedProducts.length;
  if (lowStockCount) lowStockCount.textContent = lowStockProducts.length;
  if (totalStock) {
    const stockTotal = products.reduce((sum, product) => sum + Number(product.stock), 0);
    const stockLevel = Math.min(100, Math.round((stockTotal / 40) * 100));
    totalStock.textContent = stockTotal;
    if (totalStockBar) totalStockBar.style.width = `${stockLevel}%`;
    if (totalStockNote) totalStockNote.textContent = `${stockLevel}% stok doluluğu`;
  }

  list.querySelectorAll("[data-admin-action]").forEach((button) => {
    button.addEventListener("click", () => {
      const productId = button.dataset.id;
      if (button.dataset.adminAction === "edit") {
        fillAdminForm(productId);
      }
      if (button.dataset.adminAction === "archive") {
        toggleProductArchive(productId);
      }
    });
  });
}

function clearAdminForm() {
  const form = document.getElementById("admin-product-form");
  if (!form) return;

  form.reset();
  form.productId.value = "";
  form.querySelector('button[type="submit"]').textContent = "Ürünü Kaydet";
}

function fillAdminForm(productId) {
  const form = document.getElementById("admin-product-form");
  const product = loadAdminProducts().find((item) => item.id === productId);
  if (!form || !product) return;

  form.productId.value = product.id;
  form.name.value = product.name;
  form.sku.value = product.sku;
  form.category.value = product.category;
  form.image.value = product.image;
  form.price.value = product.price;
  form.stock.value = product.stock;
  form.description.value = product.description;
  form.querySelector('button[type="submit"]').textContent = "Ürünü Güncelle";
  form.scrollIntoView({ behavior: "smooth", block: "center" });
}

function toggleProductArchive(productId) {
  const products = loadAdminProducts().map((product) => {
    if (product.id !== productId) return product;
    return { ...product, archived: !product.archived };
  });

  saveAdminProducts(products);
  renderAdminProducts();
  showToast("Ürün durumu güncellendi");
}

function initAdminForm() {
  const form = document.getElementById("admin-product-form");
  const resetButton = document.getElementById("admin-form-reset");
  if (!form) return;

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    const formData = new FormData(form);
    const productId = String(formData.get("productId"));
    const productData = {
      id: productId || makeProductId(String(formData.get("name"))),
      name: String(formData.get("name")).trim(),
      sku: String(formData.get("sku")).trim(),
      category: String(formData.get("category")),
      image: String(formData.get("image")),
      price: Number(formData.get("price")),
      stock: Number(formData.get("stock")),
      description: String(formData.get("description")).trim(),
      archived: false,
    };

    const products = loadAdminProducts();
    const existingProduct = products.find((product) => product.id === productId);
    const nextProducts = existingProduct
      ? products.map((product) =>
          product.id === productId ? { ...product, ...productData, archived: product.archived } : product
        )
      : [productData, ...products];

    saveAdminProducts(nextProducts);
    clearAdminForm();
    renderAdminProducts();
    showToast(existingProduct ? "Ürün güncellendi" : "Ürün panele eklendi");
  });

  if (resetButton) {
    resetButton.addEventListener("click", clearAdminForm);
  }
}

function initReveal() {
  const items = document.querySelectorAll(".reveal");
  if (!items.length) return;

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("in-view");
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.16 }
  );

  items.forEach((item) => observer.observe(item));
}

function initMobileHeaderBehavior() {
  const topbar = document.querySelector(".topbar");
  if (!topbar) return;

  const updateHeaderState = () => {
    if (window.innerWidth > 820) {
      topbar.classList.remove("is-condensed");
      return;
    }

    if (window.scrollY > 24) {
      topbar.classList.add("is-condensed");
    } else {
      topbar.classList.remove("is-condensed");
    }
  };

  updateHeaderState();
  window.addEventListener("scroll", updateHeaderState, { passive: true });
  window.addEventListener("resize", updateHeaderState);
}

document.addEventListener("DOMContentLoaded", () => {
  initThemeToggle();
  updateCartCount();
  initAddToCartButtons();
  renderReviews();
  initReviewForm();
  renderCart();
  renderCheckout();
  initCheckoutForm();
  initAdminForm();
  renderAdminProducts();
  initReveal();
  initMobileHeaderBehavior();
});
