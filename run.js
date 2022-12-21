// package.json
/*

{
  "name": "lmao-ffs-tldr-just-read-the-code",
  "version": "1.0.0",
  "description": "",
  "main": "run.js",
  "scripts": {
    "run": "node run.js"
  },
  "author": "Mr K.",
  "license": "ISC",
  "dependencies": {
    "axios": "^1.2.1",
    "express": "^4.18.2",
    "rate-limiter-flexible": "^2.4.1"
  }
}

 */

// Create a small REST API with Express that receives in a URL.


const express = require('express');
const {RateLimiterMemory} = require("rate-limiter-flexible");
const axios = require("axios");
const app = express();
app.use(express.json());


const requestThroughProxy = async (proxy, targetUrl) => {
    try {
        const response = await axios.get(targetUrl, {
            proxy: {
                host: proxy.host,
                port: proxy.port
            },
            timeout: 2000
        });
        return response.data;
    } catch (error) {
        throw error;
    }
}


const runOverProxies = async (proxiesList, targetUrl) => {
    for (let i = 0; i < proxiesList.length; i++) {
        const proxy = proxiesList[i];
        const limiter = rateLimiters[i];
        console.log(`Making request to ${targetUrl} through proxy ${proxy.host}:${proxy.port}`);

        try {
            await limiter.consume(proxy.host);
            return await requestThroughProxy(proxy, targetUrl);
        } catch (err) {
            console.log(`Error making request to ${targetUrl} through proxy ${proxy.host}:${proxy.port}: ${err.message}`);
        }
    }
    throw new Error("Unable to make successful request using any of the provided proxies");
}

const proxies = [
    {host: '179.96.28.58', port: 80, limit: {points: 2, duration: 60}},
    {host: '198.49.68.80', port: 80, limit: {points: 2, duration: 60}},
    {host: '51.15.242.202', port: 8888, limit: {points: 2, duration: 60}},
];

const rateLimiters = proxies.map(proxy => {
    return new RateLimiterMemory(proxy.limit);
});

app.post('/', (req, res) => {
    const url = req.body.url;
    console.log(`👉 Received request for ${url}`);
    runOverProxies(proxies, url).then(response => {
        console.log(`🤑 Successfully responded for url=${url}`);
        res.send(response);
    }).catch(err => {
        console.log(`🤬️ Error responding for url=${url}: ${err.message}`);
        res.sendStatus(500);
    });

});

app.listen(3000, () => console.log('App listening on port 3000!'));
