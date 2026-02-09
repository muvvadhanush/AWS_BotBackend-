const dns = require('dns');
try { dns.setDefaultResultOrder('ipv4first'); } catch (e) { }

const scraperService = require("../services/scraperService");

async function test() {
    try {
        console.log("Testing scraper...");
        const result = await scraperService.ingestURL("http://example.com");
        console.log("Raw Length:", result.rawText.length);
        console.log("Cleaned:", result.cleanedText);
        console.log("Cleaned Length:", result.cleanedText.length);
    } catch (e) {
        console.error("Error:", e);
    }
}

test();
