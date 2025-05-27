from flask import request, jsonify
from . import auth_bp
from .utils import hash_password, verify_password
from pymongo import MongoClient
from config import MONGO_URI
import uuid
from datetime import datetime
from bson.objectid import ObjectId

client = MongoClient(MONGO_URI)
db = client.shopsy
users = db.users
stocks=db.stocks

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
        'user_token': user_token,
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

    return jsonify({'message': 'Login successful', 'user_token': user['user_token']}), 200

@auth_bp.route('/api/user/<token>', methods=['GET'])
def get_user_by_token(token):
    user = users.find_one({'user_token': token}, {'password': 0})  # exclude password
    if not user:
        return jsonify({'message': 'User not found'}), 404
    return jsonify(user), 200
@auth_bp.route('/api/stocks', methods=['POST'])
def add_stock():
    try:
        data = request.get_json()
        user_token = request.headers.get('Authorization')
        if user_token and user_token.startswith('Bearer '):
            user_token = user_token[7:]

        if not user_token:
            return jsonify({'message': 'Authorization token is required'}), 401

        stock_data = {
            'user_token': user_token,
            'name': data['name'],
            'category': data.get('category', ''),
            'quantity': int(data['quantity']),
            'price': float(data['price']),
            'supplier': data.get('supplier', ''),
            'location': data.get('location', ''),
            'minThreshold': int(data.get('minThreshold', 0)),
            'addedAt': datetime.utcnow(),
            'updatedAt': datetime.utcnow()
        }

        result = stocks.insert_one(stock_data)
        stock_data['_id'] = str(result.inserted_id)
        stock_data['id'] = stock_data['_id']
        return jsonify({'message': 'Stock added', 'stock': stock_data}), 201

    except Exception as e:
        return jsonify({'message': 'Error adding stock', 'error': str(e)}), 500


def get_stock_stats():
    try:
        user_token = request.headers.get('Authorization')
        if user_token and user_token.startswith('Bearer '):
            user_token = user_token[7:]

        if not user_token:
            return jsonify({'message': 'Authorization token is required'}), 401

        user_stocks = list(stocks.find({'user_token': user_token}))

        total_items = len(user_stocks)
        total_value = sum(float(stock.get('price', 0)) * int(stock.get('quantity', 0)) for stock in user_stocks)
        low_stock_items = len([stock for stock in user_stocks if int(stock.get('quantity', 0)) <= int(stock.get('minThreshold', 0))])

        return jsonify({
            'totalItems': total_items,
            'totalValue': round(total_value, 2),
            'lowStockItems': low_stock_items
        }), 200
    except Exception as e:
        return jsonify({'message': f'Error fetching stats: {str(e)}'}), 500

@auth_bp.route('/api/stocks/<stock_id>', methods=['PUT'])
def update_stock(stock_id):
    try:
        data = request.get_json()
        user_token = request.headers.get('Authorization')

        if user_token and user_token.startswith('Bearer '):
            user_token = user_token[7:]

        if not user_token:
            return jsonify({'message': 'Authorization token is required'}), 401

        update_data = {
            'name': data['name'],
            'category': data.get('category', ''),
            'quantity': int(data['quantity']),
            'price': float(data['price']),
            'supplier': data.get('supplier', ''),
            'location': data.get('location', ''),
            'minThreshold': int(data.get('minThreshold', 0)),
            'updatedAt': datetime.utcnow()
        }

        result = stocks.update_one(
            {'_id': ObjectId(stock_id), 'user_token': user_token},
            {'$set': update_data}
        )

        if result.matched_count == 0:
            return jsonify({'message': 'Stock not found or unauthorized'}), 404

        updated_stock = stocks.find_one({'_id': ObjectId(stock_id)})
        updated_stock['_id'] = str(updated_stock['_id'])
        updated_stock['id'] = updated_stock['_id']

        return jsonify({'message': 'Stock updated successfully', 'stock': updated_stock}), 200

    except Exception as e:
        return jsonify({'message': 'Error updating stock', 'error': str(e)}), 500

@auth_bp.route('/api/stocks', methods=['GET'])
def get_stocks():
    try:
        user_token = request.headers.get('Authorization')
        if user_token and user_token.startswith('Bearer '):
            user_token = user_token[7:]

        if not user_token:
            return jsonify({'message': 'Authorization token is required'}), 401

        user_stocks = list(stocks.find({'user_token': user_token}))
        for stock in user_stocks:
            stock['_id'] = str(stock['_id'])

        return jsonify({'stocks': user_stocks}), 200

    except Exception as e:
        return jsonify({'message': 'Error fetching stocks', 'error': str(e)}), 500
@auth_bp.route('/api/stocks/stats', methods=['GET'])
def stock_stats_route():
    return get_stock_stats()
@auth_bp.route('/api/stocks/<stock_id>', methods=['DELETE'])
def delete_stock(stock_id):
    try:
        user_token = request.headers.get('Authorization')
        if user_token and user_token.startswith('Bearer '):
            user_token = user_token[7:]

        if not user_token:
            return jsonify({'message': 'Authorization token is required'}), 401

        result = stocks.delete_one({'_id': ObjectId(stock_id), 'user_token': user_token})
        
        if result.deleted_count == 0:
            return jsonify({'message': 'Stock not found or unauthorized'}), 404

        return jsonify({'message': 'Stock deleted successfully'}), 200

    except Exception as e:
        return jsonify({'message': 'Error deleting stock', 'error': str(e)}), 500