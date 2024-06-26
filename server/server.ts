import 'module-alias/register';
import dotenv from 'dotenv';
dotenv.config({ path: './server/prisma/.env' });
import express, { Application, Request, Response } from 'express';
import http from 'http';
import cors from 'cors';
import mainRoutes from './routes/main';
import cookieParser from 'cookie-parser';
import logger from 'morgan';
import path from 'path';
import { setupWebSocketServer } from './config/serverSocket';

const app = express();
const corsOptions = {
    credentials: true,
    origin: ['http://localhost:5173', 'https://localhost:5173'],
  };
  
  app.use(cors(corsOptions));
  app.use(express.json());
  app.use(cookieParser());
  app.use(logger('dev'));
  
  // Routes
  app.use('/', mainRoutes);
  
  // Serve static files
  app.use(express.static(path.join(__dirname, "..", "client", "build")));
  
  // Catch-all route for serving index.html
  app.get('*', (req, res, next) => {
    if (!res.headersSent) {
      res.sendFile(path.join(__dirname, "..", 'client/build', 'index.html'));
    } else {
      next(); 
    }
  });
  
  // HTTP server from the Express app
  const server = http.createServer(app);

  // Attach WebSocket server to the HTTP server
  // setupWebSocketServer(server);

  try {
    const PORT = process.env.PORT
    server.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}, you better catch it!`);
    });
  } catch (error) {
    console.error('Error starting server: ', error);
  }

  export default server