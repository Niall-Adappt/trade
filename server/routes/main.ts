import express from "express";
const router = express.Router();

// Importing the controllers
import stockController from "../controllers/stocks";
import userController from "../controllers/user";

// Stock-related routes
router.get('/stock/data/:symbol', stockController.getStockData);
router.get('/stock/historical/:symbol', stockController.getHistorical);
router.post('/stock/buy/:symbol', stockController.buyStock);
router.post('/stock/sell/:symbol', stockController.sellStock);
router.get('/searchList/:query', stockController.searchList);
router.get('/search/:query', stockController.search);

// User-related routes
router.get('/user/ledger', userController.getLedger);
router.get('/user/holdings', userController.getHoldings);
router.get('/user/portfolio', userController.getPortfolio);
router.get('/user/watchlist', userController.getWatchlist);
router.post('/user/watchlist/add', userController.addToWatchlist);
router.post('/user/watchlist/remove', userController.removeFromWatchlist);

export default router;
