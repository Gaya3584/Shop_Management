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
Wishlist=db.Wishlist


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
        supplier_name = data.get('supplier', None)

        stock_data = {
            'user_token': user_id,
            'name': data['name'],
            'category': data.get('category', ''),
            'quantity': int(data['quantity']),
            'price': float(data['price']),
            'supplier':supplier_name,
            'minThreshold': int(data.get('minThreshold', 0)),
            'minOrder':data.get('minOrder',0),
            'rating':0,
            'reviews':[],

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
            'supplier': data.get('supplier', ""),
            'minThreshold': int(data.get('minThreshold', 0)),
            'minOrder': int(data.get('minOrder', 0)),
            'rating': stock.get('rating', 0),
            'reviews': stock.get('reviews', []),
            'images': image_id,
            'discount': float(data.get('discount', 0)),
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
        
        user_dict = {
        user['_id']: {
            'seller': user.get('shopName', ''),
            'sellerType': user.get('shopType', ''),
            'location': user.get('shopLocation', ''),
            'user_token':user.get('user_token','')
        }
        for user in all_users
        }


        stock_and_users=[{
            **stock,
            'reviewCount':len(stock.get('reviews',[])),
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




# Replace the existing wishlist routes with these MongoDB-compatible versions

@auth_bp.route('/api/wishlist', methods=['GET'])
def get_wishlist():
    try:
        user_token = request.cookies.get('token')
        user_id = decode_token(user_token)
        if not user_id:
            return jsonify({'message': 'Authorization token is required'}), 401

        # Get user's wishlist items
        user_wishlist = list(Wishlist.find({'user_id': user_id}))
        
        # Get stock details for each wishlist item
        wishlist_with_details = []
        for item in user_wishlist:
            stock = stocks.find_one({'_id': ObjectId(item['stock_id'])})
            if stock:
                stock['_id'] = str(stock['_id'])
                wishlist_item = {
                    'wishlist_id': str(item['_id']),
                    'stock_id': str(item['stock_id']),
                    'added_at': item.get('added_at'),
                    'stock_details': stock
                }
                wishlist_with_details.append(wishlist_item)

        return jsonify({'wishlist': wishlist_with_details}), 200

    except Exception as e:
        return jsonify({'message': 'Error fetching wishlist', 'error': str(e)}), 500


@auth_bp.route('/api/wishlist/add', methods=['POST'])
def add_to_wishlist():
    try:
        user_token = request.cookies.get('token')
        user_id = decode_token(user_token)
        if not user_id:
            return jsonify({'message': 'Authorization token is required'}), 401

        data = request.get_json()
        stock_id = data.get('stock_id')
        
        if not stock_id:
            return jsonify({'message': 'Missing stock_id'}), 400

        # Check if stock exists
        stock = stocks.find_one({'_id': ObjectId(stock_id)})
        if not stock:
            return jsonify({'message': 'Stock not found'}), 404

        # Check if already in wishlist
        existing = Wishlist.find_one({'user_id': user_id, 'stock_id': stock_id})
        if existing:
            return jsonify({'message': 'Item already in wishlist'}), 400

        # Add to wishlist
        wishlist_item = {
            'user_id': user_id,
            'stock_id': stock_id,
            'added_at': datetime.utcnow()
        }
        
        result = Wishlist.insert_one(wishlist_item)
        wishlist_item['_id'] = str(result.inserted_id)

        return jsonify({'message': 'Added to wishlist', 'wishlist_item': wishlist_item}), 201

    except Exception as e:
        return jsonify({'message': 'Error adding to wishlist', 'error': str(e)}), 500


@auth_bp.route('/api/wishlist/remove/<stock_id>', methods=['DELETE'])
def remove_from_wishlist(stock_id):
    try:
        user_token = request.cookies.get('token')
        user_id = decode_token(user_token)
        if not user_id:
            return jsonify({'message': 'Authorization token is required'}), 401

        # Remove from wishlist
        result = Wishlist.delete_one({'user_id': user_id, 'stock_id': stock_id})
        
        if result.deleted_count == 0:
            return jsonify({'message': 'Item not found in wishlist'}), 404

        return jsonify({'message': 'Removed from wishlist'}), 200

    except Exception as e:
        return jsonify({'message': 'Error removing from wishlist', 'error': str(e)}), 500


@auth_bp.route('/api/wishlist/check/<stock_id>', methods=['GET'])
def check_wishlist_status(stock_id):
    """Check if a stock item is in user's wishlist"""
    try:
        user_token = request.cookies.get('token')
        user_id = decode_token(user_token)
        if not user_id:
            return jsonify({'message': 'Authorization token is required'}), 401

        existing = Wishlist.find_one({'user_id': user_id, 'stock_id': stock_id})
        
        return jsonify({'in_wishlist': existing is not None}), 200

    except Exception as e:
        return jsonify({'message': 'Error checking wishlist status', 'error': str(e)}), 500
@auth_bp.route('/api/wishlist/show', methods=['GET'])
def show_wishlist():
    try:
        user_token = request.cookies.get('token')
        user_id = decode_token(user_token)
        if not user_id:
            return jsonify({'message': 'Authorization token is required'}), 401

        # Get ALL wishlist items for the user (not just one)
        wishlist_items = list(Wishlist.find({'user_id': user_id}))
        
        if not wishlist_items:
            return jsonify({
                'message': 'Wishlist is empty',
                'wishlist': [],
                'count': 0
            }), 200

        # Get detailed product information for each wishlist item
        detailed_wishlist = []
        for item in wishlist_items:
            # Find the corresponding stock/product
            stock = stocks.find_one({'_id': ObjectId(item['stock_id'])})
            if stock:
                # Find seller information
                seller = users.find_one({'_id': ObjectId(stock['user_token'])})
                
                wishlist_entry = {
                    'wishlist_id': str(item['_id']),
                    'stock_id': str(item['stock_id']),
                    'added_at': item.get('added_at'),
                    'product': {
                        'id': str(stock['_id']),
                        'name': stock['name'],
                        'price': stock['price'],
                        'category': stock.get('category', ''),
                        'quantity': stock['quantity'],
                        'minOrder': stock.get('minOrder', 1),
                        'minThreshold': stock.get('minThreshold', 0),
                        'discount': stock.get('discount', 0),
                        'rating': stock.get('rating', 0),
                        'reviews': stock.get('reviews', 0),
                        'image': f"/image/{stock['image']}" if stock.get('image') else None,
                        'inStock': stock['quantity'] > 0,
                        'seller': {
                            'name': seller.get('shopName', 'Unknown') if seller else 'Unknown',
                            'type': seller.get('shopType', 'Unknown') if seller else 'Unknown',
                            'location': seller.get('shopLocation', 'Unknown') if seller else 'Unknown'
                        }
                    }
                }
                detailed_wishlist.append(wishlist_entry)

        return jsonify({
            'message': 'Wishlist retrieved successfully',
            'wishlist': detailed_wishlist,
            'count': len(detailed_wishlist)
        }), 200

    except Exception as e:
        return jsonify({'message': 'Error fetching wishlist', 'error': str(e)}), 500
        
