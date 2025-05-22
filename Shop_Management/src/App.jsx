import './App.css'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Log from './components/login'
import Dash from './components/dash'

function App() {

  return (
    <>
      <Router>
      <Routes>
        <Route path="/" element={<Log />} /> {/* optional */}
        <Route path="/dashboard" element={<Dash />} />
      </Routes>
    </Router>
    </>
  )
}

export default App
