
import './App.css'
import SignUp from './components/SignUp'
import React from 'react'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Log from './components/login'
import Dash from './components/dash'


function App() {
  return (

    <>
      <Log />
      <SignUp /> 
      <Router>
      <Routes>
        <Route path="/" element={<Log />} /> {/* optional */}
        <Route path="/dashboard" element={<Dash />} />
      </Routes>
    </Router>
    </>
  )

}

export default App;
