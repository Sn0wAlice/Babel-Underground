import { generateRandomString } from "./function.ts"


export async function analyse(data:any, url:string, content:string) {
    console.log(`[ANALYSE] parsing the url ${url}`)

    let pagedata:any = {}

    if(!data.url) {
        data.url = []
    }

    // Step 1: Check if the url is in the database
    let check = data.url.find((element:any) => element.url == url);
    if(check) {
        return data;
    }

    if(!data.logs) {
        data.logs = []
    }

    // Step 2: Add the url to the database
    pagedata.url = url.split('.onion')[1] == "" ? url : "/";
    pagedata.id = generateRandomString(10);
    pagedata.data = {
        title: getpageTITLE(content),
        meta: getpageMETA(content),
        images: getpageIMAGES(content),
        videos: getpageVIDEOS(content),
        internal_links: getpageINTERNAL_LINKS(content, data.domain),
        external_links: getpageEXTERNAL_LINKS(content, data.domain),
        extracted_text: getpageEXTRACTED_TEXT(content)
    }
    pagedata.analyse = {
        isloginpage: analyseISLOGINPAGE(content),
        iserrorpage: analyseISERRORPAGE(content),
        containcontactform: analyseCONTAINSCONTACTFORM(content),
        containssearchform: analyseCONTAINSSEARCHFORM(content),
        containfreecontent: analyseCONTAINSFREECONTENT(content),
        containpremiumcontent: analyseCONTAINSPREMIUMCONTENT(content),
        containAdultcontent: analyseCONTAINSADULTCONTENT(pagedata.data.extracted_text),
    }

    data.url.push(pagedata);

    let internal_links = pagedata.data.internal_links;
    let external_links = pagedata.data.external_links;

    return { data, internal_links, external_links}

}


////////// GET PAGE DATA //////////

function getpageTITLE(content:string) {
    let regex = new RegExp("title>(.*?)</title");
    let result = regex.exec(content);
    return result;
}

function getpageMETA(content:string) {
    let regex = new RegExp("<meta(.*?)>");
    let result = regex.exec(content);
    return result;
}

function getpageIMAGES(content:string) {
    let regex = new RegExp("<img(.*?)>");
    let result = regex.exec(content);
    // get the url of the image
    let url:any[] = []
    if(result) {
        for(let i = 0; i < result.length; i++) {
            let regex = new RegExp("src=\"(.*?)\"");
            let result2 = regex.exec(result[i]);
            if(result2) {

                let alt = ""
                try { alt = result[1].split('alt="')[1].split('"')[0] } catch (error) {}
                let title = "";
                try { title = result[1].split('title="')[1].split('"')[0] } catch (error) {}

                url.push({
                    url: result[1].split('"')[1],
                    alt: alt,
                    title: title
                });
            } else {
                let regex = new RegExp("src=\'(.*?)\'");
                let result2 = regex.exec(result[i]);
                if(result2) {

                    let alt = ""
                    try { alt = result[1].split("alt='")[1].split("'")[0] } catch (error) {}
                    let title = "";
                    try { title = result[1].split("title='")[1].split("'")[0] } catch (error) {}

                    url.push({
                        url: result[1].split("'")[1],
                        alt: alt,
                        title: title
                    });
                }
            }
        }
    }
    return url;
}

