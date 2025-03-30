class WebSocketClient {
    constructor() {
        this.connect();
        this.reconnectAttempts = 0;
        this.maxReconnectAttempts = 5;
        this.messageHandler = null;
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

            this.ws.onmessage = (event) => {
                try {
                    // Добавляем дополнительную проверку
                    if (typeof event.data !== 'string') {
                        console.error('Invalid message format: data is not a string');
                        return;
                    }

                    console.log('Received WebSocket message:', event.data);
                    
                    const data = JSON.parse(event.data);
                    
                    // Проверяем структуру данных
                    if (!data || typeof data !== 'object' || !data.type) {
                        console.error('Invalid message format: missing required fields');
                        return;
                    }
                    
                    // Вызываем обработчик только с валидными данными
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
        }
    }

    setMessageHandler(handler) {
        this.messageHandler = handler;
    }
}

export const wsClient = new WebSocketClient();
