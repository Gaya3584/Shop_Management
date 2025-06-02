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


#signup
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
        'shopLocation':'',
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


#logout
@auth_bp.route('/api/logout',methods=['POST'])
def logout():
    response = jsonify({'message': 'Logged out'})
    response.set_cookie('token', '', expires=0)
    return response


@auth_bp.route('/api/user/<token>', methods=['GET'])
def get_user_by_token(token):
    user = users.find_one({'user_token': token}, {'password': 0})
    if not user:
        return jsonify({'message': 'User not found'}), 404
    return jsonify(user), 200


@auth_bp.route('/api/user/me', methods=['GET'])
def get_user_details():
    token=request.cookies.get("token")
    if not token:
        return jsonify({'message':'No token found'}),401
    user = decode_token(token)
    if not user:
        return jsonify({'message': 'User not found'}), 404
    return jsonify(user), 200

