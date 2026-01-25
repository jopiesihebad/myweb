// Pricing toggle logic (simple & safe)

const billingRadios = document.querySelectorAll('input[name="billing"]');
const priceAmount = document.getElementById('price-amount');
const pricePeriod = document.getElementById('price-period');

// GANTI ANGKA DI SINI
const PRICE_MONTHLY = 'Rp. xxx.xxx';
const PRICE_YEARLY  = 'Rp. xxx.xxx';

billingRadios.forEach(radio => {
  radio.addEventListener('change', () => {
    if (radio.value === 'yearly') {
      priceAmount.textContent = PRICE_YEARLY;
      pricePeriod.textContent = '/ tahun';
    } else {
      priceAmount.textContent = PRICE_MONTHLY;
      pricePeriod.textContent = '/ bulan';
    }
  });
});
