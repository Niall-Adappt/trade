import { Request, Response } from "express";

import {
	fetchAlpacaStockData,
    fetchAlpacaStocksData,
	fetchHistoricalStockData,
    getTickerSearchList,
    getAllAssets,
    searchAssets,
    fetchPolygonStockData,
} from "../utils/requests";
import prismadb from "../config/prismaClient";

const getStockData = async (req: Request, res: Response) => {
    let symbol =req.params.symbol 
    try {
      if (!symbol) {
        return res.status(400).send({ message: "No symbol provided" });
      }
      const stockDataAlpaca = await fetchAlpacaStockData(symbol);
    //   const stockDataPolygon = await fetchPolygonStockData(symbol)
      
      const combinedData = {
        // name: stockDataPolygon.name  || '', // From Polygon
        // logo: stockDataPolygon.logo || '', // From Polygon
        // sector: stockDataPolygon.sector || '', // From Polygon
        symbol: stockDataAlpaca.symbol, // From Alpaca
        price: stockDataAlpaca.regularMarketPrice, // From Alpaca
        prevClose: stockDataAlpaca.regularMarketPreviousClose, // From Alpaca
        prevOpen: stockDataAlpaca.regularMarketPreviousOpen,
        changePercent: stockDataAlpaca.regularMarketChangePercent
      };

      res.status(200).send(combinedData);

    } catch (error) {
        console.log('Error [getStockData]: ', error);
      return res.status(400).send({ message: "Invalid symbol format" });
    }
  

  };
  

const getHistorical = async (req: Request, res: Response) => {

	const symbol = req.params.symbol;
	const period = req.query.period?.toString() as
		| "1d"
		| "5d"
		| "1m"
		| "6m"
		| "YTD"
		| "1y"
		| "all"
		| undefined;

    console.log('gethistorical period: ', period)
    if(!symbol || !period ) return res.status(400).send({ message: "No params provided" })
	try {
		const historicalData = await fetchHistoricalStockData(symbol, period);
		res.status(200).send(historicalData);
	} catch (error) {
		console.error("Error [getHistorical] " + symbol + "historical stock data:", error);
		res.status(500).send("Error fetching " + symbol + " stock data:" + error);
	}
};

const buyStock = async (req: Request, res: Response) => {

	const symbol = req.params.symbol;
	const quantity = req.body.quantity;

    if(!symbol || !quantity ) return res.status(400).send({ message: "No params provided" })

	try {
		const data = await fetchAlpacaStockData(symbol);
		const price = data.regularMarketPrice;

        let user = await prismadb.user.findUnique({
            where: { id: req.body.userId },
            include: { ledger: true }, 
        });
		user = user!;
        const id = user.id
        if (!user) return res.status(404).send({ message: "User not found" });
		if (user.cash! < price * quantity) {
			return res.status(400).send({ message: "Not enough cash" });
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
            return res.status(200).send({message: 'successful transacation'})
		}
	} catch (error) {
		console.error("Error [buyStock]" + symbol + " stock data:", error);
		res.status(500).send("Error fetching " + symbol + " stock data:" + error);
	}
};

const sellStock = async (req: Request, res: Response) => {
    const symbol = req.params.symbol;
    const quantity = req.body.quantity;
    if(!symbol || !quantity ) return res.status(400).send({ message: "No params provided" });

    try {
        const user = await prismadb.user.findUnique({
            where: { id: req.body.userId },
            include: { ledger: true }, 
        });

        if (!user) return res.status(404).send({ message: "User not found" });

        const data = await fetchAlpacaStockData(symbol);
        const price = data.regularMarketPrice;

        const existingPosition = await prismadb.position.findUnique({
            where: {
                userId_symbol: {
                    userId: user.id,
                    symbol: symbol,
                },
            },
        });

        if (!existingPosition) {
            return res.status(400).send({ message: "Position not found" });
        }

        const quantityOwned = existingPosition.quantity;

        if (quantityOwned < quantity) {
            return res.status(400).send({ message: "Not enough shares" });
        }

        const newTotalQuantity = existingPosition.quantity - quantity;
        
        await prismadb.position.update({
            where: { id: existingPosition.id },
            data: {
                quantity: newTotalQuantity,
                // avgPurchasePrice remains unchanged for sell operation
            },
        });

        // Create Transaction Record
        await prismadb.transaction.create({
            data: {
                symbol,
                price,
                quantity,
                type: "sell",
                userId: user.id,
                positionId: existingPosition.id,
            },
        });

        // Update user's cash
        const cashUpdated = user.cash + (price * quantity);
        await prismadb.user.update({
            where: { id: user.id },
            data: { cash: cashUpdated },
        });

        return res.status(200).send({ message: 'Successful transaction' });

    } catch (error) {
        console.error(`Error [sellStock] for ${symbol}:`, error);
        return res.status(500).send(`Error processing transaction for ${symbol}: ${error}`);
    }
};


const search = async (req: Request, res: Response) => {
    try {
        const { query } = req.params;

        if (!query) res.status(400).send({ message: "No query provided" });
    
        const ticker = await searchAssets(query!)
    
        res.status(200).send(ticker);
    } catch (error) {
        console.error('Error [search]: ', error)
        res.status(500).send("Error fetching stock data:" + error);
    }

	// getAllAssets(query!)
	// 	.then((quotes: any) => {
	// 		let stocksAndCurrencies = quotes.filter(
	// 			(quote: { quoteType: string }) => {
	// 				return (
	// 					quote.quoteType &&
	// 					quote.quoteType !== "FUTURE" &&
	// 					quote.quoteType !== "Option"
	// 				);
	// 			},
	// 		);
	// 		res.status(200).send(stocksAndCurrencies);
	// 	})
	// 	.catch((err: any) => {
	// 		console.log(err);
	// 		res.status(500).send({ message: err });
	// 	});
};

const searchList = async (req: Request, res: Response) => {
    try {
        const searchValue = req.params.query
        if (!searchValue) return res.status(400).send({ message: "No query provided" });
    
        const allAssets = await getTickerSearchList(searchValue)
    
        res.status(200).send(allAssets);
    } catch (error) {
        console.error('Error [searchAutoComplete]: ', error)
        res.status(500).send("Error fetching stock data:" + error);
    }

};



export default { getStockData, getHistorical, buyStock, sellStock, search, searchList };