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
            'status': 'placed',
            'orderedAt': datetime.utcnow(),
            'shopName': product.get('shopName', 'Unknown'),
            'customerName': customer.get('ownerName', 'Unknown'),
            'emailNotifications':False,
            'localNotifications':False,
            'addedToStock': False  # New field to track stock addition

        }
        order_result=db.orders.insert_one(order_doc)

        seller_id = product.get('user_token')
        seller = users.find_one({'_id': ObjectId(seller_id)})
        seller_email = seller.get('email')
        buyer = users.find_one({'_id': ObjectId(user_id)})
        buyer_email=buyer.get('email')

        if seller_email:
            try:
                msg = Message(
                    subject="🛒 New Order for your product on Shopsy",
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

        if buyer_email:
            try:
                msg = Message(
                    subject="🛒 New Order on Shopsy",
                    sender=current_app.config['MAIL_USERNAME'],
                    recipients=[buyer_email]
                )
                msg.body = f"""Hello {buyer.get('shopName', 'Seller')},

                    You have ordered product: {product.get('name', 'Unnamed')}.

                    Order Details:
                    - Quantity: {quantity}
                    - Total Price: ₹{total_price}
                    - Seller: {seller.get('shopName', 'Unknown')}

                    Please check your dashboard to manage this order.

                    Regards,
                    Shopsy Team
                    """
                mail.send(msg)
            except Exception as e:
                print("Failed to send email:", e)
        db.orders.update_one(
        {"_id": ObjectId(order_result.inserted_id)},
        {"$set": {"emailNotifications": True}}
    )
        return jsonify({'message': 'Order placed successfully'}), 201

    except Exception as e:
        return jsonify({'message': 'Error placing order', 'error': str(e)}), 500
    
@auth_bp.route('/api/orders/add-to-stock', methods=['POST', 'OPTIONS'])
@cross_origin(origins='http://localhost:5173', supports_credentials=True)
def add_to_stock():
    """Add ordered items to user's stock"""
    try:
        user_token = request.cookies.get('token')
        user_id = decode_token(user_token)
        if not user_id:
            return jsonify({'message': 'Invalid or expired token'}), 401

        data = request.json
        order_id = data.get('order_id')

        if not order_id or not ObjectId.is_valid(order_id):
            return jsonify({'message': 'Invalid order ID'}), 400

        # Find the order
        order = orders.find_one({'_id': ObjectId(order_id), 'user_token': user_id})
        if not order:
            return jsonify({'message': 'Order not found'}), 404

        # Check if order is delivered
        if order.get('status') != 'delivered':
            return jsonify({'message': 'Order must be delivered before adding to stock'}), 400

        # Check if already added to stock
        if order.get('addedToStock', False):
            return jsonify({'message': 'Order items already added to stock'}), 400

        # Get the original product details
        product_id = order.get('product_id')
        original_product = stocks.find_one({'_id': ObjectId(product_id)})
        if not original_product:
            return jsonify({'message': 'Original product not found'}), 404

        # Check if user already has this product in their stock
        user_existing_product = stocks.find_one({
            'user_token': user_id,
            'name': original_product.get('name'),
            'category': original_product.get('category')
        })

        quantity_to_add = order.get('quantity', 0)

        if user_existing_product:
            # Update existing product quantity
            stocks.update_one(
                {'_id': user_existing_product['_id']},
                {'$inc': {'quantity': quantity_to_add}}
            )
            message = f"Added {quantity_to_add} units to existing product in your stock"
        else:
            # Create new product in user's stock
            new_stock_item = {
                'user_token': user_id,
                'name': original_product.get('name'),
                'category': original_product.get('category'),
                'price': original_product.get('price'),
                'quantity': quantity_to_add,
                'minThreshold': original_product.get('minThreshold', 5),
                'minOrder': original_product.get('minOrder', 1),
                'shopName': order.get('customerName', 'Unknown'),
                'addedAt': datetime.utcnow(),
                'description': original_product.get('description', ''),
                'image': original_product.get('image', '')
            }
            stocks.insert_one(new_stock_item)
            message = f"Added new product '{original_product.get('name')}' with {quantity_to_add} units to your stock"

        # Mark order as added to stock
        orders.update_one(
            {'_id': ObjectId(order_id)},
            {'$set': {'addedToStock': True}}
        )

        return jsonify({'message': message}), 200

    except Exception as e:
        return jsonify({'message': 'Error adding to stock', 'error': str(e)}), 500
    
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
@auth_bp.route('/api/orders/<order_id>/stock-status', methods=['GET'])
@cross_origin(origins='http://localhost:5173', supports_credentials=True)
def check_stock_status(order_id):
    """Check if an order has been added to stock"""
    try:
        user_token = request.cookies.get('token')
        user_id = decode_token(user_token)
        if not user_id:
            return jsonify({'message': 'Invalid or expired token'}), 401

        if not ObjectId.is_valid(order_id):
            return jsonify({'message': 'Invalid order ID'}), 400

        order = orders.find_one({'_id': ObjectId(order_id), 'user_token': user_id})
        if not order:
            return jsonify({'message': 'Order not found'}), 404

        added_to_stock = order.get('addedToStock', False)
        return jsonify({'addedToStock': added_to_stock}), 200

    except Exception as e:
        return jsonify({'message': 'Error checking stock status', 'error': str(e)}), 500


@auth_bp.route("/api/notifications",methods=['GET'])
@cross_origin(origins='http://localhost:5173', supports_credentials=True)
def get_notifications():
    stock = db.stocks.find().sort('addedAt', -1)
    order = db.orders.find().sort('orderedAt', -1)
    

    logs = []

    
    for log in stock:
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
        action = None
        if log.get("quantity") == log.get("minThreshold"):
            action = "low"
        elif is_just_now:
            action = "stock-added"
        if action: 
            logs.append({
                "type": f"stock-{action}",
                "message": f"{log.get('name', 'Unnamed')} - {log.get('quantity', 0)} units",
                "timestamp": added_at or now
            })

    for log in order:
        status = log.get("status")
        if status in ["pending", "placed"]:
            action = "placed"
        elif status == "cancelled":
            action = "cancelled"
        elif status == "delivered":
            action = "delivered"
        elif status == "rejected":
            action = "rejected"
        elif status == "accepted":
            action = "accepted"
        elif status == "dispatched":
            action = "dispatched"
        else:
            action = "unknown"
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

    return jsonify(count=len(sorted_logs), notifications=sorted_logs)


