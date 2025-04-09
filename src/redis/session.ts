import Redis from 'ioredis';
import { REDIS_URL } from '../config/config';

const redis = new Redis(REDIS_URL);

export async function setSession(userId: number, data: any) {
  await redis.set(`session:${userId}`, JSON.stringify(data), 'EX', 3600);
}

export async function getSession(userId: number) {
  const raw = await redis.get(`session:${userId}`);
  return raw ? JSON.parse(raw) : null;
}

export async function clearSession(userId: number) {
  await redis.del(`session:${userId}`);
}
