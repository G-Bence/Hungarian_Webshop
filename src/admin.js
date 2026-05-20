// ADMIN OLDAL JS
// Ezt tedd külön ./src/admin.js fájlba.

// 1. IDE írd be a saját Retool API linkedet.
// Példa: const API_URL = "https://api.retool.com/v1/workflows/......";
const API_URL = "IDE_JON_A_RETOOL_API_LINK";

// 2. Ha a Retool adatbázisodban más mezőnevek vannak, itt elég átírni őket.
const FIELD_NAMES = {
  id: "id",
  name: "name",
  description: "description",
  price: "price",
  image: "image"
};

const navLinks = document.querySelector(".nav-links");
const nav = document.querySelector(".site-nav");
const navToggle = document.querySelector(".nav-toggle");

const productList = document.querySelector("#admin-product-list");
const refreshProductsBtn = document.querySelector("#refresh-products");
const topNewProductBtn = document.querySelector("#admin-new-product-top");
const newProductBtn = document.querySelector("#new-product");

const editorHelp = document.querySelector("#editor-help");
const productForm = document.querySelector("#product-form");
const productPreview = document.querySelector("#product-preview");
const imageFileInput = document.querySelector("#product-image-file");
const imageUrlInput = document.querySelector("#product-image-url");
const nameInput = document.querySelector("#product-name");
const priceInput = document.querySelector("#product-price");
const descriptionInput = document.querySelector("#product-description");

const editProductBtn = document.querySelector("#edit-product");
const deleteSelectedProductBtn = document.querySelector("#delete-selected-product");
const cancelEditBtn = document.querySelector("#cancel-edit");
const sendProductBtn = document.querySelector("#send-product");

const confirmModal = document.querySelector("#confirm-modal");
const confirmMessage = document.querySelector("#confirm-message");
const confirmYesBtn = document.querySelector("#confirm-yes");
const confirmNoBtn = document.querySelector("#confirm-no");
const adminToast = document.querySelector("#admin-toast");

let products = [];
let selectedProduct = null;
let formMode = "none"; // none, view, edit, new
let confirmAnswer = null;

const demoProducts = [
  {
    id: "demo-1",
    name: "Dóna János",
    description: "Jófajta magyar termék leírás, csuhaja. Ez csak próbaadat, hogy API nélkül is lásd a működést.",
    price: 1000,
    image: "https://picsum.photos/id/1081/600/400"
  },
  {
    id: "demo-2",
    name: "Epres vásárfia",
    description: "Rövid próba leírás egy másik termékhez. A hosszabb szöveget a lista automatikusan levágja.",
    price: 2500,
    image: "https://picsum.photos/id/1080/600/400"
  }
];

// Mobil menü kezelése, hogy az admin oldalon is működjön a fejléc.
let navTouch = {
  startY: 0,
  currentY: 0,
  isDragging: false,
  maxHeight: 320
};

const openNavMenu = () => {
  if (!navLinks || !nav) return;

  nav.classList.remove('closing');
  navLinks.classList.add('active');
  navLinks.style.maxHeight = '';
  nav.classList.add('open');

  if (navToggle) {
    navToggle.setAttribute('aria-expanded', 'true');
    /*navToggle.classList.remove('nav-toggle_closing');*/
    /* navToggle.style.backgroundColor = "tomato";*/
  }
};

const closeNavMenu = () => {
  if (!navLinks || !nav) return;

  navLinks.classList.remove('active');
  navLinks.style.maxHeight = '';
  nav.classList.remove('open');
  nav.classList.add('closing');

  if (navToggle) {
    navToggle.setAttribute('aria-expanded', 'false');
    navToggle.blur();
    /*navToggle.classList.add('nav-toggle_closing');*/
  }

  setTimeout(() => {
    nav.classList.remove('closing');
  }, 250);
};

const clampNavHeight = (value) => Math.min(Math.max(value, 0), navTouch.maxHeight);

