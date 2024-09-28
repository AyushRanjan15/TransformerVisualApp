import express from 'express'
import { generateUploadURL } from './s3.js'
import cors from 'cors'; // Import the CORS middleware

const app = express()

// Enable CORS for all routes
app.use(cors());

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