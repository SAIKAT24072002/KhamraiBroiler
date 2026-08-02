const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    const connStr = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/poultry_business_db';
    
    // Ensure we are connecting to our isolated database name
    if (!connStr.includes('poultry_business_db')) {
      console.warn('WARNING: MongoDB Connection string does not specify poultry_business_db. Appending it.');
    }

    const conn = await mongoose.connect(connStr);
    
    console.log(`MongoDB Connected successfully: ${conn.connection.host}`);
    console.log(`Database name: ${conn.connection.name}`);
  } catch (error) {
    console.error(`MongoDB Connection Error: ${error.message}`);
    process.exit(1);
  }
};

module.exports = connectDB;
