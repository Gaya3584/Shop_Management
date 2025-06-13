from flask import request, jsonify, redirect, current_app
from . import auth_bp, mail  # Import mail from __init__.py
from .utils import hash_password, verify_password, generate_token,get_user_details,decode_token
from pymongo import MongoClient
from config import MONGO_URI
from datetime import datetime
from bson.objectid import ObjectId
from flask_mail import Message
from itsdangerous import URLSafeTimedSerializer
import base64
from flask import session
from flask_cors import cross_origin
import random
from datetime import timedelta



client = MongoClient(MONGO_URI)
db = client.shopsy
users = db.users
stocks = db.stocks
contact=db.contact


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
        'shopLocation':data['shopLocation'],
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
    remember = data.get('remember', False)  # 👈 this sets remember to True or False
    user = users.find_one({'email': data['email']})

    if not user:
        return jsonify({'message': 'User not found'}), 404
    
    if not user['email_verified']:
        return jsonify({'message': 'Email not verified'}), 403
    
    if not verify_password(data['password'], user['password']):
        return jsonify({'message': 'Invalid credentials'}), 401
     # Set token expiry based on "remember me"
    expiry_duration = timedelta(days=7) if remember else timedelta(hours=2)
    token = generate_token(user['_id'], expiry=expiry_duration)
    response = jsonify({'message': 'Login successful'})
    response.set_cookie(
        'token',
        token,
        httponly=True,
        max_age=int(expiry_duration.total_seconds()),
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
        'shopLocation':user['shopLocation'],
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

        allowed_fields = ['ownerName', 'shopName', 'shopType','shopLocation', 'email', 'phone']
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

@auth_bp.route('/api/change_password', methods=['PUT'])
def update_password():
    try:
        token = request.cookies.get('token') or request.headers.get('Authorization', '').replace('Bearer ', '')
        if not token:
            return jsonify({'message': 'Unauthorized'}), 401

        user = get_user_details(token, users)
        if not user:
            return jsonify({'message': 'User not found'}), 404

        data = request.get_json()
        if not data or 'oldPassword' not in data or 'newPassword' not in data:
            return jsonify({'message': 'Old and new passwords are required'}), 400

        if not verify_password(data['oldPassword'], user['password']):
            return jsonify({'message': 'Old password is incorrect'}), 401

        new_hashed_password = hash_password(data['newPassword'])
        users.update_one({'_id': ObjectId(user['_id'])}, {'$set': {'password': new_hashed_password}})

        return jsonify({'message': 'Password updated successfully'}), 200

    except Exception as e:
        print("Error:", e)
        traceback.print_exc()
        return jsonify({'message': 'Internal Server Error'}), 500
    
@auth_bp.route('/api/contact', methods=['POST'])
def get_contact():
    try:
        data = request.form
        user_token = request.cookies.get('token')
        
        # Decode the token to get user_id
        user_id = decode_token(user_token)
        if not user_id:
            return jsonify({'message': 'Invalid or expired token'}), 401

        # Fetch user details from users collection
        user = users.find_one({'_id': ObjectId(user_id)})
        if not user:
            return jsonify({'message': 'User not found'}), 404

        # Extract required fields
        email = user.get('email')
        phone = user.get('phone')
        issue = data.get('issue')

        if not issue:
            return jsonify({'message': 'Issue is required'}), 400

        # Prepare contact data
        contact_data = {
            'user_id': user_id,
            'email': email,
            'phone': phone,
            'issue': issue,
            'submittedAt': datetime.utcnow()
        }

        # Insert into contact collection
        contact.insert_one(contact_data)

        return jsonify({'message': 'Contact issue submitted successfully'}), 200

    except Exception as e:
        print(f"Error in /api/contact: {e}")
        return jsonify({'message': 'Internal Server Error'}), 500

@auth_bp.route("/api/delete_acc",methods=['DELETE'])
def del_acc():
    try:
        user_token = request.cookies.get('token')
        user_id = decode_token(user_token)
        if not user_id:
            return jsonify({'message': 'Invalid or expired token'}), 401
        user_id = ObjectId(user_id) if not isinstance(user_id, ObjectId) else user_id

        user = users.find_one({'_id': user_id})
        if not user:
            return jsonify({'message': 'User not found'}), 404
        users.delete_one({'_id': user_id})

        response = jsonify({'message': 'Account deleted successfully'})
        response.set_cookie('token', '', expires=0)  # Clear token
        return response, 200
    except Exception as e:
        return jsonify({'message':'An error occured','error':str(e)}),500
@auth_bp.route('/api/request-reset', methods=['POST'])
def request_password_reset():
    try:
        data = request.get_json()
        email = data.get('email')

        if not email:
            return jsonify({'message': 'Email is required'}), 400

        user = users.find_one({'email': email})
        if not user:
            return jsonify({'message': 'No account found with this email'}), 404

        serializer = URLSafeTimedSerializer(current_app.config['SECRET_KEY'])
        token = serializer.dumps(email, salt='password-reset')

        # This is your React frontend route
        reset_url = f"http://localhost:5173/reset-password/{token}"

        send_reset_email(email, reset_url)

        return jsonify({'message': 'Password reset link sent to your email'}), 200

    except Exception as e:
        print("Error sending reset link:", e)
        return jsonify({'message': 'Something went wrong'}), 500

@auth_bp.route('/api/reset-password/<token>', methods=['POST'])
def reset_password(token):
    try:
        serializer = URLSafeTimedSerializer(current_app.config['SECRET_KEY'])
        email = serializer.loads(token, salt='password-reset', max_age=3600)
    except Exception as e:
        print("Reset link invalid or expired:", e)
        return jsonify({"message": 'Invalid or expired reset link'}), 400

    data = request.get_json()
    new_password = data.get('password')
    if not new_password:
        return jsonify({'message': 'New password is required'}), 400

    hashed = hash_password(new_password)
    result = users.update_one({'email': email}, {'$set': {'password': hashed}})

    if result.modified_count == 0:
        return jsonify({'message': 'Password update failed'}), 500

    return jsonify({'message': 'Password reset successful'}), 200

def send_reset_email(email, link):
    try:
        msg = Message(
            "Reset Password", 
            sender=current_app.config['MAIL_USERNAME'],
            recipients=[email]
        )
        msg.body = f'Click the link to reset your password: {link}'
        mail.send(msg)
        print(f"Reset link sent to {email}")
    except Exception as e:
        print(f"Error sending email: {str(e)}")
@auth_bp.route('/api/token',methods=['GET'])
def get_token():
    token=request.cookies.get('token') or  request.headers.get('Authorization','').replace('Bearer ','')
    if not token:
        return jsonify({'message':'Unauthorized'}),401
    
    user=get_user_details(token,users)
    if not user:
        return jsonify({'message':'User not found'}),404
    return jsonify({
            'user_token': user['user_token']
        }), 200
    
@auth_bp.route('/api/recommendations', methods=['GET'])
def get_recommendations():
    user_token = request.cookies.get('token')
    if not user_token:
        return jsonify({"recommendations": []}), 401

    decoded = decode_token(user_token)
    user_id = decoded if isinstance(decoded, str) else decoded.get("user_id")

    # Sample logic: Recommend 5 random public products (not their own)
    from random import sample
    all_products = list(stocks.find({"user_token": {"$ne": user_id}}))
    if len(all_products) == 0:
        return jsonify({"recommendations": []})

    recommendations = sample(all_products, min(3, len(all_products)))


    # Gather all unique user_tokens from recommendations
    user_tokens = list({item['user_token'] for item in recommendations})
    user_docs = users.find({"user_token": {"$in": user_tokens}})
    user_map = {user['user_token']: user for user in user_docs}

    formatted = []
    for item in recommendations:
        user_info = user_map.get(item['user_token'], {})

        formatted.append({
            "id": str(item["_id"]),
            "name": item.get("name"),
            "price": float(item.get("price", 0)),
            "quantity": int(item.get("quantity", 0)),
            "rating": float(item.get("rating", 0)),
            "reviewCount": len(item.get("reviews", [])),
            "image": f"/image/{item['image']}" if "image" in item else "/placeholder.png"
            
       "seller": item.get("shopName", "Unknown"),
            "sellerType": user_info.get("shopType", "Unknown"),
            "location": user_info.get("shopLocation", "Unknown")
        })

    return jsonify({"recommendations": formatted})

