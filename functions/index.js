const functions = require('firebase-functions');
const cors = require("cors")({
    origin: true
});

const cheerio = require('cheerio')
const getUrls = require('get-urls')
const fetch = require('node-fetch')
const puppeteer = require('puppeteer')

const scrapeMetatags = (text) => {
    const urls = Array.from(getUrls(text))
    const requests = urls.map(async url => {
        const res = await fetch(url)
        const html = await res.text()
        const $ = cheerio.load(html)

        const getMetatag = (name) => $(`meta[name=${name}]`).attr('content') || $(`meta[property="og:${name}"]`).attr('content') || $(`meta[property="twitter:${name}"]`).attr('content')

        return {
            url,
            title: $('title').first().text(),
            favicon: $('link[rel="shortcut icon"]').attr("href"),
            description: getMetatag('description'),
            image: getMetatag('image'),
            author: getMetatag('author')
        }
    })

    return Promise.all(requests)
}

const scrapeImage = async (username) => {
    const browser = await puppeteer.launch({
        headless: true
    })

    const page = await browser.newPage()

    await page.goto('https://www.instagram.com/accounts/login/')

    await page.screenshot({
        path: '1.png'
    })

    await page.type('[name=username]', 'hellothere123')

    await page.type('[name=password]', 'myPassword')
}

exports.scraper = functions.https.onRequest((request, response) => {
    cors(request, response, async () => {
        const body = request.body
        const data = await scrapeMetatags(body.text)

        response.send(data)
    })
})