const express = require("express");
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const cors = require("cors");
const jwt = require("jsonwebtoken");
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

//verifyjwt
function verifyJWT(req, res, next){
  const authHeader = req.headers.authorization;
  if(!authHeader){
      return res.status(401).send({message: 'UnAuthorized access'});
  }
  const token = authHeader.split(' ')[1];
  jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, function (err, decoded) {
      if(err){
          return res.status(403).send({message: 'Forbiddedn Access'})
      }
      req.decoded = decoded;
      next();
  });
}

async function run() {
  try {
    await client.connect();
    const productCollection = client.db("superBycycle").collection("product");
    const orderCollection = client.db("superBycycle").collection("order");
    const userCollection = client.db("superBycycle").collection("users");
    const reviewCollection = client.db("superBycycle").collection("reviews");



    const verifyAdmin = async(req, res, next)=>{
      const requester= req.decoded.email;
      const requesterAccount = await userCollection.findOne({email: requester});
      if(requesterAccount.role === 'admin'){
          next();
      }
      else{
          res.status(403).send({message: 'Forbiden'});
      }
  }




    //get all product from databse
    app.get("/product", async (req, res) => {
      const query = {};
      const cursor = productCollection.find(query);
      const products = await cursor.toArray();
      res.send(products);
    });

    // get single product in the database
    app.get("/product/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: ObjectId(id) };
      const product = await productCollection.findOne(query);
      res.send(product);
    });

    //delete  api get method
    app.delete("/product/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: ObjectId(id) };
      const product = await productCollection.deleteOne(query);
      res.send(product);
    });

     // insert data client side and store data in database
     app.post('/product', async (req, res)=>{
      const newProduct = req.body;
      const result = await productCollection.insertOne(newProduct);
      res.send(result);
  });

    // add review section 
    app.post('/review', async (req, res)=>{
      const addReview = req.body;
      const newReview = await reviewCollection.insertOne(addReview);
      res.send(newReview);
    }),

    // Get Review section
    app.get('/review',async(req, res)=>{
      const query = {};
      const cursor = reviewCollection.find(query);
      const allReview = await cursor.toArray();
      res.send(allReview);
    })

    //order collection api post method
    app.post("/order", async (req, res) => {
      const order = req.body;
      const result = await orderCollection.insertOne(order);
      res.send(result);
    });

    //delete order api get method
    app.delete("/order/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: ObjectId(id) };
      const cursor = orderCollection.find(query);
      const result = await cursor.toArray();
      res.send(result);
    });

    // get order collection in the database (individual user)
    app.get("/order", async (req, res) => {
      const email = req.query.email;
      const query = { email: email };
      const cursor = orderCollection.find(query);
      const orders = await cursor.toArray();
      res.send(orders);
    });

    app.put("/user/:email", async (req, res) => {
      const email = req.params.email;
      const user = req.body;
      const filter = { email: email };
      const options = { upsert: true };
      const updatedoc = {
        $set: user,
      };
      const result = await userCollection.updateOne(filter, updatedoc, options);
      const token = jwt.sign(
        { email: email },
        process.env.ACCESS_TOKEN_SECRET,
        { expiresIn: "1h" }
      );
      res.send({ result, token });
    });



    app.put("/user/admin/:email", verifyJWT, verifyAdmin, async (req, res) => {
      const email = req.params.email;
      const filter = { email: email };
      const updatedoc = {
        $set: {role: 'admin'},
      };
      const result = await userCollection.updateOne(filter, updatedoc);
      res.send(result);
    });


    //all user api
    app.get('/user',verifyJWT, async (req, res) => {
      const users = await userCollection.find().toArray();
      res.send(users);
    });


    app.get('/admin/:email', async(req, res)=>{
      const email = req.params.email;
      const user = await userCollection.findOne({email: email});
      const isAdmin = user.role === 'admin';
      res.send({admin: isAdmin});
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
