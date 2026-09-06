// ── Nav scroll shadow ────────────────────────────────────────
const nav = document.getElementById('mainNav');
if (nav) {
  window.addEventListener('scroll', () => nav.classList.toggle('scrolled', scrollY > 60), { passive: true });
}

// ── Mobile menu ───────────────────────────────────────────────
const toggle = document.getElementById('navToggle');
const links  = document.getElementById('navLinks');
if (toggle && links) {
  toggle.addEventListener('click', () => {
    const open = links.classList.toggle('open');
    toggle.classList.toggle('open', open);
  });
  links.querySelectorAll('a').forEach(a => a.addEventListener('click', () => {
    links.classList.remove('open');
    toggle.classList.remove('open');
  }));
}

// ── Scroll reveal (elements) ──────────────────────────────────
const io = new IntersectionObserver(entries => {
  entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } });
}, { threshold: 0.1, rootMargin: '0px 0px -30px 0px' });
document.querySelectorAll('.reveal').forEach(el => io.observe(el));

// ── Section fade-in on scroll ─────────────────────────────────
const sectionSelectors = '.story, .features, .coastal, .process, .products, .drop-section, .cta-section, .section, .about-statement, .about-fullbleed, .about-bayshore-figure, .reviews-pullquote, .proc-hero, .about-hero, .reviews-hero';
const sio = new IntersectionObserver(entries => {
  entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add('in'); sio.unobserve(e.target); } });
}, { threshold: 0, rootMargin: '0px 0px -4% 0px' });
document.querySelectorAll(sectionSelectors).forEach(el => {
  el.classList.add('section-slide');
  sio.observe(el);
});

// ── Cart count helper ─────────────────────────────────────────
function updateCartCount(count) {
  const cartIcon = document.querySelector('.nav-cart-icon');
  if (!cartIcon) return;
  let badge = cartIcon.querySelector('.nav-cart-count');
  if (!badge) {
    badge = document.createElement('span');
    badge.className = 'nav-cart-count';
    cartIcon.appendChild(badge);
  }
  badge.textContent = count;
}

// ── Cart toast ────────────────────────────────────────────────
function showCartToast(title) {
  let toast = document.getElementById('cart-toast');
  if (!toast) {
    toast = document.createElement('div');
    toast.id = 'cart-toast';
    toast.className = 'cart-toast';
    toast.innerHTML = `
      <div class="cart-toast-header">
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
        Added to Cart
      </div>
      <p class="cart-toast-product"></p>
      <div class="cart-toast-actions">
        <a href="/cart" class="cart-toast-btn cart-toast-primary">View Cart &rarr;</a>
        <button class="cart-toast-btn cart-toast-ghost" id="cart-toast-dismiss">Continue Shopping</button>
      </div>`;
    document.body.appendChild(toast);
    toast.querySelector('#cart-toast-dismiss').addEventListener('click', () => toast.classList.remove('show'));
  }
  toast.querySelector('.cart-toast-product').textContent = title;
  toast.classList.add('show');
  clearTimeout(toast._t);
  toast._t = setTimeout(() => toast.classList.remove('show'), 5000);
}

// ── AJAX Add to Cart ──────────────────────────────────────────
document.querySelectorAll('.product-form').forEach(form => {
  form.addEventListener('submit', async e => {
    e.preventDefault();
    const btn = form.querySelector('.product-submit');
    const original = btn.textContent;
    btn.textContent = 'Adding…';
    btn.disabled = true;

    try {
      const addRes = await fetch('/cart/add.js', { method: 'POST', body: new FormData(form) });
      if (!addRes.ok) throw new Error();
      const item = await addRes.json();

      const cartRes = await fetch('/cart.js');
      const cart = await cartRes.json();
      updateCartCount(cart.item_count);
      showCartToast(item.title);

      btn.textContent = 'Added ✓';
      setTimeout(() => { btn.textContent = original; btn.disabled = false; }, 2200);
    } catch {
      form.submit();
    }
  });
});

// ── Cart page: quantity controls ──────────────────────────────
document.querySelectorAll('.cart-qty-btn').forEach(btn => {
  btn.addEventListener('click', async () => {
    const row   = btn.closest('[data-line]');
    const line  = parseInt(row.dataset.line, 10);
    const delta = btn.dataset.dir === 'up' ? 1 : -1;
    const input = row.querySelector('.cart-qty-input');
    const next  = Math.max(0, parseInt(input.value, 10) + delta);

    const res = await fetch('/cart/change.js', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ line, quantity: next })
    });
    if (res.ok) window.location.reload();
  });
});

// ── Help Center Modal ─────────────────────────────────────────
const HELP_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbxl2ASk642Upf_s53deqG4V55oOBX_xDXX0xKZrRMCdVJvGnSWj4hYiUCfc0ilWFAfClA/exec';

