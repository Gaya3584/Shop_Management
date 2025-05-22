import './SignUp.css';
import { Link } from 'react-router-dom';

function SignUp() {
  return (
    <div className="signupContainer">
      <div className="rightPane">
        <div className="holographic-card">
          <form className="signupForm">
            <h1 id="heading">Register/Sign Up</h1>
            <p>Welcome To Shopsy! Register now</p>

            <label>Shop Owner Name:</label>
            <input type="text" placeholder="Enter your full name: Example: John Doe" />

            <label>Shop Name:</label>
            <input type="text" placeholder="Enter your shop name: Example: Aishwarya Bakery" />

            <label>Shop Type:</label>
            <select id="shopType" name="shopType">
              <option value="">--Select Whole-Sale/Retail--</option>
              <option value="Whole-Sale">Whole-Sale</option>
              <option value="Retail">Retail</option>
            </select>

            <label>Email:</label>
            <input type="email" placeholder="Eg: useremail@something.com" />

            <label>Phone Number:</label>
            <input type="tel" placeholder="10 digit number Eg:8086370637" pattern="[0-9]{10}" />

            <label>Set Password:</label>
            <input type="password" placeholder="Enter a strong password that you can remember" />

            <label>Confirm Password:</label>
            <input type="password" placeholder="Retype previous password to confirm" />

            <button type="submit">Submit</button>

            <label id="toLogin">
              Already have an account? Go to <Link to ="/login">Login</Link>
            </label>
          </form>
        </div>
      </div>
    </div>
  );
}

export default SignUp;
