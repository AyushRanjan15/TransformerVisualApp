from flask import Flask, request, jsonify
from PIL import Image
import torch
import torchvision.transforms as pth_transforms
from io import BytesIO

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
        pretrained_weights = '/home/ubuntu/.cache/torch/hub/checkpoints/dino_deitsmall8_300ep_pretrain.pth'
        checkpoint_key = "teacher"
        patch_size = 8
        #----------------------------
        # Call your model inference here
        device = torch.device("cuda") if torch.cuda.is_available() else torch.device("cpu")

        model = vits.__dict__[arch](patch_size=args.patch_size, num_classes=0)
        for p in model.parameters():
            p.requires_grad = False
        model.eval()
        model.to(device)
        if os.path.isfile(pretrained_weights):
            state_dict = torch.load(pretrained_weights, map_location="cpu")
            if args.checkpoint_key is not None and args.checkpoint_key in state_dict:
                print(f"Take key {checkpoint_key} in provided checkpoint dict")
                state_dict = state_dict[checkpoint_key]
            # remove `module.` prefix
            state_dict = {k.replace("module.", ""): v for k, v in state_dict.items()}
            # remove `backbone.` prefix induced by multicrop wrapper
            state_dict = {k.replace("backbone.", ""): v for k, v in state_dict.items()}
            msg = model.load_state_dict(state_dict, strict=False)
            print('Pretrained weights found at {} and loaded with msg: {}'.format(pretrained_weights, msg))
        else:
            print("Please use the `--pretrained_weights` argument to indicate the path of the checkpoint to evaluate.")
            url = None
            if arch == "vit_small" and patch_size == 16:
                url = "dino_deitsmall16_pretrain/dino_deitsmall16_pretrain.pth"
            elif arch == "vit_small" and patch_size == 8:
                url = "dino_deitsmall8_300ep_pretrain/dino_deitsmall8_300ep_pretrain.pth"  # model used for visualizations in our paper
            elif arch == "vit_base" and patch_size == 16:
                url = "dino_vitbase16_pretrain/dino_vitbase16_pretrain.pth"
            elif arch == "vit_base" and patch_size == 8:
                url = "dino_vitbase8_pretrain/dino_vitbase8_pretrain.pth"
            if url is not None:
                print("Since no pretrained weights have been provided, we load the reference pretrained DINO weights.")
                state_dict = torch.hub.load_state_dict_from_url(url="https://dl.fbaipublicfiles.com/dino/" + url)
                model.load_state_dict(state_dict, strict=True)
            else:
                print("There is no reference weights available for this model => We use random weights.")

        # open image
        if args.image_path is None:
            # user has not specified any image - we use our own image
            print("Please use the `--image_path` argument to indicate the path of the image you wish to visualize.")
            print("Since no image path have been provided, we take the first image in our paper.")
            response = requests.get("https://dl.fbaipublicfiles.com/dino/img.png")
            img = Image.open(BytesIO(response.content))
            img = img.convert('RGB')
        elif os.path.isfile(args.image_path):
            with open(args.image_path, 'rb') as f:
                img = Image.open(f)
                img = img.convert('RGB')
        else:
            print(f"Provided image path {args.image_path} is non valid.")
            sys.exit(1)
        transform = pth_transforms.Compose([
            pth_transforms.Resize(args.image_size),
            pth_transforms.ToTensor(),
            pth_transforms.Normalize((0.485, 0.456, 0.406), (0.229, 0.224, 0.225)),
        ])
        img = transform(img)

        # make the image divisible by the patch size
        w, h = img.shape[1] - img.shape[1] % args.patch_size, img.shape[2] - img.shape[2] % args.patch_size
        img = img[:, :w, :h].unsqueeze(0)

        w_featmap = img.shape[-2] // args.patch_size
        h_featmap = img.shape[-1] // args.patch_size

        attentions = model.get_last_selfattention(img.to(device))

        nh = attentions.shape[1] # number of head

        # we keep only the output patch attention
        attentions = attentions[0, :, 0, 1:].reshape(nh, -1)

        if args.threshold is not None:
            # we keep only a certain percentage of the mass
            val, idx = torch.sort(attentions)
            val /= torch.sum(val, dim=1, keepdim=True)
            cumval = torch.cumsum(val, dim=1)
            th_attn = cumval > (1 - args.threshold)
            idx2 = torch.argsort(idx)
            for head in range(nh):
                th_attn[head] = th_attn[head][idx2[head]]
            th_attn = th_attn.reshape(nh, w_featmap, h_featmap).float()
            # interpolate
            th_attn = nn.functional.interpolate(th_attn.unsqueeze(0), scale_factor=args.patch_size, mode="nearest")[0].cpu().numpy()

        attentions = attentions.reshape(nh, w_featmap, h_featmap)
        attentions = nn.functional.interpolate(attentions.unsqueeze(0), scale_factor=args.patch_size, mode="nearest")[0].cpu().numpy()

        # save attentions heatmaps
        os.makedirs(args.output_dir, exist_ok=True)
        torchvision.utils.save_image(torchvision.utils.make_grid(img, normalize=True, scale_each=True), os.path.join(args.output_dir, "img.png"))
        for j in range(nh):
            fname = os.path.join(args.output_dir, "attn-head" + str(j) + ".png")
            plt.imsave(fname=fname, arr=attentions[j], format='png')
            print(f"{fname} saved.")

        #-----------------------------

        # For example:
        # model_output = model(img_tensor)

        # Save or process the result as needed
        # You can save the processed image locally or return a result

        # Save processed image as an example
        processed_img_path = "processed_image.png"
        img.save(processed_img_path)

        # Return the processed image URL (or any result you need)
        return jsonify({"imageUrl": f"http://<your-ec2-ip>:5000/{processed_img_path}"})

    except Exception as e:
        return jsonify({"error": str(e)}), 500


if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000)