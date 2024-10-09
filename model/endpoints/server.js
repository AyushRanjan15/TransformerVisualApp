const express = require('express');
const multer = require('multer');
const path = require('path');
const cors = require('cors'); // Import the CORS middleware

// to send to Flask
const axios = require('axios'); // For making HTTP requests
const FormData = require('form-data'); // To send multipart data

const app = express();

// Enable CORS for all routes
// app.use(cors());
// Enable CORS for all routes
app.use(cors({ origin: '*' })); // Enable CORS for any origin (Allow requests from any domain)

// Set up storage and file handling with multer
const storage = multer.memoryStorage(); // Store the file in memory
const upload = multer({ storage: storage }); // Configure multer

// Serve static files from the 'public' directory
app.use(express.static('public'));

// Handle the image upload
app.post('/upload-image', upload.single('file'), async (req, res) => {
    console.log('Request body:', req.body);
    console.log('Received file:', req.file);
    if (!req.file) {
        console.error('No file uploaded.');
        return res.status(400).send({ error: 'No file uploaded' });
    }

    console.log('Received file:', req.file.originalname);

    // Forward the image to the Flask app for processing
    const formData = new FormData();
    formData.append('file', req.file.buffer, req.file.originalname); // Send the file buffer

    try {const flaskResponse = await axios.post('http://172.31.44.214:5000/process-image', formData, {
        headers: formData.getHeaders(),
        responseType: 'stream', // Expect a stream (image) in resonse
    });

    // Forwardthe Flask image back to the client
    res.setHeader('Content-Type', 'image/png');
    flaskResponse.data.pipe(res); //Pipe the image back to the client
    console.log('Flask response headers:', flaskResponse.headers);
    } catch (error) {
        console.log('Error processing image: ', error);
        res.status(500).send({ error: 'Failed to process image' });
    }
});

// Start the server on port 8080
app.listen(8080, () => {
    console.log("Server is listening on port 8080");
});