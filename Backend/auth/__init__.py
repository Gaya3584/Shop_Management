from flask import Blueprint
from flask_mail import Mail
auth_bp = Blueprint('auth', __name__)
mail = Mail()

def init_mail(app):
    """Initialize mail with the Flask app"""
    mail.init_app(app)

from . import routes  # Registers routes
from . import stocks

