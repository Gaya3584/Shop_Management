import './App.css'
import SignUp from './components/SignUp'
import React from 'react'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Log from './components/login'
import Dash from './components/dash'
import Disc from './components/discover'

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Log />} />
        <Route path="/signup" element={<SignUp />} />
        <Route path="/dash" element={<Dash />} />
        <Route path="/disc" element={<Disc />} />

      </Routes>
    </Router>
  );
}

export default App;
