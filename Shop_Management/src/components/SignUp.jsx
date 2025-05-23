import './SignUp.css';
import { Link } from 'react-router-dom';

function SignUp() {
    const [formData, setFormData] = useState({
    name: '',
    shopName: '',
    shopType: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: ''
  });

  const [errors, setErrors] = useState({});

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: '' }));
  };

  const validate = () => {
    const newErrors = {};
    if (!formData.name.trim()) newErrors.name = 'Name is required';
    if (!formData.shopName.trim()) newErrors.shopName = 'Shop Name is required';
    if (!formData.shopType) newErrors.shopType = 'Please select shop type';
    if (!formData.email || !/\S+@\S+\.\S+/.test(formData.email)) newErrors.email = 'Valid email required';
    if (!formData.phone || !/^\d{10}$/.test(formData.phone)) newErrors.phone = 'Enter a valid 10-digit phone number';
    if (formData.password.length < 6) newErrors.password = 'Password must be at least 6 characters';
    if (formData.password !== formData.confirmPassword) newErrors.confirmPassword = 'Passwords do not match';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validate()) return;
    // Proceed with signup logic
    console.log('Signup success', formData);
  };

  return (
    <div className="signupContainer">
      <div className="rightPane">
        <div className="holographic-card">
          <form className="signupForm">
            <h1 id="heading">Register/Sign Up</h1>
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
