#include "websocket/ws_server.h"
#include <iostream>
#include <boost/asio/ip/address.hpp>
#include <nlohmann/json.hpp>

WebSocketServer::WebSocketServer() {
    ws_server.init_asio();
    
    ws_server.set_open_handler(bind(&WebSocketServer::on_open, this, std::placeholders::_1));
    ws_server.set_close_handler(bind(&WebSocketServer::on_close, this, std::placeholders::_1));
    ws_server.set_fail_handler(bind(&WebSocketServer::on_fail, this, std::placeholders::_1));
    
    // Оставляем только важные сообщения об ошибках
    ws_server.clear_access_channels(websocketpp::log::alevel::all);
    ws_server.set_access_channels(websocketpp::log::alevel::fail);
    
    // Настраиваем повторное использование адреса
    ws_server.set_reuse_addr(true);
}

WebSocketServer::~WebSocketServer() {
    try {
        std::lock_guard<std::mutex> lock(connections_mutex);
        cleanup();
    } catch (const std::exception& e) {
        std::cerr << "Error in WebSocketServer destructor: " << e.what() << std::endl;
    }
}

void WebSocketServer::run(uint16_t port) {
    try {
        ws_server.clear_access_channels(websocketpp::log::alevel::all);
        ws_server.set_access_channels(websocketpp::log::alevel::fail);
        
        auto addr = boost::asio::ip::address::from_string("0.0.0.0");
        ws_server.listen(addr, port);
        ws_server.start_accept();
        ws_server.run();
    } catch (const std::exception& e) {
        std::cerr << "WebSocket server error: " << e.what() << std::endl;
    }
}

void WebSocketServer::on_open(connection_hdl hdl) {
    connections.insert(hdl);
}

void WebSocketServer::on_close(connection_hdl hdl) {
    connections.erase(hdl);
}

void WebSocketServer::on_fail(connection_hdl hdl) {
    auto con = ws_server.get_con_from_hdl(hdl);
    std::cerr << "Connection failed. Error: " 
              << con->get_ec() << " - " 
              << con->get_ec().message() << std::endl;
}

void WebSocketServer::broadcast(const std::string& message) {
    std::lock_guard<std::mutex> lock(connections_mutex);
    
    try {
        auto parsed = nlohmann::json::parse(message);
        if (!parsed.is_object() || !parsed.contains("type") || !parsed.contains("data")) {
            std::cerr << "Invalid message structure, skipping broadcast" << std::endl;
            return;
        }
        
        std::vector<connection_hdl> deadConnections;
        
        for(auto& connection : connections) {
            try {
                auto con = ws_server.get_con_from_hdl(connection);
                if (con->get_state() != websocketpp::session::state::open) {
                    deadConnections.push_back(connection);
                    continue;
                }
                ws_server.send(connection, message, websocketpp::frame::opcode::text);
            } catch (const std::exception& e) {
                std::cerr << "Error sending message to connection: " << e.what() << std::endl;
                deadConnections.push_back(connection);
            }
        }
        
        for (const auto& deadConn : deadConnections) {
            connections.erase(deadConn);
        }
    } catch (const nlohmann::json::parse_error& e) {
        std::cerr << "JSON parse error in broadcast: " << e.what() << std::endl;
        std::cerr << "Message was: " << message << std::endl;
    } catch (const std::exception& e) {
        std::cerr << "Error in broadcast: " << e.what() << std::endl;
    }
}

void WebSocketServer::cleanup() {
    try {
        ws_server.stop();
        connections.clear();
    } catch (const std::exception& e) {
        std::cerr << "Error during cleanup: " << e.what() << std::endl;
    }
}

WebSocketServer& WebSocketServer::getInstance() {
    static WebSocketServer instance;
    return instance;
}
