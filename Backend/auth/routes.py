from flask import request, jsonify, redirect, current_app
from . import auth_bp, mail  # Import mail from __init__.py
from .utils import hash_password, verify_password, generate_token, decode_token,get_user_details
from pymongo import MongoClient
from config import MONGO_URI
from datetime import datetime
from bson.objectid import ObjectId
from flask_mail import Message
from itsdangerous import URLSafeTimedSerializer
import base64
from flask import session
from flask_cors import cross_origin


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

    data = {
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
    print("Final data being saved:", data)
    
    result = users.insert_one(data)
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
    
#profile 
@auth_bp.route('/api/profile',methods=['GET'])
def profile():
    token=request.cookies.get('token') or  request.headers.get('Authorization','').replace('Bearer ','')
    if not token:
        return jsonify({'message':'Unauthorized'}),401
    
    user=get_user_details(token,users)
    if not user:
        return jsonify({'message':'User not found'}),404
    
    serialized_user = serialize_user_with_image(user)
    return jsonify(serialized_user)

#image 
@auth_bp.route('/api/upload_img', methods=['POST'])
def upload_image():
    token = request.cookies.get('token') or request.headers.get('Authorization', '').replace('Bearer ', '')
    if not token:
        return jsonify({'message': 'Unauthorized'}), 401
    user= get_user_details(token, users)
    if not user:
        return jsonify({'message': 'User not found'}), 404
    file = request.files.get('image')
    if not file or file.filename == '':
        return jsonify({'message': 'No file provided'}), 400
    if not allowed_file(file.filename):
        return jsonify({'message': 'File type not allowed'}), 400
    content_type= file.content_type
    encoded_image = base64.b64encode(file.read()).decode('utf-8')
    users.update_one(
        {'_id': ObjectId(user['_id'])},
        {'$set': {'image': {'content_type': content_type, 'data': encoded_image}}}
    )
    return jsonify({'message': 'Image uploaded successfully'}), 200
def allowed_file(filename):
    ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'gif'}
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS
def get_image(user):
    if 'image' in user and user['image']:
        image_data = user['image']
        if isinstance(image_data, dict) and 'data' in image_data:
            return {
                'content_type': image_data.get('content_type', 'application/octet-stream'),
                'data': image_data['data']
            }
    return None
def serialize_user_with_image(user):
    data={
        'ownerName':user['ownerName'],
        'shopName': user['shopName'],
        'shopType': user['shopType'],
        'email': user['email'],
        'phone': user['phone'],
        'email_verified': user['email_verified'],
        '_id': str(user['_id']),
    }
    image = get_image(user)  # You can still call this
    if image and 'data' in image and 'content_type' in image:
        # Format the image properly for frontend <img src="...">
        base64_string = image['data']
        content_type = image['content_type']
        data['image'] = f"data:{content_type};base64,{base64_string}"
    return data
@auth_bp.route('/api/delete_img', methods=['DELETE'])
def delete_image():
    token= request.cookies.get('token') or request.headers.get('Authorization', '').replace('Bearer ', '')
    if not token:
        return jsonify({'message': 'Unauthorized'}), 401
    user = get_user_details(token, users)
    if not user:
        return jsonify({'message': 'User not found'}), 404
    users.update_one(
        {'_id':ObjectId(user['_id'])},
        {'$unset': {'image': ""}}
    )
    return jsonify({'success': True, 'message': 'Image deleted successfully'}), 200

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

from bson import ObjectId
import traceback

<<<<<<< HEAD
@auth_bp.route('/api/user/me', methods=['GET'])
def get_user_details():
    token=request.cookies.get("token")
    if not token:
        return jsonify({'message':'No token found'}),401
    user = decode_token(token)
    if not user:
        return jsonify({'message': 'User not found'}), 404
    return jsonify(user), 200

=======
@auth_bp.route('/api/edit_profile', methods=['PUT'])
def edit_profile():
    try:
        token = request.cookies.get('token') or request.headers.get('Authorization', '').replace('Bearer ', '')
        if not token:
            return jsonify({'message': 'Unauthorized'}), 401

        user = get_user_details(token, users)
        if not user:
            return jsonify({'message': 'User not found'}), 404

        data = request.get_json()
        if not data:
            return jsonify({'message': 'No data provided'}), 400

        allowed_fields = ['ownerName', 'shopName', 'shopType', 'email', 'phone']
        update_fields = {key: value for key, value in data.items() if value is not None and key in allowed_fields}

        user_id = user['_id']
        if not isinstance(user_id, ObjectId):
            user_id = ObjectId(user_id)

        if 'email' in update_fields:
            existing_user = users.find_one({'email': update_fields['email'], '_id': {'$ne': user_id}})
            if existing_user:
                return jsonify({'message': 'Email already registered'}), 409

        users.update_one({'_id': user_id}, {'$set': update_fields})

        updated_user = users.find_one({'_id': user_id}, {'password': 0})
        if updated_user and '_id' in updated_user:
            updated_user['_id'] = str(updated_user['_id'])

        return jsonify({'message': 'Updated successfully', 'user': updated_user}), 200

    except Exception as e:
        print("Error:", e)
        traceback.print_exc()
        return jsonify({'message': 'Internal Server Error'}), 500


>>>>>>> gaya2
