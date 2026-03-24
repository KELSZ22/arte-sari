/**
 * Progressive enhancement for Shopify price facet.
 * Adds a dual-range slider UI synced with existing min/max inputs.
 */
/**
 * @param {number} n
 * @param {number} min
 * @param {number} max
 */
function clamp(n, min, max) {
  return Math.min(max, Math.max(min, n));
}

/** @param {unknown} value */
function parseNumber(value) {
  if (value == null) return null;
  const cleaned = String(value).replace(/[^0-9.]/g, '');
  if (!cleaned) return null;
  const num = Number(cleaned);
  return Number.isFinite(num) ? num : null;
}

const OPEN_STATE_KEY = '__priceFacetOpenById';
// Stores the `<details open>` state keyed by `price-facet-component#id`
// so we can restore it after the section is re-rendered.
const windowAny = /** @type {any} */ (window);
const openStateByFacetId = /** @type {Record<string, boolean>} */ (
  (windowAny[OPEN_STATE_KEY] = windowAny[OPEN_STATE_KEY] ?? {})
);

/** @param {HTMLElement} el */
function initPriceFacet(el) {
  if (el.dataset.priceRangeSliderInitialized === 'true') return;

  /** @type {HTMLElement | null} */
  const slider = el.querySelector('[data-price-range-slider]');
  if (!slider) return;

  /** @type {HTMLInputElement | null} */
  const minInput = el.querySelector('input[ref="minInput"]');
  /** @type {HTMLInputElement | null} */
  const maxInput = el.querySelector('input[ref="maxInput"]');
  /** @type {HTMLInputElement | null} */
  const minRange = el.querySelector('input[type="range"][data-price-min]');
  /** @type {HTMLInputElement | null} */
  const maxRange = el.querySelector('input[type="range"][data-price-max]');
  /** @type {HTMLElement | null} */
  const fill = el.querySelector('[data-price-range-fill]');
  /** @type {HTMLElement | null} */
  const track = el.querySelector('.price-facet__track');
  /** @type {HTMLElement | null} */
  const minLabel = el.querySelector('[data-price-min-label]');
  /** @type {HTMLElement | null} */
  const maxLabel = el.querySelector('[data-price-max-label]');

  if (!minInput || !maxInput || !minRange || !maxRange) return;

  el.dataset.priceRangeSliderInitialized = 'true';

  /** @type {HTMLInputElement} */
  const minInputEl = minInput;
  /** @type {HTMLInputElement} */
  const maxInputEl = maxInput;
  /** @type {HTMLInputElement} */
  const minRangeEl = minRange;
  /** @type {HTMLInputElement} */
  const maxRangeEl = maxRange;

  const facetKey = el.id;
  /** @type {HTMLDetailsElement | null} */
  const detailsEl = el.closest('details');

  // Restore accordion open state across morphs (especially important for horizontal style).
  if (facetKey && detailsEl instanceof HTMLDetailsElement && typeof openStateByFacetId[facetKey] === 'boolean') {
    const shouldBeOpen = openStateByFacetId[facetKey];
    detailsEl.open = shouldBeOpen ?? false;
    delete openStateByFacetId[facetKey];
  }

  const absMin = parseNumber(minInputEl.dataset.min) ?? 0;
  const absMax = parseNumber(maxInputEl.dataset.max) ?? parseNumber(maxInputEl.placeholder) ?? 0;
  const step = 1;
  const currencySymbol = el.dataset.currencySymbol ?? '';

  /** @param {number} v */
  function formatValue(v) {
    try {
      return `${currencySymbol}${Math.round(v).toLocaleString()}`;
    } catch {
      return `${currencySymbol}${Math.round(v)}`;
    }
  }

  /** @returns {[number, number]} */
  function getCurrent() {
    const minVal = parseNumber(minInputEl.value);
    const maxVal = parseNumber(maxInputEl.value);
    const currentMin = clamp(minVal ?? absMin, absMin, absMax);
    const currentMax = clamp(maxVal ?? absMax, absMin, absMax);
    return currentMin <= currentMax ? [currentMin, currentMax] : [currentMax, currentMin];
  }

  /** @param {number} minVal @param {number} maxVal */
  function setFill(minVal, maxVal) {
    if (!fill || !track) return;
    const range = absMax - absMin || 1;
    const left = ((minVal - absMin) / range) * 100;
    const right = ((maxVal - absMin) / range) * 100;

    const trackWidth = track.clientWidth || 1;

    // Span the fill from thumb center to thumb center (no edge gap).
    const leftPx = (left / 100) * trackWidth;
    const rightPx = (right / 100) * trackWidth;
    const widthPx = Math.max(0, rightPx - leftPx);

    fill.style.left = `${leftPx}px`;
    fill.style.width = `${widthPx}px`;
  }

  /** @param {number} minVal @param {number} maxVal */
  function setLabels(minVal, maxVal) {
    if (minLabel) minLabel.textContent = formatValue(minVal);
    if (maxLabel) maxLabel.textContent = formatValue(maxVal);
  }

  function syncFromInputs() {
    const [minVal, maxVal] = getCurrent();
    minRangeEl.value = String(minVal);
    maxRangeEl.value = String(maxVal);
    setFill(minVal, maxVal);
    setLabels(minVal, maxVal);
  }

  /** @param {HTMLInputElement} fromRange */
  function syncToInputs(fromRange) {
    // ensure min <= max with a small gap
    let minVal = parseNumber(minRangeEl.value) ?? absMin;
    let maxVal = parseNumber(maxRangeEl.value) ?? absMax;

    if (minVal > maxVal) {
      if (fromRange === minRange) maxVal = minVal;
      else minVal = maxVal;
    }

    minVal = clamp(minVal, absMin, absMax);
    maxVal = clamp(maxVal, absMin, absMax);

    minRangeEl.value = String(minVal);
    maxRangeEl.value = String(maxVal);

    minInputEl.value = minVal === absMin ? '' : String(minVal);
    maxInputEl.value = maxVal === absMax ? '' : String(maxVal);

    setFill(minVal, maxVal);
    setLabels(minVal, maxVal);
  }

  // Configure ranges
  minRangeEl.min = String(absMin);
  minRangeEl.max = String(absMax);
  minRangeEl.step = String(step);
  maxRangeEl.min = String(absMin);
  maxRangeEl.max = String(absMax);
  maxRangeEl.step = String(step);

  // Init values
  syncFromInputs();

  // Capture open/close state right before the built-in `change` handler triggers
  // the section re-render. Native `change` is fired after the thumb is released.
  const captureOpenState = () => {
    if (!facetKey || !(detailsEl instanceof HTMLDetailsElement)) return;
    openStateByFacetId[facetKey] = detailsEl.open;
  };
  minRangeEl.addEventListener('change', captureOpenState);
  maxRangeEl.addEventListener('change', captureOpenState);

  minRangeEl.addEventListener('input', () => syncToInputs(minRangeEl));
  maxRangeEl.addEventListener('input', () => syncToInputs(maxRangeEl));

  // If user edits text inputs, update slider.
  minInputEl.addEventListener('change', syncFromInputs);
  maxInputEl.addEventListener('change', syncFromInputs);
}

function init() {
  for (const el of document.querySelectorAll('price-facet-component')) {
    if (el instanceof HTMLElement) initPriceFacet(el);
  }
}

const runInit = () => init();
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', runInit, { once: true });
} else {
  runInit();
}

// Shopify section rendering can replace the facets DOM; re-init when new
// `price-facet-component` nodes show up.
const OBSERVER_KEY = '__priceFacetSliderObserverInitialized';
if (!windowAny[OBSERVER_KEY]) {
  windowAny[OBSERVER_KEY] = true;

  let rafPending = false;
  const scheduleInit = () => {
    if (rafPending) return;
    rafPending = true;
    window.requestAnimationFrame(() => {
      rafPending = false;
      runInit();
    });
  };

  const observer = new MutationObserver(scheduleInit);
  observer.observe(document.documentElement, { childList: true, subtree: true });
}

