import { add, sub, formatISO } from 'date-fns'; // Assuming date-fns is used for date calculations
import Cache from "node-cache";
import axios from "axios";
const stockCache = new Cache({ stdTTL: 60 }); // 1 minute
const stockCachePolygon = new Cache({ stdTTL: 3600 }); // 1 hr
const Alpaca = require("@alpacahq/alpaca-trade-api");
import dotenv from "dotenv";
import prismadb from '../config/prismaClient';

dotenv.config();
const alpaca = new Alpaca({
  keyId: "PKRBDSJL8TZ35Q4XQG3X" ,
  secretKey: "JUOGY39DoTXS6X5KaUicMZ4kyhZGy65",
  paper: true, 
}) //auto retrieves data from .env to create alpaca client

export const fetchPolygonStockData = async (symbol: string): Promise<any> => {
	const cacheKey = symbol + "-quote";
	const POLYGON_API_KEY = process.env.POLYGON_API_KEY

	try {
		if (stockCachePolygon.has(cacheKey)) {
			return stockCachePolygon.get(cacheKey);
		} else {
			const companyInfo = await axios(`https://api.polygon.io/v1/meta/symbols/${symbol}/company?&apiKey=${POLYGON_API_KEY}`)
			const {name, logo, sector } = companyInfo as any

			return  {name, logo, sector}
		}
		
	} catch (error) {
		console.log("Error [fetchPolygonStockData]: ", error)
		return null
	}
}

export const fetchAlpacaStockData = async (symbol: string): Promise<any> => {
	const cacheKey = symbol + "-quote"

	const alpaca = new Alpaca({
		keyId: "PKZQ6SWXJEJAHODG2IAN" ,
		secretKey: "8ghKj8yOcBEmF7DCnaRdKBsDYNq5NkJsvebVc67a",
		paper: true, 
		}) 

	try {
		if (stockCache.has(cacheKey)) {
			return stockCache.get(cacheKey);
		} else {
			const snapshot = await alpaca.getSnapshot(symbol)

			const regularMarketPrice = snapshot.LatestTrade.Price;
			const regularMarketPreviousClose = snapshot.PrevDailyBar.ClosePrice;
			const regularMarketPreviousOpen = snapshot.PrevDailyBar.OpenPrice;
			// Calculate the percentage change from the previous close to the latest price
			const regularMarketChangePercent = ((regularMarketPrice - regularMarketPreviousClose) / regularMarketPreviousClose) * 100;
	  
			const stockData = {
				symbol,
				// longName: symbol, // fetching from another source if necessary
				regularMarketPrice,
				regularMarketPreviousClose,
				regularMarketPreviousOpen,
				regularMarketChangePercent: regularMarketChangePercent.toFixed(2), // Formatting to 2 decimal places for consistency
			  };

			stockCache.set(cacheKey, stockData);
			return stockData;
		}
	} catch (err: any) {
		console.error("Error [fetchStockData] " + symbol + " stock data:", err);
		throw new Error(err);
	}
};

