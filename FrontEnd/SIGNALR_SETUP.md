# SignalR Real-Time Integration

## ✅ Frontend Setup Complete

### What's Installed:
1. ✅ `@microsoft/signalr` package
2. ✅ Three SignalR services created:
   - `courierTrackingService.ts` - Real-time courier location tracking
   - `orderStatusService.ts` - Real-time order status updates
   - `signalrService.ts` - Generic SignalR service (unused, can be removed)
3. ✅ Integration completed:
   - **OrderTrackingPage**: Customer sees live courier location on map
   - **CourierDashboard**: Courier sends GPS location updates every few seconds
   - ~~AdminReservationsPage~~: Removed (not needed for reservations)

---

## 📡 Backend Hub Structure

You have TWO SignalR hubs in backend:

### 1. **CourierTrackingHub** (`/courierTrackingHub`)
**Purpose**: Real-time courier GPS location tracking

**Server Methods (callable from frontend):**
- `UpdateLocation(CourierLocationDto)` - Courier sends location update
- `TrackOrder(Guid orderId)` - Customer starts tracking courier
- `StopTrackingOrder(Guid orderId)` - Customer stops tracking

**Server Events (sent to clients):**
- `CourierLocationUpdated` - Broadcast to customer & admins
- `CourierAssigned` - When courier is assigned to order
- `OrderAssigned` - Sent to courier when assigned

**Frontend Files:**
- ✅ `src/services/courierTrackingService.ts`
- ✅ `src/pages/OrderTrackingPage.tsx` (customer tracking)
- ✅ `src/pages/courier/CourierDashboard.tsx` (courier location updates)

---

### 2. **OrderStatusHub** (`/orderStatusHub`)
**Purpose**: Real-time order status updates

**Server Methods (callable from frontend):**
- `SubscribeToOrder(Guid orderId)` - Subscribe to order updates
- `UnsubscribeFromOrder(Guid orderId)` - Unsubscribe
- `GetOnlineCouriers()` - Admin: Get list of online couriers

**Server Events (sent to clients):**
- `OrderStatusChanged` - Order status update (Pending → Confirmed → Preparing → Ready → OutForDelivery → Delivered)
- `NewOrderCreated` - New order notification (to Admin group)

**Frontend Files:**
- ✅ `src/services/orderStatusService.ts`
- ✅ `src/pages/OrderTrackingPage.tsx` (order status updates)

---

## 🎯 Frontend Implementation Details

### Customer Order Tracking (`OrderTrackingPage.tsx`)

**Connected to:**
- ✅ `CourierTrackingHub` - To track courier GPS location
- ✅ `OrderStatusHub` - To receive order status updates

**Real-time Features:**
- Live courier location on map (uses `CourierMap` component)
- Order status updates with toast notifications
- Courier assignment notifications
- Automatic reconnection on network issues

**Events Subscribed:**
```typescript
// Order status changes
orderStatusService.on('OrderStatusChanged', (update) => { ... });

// Courier assigned to order
courierTrackingService.on('CourierAssigned', (data) => { ... });

// Courier location updates
courierTrackingService.on('CourierLocationUpdated', (location) => { ... });
```

---

### Courier Dashboard (`CourierDashboard.tsx`)

**Connected to:**
- ✅ `CourierTrackingHub` - To send GPS location updates

**Real-time Features:**
- Automatic GPS tracking (watches device location)
- Sends location updates every time position changes
- Shows "GPS Aktiv" badge when tracking is enabled
- Sends `courierId`, `orderId`, `latitude`, `longitude`, `timestamp`

**How it works:**
```typescript
// Start tracking on mount
courierTrackingService.start();

// Watch GPS position
navigator.geolocation.watchPosition((position) => {
  courierTrackingService.updateLocation({
    courierId: user.id,
    orderId: activeDelivery?.id, // Current active delivery
    latitude: position.coords.latitude,
    longitude: position.coords.longitude,
    timestamp: new Date(),
  });
});
```

---

## 🔧 Backend Configuration Required

### Program.cs
```csharp
// Add SignalR
builder.Services.AddSignalR();

// CORS (important for SignalR)
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowFrontend", policy =>
    {
        policy.WithOrigins(
            "http://localhost:5173", 
            "http://localhost:3000",
            "https://yourdomain.com"
        )
        .AllowAnyHeader()
        .AllowAnyMethod()
        .AllowCredentials(); // Required for SignalR WebSocket
    });
});

var app = builder.Build();

app.UseCors("AllowFrontend");

// Map SignalR hubs
app.MapHub<CourierTrackingHub>("/courierTrackingHub");
app.MapHub<OrderStatusHub>("/orderStatusHub");

app.Run();
```

---

## 📋 Backend DTOs (Already Implemented)

### CourierLocationDto
```csharp
public record CourierLocationDto(
    Guid CourierId,
    Guid? OrderId,
    decimal Latitude,
    decimal Longitude,
    DateTime Timestamp,
    string? CourierName
);
```

