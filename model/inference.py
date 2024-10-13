from flask import Flask, request, jsonify, send_file
from PIL import Image
import torch
import torchvision.transforms as pth_transforms
from io import BytesIO

import skimage.io
from skimage.measure import find_contours
import matplotlib.pyplot as plt
from matplotlib.patches import Polygon
import torch
import torch.nn as nn
import torchvision
from torchvision import transforms as pth_transforms
import numpy as np
from PIL import Image

import os

import utils
import vision_transformer as vits

app = Flask(__name__)

@app.route('/process-image', methods=['POST'])
def process_image():
    if 'file' not in request.files:
        return jsonify({"error": "No file uploaded"}), 400

    file = request.files['file']  # Get the uploaded image
    if file.filename == '':
        return jsonify({"error": "No selected file"}), 400

    try:
        # Load the image from the uploaded file
        img = Image.open(file).convert("RGB")

        # Transform the image for model processing
        transform = pth_transforms.Compose([
            pth_transforms.Resize((480, 480)),
            pth_transforms.ToTensor(),
            pth_transforms.Normalize((0.485, 0.456, 0.406), (0.229, 0.224, 0.225)),
        ])
        img_tensor = transform(img).unsqueeze(0)

        arch = 'vit_small'
        pretrained_weights = '/dino_small/dino_deitsmall8_300ep_pretrain.pth'
        checkpoint_key = "teacher"
        patch_size = 8
        image_size = (480, 480)

        # Call your model inference here
        device = torch.device("cuda") if torch.cuda.is_available() else torch.device("cpu")

        model = vits.__dict__[arch](patch_size=patch_size, num_classes=0)
        for p in model.parameters():
            p.requires_grad = False
        model.eval()
        model.to(device)

        if os.path.isfile(pretrained_weights):
            print(f"Loading pretrained weights from {pretrained_weights}")
            state_dict = torch.load(pretrained_weights, map_location="cpu")
            if checkpoint_key is not None and checkpoint_key in state_dict:
                state_dict = state_dict[checkpoint_key]
            state_dict = {k.replace("module.", ""): v for k, v in state_dict.items()}
            model.load_state_dict(state_dict, strict=False)
            print("Pretrained weights loaded successfully.")
        else:
            print("Pretrained weights not found, loading default DINO weights.")
            # url = "https://dl.fbaipublicfiles.com/dino/dino_deitsmall8_300ep_pretrain.pth"
            url = "https://dl.fbaipublicfiles.com/dino/dino_deitsmall8_300ep_pretrain/dino_deitsmall8_300ep_pretrain.pth"
            state_dict = torch.hub.load_state_dict_from_url(url, map_location="cpu")
            model.load_state_dict(state_dict, strict=False)

        attentions = model.get_last_selfattention(img_tensor.to(device))

        print(f"Attentions shape: {attentions.shape}")  # Print attentions shape for debugging

        nh = attentions.shape[1]  # number of head
        attentions = attentions[0, :, 0, 1:].reshape(nh, -1)

        # Calculate the feature map size from attention shape
        w_featmap = h_featmap = int(np.sqrt(attentions.shape[-1]))  # Assuming square feature map 60x60
        print(f"Feature map size: {w_featmap}x{h_featmap}")

        # Reshape attentions to [nh, w_featmap, h_featmap]
        processed_attention = attentions.reshape(nh, w_featmap, h_featmap)

        # Interpolating the attention map
        processed_attention = nn.functional.interpolate(processed_attention.unsqueeze(0), scale_factor=patch_size, mode="nearest")[0].cpu().numpy()

        print(f"Processed attention shape: {processed_attention.shape}")
        print(f"Processed attention head shape: {processed_attention[0].shape}")

        # Convert processed_attention to image using plt and save it in memory
        # fig, ax = plt.subplots()
        # ax.imshow(processed_attention[0], cmap='viridis')  # Display the heatmap
        # plt.axis('off')

        # Superimpose all 6 attention heads
        combined_attention = np.mean(processed_attention, axis=0)  # Averaging all 6 heads

        # Normalize the combined attention map to [0, 1]
        combined_attention -= combined_attention.min()
        combined_attention /= combined_attention.max()

        # Convert combined_attention to image using plt and save it in memory
        fig, ax = plt.subplots()
        ax.imshow(combined_attention, cmap='viridis')  # Display the combined heatmap
        plt.axis('off')

        img_io = BytesIO()
        plt.savefig(img_io, format='PNG', bbox_inches='tight', pad_inches=0)
        img_io.seek(0)  # Go to the beginning of the file

        # Return the image directly as a response
        return send_file(img_io, mimetype='image/png')

    except Exception as e:
        print(f"Error during processing: {e}")  # Log the exact error message
        return jsonify({"error": str(e)}), 500


if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000)