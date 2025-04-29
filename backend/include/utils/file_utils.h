#pragma once
#include <string>
#include <filesystem>

namespace FileUtils {
    std::filesystem::path getImagesPath();
    std::filesystem::path getConfigPath();
    void ensureDirectoryExists(const std::filesystem::path& path);
    bool saveImage(const std::string& binary_data, const std::string& filename);
    void deleteImage(const std::string& filename);
    bool imageExists(const std::string& filename);
}
