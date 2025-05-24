from flask import request, jsonify
from . import auth_bp
from .utils import hash_password, verify_password
from pymongo import MongoClient
from config import MONGO_URI
import uuid

client = MongoClient(MONGO_URI)
db = client.shopsy
users = db.users

@auth_bp.route('/api/signup', methods=['POST'])
def signup():
    data = request.get_json()
    required_fields = ['ownerName', 'shopName', 'shopType', 'email', 'phone', 'password']

    if not all(field in data and data[field] for field in required_fields):
        return jsonify({'message': 'All fields are required'}), 400

    if users.find_one({'email': data['email']}):
        return jsonify({'message': 'Email already registered'}), 409
    user_token = str(uuid.uuid4())
    user_data = {
        'ownerName': data['ownerName'],
        'shopName': data['shopName'],
        'shopType': data['shopType'],
        'email': data['email'],
        'user_token': data['user_token'],
        'phone': data['phone'],
        'password': hash_password(data['password'])
    }
    print("Received signup data:", data)

    print("Final user_data being saved:", user_data)

    users.insert_one(user_data)
    return jsonify({'message': 'User registered successfully','user_token':user_token}), 201

@auth_bp.route('/api/login', methods=['POST'])
def login():
    data = request.get_json()
    user = users.find_one({'email': data['email']})

    if not user or not verify_password(data['password'], user['password']):
        return jsonify({'message': 'Invalid credentials'}), 401

    return jsonify({'message': 'Login successful', 'token': 'demo-jwt-or-session'}), 200
@auth_bp.route('/api/user/<token>', methods=['GET'])
def get_user_by_token(token):
    user = users.find_one({'user_token': token}, {'password': 0})  # exclude password
    if not user:
        return jsonify({'message': 'User not found'}), 404
    return jsonify(user), 200
