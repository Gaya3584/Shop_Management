from pymongo import MongoClient
from datetime import datetime
from config import MONGO_URI
from threading import Thread

# Connect to MongoDB
client = MongoClient(MONGO_URI)
db = client.shopsy

def stock_change_listener():
    print("Stock Change Listener started...")
    try:
        with db.stocks.watch() as stream:
            for change in stream:
                print("Stock change detected:", change)
                if change['operationType'] in ['update', 'insert']:
                    stock_id = change['documentKey']['_id']
                    stock = db.stocks.find_one({'_id': stock_id})
                    quantity = stock.get('quantity', 0)
                    min_threshold = stock.get('minThreshold', 0)
                    if quantity <= min_threshold:
                        notification = {
                            "userid": str(stock.get('user_token')),
                            "type": "stock-low",
                            "message": f"Stock '{stock.get('name')}' is low: {quantity} units left.",
                            "timestamp": datetime.utcnow(),
                            "readOrNot": False,
                            "reference_id": str(stock_id)  
                        }
                        existing = db.notifications.find_one({
                            "userid": notification["userid"],
                            "type": notification["type"],
                            "message": notification["message"],
                            "reference_id": notification["reference_id"]
                        })
                        if not existing:
                            db.notifications.insert_one(notification)
                            print("Inserted low stock notification.")
    except Exception as e:
        print("Stock listener error:", e)


def order_change_listener():
    print("Order Change Listener started...")
    try:
        with db.orders.watch() as stream:
            for change in stream:
                print("Order change detected:", change)
                if change['operationType'] in ['insert', 'update']:
                    order_id = change['documentKey']['_id']
                    order = db.orders.find_one({'_id': order_id})
                    status = order.get('status', 'unknown')
                    product_id = order.get('product_id')
                    product = db.stocks.find_one({'_id': product_id})
                    notification = {
                        "userid": str(order.get('user_token')),
                        "type": f"order-{status}",
                        "message": f"Order {status} for {product.get('name', 'Unnamed Product')}, quantity: {order.get('quantity')}.",
                        "readOrNot": False,
                        "timestamp": datetime.utcnow(),
                        "reference_id": str(order_id)  
                    }
                    existing = db.notifications.find_one({
                        "userid": notification["userid"],
                        "type": notification["type"],
                        "message": notification["message"],
                        "reference_id": notification["reference_id"]
                    })
                    if not existing:
                        db.notifications.insert_one(notification)
                        print("Inserted order notification.")
    except Exception as e:
        print("Order listener error:", e)


def start_listeners():
    Thread(target=stock_change_listener, daemon=True).start()
    Thread(target=order_change_listener, daemon=True).start()
