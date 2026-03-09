import * as signalR from '@microsoft/signalr';

// Enums matching backend
export enum OrderStatus {
  Pending = 0,
  Confirmed = 1,
  Preparing = 2,
  Ready = 3,
  OutForDelivery = 4,
  Delivered = 5,
  Completed = 6,
  Cancelled = 7,
  Failed = 8
}

// DTOs matching backend
export interface OrderStatusUpdateDto {
  orderId: string;
  orderNumber: string;
  status: OrderStatus;
  previousStatus?: OrderStatus;
  timestamp: Date;
  message?: string;
  courierId?: string;
  courierName?: string;
}

class OrderStatusService {
  private connection: signalR.HubConnection | null = null;
  private listeners: Map<string, Set<(...args: any[]) => void>> = new Map();

  // Initialize SignalR connection
  public async start(): Promise<void> {
    if (this.connection?.state === signalR.HubConnectionState.Connected) {
      console.log('OrderStatus already connected');
      return;
    }

    try {
      const token = localStorage.getItem('auth_token');
      const baseUrl = import.meta.env.VITE_API_BASE_URL || 'https://localhost:7200';
      const hubUrl = `${baseUrl}/hubs/order-status`;

      this.connection = new signalR.HubConnectionBuilder()
        .withUrl(hubUrl, {
          accessTokenFactory: () => token || '',
          skipNegotiation: false,
        })
        .withAutomaticReconnect([0, 2000, 5000, 10000, 30000])
        .configureLogging(signalR.LogLevel.Information)
        .build();

      this.connection.onreconnecting((error) => {
        console.warn('OrderStatus reconnecting...', error);
      });

      this.connection.onreconnected((connectionId) => {
        console.log('OrderStatus reconnected:', connectionId);
        this.reregisterListeners();
      });

      this.connection.onclose((error) => {
        console.error('OrderStatus connection closed:', error);
      });

      await this.connection.start();
      console.log('✅ OrderStatus connected successfully');

      this.reregisterListeners();
    } catch (error) {
      console.error('❌ OrderStatus connection failed:', error);
      throw error;
    }
  }

  // Stop connection
  public async stop(): Promise<void> {
    if (this.connection) {
      await this.connection.stop();
      console.log('OrderStatus disconnected');
    }
  }

  // Subscribe to specific order updates
  public async subscribeToOrder(orderId: string): Promise<void> {
    if (!this.connection || this.connection.state !== signalR.HubConnectionState.Connected) {
      throw new Error('OrderStatus not connected');
    }

    try {
      await this.connection.invoke('SubscribeToOrder', orderId);
      console.log('📦 Subscribed to order:', orderId);
    } catch (error) {
      console.error('Failed to subscribe to order:', error);
      throw error;
    }
  }

  // Unsubscribe from order updates
  public async unsubscribeFromOrder(orderId: string): Promise<void> {
    if (!this.connection || this.connection.state !== signalR.HubConnectionState.Connected) {
      throw new Error('OrderStatus not connected');
    }

    try {
      await this.connection.invoke('UnsubscribeFromOrder', orderId);
      console.log('🚫 Unsubscribed from order:', orderId);
    } catch (error) {
      console.error('Failed to unsubscribe from order:', error);
      throw error;
    }
  }

  // Get online couriers (Admin only)
  public async getOnlineCouriers(): Promise<string[]> {
    if (!this.connection || this.connection.state !== signalR.HubConnectionState.Connected) {
      throw new Error('OrderStatus not connected');
    }

    try {
      const couriers = await this.connection.invoke<string[]>('GetOnlineCouriers');
      console.log('👥 Online couriers:', couriers);
      return couriers;
    } catch (error) {
      console.error('Failed to get online couriers:', error);
      throw error;
    }
  }

  // Subscribe to events
  public on(eventName: string, callback: (...args: any[]) => void): void {
    if (!this.connection) {
      console.warn('OrderStatus not initialized. Call start() first.');
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
export const orderStatusService = new OrderStatusService();
export default orderStatusService;
