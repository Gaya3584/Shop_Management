import bcrypt
import jwt
from datetime import datetime, timedelta,timezone
from config import *

def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')

def verify_password(password: str, hashed: str) -> bool:
    return bcrypt.checkpw(password.encode('utf-8'), hashed.encode('utf-8'))

def generate_token(user_id):
    payload={           #payload is the data stored in jwt token
        'user_id':str(user_id),  #helps identify user in later requests
        'exp':datetime.now(timezone.utc) + timedelta(days=30) # token expiration time : after 1 day 
    }
    return jwt.encode(payload,SECRET_KEY,algorithm='HS256')
    
def decode_token(token):
    try:
        payload=jwt.decode(token,SECRET_KEY,algorithms=['HS256']) #a secure HMAC + SHA-256 algorithm : only server can genereate and verify the token
        return payload['user_id']
    except jwt.ExpiredSignatureError:
        return None
    except jwt.InvalidTokenError:
        return None