export const fetchAlpacaStocksData = async (symbols: string[]): Promise<any[]> => {
	const alpaca = new Alpaca({
		keyId: "PKRBDSJL8TZ35Q4XQG3X" ,
		secretKey: "JUOGY39DoTXS6X5KaUicMZ4kyhZGy65",
		paper: true, 
		}); // Auto retrieves data from .env to create alpaca client
	const results = [];
	const symbolsToFetch = symbols.filter(symbol => !stockCache.has(symbol + "-quote"));

	// Add cached data to results
	symbols.filter(symbol => stockCache.has(symbol + "-quote"))
	.forEach(cachedSymbol => {
		const cacheKey = cachedSymbol + "-quote";
		results.push(stockCache.get(cacheKey));
	});
  
	// If there are symbols to fetch, use alpaca.getSnapshot to fetch them in a single call
	if (symbolsToFetch.length > 0) {
	  try {
		const snapshots = await alpaca.getSnapshots(symbolsToFetch); // returns an object with symbol keys?
		// const logos = await alpaca.getLogos(symbolsToFetch)
		// console.log('utils/requests.ts fetchStocksData logos: ', logos)

		for (const symbol of symbolsToFetch) {
		  const snapshot = snapshots[symbol]; // Adjust based on the actual structure of the response
		  const regularMarketPrice = snapshot.LatestTrade.Price;
		  const regularMarketPreviousClose = snapshot.PrevDailyBar.ClosePrice;
		  const regularMarketChangePercent = ((regularMarketPrice - regularMarketPreviousClose) / regularMarketPreviousClose) * 100;
  
		  const stockData = {
			symbol,
			regularMarketPrice,
			regularMarketPreviousClose,
			regularMarketChangePercent: regularMarketChangePercent.toFixed(2),
		  };
  
		  const cacheKey = symbol + "-quote";
		  stockCache.set(cacheKey, stockData);
		  results.push(stockData);
		}
	  } catch (err) {
		console.error("Error fetching stock data for multiple symbols:", err);
		// Handle the error according to your application's needs, perhaps by marking the failed symbols
		symbolsToFetch.forEach(symbol => results.push({ symbol, error: "Failed to fetch data" }));
	  }
	}
  
	return results; // Return combined results from cache and new fetches
  };

  // determine the timeframe and limit based on the period
  function getTimeframeAndLimit(period: string) {
	switch (period) {
	  case "1d":
		return { timeframe: alpaca.newTimeframe(1, alpaca.timeframeUnit.MIN), limit: 390 }; // Market hours (6.5 hours * 60 min/hour)
	  case "5d":
		return { timeframe: alpaca.newTimeframe(5, alpaca.timeframeUnit.MIN), limit: 390 * 5 };
	  case "1m":
		return { timeframe: alpaca.newTimeframe(30, alpaca.timeframeUnit.MIN), limit: 20 * 21 }; // Approx. 20 trading days in a month
	  case "6m":
	  case "YTD":
	  case "1y":
		return { timeframe: alpaca.newTimeframe(1, alpaca.timeframeUnit.DAY), limit: 365 }; // Daily bars
	  case "all":
		return { timeframe: alpaca.newTimeframe(1, alpaca.timeframeUnit.DAY), limit: 1000 }; // Adjust based on your needs
	  default:
		return { timeframe: alpaca.newTimeframe(1, alpaca.timeframeUnit.DAY), limit: 365 };
	}
  }

  function getStartEndDates(period: string): { startDate: string, endDate: string } {
	const today = new Date();
	const yesterday = new Date(today);
	yesterday.setDate(yesterday.getDate() - 1);
	
	let startDate;
	
	switch (period) {
	  case "1d":
		// Subtract 1 day from yesterday for the start date
		startDate = sub(yesterday, { days: 1 });
		break;
	  case "5d":
		// Subtract 5 days from yesterday for the start date
		startDate = sub(yesterday, { days: 5 });
		break;
	  case "1m":
		// Subtract 1 month from yesterday for the start date
		startDate = sub(yesterday, { months: 1 });
		break;
	  case "6m":
		// Subtract 6 months from yesterday for the start date
		startDate = sub(yesterday, { months: 6 });
		break;
	  case "YTD":
		// Start of the current year
		startDate = new Date(yesterday.getFullYear(), 0, 1);
		break;
	  case "1y":
		// Subtract 1 year from yesterday for the start date
		startDate = sub(yesterday, { years: 1 });
		break;
	  case "all":
		// Assuming 'all' represents a significant historical period, like 5 years back from yesterday
		startDate = sub(yesterday, { years: 5 });
		break;
	  default:
		// Default case if none of the above periods are matched
		startDate = sub(yesterday, { years: 1 });
	}
	return {
	  startDate: formatISO(startDate),
	  endDate: formatISO(yesterday) // End date is considered as yesterday
	};
  }
  
  export const fetchHistoricalStockData = async (symbol: string, period: "1d" | "5d" | "1m" | "6m" | "YTD" | "1y" | "all" = "1d"): Promise<any> => {
	
	const { timeframe, limit } = getTimeframeAndLimit(period);
	const cacheKey = `${symbol}-historical-${period}`;
	const secretKey = process.env.APCA_API_SECRET_KEY
	const keyId = process.env.APCA_API_KEY_ID

	const alpaca = new Alpaca({
		keyId: keyId ,
		secretKey: secretKey,
		paper: true, 
	  })
  
	try {
	  if (stockCache.has(cacheKey)) {
		return stockCache.get(cacheKey);
	  } else {
		// const endDate = new Date(); //current date
		// const startDate = getStartDate(period);
		const {startDate, endDate} = getStartEndDates(period)

		const bars = alpaca.getBarsV2(symbol, {
		  start: startDate, 
		  end: endDate,
		  timeframe: timeframe,
		  limit: limit,
		});
		const formattedData = [];
		for await (let bar of bars) {
		  formattedData.push({
			Timestamp: bar.Timestamp,
			OpenPrice: bar.OpenPrice,
			HighPrice: bar.HighPrice,
			LowPrice: bar.LowPrice,
			ClosePrice: bar.ClosePrice,
			Volume: bar.Volume,
			VWAP: bar.VWAP,
		  });
		}
		stockCache.set(cacheKey, formattedData);
		return formattedData;
	  }
	} catch (error) {
	  console.error(`Error fetching historical data for ${symbol} - ${period}:`, error);
	  return [];
	}
  }; 

