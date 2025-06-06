# Test Case: Multiple Orders Delivery Completion

## Scenario
Driver has 2 orders (10 stages total):
- Order 1: 5 stages (driver_ready_order_1, waiting_for_pickup_order_1, restaurant_pickup_order_1, en_route_to_customer_order_1, delivery_complete_order_1)
- Order 2: 5 stages (driver_ready_order_2, waiting_for_pickup_order_2, restaurant_pickup_order_2, en_route_to_customer_order_2, delivery_complete_order_2)

## Expected Behavior Before Fix
❌ **BUG**: When confirming delivery for order 1:
1. Modal appears asking "Have you delivered the order to the customer?"
2. User presses "Confirm"
3. System removes ALL stages (both order 1 and order 2)
4. System redirects to Rating screen (INCORRECT - should only happen after last order)
5. Order 2 stages are lost

## Expected Behavior After Fix
✅ **CORRECT**: When confirming delivery for order 1:
1. Modal appears asking "Have you delivered the order to the customer?"
2. User presses "Confirm"
3. System removes ONLY order 1 stages (5 stages)
4. System keeps order 2 stages (5 stages)
5. AllStages component shows only order 2 PICKUP and DROPOFF stages
6. Swipe function resets to "I'm ready" for order 2
7. System continues with order 2 workflow
8. Only after completing order 2, system redirects to Rating screen

## Key Changes Made

### 1. HomeScreen.tsx
- Fixed `handleCompleteOrder(currentOrderId)` calls to pass specific order ID
- Improved multiple order detection logic
- Added proper UI reset for next order
- Added force update to trigger next order's first stage

### 2. useSocket.ts  
- Modified `handleCompleteOrder()` to only remove stages for specific order
- Prevented `isOrderCompleted = true` when remaining orders exist
- Added proper flag resets for continuing orders

## Test Steps
1. Accept 2 orders
2. Complete all stages for order 1 until delivery_complete_order_1
3. Press confirm in delivery modal
4. Verify:
   - Only order 1 stages are removed
   - Order 2 stages remain
   - AllStages shows order 2 pickup/dropoff
   - Swipe text shows "I'm ready"
   - No redirect to Rating screen
5. Complete order 2
6. Verify redirect to Rating screen happens only after order 2

## Debug Logs to Watch
- "Completing order: [orderId]"
- "Original stages count: X"
- "Remaining stages count: Y" 
- "Multiple orders: not setting isOrderCompleted to true"
- "Multiple orders detected, resetting UI for next order"
- "UI reset completed for next order"
- "Forcing update to next order's first stage"
