export interface Client {
  id: string;
  name: string;
  phone: string;
  email: string;
  address: string;
  cin: string;
  cinExpiryDate: string;
  driverLicense: string;
  notes: string;
  createdAt: string;
  updatedAt: string;
}

export type CarStatus = "available" | "rented" | "maintenance" | "retired";
export type FuelType = "essence" | "diesel" | "electrique" | "hybride";
export type Transmission = "manuelle" | "automatique";

export interface Car {
  id: string;
  brand: string;
  model: string;
  year: number;
  plateNumber: string;
  chassisNumber: string;
  color: string;
  fuelType: FuelType;
  seats: number;
  doors: number;
  transmission: Transmission;
  pricePerDay: number;
  pricePerWeek: number;
  pricePerMonth: number;
  depositAmount: number;
  status: CarStatus;
  images: string[];
  insuranceExpiryDate: string;
  technicalInspectionDate: string;
  notes: string;
  createdAt: string;
  updatedAt: string;
}

export type ContractStatus = "active" | "completed" | "cancelled";

export interface Contract {
  id: string;
  clientId: string;
  clientName: string;
  carId: string;
  carName: string;
  startDate: string;
  endDate: string;
  returnDate: string;
  rentalDays: number;
  pricePerDay: number;
  totalAmount: number;
  depositAmount: number;
  depositReturned: boolean;
  status: ContractStatus;
  notes: string;
  createdAt: string;
  updatedAt: string;
}

export type PaymentMethod = "cash" | "card" | "transfer";
export type PaymentType = "payment" | "deposit" | "return";

export interface Payment {
  id: string;
  contractId: string;
  clientName: string;
  amount: number;
  paymentMethod: PaymentMethod;
  paymentDate: string;
  type: PaymentType;
  notes: string;
  createdAt: string;
}

export interface Maintenance {
  id: string;
  carId: string;
  carName: string;
  type: string;
  description: string;
  cost: number;
  date: string;
  garage: string;
  nextMaintenanceDate: string;
  notes: string;
  createdAt: string;
}

export interface DashboardStats {
  activeContracts: number;
  totalCars: number;
  availableCars: number;
  monthlyRevenue: number;
  totalRevenue: number;
  carsInMaintenance: number;
  clientsCount: number;
}

export type Period = "day" | "week" | "month" | "year";
