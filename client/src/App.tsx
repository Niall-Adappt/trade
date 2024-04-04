import { lazy, Suspense } from "react";
import { Routes, Route } from 'react-router-dom';
import { Link } from 'react-router-dom';

const HomePage = lazy(() => import('@/pages/homePage')) 
const PortfolioPage = lazy(() => import('@/pages/portfolio/portfolioPage')) 
const TradePage = lazy(()=> import('@/pages/tradePage'))
import './App.css';
import { Loader } from "lucide-react";
import { Heading } from "./components/ui/heading";
import SignInPage from "./pages/signInPage";

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
	<Heading title={'$tockker'} description={''}/>
      <nav className="pt-3">
        <Link to="/">Home</Link> | <Link to="/portfolio">Portfolio</Link> | <Link to="/signin">Sign in</Link> 
      </nav>
	  <Suspense fallback={<Loader/>}>
		<Routes>
			<Route path="/" element={<HomePage />} />
			<Route path="/portfolio" element={<PortfolioPage />} />
			<Route path="/trade/:symbol" element={<TradePage />}/>
			<Route path="/signin" element={<SignInPage />} />
		</Routes>
	  </Suspense>

    </>
  );
}

export default App;
