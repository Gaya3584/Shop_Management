from flask import Blueprint
from flask_mail import Mail

<<<<<<< HEAD
from . import routes  # Registers routes
from . import stocks
=======
auth_bp = Blueprint('auth', __name__)
mail = Mail()

def init_mail(app):
    """Initialize mail with the Flask app"""
    mail.init_app(app)

from . import routes  # Registers routes
>>>>>>> 5fac0a3b5ff4cd8c24e0e9a7f5abc1a93df92764
