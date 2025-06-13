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

@auth_bp.route('/api/reviews', methods=['POST', 'OPTIONS'])
@cross_origin(origins='http://localhost:5173', supports_credentials=True)
def add_review():
    data = request.json
    order_id = data.get('order_id')
    rating = data.get('rating')
    review = data.get('review')

    if not all([order_id, rating]):
        return jsonify({"error": "Missing fields"}), 400

    existing_review = db.reviews.find_one({'order_id': ObjectId(order_id)})

    if existing_review:
        # ✅ Update existing review
        db.reviews.update_one(
            {'order_id': ObjectId(order_id)},
            {
                '$set': {
                    'rating': rating,
                    'review': review,
                    'isEditing': True,
                    'updatedAt': datetime.utcnow()
                }
            }
        )
        message = "Review updated successfully"
    else:
        # ✅ Insert new review
        db.reviews.insert_one({
            "order_id": ObjectId(order_id),
            "rating": rating,
            "review": review,
            'isEditing': False,
            "createdAt": datetime.utcnow()
        })
        message = "Review submitted successfully"

    # Update the product's rating and order's review status
    order = orders.find_one({'_id': ObjectId(order_id)})
    product_id = order.get("product_id")

    stocks.update_one(
        {'_id': product_id},
        {
            '$push': {'reviews': review},
            '$set': {
                'rating': rating,
                'updatedAt': datetime.utcnow()
            }
        }
    )


    orders.update_one(
        {'_id': ObjectId(order_id)},
        {'$set': {'hasReview': True}}
    )

    return jsonify({"message": message}), 200
@auth_bp.route('/api/reviews/<order_id>', methods=['GET'])
@cross_origin(origins='http://localhost:5173', supports_credentials=True)
def get_review(order_id):
    review = db.reviews.find_one({'order_id': ObjectId(order_id)})
    if not review:
        return jsonify({}), 404
    return jsonify({
        "rating": review.get("rating"),
        "review": review.get("review")
    }), 200

