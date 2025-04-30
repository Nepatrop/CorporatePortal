import aiohttp
import asyncio
import time
import statistics
from datetime import datetime

class LoadTester:
    def __init__(self):
        self.NUM_THREADS = 5
        self.REQUESTS_PER_THREAD = 102
        self.TOTAL_REQUESTS = 510
        self.REQUEST_TIMEOUT = 5
        self.SERVER_URL = "http://localhost:8083"
        self.headers = {
            "X-API-Key": "cp_e29b7d8f4a6c2135d9f0",
            "Content-Type": "application/json"
        }
        
    async def warm_up(self, endpoint):
        print(f"Warming up {endpoint}...")
        async with aiohttp.ClientSession() as session:
            for _ in range(3):
                try:
                    async with session.get(
                        f"{self.SERVER_URL}{endpoint}",
                        headers=self.headers,
                        timeout=self.REQUEST_TIMEOUT
                    ) as response:
                        await response.text()
                    await asyncio.sleep(0.5)
                except Exception as e:
                    print(f"Warm-up error: {e}")
        print("Warm-up complete")

    async def make_request(self, session, endpoint):
        start_time = time.time()
        try:
            async with session.get(
                f"{self.SERVER_URL}{endpoint}",
                headers=self.headers,
                timeout=self.REQUEST_TIMEOUT
            ) as response:
                await response.text()
                return time.time() - start_time, response.status
        except Exception as e:
            print(f"Request error: {e}")
            return time.time() - start_time, 0

    async def worker(self, session, endpoint, results):
        for _ in range(self.REQUESTS_PER_THREAD):
            duration, status = await self.make_request(session, endpoint)
            results.append((duration * 1000, status))  # Convert to milliseconds
            await asyncio.sleep(0.01)  # 10ms delay between requests

    async def run_test(self, endpoint, test_name):
        print(f"\nExecuting test: {test_name}")
        print(f"Endpoint: {endpoint}")
        print(f"Total requests planned: {self.TOTAL_REQUESTS}\n")

        # Warm up
        await self.warm_up(endpoint)
        await asyncio.sleep(2)  # Stabilization delay

        results = []
        start_time = time.time()

        async with aiohttp.ClientSession() as session:
            tasks = [
                self.worker(session, endpoint, results)
                for _ in range(self.NUM_THREADS)
            ]
            await asyncio.gather(*tasks)

        total_time = time.time() - start_time
        
        # Calculate metrics
        response_times = [r[0] for r in results]  # in milliseconds
        success_count = sum(1 for r in results if 200 <= r[1] < 300)
        
        response_times.sort()
        avg_response = statistics.mean(response_times)
        median = statistics.median(response_times)
        p95 = response_times[int(len(response_times) * 0.95)]
        p99 = response_times[int(len(response_times) * 0.99)]
        
        rps = len(results) / total_time

        # Print results
        print(f"\n=== {test_name} Results ===")
        print(f"Total Requests:     {len(results)}")
        print(f"Success Rate:       {success_count * 100 / len(results):.2f}%")
        print(f"Requests/second:    {rps:.2f}")
        print(f"Avg Response Time:  {avg_response:.2f}ms")
        print(f"Median:            {median:.2f}ms")
        print(f"95th percentile:   {p95:.2f}ms")
        print(f"99th percentile:   {p99:.2f}ms")
        print(f"Total Time:        {total_time:.2f}s\n")

        # Distribution
        ranges = {}
        for rt in response_times:
            range_key = (int(rt / 100) * 100)
            ranges[range_key] = ranges.get(range_key, 0) + 1

        print("Response Time Distribution:")
        for range_start in sorted(ranges.keys()):
            count = ranges[range_start]
            percentage = (count * 100) / len(response_times)
            print(f"{range_start}-{range_start + 100}ms: {count} requests ({percentage:.2f}%)")

        print("====================\n")
        await asyncio.sleep(5)  # Delay before next test

async def main():
    tester = LoadTester()
    
    tests = [
        ("/api/employees", "Employees Endpoint Test"),
        ("/api/links", "Links Endpoint Test"),
        ("/api/departments", "Departments Endpoint Test"),
        ("/api/birthdays/upcoming", "Upcoming Birthdays Endpoint Test"),
        ("/api/news", "News Endpoint Test")
    ]
    
    for endpoint, name in tests:
        await tester.run_test(endpoint, name)

if __name__ == "__main__":
    asyncio.run(main())
