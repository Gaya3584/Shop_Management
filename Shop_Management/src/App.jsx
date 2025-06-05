import './App.css'
import SignUp from './components/SignUp'
import React from 'react'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Log from './components/login'
import Dash from './components/dash'
import Disc from './components/discover'
import Stock from './components/stock'
import Pro from './components/profile'
import Analysis from './components/analysis'
import Order from './components/orders'
import Help from './components/help';
import Settings from './components/settings';
import Notifications from './components/Notifications';
import Pass from'./components/forgot_pass';
import ResetPassword from './components/resetpass';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Log />} />
        <Route path="/signup" element={<SignUp />} />
        <Route path="/dash" element={<Dash />} />
        <Route path="/disc" element={<Disc />} />
        <Route path="/stock" element={<Stock />} />
        <Route path="/profile" element={<Pro />} />
        <Route path="/analysis" element={<Analysis />} />
        <Route path="/orders" element={<Order />} />
        <Route path="/help" element={<Help />} />
        <Route path="/settings" element={<Settings />} />
        <Route path="/notifications" element={<Notifications/>}/>
        <Route path='/forgot-password' element={<Pass/>}/>
        <Route path="/reset-password/:token" element={<ResetPassword />} />

      </Routes>
    </Router>
  );
}

export default App;


{/*import { useState } from 'react';

function App() {
  const [name, setName] = useState('');
  const [message, setMessage] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();

    const res = await fetch('http://localhost:5000/greet', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name }),
    });

    const data = await res.json();
    setMessage(data.message);
  };

  return (
    <div>
      <h1>Say Hello</h1>
      <form onSubmit={handleSubmit}>
        <input 
          type="text" 
          placeholder="Your name" 
          value={name} 
          onChange={(e) => setName(e.target.value)} 
        />
        <button type="submit">Send</button>
      </form>
      <h2>{message}</h2>
    </div>
  );
}

export default App;*/}

