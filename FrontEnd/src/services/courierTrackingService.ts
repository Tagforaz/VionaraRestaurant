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

  public async start(): Promise<void> {
    if (this.connection?.state === signalR.HubConnectionState.Connected) {
      return;
    }

    const baseUrl = import.meta.env.VITE_API_BASE_URL || 'https://localhost:7156';
    const hubUrl = `${baseUrl}/hubs/courier-tracking`;

    // localhost-da WebSocket self-signed SSL ilə fail olur
    // LongPolling həmişə işləyir; production-da WebSocket avtomatik seçilir
    const isLocalhost = baseUrl.includes('localhost') || baseUrl.includes('127.0.0.1');
    const transport = isLocalhost
      ? signalR.HttpTransportType.LongPolling
      : signalR.HttpTransportType.WebSockets | signalR.HttpTransportType.ServerSentEvents | signalR.HttpTransportType.LongPolling;

    this.connection = new signalR.HubConnectionBuilder()
      .withUrl(hubUrl, {
        accessTokenFactory: () =>
          localStorage.getItem('auth_token')
          || localStorage.getItem('token')
          || localStorage.getItem('accessToken')
          || '',
        transport,
        skipNegotiation: false,
      })
      .withAutomaticReconnect([0, 2000, 5000, 10000, 30000])
      .configureLogging(signalR.LogLevel.Warning) // Error/Warning-dən aşağı logları gizlət
      .build();

    this.connection.onreconnecting(() => {
      console.warn('CourierTracking: yenidən qoşulur...');
    });

    this.connection.onreconnected((connectionId) => {
      console.log('CourierTracking: qoşuldu', connectionId);
      this.reregisterListeners();
    });

    this.connection.onclose((error) => {
      if (error) console.error('CourierTracking: bağlantı kəsildi', error);
    });

    try {
      await this.connection.start();
      console.log('✅ CourierTracking connected');
      this.reregisterListeners();
    } catch (error) {
      console.error('❌ CourierTracking connection failed:', error);
      throw error;
    }
  }

  public async stop(): Promise<void> {
    if (this.connection) {
      await this.connection.stop();
    }
  }

  public async updateLocation(location: CourierLocationDto): Promise<void> {
    if (!this.connection || this.connection.state !== signalR.HubConnectionState.Connected) {
      throw new Error('CourierTracking not connected');
    }
    await this.connection.invoke('UpdateLocation', location);
  }

  public async trackOrder(orderId: string): Promise<void> {
    if (!this.connection || this.connection.state !== signalR.HubConnectionState.Connected) {
      throw new Error('CourierTracking not connected');
    }
    await this.connection.invoke('TrackOrder', orderId);
  }

  public async stopTrackingOrder(orderId: string): Promise<void> {
    if (!this.connection || this.connection.state !== signalR.HubConnectionState.Connected) {
      throw new Error('CourierTracking not connected');
    }
    await this.connection.invoke('StopTrackingOrder', orderId);
  }

  public on(eventName: string, callback: (...args: any[]) => void): void {
    if (!this.connection) {
      console.warn('CourierTracking: start() çağırılmayıb');
      return;
    }
    if (!this.listeners.has(eventName)) {
      this.listeners.set(eventName, new Set());
    }
    this.listeners.get(eventName)!.add(callback);
    this.connection.on(eventName, callback);
  }

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

  public isConnected(): boolean {
    return this.connection?.state === signalR.HubConnectionState.Connected;
  }

  private reregisterListeners(): void {
    if (!this.connection) return;
    this.listeners.forEach((callbacks, eventName) => {
      callbacks.forEach(cb => this.connection!.on(eventName, cb));
    });
  }
}

export const courierTrackingService = new CourierTrackingService();
export default courierTrackingService;