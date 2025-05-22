import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import SignUp from '../src/components/SignUp';
import Login from '../src/components/login';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/signup" element={<SignUp />} />
        <Route path="/login" element={<Login />} />
        <Route path="*" element={<Login />} /> {/* fallback route */}
      </Routes>
    </Router>
  );
}

export default App;
