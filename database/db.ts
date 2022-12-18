/**
 * This is a database manager. This class is a singleton.
 */

export class database {
    private static instance: database;

    private waitingDatabase:string[] = [];
    private cachedDatabase:string[] = [];


    private constructor() {
        Deno.mkdirSync("./database/data/website", { recursive: true });
        let letter = "abcdefghijklmnopqrstuvwxyz";
        for (let i = 0; i < letter.length; i++) {
            Deno.mkdirSync("./database/data/website/" + letter[i], { recursive: true });
        }
        try {
            this.waitingDatabase = JSON.parse(Deno.readTextFileSync("./database/data/waitingDatabase.json"));
        } catch (error) {}

        setInterval(() => {
            Deno.writeTextFileSync("./database/data/waitingDatabase.json", JSON.stringify(this.waitingDatabase));
        }, 60000);
    }
    public static getInstance(): database {
        if (!database.instance) {
            database.instance = new database();
        }
        return database.instance;
    }


    public getWaitingUrl():string {
        if(this.waitingDatabase.length == 0) {
            this.waitingDatabase.push("http://juhanurmihxlp77nkq76byazcldy2hlmovfu2epvl5ankdibsot4csyd.onion/");
        }
        // Get the first url in the waiting list
        let url = this.waitingDatabase[0];
        // Remove the first url in the waiting list
        this.waitingDatabase.splice(0, 1);
        // Add the url to the cached list
        this.cachedDatabase.push(url);
        return url;
    }

    public deletefromcachedDatabase(url:string) {
        let index = this.cachedDatabase.indexOf(url);
        if(index != -1) {
            this.cachedDatabase.splice(index, 1);
        }
    }

    public getwebsiteData(domain:string) {
        //get the first letter of the domain
        let letter = domain[0];
        //get the path of the domain
        let path = './database/data/website/' + letter + '/' + domain + '/main.json';
        //check if the file exists
        try {
            Deno.statSync(path);
        } catch (error) {
            return null
        }
        //read the file
        let data = Deno.readTextFileSync(path);
        //return the data
        return JSON.parse(data);
    }

    public addWaitingUrl(url:string) {
        if(!this.cachedDatabase.includes(url)) {
            this.waitingDatabase.push(url);
        }
    }

    public checkDomainInDatabase(domain:string) {
        //get the first letter of the domain
        let letter = domain[0];
        //get the path of the domain
        let path = './database/data/website/' + letter + '/' + domain + '/main.json';
        //check if the file exists
        try {
            Deno.statSync(path);
            JSON.parse(Deno.readTextFileSync(path));
            return true;
        } catch (error) {
            return false;
        }
    }

    public addWebsiteData(domain:string, data:any) {
        //get the first letter of the domain
        let letter = domain[0];
        // Create the folder
        Deno.mkdirSync("./database/data/website/" + letter + "/" + domain, { recursive: true });
        //get the path of the domain
        let path = './database/data/website/' + letter + '/' + domain + '/main.json';
        //write the file
        Deno.writeTextFileSync(path, JSON.stringify(data));
    }

}