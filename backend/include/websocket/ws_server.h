#pragma once
#include <websocketpp/server.hpp>
#include <websocketpp/config/asio_no_tls.hpp>
#include <set>
#include <string>
#include <nlohmann/json.hpp>
#include <mutex>

class WebSocketServer {
private:
    typedef websocketpp::server<websocketpp::config::asio> server;
    typedef websocketpp::connection_hdl connection_hdl;
    
    server ws_server;
    std::set<connection_hdl, std::owner_less<connection_hdl>> connections;
    std::mutex connections_mutex;
    bool is_running;
    
    void on_open(connection_hdl hdl);
    void on_close(connection_hdl hdl);
    void on_fail(connection_hdl hdl);

public:
    WebSocketServer();
    ~WebSocketServer();
    
    void run(uint16_t port);
    void broadcast(const std::string& message);
    void cleanup();
    bool isRunning() const { return is_running; }
    static WebSocketServer& getInstance();
};
