from flask import Flask
from flask_cors import CORS
from auth import auth_bp
import config

app = Flask(__name__)
app.config['SECRET_KEY'] = config.SECRET_KEY

CORS(app)
 
app.register_blueprint(auth_bp)
@app.route('/')
def home():
    return 'Welcome to the homepage!'

if __name__ == '__main__':
    app.run(debug=True)

