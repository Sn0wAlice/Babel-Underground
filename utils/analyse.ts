import { generateRandomString } from "./function.ts"


export async function analyse(data:any, url:string, content:string) {

    if(url.endsWith('.onion')) {
        url = url + "/";
    }

    console.log(`[ANALYSE] parsing the url ${url}`)

    let pagedata:any = {}

    if(!data.url) {
        data.url = []
    }

    if(!data.allurl) {
        data.allurl = []
    }

    data.allurl.push(url);

    // Step 1: Check if the url is in the database
    let check = data.url.find((element:any) => element.url == url);
    if(check) {
        return data;
    }

    if(!data.logs) {
        data.logs = []
    }

    data.logs.push(`${Date.now()} - analyse the url ${url}`);

    content = content.replace(/(\r\n|\n|\r)/gm, "");

    // Step 2: Add the url to the database
    pagedata.url = url;
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

    // remove internal links that are in the allurl array
    for(let i = 0; i < pagedata.data.internal_links.length; i++) {
        if(data.allurl.includes(pagedata.data.internal_links[i])) {
            pagedata.data.internal_links.splice(i, 1);
            i--;
        }
    }

    data.url.push(pagedata);

    let internal_links = pagedata.data.internal_links;
    let external_links = pagedata.data.external_links;

    let out = { data:data, internal_links:internal_links, external_links:external_links }

    //console.log(out)

    return out;

}


////////// GET PAGE DATA //////////

function getpageTITLE(content:string) {
    let regex = /\<title\>(.*?)\<\/title/g;
    let result = content.match(regex);

    if(result) {
        return cleanString(result[0].split("<title>")[1].split("</title")[0]);
    }

    return "";
}

function getpageMETA(content:string) {
    let regex = /\<meta(.*?)>/g;
    let result = content.match(regex);
    return result;
}

function getpageIMAGES(content:string) {
    let regex = /\<img(.*?)\>/g;
    let result = content.match(regex);
    // get the url of the image
    let url:any[] = []
    if(result) {
        for(let i = 0; i < result.length; i++) {
            let regex = /src\=\"(.*?)\"/g;
            let result2 = result[i].match(regex);
            if(result2) {

                let alt = ""
                try { alt = result[i].split('alt="')[1].split('"')[0] } catch (error) {}
                let title = "";
                try { title = result[i].split('title="')[1].split('"')[0] } catch (error) {}

                url.push({
                    url: result2[0].split('"')[1],
                    alt: cleanString(alt),
                    title: cleanString(title)
                });
            } else {
                let regex = /src\=\'(.*?)\'/g;
                let result2 = result[i].match(regex);
                if(result2) {

                    let alt = ""
                    try { alt = result[i].split("alt='")[1].split("'")[0] } catch (error) {}
                    let title = "";
                    try { title = result[i].split("title='")[1].split("'")[0] } catch (error) {}

                    url.push({
                        url: result2[0].split("'")[1],
                        alt: cleanString(alt),
                        title: cleanString(title)
                    });
                }
            }
        }
    }
    return url;
}