// export const fetchHistoricalStockData = async (
// 	symbol: string,
// 	period: "1d" | "5d" | "1m" | "6m" | "YTD" | "1y" | "all" = "1d",
// ): Promise<any> => {
// 	const periodTerm =
// 		period === "1d" || period === "5d" || period === "1m" ? "short" : "long";
// 	const cacheKey = symbol + "-historical-" + periodTerm;

// 	try {
// 		if (stockCache.has(cacheKey)) {
// 			return stockCache.get(cacheKey);
// 		} else {
// 			let formattedData: number[][] = [];

// 			if (periodTerm == "short") {
// 				// If the period is less than 1 month, use intraday data from Alpha Vantage
// 				let res = await axios.get(
// 					"https://www.alphavantage.co/query?function=TIME_SERIES_INTRADAY&symbol=" +
// 						symbol +
// 						"&interval=15min&extended_hours=true&outputsize=full&apikey=" +
// 						process.env.STOTRA_ALPHAVANTAGE_API,
// 				);
// 				const alphaData = res.data["Time Series (15min)"];

// 				if (!alphaData) {
// 					return fetchHistoricalStockData(symbol, "6m");
// 				}

// 				formattedData = Object.keys(alphaData)
// 					.map((key) => {
// 						return [
// 							new Date(key).getTime(),
// 							parseFloat(alphaData[key]["4. close"]),
// 						];
// 					})
// 					.sort((a, b) => a[0] - b[0]);
// 			} else {
// 				const yahooData = await yahooFinance.historical(symbol, {
// 					period1: "2000-01-01",
// 					interval: "1d",
// 				});

// 				formattedData = yahooData.map(
// 					(data: { date: { getTime: () => any }; close: any }) => {
// 						return [data.date.getTime(), data.close];
// 					},
// 				);
// 			}
// 			stockCache.set(cacheKey, formattedData);
// 			return formattedData;
// 		}
// 	} catch (error) {
// 		console.error("Error fetching " + symbol + " historical data:", error);
// 		return null;
// 	}
// };

// export const searchStocks = async (query: string): Promise<any> => {
// 	const queryOptions = {
// 		newsCount: 0,
// 		enableFuzzyQuery: true,
// 		enableNavLinks: false,
// 		enableCb: false,
// 		enableEnhancedTrivialQuery: false,
// 	};

// 	return yahooFinance
// 		.search(query, queryOptions)
// 		.then((results) => {
// 			return results.quotes;
// 		})
// 		.catch((err) => {
// 			if (err.result && Array.isArray(err.result.quotes)) {
// 				return err.result.quotes;
// 			} else {
// 				console.error(err);
// 				throw new Error(err);
// 			}
// 		});
// };

