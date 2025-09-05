import os
import json
from PIL import Image
import numpy as np

FLAGS_DIR = os.path.join(os.path.dirname(__file__), '../state_flags_png')
CACHE_FILE = os.path.join(os.path.dirname(__file__), '../flags_data.json')
THUMBNAIL_DIR = os.path.join(os.path.dirname(__file__), '../thumbnails')
THUMBNAIL_SIZE = (64, 40)

os.makedirs(THUMBNAIL_DIR, exist_ok=True)

def get_average_rgb(image_path):
    img = Image.open(image_path).convert('RGB')
    arr = np.array(img) / 255.0
    avg_rgb = arr.mean(axis=(0, 1))
    return avg_rgb.tolist()

def create_thumbnail(image_path, thumb_path):
    img = Image.open(image_path)
    img.thumbnail(THUMBNAIL_SIZE)
    img.save(thumb_path)

def process_flags():
    flags_data = []
    for fname in os.listdir(FLAGS_DIR):
        if fname.endswith('.png'):
            state = fname.replace('.png', '').replace('_', ' ')
            img_path = os.path.join(FLAGS_DIR, fname)
            thumb_path = os.path.join(THUMBNAIL_DIR, fname)
            avg_rgb = get_average_rgb(img_path)
            create_thumbnail(img_path, thumb_path)
            flags_data.append({
                'state': state,
                'filename': fname,
                'avg_rgb': avg_rgb,
                'thumbnail': f'thumbnails/{fname}'
            })
    with open(CACHE_FILE, 'w') as f:
        json.dump(flags_data, f, indent=2)
    print(f"Processed {len(flags_data)} flags. Data saved to {CACHE_FILE}.")

if __name__ == '__main__':
    process_flags()
