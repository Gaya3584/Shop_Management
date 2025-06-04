from flask import Flask
from flask_cors import CORS
from config import SECRET_KEY, EMAIL_HOST, EMAIL_PASSWORD
from auth import auth_bp, init_mail

def create_app():
    app = Flask(__name__, static_folder='static')

    # Configuration
    app.config['SECRET_KEY'] = SECRET_KEY
    app.config['EMAIL_HOST'] = EMAIL_HOST  # SMTP server for sending emails
    app.config['EMAIL_PASSWORD'] = EMAIL_PASSWORD  # Password for the email account
    
    # Flask-Mail Configuration
    app.config['MAIL_SERVER'] = 'smtp.gmail.com'
    app.config['MAIL_PORT'] = 587
    app.config['MAIL_USE_TLS'] = True
    app.config['MAIL_USERNAME'] =  EMAIL_HOST # Replace with your email
    app.config['MAIL_PASSWORD'] = EMAIL_PASSWORD     # Replace with your app password
    app.config['MAIL_DEFAULT_SENDER'] = 'shopsy-email@gmail.com'
    
    # Initialize extensions
    init_mail(app)
    CORS(app, origins=["http://localhost:5174"], supports_credentials=True)
    
    # Register blueprints
    app.register_blueprint(auth_bp)
    
    return app

if __name__ == '__main__':
    app = create_app()
    app.run(debug=True)