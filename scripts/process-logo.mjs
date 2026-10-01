import fs from 'fs';
import path from 'path';

const srcImg = 'C:\\Users\\HP\\.gemini\\antigravity\\brain\\ee304487-9866-4337-b782-747a0e56f2dd\\.user_uploaded\\media_1790865382951.jpg';
const destFullPng = path.resolve('public', 'logo-full.png');
const destRawJpg = path.resolve('public', 'logo-raw.jpg');

fs.copyFileSync(srcImg, destFullPng);
fs.copyFileSync(srcImg, destRawJpg);

console.log('Logo copied successfully to public/logo-full.png');
