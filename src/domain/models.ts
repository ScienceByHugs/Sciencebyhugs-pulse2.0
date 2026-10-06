export type Route = 'subcutaneous' | 'intramuscular' | 'oral' | 'topical' | 'other';

export type ProtocolItem = {
  id: string;
  name: string;
  route: Route;
  doseAmount: number;
  doseUnit: 'mcg' | 'mg' | 'mL' | 'IU' | 'unit';
  scheduledTime?: string;
};

export type InventoryContainer = {
  id: string;
  protocolItemId: string;
  totalAmount: number;
  remainingAmount: number;
  unit: string;
  openedAt?: string;
  expiresAt?: string;
};

export type DoseLog = {
  id: string;
  protocolItemId: string;
  amount: number;
  unit: string;
  loggedAt: string;
  site?: string;
  notes?: string;
};
