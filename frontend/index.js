const fileInput = document.getElementById('file-input');
const fileNameDisplay = document.getElementById('file-name');
const uploadForm = document.getElementById('upload-form');
const uploadedImageContainer = document.getElementById('uploaded-image-container');
const processedImageContainer = document.getElementById('processed-image-container');
const loadingSpinner = document.getElementById('loading-spinner'); // Get the spinner element

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
        // Show the loading spinner
        loadingSpinner.style.display = 'block';

        // Step 1: Get a secure URL from your server to upload the file to S3
        console.log("Fetching secure URL from server...");
        const response = await fetch("http://localhost:8080/s3Url"); 
        // const response = await fetch("http://13.211.125.31:8080/s3Url");
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
        console.log("Sending image URL to backend (172.31.43.78) server for processing...");

        // Create FormData and append the file
        const imgData = new FormData();
        imgData.append("file", file);  // Attach the file with the same 'file' field name

        const backendResponse = await fetch("http://3.106.197.63:8080/upload-image", {
            method: "POST",
            body: imgData,    // Send the file directly
        });
        if (!backendResponse.ok) {
            throw new Error(`Backend error: ${backendResponse.status} ${backendResponse.statusText}`);
        }

        // Get the image blob from the response
        const imageBlob = await backendResponse.blob();
        console.log("Image Blob:", imageBlob);

        // Create a URL for the image
        const processedImageURL = URL.createObjectURL(imageBlob);
        console.log("Displaying processed image from URL:", processedImageURL);
        displayProcessedImage(processedImageURL);

    } catch (error) {
        console.error("Error uploading file or sending it to the backend:", error);
        // alert('Error during file processing. Please try again.');
    } finally{
        // Hide the spinner when processing is done
        loadingSpinner.style.display = 'none';
    }

    // Reset the form
    uploadForm.reset();
    fileNameDisplay.textContent = 'No file selected';
});

// Function to display the uploaded image
function displayUploadedImage(imageUrl) {
    uploadedImageContainer.innerHTML = '';

    const img = document.createElement('img');
    img.src = imageUrl;
    img.alt = 'Uploaded Image';
    img.style.maxWidth = '500px';
    img.style.maxHeight = '400px';

    uploadedImageContainer.appendChild(img);
}

function displayProcessedImage(imageUrl) {
    processedImageContainer.innerHTML = '';

    const img = document.createElement('img');
    img.src = imageUrl;
    img.alt = 'Processed Image';
    img.style.maxWidth = '500px';
    img.style.maxHeight = '400px';

    processedImageContainer.appendChild(img);
}
