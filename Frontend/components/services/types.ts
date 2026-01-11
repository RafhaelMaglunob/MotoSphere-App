
// Sensor interface

export interface Sensor {
  name: string;
  status: 'active' | 'inactive'; // matches MainLayout values
}

export interface User {
  name: string
  email: string
  password: string
  role: string
  contactNo: string
  connection: string
  deviceID: string
  lastOnline: string
  battery: number
  system: string
  lastChangePass: string
}

export interface TrustedContact {
  ownerEmail: string,
  name: string
  relation: string
  contactNo: string
  email: string
  latitude: number
  longitude: number
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