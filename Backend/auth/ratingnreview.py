from flask import Blueprint, request, jsonify
from pymongo import MongoClient
from config import MONGO_URI
from flask_cors import cross_origin
from bson.objectid import ObjectId
from datetime import datetime
from . import auth_bp
client = MongoClient(MONGO_URI)
db = client.shopsy
stocks=db.stocks
orders=db.orders

@auth_bp.route('/api/reviews', methods=['POST','OPTIONS'])
@cross_origin(origins='http://localhost:5173', supports_credentials=True)
def add_review():
    data = request.json
    order_id = data.get('order_id')
    rating = data.get('rating')
    review = data.get('review')

    if not all([order_id, rating]):
        return jsonify({"error": "Missing fields"}), 400

    db.reviews.insert_one({
        "order_id": ObjectId(order_id),
        "rating": rating,
        "review": review,
        "createdAt": datetime.utcnow()
    })
    order=orders.find_one({'_id': ObjectId(order_id)})
    product_id=order.get("product_id")
    stocks.update_one(
    { '_id': product_id },  # ✅ Don't wrap again in ObjectId(...)
        {
            '$push': { 'reviews': review },
            '$set': {
                'rating': rating,
                'updatedAt': datetime.utcnow()
            }
        }
    )

    return jsonify({"message": "Review submitted successfully"}), 200
