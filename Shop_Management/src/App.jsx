import './App.css'
import SignUp from './components/SignUp'
import React from 'react'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Log from './components/login'
import Dash from './components/dash'
import Footer from './components/footer'

function App() {
  return (
    <Router>
      <div className='main'>
        <Routes>
          <Route path="/" element={<><Log /><Footer /></>} />
          <Route path="/signup" element={<><SignUp /><Footer /></>} />
          <Route path="/dash" element={<><Dash /><Footer /></>} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
