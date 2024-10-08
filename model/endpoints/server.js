const express = require('express');
const multer = require('multer');
const path = require('path');
const cors = require('cors'); // Import the CORS middleware

const app = express();

// Enable CORS for all routes
app.use(cors());

// Set up storage and file handling with multer
const storage = multer.memoryStorage(); // Store the file in memory
const upload = multer({ storage: storage }); // Configure multer

// Serve static files from the 'public' directory
app.use(express.static('public'));

// Handle the image upload
app.post('/upload-image', upload.single('file'), (req, res) => {
    console.log('Request body:', req.body);
    console.log('Received file:', req.file);
    if (!req.file) {
        console.error('No file uploaded.');
        return res.status(400).send({ error: 'No file uploaded' });
    }

    console.log('Received file:', req.file.originalname);
    // Here, you can process the file or save it to S3, for example
    res.send({ fileName: req.file.originalname });
});

// Start the server on port 8080
app.listen(8080, () => {
    console.log("Server is listening on port 8080");
});