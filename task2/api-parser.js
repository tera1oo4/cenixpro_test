const axios = require('axios');
const fs = require('fs');


//https://www.vprok.ru/web/api/v1/catalog/category/7382?sort=popularity_desc&limit=30&page=2

async function fetchData() {
    try {
        const args = process.argv.slice(2);
        let url = args[0];

        const response = await axios.get(url, {
            headers: {
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7',
                'Accept-Language': 'ru-RU,ru;q=0.9,en-US;q=0.8,en;q=0.7',
                'Cache-Control': 'no-cache',
                'Connection': 'keep-alive',
                'Pragma': 'no-cache',
                'Referer': 'https://www.google.com/',
                'Sec-Fetch-Dest': 'document',
                'Sec-Fetch-Mode': 'navigate',
                'Sec-Fetch-Site': 'same-origin',
                'Sec-Fetch-User': '?1',
                'Upgrade-Insecure-Requests': '1',
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/133.0.0.0 Safari/537.36'
            },
        });

        const matchData = response.data.match(/<script id="__NEXT_DATA__"[^>]*>(.*?)<\/script>/s);
        const data = JSON.parse(matchData[1]);

        let products = data.props.pageProps.initialStore.catalogPage.products;

        fs.truncateSync('products-api.txt',)

        products.forEach(item => {
            fs.appendFileSync('products-api.txt', `
            Название товара: ${item.name}
            Ссылка на страницу товара: https://www.vprok.ru${item.url},
            Рейтинг: ${item.rating}
            Количество отзывов: ${item.reviews}
            Цена: ${item.price}
            Акционная цена: ${item.oldPrice}
            Размер скидки: ${item.discount}
            Размер скидки в процентах: ${item.discountPercent}%
            --------------------------------------   `)
        });
    } catch (error) {
        console.error('Ошибка полученных данных:', error.data);
        console.error('Ошибка:', error.status);
        console.log(error);
    }
}

fetchData();