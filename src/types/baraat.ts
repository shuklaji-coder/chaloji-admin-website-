export interface BaraatBooking {
  id: string;
  passengerId: string;
  passengerName: string;
  passengerPhone: string;
  eventType: string; // e.g. "Baraat", "Ring Ceremony", "Bulk Transport"
  eventDate: string;
  pickupTime?: string;
  vehiclesRequired: number;
  vehiclePreference: string; // e.g. "Auto", "Car", "Tempo Traveller"
  pickupLocation: string;
  destination: string;
  returnRequired?: boolean;
  returnDate?: string;
  returnTime?: string;
  specialRequirements?: string;
  status: 'NEW' | 'CONTACTED' | 'QUOTED' | 'CUSTOMER_ACCEPTED' | 'PAYMENT_PENDING' | 'CONFIRMED' | 'COMPLETED' | 'CANCELLED';
  quotedAmount?: number;
  adminNotes?: string;
  assignedVehiclesCount?: number;
  createdAt?: any;
  updatedAt?: any;
}

export interface BaraatAssignment {
  id?: string;
  bookingId: string;
  vehicleType: string;
  driverName: string;
  driverPhone: string;
  driverId?: string;
  assignedAt?: any;
}