if (nav && navLinks) {
  setTimeout(() => {
    navLinks.querySelectorAll('a').forEach((link) => {
      link.addEventListener('click', () => {
        closeNavMenu();
      });
    });
  }, 1500);

  if (navToggle) {
    navToggle.addEventListener('click', () => {
      if (navLinks.classList.contains('active')) {
        closeNavMenu();
      } else {
        openNavMenu();
      }
    });
  }

  nav.addEventListener('touchstart', (event) => {
    if (!window.matchMedia('(max-width: 820px)').matches || event.touches.length !== 1) {
      return;
    }
    navTouch.startY = event.touches[0].clientY;
    navTouch.currentY = navTouch.startY;
    navTouch.isDragging = true;
    nav.classList.remove('closing');
  });

  nav.addEventListener('touchmove', (event) => {
    if (!navTouch.isDragging || event.touches.length !== 1) {
      return;
    }
    navTouch.currentY = event.touches[0].clientY;
    const deltaY = navTouch.currentY - navTouch.startY;

    if (!navLinks.classList.contains('active') && deltaY > 0) {
      event.preventDefault();
      navLinks.classList.add('dragging');
      navLinks.style.maxHeight = `${clampNavHeight(deltaY)}px`;
    } else if (navLinks.classList.contains('active') && deltaY < 0) {
      event.preventDefault();
      navLinks.classList.add('dragging');
      navLinks.style.maxHeight = `${clampNavHeight(navTouch.maxHeight + deltaY)}px`;
    }
  });

  nav.addEventListener('touchend', () => {
    if (!navTouch.isDragging) {
      return;
    }

    navTouch.isDragging = false;
    const deltaY = navTouch.currentY - navTouch.startY;
    navLinks.classList.remove('dragging');

    if (!navLinks.classList.contains('active') && deltaY > 80) {
      openNavMenu();
    } else if (navLinks.classList.contains('active') && deltaY < -80) {
      closeNavMenu();
    } else if (navLinks.classList.contains('active')) {
      openNavMenu();
    } else {
      closeNavMenu();
    }
  });
}

function apiIsReady() {
  return API_URL && API_URL !== "IDE_JON_A_RETOOL_API_LINK";
}

function getProductId(product, index) {
  return product[FIELD_NAMES.id] || product.id || product._id || product.productId || product.product_id || `local-${index}`;
}

function normalizeProduct(product, index) {
  return {
    original: product,
    id: getProductId(product, index),
    name: product[FIELD_NAMES.name] || product.name || product.title || "Névtelen termék",
    description: product[FIELD_NAMES.description] || product.description || product.desc || "",
    price: product[FIELD_NAMES.price] || product.price || 0,
    image: product[FIELD_NAMES.image] || product.image || product.imageUrl || product.image_url || ""
  };
}

function getApiItemUrl(id) {
  const cleanApiUrl = API_URL.endsWith("/") ? API_URL.slice(0, -1) : API_URL;
  return `${cleanApiUrl}/${encodeURIComponent(id)}`;
}

function showToast(message) {
  adminToast.textContent = message;
  adminToast.removeAttribute("hidden");

  setTimeout(() => {
    adminToast.setAttribute("hidden", "");
  }, 2800);
}

function setEditorHelp(message) {
  editorHelp.textContent = message;
}

function setFormEditable(canEdit) {
  imageFileInput.disabled = !canEdit;
  imageUrlInput.disabled = !canEdit;
  nameInput.disabled = !canEdit;
  priceInput.disabled = !canEdit;
  descriptionInput.disabled = !canEdit;
}

function updateActionButtons() {
  const hasSelectedProduct = selectedProduct !== null;
  const isEditing = formMode === "edit";
  const isCreatingNew = formMode === "new";
  const canSend = isEditing || isCreatingNew;

  editProductBtn.disabled = !hasSelectedProduct || isEditing || isCreatingNew;
  deleteSelectedProductBtn.disabled = !hasSelectedProduct || isCreatingNew;
  cancelEditBtn.disabled = formMode === "none";
  sendProductBtn.disabled = !canSend;
}

function clearForm() {
  selectedProduct = null;
  formMode = "none";

  productForm.reset();
  productPreview.src = "https://picsum.photos/id/1081/600/400";

  setFormEditable(false);
  updateActionButtons();
  setEditorHelp("Először válassz ki egy terméket a listából, vagy hozz létre egy újat.");
  renderProducts();
}

function fillForm(product) {
  nameInput.value = product.name;
  priceInput.value = product.price;
  descriptionInput.value = product.description;
  imageUrlInput.value = product.image;
  productPreview.src = product.image || "https://picsum.photos/id/1081/600/400";
}

function selectProduct(product) {
  selectedProduct = product;
  formMode = "view";

  fillForm(product);
  setFormEditable(false);
  updateActionButtons();
  setEditorHelp("A termék betöltve. A módosításhoz kattints a 'Termék szerkesztése' gombra.");
  renderProducts();

  document.querySelector("#admin-editor").scrollIntoView({
    behavior: "smooth",
    block: "start"
  });
}

