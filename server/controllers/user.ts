import { Request, Response } from "express";
import { fetchAlpacaStockData, fetchAlpacaStocksData } from "../utils/requests";
import prismadb from "../config/prismaClient";
const jwt = require('jsonwebtoken');

const getLedger = async (req: Request, res: Response) => {
    try {
        const user = await prismadb.user.findUnique({
            where: { id: req.body.userId },
            include: { ledger: true }, 
        });

        if (user) {
            res.status(200).json({ ledger: user.ledger });
        } else {
            res.status(404).send({ message: 'User not found' });
        }
    } catch (error) {
        console.error('ERROR[getHoldings]: ', error)
        res.status(500).send({ message: error });
    }
};

const getHoldings = async (req: Request, res: Response) => {
    try {
        console.log('getHoldings triggerd')
        const user = await prismadb.user.findUnique({
            where: { id: req.body.userId },
            include: { positions: true }, 
        });

        if (user) {
            res.status(200).json({ positions: user.positions, cash: user.cash });
        } else {
            res.status(404).send({ message: 'User not found' });
        }
    } catch (error) {
        console.error('ERROR[getHoldings]: ', error)
        res.status(500).send({ message: error });
    }
};

const getPortfolio = async (req: Request, res: Response) => {
    let user = await prismadb.user.findUnique({
        where: { id: req.body.userId },
        include: { positions: true }, 
    });

    if (!user) {
        return res.status(404).send({ message: 'User not found' });
    }

	user = user!;

	// Create array of quantity held for each symbol (no duplicates)
	let positionsNoDupes: { [key: string]: number } = {};
	user.positions.forEach((position) => {
		if (positionsNoDupes[position.symbol]) {
			positionsNoDupes[position.symbol] += position.quantity;
		} else {
			positionsNoDupes[position.symbol] = position.quantity;
		}
	});

	const symbols = Object.keys(positionsNoDupes);
	const quantities = Object.values(positionsNoDupes);

    if (!quantities || !symbols) {
        return res.status(404).send({ message: 'Portfolio not found' });
    }

    try {
        // const values = await Promise.all(symbols.map((symbol) => fetchAlpacaStockData(symbol)))
        const values = await fetchAlpacaStocksData(symbols)

        var listOfPositions: any[] = [];

        let portfolioValue = 0;
        let portfolioPrevCloseValue = 0;

        // Sum up the value of all positions
        values.forEach((value:any, i:any) => {
            portfolioValue += value.regularMarketPrice * quantities[i]!;
            portfolioPrevCloseValue += value.regularMarketPreviousClose * quantities[i]!;
        });

        // list positions for frontend with data from user.positions and fetchStockData response
        user!.positions.forEach((position) => {
            const positionLiveData = values.find((value: any) => value.symbol === position.symbol,);
            if (positionLiveData) {
                listOfPositions.push({
                    ...position,
                    ...positionLiveData,
                });
            }
        });

        res.status(200).json({
            portfolioValue,
            portfolioPrevCloseValue,
            positions: listOfPositions,
            cash: user!.cash,
        });

    } catch (error) {
        console.error('ERROR[getPortfolio]: ', error)
        res.status(500).send({ message: error });
    }
};

const getWatchlist = async (req: Request, res: Response) => {
    try {
        let user = await prismadb.user.findUnique({
            where: { id: req.body.userId },
        });
    
        if (!user) {
            return res.status(404).send({ message: 'User not found' });
        }
        user = user!;

        return res.status(200).send({ watchlist: user!.watchlist });
    
        // if (req.query.raw === "true") {
        //     return res.status(200).json({ watchlist: user!.watchlist });
        // } else {
        //     const values = Promise.all(user!.watchlist.map((symbol) => fetchStockData(symbol)))
        //     return res.status(200).json({ watchlist: values });
        // }
    } catch (error) {
        console.error('ERROR[getWatchList]: ', error)
        res.status(500).send({ message: error });
    }
};

const addToWatchlist = async (req: Request, res: Response) => {
    try {
        let user = await prismadb.user.findUnique({
          where: { id: req.body.userId }
        });
    
        if (!user) {
            return res.status(404).send({ message: 'User not found' });
        }
        user = user!;

        const symbol = req.params.symbol
        let watchlist = user.watchlist
        if(!symbol) return res.status(400).send({message: 'no symbol found'})

        if (!watchlist.includes(symbol)) {

          watchlist.push(symbol)

          const updatedUser = await prismadb.user.update({
            where: { id: req.body.userId },
            data: { watchlist },
          });
          res.status(200).send({ message: "Added to watchlist" });
        } else {
            res.status(400).send({ message: "Already in watchlist" });
        }
      } catch (error) {
        console.error('ERROR[addToWatchList]: ', error)
        res.status(500).send({ message: error });
      }

};

const removeFromWatchlist = async (req: Request, res: Response) => {

    try {
        let user = await prismadb.user.findUnique({
            where: { id: req.body.userId }
          });
      
          if (!user) {
              return res.status(404).send({ message: 'User not found' });
          }
          user = user!;
          const symbol = req.params.symbol
          let watchlist = user.watchlist
          if(!symbol) return res.status(400).send({message: 'no symbol found'})
          if (!watchlist.includes(symbol!)) {
  
            watchlist = watchlist.filter(listSymbol => listSymbol !== symbol)
  
            const updatedUser = await prismadb.user.update({
              where: { id: req.body.userId },
              data: { watchlist },
            });
            res.status(200).json({ message: "Removed from watchlist" });
          } else {
              res.status(400).json({ message: "Not in watchlist" });
          }
    } catch (error) {
        console.error('ERROR[removeFromWatchList]: ', error)
        res.status(500).send({ message: error });
    }
};

const login = async (req: Request, res: Response) => {
    const username = req.params.username
    console.log('username', username)
    if(!username) return res.status(400).send({message: 'No username provided'})
    try {
        let user = await prismadb.user.findUnique({
          where: {
            username,
          },
        });
    
        if (!user) {
          user = await prismadb.user.create({
            data: {
              username,
            },
          });
        }
        const secret = process.env.JWT_SECRET
        const token = jwt.sign({ userId: user.id }, secret, { expiresIn: '20d' });
        res.json({ token });
      } catch (error) {
        console.error('Login error:', error);
        res.status(500).send('An error occurred.');
      }

}
// const getTransactions = async (req: Request, res: Response) => {
//     const userId = req.body.userId
//     if(!userId) return res.status(400).send({message: 'No username provided'})
//     try {
//         let transactions = await prismadb.transaction.findMany({
//           where: { userId },
//         });
//         console.log(transactions)
//         res.status(200).send(transactions) 
//       } catch (error) {
//         console.error('Login error:', error);
//         res.status(500).send('An error occurred.');
//       }

// }
const getTransactions = async (req: Request, res: Response)  => {
    const userId = req.body.userId;
    if (!userId) return res.status(400).send({message: 'No username provided'});

    try {
        let transactions = await prismadb.transaction.findMany({
          where: { userId },
        });
        
        // Destructure and return only the necessary fields
        const filteredTransactions = transactions.map(({ id, symbol, type, quantity, price }) => ({
          id, symbol, type, quantity, price
        }));

        console.log(filteredTransactions);
        res.status(200).send(filteredTransactions); 
    } catch (error) {
        console.error('Error:', error);
        res.status(500).send('An error occurred.');
    }
}



export default {
	getLedger,
	getHoldings,
	getPortfolio,
	getWatchlist,
	addToWatchlist,
    getTransactions,
	removeFromWatchlist,
    login
};