### OrderStatusUpdateDto
```csharp
public record OrderStatusUpdateDto(
    Guid OrderId,
    string OrderNumber,
    OrderStatus Status,
    OrderStatus? PreviousStatus,
    DateTime Timestamp,
    string? Message,
    Guid? CourierId,
    string? CourierName
);
```

### CourierAssignedDto
```csharp
public record CourierAssignedDto(
    Guid OrderId,
    string OrderNumber,
    Guid CourierId,
    string CourierName,
    string? CourierPhone,
    string? CourierImageUrl,
    string DeliveryAddress,
    DateTime AssignedAt
);
```

---

## 🔐 Authentication

Both hubs use `[Authorize]` attribute. Frontend automatically sends JWT token:

```typescript
.withUrl(hubUrl, {
  accessTokenFactory: () => localStorage.getItem('token') || '',
})
```

**Backend Hub Authorization:**
```csharp
[Authorize]
public class CourierTrackingHub : Hub
{
    public override async Task OnConnectedAsync()
    {
        var userId = Guid.Parse(Context.UserIdentifier!);
        
        if (Context.User!.IsInRole("Admin"))
        {
            await Groups.AddToGroupAsync(Context.ConnectionId, "Admins");
        }
        else if (Context.User.IsInRole("Courier"))
        {
            await Groups.AddToGroupAsync(Context.ConnectionId, "Couriers");
        }
        else if (Context.User.IsInRole("Customer"))
        {
            await Groups.AddToGroupAsync(Context.ConnectionId, "Customers");
        }
        
        await base.OnConnectedAsync();
    }
}
```

---

## 🧪 Testing

### 1. Start Backend
```bash
dotnet run
```

### 2. Start Frontend
```bash
npm run dev
```

### 3. Test Scenarios

#### Courier Location Tracking:
1. Login as **Courier**
2. Go to Courier Dashboard
3. Check "GPS Aktiv" badge appears
4. Open browser console → See `📍 Location updated` logs

#### Customer Order Tracking:
1. Login as **Customer**
2. Go to Order Tracking page (`/order-tracking/:orderId`)
3. Check console → See `✅ SignalR connected`
4. If courier is active, map should show live location

#### Admin Order Notifications:
1. Login as **Admin**
2. Customer creates new order
3. Admin receives `NewOrderCreated` event
4. Toast notification appears

---

## 📊 Real-Time Flow

### Order Creation Flow:
```
Customer creates order
      ↓
Backend saves to DB
      ↓
NotificationService.SendNewOrderNotificationAsync()
      ↓
Hub sends "NewOrderCreated" → Admins group
      ↓
Admin receives real-time notification
```

### Courier Assignment Flow:
```
Admin assigns courier to order
      ↓
Backend updates order.CourierId
      ↓
NotificationService.SendCourierAssignedNotificationAsync()
      ↓
Hub sends:
  - "CourierAssigned" → Customer
  - "OrderAssigned" → Courier
      ↓
Both receive real-time notifications
```

### Location Tracking Flow:
```
Courier's device GPS updates
      ↓
Frontend sends UpdateLocation()
      ↓
Backend saves to LocationHistory table
      ↓
Hub sends "CourierLocationUpdated" →
  - Customer (if tracking order)
  - Admins group
      ↓
Customer sees live map update
```

---

## 🐛 Troubleshooting

### Issue: `Failed to connect`
- ✅ Check backend CORS includes `AllowCredentials()`
- ✅ Check hub URL matches: `https://localhost:7156/courierTrackingHub`
- ✅ Check `.env` has `VITE_API_BASE_URL=https://localhost:7156`

### Issue: `401 Unauthorized`
- ✅ Check JWT token exists: `localStorage.getItem('token')`
- ✅ Check backend JWT authentication is configured
- ✅ Check user role matches hub authorization

### Issue: `GPS not working`
- ✅ Browser needs HTTPS (or localhost)
- ✅ User must grant geolocation permission
- ✅ Check browser console for permission errors

### Issue: `Map not showing`
- ✅ Check `CourierMap` component exists
- ✅ Courier must send location updates first
- ✅ Check `courierLocation` state is not null

---

## 🎉 Summary

### ✅ Completed Integration:
- Real-time courier GPS tracking
- Live order status updates
- Customer order tracking with map
- Courier dashboard with automatic location sharing
- Admin notifications for new orders
- Automatic reconnection on network issues

### 🔄 What Happens Now:
1. **Courier** opens dashboard → GPS starts tracking → Location sent every few seconds
2. **Customer** tracks order → Sees live courier on map → Receives status updates
3. **Admin** receives real-time notifications for new orders & status changes

Backend is already implemented! Just make sure:
- Hub URLs match (`/courierTrackingHub`, `/orderStatusHub`)
- CORS configured with `AllowCredentials()`
- `NotificationService` calls hub methods (already done in your code)

Everything is ready! 🚀
