
// Sensor interface
export interface Sensor {
  name: string;
  status: 'active' | 'inactive'; // matches MainLayout values
}

export interface User {
  name: string
  email: string
  role: string
  contactNo: string
  connection: string
  deviceID: string
  lastOnline: string
  battery: number
  system: string
}

export interface TrustedContact {
  name: string
  relation: string
  contactNo: string
  email: string
}

export interface GpsMetrics  {
  name: string;
  unit: string;
  value: number;
};

export interface Notification {
  title: string,
  type: string,
  description: string,
  date: string
}