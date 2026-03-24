// REUSABLE MODAL - AJ
const customModal = document.getElementById('custom_modal');
const customModalContent = customModal.querySelector('.custom-modal-content');

function onCustomModalEscapeKey(element) {
  if (element.key === 'Escape') {
    hideCustomModal();
  }
}

function showCustomModal(html = {}) {
    customModalContent.innerHTML = html;
    customModal.classList.remove('hidden');
    customModal.classList.add('modal-visible');

    document.body.style.overflow = 'hidden';
    const closeBtn = customModal.querySelector('.close-modal');
    if (closeBtn) {
        closeBtn.addEventListener('click', hideCustomModal);
    }
    const backdrop = customModal.querySelector('.custom-modal-backdrop');
    if (backdrop) {
      backdrop.addEventListener('click', hideCustomModal);
    } 
    document.addEventListener('keydown', onCustomModalEscapeKey); 
}

function hideCustomModal() {
  customModal.classList.remove('modal-visible');
  customModal.classList.add('hidden');
  customModalContent.innerHTML = '';
  document.body.style.overflow = '';
  document.removeEventListener('keydown', onCustomModalEscapeKey);
}

// QUICK VIEW FUNCTION
async function openQuickView(handle, category, price) {
  try {
    // const res = await fetch(`/products/${handle}.js`);
    
    const res = await fetch(`/products/${handle}?view=quickview`);

    if (!res.ok) throw new Error('Failed to fetch product');

    const data = await res.json();
    const product = data.product;

    console.log(product);

    const html = `
      <div class="qv-inner">
        <div class="qv-product-description">
          <div class="qv-product-category">${category}</div>
          <div class="qv-product-title">${product.title}</div>
          <div class="qv-product-price">${price}</div>
        </div>

        <div class="qv-interactions">
          <div class="qv-images">
            <img src="${product.featured_image}">
          </div>
          <div class="qv-selectors">
            <div class="qv-product-description">${product.description}</div>
            ${product.options && !(product.options.length === 1 && product.options[0].values.length === 1 && product.options[0].values[0] === "Default Title") ? `
            <div class="qv-product-variants">
              ${product.options.map((o, optionIndex) => `
                <div class="qv-variant-name">
                  ${o.name}: 
                  <span class="qv-selected-variant qv-selected-${o.name}"></span>
                </div>

                <ul class="qv-option">
                ${o.values.map(v => {
                    const matchingVariant = product.variants.find(variant => {
                      return variant[`option${optionIndex + 1}`] === v;
                    });

                    const colorCode = matchingVariant?.color_code || null;

                    const isColorOption = o.name.toLowerCase() === 'color' && colorCode;

                    return `
                      <li>
                        <span 
                          class="qv-option-variant ${isColorOption ? 'is-color' : ''}"
                          data-option-type="${o.name}"
                          data-option-value="${v}"
                          ${isColorOption ? `style="--colorOptionCode:${colorCode}"` : ''}
                          title="${v}"
                        >
                          ${isColorOption ? '' : v} <!-- Show text only if not color swatch -->
                        </span>
                      </li>
                    `;
                  }).join('')}
                </ul>
              `).join('')}
            </div>` : ``}
            <div class="qv-addons">
              <p class="addons-title">ADD ONS:</p>

              <label class="addon-option">
                <input type="checkbox" class="addon-checkbox" data-variant="45627257454790">
                <svg width="12" height="10" viewBox="0 0 12 10" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M4 9.4L0 5.4L1.4 4L4 6.6L10.6 0L12 1.4L4 9.4Z" fill="white"/>
                </svg> 
                  Add ₱50 Gift Card
              </label>

              <label class="addon-option">
                <input type="checkbox" class="addon-checkbox" data-variant="45627257487558">
                <svg width="12" height="10" viewBox="0 0 12 10" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M4 9.4L0 5.4L1.4 4L4 6.6L10.6 0L12 1.4L4 9.4Z" fill="white"/>
                </svg> 
                Add ₱10 Gift Box
              </label>
            </div>
          </div>
        </div>

        <div class="qv-atc">
          <div class="qv-quantity-selector">
            <button type="button" class="qty-btn qty-decrease">−</button>
            <input type="number" class="qty-input" value="1" min="1" readonly tabindex="-1">
            <button type="button" class="qty-btn qty-increase">+</button>
          </div>
          <product-form class="product-form">
            <form>
              <input type="hidden" name="id" value="">
              <input type="hidden" name="quantity" value="1">
              <button type="submit" class="qv-atc-btn">
                Add to Cart
              </button>
            </form>
          </product-form>
          <a class="qv-cta" href="${product.url}">
            View full details
          </a>
        </div>
      </div>
    `;

    showCustomModal(html);
    const modal = customModal;

    const productFormEl = modal.querySelector('product-form');
    if (productFormEl && typeof productFormEl.initialize === 'function') {
      productFormEl.initialize();
    }

    const qtyInput = modal.querySelector('.qty-input');
    const quantityField = modal.querySelector('input[name="quantity"]');
    const decreaseBtn = modal.querySelector('.qty-decrease');
    const increaseBtn = modal.querySelector('.qty-increase');

    const syncQuantity = (value) => {
      if (isNaN(value) || value < 1) value = 1;
      qtyInput.value = value;
      quantityField.value = value;
    };

    syncQuantity(parseInt(qtyInput.value));

    qtyInput.addEventListener('input', () => syncQuantity(parseInt(qtyInput.value)));
    increaseBtn.addEventListener('click', () => syncQuantity(parseInt(qtyInput.value)+1));
    decreaseBtn.addEventListener('click', () => syncQuantity(parseInt(qtyInput.value)-1));

    initQuickViewVariants(product);

    const atcForm = modal.querySelector('product-form form');

    atcForm.addEventListener('submit', async (e) => {
  e.preventDefault();

  const formData = new FormData(atcForm);

  // Get selected main product variant and quantity
  const mainVariantId = formData.get('id');
  const quantity = parseInt(formData.get('quantity')) || 1;

  // Add selected add-ons
  const addons = modal.querySelectorAll('.addon-checkbox:checked');

  const items = [
    { id: mainVariantId, quantity: quantity }
  ];

  addons.forEach(a => {
    items.push({
      id: a.dataset.variant,
      quantity: 1
    });
  });

  try {
    await fetch('/cart/add.js', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ items })
    });

    const cartRes = await fetch('/cart.js');
    const cart = await cartRes.json();

    document.dispatchEvent(
      new CustomEvent('cart:update', {
        bubbles: true,
        detail: { resource: cart, sourceId: 'quick-view', data: { itemCount: cart.item_count } }
      })
    );

    const drawer = document.querySelector('cart-drawer-component');
    if (drawer?.open) drawer.open();

  } catch (err) {
    console.error(err);
  }
});

    function initQuickViewVariants(product) {
      const optionButtons = modal.querySelectorAll('.qv-option-variant');
      const atcButton = modal.querySelector('.qv-atc-btn');

      let selectedOptions = {};

      product.options.forEach(option => {
        selectedOptions[option.name] = option.values[0];
        const selectedText = modal.querySelector(`.qv-selected-${CSS.escape(option.name)}`);
        if (selectedText) selectedText.textContent = option.values[0];

        const firstOption = modal.querySelector(`.qv-option-variant[data-option-type="${option.name}"]`);
        if (firstOption) firstOption.classList.add('active');
      });

      updateVariant();

      optionButtons.forEach(btn => {
        btn.addEventListener('click', () => {
          const optionName = btn.dataset.optionType;
          const optionValue = btn.dataset.optionValue;

          modal.querySelectorAll(`.qv-option-variant[data-option-type="${optionName}"]`)
            .forEach(el => el.classList.remove('active'));

          btn.classList.add('active');
          selectedOptions[optionName] = optionValue;

          const selectedText = modal.querySelector(`.qv-selected-${CSS.escape(optionName)}`);
          if (selectedText) selectedText.textContent = optionValue;

          updateVariant();
        });
      });

      function updateVariant() {
        const matchedVariant = product.variants.find(variant => {
          return product.options.every((option, index) => {
            return variant[`option${index + 1}`] === selectedOptions[option.name];
          });
        });
        if (!matchedVariant) return;

        const form = modal.querySelector('product-form form');
        form.querySelector('input[name="id"]').value = matchedVariant.id;

        if (!matchedVariant.available) {
          atcButton.textContent = "Sold Out";
          atcButton.disabled = true;
        } else {
          atcButton.textContent = "Add to Cart";
          atcButton.disabled = false;
        }

        const priceEl = modal.querySelector('.qv-product-price');
        if (priceEl) priceEl.textContent = (matchedVariant.price / 100).toFixed(2);
      }
    }

  } catch (error) {
    console.error(error);
    alert('Unable to load product.');
  }
}

// document.querySelectorAll('.custom-quick-view-cta').forEach(btn => {
//   btn.addEventListener('click', () => {
//     console.log('custom-quick-view-cta clicked!')
//     openQuickView(btn.dataset.handle, btn.dataset.category, btn.dataset.price);
//   });
// });

document.body.addEventListener('click', (e) => {
  const btn = e.target.closest('.custom-quick-view-cta');
  if (!btn) return;
  e.preventDefault();
  e.stopPropagation();
  openQuickView(btn.dataset.handle, btn.dataset.category, btn.dataset.price);
});

