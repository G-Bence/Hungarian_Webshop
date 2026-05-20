const navLinks = document.querySelector('.nav-links');
const nav = document.querySelector('.site-nav');
const navToggle = document.querySelector('.nav-toggle');

const cartButton = document.querySelector(".cart-button");
const cartPanel = document.querySelector(".cart-panel");
const cartClose = document.querySelector(".cart-close");
const cartItems = document.querySelector(".cart-items");
const cartEmpty = document.querySelector(".cart-empty");
const cartCount = document.querySelector(".cart-count");

const jumbotron = document.querySelector('.jumbotron');

const viewProducts = document.querySelectorAll(".view-product");

const productModal = document.querySelector('.product-modal');
const productModalClose = document.querySelector('.product-modal-close');
const quantityMinus = document.querySelector('.quantity-minus');
const quantityPlus = document.querySelector('.quantity-plus');
const quantityInput = document.querySelector('.quantity-input');
const productAddToCartBtn = document.querySelector('.add-to-cart');


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
function openProductModal(productName, productDescription, productImage) {
  document.querySelector('.product-modal-name').textContent = productName;
  document.querySelector('.product-modal-description').textContent = productDescription;
  document.querySelector('.product-modal-image').src = productImage;
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

// Update card buttons to open modal
document.querySelectorAll('.view-product').forEach(button => {
  button.addEventListener('click', (e) => {
    console.log('View Product button clicked');
    console.log('Event target:', e.target.closest('.card'));
    const card = e.target.closest('.card');
    const productName = card.querySelector('h4 b').textContent;
    const productDescription = card.querySelector('p').textContent;
    const productImage = card.querySelector('img').src;
    openProductModal(productName, productDescription, productImage);
  });
});


const cart = [];

//It would store the name/id of the item and the quantity, by multiplying the price by the quantity, we can get the total price of the cart. We can also add a remove button for each item in the cart, which would remove the item from the cart and update the total price accordingly.

const renderCart = () => {
  cartItems.innerHTML = "";

  cart.forEach((item) => {
    const listItem = document.createElement("li");
    listItem.className = "cart-item";
    listItem.innerHTML = `
			<div>
				<strong>${item.name}</strong>
				<span>${item.quantity} jó darab</span>
			</div>`;

      console.log(`Rendering cart item: ${item.name} (Quantity: ${item.quantity})`);
    cartItems.appendChild(listItem);

    ///ATTENTION: I changed the "ROLE" to "QUNTITY" in the cart array
  });

  cartEmpty.hidden = cart.length > 0;
  cartCount.textContent = String(cart.map((item) => parseInt(item.quantity)).reduce((a, b) => a + b, 0));
};

const toggleCart = (shouldOpen) => {
  const isHidden = cartPanel.hasAttribute("hidden");
  const willOpen = shouldOpen ?? isHidden;

  if (willOpen) {
    cartPanel.removeAttribute("hidden");
  } else {
    cartPanel.setAttribute("hidden", "");
  }
};

productAddToCartBtn.addEventListener("click", () => {
  const pModal = document.querySelector('.product-modal');
  if (!pModal) {
    return;
  }

  const name = pModal.querySelector('.product-modal-name').textContent || "Item";
  const quantity = pModal.querySelector('.quantity-input').value || 1;

  cart.push({ name, quantity });
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