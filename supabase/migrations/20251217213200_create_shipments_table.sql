/*
  # Create shipments table for sharing processed invoice data

  1. New Tables
    - `shipments`
      - `id` (uuid, primary key) - Unique identifier for the shipment
      - `created_at` (timestamptz) - When the shipment was created
      - `invoice_items` (jsonb) - Original invoice line items
      - `costing_data` (jsonb) - Air shipment costing data (rates, factors, etc.)
      - `processed_items` (jsonb) - Final processed items with duties and factors applied
      - `summary` (jsonb) - Cost summary totals
      
  2. Security
    - Enable RLS on `shipments` table
    - Add policy for anyone to read shared shipments (public access)
    - Add policy for anyone to create shipments (no auth required for POC)
*/

CREATE TABLE IF NOT EXISTS shipments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz DEFAULT now(),
  invoice_items jsonb NOT NULL DEFAULT '[]'::jsonb,
  costing_data jsonb NOT NULL DEFAULT '{}'::jsonb,
  processed_items jsonb NOT NULL DEFAULT '[]'::jsonb,
  summary jsonb NOT NULL DEFAULT '{}'::jsonb
);

ALTER TABLE shipments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view shared shipments"
  ON shipments
  FOR SELECT
  USING (true);

CREATE POLICY "Anyone can create shipments"
  ON shipments
  FOR INSERT
  WITH CHECK (true);