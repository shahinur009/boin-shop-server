const express = require('express');
const cors = require('cors');
const app = express();
require('dotenv').config();
const { MongoClient, ServerApiVersion } = require('mongodb');
const port = process.env.PORT || 5000;

// Middleware
app.use(
    cors({
      origin: [
        "http://localhost:5173",
        "https://boin-shop.web.app",
        "https://boin-shop.firebaseapp.com",
      ],
      credentials: true,
    })
  );
  
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
        const usersCollections = client.db('Boin-shop-DB').collection('users');
        const productCollections = client.db('Boin-shop-DB').collection('products');

        // Get products from Database
        app.get('/products', async (req, res) => {
            try {
                const { page = 0, size = 9, sortBy, order, search, brand, category, minPrice, maxPrice } = req.query;

                const query = {};

                // Search by text
                if (search) {
                    query.$or = [
                        { productName: { $regex: search, $options: 'i' } },
                        { brandName: { $regex: search, $options: 'i' } },
                        { description: { $regex: search, $options: 'i' } },
                        { category: { $regex: search, $options: 'i' } }
                    ];
                }

                // Filter by brand
                if (brand) {
                    query.brandName = brand;
                }

                // Filter by category
                if (category) {
                    query.category = category;
                }

                // Filter by price range
                if (minPrice && maxPrice) {
                    query.price = { $gte: parseFloat(minPrice), $lte: parseFloat(maxPrice) };
                }
                // sort by price and date
                const options = { sort: {} };
                if (sortBy === 'price') {
                    options.sort.price = order === 'asc' ? 1 : -1;
                } else if (sortBy === 'date') {
                    options.sort.creationDateTime = order === 'asc' ? 1 : -1;
                }
                // pagination functions
                const skip = parseInt(page) * parseInt(size);
                const limit = parseInt(size);

                const result = await productCollections.find(query, options)
                    .skip(skip)
                    .limit(limit)
                    .toArray();
                res.send(result);
            } catch (error) {
                res.status(500).send({ error: error.message });
            }
        });

        // Get all brands
        app.get('/brands', async (req, res) => {
            try {
                const brands = await productCollections.distinct('brandName');
                res.send(brands);
            } catch (error) {
                res.status(500).send({ error: error.message });
            }
        });

        // Get all categories
        app.get('/categories', async (req, res) => {
            try {
                const categories = await productCollections.distinct('category');
                res.send(categories);
            } catch (error) {
                res.status(500).send({ error: error.message });
            }
        });

        // Get product count
        app.get('/productCount', async (req, res) => {
            try {
                const count = await productCollections.estimatedDocumentCount();
                res.send({ count });
            } catch (error) {
                res.status(500).send({ error: error.message });
            }
        });

        // Add a new user
        app.post('/users', async (req, res) => {
            try {
                const user = req.body;
                const query = { email: user?.email };
                const existingUser = await usersCollections.findOne(query);
                if (existingUser) {
                    return res.send({ message: 'User already exists', insertedId: null });
                }
                const result = await usersCollections.insertOne(user);
                res.send(result);
            } catch (error) {
                res.status(500).send({ error: error.message });
            }
        });
        console.log("Pinged your deployment. You successfully connected to MongoDB!");
    } finally {
        // console.error('Error connecting to MongoDB:', error);
    }
}
run().catch(console.dir);

app.get('/', (req, res) => {
    res.send('Boin server is running');
});

app.listen(port, () => {
    console.log(`Boin server is running on port ${port}`);
});
