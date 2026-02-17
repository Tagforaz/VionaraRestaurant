import * as signalR from '@microsoft/signalr';

// DTOs matching backend
export interface CourierLocationDto {
  courierId: string;
  orderId?: string;
  latitude: number;
  longitude: number;
  timestamp: Date;
  courierName?: string;
}

export interface CourierAssignedDto {
  orderId: string;
  orderNumber: string;
  courierId: string;
  courierName: string;
  courierPhone?: string;
  courierImageUrl?: string;
  deliveryAddress: string;
  assignedAt: Date;
}

class CourierTrackingService {
  private connection: signalR.HubConnection | null = null;
  private listeners: Map<string, Set<(...args: any[]) => void>> = new Map();

  // Initialize SignalR connection
  public async start(): Promise<void> {
    if (this.connection?.state === signalR.HubConnectionState.Connected) {
      console.log('CourierTracking already connected');
      return;
    }

    try {
      const token = localStorage.getItem('auth_token');
      console.log('🔑 Token mövcuddur:', !!token);
      console.log('🔑 Token ilk 20 simvolu:', token?.substring(0, 20) + '...');
      
      const baseUrl = import.meta.env.VITE_API_BASE_URL || 'https://localhost:7156';
      const hubUrl = `${baseUrl}/hubs/courier-tracking`;
      console.log('🌐 Hub URL:', hubUrl);

      this.connection = new signalR.HubConnectionBuilder()
        .withUrl(hubUrl, {
          accessTokenFactory: () => {
            const currentToken = localStorage.getItem('auth_token');
            console.log('🎫 AccessTokenFactory çağırıldı, token:', !!currentToken);
            return currentToken || '';
          },
          skipNegotiation: false,
        })
        .withAutomaticReconnect([0, 2000, 5000, 10000, 30000])
        .configureLogging(signalR.LogLevel.Information)
        .build();

      this.connection.onreconnecting((error) => {
        console.warn('CourierTracking reconnecting...', error);
      });

      this.connection.onreconnected((connectionId) => {
        console.log('CourierTracking reconnected:', connectionId);
        this.reregisterListeners();
      });

      this.connection.onclose((error) => {
        console.error('CourierTracking connection closed:', error);
      });

      await this.connection.start();
      console.log('✅ CourierTracking connected successfully');

      this.reregisterListeners();
    } catch (error) {
      console.error('❌ CourierTracking connection failed:', error);
      throw error;
    }
  }

  // Stop connection
  public async stop(): Promise<void> {
    if (this.connection) {
      await this.connection.stop();
      console.log('CourierTracking disconnected');
    }
  }

  // Update courier location (called by courier app)
  public async updateLocation(location: CourierLocationDto): Promise<void> {
    if (!this.connection || this.connection.state !== signalR.HubConnectionState.Connected) {
      throw new Error('CourierTracking not connected');
    }

    try {
      console.log('📤 Göndərilən location data:', location);
      console.log('📤 CourierId tipi:', typeof location.courierId, 'dəyər:', location.courierId);
      console.log('📤 OrderId tipi:', typeof location.orderId, 'dəyər:', location.orderId);
      await this.connection.invoke('UpdateLocation', location);
      console.log('✅ Location updated successfully');
    } catch (error) {
      console.error('❌ UpdateLocation xətası:', error);
      throw error;
    }
  }

  // Track order (called by customer to track courier)
  public async trackOrder(orderId: string): Promise<void> {
    if (!this.connection || this.connection.state !== signalR.HubConnectionState.Connected) {
      throw new Error('CourierTracking not connected');
    }

    try {
      await this.connection.invoke('TrackOrder', orderId);
      console.log('👀 Tracking order:', orderId);
    } catch (error) {
      console.error('Failed to track order:', error);
      throw error;
    }
  }

  // Stop tracking order
  public async stopTrackingOrder(orderId: string): Promise<void> {
    if (!this.connection || this.connection.state !== signalR.HubConnectionState.Connected) {
      throw new Error('CourierTracking not connected');
    }

    try {
      await this.connection.invoke('StopTrackingOrder', orderId);
      console.log('🛑 Stopped tracking order:', orderId);
    } catch (error) {
      console.error('Failed to stop tracking:', error);
      throw error;
    }
  }

  // Subscribe to events
  public on(eventName: string, callback: (...args: any[]) => void): void {
    if (!this.connection) {
      console.warn('CourierTracking not initialized. Call start() first.');
      return;
    }

    if (!this.listeners.has(eventName)) {
      this.listeners.set(eventName, new Set());
    }
    this.listeners.get(eventName)!.add(callback);

    this.connection.on(eventName, callback);
  }

  // Unsubscribe from events
  public off(eventName: string, callback?: (...args: any[]) => void): void {
    if (!this.connection) return;

    if (callback) {
      this.listeners.get(eventName)?.delete(callback);
      this.connection.off(eventName, callback);
    } else {
      this.listeners.delete(eventName);
      this.connection.off(eventName);
    }
  }

  // Get connection state
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
export const courierTrackingService = new CourierTrackingService();
export default courierTrackingService;
