import { useState } from 'react';
import { Routes, Route } from 'react-router-dom';
// import HomePage from './pages/HomePage';
import HomePage from './pages/homePage';
import PortfolioPage from './pages/portfolioPage';

import './App.css';

function App() {
  // const [count, setCount] = useState(0);

  return (
    <>
      {/* Nav bar here */}
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/portfolio" element={<PortfolioPage />} />
      </Routes>
    </>
  );
}

export default App;