export const searchAssets = async function (searchString: string): Promise<any[]> {
	const alpaca = new Alpaca({
		keyId: "PKZQ6SWXJEJAHODG2IAN" ,
		secretKey: "8ghKj8yOcBEmF7DCnaRdKBsDYNq5NkJsvebVc67a",
		paper: true, 
	  }) 
	try {
	  const assets = await alpaca.getAsset({
		asset: searchString,
	  });
  
	  return assets;
	} catch (error) {
	  console.error('Error searching assets:', error);
	  throw new Error('Failed to search assets');
	}
  }

export const getAllAssets = async function (searchString?: string): Promise<any[]> {
	const alpaca = new Alpaca({
		keyId: "PKZQ6SWXJEJAHODG2IAN" ,
		secretKey: "8ghKj8yOcBEmF7DCnaRdKBsDYNq5NkJsvebVc67a",
		paper: true, 
	  }) 
	try {
	  // Fetch all assets that are tradable. You might adjust the status or other filters as needed.
	  const allAssets = await alpaca.getAssets({searchString});
	  if(!searchString) return allAssets
	  // Filter assets based on the search string. Adjust the criteria as necessary.
	  const filteredAssets = allAssets.filter((asset:any) =>
		asset.symbol.includes(searchString.toUpperCase()) || (asset.name && asset.name.toUpperCase().includes(searchString.toUpperCase()))
	  );
  
	  return filteredAssets;
	} catch (error) {
	  console.error('Error searching assets:', error);
	  throw new Error('Failed to search assets');
	}
  }

  export interface StockTickerSearchList {
	ticker: string,
  };
  
  export const getTickerSearchList = async (value: string): Promise<StockTickerSearchList[]> => {
	try {
	  if (!value) throw new Error("No value provided");

      const url = `https://api.polygon.io/v3/reference/tickers?market=stocks&search=${value}&active=true&sort=ticker&order=asc&limit=10&apiKey=${process.env.POLYGON_API_KEY}`;  
	
	  const response = await axios.get(url);
	  const { results } = response.data;
  
	  if (!results?.length) throw new Error("No results found");
  
	  return results;
	} catch (error) {
	  throw new Error("Failed to fetch stock tickers");
	}
  };

  export const botBuyStock = async (symbol: string) => {

	const quantity = 5

    if(!symbol || !quantity ) return { message: "No params provided" }

	try {
		const data = await fetchAlpacaStockData(symbol);
		const price = data.regularMarketPrice;

        let user = await prismadb.user.findUnique({
            where: { id: 'a41b086d-e465-40d5-80a8-ed0bd048f8fe' }, //HARDCODED BOT TO USER ID!!!
            include: { ledger: true }, 
        });
		user = user!;
        const id = user.id
        if (!user) return { message: "User not found" };
		if (user.cash! < price * quantity) {
			return { message: "Not enough cash" };
		} else {
			const cashUpdated = user.cash! - price * quantity;
            await prismadb.user.update({
                where: { id: user.id },
                data: { cash: cashUpdated },
              });
  
            // Update/Create Position
            let positionId: string;

            const existingPosition = await prismadb.position.findFirst({
            where: { userId: id, symbol },
            });

            if (existingPosition) {
            const newTotalQuantity = existingPosition.quantity + quantity;
            const newAveragePurchasePrice = ((existingPosition.avgPurchasePrice * existingPosition.quantity) + (price * quantity)) / newTotalQuantity;
            
            const updatedPosition = await prismadb.position.update({
                where: { id: existingPosition.id },
                data: {
                quantity: newTotalQuantity,
                avgPurchasePrice: newAveragePurchasePrice, // Update the purchasePrice to the new average
                },
            });
            positionId = updatedPosition.id;
            } else {
            const newPosition = await prismadb.position.create({
                data: {
                symbol,
                avgPurchasePrice: price, 
                quantity,
                userId: id,
                },
            });
            positionId = newPosition.id; 
            }
            // Create Transaction Record
            await prismadb.transaction.create({
                data: {
                symbol,
                price,
                quantity,
                type: "buy",
                userId: id,
                positionId,
                },
            });
            return {message: 'successful transacation'}
		}
	} catch (error) {
		console.error("Error [botBuyStock]" + symbol + " stock data:", error);
	}
};