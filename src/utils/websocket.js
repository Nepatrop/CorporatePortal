class WebSocketClient {
    constructor() {
        this.connect();
        this.reconnectAttempts = 0;
        this.maxReconnectAttempts = 5;
    }

    connect() {
        try {
            const host = window.location.hostname === 'localhost' ? 'localhost' : window.location.hostname;
            console.log(`Connecting to WebSocket at ws://${host}:8082`);
            
            this.ws = new WebSocket(`ws://${host}:8082`);
            
            this.ws.onopen = () => {
                console.log('WebSocket Connected');
                this.reconnectAttempts = 0;
            };
            
            this.ws.onclose = () => {
                console.log('WebSocket Disconnected');
                if (this.reconnectAttempts < this.maxReconnectAttempts) {
                    this.reconnectAttempts++;
                    const delay = Math.min(1000 * Math.pow(2, this.reconnectAttempts), 30000);
                    console.log(`Reconnecting in ${delay}ms (attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts})`);
                    setTimeout(() => this.connect(), delay);
                }
            };
            
            this.ws.onerror = (error) => {
                console.error('WebSocket Error:', error);
            };
        } catch (error) {
            console.error('Error creating WebSocket connection:', error);
        }
    }

    setMessageHandler(handler) {
        this.ws.onmessage = handler;
    }
}

export const wsClient = new WebSocketClient();
