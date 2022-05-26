const express = require("express");
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const cors = require("cors");
const jwt = require('jsonwebtoken');
const res = require("express/lib/response");
require("dotenv").config();
const app = express();
const port = process.env.PORT || 5000;

// middleware
app.use(cors());
app.use(express.json());

// connect database

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.f2llc.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  serverApi: ServerApiVersion.v1,
});

async function run() {
  try {
    await client.connect();
    const productCollection = client.db("superBycycle").collection("product");
    const orderCollection = client.db("superBycycle").collection('order');
    const userCollection = client.db("superBycycle").collection('users');

    //AUTH
    

    //get all product from databse
    app.get("/product", async (req, res) => {
      const query = {};
      const cursor = productCollection.find(query);
      const products = await cursor.toArray();
      res.send(products);
    });

    // get single product in the database
    app.get('/product/:id', async(req, res)=>{
        const id = req.params.id;
        const query = {_id: ObjectId(id)};
        const product = await productCollection.findOne(query);
        res.send(product);
        
    });

    //order collection api post method
    app.post('/order', async (req, res)=>{
        const order = req.body;
        const result = await orderCollection.insertOne(order);
        res.send(result);
    })

    //delete order api get method
    app.delete('/order/:id', async (req, res)=>{
      const id = req.params.id;
      const query = {_id: ObjectId(id)};
      const cursor = orderCollection.find(query);
      const result = await cursor.toArray();
      res.send(result);
  })

    // get order collection in the database
    app.get('/order', async(req, res)=>{
        const email = req.query.email;
        const query = {email: email};
        const cursor = orderCollection.find(query);
        const orders = await cursor.toArray();
        res.send(orders);  
    });

    app.put('/user/:email', async(req, res)=>{
      const email = req.params.email;
      const user =req.body;
      const filter = {email: email};
      const options = {upsert: true};
      const updatedoc = {
        $set: user,
      };
      const result = await userCollection.updateOne(filter, updatedoc, options);
      const token = jwt.sign({email: email}, process.env.ACCESS_TOKEN_SECRET, {expiresIn: '1h'} )
      res.send({result, token});
    });

    //all user api
    app.get('/user', async(req, res)=>{
      const users = await userCollection.find().toArray();
      res.send(users);
    })
    


  } finally {
    // something write
  }
}
run().catch(console.dir);

app.get("/", (req, res) => {
  res.send("Wellcome to our Super Bycycle server");
});

app.listen(port, () => {
  console.log("Listening to the PORT: ", port);
});
