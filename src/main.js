import { fetchProductsFromRetool } from "../src/logic.js";

const navLinks = document.querySelector('.nav-links');
const nav = document.querySelector('.site-nav');
const navToggle = document.querySelector('.nav-toggle');

const cartButton = document.querySelector(".cart-button");
const cartPanel = document.querySelector(".cart-panel");
const cartClose = document.querySelector(".cart-close");
const cartItems = document.querySelector(".cart-items");
const cartEmpty = document.querySelector(".cart-empty");
const cartCount = document.querySelector(".cart-count");
const cartTotalValue = document.querySelector(".cart-total-value");

const jumbotron = document.querySelector('.jumbotron');

/*const viewProducts = document.querySelectorAll(".view-product");*/
const productList = document.querySelector(".card-row");

const productModal = document.querySelector('.product-modal');
const productModalClose = document.querySelector('.product-modal-close');
const quantityMinus = document.querySelector('.quantity-minus');
const quantityPlus = document.querySelector('.quantity-plus');
const quantityInput = document.querySelector('.quantity-input');
const productAddToCartBtn = document.querySelector('.add-to-cart');
const productModalPrice = document.querySelector('.product-price');

const DEFAULT_IMAGE_SEED = "hun-shop";
const buildFallbackImage = (name, index) => {
  const seed = name ? encodeURIComponent(name) : `${DEFAULT_IMAGE_SEED}-${index}`;
  return `https://picsum.photos/seed/${seed}/600/400`;
};

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

const backgrounds = [
  '../public/jumbotron_01.jpg',
  '../public/jumbotron_02.jpg',
  '../public/jumbotron_03.jpg',
  '../public/jumbotron_04.jpg',
  '../public/jumbotron_05.jpg',
  '../public/jumbotron_06.jpg'
];
let currentBackground = 0;

function updateJumbotronBackground() {
  currentBackground = (currentBackground + 1) % backgrounds.length;
  jumbotron.style.backgroundImage = `url('${backgrounds[currentBackground]}')`;
  /*console.log(`Background updated to: ${backgrounds[currentBackground]}`);*/
}

setInterval(updateJumbotronBackground, 15000);


// Open product modal
function openProductModal(productName, productDescription, productImage, productPrice) {
  document.querySelector('.product-modal-name').textContent = productName;
  document.querySelector('.product-modal-description').textContent = productDescription;
  document.querySelector('.product-modal-image').src = productImage;
  if (productModalPrice) {
    productModalPrice.textContent = `${productPrice} Jó magyar forint`;
  }
  quantityInput.value = 1;
  productModal.removeAttribute('hidden');
}

// Close product modal
function closeProductModal() {
  productModal.setAttribute('hidden', '');
}

productModalClose.addEventListener('click', closeProductModal);

// Quantity controls
quantityMinus.addEventListener('click', () => {
  if (quantityInput.value > 1) {
    quantityInput.value--;
  }
});

quantityPlus.addEventListener('click', () => {
  quantityInput.value++;
});

quantityInput.addEventListener('change', () => {
  if (quantityInput.value < 1) {
    quantityInput.value = 1;
  }
});

// Add to cart from modal
productAddToCartBtn.addEventListener('click', () => {
  const quantity = parseInt(quantityInput.value);
  const productName = document.querySelector('.product-modal-name').textContent;
  // Add your cart logic here
  console.log(`Added ${quantity} of ${productName} to cart`);
  closeProductModal();
});

// Render product cards from Retool
const renderProducts = (products) => {
  if (!productList) {
    return;
  }

  if (!Array.isArray(products) || products.length === 0) {
    productList.innerHTML = "<p class=\"products-loading\">Nincs elerheto termek.</p>";
    return;
  }

  productList.innerHTML = products
    .map((product, index) => {
      const safeName = product.name || "Termek";
      const safeDescription = product.description || "";
      const safePrice = Number(product.price) || 0;
      const safeImage = product.image || buildFallbackImage(safeName, index);

      return `
        <div class="card" data-name="${safeName}" data-description="${safeDescription}" data-price="${safePrice}" data-image="${safeImage}">
          <img src="${safeImage}" alt="${safeName}">
          <div class="container">
            <h4><b>${safeName}</b></h4>
            <p>${safeDescription}</p>
            <div class="card-price">${safePrice} Jó magyar forint</div>
            <button class="view-product" type="button">Árú megnézése</button>
          </div>
        </div>`;
    })
    .join("");
};

