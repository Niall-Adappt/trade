import { lazy, Suspense } from "react";
import { Routes, Route } from 'react-router-dom';
import { Link } from 'react-router-dom';

const HomePage = lazy(() => import('@/pages/homePage')) 
const PortfolioPage = lazy(() => import('@/pages/portfolioPage')) 
const TradePage = lazy(()=> import('@/pages/tradePage'))
import './App.css';
import { Loader } from "lucide-react";

export type Transaction = {
	symbol: string;
	purchasePrice: number;
	quantity: number;
	date: Date;
	type: "buy" | "sell";
};

export type Position = {
	symbol: string;
	longName: string;
	purchasePrice: number;
	purchaseDate: Date;
	quantity: number;
	regularMarketPrice: number;
	regularMarketPreviousClose: number;
	regularMarketChangePercent: number;
};

function App() {

  return (
    <>
      <nav>
        <Link to="/">Home</Link> | <Link to="/portfolio">Portfolio</Link> 
      </nav>
	  <Suspense fallback={<Loader/>}>
		<Routes>
			<Route path="/" element={<HomePage />} />
			<Route path="/portfolio" element={<PortfolioPage />} />
			<Route path="/trade/:symbol" element={<TradePage />}/>
		</Routes>
	  </Suspense>

    </>
  );
}

export default App;
