import * as dotenv from 'dotenv';
dotenv.config();

export const BOT_TOKEN = process.env.BOT_TOKEN!;
export const REDIS_URL = process.env.REDIS_URL!;
export const ADMIN_PASS = process.env.ADMIN_PASS!;
