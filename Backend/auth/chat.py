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
import nltk
from nltk.tokenize import word_tokenize


client = MongoClient(MONGO_URI)
db = client.shopsy
users = db.users
stocks = db.stocks
contact=db.contact
    
def generate_response(message):
    message = message.lower()
    tokens = word_tokenize(message)

    if "hi" in tokens or "hello" in tokens or "hey" in tokens:
        return random.choice(["Hi there!😄", "Hello!😄", "Hey! How can I help?😄"])   
    elif "bye" in tokens or "good bye" in tokens:
        return "Goodbye! Have a great day👋😄"
    elif "thanks" in tokens or "thank you" in tokens:
        return "Welcome!"
    elif "analyse" in tokens or "analysis" in tokens or "report" in tokens:
        return "Check it out on 'Analysis' page in dashboard.You can get weekly reports of your sales there."
    elif "profile" in tokens:
        return "View profile by clicking on the profile icon or image of your's on left sidebar. Happy Shopping!😊"
    elif "delete account" in tokens:
        return "You can delete your account in settings page. It will permanantly delete your account!⚠️"
    elif "notification" in tokens:
        return "You will get notified when someone places order for your products also about the orders you have placed through EMAIL📧. You can view notifications in the website as well."
    elif "help" in tokens:
        return "Our contact support is always there to help you send them a message through the contact page."
    elif "order" in tokens:
        return "Check Orders page from sidebar to view your orders, your sales and its status!"
    elif "low stock" in message or "running out" in message:
    # Get user_token from cookie or header
        user_token = request.cookies.get('token') or request.headers.get('Authorization','').replace('Bearer ', '')
        if not user_token:
            return "⚠️ Please log in to check your low stock items."

        decoded = decode_token(user_token)
        user_token_id = decoded  # This is already the user ID string
        if not user_token_id:
            return "❌ Invalid token. Please log in again."

        # Find items where quantity <= minThreshold
        low_stock_items = stocks.find({
            "user_token": user_token_id,
            "$expr": { "$lte": ["$quantity", "$minThreshold"] }
        })

        item_list = [item.get("name", "Unnamed") for item in low_stock_items]
    
        if not item_list:
            return "✅ All your products are sufficiently stocked!"

        return (
            f"⚠️ You have {len(item_list)} low stock item(s):\n" +
            ", ".join(item_list[:5]) + ("..." if len(item_list) > 5 else "")
        )
    elif "stock" in tokens:
            return "Check it out on 'Veiw My Stocks' on dashboard page. You can add, update and delete your stocks there."
    else:
        return "🤔Sorry, I'm not sure how to help with that yet, but I'm learning! You can send your doubts through our contact support page😊"

@auth_bp.route('/api/chat', methods=['POST'])
@cross_origin(origins=["http://localhost:5173"], supports_credentials=True)
def chat():
    data = request.get_json()
    user_msg = data.get('message', '')
    reply = generate_response(user_msg)
    return jsonify({"reply": reply})