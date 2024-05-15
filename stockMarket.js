


const http = require('http'); 
const fs = require('fs'); 
const path = require('path');  
const express = require("express");   
const app = express();   
const { Console } = require("console");  
const bodyParser = require("body-parser")  
app.set("views", path.resolve(__dirname, "templates"));  
app.set("view engine", "ejs");  
const portNumber = 5001; 
app.use(bodyParser.urlencoded({extended:false}))  
app.use(bodyParser.json()); 
app.use(express.static(path.join(__dirname, "templates")))  

require("dotenv").config({ path: path.resolve(__dirname, 'credentialsDontPost/.env') });
const { restClient } = require('@polygon.io/client-js');
// Set encoding for the standard input stream
process.stdin.setEncoding("utf8");
// Initialize the REST client with the API key from environment variables
const rest = restClient(process.env.POLY_API_KEY);
// Fetch the last trade information for AAPL
//MONGO STUFF
const databaseAndCollection = {db: process.env.MONGO_DB_NAME, collection:process.env.MONGO_COLLECTION};
/****** DO NOT MODIFY FROM THIS POINT ONE ******/
const { MongoClient, ServerApiVersion } = require('mongodb');
const uri = process.env.MONGO_CONNECTION_STRING;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });
process.stdin.on("readable", function () {  
const dataInput = process.stdin.read(); 
if (dataInput !== null) { 
    const input = dataInput.toString().trim();  
    if (input === "stop") { 
        process.stdout.write("Shutting down the server\n"); 
        process.exit(0); 
    } 
} 
}); 



app.listen(portNumber, () => { 
    console.log(`Server is running at http://localhost:${portNumber}`); 
    console.log("Type stop to shutdown the server: "); 
}); 

app.get("/", (request, response) => {  
    response.render("index"); 
});

app.get("/watch", (request, response) => {  
    const {name, ticker, date} = request.query;

    response.render("watch"); 
});
app.post("/processWatchlist", async (request,response)=>{
    const {name, ticker, date} = request.body;
    let open,close,high,low;
    console.log(name.trim());
    console.log(ticker);
    console.log(date);
    rest.stocks.dailyOpenClose(ticker.trim(),date.trim(),true).then((data)=> {
        open = data.open;
        close = data.close;
        high = data.high;
        low = data.low;
        console.log(data);
    }).catch(e => {
        response.send('Invalid Data');
    });

    const db = {name:name, ticker:ticker};
    try {
        await client.connect();
       
        /* Inserting one movie */
        
        await insertTicker(client, databaseAndCollection, db);



    } catch (e) {
        console.error(e);
    } finally {
        await client.close();
    }
    async function insertTicker(client, databaseAndCollection, newApplicant) {
        const result = await client.db(databaseAndCollection.db).collection(databaseAndCollection.collection).insertOne(newApplicant);
    
        console.log(`New entry created with id ${result.insertedId}`);
    }
    const variables = {open,close,high,low};
    response.render("processWatchlist",variables);
});

app.get("/watchlist", (request, response) => {  
    const {user} = request.query;

    response.render("watchlist"); 
});

app.post("/processList", async(request,response)=>{
    const {user} = request.body;
    let html='';
    try {
        await client.connect();
            
                await lookUpMany(client,databaseAndCollection,user);
    } catch (e) {
        console.error(e);
    } finally {
        await client.close();
    }
    
    async function lookUpMany(client, databaseAndCollection, user) {
        let filter = {name:user};
        const cursor = client.db(databaseAndCollection.db)
        .collection(databaseAndCollection.collection)
        .find(filter);
         html= `${user}: `
        // Some Additional comparison query operators: $eq, $gt, $lt, $lte, $ne (not equal)
        // Full listing at https://www.mongodb.com/docs/manual/reference/operator/query-comparison/
        const result = await cursor.toArray();
        console.log(result);
        result.forEach(data => {
            html +=` ${data.ticker}`
        });
        
        console.log(result);
    }

    const outputs = {output:html};
    response.render("processList",outputs);
});

app.get("/clearDB",async (request,response)=>{
    try {

        await client.connect();
        let filter = {};
       const result = await deleteOne(client, databaseAndCollection, filter);
       variables.deleted = result.deletedCount;
    } catch (e) {
        console.error(e);
    } finally {
        await client.close();
    }

    async function deleteOne(client, databaseAndCollection, filter) {
                
        const result = await client.db(databaseAndCollection.db)
                       .collection(databaseAndCollection.collection)
                       .deleteMany(filter);
                       variables.deleted = result.deletedCount;
         console.log("inside"+variables.deleted);
         console.log(`Documents deleted ${result.deletedCount}`);
         return result;
    }
    response.render('clearDB');
});

