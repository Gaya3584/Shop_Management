import os
from dotenv import load_dotenv

load_dotenv()

MONGO_URI = os.getenv("MONGO_URI")
SECRET_KEY = os.getenv("SECRET_KEY", "secret123")
EMAIL_HOST=os.getenv("EMAIL_HOST", "smtp.gmail.com")
EMAIL_PASSWORD=os.getenv("EMAIL_PASSWORD")  # Use an app password for Gmail