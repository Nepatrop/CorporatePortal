class WebSocketClient {
    constructor() {
        this.connect();
        this.reconnectAttempts = 0;
        this.maxReconnectAttempts = 5;
        this.reconnectTimeout = null;
        this.messageHandler = null;
    }

    connect() {
        try {
            if (this.ws) {
                this.ws.close();
            }

            const host = window.location.hostname === 'localhost' ? 'localhost' : window.location.hostname;
            console.log(`Connecting to WebSocket at ws://${host}:8082`);
            
            this.ws = new WebSocket(`ws://${host}:8082`);
            
            this.ws.onopen = () => {
                console.log('WebSocket Connected');
                this.reconnectAttempts = 0;
                if (this.reconnectTimeout) {
                    clearTimeout(this.reconnectTimeout);
                    this.reconnectTimeout = null;
                }
            };
            
            this.ws.onclose = (event) => {
                console.log('WebSocket Disconnected', event.code, event.reason);
                this.attemptReconnect();
            };
            
            this.ws.onerror = (error) => {
                console.error('WebSocket Error:', error);
                // Не пытаемся переподключиться здесь, это будет сделано в onclose
            };

            this.ws.onmessage = (event) => {
                try {
                    if (typeof event.data !== 'string') {
                        console.error('Invalid message format: data is not a string');
                        return;
                    }

                    const data = JSON.parse(event.data);
                    
                    if (!data || typeof data !== 'object' || !data.type || !data.data) {
                        console.error('Invalid message structure:', data);
                        return;
                    }
                    
                    if (this.messageHandler) {
                        this.messageHandler(data);
                    }
                } catch (error) {
                    console.error('Error processing WebSocket message:', error);
                    console.error('Raw message data:', event.data);
                }
            };
        } catch (error) {
            console.error('Error creating WebSocket connection:', error);
            this.attemptReconnect();
        }
    }

    attemptReconnect() {
        if (this.reconnectTimeout) {
            clearTimeout(this.reconnectTimeout);
        }

        if (this.reconnectAttempts < this.maxReconnectAttempts) {
            this.reconnectAttempts++;
            const delay = Math.min(1000 * Math.pow(2, this.reconnectAttempts), 30000);
            console.log(`Reconnecting in ${delay}ms (attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts})`);
            
            this.reconnectTimeout = setTimeout(() => {
                this.connect();
            }, delay);
        } else {
            console.error('Max reconnection attempts reached');
        }
    }

    setMessageHandler(handler) {
        this.messageHandler = handler;
    }

    cleanup() {
        if (this.reconnectTimeout) {
            clearTimeout(this.reconnectTimeout);
        }
        if (this.ws) {
            this.ws.close();
        }
    }
}

// Clean up on page unload
window.addEventListener('beforeunload', () => {
    if (wsClient) {
        wsClient.cleanup();
    }
});

export const wsClient = new WebSocketClient();
