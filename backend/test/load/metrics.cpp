#include "metrics.h"
#include <iostream>
#include <numeric>
#include <algorithm>
#include <iomanip>

void Metrics::start() {
    std::lock_guard<std::mutex> lock(metricsMutex);
    reset();
    startTime = std::chrono::high_resolution_clock::now();
}

void Metrics::reset() {
    responseTimes.clear();
    statusCodes.clear();
    responseTimeDistribution.clear();
    slowestResponses.clear();
    successCount = 0;
    failureCount = 0;
}

void Metrics::addResponse(double responseTime, int statusCode) {
    std::lock_guard<std::mutex> lock(metricsMutex);
    responseTimes.push_back(responseTime);
    statusCodes.push_back(statusCode);
    
    int timeRange = static_cast<int>(responseTime / 100) * 100;
    responseTimeDistribution[timeRange]++;

    if (slowestResponses.size() < NUM_SLOWEST_TO_TRACK) {
        slowestResponses.push_back(responseTime);
        std::sort(slowestResponses.begin(), slowestResponses.end(), std::greater<>());
    } else if (responseTime > slowestResponses.back()) {
        slowestResponses.back() = responseTime;
        std::sort(slowestResponses.begin(), slowestResponses.end(), std::greater<>());
    }

    if (statusCode >= 200 && statusCode < 300) {
        successCount++;
    } else {
        failureCount++;
    }
}

void Metrics::printResults(const std::string& testName) const {
    if (responseTimes.empty()) {
        std::cout << "No data collected for " << testName << std::endl;
        return;
    }

    // Исключаем разогревающие запросы из статистики
    std::vector<double> sortedTimes = responseTimes;
    std::sort(sortedTimes.begin(), sortedTimes.end());
    
    size_t outlierCount = sortedTimes.size() * 0.02;
    std::vector<double> cleanedTimes(sortedTimes.begin(), sortedTimes.end() - outlierCount);

    auto endTime = std::chrono::high_resolution_clock::now();
    double totalTime = std::chrono::duration<double>(endTime - startTime).count();

    double totalResponseTime = std::accumulate(cleanedTimes.begin(), cleanedTimes.end(), 0.0);
    double avgResponseTime = totalResponseTime / cleanedTimes.size();
    double median = cleanedTimes[cleanedTimes.size() / 2];
    double p95 = cleanedTimes[static_cast<size_t>(cleanedTimes.size() * 0.95)];
    double p99 = cleanedTimes[static_cast<size_t>(cleanedTimes.size() * 0.99)];
    
    double rps = cleanedTimes.size() / totalTime;

    std::cout << "\n=== " << testName << " Results ===\n"
              << std::fixed << std::setprecision(2)
              << "Total Requests:     " << cleanedTimes.size() << "\n"
              << "Success Rate:       " << (successCount * 100.0 / responseTimes.size()) << "%\n"
              << "Requests/second:    " << rps << "\n"
              << "Avg Response Time:  " << avgResponseTime << "ms\n"
              << "Median:            " << median << "ms\n"
              << "95th percentile:   " << p95 << "ms\n"
              << "99th percentile:   " << p99 << "ms\n"
              << "Total Time:        " << totalTime << "s\n";

    std::cout << "\nResponse Time Distribution:\n";
    for (const auto& [range, count] : responseTimeDistribution) {
        std::cout << range << "-" << (range + 100) << "ms: " 
                 << count << " requests ("
                 << (count * 100.0 / responseTimes.size()) << "%)\n";
    }

    std::cout << "\nSlowest Responses:\n";
    for (size_t i = 0; i < slowestResponses.size(); ++i) {
        std::cout << "Request #" << (i + 1) << ": " 
                 << slowestResponses[i] << "ms\n";
    }
    std::cout << "====================\n";
}
