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
      </Routes>
    </Router>
  );
}

export default App;
