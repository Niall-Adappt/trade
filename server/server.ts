import 'module-alias/register';
import dotenv from 'dotenv';
dotenv.config({ path: './server/prisma/.env' });
import express, { Application, Request, Response } from 'express';
import cors from 'cors';
import connectDB from './config/database';
import mainRoutes from './routes/main'; // Update mainRoutes to be exported as default or named export
import cookieParser from 'cookie-parser';
import logger from 'morgan';
import path from 'path';


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
      next(); // Pass control to the next middleware or route handler
    }
  });

  try {
    const PORT = process.env.PORT
    app.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}, you better catch it!`);
    });
  } catch (error) {
    console.error('Error starting server: ', error);
  }

// const database = async () => {
// //   await mongoose.connect(process.env.MONGO_URI!);
//     await connectDB()
//     console.log('MongoDB Connected');
//     try {
//         app.listen(process.env.PORT, () => {
//             console.log(`Server is running on port ${process.env.PORT}, you better catch it!`);
//           });
//     } catch (error) {
//         console.error('Error connecting to DB: ', error);
//     }
// };
// database()