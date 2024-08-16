const express = require('express');
const cors = require('cors');
const app = express();
require('dotenv').config();
const { MongoClient, ServerApiVersion } = require('mongodb');
const port = process.env.PORT || 5000;


// Middleware
app.use(cors());
app.use(express.json());



const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.6ypdnj9.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
    serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
    }
});

async function run() {
    try {
        const usersCollections = client.db('Boin-shop-DB').collection('users')
        const productCollections = client.db('Boin-shop-DB').collection('products')

        // get products from Database
        app.get('/products', async (req, res) => {
            const { page, size, sortBy, order } = req.query;

            const query = {};
            const options = {
                sort: {}
            };

            if (sortBy === 'price') {
                options.sort.price = order === 'asc' ? 1 : -1;
            } else if (sortBy === 'date') {
                options.sort.creationDateTime = order === 'asc' ? 1 : -1;
            }

            const skip = parseInt(page) * parseInt(size);
            const limit = parseInt(size);

            const result = await productCollections.find(query, options)
                .skip(skip)
                .limit(limit)
                .toArray();
            res.send(result);
        });


        // app.get('/products', async (req, res) => {
        //     // console.log('Pagination', req.query)
        //     const filter = req.query;
        //     const query = {};
        //     const options = {
        //         sort: {
        //             price: filter.sort === 'asc' ? 1 : -1,
        //         }
        //     };
        //     const page = parseInt(req.query.page)
        //     const size = parseInt(req.query.size)
        //     const result = await productCollections.find(query, options)
        //         .skip(page * size)
        //         .limit(size)
        //         .toArray();
        //     res.send(result)
        // })
        // Pagination here
        app.get('/productCount', async (req, res) => {
            const count = await productCollections.estimatedDocumentCount();
            res.send({ count });
        })

        // user related info in Database
        app.post('/users', async (req, res) => {
            const user = req.body;
            const query = { email: user?.email }
            const existingUser = await usersCollections.findOne(query);
            if (existingUser) {
                return res.send({ message: 'user already exist', insertedId: null })
            }
            const result = await usersCollections.insertOne(user);
            res.send(result);
        })


        await client.db("admin").command({ ping: 1 });
        console.log("Pinged your deployment. You successfully connected to MongoDB!");
    } finally {

    }
}
run().catch(console.dir);



app.get('/', (req, res) => {
    res.send('boin server is running')
})

app.listen(port, () => {
    console.log(`Boin server is running on port ${port}`)
})