import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { Order } from '@/types';

// In-memory memory store across function invocations
let memoryOrders: Order[] = [];

// Determine safe storage path (/tmp on serverless / Vercel, local file in dev)
function getStorageFilePath(): string {
  if (process.env.VERCEL || process.env.NODE_ENV === 'production') {
    return path.join('/tmp', 'ayurswift_orders_store.json');
  }
  return path.join(process.cwd(), '.orders_store.json');
}

function loadOrdersFromFile(): Order[] {
  try {
    const filePath = getStorageFilePath();
    if (fs.existsSync(filePath)) {
      const data = fs.readFileSync(filePath, 'utf-8');
      const parsed = JSON.parse(data);
      if (Array.isArray(parsed)) {
        return parsed;
      }
    }
  } catch (err) {
    console.error('Failed to load orders from file:', err);
  }
  return [];
}

function saveOrdersToFile(orders: Order[]): void {
  try {
    const filePath = getStorageFilePath();
    fs.writeFileSync(filePath, JSON.stringify(orders, null, 2), 'utf-8');
  } catch (err) {
    console.error('Failed to persist orders to file:', err);
  }
}

// Initialize memory cache
if (memoryOrders.length === 0) {
  memoryOrders = loadOrdersFromFile();
}

/**
 * GET /api/orders
 * Query by ?q= (Order ID e.g. #AS-1001 or 10-digit mobile number)
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const q = (searchParams.get('q') || '').trim();

  // Reload to pick up updates
  const diskOrders = loadOrdersFromFile();
  // Merge memory and disk
  const allOrdersMap = new Map<string, Order>();
  [...memoryOrders, ...diskOrders].forEach((o) => {
    if (o && o.id) allOrdersMap.set(o.id, o);
  });
  const allOrders = Array.from(allOrdersMap.values());
  memoryOrders = allOrders;

  if (!q) {
    return NextResponse.json({ success: true, orders: allOrders });
  }

  const cleanQ = q.toLowerCase().replace(/[^a-z0-9]/g, '');
  const digitsQ = q.replace(/\D/g, '');

  const matches = allOrders.filter((order) => {
    const cleanId = order.id.toLowerCase().replace(/[^a-z0-9]/g, '');
    const cleanPhone = order.customerPhone.replace(/\D/g, '');
    const cleanName = order.customerName.toLowerCase();

    // Match Order ID (e.g., #AS-1001, AS-1001, 1001)
    if (cleanId.includes(cleanQ) || cleanQ.includes(cleanId)) return true;

    // Match 10-digit phone
    if (digitsQ.length >= 4 && cleanPhone.includes(digitsQ)) return true;

    // Match name
    if (q.length >= 3 && cleanName.includes(q.toLowerCase())) return true;

    return false;
  });

  return NextResponse.json({
    success: true,
    query: q,
    count: matches.length,
    orders: matches,
  });
}

/**
 * POST /api/orders
 * Adds or updates orders in server store
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const incoming: Order[] = Array.isArray(body) ? body : [body];

    const currentOrders = loadOrdersFromFile();
    const ordersMap = new Map<string, Order>();

    // Index existing
    currentOrders.forEach((o) => {
      if (o && o.id) ordersMap.set(o.id, o);
    });

    // Merge incoming
    incoming.forEach((order) => {
      if (order && order.id) {
        ordersMap.set(order.id, {
          ...ordersMap.get(order.id),
          ...order,
        });
      }
    });

    const updated = Array.from(ordersMap.values()).sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );

    memoryOrders = updated;
    saveOrdersToFile(updated);

    return NextResponse.json({
      success: true,
      message: 'Orders synced successfully',
      totalCount: updated.length,
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message || 'Failed to sync orders' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/orders
 * Updates an order status (e.g. from Admin or dispatch)
 */
export async function PUT(request: NextRequest) {
  try {
    const { orderId, orderStatus } = await request.json();
    if (!orderId || !orderStatus) {
      return NextResponse.json(
        { success: false, error: 'orderId and orderStatus are required' },
        { status: 400 }
      );
    }

    const currentOrders = loadOrdersFromFile();
    let found = false;
    const updated = currentOrders.map((o) => {
      if (o.id === orderId) {
        found = true;
        return { ...o, orderStatus };
      }
      return o;
    });

    if (found) {
      memoryOrders = updated;
      saveOrdersToFile(updated);
      return NextResponse.json({ success: true, orderId, orderStatus });
    }

    return NextResponse.json(
      { success: false, error: `Order ${orderId} not found` },
      { status: 404 }
    );
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message || 'Failed to update order status' },
      { status: 500 }
    );
  }
}
