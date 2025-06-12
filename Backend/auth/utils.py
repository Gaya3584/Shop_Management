import bcrypt
import jwt
from datetime import datetime, timedelta,timezone
from config import *
from bson.objectid import ObjectId

def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')

def verify_password(password: str, hashed: str) -> bool:
    return bcrypt.checkpw(password.encode('utf-8'), hashed.encode('utf-8'))

def generate_token(user_id, expiry=timedelta(hours=2)):
    payload = {
        'user_id': str(user_id),
        'exp': datetime.now(timezone.utc) + expiry
    }
    return jwt.encode(payload, SECRET_KEY, algorithm='HS256')

    
def decode_token(token):
    try:
        payload=jwt.decode(token,SECRET_KEY,algorithms=['HS256']) #a secure HMAC + SHA-256 algorithm : only server can genereate and verify the token
        return payload['user_id']
    except jwt.ExpiredSignatureError:
        return None
    except jwt.InvalidTokenError:
        return None
    
# This function retrieves a user by their token from the users collection.
def get_user_details(token,users):
    user_id=decode_token(token)
    if not user_id:
        return None
    user=users.find_one({'_id': ObjectId(user_id)})  # Exclude password from the returned user data
    return user