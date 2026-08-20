export interface SharingRoute {
  id: string;
  name: string; // e.g. "Phoolpur to Main Market"
  description?: string;
  startPointName: string;
  endPointName: string;
  status: 'ACTIVE' | 'INACTIVE';
  totalPointsCount?: number;
  createdAt?: any;
  updatedAt?: any;
}

export interface SharingPickupPoint {
  id: string;
  routeId: string;
  name: string; // e.g. "Sabzi Mandi"
  latitude: number;
  longitude: number;
  sequence: number; // 1, 2, 3...
  address?: string;
  active: boolean;
}

export interface SharingFare {
  id: string;
  routeId: string;
  pickupPointId: string;
  dropPointId: string;
  fare: number; // Fixed fare per person (e.g. ₹20)
}