function getpageVIDEOS(content:string) {
    let regex = new RegExp("<video(.*?)</video>");
    let result = regex.exec(content);
    // get the url of the video
    let url:any[] = []
    if(result) {
        for(let i = 0; i < result.length; i++) {
            let regex = new RegExp("src=\"(.*?)\"");
            let result2 = regex.exec(result[i]);
            if(result2) {
                for(let j = 0; j < result2.length; j++) {
                    let alt = ""
                    try { alt = result2[j].split('alt="')[1].split('"')[0] } catch (error) {}
                    let title = "";
                    try { title = result2[j].split('title="')[1].split('"')[0] } catch (error) {}
                    url.push({
                        url: result2[j].split('"')[1],
                        alt: alt,
                        title: title
                    });
                }
            } else {
                let regex = new RegExp("src=\'(.*?)\'");
                let result2 = regex.exec(result[i]);
                if(result2) {
                    for(let j = 0; j < result2.length; j++) {

                        let alt = ""
                        try { alt = result2[j].split("alt='")[1].split("'")[0] } catch (error) {}
                        let title = "";
                        try { title = result2[j].split("title='")[1].split("'")[0] } catch (error) {}

                        url.push({
                            url: result2[j].split("'")[1],
                            alt: alt,
                            title: title
                        });
                    }
                }
            }
        }
    }
    return url;
}

function getpageINTERNAL_LINKS(content, domain){
    // return all the internal links of the page: <a href="http(s)://domain.com/...">...</a>
    let regex = new RegExp("<a(.*?)</a>");
    let result = regex.exec(content);
    let url:string[] = []
    if(result) {
        for(let i = 0; i < result.length; i++) {
            let regex = new RegExp("href=\"(.*?)\"");
            let result2 = regex.exec(result[i]);
            if(result2) {
                for(let j = 0; j < result2.length; j++) {
                    if(result2[j].includes(domain) || result2[j].startsWith('/')) {
                        try { url.push(result2[j].split('"')[1].split('"')[0]) } catch (error) {}
                    }
                }
            } else {
                let regex = new RegExp("href=\'(.*?)\'");
                let result2 = regex.exec(result[i]);
                if(result2) {
                    for(let j = 0; j < result2.length; j++) {
                        if(result2[j].includes(domain) || result2[j].startsWith('/')) {
                            try { url.push(result2[j].split("'")[1].split("'")[0]) } catch (error) {}
                        }
                    }
                }
            }
        }
    }
    return url;
}

function getpageEXTERNAL_LINKS(content, domain){
    // return all the external links of the page: <a href="http(s)://domain.com/...">...</a>
    let regex = new RegExp("<a(.*?)</a>");
    let result = regex.exec(content);
    let url:string[] = []
    if(result) {
        for(let i = 0; i < result.length; i++) {
            let regex = new RegExp("href=\"(.*?)\"");
            let result2 = regex.exec(result[i]);
            if(result2) {
                for(let j = 0; j < result2.length; j++) {
                    if(!result2[j].includes(domain)) {
                        try { url.push(result2[j].split('"')[1].split('"')[0]); } catch (error) {}
                    }
                }
            } else {
                let regex = new RegExp("href=\'(.*?)\'");
                let result2 = regex.exec(result[i]);
                if(result2) {
                    for(let j = 0; j < result2.length; j++) {
                        if(!result2[j].includes(domain)) {
                            try { url.push(result2[j].split("'")[1].split("'")[0]); } catch (error) {}
                        }
                    }
                }
            }
        }
    }
    return url;
}

function getpageEXTRACTED_TEXT(content) {
    let text:string[] = []
    // Get the paragraphs content
    let regex = new RegExp("<p(.*?)>(.*?)</p>");
    let result = regex.exec(content);
    if(result) {
        for(let i = 0; i < result.length; i++) {
            try { text.push(result[i].split('>')[1].split('<')[0]); } catch (error) {}
        }
    }

    // Get the h1,h2,h...h6 content
    regex = new RegExp("<h(.*?)>(.*?)</h(.*?)>");
    result = regex.exec(content);
    if(result) {
        for(let i = 0; i < result.length; i++) {
            try { text.push(result[i].split('>')[1].split('<')[0]); } catch (error) {}
        }
    }

    // Get the span content
    regex = new RegExp("<span(.*?)>(.*?)</span>");
    result = regex.exec(content);
    if(result) {
        for(let i = 0; i < result.length; i++) {
            try {   
                let k = result[i].split('>')[1].split('<')[0]
                if(!k.includes('<')) {
                    text.push(k);
                }
            } catch (error) {}
        }
    }

    // get the links content
    regex = new RegExp("<a(.*?)>(.*?)</a>");
    result = regex.exec(content);
    if(result) {
        for(let i = 0; i < result.length; i++) {
            try {   
                let k = result[i].split('>')[1].split('<')[0]
                if(!k.includes('<')) {
                    text.push(k);
                }
            } catch (error) {}
        }
    }

    
    return text;
}

