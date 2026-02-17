import * as signalR from '@microsoft/signalr';

class SignalRService {
  private connection: signalR.HubConnection | null = null;
  private listeners: Map<string, Set<(...args: any[]) => void>> = new Map();

  // Initialize SignalR connection
  public async start(hubUrl: string): Promise<void> {
    if (this.connection?.state === signalR.HubConnectionState.Connected) {
      console.log('SignalR already connected');
      return;
    }

    try {
      // Get auth token from localStorage
      const token = localStorage.getItem('auth_token');

      // Build connection with authentication
      this.connection = new signalR.HubConnectionBuilder()
        .withUrl(hubUrl, {
          accessTokenFactory: () => token || '',
          skipNegotiation: false,
        })
        .withAutomaticReconnect([0, 2000, 5000, 10000, 30000]) // Retry delays
        .configureLogging(signalR.LogLevel.Information)
        .build();

      // Setup connection event handlers
      this.connection.onreconnecting((error) => {
        console.warn('SignalR reconnecting...', error);
      });

      this.connection.onreconnected((connectionId) => {
        console.log('SignalR reconnected:', connectionId);
      });

      this.connection.onclose((error) => {
        console.error('SignalR connection closed:', error);
      });

      // Start connection
      await this.connection.start();
      console.log('✅ SignalR connected successfully');

      // Re-register all listeners after reconnection
      this.reregisterListeners();
    } catch (error) {
      console.error('❌ SignalR connection failed:', error);
      throw error;
    }
  }

  // Stop connection
  public async stop(): Promise<void> {
    if (this.connection) {
      await this.connection.stop();
      console.log('SignalR disconnected');
    }
  }

  // Subscribe to server events
  public on(eventName: string, callback: (...args: any[]) => void): void {
    if (!this.connection) {
      console.warn('SignalR not initialized. Call start() first.');
      return;
    }

    // Store listener for re-registration after reconnect
    if (!this.listeners.has(eventName)) {
      this.listeners.set(eventName, new Set());
    }
    this.listeners.get(eventName)!.add(callback);

    // Register with SignalR
    this.connection.on(eventName, callback);
  }

  // Unsubscribe from server events
  public off(eventName: string, callback?: (...args: any[]) => void): void {
    if (!this.connection) return;

    if (callback) {
      // Remove specific callback
      this.listeners.get(eventName)?.delete(callback);
      this.connection.off(eventName, callback);
    } else {
      // Remove all callbacks for this event
      this.listeners.delete(eventName);
      this.connection.off(eventName);
    }
  }

  // Send message to server
  public async send(methodName: string, ...args: any[]): Promise<void> {
    if (!this.connection || this.connection.state !== signalR.HubConnectionState.Connected) {
      console.error('SignalR not connected');
      throw new Error('SignalR not connected');
    }

    try {
      await this.connection.send(methodName, ...args);
    } catch (error) {
      console.error(`Failed to send ${methodName}:`, error);
      throw error;
    }
  }

  // Invoke server method and wait for result
  public async invoke<T>(methodName: string, ...args: any[]): Promise<T> {
    if (!this.connection || this.connection.state !== signalR.HubConnectionState.Connected) {
      console.error('SignalR not connected');
      throw new Error('SignalR not connected');
    }

    try {
      return await this.connection.invoke<T>(methodName, ...args);
    } catch (error) {
      console.error(`Failed to invoke ${methodName}:`, error);
      throw error;
    }
  }

  // Get connection state
  public getState(): signalR.HubConnectionState | null {
    return this.connection?.state || null;
  }

  // Check if connected
  public isConnected(): boolean {
    return this.connection?.state === signalR.HubConnectionState.Connected;
  }

  // Re-register all listeners (used after reconnection)
  private reregisterListeners(): void {
    if (!this.connection) return;

    this.listeners.forEach((callbacks, eventName) => {
      callbacks.forEach(callback => {
        this.connection!.on(eventName, callback);
      });
    });
  }
}

// Export singleton instance
export const signalRService = new SignalRService();
export default signalRService;
