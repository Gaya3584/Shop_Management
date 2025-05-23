from flask import request, jsonify
from . import auth_bp
from .utils import hash_password, verify_password
from pymongo import MongoClient
from config import MONGO_URI

client = MongoClient(MONGO_URI)
db = client.shopdb
users = db.users

@auth_bp.route('/api/signup', methods=['POST'])
def signup():
    data = request.get_json()
    required_fields = ['name', 'shopName', 'shopType', 'email', 'phone', 'password']

    if not all(field in data and data[field] for field in required_fields):
        return jsonify({'message': 'All fields are required'}), 400

    if users.find_one({'email': data['email']}):
        return jsonify({'message': 'Email already registered'}), 409

    user_data = {
        'name': data['name'],
        'shopName': data['shopName'],
        'shopType': data['shopType'],
        'email': data['email'],
        'phone': data['phone'],
        'password': hash_password(data['password'])
    }

    users.insert_one(user_data)
    return jsonify({'message': 'User registered successfully'}), 201

@auth_bp.route('/api/login', methods=['POST'])
def login():
    data = request.get_json()
    user = users.find_one({'email': data['username']})

    if not user or not verify_password(data['password'], user['password']):
        return jsonify({'message': 'Invalid credentials'}), 401

    return jsonify({'message': 'Login successful', 'token': 'demo-jwt-or-session'}), 200
