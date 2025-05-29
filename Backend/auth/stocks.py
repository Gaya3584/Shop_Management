from flask import request, jsonify
from . import auth_bp
from .utils import decode_token
from pymongo import MongoClient
from config import MONGO_URI
from datetime import datetime
from bson.objectid import ObjectId


client = MongoClient(MONGO_URI)
db = client.shopsy
users = db.users
stocks=db.stocks

@auth_bp.route('/api/stocks', methods=['POST'])
def add_stock():
    try:
        data = request.get_json() #extracts json body of request and stores it in a python dict data
        user_token = request.cookies.get('token')
        user_id= decode_token(user_token)
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
    
@auth_bp.route('/api/stocks/public', methods=['GET'])
def get_all_public_stocks():
    try:
        all_stocks = list(stocks.find({}))
        for stock in all_stocks:
            stock['_id'] = str(stock['_id'])
        return jsonify({'stocks': all_stocks}), 200
    except Exception as e:
        return jsonify({'message': 'Error fetching public stocks', 'error': str(e)}), 500
