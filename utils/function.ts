export function checkTorV2URL(url:string){
    // Check url is format: http(s)://[a-zA-Z0-9]{25,}.onion(*.?)
    let regex = new RegExp("^(http(s)?://)?[a-zA-Z0-9]{25,}.onion.*$");
    return regex.test(url);
}

export function generateRandomString(length:number) {
    let result = '';
    let characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let charactersLength = characters.length;
    for (let i = 0; i < length; i++) {
        result += characters.charAt(Math.floor(Math.random() * charactersLength));
    }
    return result;
}