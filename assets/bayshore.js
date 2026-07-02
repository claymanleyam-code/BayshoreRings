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

// ── Section slide-up on scroll ────────────────────────────────
const sectionSelectors = '.story, .features, .coastal, .process, .products, .drop-section, .cta-section, .section';
const sio = new IntersectionObserver(entries => {
  entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add('in'); sio.unobserve(e.target); } });
}, { threshold: 0, rootMargin: '0px 0px -40% 0px' });
document.querySelectorAll(sectionSelectors).forEach(el => {
  el.classList.add('section-slide');
  sio.observe(el);
});

// ── Cart count helper ─────────────────────────────────────────
function updateCartCount(count) {
  const cartLink = document.querySelector('.nav-cart');
  if (!cartLink) return;
  let badge = cartLink.querySelector('.nav-cart-count');
  if (count > 0) {
    if (!badge) {
      badge = document.createElement('span');
      badge.className = 'nav-cart-count';
      cartLink.appendChild(badge);
    }
    badge.textContent = count;
  } else if (badge) {
    badge.remove();
  }
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