////////// ANALYSE PAGE DATA //////////

function analyseISLOGINPAGE(content) {
    // Try to find if this page contains a login form
    let regex = new RegExp("<form(.*?)</form>");
    let result = regex.exec(content);
    if(result) {
        for(let i = 0; i < result.length; i++) {
            if(result[i].includes('pass')) {
                return true;
            }
        }
    }

    // else try to find if this page contains inputs with the name "pass" and ("login" or "user" or "email")
    regex = new RegExp("<input(.*?)>");
    result = regex.exec(content);
    let pass = false;
    let user_and_email = false;
    if(result) {
        for(let i = 0; i < result.length; i++) {
            if(result[i].includes('pass')) {
                pass = true;
            }
            if(result[i].includes('login') || result[i].includes('user') || result[i].includes('mail')) {
                user_and_email = true;
            }
        }
    }
    if(pass && user_and_email) {
        return true;
    }

    return false;
}

function analyseISERRORPAGE(content){
    //Try to find if this page contains a 40* or 50* error
    let regex = new RegExp("<h(.*?)>(.*?)</h(.*?)>");
    let result = regex.exec(content);
    if(result) {
        for(let i = 0; i < result.length; i++) {
            if(result[i].includes('40') || result[i].includes('50')) {
                return true;
            }
        }
    }
    return false;
}

function analyseCONTAINSCONTACTFORM(content){
    // Try to find if this page contains a contact form
    let regex = new RegExp("<form(.*?)</form>");
    let result = regex.exec(content);
    if(result) {
        for(let i = 0; i < result.length; i++) {
            if(result[i].includes('email') || result[i].includes('mail') || result[i].includes('contact') || result[i].includes('message')) {
                return true;
            }
        }
    }
    return false;

}

function analyseCONTAINSSEARCHFORM(content){
    // Try to find if this page contains a search form with a search input
    let regex = new RegExp("<input(.*?)>");
    let result = regex.exec(content);
    if(result) {
        for(let i = 0; i < result.length; i++) {
            if(result[i].includes('search') || result[i].includes('query') || result[i].includes('q') || result[i].includes('s') || result[i].includes('find')) {
                return true;
            }
        }
    }
}

function analyseCONTAINSFREECONTENT(content){
    // Try to find if this page contains a free content
    let regex = new RegExp("<p(.*?)>(.*?)</p>");
    let result = regex.exec(content);
    if(result) {
        for(let i = 0; i < result.length; i++) {
            if(result[i].includes('free') || result[i].includes('gratis') || result[i].includes('gratuit') || result[i].includes('gratuite') || result[i].includes('$0')) {
                return true;
            }
        }
    }
    return false;
}

function analyseCONTAINSPREMIUMCONTENT(content){
    // Try to find if this page contains a premium content
    let regex = new RegExp("<p(.*?)>(.*?)</p>");
    let result = regex.exec(content);
    if(result) {
        for(let i = 0; i < result.length; i++) {
            if(result[i].includes('premium') || result[i].includes('payant') || result[i].includes('vip') || result[i].includes('$')) {
                return true;
            }
        }
    }
    return false;
}

function analyseCONTAINSADULTCONTENT(text){
    // Try to find if this page contains a adult content (porn)

    let k = text.join(' ');
    if(k.includes("porn") || k.includes("sex")){
        return true;
    }

    return false;

}



