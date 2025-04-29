#include "utils/file_utils.h"
#include <fstream>
#include <iostream>

namespace FileUtils {
    void ensureDirectoryExists(const std::filesystem::path& path) {
        if (!std::filesystem::exists(path)) {
            std::filesystem::create_directories(path);
            std::cout << "Created directory at: \"" << path.string() << "\"" << std::endl;
        }
    }

    std::filesystem::path getImagesPath() {
        // Используем путь относительно исполняемого файла
        auto exePath = std::filesystem::current_path();
        auto imagesPath = exePath / "images";
        
        std::cout << "Images directory path: " << imagesPath.string() << std::endl;
        
        ensureDirectoryExists(imagesPath);
        return imagesPath;
    }

    std::filesystem::path getConfigPath() {
        auto path = std::filesystem::current_path() / "config";
        ensureDirectoryExists(path);
        return path;
    }

    bool saveImage(const std::string& binary_data, const std::string& filename) {
        try {
            auto imagesPath = getImagesPath();
            ensureDirectoryExists(imagesPath); // Убедимся, что директория существует
            
            auto fullPath = imagesPath / filename;
            std::cout << "Saving image to: " << fullPath.string() << std::endl;

            std::ofstream file(fullPath, std::ios::binary);
            if (!file) {
                std::cerr << "Failed to open file for writing: " << fullPath.string() << std::endl;
                return false;
            }

            file.write(binary_data.c_str(), binary_data.size());
            file.close();

            // Проверяем, что файл действительно создался
            if (!std::filesystem::exists(fullPath)) {
                std::cerr << "File was not created: " << fullPath.string() << std::endl;
                return false;
            }

            std::cout << "Image saved successfully. Size: " << std::filesystem::file_size(fullPath) << " bytes" << std::endl;
            return true;
        } catch (const std::exception& e) {
            std::cerr << "Error saving image: " << e.what() << std::endl;
            return false;
        }
    }

    void deleteImage(const std::string& filename) {
        try {
            auto fullPath = getImagesPath() / filename;
            if (std::filesystem::exists(fullPath)) {
                std::filesystem::remove(fullPath);
            }
        } catch (const std::exception& e) {
            std::cerr << "Error deleting image: " << e.what() << std::endl;
        }
    }

    std::string loadImage(const std::string& filename) {
        try {
            auto fullPath = getImagesPath() / filename;
            if (!std::filesystem::exists(fullPath)) {
                return "";
            }

            std::ifstream file(fullPath, std::ios::binary);
            return std::string((std::istreambuf_iterator<char>(file)),
                             std::istreambuf_iterator<char>());
        } catch (const std::exception& e) {
            std::cerr << "Error loading image: " << e.what() << std::endl;
            return "";
        }
    }

    bool imageExists(const std::string& filename) {
        return std::filesystem::exists(getImagesPath() / filename);
    }
}
