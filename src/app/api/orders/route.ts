import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { createClient } from '@supabase/supabase-js';
import { Order } from '@/types';

// Supabase Serverless Client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const isSupabaseConfigured = Boolean(
  supabaseUrl &&
  supabaseAnonKey &&
  supabaseUrl.startsWith('https://') &&
  supabaseUrl !== 'https://your-project.supabase.co'
);

const supabase = isSupabaseConfigured ? createClient(supabaseUrl, supabaseAnonKey) : null;

// In-memory store across function invocations
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

// Convert Supabase DB row to Order type
function mapDbRowToOrder(row: any): Order {
  return {
    id: row.id,
    customerName: row.customer_name,
    customerPhone: row.customer_phone,
    deliveryType: row.delivery_type,
    deliveryAddress: row.delivery_address,
    city: row.city,
    pincode: row.pincode,
    landmark: row.landmark || '',
    items: row.items || [],
    subtotal: Number(row.subtotal) || 0,
    deliveryFee: Number(row.delivery_fee) || 0,
    totalAmount: Number(row.total_amount) || 0,
    paymentMethod: row.payment_method,
    paymentStatus: row.payment_status,
    orderStatus: row.order_status,
    rapidoCopied: Boolean(row.rapido_copied),
    createdAt: row.created_at,
  };
}

// Convert Order type to Supabase DB row
function mapOrderToDbRow(order: Order) {
  return {
    id: order.id,
    customer_name: order.customerName,
    customer_phone: order.customerPhone,
    delivery_type: order.deliveryType,
    delivery_address: order.deliveryAddress,
    city: order.city,
    pincode: order.pincode,
    landmark: order.landmark || null,
    items: order.items,
    subtotal: order.subtotal,
    delivery_fee: order.deliveryFee,
    total_amount: order.totalAmount,
    payment_method: order.paymentMethod,
    payment_status: order.paymentStatus,
    order_status: order.orderStatus,
    rapido_copied: order.rapidoCopied,
    created_at: order.createdAt,
    updated_at: new Date().toISOString(),
  };
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

  // Reload to pick up updates from disk
  const diskOrders = loadOrdersFromFile();
  const allOrdersMap = new Map<string, Order>();

  // If Supabase is active, fetch from PostgreSQL cloud database
  if (supabase) {
    try {
      const { data: dbOrders, error } = await supabase
        .from('orders')
        .select('*')
        .order('created_at', { ascending: false });

      if (!error && Array.isArray(dbOrders)) {
        dbOrders.forEach((row) => {
          const ord = mapDbRowToOrder(row);
          if (ord.id) allOrdersMap.set(ord.id, ord);
        });
      }
    } catch (e) {
      console.warn('Supabase read error in API route:', e);
    }
  }

  // Merge with memory and disk orders
  [...memoryOrders, ...diskOrders].forEach((o) => {
    if (o && o.id) {
      if (!allOrdersMap.has(o.id)) {
        allOrdersMap.set(o.id, o);
      }
    }
  });

  const allOrders = Array.from(allOrdersMap.values()).sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
  memoryOrders = allOrders;

  if (!q) {
    return NextResponse.json({ success: true, count: allOrders.length, orders: allOrders });
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
 * Adds or updates orders in server store & Supabase database
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

    // Sync to Supabase PostgreSQL database
    if (supabase && incoming.length > 0) {
      try {
        const rows = incoming.map(mapOrderToDbRow);
        await supabase.from('orders').upsert(rows);
      } catch (dbErr) {
        console.warn('Supabase upsert error in POST /api/orders:', dbErr);
      }
    }

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
    }

    // Sync status to Supabase
    if (supabase) {
      try {
        await supabase
          .from('orders')
          .update({
            order_status: orderStatus,
            updated_at: new Date().toISOString(),
          })
          .eq('id', orderId);
      } catch (dbErr) {
        console.warn('Supabase status update error:', dbErr);
      }
    }

    return NextResponse.json({ success: true, orderId, orderStatus });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message || 'Failed to update order status' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/orders?id=...
 * Removes an order (e.g. from Admin test order cleanup)
 */
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const orderId = searchParams.get('id');
    if (!orderId) {
      return NextResponse.json(
        { success: false, error: 'id query parameter required' },
        { status: 400 }
      );
    }

    const currentOrders = loadOrdersFromFile();
    const updated = currentOrders.filter((o) => o.id !== orderId);

    memoryOrders = updated;
    saveOrdersToFile(updated);

    // Delete from Supabase
    if (supabase) {
      try {
        await supabase.from('orders').delete().eq('id', orderId);
      } catch (dbErr) {
        console.warn('Supabase delete error:', dbErr);
      }
    }

    return NextResponse.json({
      success: true,
      message: `Order ${orderId} removed successfully`,
      remainingCount: updated.length,
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message || 'Failed to delete order' },
      { status: 500 }
    );
  }
}
