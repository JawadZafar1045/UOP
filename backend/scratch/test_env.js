require('dotenv').config();
console.log('--- ENV CHECK ---');
console.log('CLOUDINARY_CLOUD_NAME:', process.env.CLOUDINARY_CLOUD_NAME);
console.log('CLOUDINARY_API_KEY:', process.env.CLOUDINARY_API_KEY);
console.log('CLOUDINARY_API_SECRET length:', process.env.CLOUDINARY_API_SECRET ? process.env.CLOUDINARY_API_SECRET.length : 0);

const cloudinary = require('../config/cloudinary');
console.log('--- CLOUDINARY CONFIG CHECK ---');
const config = cloudinary.config();
console.log('Cloud Name in config:', config.cloud_name);
console.log('API Key in config:', config.api_key);
console.log('API Secret is set in config:', !!config.api_secret);
