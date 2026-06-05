import { Redis as IORedis } from "ioredis";

export type RedisClient = IORedis;

let client: RedisClient | null = null;

function buildRedisUrl(): string {
	const password = process.env.REDIS_PASSWORD;
	const host = process.env.REDIS_HOST || "localhost";
	const port = process.env.REDIS_PORT || "6379";

	if (password) {
		return `redis://:${encodeURIComponent(password)}@${host}:${port}`;
	}

	return process.env.REDIS_URL || `redis://${host}:${port}`;
}

export function getRedis(): IORedis {
	if (!client) {
		const url = buildRedisUrl();
		client = new IORedis(url, {
			maxRetriesPerRequest: 3,
			retryStrategy: (times: number) => Math.min(times * 100, 3000),
			lazyConnect: true,
		});

		client.on("error", (err: Error) => {
			console.error("Redis connection error:", err.message);
		});

		client.on("connect", () => {
			console.log("Connected to Redis");
		});

		client.on("close", () => {
			console.warn("Redis connection closed");
		});
	}

	return client;
}

export async function closeRedis(): Promise<void> {
	if (client) {
		await client.quit();
		client = null;
		console.log("Redis connection closed");
	}
}
