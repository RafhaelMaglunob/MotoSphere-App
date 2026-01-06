import { TrustedContact } from "./types";

export const contacts: TrustedContact[] = [];

export const addTrustedContact = (contact: {
  name: string;
  relation: string;
  contactNo: string;
  email: string;
  latitude: number;
  longitude: number;
  ownerEmail: string; // <-- required
}): TrustedContact => {
  const newContact: TrustedContact = {
    ...contact
  };

  contacts.push(newContact);
  return newContact;
};
