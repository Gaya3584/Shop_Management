import gridfs
from pymongo import MongoClient
from bson import ObjectId
from config import MONGO_URI

client = MongoClient(MONGO_URI)
db = client.shopsy
fs = gridfs.GridFS(db)

def save_uploaded_image_to_gridfs(image_file):
    if image_file:
        filename = image_file.filename
        content_type = image_file.content_type or 'application/octet-stream'

        # Save any image format (jpg, png, webp, etc.)
        file_id = fs.put(image_file.stream, filename=filename, content_type=content_type)
        return str(file_id)  # Return the ObjectId as a string

    return ''
