from flask import Flask, jsonify, send_from_directory, render_template
import json
import os

app = Flask(__name__, template_folder='templates', static_folder='static')

CACHE_FILE = 'flags_data.json'
THUMBNAIL_DIR = 'thumbnails'

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/api/flags')
def get_flags():
    with open(CACHE_FILE, 'r') as f:
        data = json.load(f)
    return jsonify(data)

@app.route('/thumbnails/<filename>')
def get_thumbnail(filename):
    return send_from_directory(THUMBNAIL_DIR, filename)