function buildPayloadFromForm() {
  const imageValue = imageUrlInput.value.trim();

  return {
    [FIELD_NAMES.name]: nameInput.value.trim(),
    [FIELD_NAMES.description]: descriptionInput.value.trim(),
    [FIELD_NAMES.price]: Number(priceInput.value),
    [FIELD_NAMES.image]: imageValue
  };
}

function validateForm() {
  const name = nameInput.value.trim();
  const description = descriptionInput.value.trim();
  const price = priceInput.value;
  const image = imageUrlInput.value.trim();

  if (!name || !description || price === "" || !image) {
    showToast("Minden mezőt ki kell tölteni.");
    return false;
  }

  if (Number(price) < 0) {
    showToast("Az ár nem lehet negatív.");
    return false;
  }

  return true;
}

async function getProductsFromApi() {
  if (!apiIsReady()) {
    const savedDemoProducts = localStorage.getItem("szittya_admin_demo_products");

    if (savedDemoProducts) {
      return JSON.parse(savedDemoProducts);
    }

    localStorage.setItem("szittya_admin_demo_products", JSON.stringify(demoProducts));
    return demoProducts;
  }

  const response = await fetch(API_URL);

  if (!response.ok) {
    throw new Error(`Sikertelen terméklekérés: ${response.status}`);
  }

  const result = await response.json();

  if (Array.isArray(result)) {
    return result;
  }

  if (Array.isArray(result.data)) {
    return result.data;
  }

  if (Array.isArray(result.products)) {
    return result.products;
  }

  return [];
}

async function createProductInApi(payload) {
  if (!apiIsReady()) {
    const newProduct = {
      id: crypto.randomUUID(),
      ...payload
    };

    const currentProducts = await getProductsFromApi();
    currentProducts.push(newProduct);
    localStorage.setItem("szittya_admin_demo_products", JSON.stringify(currentProducts));
    return newProduct;
  }

  const response = await fetch(API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    throw new Error(`Sikertelen termékfelvétel: ${response.status}`);
  }

  return response.json();
}

