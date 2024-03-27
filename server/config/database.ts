import mongoose from 'mongoose';

const connectDB = async (): Promise<void> => {
  const maxRetries = 3;
  let retryCount = 0;

  while (retryCount < maxRetries) {
    try {
      const conn = await mongoose.connect(process.env.DB_STRING!, {
        // useNewUrlParser: true,
        // useUnifiedTopology: true,
      });
      console.log(`MongoDB Connected: ${conn.connection.host}`);
      return; // Connection successful, return from the function
    } catch (err) {
      console.error(`Failed to connect to the database. Retry count: ${retryCount + 1}`);
      console.error(err);
      retryCount++;
    }
  }

  console.error(`Failed to connect to the database after ${retryCount} retries.`);
  process.exit(1);
};

export default connectDB;
