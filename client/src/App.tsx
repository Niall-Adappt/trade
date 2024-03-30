import { Routes, Route } from 'react-router-dom';
import { Link } from 'react-router-dom';

import HomePage from './pages/homePage';
import PortfolioPage from './pages/portfolioPage';
import './App.css';

function App() {

  return (
    <>
      <nav>
        <Link to="/">Home</Link> | <Link to="/portfolio">Portfolio</Link>   
      </nav>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/portfolio" element={<PortfolioPage />} />
      </Routes>
    </>
  );
}

export default App;
