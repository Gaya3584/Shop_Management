from flask import request, jsonify
from . import auth_bp
from .utils import hash_password, verify_password,generate_token
from pymongo import MongoClient
from config import MONGO_URI


client = MongoClient(MONGO_URI)
db = client.shopsy
users = db.users
#stocks=db.stocks


#signup
@auth_bp.route('/api/signup', methods=['POST'])
def signup():
    data = request.get_json()
    required_fields = ['ownerName', 'shopName', 'shopType', 'email', 'phone', 'password']

    if not all(field in data and data[field] for field in required_fields):
        return jsonify({'message': 'All fields are required'}), 400

    if users.find_one({'email': data['email']}):
        return jsonify({'message': 'Email already registered'}), 409
    #user_token = str(uuid.uuid4())
    user_data = {
        'ownerName': data['ownerName'],
        'shopName': data['shopName'],
        'shopType': data['shopType'],
        'email': data['email'],
        'user_token': None,
        'phone': data['phone'],
        'password': hash_password(data['password'])
    }
    print("Received signup data:", data)

    print("Final user_data being saved:", user_data)
    result=users.insert_one(user_data)
    token = generate_token(result.inserted_id)
    users.update_one({'_id': result.inserted_id}, {'$set': {'user_token': token}})
   
    response = jsonify({'message': 'Signup successful'})
    response.set_cookie(
        'token',
        token,
        httponly=True,       # JavaScript can't access it
        secure=False,        # Set True in production (HTTPS)
        samesite='Lax'       # Prevents CSRF on most sites
    )
    return response



#login
@auth_bp.route('/api/login', methods=['POST'])
def login():
    data = request.get_json()
    user = users.find_one({'email': data['email']})

    if not user or not verify_password(data['password'], user['password']):
        return jsonify({'message': 'Invalid credentials'}), 401
    token= generate_token(user['_id'])
    response = jsonify({'message': 'Login successful'})
    response.set_cookie(
        'token',
        token,
        httponly=True,       # JavaScript can't access it
        secure=False,        # Set True in production (HTTPS)
        samesite='Lax'       # Prevents CSRF on most sites
    )
    return response



#logout
@auth_bp.route('/api/logout',methods=['POST'])
def logout():
    response = jsonify({'message': 'Logged out'})
    response.set_cookie('token', '', expires=0)
    return response


@auth_bp.route('/api/user/<token>', methods=['GET'])
def get_user_by_token(token):
    user = users.find_one({'user_token': token}, {'password': 0})  # exclude password
    if not user:
        return jsonify({'message': 'User not found'}), 404
    return jsonify(user), 200

