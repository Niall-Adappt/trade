import { Position } from "../App";
import apiInstance from "./apiConfig";

const backendUrl = import.meta.env.VITE_BACKEND_URL;
const makeTransaction = async (
	symbol: string,
	quantity: number,
	type: "buy" | "sell",
  ): Promise<string> => {
	const backendUrl = import.meta.env.VITE_BACKEND_URL;
	const url = `${backendUrl}/stock/${type}/${symbol}`; 
  
	try {
	  const response = await apiInstance.post(url, { quantity });
	  const message = response.data.message; 
  
	  if (!message) {
		throw new Error("Transaction completed but no message returned");
	  }
  
	  return message;
	} catch (error) {
	  console.error(`Error making transaction (${type}) for ${symbol}:`, error);
	  throw new Error("Failed to complete transaction");
	}
  };

function getPositions(): Promise<Position[]> {
	return apiInstance
		.get("/user/holdings")
		.then((res) => {
			return res.data.positions;
		})
		.catch((err) => {
			console.log(err);
			if (err.response) {
				throw new Error(err.response.data.message);
			} else {
				throw new Error(err as string);
			}
		});
}

function editWatchlist(
	symbol: string,
	operation: "add" | "remove",
): Promise<string> {
	const backendUrl = import.meta.env.VITE_BACKEND_URL;
	const url = `${backendUrl}/user/watchlist/${operation}/${symbol}`
	return apiInstance
		.post(url)
		.then((res) => {
			return res.data.message;
		})
		.catch((err) => {
			if (err.response) {
				throw new Error(err.response.data.message);
			} else {
				throw new Error(err as string);
			}
		});
}

function getPortfolio(): Promise<{
	portfolioValue: number;
	portfolioPrevCloseValue: number;
	positions: Position[];
	cash: number;
}> {
	return apiInstance.get("/user/portfolio").then((res) => {
		return {
			portfolioValue: res.data.portfolioValue,
			portfolioPrevCloseValue: res.data.portfolioPrevCloseValue,
			positions: res.data.positions,
			cash: res.data.cash,
		};
	});
}
  
  const getBuyingPower = async (): Promise<number> => {
	const backendUrl = import.meta.env.VITE_BACKEND_URL;
	const url = `${backendUrl}/user/holdings`;
  
	try {
	  const response = await apiInstance.get(url);
	  const { cash } = response.data;
  
	  if (cash === undefined) {
		throw new Error("Incomplete data returned");
	  }
  
	  return cash ;
	} catch (error) {
	  console.error('Error fetching buying power and positions:', error);
	  throw new Error("Failed to fetch buying power and positions");
	} 
  };

const getAvailableShares = async (symbol: string): Promise<number> => {
	const backendUrl = import.meta.env.VITE_BACKEND_URL;
	const url = `${backendUrl}/user/holdings`;
  
	try {
	  const response = await apiInstance.get(url);
	  const { positions } = response.data;
  
	  if (!Array.isArray(positions)) {
		throw new Error("Positions data is not an array");
	  }

	  if(positions && positions.length === 0 ) return 0
  
	  // Sum up all the shares of the given symbol
	  const totalShares = positions.reduce((sum: number, position: Position) => {
		if (position.symbol.toUpperCase() === symbol.toUpperCase()) {
		  return sum + position.quantity;
		}
		return sum;
	  }, 0);
  
	  return totalShares;
	} catch (error) {
	  console.error('Error fetching available shares:', error);
	  throw new Error("Failed to fetch available shares");
	}
  };
  
const getTransactions = async (): Promise<any> => {
	const url = `${backendUrl}/user/transactions`;
	try {
		const result = await apiInstance.get(url) 
		return result
	} catch (error) {
		console.error('Error [getTransactions fetch]: ', error)
		throw new Error('Error [getTransactions fetch]')
	}
}

// function signup(
// 	username: string,
// 	password: string,
// 	turnstileToken: string,
// ): Promise<string> {
// 	return apiInstance
// 		.post("/auth/signup", {
// 			username,
// 			password,
// 			"cf-turnstile-response": turnstileToken,
// 		})
// 		.then((_) => {
// 			return "success";
// 		})
// 		.catch((err) => {
// 			throw new Error(err.response.data.message);
// 		});
// }

// function login(
// 	username: string,
// 	password: string,
// 	turnstileToken: string,
// ): Promise<string> {
// 	return apiInstance
// 		.post("/auth/login", {
// 			username,
// 			password,
// 			"cf-turnstile-response": turnstileToken,
// 		})
// 		.then((res) => {
// 			if (res.data.accessToken !== undefined) {
// 				// Store jwt and username in localStorage
// 				tokens.setTokenAndUsername(res.data.accessToken, username);
// 				return "success";
// 			} else {
// 				return "Invalid credentials.";
// 			}
// 		})
// 		.catch((err) => {
// 			if (err.response) {
// 				throw new Error(err.response.data.message);
// 			} else {
// 				throw new Error(err as string);
// 			}
// 		});
// }

export default {
	makeTransaction,
	getPositions,
	editWatchlist,
	getPortfolio,
	getBuyingPower,
	getAvailableShares,
	getTransactions
	// signup,
	// login,
};
