// lsof -i :8000  
//kill using /; kill -9 <pid>
// start server using: python3 -m http.server 800


const fileInput = document.getElementById('file-input');
const fileNameDisplay = document.getElementById('file-name');
const uploadForm = document.getElementById('upload-form');
const imagePreview = document.getElementById('image-preview'); // Get the image preview container

// Display selected file name
fileInput.addEventListener('change', () => {
    if (fileInput.files.length > 0) {
        fileNameDisplay.textContent = `Selected File: ${fileInput.files[0].name}`;
    } else {
        fileNameDisplay.textContent = 'No file selected';
    }
});

// Handle form submission
uploadForm.addEventListener('submit', async event => {
    event.preventDefault();
    const file = fileInput.files[0];
    if (!file) {
        alert('Please select a file to upload.');
        return;
    }

    try {
        // Step 1: Get a secure URL from your server to upload the file to S3
        console.log("Fetching secure URL from server...");
        // const response = await fetch("http://localhost:8080/s3Url"); 
        const response = await fetch("http://13.211.125.31:8080/s3Url");
        console.log("Server response received:", response);
        if (!response.ok) {
            throw new Error(`Server error: ${response.status} ${response.statusText}`);
        }
        const data = await response.json();
        const url = data.url;

        // console.log(url)

        //Step 2: Upload the file directly to the URL received from the server
        const formData = new FormData();
        formData.append("file", file);

        await fetch(url, {
            method: "PUT", //  using a PUT request for S3 uploads
            body: file,    // If the URL is pre-signed for direct upload, we can send the file directly
            headers: {
                "Content-Type": file.type //  set the content type of the file
            }
        });

        alert(`File "${file.name}" uploaded successfully.`);

        // Step 3: Display the uploaded image
        const imageUrl = url.split('?')[0]; // Remove query parameters for displaying the image
        console.log("Image URL:", imageUrl);
        displayUploadedImage(imageUrl);

        // Step 4: Send a POST request to the backend server for further processing
        console.log("Sending image URL to backend server for processing...");
        const backendResponse = await fetch("http://172.31.34.34:5000/process-image", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                file_path: imageUrl // Pass the uploaded image URL to the backend
            })
        });
        if (!backendResponse.ok) {
            throw new Error(`Backend error: ${backendResponse.status} ${backendResponse.statusText}`);
        }

        const backendData = await backendResponse.json();
        console.log("Backend server response:", backendData);
        if (backendData.processed_images) {
            alert('Image processed successfully on the backend.');
            // You can update the frontend to show the processed images if needed
        }

    } catch (error) {
        console.error("Error uploading file or sending it to the backend:", error);
        alert('Error during file processing. Please try again.');
    }

    // Reset the form
    uploadForm.reset();
    fileNameDisplay.textContent = 'No file selected';
});

// Function to display the uploaded image
function displayUploadedImage(imageUrl) {
    // Remove any existing image
    imagePreview.innerHTML = '';

    // Create a new image element
    const img = document.createElement('img');
    img.src = imageUrl; // Use the image URL to display
    img.alt = 'Uploaded Image';
    img.style.maxWidth = '500px';
    img.style.maxHeight = '400px';

    // Add the image to the container
    imagePreview.appendChild(img);
}