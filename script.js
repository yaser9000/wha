const excluded = ['USDT', 'BUSD', 'TUSD', 'USDC'];

async function fetchTopCoins() {
  const container = document.getElementById('coins');
  container.innerHTML = "جارٍ التحميل...";
  
  const res = await fetch("https://api.binance.com/api/v3/ticker/24hr");
  const allCoins = await res.json();

  const topCoins = allCoins
    .filter(c => !excluded.some(stable => c.symbol.endsWith(stable)))
    .sort((a, b) => parseFloat(b.quoteVolume) - parseFloat(a.quoteVolume))
    .slice(0, 60);

  let results = [];

  for (let coin of topCoins) {
    const symbol = coin.symbol;
    const priceChange = parseFloat(coin.priceChangePercent);

    try {
      const klinesRes = await fetch(`https://api.binance.com/api/v3/klines?symbol=${symbol}&interval=1h&limit=8`);
      const klines = await klinesRes.json();

      if (!Array.isArray(klines) || klines.length < 8) continue;

      const currentCandle = klines[7];
      const prevVolumes = klines.slice(0, 7).map(k => parseFloat(k[5]));
      const avgVolume = prevVolumes.reduce((a, b) => a + b, 0) / 7;
      const currentVolume = parseFloat(currentCandle[5]);
      const volumeJump = ((currentVolume - avgVolume) / avgVolume) * 100;

      const open = parseFloat(currentCandle[1]);
      const close = parseFloat(currentCandle[4]);
      const change = ((close - open) / open) * 100;

      if (change > 5 && volumeJump > 150) {
        results.push({
          symbol,
          change: change.toFixed(2),
          volumeJump: volumeJump.toFixed(1),
          volume: currentVolume.toLocaleString()
        });
      }
    } catch (e) {
      continue;
    }
  }

  container.innerHTML = '';

  if (results.length === 0) {
    container.innerHTML = "<p>لا توجد عملات تحقق الشروط الآن.</p>";
    return;
  }

  for (let coin of results) {
    const card = document.createElement('div');
    card.className = 'card';
    card.innerHTML = `
      <h2>${coin.symbol}</h2>
      <div class="metric">الارتفاع الساعي: <strong class="green">+${coin.change}%</strong></div>
      <div class="metric">زيادة السيولة: <strong>${coin.volumeJump}%</strong></div>
      <div class="metric">الحجم: ${coin.volume}</div>
    `;
    container.appendChild(card);
  }
}
