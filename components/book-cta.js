(function(){
  const CTA_VARIANTS = {
    primary: 'btn btn-primary',
    ghost: 'btn btn-ghost',
    inline: 'cta-inline'
  };

  let bookingUrlPromise;

  function getBookingUrl(){
    if (typeof window !== 'undefined' && window.NEXT_PUBLIC_BOOKING_URL) {
      return Promise.resolve(window.NEXT_PUBLIC_BOOKING_URL);
    }
    if (!bookingUrlPromise) {
      bookingUrlPromise = fetch('/api/booking-url', { cache: 'no-store' })
        .then((res) => {
          if (!res.ok) {
            throw new Error('Unable to load booking URL');
          }
          return res.json();
        })
        .then((payload) => {
          if (!payload || !payload.bookingUrl) {
            throw new Error('Booking URL missing from payload');
          }
          return payload.bookingUrl;
        })
        .catch((error) => {
          console.error('[BookCTA] Failed to resolve booking URL', error);
          throw error;
        });
    }
    return bookingUrlPromise;
  }

  function withPlan(url, plan){
    if (!plan) return url;
    const separator = url.includes('?') ? '&' : '?';
    return `${url}${separator}plan=${encodeURIComponent(plan)}`;
  }

  class BookCTA extends HTMLElement {
    static get observedAttributes(){
      return ['label', 'variant', 'plan', 'target'];
    }

    constructor(){
      super();
      this._anchor = document.createElement('a');
      this._anchor.setAttribute('rel', 'noopener noreferrer');
      this._anchor.dataset.loading = 'true';
      this.appendChild(this._anchor);
    }

    connectedCallback(){
      this.update();
    }

    attributeChangedCallback(){
      this.update();
    }

    update(){
      const label = this.getAttribute('label') || 'Book a discovery call';
      const variant = (this.getAttribute('variant') || 'primary').toLowerCase();
      const plan = this.getAttribute('plan');
      const target = this.getAttribute('target') || '_blank';

      const classes = CTA_VARIANTS[variant] || CTA_VARIANTS.primary;
      this._anchor.className = classes;
      this._anchor.textContent = label;
      this._anchor.setAttribute('target', target);

      if (classes.includes('btn')) {
        this._anchor.classList.add('btn');
      }

      this._anchor.setAttribute('aria-disabled', 'true');
      this._anchor.removeAttribute('href');
      this._anchor.dataset.loading = 'true';

      getBookingUrl()
        .then((baseUrl) => {
          if (!this.isConnected) return;
          const finalUrl = withPlan(baseUrl, plan);
          this._anchor.setAttribute('href', finalUrl);
          this._anchor.removeAttribute('aria-disabled');
          this._anchor.dataset.loading = 'false';
        })
        .catch(() => {
          if (!this.isConnected) return;
          this._anchor.dataset.loading = 'error';
          this._anchor.setAttribute('aria-disabled', 'true');
          this._anchor.textContent = 'Booking unavailable';
        });
    }
  }

  if (!customElements.get('book-cta')) {
    customElements.define('book-cta', BookCTA);
  }
})();
