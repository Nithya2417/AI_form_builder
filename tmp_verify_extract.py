from PIL import Image, ImageDraw, ImageFont
import requests
import tempfile
import os
import json

text = 'Name: Alice Smith\nEmail: alice@example.com\nSkills: Python, React\nExperience: 5 years'
img = Image.new('RGB', (480, 160), 'white')
d = ImageDraw.Draw(img)
f = ImageFont.load_default()
i = 0
for line in text.split('\n'):
    d.text((10, 10 + 18 * i), line, fill='black', font=f)
    i += 1

path = tempfile.mktemp(suffix='.png')
img.save(path)
print('created', path)

with open(path, 'rb') as f:
    files = {'file': ('test.png', f, 'image/png')}
    data = {'fields': json.dumps([
        {'label': 'Name', 'type': 'text', 'required': True},
        {'label': 'Email', 'type': 'text', 'required': True},
        {'label': 'Skills', 'type': 'text', 'required': False},
        {'label': 'Experience', 'type': 'text', 'required': False}
    ])}
    r = requests.post('http://127.0.0.1:8000/extract', files=files, data=data, timeout=120)
    print(r.status_code)
    print(r.text)

os.remove(path)