const helpModal       = document.getElementById('helpModal');
const helpOpenBtn     = document.getElementById('helpCenterBtn');
const helpClose       = document.getElementById('helpModalClose');
const helpForm        = document.getElementById('helpForm');
const helpSuccess     = document.getElementById('helpSuccess');
const helpSuccessClose = document.getElementById('helpSuccessClose');

function helpToTitleCase(str) {
  return str.trim().replace(/\S+/g, w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase());
}

function setHelpError(input, msg) {
  clearHelpError(input);
  const err = document.createElement('span');
  err.className = 'help-error';
  err.textContent = msg;
  input.closest('.help-field').appendChild(err);
  input.setAttribute('aria-invalid', 'true');
}

function clearHelpError(input) {
  const field = input.closest('.help-field');
  const err = field.querySelector('.help-error');
  if (err) err.remove();
  input.removeAttribute('aria-invalid');
}

function validateHelp() {
  const fn  = helpForm.querySelector('#helpFirstName');
  const ln  = helpForm.querySelector('#helpLastName');
  const em  = helpForm.querySelector('#helpEmail');
  const msg = helpForm.querySelector('#helpMessage');
  let ok = true;

  if (!fn.value.trim() || !/^[A-Za-z\s\-']+$/.test(fn.value.trim())) {
    setHelpError(fn, 'Letters only — no numbers or special characters.'); ok = false;
  } else { clearHelpError(fn); }

  if (!ln.value.trim() || !/^[A-Za-z\s\-']+$/.test(ln.value.trim())) {
    setHelpError(ln, 'Letters only — no numbers or special characters.'); ok = false;
  } else { clearHelpError(ln); }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(em.value.trim())) {
    setHelpError(em, 'Enter a valid email address.'); ok = false;
  } else { clearHelpError(em); }

  if (!msg.value.trim()) {
    setHelpError(msg, 'Please enter a message.'); ok = false;
  } else { clearHelpError(msg); }

  return ok;
}

function openHelpModal() {
  if (!helpModal) return;
  helpModal.removeAttribute('aria-hidden');
  helpModal.classList.add('open');
  document.body.style.overflow = 'hidden';
  helpModal.querySelector('input, select, textarea')?.focus();
}
function closeHelpModal() {
  if (!helpModal) return;
  helpModal.setAttribute('aria-hidden', 'true');
  helpModal.classList.remove('open');
  document.body.style.overflow = '';
  if (helpForm) {
    helpForm.hidden = false;
    helpForm.reset();
    helpForm.querySelectorAll('input, textarea').forEach(i => clearHelpError(i));
    const btn = helpForm.querySelector('.help-submit');
    if (btn) { btn.textContent = 'Send Message'; btn.disabled = false; }
  }
  if (helpSuccess) helpSuccess.hidden = true;
}

if (helpOpenBtn)      helpOpenBtn.addEventListener('click', openHelpModal);
if (helpClose)        helpClose.addEventListener('click', closeHelpModal);
if (helpSuccessClose) helpSuccessClose.addEventListener('click', closeHelpModal);
if (helpModal)        helpModal.addEventListener('click', e => { if (e.target === helpModal) closeHelpModal(); });
document.addEventListener('keydown', e => { if (e.key === 'Escape' && helpModal?.classList.contains('open')) closeHelpModal(); });

if (helpForm) {
  helpForm.querySelectorAll('input, textarea').forEach(input => {
    input.addEventListener('input', function () { if (this.getAttribute('aria-invalid')) clearHelpError(this); });
  });

  helpForm.addEventListener('submit', async e => {
    e.preventDefault();
    if (!validateHelp()) return;

    const btn = helpForm.querySelector('.help-submit');
    const originalText = btn.textContent;
    btn.textContent = 'Sending…';
    btn.disabled = true;

    const raw = new FormData(helpForm);
    const params = new URLSearchParams({
      timestamp:  new Date().toLocaleString('en-US', { timeZone: 'America/New_York' }),
      first_name: helpToTitleCase(raw.get('first_name') || ''),
      last_name:  helpToTitleCase(raw.get('last_name')  || ''),
      email:      (raw.get('email')   || '').trim().toLowerCase(),
      subject:    (raw.get('subject') || '').trim(),
      message:    (raw.get('message') || '').trim(),
      page:       window.location.href
    });

    try {
      await fetch(HELP_SCRIPT_URL + '?' + params.toString(), { mode: 'no-cors' });
      btn.textContent = 'Sent ✓';
      setTimeout(() => {
        helpForm.hidden = true;
        helpSuccess.hidden = false;
      }, 700);
    } catch {
      btn.textContent = originalText;
      btn.disabled = false;
      alert('Something went wrong. Please email us at contact@bayshorerings.com');
    }
  });
}
