from flask import Flask
from flask_cors import CORS
from auth import auth_bp
import config

app = Flask(__name__)
app.config['SECRET_KEY'] = config.SECRET_KEY

CORS(app)  # Allow cross-origin requests from frontend

app.register_blueprint(auth_bp)

if __name__ == '__main__':
    app.run(debug=True)
'''
@app.route('/')
def index():
    return 'Hello World'

if __name__ == '__main__':
    app.run(host='0.0.0.0',debug=True)
    '''
