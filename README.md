# TransformerVisualApp

A web application for visualizing Vision Transformer (ViT) attention mechanisms on uploaded images. This project demonstrates how transformers, originally designed for natural language processing tasks, can be applied to computer vision tasks.

## Project Overview

TransformerVisualApp allows users to upload images and see how a Vision Transformer model processes them. The application visualizes the self-attention mechanism of the transformer, highlighting which parts of the image the model focuses on during processing.

The project consists of three main components:
- **Frontend**: A web interface for uploading images and displaying results
- **Backend**: A Node.js server for handling file uploads and API requests
- **Model**: A Python-based Vision Transformer model that processes images and visualizes attention

## Architecture

```
TransformerVisualApp/
├── frontend/             # Web interface
├── backend/              # Node.js server for file handling
├── model/                # Vision Transformer model and processing
│   ├── endpoints/        # API endpoints for model interaction
│   ├── dino_small/       # Pre-trained model weights
│   └── ...               # Model implementation files
└── docker-compose.yml    # Docker configuration for deployment
```

## Features

- Upload images through a user-friendly web interface
- Process images using a Vision Transformer model
- Visualize the transformer's attention mechanism on the uploaded image
- Educational content explaining Vision Transformers and their applications

## Technologies Used

- **Frontend**: HTML, CSS, JavaScript
- **Backend**: Node.js, Express
- **Model**: PyTorch, Vision Transformer (ViT)
- **Infrastructure**: Docker, AWS S3 for image storage

## Getting Started

### Prerequisites

- Docker and Docker Compose
- Node.js (for local development)
- Python with PyTorch (for local model development)

### Installation

1. Clone the repository:
   ```
   git clone https://github.com/AyushRanjan15/TransformerVisualApp.git
   cd TransformerVisualApp
   ```

2. Start the application using Docker Compose:
   ```
   docker-compose up
   ```

3. Access the web interface at http://localhost:8000

### Environment Variables

For the backend S3 integration, you'll need to set up the following environment variables:
- `ACCESSKEYID`: AWS access key ID
- `SECRETACCESSKEY`: AWS secret access key

## How It Works

1. The user uploads an image through the web interface
2. The image is temporarily stored in AWS S3
3. The backend server sends the image to the model server
4. The Vision Transformer model processes the image and generates attention visualizations
5. The processed image with attention visualization is returned to the frontend
6. The frontend displays both the original and processed images

## Vision Transformers (ViT)

The application uses a Vision Transformer model based on the DINO (self-DIstillation with NO labels) approach. This model splits images into patches, processes them through a transformer architecture, and can visualize which parts of the image the model attends to during processing.

The visualization demonstrates how transformers, which revolutionized natural language processing, can also be effectively applied to computer vision tasks.

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project includes code from Facebook's DINO implementation, which is licensed under the Apache License 2.0.

## Acknowledgments

- The Vision Transformer implementation is based on Facebook AI Research's DINO project
- The project uses pre-trained weights from the DINO model
