import { formatTime, timeAgo } from "./timeUtils";
import { User } from "./types";

export const users: User[] = [];

export const addUser = (user: { name: string; email: string; password: string; contactNo: string, role: string }) => {
  const newUser: User = {
    name: user.name,
    email: user.email,
    password: user.password,
    contactNo: user.contactNo,
    role: user.role,
    connection: "connected",
    deviceID: "MK-II",
    lastOnline: formatTime(0),
    battery: 100,
    system: "optimal",
    lastChangePass: timeAgo(new Date().toISOString()),
  };

  users.push(newUser);
  return newUser;
};
