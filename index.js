const express = require('express');
const cors = require('cors');
require('dotenv').config();
const cookieParser = require('cookie-parser')
const jwt = require('jsonwebtoken');
const { MongoClient, ServerApiVersion ,ObjectId} = require('mongodb');
const app = express();
const port = process.env.PORT || 5000;

app.use(cors({
    origin: 'http://localhost:5173',
    credentials: true
}));
app.use(express.json());
app.use(cookieParser())


const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.yajxl17.mongodb.net/techlink?retryWrites=true&w=majority&appName=Cluster0`;



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
        // Connect the client to the server	(optional starting in v4.7)
        await client.connect();

        // Send a ping to confirm a successful connection
        await client.db("admin").command({ ping: 1 });
        console.log("Pinged your deployment. You successfully connected to MongoDB!");
    } finally {
        // Ensures that the client will close when you finish/error
        // await client.close();
    }
}
run().catch(console.dir);


app.get('/', (req, res) => {
    res.send('Server is running')
});
const verifyToken = (req, res, next) => {
   
    const token = req.cookies?.token;
  
    if(!token) {
        return res.status(401).send({message: "unauthorized access"})
    }
    jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, decode) => {
        if(err) {
            console.log(err)
            return res.status(401).send({message: "unauthorized access"})
        }
        req.user = decode;
        next();
    })
    
}
app.post('/token-register', async(req, res) => {
    try {
        const user = req.body;
        const token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, {
            expiresIn: "24h"
        })
        res.cookie("token", token, {
            httpOnly: true,
            secure: true,
            sameSite: 'none'
        }).send({success: true})
    }
    catch (error) {

    }
})
app.post('/addJob',verifyToken, async (req, res) => {
    try {
        const db = client.db('techlink'); 
        const jobsCollection = db.collection('jobs');
       

        const { image, title, postedOn, expiredIn, category, description, salary, vacancyNo, userEmail, userName } = req.body;
        const createdAt = new Date();
        const updatedAt = new Date();
        const jobsResult = await jobsCollection.insertOne({ 
            image,
            title,
            postedOn,
            expiredIn,
            category,
            description,
            salary,
            userEmail,
            userName,
            vacancyNo,
            createdAt,
            updatedAt
        });
        res.status(201).json({
            message: 'job added successfully',
            insertedjobsId: jobsResult.insertedId,
        });
    } catch (error) {
        console.error('Error adding job', error);
        res.status(500).json({ message: 'Error adding job' });
    }
});
app.post('/appliedjob',verifyToken, async (req, res) => {
    try {
        const db = client.db('techlink'); 
        const jobsCollection = db.collection('appliedjobs');
       

        const { image, title, posted, expiredIn, category, description, salary, vacancyNo, userEmail, userName, appliedBy} = req.body;
        const createdAt = new Date();
        const updatedAt = new Date();
        const jobsResult = await jobsCollection.insertOne({ 
            image,
            title,
            posted,
            expiredIn,
            category,
            description,
            salary,
            userEmail,
            userName,
            vacancyNo,
            appliedBy,
            isApplied: true,
            isSaved: false,
            createdAt,
            updatedAt
        });
        res.status(201).json({
            message: 'job added successfully',
            insertedjobsId: jobsResult.insertedId,
        });
    } catch (error) {
        console.error('Error adding job', error);
        res.status(500).json({ message: 'Error adding job' });
    }
});
app.post('/savedjob',verifyToken, async (req, res) => {
    try {
        const db = client.db('techlink'); 
        const jobsCollection = db.collection('appliedjobs');
       

        const { image, title, posted, expiredIn, category, description, salary, vacancyNo, userEmail, userName, appliedBy} = req.body;
        const createdAt = new Date();
        const updatedAt = new Date();
        const jobsResult = await jobsCollection.insertOne({ 
            image,
            title,
            posted,
            expiredIn,
            category,
            description,
            salary,
            userEmail,
            userName,
            vacancyNo,
            appliedBy,
            isApplied: false,
            isSaved: true,
            createdAt,
            updatedAt
        });
        res.status(201).json({
            message: 'job added successfully',
            insertedjobsId: jobsResult.insertedId,
        });
    } catch (error) {
        console.error('Error adding job', error);
        res.status(500).json({ message: 'Error adding job' });
    }
});
// GET endpoint to fetch all jobs
app.get('/jobs', async (req, res) => {
    try {
        const db = client.db('techlink'); 
        const collection = db.collection('jobs'); 

        // Find all tourist spots
        const alljobs = await collection.find().toArray();

        res.json(alljobs);
    } catch (error) {
        console.error('Error fetching all jobs:', error);
        res.status(500).json({ message: 'Error fetching all jobs' });
    }
});
// to fetch latest post
app.get('/trending-jobs', async (req, res) => {
    try {
        const db = client.db('techlink'); 
        const collection = db.collection('jobs'); // Assuming your posts collection is named 'posts'

        // Find the latest 6 posts, sorted by creation timestamp in descending order
        const latestPosts = await collection.find().sort({ createdAt: -1 }).limit(6).toArray();

        res.json(latestPosts);
    } catch (error) {
        console.error('Error fetching latest posts:', error);
        res.status(500).json({ message: 'Error fetching latest posts' });
    }
});
// to fetch country list
app.get('/appliedjobs',verifyToken, async (req, res) => {
    try {
        const users = req.user;
        const db = client.db('techlink'); 
        const collection = db.collection('appliedjobs'); // Assuming your posts collection is named 'posts'

        // Find the latest 6 posts, sorted by creation timestamp in descending order
        const countryList = await collection.find({ isApplied: true, appliedBy:  users.email}).toArray();

        res.json(countryList);
    } catch (error) {
        console.error('Error fetching applied jobs:', error);
        res.status(500).json({ message: 'Error fetching applied jobs' });
    }
});
app.get('/savedjobs',verifyToken, async (req, res) => {
    try {
        const users = req.user;
        const db = client.db('techlink'); 
        const collection = db.collection('appliedjobs'); // Assuming your posts collection is named 'posts'

        // Find the latest 6 posts, sorted by creation timestamp in descending order
        const countryList = await collection.find({ isSaved: true, appliedBy:  users.email}).toArray();

        res.json(countryList);
    } catch (error) {
        console.error('Error fetching applied jobs:', error);
        res.status(500).json({ message: 'Error fetching applied jobs' });
    }
});
app.get('/category/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const db = client.db('techlink'); 
        const collection = db.collection('jobs'); // Assuming your posts collection is named 'posts'

        // Find the latest 6 posts, sorted by creation timestamp in descending order
        const jobs = await collection.find({ category: id }).toArray();

        res.json(jobs);
    } catch (error) {
        console.error('Error fetching latest posts:', error);
        res.status(500).json({ message: 'Error fetching latest posts' });
    }
});
app.get('/job/:id', async (req, res) => {
    try {
        const db = client.db('techlink'); 
        const collection = db.collection('jobs'); 

        const { id } = req.params;

        // Find the tourist spot by ID
        const jobs = await collection.findOne({ _id: new ObjectId(id) })

        if (!jobs) {
            return res.status(404).json({ message: 'Tourist spot not found' });
        }

        res.json(jobs);
    } catch (error) {
        console.error('Error searching for tourist spot by ID:', error);
        res.status(500).json({ message: 'Error searching for tourist spot by ID' });
    }
});

app.get('/myjobs/:id',verifyToken, async (req, res) => {
    try {
        const db = client.db('techlink'); 
        const collection = db.collection('jobs'); 

        const { id } = req.params;

        // Find the tourist spot by ID
        const jobs = await collection.find({ userEmail: id }).toArray();

        if (!jobs) {
            return res.status(404).json({ message: 'Tourist spot not found' });
        }

        res.json(jobs);
    } catch (error) {
        console.error('Error searching for tourist spot by ID:', error);
        res.status(500).json({ message: 'Error searching for tourist spot by ID' });
    }
});

// PUT endpoint to update a tourist spot by ID
app.put('/job/:id', async (req, res) => {
    try {
        const db = client.db('techlink'); 
        const collection = db.collection('jobs'); 

        const { id } = req.params;
        const updatedData = req.body;

        // Update the tourist spot by ID
        const result = await collection.updateOne(
            { _id: new ObjectId(id) },
            { $set: updatedData }
        );

        if (result.modifiedCount === 0) {
            return res.status(404).json({ message: 'Tourist spot not found' });
        }

        res.json({ message: 'Tourist spot updated successfully' });
    } catch (error) {
        console.error('Error updating tourist spot:', error);
        res.status(500).json({ message: 'Error updating tourist spot' });
    }
});

// DELETE endpoint to remove a tourist spot by ID
app.delete('/job/:id', async (req, res) => {
    try {
        const db = client.db('techlink'); 
        const collection = db.collection('jobs'); 

        const { id } = req.params;

        // Delete the tourist spot by ID
        const result = await collection.deleteOne({ _id: new ObjectId(id) });

        if (result.deletedCount === 0) {
            return res.status(404).json({ message: 'Job  not found' });
        }

        res.json({ message: 'Job deleted successfully' });
    } catch (error) {
        console.error('Error deleting job:', error);
        res.status(500).json({ message: 'Error deleting job' });
    }
});

app.listen(port, () => {
    console.log(`Server is running on port: ${port}`)
});