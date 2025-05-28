from flask import Flask
from flask_cors import CORS
from auth import auth_bp
import config

app = Flask(__name__)
app.config['SECRET_KEY'] = config.SECRET_KEY

CORS(app, supports_credentials=True)
 
app.register_blueprint(auth_bp)
@app.route('/')
def home():
    return 'Welcome to the homepage!'

if __name__ == '__main__':
    app.run(debug=True)



'''@app.route('/')
def index():
    return 'Hello World'

if __name__ == '__main__':
    app.run(host='0.0.0.0',debug=True)
from flask import Flask, request, jsonify
from flask_cors import CORS

app = Flask(__name__)
CORS(app)  # allows React to connect

@app.route('/')
def home():
    return "Welcome to Flask! This is Lakshmi"

@app.route('/greet', methods=['POST'])
def greet():
    data = request.get_json()
    name = data.get('name', 'stranger')
    return jsonify(message=f"Hello, {name}!")

if __name__ == '__main__':
    app.run(debug=True)
    '''
