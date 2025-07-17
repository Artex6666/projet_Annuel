(async () => {
  const url = "https://nominatim.openstreetmap.org/search?format=json&q=Toulouse&limit=1&addressdetails=1";
  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'EcoDeli/1.0 (https://ecodeli.com; contact@ecodeli.com)'
      }
    });
    const data = await response.json();
    console.log('Réponse:', data);
  } catch (e) {
    console.error('Erreur fetch:', e);
  }
})(); 