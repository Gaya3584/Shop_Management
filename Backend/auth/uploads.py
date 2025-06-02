import os
from werkzeug.utils import secure_filename

UPLOAD_FOLDER = 'static/uploads'

# make sure the folder exists
os.makedirs(UPLOAD_FOLDER, exist_ok=True)

# inside your function:
def save_uploaded_image(image_file):
    if image_file:
        filename = secure_filename(image_file.filename)
        file_path = os.path.join(UPLOAD_FOLDER, filename)
        image_file.save(file_path)
        return f"/{UPLOAD_FOLDER}/{filename}"
    return ''
