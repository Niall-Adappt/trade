import { Request, Response } from "express";

import {
	fetchStockData,
	fetchHistoricalStockData,
    searchAllAssets,
} from "../utils/requests";
import prismadb from "../config/prismaClient";

const getInfo = async (req: Request, res: Response) => {
	const symbol = req.params.symbol;
    if(!symbol) return res.status(400).send({ message: "No symbol provided" })

	const quote = await fetchStockData(symbol);
	res.status(200).send(quote);
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
    if(!symbol || !period ) return res.status(400).send({ message: "No params provided" })
	try {
		const historicalData = await fetchHistoricalStockData(symbol, period);

		res.status(200).send(historicalData);
	} catch (error) {
		console.error("Error fetching " + symbol + "historical stock data:", error);
		res.status(500).send("Error fetching " + symbol + " stock data:" + error);
	}
};

const buyStock = async (req: Request, res: Response) => {

	const symbol = req.params.symbol;
	const quantity = req.body.quantity;

    if(!symbol || !quantity ) return res.status(400).send({ message: "No params provided" })

	try {
		const data = await fetchStockData(symbol);
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
		}
	} catch (error) {
		console.error("Error [buyStock]" + symbol + " stock data:", error);
		res.status(500).send("Error fetching " + symbol + " stock data:" + error);
	}
};

const sellStock = async (req: Request, res: Response) => {

	const symbol = req.params.symbol;
	var quantity = req.body.quantity;
    if(!symbol || !quantity ) return res.status(400).send({ message: "No params provided" })

	try {
		const data = await fetchStockData(symbol);
		const price = data.regularMarketPrice;

        let user = await prismadb.user.findUnique({
            where: { id: req.body.userId },
            include: { ledger: true }, 
        });
		user = user!;
        const id = user.id
        if (!user) return res.status(404).send({ message: "User not found" });
        if (!symbol) return res.status(404).send({ message: "Ticker not found" });
        if (!quantity) return res.status(404).send({ message: "Quantity not found" });

		// Check if user has enough shares to sell across all positions
        const existingPosition = await prismadb.position.findUnique({
            where: {
              userId_symbol: {
                userId: id,
                symbol: symbol
              }
            }
          });

        if (!existingPosition) {
			res.status(400).send({ message: "Position not found" });
			return;
		}

        let positionId: string
        let quantityOwned = existingPosition?.quantity || 0

        if (quantityOwned < quantity) {
			res.status(400).send({ message: "Not enough shares" });
			return;
		}

        const newTotalQuantity = existingPosition.quantity - quantity;
        const newAveragePurchasePrice = ((existingPosition.avgPurchasePrice * existingPosition.quantity) - (price * quantity)) / newTotalQuantity;
        
        const updatedPosition = await prismadb.position.update({
            where: { id: existingPosition.id },
            data: {
            quantity: newTotalQuantity,
            avgPurchasePrice: newAveragePurchasePrice, // Update the purchasePrice to the new average
            },
        });
        positionId = updatedPosition.id;

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

		const cashUpdated = user.cash! + price * quantity;
        await prismadb.user.update({
            where: { id: user.id },
            data: { cash: cashUpdated },
          });

	} catch (error) {
		console.error("Error [sellStock] " + symbol + " stock data:", error);
		res.status(500).send("Error fetching " + symbol + " stock data:" + error);
	}
};

const search = async (req: Request, res: Response) => {

	const { query } = req.params;

	if (!query) res.status(400).send({ message: "No query provided" });

	searchAllAssets(query!)
		.then((quotes: any) => {
			let stocksAndCurrencies = quotes.filter(
				(quote: { quoteType: string }) => {
					return (
						quote.quoteType &&
						quote.quoteType !== "FUTURE" &&
						quote.quoteType !== "Option"
					);
				},
			);
			res.status(200).send(stocksAndCurrencies);
		})
		.catch((err: any) => {
			console.log(err);
			res.status(500).send({ message: err });
		});
};

export default { getInfo, getHistorical, buyStock, sellStock, search };