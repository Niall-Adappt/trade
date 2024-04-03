import express, { NextFunction, Request, Response } from "express";
const jwt = require('jsonwebtoken');


const router = express.Router();

// Importing the controllers
import stockController from "../controllers/stocks";
import userController from "../controllers/user";

const authenticateToken = (req: Request, res: Response, next: NextFunction) => {
    console.log('authenticateToken triggered')
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN
    if (token == null) return res.status(401).send({message: 'no authorised'});
  
    jwt.verify(token, process.env.JWT_SECRET, (err:any, decoded:any) => {
      if (err) return res.sendStatus(403);
      req.body.userId = decoded.userId;
      next();
    });
  };

// Stock-related routes
router.get('/stock/data/:symbol',stockController.getStockData);
router.get('/stock/historical/:symbol', stockController.getHistorical);
router.post('/stock/buy/:symbol',authenticateToken, stockController.buyStock);
router.post('/stock/sell/:symbol', authenticateToken, stockController.sellStock);
router.get('/searchList/:query', stockController.searchList);
router.get('/search/:query', stockController.search);

// User-related routes
router.post('/user/login/:username', userController.login);
router.get('/user/ledger', authenticateToken, userController.getLedger);
router.get('/user/holdings', authenticateToken, userController.getHoldings);
router.get('/user/portfolio', authenticateToken, userController.getPortfolio);
router.get('/user/watchlist', authenticateToken, userController.getWatchlist);
router.post('/user/watchlist/add/:symbol', authenticateToken, userController.addToWatchlist);
router.post('/user/watchlist/remove/:symbol', authenticateToken, userController.removeFromWatchlist);

export default router;
