$( () => {
    $('#userInfo').attr("href", "user.html?username=" + username);
});

fetch('https://dummyjson.com/quotes/random')
    .then(response => response.json())
    .then(data => {
        document.getElementById('quoteBox').innerHTML = 
        `<span style="font-weight: bold; font-style: normal;">Твоя цитата на сегодня: </span>"${data.quote}" — ${data.author}`;
    })
    .catch(error => {
        console.error('Ошибка при загрузке цитаты:', error);
    });

fetch('https://ipapi.co/json/')
    .then(response => response.json())
    .then(location => {
    const flagEmoji = location.country_code
        ? String.fromCodePoint(...[...location.country_code].map(c => 127397 + c.charCodeAt()))
        : '';
    document.getElementById('countryInfo').textContent = `Привет из ${location.city}, ${location.country_name} ${flagEmoji}`;
    });