const loadProducts = async () => {
  if (!productList) {
    return;
  }

  productList.innerHTML = "<p class=\"products-loading\">Termekek betoltese...</p>";

  try {
    const products = await fetchProductsFromRetool();
    renderProducts(products);
  } catch (error) {
    console.error(error);
    productList.innerHTML = "<p class=\"products-loading\">Nem sikerult betolteni a termekeket.</p>";
  }
};

// Update card buttons to open modal -- ?
if (productList) {
  productList.addEventListener('click', (e) => {
    const button = e.target.closest('.view-product');
    if (!button) {
      return;
    }

    console.log('View Product button clicked');
    const card = button.closest('.card');
    if (!card) {
      return;
    }

    const productName = card.dataset.name || "Termék";
    const productDescription = card.dataset.description || "";
    const productImage = card.dataset.image || DEFAULT_PRODUCT_IMAGE;
    const productPrice = card.dataset.price || 0;
    openProductModal(productName, productDescription, productImage, productPrice);
  });
}


const cart = [];

//It would store the name/id of the item and the quantity, by multiplying the price by the quantity, we can get the total price of the cart. We can also add a remove button for each item in the cart, which would remove the item from the cart and update the total price accordingly.

const parsePriceValue = (priceText) => {
  const matched = String(priceText).match(/[0-9]+/g);
  if (!matched) {
    return 0;
  }
  return parseInt(matched.join(""), 10);
};

const renderCart = () => {
  cartItems.innerHTML = "";

  cart.forEach((item, index) => {
    const listItem = document.createElement("li");
    listItem.className = "cart-item";
    listItem.innerHTML = `
			<div class="cart-item-info">
				<strong>${item.name}</strong>
				<span>${item.quantity} jó darab</span>
			</div>
			<button class="cart-item-remove" type="button" aria-label="Remove ${item.name}">Törlés</button>`;

    const removeButton = listItem.querySelector(".cart-item-remove");
    removeButton.addEventListener("click", () => {
      cart.splice(index, 1);
      renderCart();
    });

    console.log(`Rendering cart item: ${item.name} (Quantity: ${item.quantity})`);
    cartItems.appendChild(listItem);

    ///ATTENTION: I changed the "ROLE" to "QUNTITY" in the cart array
  });

  cartEmpty.hidden = cart.length > 0;
  cartCount.textContent = String(cart.map((item) => parseInt(item.quantity)).reduce((a, b) => a + b, 0));
   const cartTotal = cart
    .map((item) => parseInt(item.quantity) * parseInt(item.price || 0))
    .reduce((a, b) => a + b, 0);

  if (cartTotalValue) {
    cartTotalValue.textContent = `${cartTotal} Jó magyar forint`;
  }
};

const toggleCart = (shouldOpen) => {
  const isHidden = cartPanel.classList.contains("cart-panel-close");
  const willOpen = shouldOpen ?? isHidden;

  if (willOpen) {
    /*cartPanel.removeAttribute("hidden");*/
    cartPanel.classList.remove("cart-panel-close")
    cartPanel.classList.add("cart-panel-open")
    /*console.log("Open")*/

  } else {
    cartPanel.classList.remove("cart-panel-open")
    cartPanel.classList.add("cart-panel-close");
    /*cartPanel.setAttribute("hidden", "")*/
    /*console.log("Close")*/
  }
};

productAddToCartBtn.addEventListener("click", () => {
  const pModal = document.querySelector('.product-modal');
  if (!pModal) {
    return;
  }

  const name = pModal.querySelector('.product-modal-name').textContent || "Item";
  const quantity = parseInt(pModal.querySelector('.quantity-input').value || 1);
  const priceText = pModal.querySelector('.product-price')?.textContent || "0";
  const price = parsePriceValue(priceText);

  cart.push({name, quantity, price});
  renderCart();
  toggleCart(true);
});

cartButton.addEventListener("click", () => {
  toggleCart();
});

cartClose.addEventListener("click", () => {
  toggleCart(false);
});

renderCart();
loadProducts();