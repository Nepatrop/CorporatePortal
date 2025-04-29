#pragma once
#include <chrono>
#include <vector>
#include <mutex>
#include <string>
#include <map>
#include <algorithm>
#include <iomanip>

class Metrics {
private:
    std::vector<double> responseTimes;
    std::vector<int> statusCodes;
    std::mutex metricsMutex;
    int successCount = 0;
    int failureCount = 0;
    std::chrono::high_resolution_clock::time_point startTime;
    std::map<int, int> responseTimeDistribution;
    std::vector<double> slowestResponses;
    static const size_t NUM_SLOWEST_TO_TRACK = 10;

public:
    void start();
    void reset();
    void addResponse(double responseTime, int statusCode);
    void printResults(const std::string& testName) const;
};
