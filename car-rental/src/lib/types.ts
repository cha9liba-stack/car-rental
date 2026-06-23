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

  // Contract number
  contractNumber?: string;

  // Vehicle details
  brand?: string;
  model?: string;
  category?: string;
  registration?: string;
  departureDate?: string;
  departureTime?: string;
  departurePlace?: string;
  departureKm?: string;
  returnKm?: string;
  fuelType?: string;
  remiseRetour?: string;

  // Driver 1 (same as client)
  driverName?: string;
  driverDob?: string;
  driverBirthPlace?: string;
  driverAddress?: string;
  driverPhone?: string;
  driverCin?: string;
  driverCinDate?: string;
  driverCinPlace?: string;
  driverLicense?: string;
  driverLicenseDate?: string;
  driverLicensePlace?: string;

  // Driver 2
  hasDriver2?: boolean;
  driver2Name?: string;
  driver2Dob?: string;
  driver2BirthPlace?: string;
  driver2Address?: string;
  driver2Phone?: string;
  driver2Cin?: string;
  driver2CinDate?: string;
  driver2CinPlace?: string;
  driver2License?: string;
  driver2LicenseDate?: string;
  driver2LicensePlace?: string;

  // Financial
  totalPartiel?: string;
  divers?: string;
  totalHT?: string;
  tva?: string;
  totalFacture?: string;
  plusMoinsDivers?: string;
  depot?: string;
  depotGarantie?: string;
  prep?: string;
  somme?: string;
  resteAPayer?: string;

  // Other
  city?: string;
  contractDate?: string;
  companyId?: string;
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

export interface AuditLog {
  id: string;
  action: string;
  userId: string;
  userName: string;
  targetId: string;
  targetLabel: string;
  details: string;
  timestamp: string;
  createdAt: string;
}

export interface Expense {
  id: string;
  carId: string;
  carName: string;
  category: "fuel" | "repair" | "maintenance" | "insurance" | "tax" | "fine" | "other";
  amount: number;
  date: string;
  description: string;
  notes: string;
  createdAt: string;
  updatedAt: string;
}

export interface ClientPoints {
  id: string;
  clientId: string;
  clientName: string;
  cin: string;
  phone: string;
  points: number;
  totalRents: number;
  totalSpent: number;
  level: "bronze" | "silver" | "gold" | "platinum";
  createdAt: string;
  updatedAt: string;
}

export interface FleetCarStatus {
  carId: string;
  registration: string;
  brand: string;
  model: string;
  status: CarStatus;
  overrideStatus: CarStatus | null;
  overrideFrom: string;
  overrideTo: string;
  currentContractId: string | null;
  currentClientName: string;
  returnDate: string;
  nextMaintenanceDate: string;
  nextMaintenanceType: string;
}
