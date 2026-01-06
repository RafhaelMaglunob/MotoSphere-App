import { User, Sensor, TrustedContact, GpsMetrics, Notification } from "./types";

// Formating Time into minute/s, day/s, month/s, year/s
function formatTime(seconds: number): string {
  const units = [
    { label: "year", value: 365 * 24 * 60 * 60 },
    { label: "month", value: 30 * 24 * 60 * 60 },
    { label: "day", value: 24 * 60 * 60 },
    { label: "hour", value: 60 * 60 },
    { label: "minute", value: 60 },
    { label: "second", value: 1 },
  ];

  for (const unit of units) {
    const amount = Math.floor(seconds / unit.value);
    if (amount > 0) {
      return amount === 1 ? `1 ${unit.label}` : `${amount} ${unit.label}s`;
    }
  }

  return "Just now"; // if second = 0
}

function timeAgo(dateString: string): string {
  const now = new Date();
  const past = new Date(dateString);
  const diffMs = now.getTime() - past.getTime(); // difference in milliseconds

  const seconds = Math.floor(diffMs / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  const months = Math.floor(days / 30);
  const years = Math.floor(days / 365);

  if (seconds < 60) return `${seconds} second${seconds !== 1 ? "s" : ""} ago`;
  if (minutes < 60) return `${minutes} minute${minutes !== 1 ? "s" : ""} ago`;
  if (hours < 24) return `${hours} hour${hours !== 1 ? "s" : ""} ago`;
  if (days < 30) return `${days} day${days !== 1 ? "s" : ""} ago`;
  if (months < 12) return `${months} month${months !== 1 ? "s" : ""} ago`;
  return `${years} year${years !== 1 ? "s" : ""} ago`;
}

export const mockUser: User = { 
    name: "Alex Johnson", 
    email: "alexjohnson@gmail.com",
    password: "alexjohnson@123",
    contactNo: "09422422422",
    role: 'Rider', 
    connection: 'connected', 
    system: 'optimal', 
    deviceID: 'MK-II',
    battery: 94,
    lastOnline: formatTime(0),
    lastChangePass: timeAgo("2025-10-18T20:10:15Z")
}

export const mockSensor: Sensor[] = [
  { name: 'camera', status: 'active' },
  { name: 'gyroscope', status: 'inactive' },
  { name: 'accelerometer', status: 'active' }
];


{/*

  * * * * * * * * * * * * * * * * * *
  *                                 *
  *   GpsMetrics                    *
  *      name: String,              *
  *      relation: String,          *
  *      contactNo: String,         *
  *      email: number,             *   
  *                                 *
  * * * * * * * * * * * * * * * * * *
  
*/}

export const mockTrustedContact: TrustedContact[] = [
  {name: 'Jheff Cruz', relation: "Friend", contactNo: '09434323323', email: 'jheffcruz@gmail.com', latitude: 14.75281, longitude: 121.03222 },
  {name: 'Heuben Dagami', relation: "Friend", contactNo: '09434336343', email: 'heubendagami@gmail.com', latitude: 14.75400, longitude: 121.02850 },
  {name: 'Kiel Martinez', relation: "Friend", contactNo: '09342634764', email: 'kielmartinez@gmail.com', latitude: 14.75530, longitude: 121.03180 },
  {name: 'Kiel Martinez', relation: "Friend", contactNo: '09342334764', email: 'kielmartinez@gmail.com', latitude: 14.75590, longitude: 121.02950 }
]

{/*

  * * * * * * * * * * * * * * *
  *                           *
  *   GpsMetrics              *
  *      name: String,        *
  *      unit: String,        *
  *      value: number,       *   
  *                           *
  * * * * * * * * * * * * * * *
  
*/}

export const mockMetrics: GpsMetrics[] = [
  { name: "Speed", unit: "km/h", value: 60 },
  { name: "Altitude", unit: "m", value: 23 }
];


{/*

  * * * * * * * * * * * * * * *
  *                           *
  *   Notifications           *
  *      title: String,       *
  *      type: String,        *
  *      description: String, *
  *      date: String         *   
  *                           *
  * * * * * * * * * * * * * * *
  
  bored lang HAHAHA
*/}

export const mockNotification: Notification[] = [
  {title: "Possible Accident Detected", type: "alert", description: "Sensors detected a sudden impact. Emergency contacts were notified.", date: timeAgo("2026-01-5T10:10:15Z")},
  {title: "Firmware Update Available", type: "system", description: "A new firmware version (v2.4.1) is available for your helmet.", date: timeAgo("2026-01-1T20:10:15Z")},
  {title: "Ride Summary", type: "summary", description: "Your ride to Downtown took 45 minutes. Distance: 12.4km.", date: timeAgo("2025-12-18T20:10:15Z")}
]
