import { Tor } from "https://deno.land/x/tor/mod.ts"
const tor = new Tor()

import { analyse } from "./utils/analyse.ts"
import { compare  } from "./utils/compare.ts"

import { database } from "./database/db.ts"
const db = database.getInstance();

// Step 1: Start tor in background
await tor.start()

// Step 2: Start the tor scrawler
async function main() {
    // Get the first url in the waiting list
    let url = db.getWaitingUrl();
    // Purge url and only keep the domain
    let domain = url.replace("http://", "").replace("https://", "").split("/")[0];

    console.log(`[SCRAWLER] Start crawling ${domain}...`)

    let olddata:any = {}
    // Check if the domain is already in the database
    if(db.checkDomainInDatabase(domain)) {
        console.log(`[INFO] ${domain} is already in the database.`)
        olddata = db.getwebsiteData(domain);
    }

    // Start the infinite scrawler loop
    let data = {
        domain: domain,
        asrobotstxt: null,
        url: []
    }
    let pendindUrls = ["http://"+domain];
    while(pendindUrls.length > 0) {
        // Step 1 get the first url in the pending list
        let url = pendindUrls[0];
        // Step 2 remove the first url in the pending list
        pendindUrls.splice(0, 1);
        //Step 3 get the content of the url
        let content = await tor.get(url);
        // Step 4 analyse the content
        let n = await analyse(data, url, content);

        console.log(n)

        let data2 = n.data;
        let internal_link = n.internal_links;
        let external_links = n.external_links;

        console.log(internal_link)

        // get the new urls
        
        for(let i = 0; i < internal_link.length; i++) {
            if(!pendindUrls.includes(internal_link[i]) && internal_link[i] != undefined && internal_link[i] != null) {
                pendindUrls.push(internal_link[i]);
            }
        }

        for(let i = 0; i < external_links.length; i++) {
            db.addWaitingUrl(domain, external_links[i]);
        }

        // launch a comparison between the old data and the new data of the url
        if(olddata.domain != undefined && olddata.domain != null) {
            await compare(olddata, data2);
        }

        // Save the data2 in the data
        data = data2;
        await db.addWebsiteData(domain, data);
    }
    db.deletefromcachedDatabase(url)
    console.log(`[SCRAWLER] Finished crawling ${domain}...`)
}

// Step 3: Start the infinite loop
await main();