function getpageVIDEOS(content:string) {
    let regex = /\<video(.*?)\<\/video>/g;
    let result = content.match(regex);
    // get the url of the video
    let url:any[] = []
    if(result) {
        for(let i = 0; i < result.length; i++) {
            let regex = /src\=\"(.*?)\"/g;
            let result2 = result[i].match(regex);
            if(result2) {
                for(let j = 0; j < result2.length; j++) {
                    let alt = ""
                    try { alt = result2[j].split('alt="')[1].split('"')[0] } catch (error) {}
                    let title = "";
                    try { title = result2[j].split('title="')[1].split('"')[0] } catch (error) {}
                    url.push({
                        url: result2[j].split('"')[1],
                        alt: cleanString(alt),
                        title: cleanString(title)
                    });
                }
            } else {
                let regex = /src=\'(.*?)\'/g;
                let result2 = result[i].match(regex);
                if(result2) {
                    for(let j = 0; j < result2.length; j++) {

                        let alt = ""
                        try { alt = result2[j].split("alt='")[1].split("'")[0] } catch (error) {}
                        let title = "";
                        try { title = result2[j].split("title='")[1].split("'")[0] } catch (error) {}

                        url.push({
                            url: result2[j].split("'")[1],
                            alt: cleanString(alt),
                            title: cleanString(title)
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
    let regex = /<a(.*?)<\/a>/g;
    let result = content.match(regex);

    let url:string[] = []
    if(result) {
        for(let i = 0; i < result.length; i++) {
            let regex = /href\=\"(.*?)\"/g;
            let result2 = result[i].match(regex);
            if(result2) {
                for(let j = 0; j < result2.length; j++) {
                    try { 
                        if(result2[j].includes(domain) || result2[j].split('"')[1].split('"')[0].startsWith('/')) {
                            try { url.push(result2[j].split('"')[1].split('"')[0]) } catch (error) {}
                        }
                    } catch (error) {}
                }
            } else {
                let regex = /href=\'(.*?)\'/g;
                let result2 = result[i].match(regex);
                if(result2) {
                    for(let j = 0; j < result2.length; j++) {
                        try {
                            if(result2[j].includes(domain) || result2[j].split('"')[1].split('"')[0].startsWith('/')) {
                                try { url.push(result2[j].split("'")[1].split("'")[0]) } catch (error) {}
                            }
                        } catch (error) {}
                    }
                }
            }
        }
    }

    // remove duplicates
    url = url.filter((v, i, a) => a.indexOf(v) === i);

    // add the domain to the url if it's not there
    for(let i = 0; i < url.length; i++) {
        if(url[i].startsWith('//') || url[i].startsWith('#')) {
            // remove the url from the array
            url.splice(i, 1);
            i--
        } else if(!url[i].startsWith('http')) {
            url[i] = "http://"+domain + url[i];
        } 
    }

    // remove spaces
    for(let i = 0; i < url.length; i++) {
        if(url[i].includes(' ')) {
            url[i] = url[i].split(' ')[0];
        }
    }


    return url
}

function getpageEXTERNAL_LINKS(content, domain){
    // return all the external links of the page: <a href="http(s)://domain.com/...">...</a>
    let regex = /\<a(.*?)\<\/a\>/g;
    let result = content.match(regex);
    let url:string[] = []
    if(result) {
        for(let i = 0; i < result.length; i++) {
            let regex = /href=\"(.*?)\"/g;
            let result2 = result[i].match(regex);
            if(result2) {
                for(let j = 0; j < result2.length; j++) {
                    try {
                        if(!result2[j].includes(domain) && !result2[j].split('"')[1].split('"')[0].startsWith('/')) {
                            try { url.push(result2[j].split('"')[1].split('"')[0]); } catch (error) {}
                        }
                    } catch (error) {}                    
                }
            } else {
                let regex = /href\=\'(.*?)\'/g;
                let result2 = result[i].match(regex);
                if(result2) {
                    for(let j = 0; j < result2.length; j++) {
                        try {
                            if(!result2[j].includes(domain) && !result2[j].split('"')[1].split('"')[0].startsWith('/')) {
                                try { url.push(result2[j].split("'")[1].split("'")[0]); } catch (error) {}
                            }
                        } catch (error) {}
                    }
                }
            }
        }
    }

    // remove duplicates
    url = url.filter((v, i, a) => a.indexOf(v) === i);

    // remove all domains that not contains .onion
    url = url.filter((v, i, a) => v.includes('.onion'));

    // remove spaces
    for(let i = 0; i < url.length; i++) {
        if(url[i].includes(' ')) {
            url[i] = url[i].split(' ')[0];
        }
    }

    return url;
}

function getpageEXTRACTED_TEXT(content) {
    let text:string[] = []
    // Get the paragraphs content
    let regex = /<p(.*?)>(.*?)<\/p>/g;
    let result = content.match(regex);
    if(result) {
        for(let i = 0; i < result.length; i++) {
            try { text.push(result[i].split('>')[1].split('<')[0]); } catch (error) {}
        }
    }

    // Get the h1,h2,h...h6 content
    regex = /<h(.*?)>(.*?)<\/h(.*?)>/g;
    result = content.match(regex);
    if(result) {
        for(let i = 0; i < result.length; i++) {
            try { text.push(result[i].split('>')[1].split('<')[0]); } catch (error) {}
        }
    }

    // Get the span content
    regex = /<span(.*?)>(.*?)<\/span>/g;
    result = content.match(regex);
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
    regex = /<a(.*?)>(.*?)<\/a>/g;
    result = content.match(regex);
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

    // remove all empty strings
    text = text.filter((a) => a !== '');

    text = cleanArray(text);
    
    return text;
}

////////// ANALYSE PAGE DATA //////////

function analyseISLOGINPAGE(content) {
    // Try to find if this page contains a login form
    let regex = /<form(.*?)<\/form>/g;
    let result = content.match(regex);
    if(result) {
        for(let i = 0; i < result.length; i++) {
            if(result[i].includes('pass')) {
                return true;
            }
        }
    }

    // else try to find if this page contains inputs with the name "pass" and ("login" or "user" or "email")
    regex = /<input(.*?)>/g;
    result = content.match(regex);
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
    let regex = /<h(.*?)>(.*?)<\/h(.*?)>/g
    let result = content.match(regex);
    if(result) {
        for(let i = 0; i < result.length; i++) {
            if(result[i].includes('error') || result[i].includes('400') || result[i].includes('401') 
            || result[i].includes('403') || result[i].includes('404') || result[i].includes('500') 
            || result[i].includes('501') || result[i].includes('502') || result[i].includes('503') 
            || result[i].includes('504') || result[i].includes('505')) {
                return true;
            }
        }
    }
    return false;
}

function analyseCONTAINSCONTACTFORM(content){
    // Try to find if this page contains a contact form
    let regex = /<form(.*?)<\/form>/g;
    let result = content.match(regex);
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
    let regex = /<input(.*?)>/g;
    let result = content.match(regex);
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
    let regex = /<p(.*?)>(.*?)<\/p>/g;
    let result = content.match(regex);
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
    let regex = /<p(.*?)>(.*?)<\/p>/g;
    let result = content.match(regex);
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



//////// UTILS FUNCTIONS ////////
function cleanArray(array:string[]){
    // Remove all empty strings
    array = array.filter((a) => a !== '');

    // Remove all space at the beginning and at the end of each string
    for(let i = 0; i < array.length; i++) {
        while(array[i].startsWith(' ')) {
            array[i] = array[i].substring(1);
        }
        while(array[i].endsWith(' ')) {
            array[i] = array[i].substring(0, array[i].length - 1);
        }
    }


    return array;
}

function cleanString(str:string){
    // Remove all space at the beginning and at the end of each string
    while(str.startsWith(' ')) {
        str = str.substring(1);
    }
    while(str.endsWith(' ')) {
        str = str.substring(0, str.length - 1);
    }
    return str;
}