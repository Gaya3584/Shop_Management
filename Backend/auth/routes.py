from flask import request, jsonify, redirect, current_app
from . import auth_bp, mail  # Import mail from __init__.py
from .utils import hash_password, verify_password, generate_token, decode_token
from pymongo import MongoClient
from config import MONGO_URI
import uuid
from datetime import datetime
from bson.objectid import ObjectId
from flask_mail import Message
from itsdangerous import URLSafeTimedSerializer

client = MongoClient(MONGO_URI)
db = client.shopsy
users = db.users
stocks = db.stocks


@auth_bp.route('/api/signup', methods=['POST'])
def signup():
    data = request.get_json()
    required_fields = ['ownerName', 'shopName', 'shopType', 'email', 'phone', 'password']

    if not all(field in data and data[field] for field in required_fields):
        return jsonify({'message': 'All fields are required'}), 400

    if users.find_one({'email': data['email']}):
        return jsonify({'message': 'Email already registered'}), 409

    user_data = {
        'ownerName': data['ownerName'],
        'shopName': data['shopName'],
        'shopType': data['shopType'],
        'email': data['email'],
        'user_token': None,
        'email_verified': False,
        'phone': data['phone'],
        'password': hash_password(data['password'])
    }
    
    print("Received signup data:", data)
    print("Final user_data being saved:", user_data)
    
    result = users.insert_one(user_data)
    token = generate_token(result.inserted_id)
    users.update_one({'_id': result.inserted_id}, {'$set': {'user_token': token}})
    
    send_verification_email(data['email'])
   
    response = jsonify({'message': 'Signup successful'})
    response.set_cookie(
        'token',
        token,
        httponly=True,
        secure=False,  # Set True in production (HTTPS)
        samesite='Lax'
    )
    return response
@auth_bp.route('/api/verify-email', methods=['POST'])
def resend_verification_email():
    data = request.get_json()
    email = data.get('email')
    if not email:
        return jsonify({'message': 'Email is required'}), 400
    
    # Check if user exists
    user = users.find_one({'email': email})
    if not user:
        return jsonify({'message': 'User not found'}), 404
    
    if user['email_verified']:
        return jsonify({'message': 'Email already verified'}), 400
    
    send_verification_email(email)
    return jsonify({'message': 'Verification email sent'}), 200
def send_verification_email(email):
    try:
        serializer = URLSafeTimedSerializer(current_app.config['SECRET_KEY'])
        token = serializer.dumps(email, salt='email-confirm')
        link = f"http://localhost:5000/verify/{token}"
        
        msg = Message(
            "Verify your email", 
            sender=current_app.config['MAIL_USERNAME'],  # Use configured sender
            recipients=[email]
        )
        msg.body = f'Click the link to verify your email: {link}'
        mail.send(msg)
        print(f"Verification email sent to {email}")
    except Exception as e:
        print(f"Error sending email: {str(e)}")


@auth_bp.route('/verify/<token>')
def verify_email(token):
    try:
        serializer = URLSafeTimedSerializer(current_app.config['SECRET_KEY'])
        email = serializer.loads(token, salt='email-confirm', max_age=3600)
    except Exception as e:
        print(f"Email verification error: {str(e)}")
        return jsonify({'message': 'Verification link expired or invalid'}), 400

    # Update user in MongoDB
    result = users.update_one({'email': email}, {'$set': {'email_verified': True}})
    if result.modified_count > 0:
        return redirect('http://localhost:5173')
    else:
        return jsonify({'message': 'User not found or already verified'}), 400


@auth_bp.route('/api/login', methods=['POST'])
def login():
    data = request.get_json()
    user = users.find_one({'email': data['email']})

    if not user:
        return jsonify({'message': 'User not found'}), 404
    
    if not user['email_verified']:
        return jsonify({'message': 'Email not verified'}), 403
    
    if not verify_password(data['password'], user['password']):
        return jsonify({'message': 'Invalid credentials'}), 401
    
    token = generate_token(user['_id'])
    response = jsonify({'message': 'Login successful'})
    response.set_cookie(
        'token',
        token,
        httponly=True,
        secure=False,  # Set True in production (HTTPS)
        samesite='Lax'
    )
    return response


@auth_bp.route('/api/user/<token>', methods=['GET'])
def get_user_by_token(token):
    user = users.find_one({'user_token': token}, {'password': 0})
    if not user:
        return jsonify({'message': 'User not found'}), 404
    return jsonify(user), 200


@auth_bp.route('/api/stocks', methods=['POST'])
def add_stock():
    try:
        data = request.get_json()
        user_token = request.cookies.get('token')
        user_id = decode_token(user_token)
        if not user_id:
            return jsonify({'message': 'Invalid or expired token'}), 401

        stock_data = {
            'user_token': user_id,
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
        user_token = request.cookies.get('token')
        user_id = decode_token(user_token)
        if not user_id:
            return jsonify({'message': 'Authorization token is required'}), 401

        # Fixed: Use user_id instead of user_token for database query
        user_stocks = list(stocks.find({'user_token': user_id}))

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
        user_token = request.cookies.get('token')
        user_id = decode_token(user_token)
        if not user_id:
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
            {'_id': ObjectId(stock_id), 'user_token': user_id},
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
        user_token = request.cookies.get('token')
        user_id = decode_token(user_token)
        if not user_id:
            return jsonify({'message': 'Authorization token is required'}), 401

        user_stocks = list(stocks.find({'user_token': user_id}))
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
        user_token = request.cookies.get('token')
        user_id = decode_token(user_token)
        if not user_id:
            return jsonify({'message': 'Authorization token is required'}), 401

        result = stocks.delete_one({'_id': ObjectId(stock_id), 'user_token': user_id})
        
        if result.deleted_count == 0:
            return jsonify({'message': 'Stock not found or unauthorized'}), 404

        return jsonify({'message': 'Stock deleted successfully'}), 200

    except Exception as e:
        return jsonify({'message': 'Error deleting stock', 'error': str(e)}), 500