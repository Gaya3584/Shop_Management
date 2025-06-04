from flask import request, jsonify
from . import auth_bp
from .utils import decode_token
from pymongo import MongoClient
from config import MONGO_URI
from flask_mail import Message
from flask import current_app
from auth import mail 
from datetime import datetime
from bson.objectid import ObjectId
from .uploads import save_uploaded_image_to_gridfs
from flask import send_file
from bson import ObjectId
from io import BytesIO
import gridfs

client = MongoClient(MONGO_URI)
db = client.shopsy
users = db.users
stocks=db.stocks

fs = gridfs.GridFS(db)

@auth_bp.route('/api/stocks', methods=['POST'])
def add_stock():
    try:
        data = request.form
        image_file = request.files.get('image')
        image_id = save_uploaded_image_to_gridfs(image_file)
        user_token = request.cookies.get('token')
        user_id= decode_token(user_token)
        if not user_id:
            return jsonify({'message': 'Invalid or expired token'}), 401

        user2 = users.find_one({'_id': ObjectId(user_id)})
        shop_name = user2.get('shopName', 'Unknown') if user2 else 'Unknown'
        stock_data = {
            'user_token': user_id,
            'name': data['name'],
            'category': data.get('category', ''),
            'quantity': int(data['quantity']),
            'price': float(data['price']),
            'supplier':None,
            'minThreshold': int(data.get('minThreshold', 0)),
            'minOrder':data.get('minOrder',0),
            'rating':0,
            'reviews':0,
            'image':image_id,
            'discount':data.get('discount',0),
            'addedAt': datetime.utcnow(),
            'updatedAt': datetime.utcnow(),
            'shopName': shop_name

        }

        result = stocks.insert_one(stock_data)
        stock_data['_id'] = str(result.inserted_id)
        stock_data['id'] = stock_data['_id']

        user = users.find_one({'_id': ObjectId(user_id)})
        if user and user.get('email'):
            msg = Message(
                subject="Stock Added Successfully",
                sender=current_app.config['MAIL_USERNAME'],
                recipients=[user['email']]
            )
            msg.body = f"""Hello {user.get('shopName', 'User')},

            Your stock item '{stock_data['name']}' has been added successfully.

            Quantity: {stock_data['quantity']}
            Price: {stock_data['price']}

            Thank you for using Shopsy!
            """
        mail.send(msg)


        return jsonify({'message': 'Stock added', 'stock': stock_data}), 201

    except Exception as e:
        return jsonify({'message': 'Error adding stock', 'error': str(e)}), 500


def get_stock_stats():
    try:
        user_token = request.cookies.get('token')
        user_id = decode_token(user_token)
        if not user_id:
            return jsonify({'message': 'Authorization token is required'}), 401

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
        data = request.form
        image_file = request.files.get('image')
        image_id = save_uploaded_image_to_gridfs(image_file)
        user_token = request.cookies.get('token')
        user_id = decode_token(user_token)
        if not user_id:
            return jsonify({'message': 'Authorization token is required'}), 401


        update_data = {
            'name': data['name'],
            'category': data.get('category', ''),
            'quantity': int(data['quantity']),
            'price': float(data['price']),
            'supplier':data.get('supplier',""),
            'minThreshold': int(data.get('minThreshold', 0)),
            'minOrder':data.get('minOrder',0),
            'rating':0,
            'reviews':0,
            'image':image_id,
            'discount':data.get('discount',0),
            'updatedAt': datetime.utcnow(),
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
    
@auth_bp.route('/api/stocks/public', methods=['GET'])
def get_all_public_stocks():
    msg={}
    try:
        all_stocks = list(stocks.find({}))
        all_users=list(users.find({}))
        for stock in all_stocks:
            stock['_id'] = str(stock['_id'])
        for user in all_users:
            user['_id'] = str(user['_id'])
        
        user_dict = {user['_id']:{
            'seller':user['shopName'],
            'sellerType':user['shopType'],
            'location':user['shopLocation']
        } for user in all_users}

        stock_and_users=[{
            **stock,
            'user_info':user_dict.get(stock['user_token'],{})
            }
            for stock in all_stocks
        ]
        return jsonify({'stocks': stock_and_users}), 200
    except Exception as e:
        return jsonify({'message': 'Error fetching public stocks', 'error': str(e)}), 500
    
@auth_bp.route('/image/<image_id>', methods=['GET'])
def get_image(image_id):
    try:
        file = fs.get(ObjectId(image_id))
        return send_file(BytesIO(file.read()), mimetype=file.content_type)
    except:
        return jsonify({'message': 'Image not found'}), 404
