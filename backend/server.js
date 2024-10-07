import express from 'express'
import { generateUploadURL } from './s3.js'
import cors from 'cors'; // Import the CORS middleware

const app = express()

// Enable CORS for all routes
// app.use(cors());

// Enable CORS for a specific origin (frontend URL on EC2)
app.use(cors({
    // origin: 'http://13.211.125.31:8000',
    origin: 'http://localhost:8000', // Allow only requests from this origin
    optionsSuccessStatus: 200
}));



app.use(express.static('front'))

// TODO: authentiate user before providing url
// Endpoint to provide a signed URL
app.get('/s3Url', async (req, res) => {
    try {
        const url = await generateUploadURL();
        res.send({url});
    } catch (error) {
        console.error('Error generating URL:', error);
        res.status(500).send({ error: 'Error generating URL' });
    }
})


app.listen(8080, () => console.log("listen on port 8080"))

// start node server using node server.js