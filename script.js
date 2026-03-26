document.addEventListener("DOMContentLoaded", () => {
  const shippingText = document.querySelector("#shipping-location-text");

  function getTodayLabel() {
    const hoje = new Date();
    return hoje.toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  }

  async function fetchJsonWithTimeout(url, timeoutMs = 3500) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const response = await fetch(url, { signal: controller.signal });
      if (!response.ok) {
        throw new Error(`Falha HTTP ${response.status}`);
      }
      return await response.json();
    } finally {
      clearTimeout(timeout);
    }
  }

  async function setShippingByLocation() {
    if (!shippingText) return;
    const today = getTodayLabel();
    shippingText.textContent = `Frete Grátis apenas hoje (${today})`;

    const providers = [
      {
        url: "https://ipwho.is/",
        parse: (data) => {
          if (data?.success === false) return null;
          return {
            city: data?.city || null,
            region: data?.region || null,
            countryCode: data?.country_code || null,
          };
        },
      },
      {
        url: "https://ipapi.co/json/",
        parse: (data) => ({
          city: data?.city || null,
          region: data?.region || null,
          countryCode: data?.country_code || null,
        }),
      },
      {
        url: "https://freeipapi.com/api/json",
        parse: (data) => ({
          city: data?.cityName || null,
          region: data?.regionName || null,
          countryCode: data?.countryCode || null,
        }),
      },
    ];

    for (const provider of providers) {
      try {
        const raw = await fetchJsonWithTimeout(provider.url);
        const parsed = provider.parse(raw);
        if (!parsed) continue;

        const { city, region, countryCode } = parsed;
        const isBrazil = countryCode === "BR" || !countryCode;

        if (isBrazil && region) {
          shippingText.textContent = `Frete Grátis apenas hoje (${today}) para ${region} e região`;
          return;
        }

        if (isBrazil && city) {
          shippingText.textContent = `Frete Grátis apenas hoje (${today}) para ${city} e região`;
          return;
        }
      } catch (_providerError) {
        // tenta o próximo provedor
      }
    }

    shippingText.textContent = `Frete Grátis apenas hoje (${today})`;
  }

  setShippingByLocation();

  const mainImage = document.querySelector("#main-product-image");
  const thumbs = document.querySelectorAll(".thumb");
  let currentIndex = 0;
  let autoSlideTimer = null;

  function activateThumbByIndex(index) {
    if (!mainImage || thumbs.length === 0) return;
    const safeIndex = (index + thumbs.length) % thumbs.length;
    const targetThumb = thumbs[safeIndex];
    const newSrc = targetThumb.getAttribute("data-src");
    if (!newSrc) return;

    mainImage.src = newSrc;
    thumbs.forEach((item) => item.classList.remove("is-active"));
    targetThumb.classList.add("is-active");
    currentIndex = safeIndex;
  }

  function startAutoSlide() {
    if (thumbs.length <= 1) return;
    if (autoSlideTimer) clearInterval(autoSlideTimer);

    autoSlideTimer = setInterval(() => {
      activateThumbByIndex(currentIndex + 1);
    }, 2000);
  }

  thumbs.forEach((thumb) => {
    thumb.addEventListener("click", () => {
      const clickedIndex = Array.from(thumbs).indexOf(thumb);
      activateThumbByIndex(clickedIndex);
      startAutoSlide();
    });
  });

  // Garante estado inicial correto e inicia rotação automática.
  activateThumbByIndex(0);
  startAutoSlide();

  const buyButtons = document.querySelectorAll(".btn-buy, .sticky-buy-bar .btn");
  buyButtons.forEach((button) => {
    button.addEventListener("click", () => {
      alert("Botao de compra pronto. Agora conecte ao seu checkout.");
    });
  });
});