async function updateProductInApi(id, payload) {
  if (!apiIsReady()) {
    const currentProducts = await getProductsFromApi();
    const updatedProducts = currentProducts.map((product, index) => {
      const productId = getProductId(product, index);

      if (productId === id) {
        return {
          ...product,
          ...payload
        };
      }

      return product;
    });

    localStorage.setItem("szittya_admin_demo_products", JSON.stringify(updatedProducts));
    return payload;
  }

  const response = await fetch(getApiItemUrl(id), {
    method: "PUT",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    throw new Error(`Sikertelen termékmódosítás: ${response.status}`);
  }

  return response.json();
}

async function deleteProductFromApi(id) {
  if (!apiIsReady()) {
    const currentProducts = await getProductsFromApi();
    const filteredProducts = currentProducts.filter((product, index) => getProductId(product, index) !== id);
    localStorage.setItem("szittya_admin_demo_products", JSON.stringify(filteredProducts));
    return;
  }

  const response = await fetch(getApiItemUrl(id), {
    method: "DELETE"
  });

  if (!response.ok) {
    throw new Error(`Sikertelen terméktörlés: ${response.status}`);
  }
}

function renderProducts() {
  productList.innerHTML = "";

  if (products.length === 0) {
    productList.innerHTML = `<p class="admin-empty-message">Nincs megjeleníthető termék.</p>`;
    return;
  }

  products.forEach((product) => {
    const row = document.createElement("button");
    row.className = "admin-product-row";
    row.type = "button";

    if (selectedProduct && selectedProduct.id === product.id) {
      row.classList.add("selected");
    }

    row.innerHTML = `
      <span class="admin-product-name" title="${product.name}">${product.name}</span>
      <span class="admin-product-description" title="${product.description}">${product.description}</span>
      <span class="admin-product-price">${product.price} Ft</span>
      <span class="admin-product-image-link" title="${product.image}">${product.image}</span>
      <span>
        <button class="admin-row-delete" type="button">Törlés</button>
      </span>
    `;

    row.addEventListener("click", () => {
      selectProduct(product);
    });

    const deleteButton = row.querySelector(".admin-row-delete");
    deleteButton.addEventListener("click", (event) => {
      event.stopPropagation();
      deleteProductWithConfirmation(product);
    });

    productList.appendChild(row);
  });
}

async function loadProducts() {
  try {
    productList.innerHTML = `<p class="admin-empty-message">A termékek betöltése folyamatban van...</p>`;

    const apiProducts = await getProductsFromApi();
    products = apiProducts.map((product, index) => normalizeProduct(product, index));

    renderProducts();

    if (!apiIsReady()) {
      showToast("Demo módban futsz. Írd be a Retool API linkedet az admin.js elejére.");
    }
  } catch (error) {
    console.error(error);
    productList.innerHTML = `<p class="admin-empty-message">Nem sikerült betölteni a termékeket.</p>`;
    showToast("Hiba történt a termékek betöltésekor.");
  }
}

function askConfirmation(message) {
  confirmMessage.textContent = message;
  confirmModal.removeAttribute("hidden");

  return new Promise((resolve) => {
    confirmAnswer = resolve;
  });
}

function closeConfirmation(answer) {
  confirmModal.setAttribute("hidden", "");

  if (confirmAnswer) {
    confirmAnswer(answer);
    confirmAnswer = null;
  }
}

async function deleteProductWithConfirmation(product) {
  const answer = await askConfirmation(`Biztosan törölni szeretnéd ezt a terméket: ${product.name}?`);

  if (!answer) {
    return;
  }

  try {
    await deleteProductFromApi(product.id);

    if (selectedProduct && selectedProduct.id === product.id) {
      clearForm();
    }

    await loadProducts();
    showToast("A termék törölve lett.");
  } catch (error) {
    console.error(error);
    showToast("Nem sikerült törölni a terméket.");
  }
}

function startEditingSelectedProduct() {
  if (!selectedProduct) {
    showToast("Előbb válassz ki egy terméket.");
    return;
  }

  formMode = "edit";
  setFormEditable(true);
  updateActionButtons();
  setEditorHelp("Most már szerkesztheted a kiválasztott termék adatait.");
  nameInput.focus();
}

function startCreatingNewProduct() {
  selectedProduct = null;
  formMode = "new";

  productForm.reset();
  productPreview.src = "https://picsum.photos/id/1081/600/400";

  setFormEditable(true);
  updateActionButtons();
  renderProducts();
  setEditorHelp("Új termék felvétele: tölts ki minden mezőt, majd kattints a 'Küldés' gombra.");

  document.querySelector("#admin-editor").scrollIntoView({
    behavior: "smooth",
    block: "start"
  });

  nameInput.focus();
}

async function sendProduct() {
  if (formMode !== "edit" && formMode !== "new") {
    showToast("Előbb válassz szerkesztést vagy új terméket.");
    return;
  }

  if (!validateForm()) {
    return;
  }

  const payload = buildPayloadFromForm();

  try {
    if (formMode === "new") {
      await createProductInApi(payload);
      showToast("Az új termék fel lett töltve.");
    } else {
      await updateProductInApi(selectedProduct.id, payload);
      showToast("A termék módosítva lett.");
    }

    clearForm();
    await loadProducts();
  } catch (error) {
    console.error(error);
    showToast("Nem sikerült elküldeni az adatokat.");
  }
}

imageUrlInput.addEventListener("input", () => {
  const imageUrl = imageUrlInput.value.trim();

  if (imageUrl) {
    productPreview.src = imageUrl;
  }
});

imageFileInput.addEventListener("change", () => {
  const file = imageFileInput.files[0];

  if (!file) {
    return;
  }

  const reader = new FileReader();

  reader.addEventListener("load", () => {
    productPreview.src = reader.result;
    imageUrlInput.value = reader.result;
  });

  reader.readAsDataURL(file);
});

editProductBtn.addEventListener("click", startEditingSelectedProduct);
newProductBtn.addEventListener("click", startCreatingNewProduct);
topNewProductBtn.addEventListener("click", startCreatingNewProduct);
cancelEditBtn.addEventListener("click", clearForm);
sendProductBtn.addEventListener("click", sendProduct);
refreshProductsBtn.addEventListener("click", loadProducts);

confirmYesBtn.addEventListener("click", () => closeConfirmation(true));
confirmNoBtn.addEventListener("click", () => closeConfirmation(false));

confirmModal.addEventListener("click", (event) => {
  if (event.target === confirmModal) {
    closeConfirmation(false);
  }
});

deleteSelectedProductBtn.addEventListener("click", () => {
  if (!selectedProduct) {
    showToast("Előbb válassz ki egy terméket.");
    return;
  }

  deleteProductWithConfirmation(selectedProduct);
});

clearForm();
loadProducts();
