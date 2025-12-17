import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export interface ShipmentData {
  invoiceItems: any[];
  costingData: any;
  processedItems: any[];
  summary: any;
}

export async function saveShipment(data: ShipmentData): Promise<string> {
  const { data: shipment, error } = await supabase
    .from('shipments')
    .insert({
      invoice_items: data.invoiceItems,
      costing_data: data.costingData,
      processed_items: data.processedItems,
      summary: data.summary,
    })
    .select('id')
    .single();

  if (error) {
    console.error('Error saving shipment:', error);
    throw new Error('Failed to save shipment');
  }

  return shipment.id;
}

export async function getShipment(id: string): Promise<ShipmentData | null> {
  const { data, error } = await supabase
    .from('shipments')
    .select('*')
    .eq('id', id)
    .maybeSingle();

  if (error) {
    console.error('Error fetching shipment:', error);
    return null;
  }

  if (!data) {
    return null;
  }

  return {
    invoiceItems: data.invoice_items,
    costingData: data.costing_data,
    processedItems: data.processed_items,
    summary: data.summary,
  };
}
