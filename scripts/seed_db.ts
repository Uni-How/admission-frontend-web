import mongoose from 'mongoose';
import School from '../models/School';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';

// Load environment variables from .env.local
dotenv.config({ path: '.env.local' });

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  console.error('Error: MONGODB_URI is not defined in .env.local');
  process.exit(1);
}

async function seed() {
  try {
    await mongoose.connect(MONGODB_URI!);
    console.log('Connected to MongoDB');

    // READ TEST1.json
    const filePath = path.join(process.cwd(), 'JSON', 'TEST1.json');
    const fileContent = fs.readFileSync(filePath, 'utf-8');
    const data = JSON.parse(fileContent);
    
    // Ensure data is array
    const schools = Array.isArray(data) ? data : [data];

    console.log(`Found ${schools.length} schools to import.`);

    // Clear existing data
    await School.deleteMany({});
    console.log('Cleared existing School data.');

    // Insert new data
    const result = await School.insertMany(schools);
    console.log(`Successfully inserted ${result.length} schools.`);

    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
    process.exit(0);
  } catch (error) {
    console.error('Seed error:', error);
    await mongoose.disconnect();
    process.exit(1);
  }
}

seed();
