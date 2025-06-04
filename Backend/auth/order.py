from flask import request, jsonify
from flask_mail import Message
from flask import current_app
from flask_cors import cross_origin
from pymongo import MongoClient
from bson.objectid import ObjectId
from datetime import datetime
from config import MONGO_URI
from . import auth_bp
from auth import mail 
from .utils import decode_token

client = MongoClient(MONGO_URI)
db = client.shopsy
users = db.users
stocks = db.stocks
orders=db.orders
@auth_bp.route('/api/orders/new', methods=['POST',"OPTIONS"])
@cross_origin(origins='http://localhost:5173', supports_credentials=True)
def place_order():
    try:
        user_token = request.cookies.get('token')
        user_id = decode_token(user_token)
        if not user_id:
            return jsonify({'message': 'Invalid or expired token'}), 401

        data = request.json
        product_id = data.get('productId')
        quantity = data.get('quantity')
        total_price = data.get('totalPrice')

        if not product_id or not ObjectId.is_valid(product_id):
            return jsonify({'message': 'Invalid product ID'}), 400
        if not quantity or not isinstance(quantity, int) or quantity <= 0:
            return jsonify({'message': 'Invalid quantity'}), 400

        product = stocks.find_one({'_id': ObjectId(product_id)})
        if not product:
            return jsonify({'message': 'Product not found'}), 404

        available_quantity = product.get('quantity', 0)
        min_order = int(product.get('minOrder', 1))

        if quantity < min_order:
            return jsonify({'message': f'Minimum order quantity is {min_order}'}), 400
        if quantity > available_quantity:
            return jsonify({'message': 'Insufficient stock'}), 400

        update_result = stocks.update_one(
            {'_id': ObjectId(product_id), 'quantity': {'$gte': quantity}},
            {'$inc': {'quantity': -quantity}}
        )
        if update_result.modified_count == 0:
            return jsonify({'message': 'Stock insufficient or modified concurrently'}), 409

        order_doc = {
            'user_token': user_id,
            'product_id': ObjectId(product_id),
            'quantity': quantity,
            'total_price': total_price,
            'status': 'pending',
            'orderedAt': datetime.utcnow()
        }
        db.orders.insert_one(order_doc)

        seller_id = product.get('user_token')
        seller = users.find_one({'_id': ObjectId(seller_id)})
        seller_email = seller.get('email')
        buyer = users.find_one({'_id': ObjectId(user_id)})

        if seller_email:
            try:
                msg = Message(
                    subject="🛒 New Order on Shopsy",
                    sender=current_app.config['MAIL_USERNAME'],
                    recipients=[seller_email]
                )
                msg.body = f"""Hello {seller.get('shopName', 'Seller')},

                    You have received a new order for your product: {product.get('name', 'Unnamed')}.

                    Order Details:
                    - Quantity: {quantity}
                    - Total Price: ₹{total_price}
                    - Buyer: {buyer.get('shopName', 'Unknown')}

                    Please check your dashboard to manage this order.

                    Regards,
                    Shopsy Team
                    """
                mail.send(msg)
            except Exception as e:
                print("Failed to send email:", e)
        return jsonify({'message': 'Order placed successfully'}), 201

    except Exception as e:
        return jsonify({'message': 'Error placing order', 'error': str(e)}), 500
    
@auth_bp.route("/api/notifications",methods=['GET'])
@cross_origin(origins='http://localhost:5173', supports_credentials=True)
def get_notifications():
    stock = db.stocks.find().sort('addedAt', -1)
    order = db.orders.find().sort('orderedAt', -1)

    logs = []

    for log in stock:
        logs.append({
            "type": "stock-added",
            "message": f"New stock added: {log.get('name', 'Unnamed')} ({log.get('quantity', 0)} units)",
            "timestamp": log.get("addedAt", datetime.utcnow())
        })

    for log in order:
        action = "placed" if log.get("status") == "success" else "pending" if log.get("status")== "pending" else "cancelled"
        logs.append({
            "type": f"order-{action}",
            "message": f"Order {action} for {log.get('product_name', 'Unknown Product')} ({log.get('quantity', 0)} units)",
            "timestamp": log.get("orderedAt", datetime.utcnow())
        })

    # Sort and format timestamps for frontend
    sorted_logs = sorted(logs, key=lambda x: x['timestamp'], reverse=True)
    for log in sorted_logs:
        if isinstance(log["timestamp"], datetime):
            log["timestamp"] = log["timestamp"].isoformat()

    return jsonify(notifications=sorted_logs)
