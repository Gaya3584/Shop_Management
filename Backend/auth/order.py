from flask import request, jsonify
from flask_mail import Message
from flask import current_app
from flask_cors import cross_origin
from pymongo import MongoClient
from bson.objectid import ObjectId
from datetime import datetime, timedelta
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
        try:
            quantity = int(data.get('quantity', 0))
        except (TypeError, ValueError):
            return jsonify({'message': 'Invalid quantity format'}), 400
        try:
            total_price = float(data.get('totalPrice', 0))
        except (TypeError, ValueError):
            return jsonify({'message': 'Invalid total price format'}), 400
        # customer_id = data.get('shopName')
        customer = users.find_one({'_id': ObjectId(user_id)})
        # customer_id = customer.get('shopName', 'Unknown') if customer else 'Unknown'
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
        # user2 = stocks.find_one({'_id': ObjectId(user_id)})
        # shop_name = user2.get('shopName', 'Unknown') if user2 else 'Unknown'
        order_doc = {
            'user_token': user_id,
            'product_id': ObjectId(product_id),
            'product_name': product.get('name', 'Unnamed'),
            'quantity': quantity,
            'total_price': total_price,
            'status': 'pending',
            'orderedAt': datetime.utcnow(),
            'shopName': product.get('shopName', 'Unknown'),
            'customerName': customer.get('ownerName', 'Unknown') 
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
    
@auth_bp.route('/api/orders/purchases', methods=['GET'])
def get_purchases():
    try:
        user_token = request.cookies.get('token')
        user_id = decode_token(user_token)                                          #searches database orders for cookies=>token=>orders=>user_token in orders
        if not user_id:
            return jsonify({'message': 'Invalid or expired token'}), 401
        
        orders = list(db.orders.find({'user_token': user_id}))
        for order in orders:
            order['_id'] = str(order['_id'])
            order['product_id'] = str(order['product_id'])
            product = db.stocks.find_one({'_id': ObjectId(order['product_id'])})
            user_inst=db.users.find_one({'_id':ObjectId(product.get("user_token"))})
            user_in=db.users.find_one({'_id':ObjectId(order["user_token"])})
            order['name'] = product.get('name', 'No Name')
            order['shopPhone']=user_inst.get('phone',"empty")
            order['customerAddress']=user_in.get('shopLocation',"NIL")
            order['customerPhone']=user_in.get('phone',"NULL")
        
        return jsonify({'buyingOrders': orders}), 200

    except Exception as e:
        return jsonify({'message': 'Error fetching purchases', 'error': str(e)}), 500
    
@auth_bp.route('/api/orders/sales', methods=['GET'])
def get_sales():
    try:
        user_token = request.cookies.get('token')
        user_id = decode_token(user_token)                                          
        if not user_id:
            return jsonify({'message': 'Invalid or expired token'}), 401

        # Step 1: Find all product IDs the user owns
        user_product_cursor = db.stocks.find({'user_token': user_id}, {'_id': 1})                   #searches database orders for cookies=>token=>(orders=>product_id=>stokcks =>_id=>user_token) 
        user_product_ids = [product['_id'] for product in user_product_cursor]
        

        # Step 2: Find orders where product_id is in user's product list
        sales_cursor = db.orders.find({'product_id': {'$in': user_product_ids}})
        sales = []
        for sale in sales_cursor:
            sale['_id'] = str(sale['_id'])
            sale['product_id'] = str(sale['product_id'])
            product = db.stocks.find_one({'_id': ObjectId(sale['product_id'])})
            user_inst=db.users.find_one({'_id':ObjectId(product.get("user_token"))})
            user_in=db.users.find_one({'_id':ObjectId(sale["user_token"])})
            sale['name'] = product.get('name', 'No Name')
            sale['shopPhone']=user_inst.get('phone',"empty")
            sale['customerAddress']=user_in.get('shopLocation',"NIL")
            sale['customerPhone']=user_in.get('phone',"NULL")
            sales.append(sale)

        return jsonify({'sellingOrders': sales}), 200

    except Exception as e:
        return jsonify({'message': 'Error fetching sales', 'error': str(e)}), 500
    
@auth_bp.route('/api/orders/<order_id>/status', methods=['PATCH'])
def update_order_status(order_id):
    try:
        data = request.json
        new_status = data.get('status')

        if not new_status:
            return jsonify({'message': 'Status is required'}), 400

        result = db.orders.update_one(
            {'_id': ObjectId(order_id)},
            {'$set': {'status': new_status}}
        )

        if result.modified_count == 0:
            return jsonify({'message': 'No order updated'}), 404

        return jsonify({'message': 'Order status updated'}), 200

    except Exception as e:
        return jsonify({'message': 'Error updating order', 'error': str(e)}), 500

@auth_bp.route("/api/notifications",methods=['GET'])
def get_notifications():
    stock = db.stocks.find().sort('addedAt', -1)
    order = db.orders.find().sort('orderedAt', -1)
    

    logs = []

    added_at = log.get("addedAt")
    now = datetime.utcnow()

    # Consider it "just added" if it's within the last 5 seconds
    is_just_now = False
    if added_at:
        try:
            # Handle both datetime objects and strings
            added_at_dt = added_at if isinstance(added_at, datetime) else datetime.fromisoformat(added_at)
            is_just_now = abs((now - added_at_dt).total_seconds()) < 5
        except Exception as e:
            print("Invalid addedAt format:", added_at)

    # Determine action
    if log.get("quantity") == log.get("minThreshold"):
        action = "low-stock"
    elif is_just_now:
        action = "stock-added"

    for log in stock:
        logs.append({
            "type": f"stock-{action}",
            "message": f"{log.get('name', 'Unnamed')} - {log.get('quantity', 0)} units",
            "timestamp": added_at or now
        })

    for log in order:
        action = "placed" if log.get("status") == "success" else "pending" if log.get("status")== "pending" else "cancelled"
        product_id = log.get('product_id')
        product = stocks.find_one({'_id': ObjectId(product_id)})
        logs.append({
            "type": f"order-{action}",
            "message": f"Order {action} for {product.get('name', 'Unknown Product')} ({log.get('quantity', 0)} units)",
            "timestamp": log.get("orderedAt", datetime.utcnow())
        })

    # Sort and format timestamps for frontend
    sorted_logs = sorted(logs, key=lambda x: x['timestamp'], reverse=True)
    for log in sorted_logs:
        if isinstance(log["timestamp"], datetime):
            log["timestamp"] = log["timestamp"].isoformat()

    return jsonify(notifications=sorted_logs)
