const { default: puppeteer } = require("puppeteer");
const fs = require('fs');

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function takeScreenshot(page) {

    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight, { behavior: 'smooth' }));

    await page.waitForSelector('::-p-xpath(//*[@id="__next"]/div[1]/footer/div[2]/div/img[1])', { visible: true });

    await page.evaluate(() => window.scrollTo({ top: 0, left: 100, behavior: 'smooth' }));

    await page.evaluate(() => {
        const stickyHeader = document.querySelector('.StickyHeader_root__Rrhb8');
        if (stickyHeader) stickyHeader.remove();
    });

    await page.screenshot({
        path: 'screenshot.jpg',
        fullPage: true,
        type: 'jpeg',
    });
}

async function getData(page) {
    const price = await page.$eval('span[class*="Price_size_XL"]', el => {
        return el.childNodes[0].textContent.trim();
    }).catch(() => null);

    if (price === null) {
        console.log("Товар распродан");
        return
    }

    const priceOld = await page.$eval('span[class*="Price_size_XS"]', el => {
        return el.childNodes[0].textContent.trim();
    }).catch(() => null);

    const rating = await page.$eval('svg[class*="ActionsRow_starIcon"]', el => el.parentElement.innerText);

    const reviewCount = await page.$eval('svg[class*="ActionsRow_reviewsIcon"]', el => el.parentElement.innerText);

    fs.writeFileSync('product.txt', `
        price=${price}
        priceOld=${priceOld}
        rating=${rating}
        riviewCount=${parseFloat(reviewCount)}`
    );

}

async function changeRegion(page, region) {
    let regionSpan = await page.waitForSelector('button[class^="Region_region"]', { timeout: 10000 }).catch(() => null);
    if (regionSpan) {
        await regionSpan.click()
    }

    await page.waitForSelector('ul[role="list"]', { timeout: 20000 });

    const regionBtn = await page.waitForSelector(`::-p-xpath(//*[contains(text(), "${region}")])`, { timeout: 5000 }).catch(() => null);
    if (regionBtn != null) {
        await regionBtn.click();
    } else console.log('Введен неверный регион');
}

async function main() {

    const args = process.argv.slice(2)
    const url = args[0];
    const region = args[1];

    const browser = await puppeteer.launch({
        headless: true,
        defaultViewport: {
            width: 1080,
            height: 1024
        },
        args: [
            '--start-maximized',
            '--disable-web-security',
        ]
    });

    const page = await browser.newPage();

    const userAgent = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36';
    await page.setUserAgent(userAgent);

    await page.goto(url, {
        waitUntil: "networkidle2",

    });

    await wait(3000);

    const tooltipBtn = await page.waitForSelector('button[class^="Tooltip"]', { visible: true, timeout: 10000 }).catch(() => null);
    if (tooltipBtn) {
        await tooltipBtn.click();
    }

    const cookieAgreeBtn = await page.waitForSelector('div[class^="CookiesAlert_agreeButton"]', { timeout: 10000 }).catch(() => null);
    if (cookieAgreeBtn) {
        await cookieAgreeBtn.click();
    }
    await changeRegion(page, region);

    await wait(2000)

    await takeScreenshot(page);

    await wait(2000)

    await getData(page);

    await browser.close();
}

main()