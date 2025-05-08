import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import PhoneNumberList from './pages/PhoneNumberList';
import PhoneNumberDetails from './pages/PhoneNumberDetails';
import './styles/main.css';

function App() {
  return (
    <Router>
      <div>
        <header className="header">
          <div className="container header-content">
            <h1>Numbering Plan Management</h1>
            <nav className="nav">
              <Link to="/" className="nav-link">All Numbers</Link>
              <Link to="/available" className="nav-link">Available Numbers</Link>
            </nav>
          </div>
        </header>

        <main className="container">
          <Routes>
            <Route path="/" element={<PhoneNumberList />} />
            <Route path="/available" element={<PhoneNumberList availableOnly />} />
            <Route path="/number/:id" element={<PhoneNumberDetails />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App; 