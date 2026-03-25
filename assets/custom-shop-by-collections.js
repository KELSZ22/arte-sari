/**
 * Shop-by dropdown for list-collections (`<select data-custom-shop-by-select>`).
 */
function applyShopByFromSelect(select, items) {
  const opt = select.selectedOptions[0];
  if (!opt) return;

  const handlesRaw = opt.getAttribute('data-handles') || '';
  const handles = handlesRaw
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);

  const showAll = handles.length === 0;

  items.forEach((item) => {
    const handle = item.getAttribute('data-collection-handle') || '';
    if (showAll) {
      item.hidden = false;
    } else {
      item.hidden = !handles.includes(handle);
    }
  });
}

function initCustomShopByCollections(root) {
  const sectionId = root.dataset.sectionId;
  if (!sectionId) return;

  const sectionEl = document.getElementById(`shopify-section-${sectionId}`);
  if (!sectionEl) return;

  const items = sectionEl.querySelectorAll('.resource-list__item[data-collection-handle]');
  if (!items.length) return;

  const select = root.querySelector('[data-custom-shop-by-select]');
  if (!select) return;

  select.addEventListener('change', () => {
    applyShopByFromSelect(select, items);
  });

  applyShopByFromSelect(select, items);
}

function initAllCustomShopByCollections() {
  document.querySelectorAll('[data-custom-shop-by-root]').forEach((root) => {
    if (root.dataset.shopByInitialized === 'true') return;
    root.dataset.shopByInitialized = 'true';
    initCustomShopByCollections(root);
  });
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initAllCustomShopByCollections);
} else {
  initAllCustomShopByCollections();
}

document.addEventListener('shopify:section:load', (event) => {
  event.target.querySelectorAll('[data-custom-shop-by-root]').forEach((root) => {
    delete root.dataset.shopByInitialized;
  });
  initAllCustomShopByCollections();
});
