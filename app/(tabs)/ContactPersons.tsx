import React, { useState } from "react";
import { View, Text, Pressable } from "react-native";

import UserIcon from "../../components/svg/ProfileIcon";
import MailIcon from "../../components/svg/MailIcon";
import PhoneIcon from "../../components/svg/PhoneIcon";

import { DeleteIcon } from "../../components/svg/DeleteIcon";
import { EditIcon } from "../../components/svg/EditIcon";

import { TrustedContact } from "../../components/services/types";
import AddContactModal from "@/components/modals/AddContactModal";
import EditContactModal from "@/components/modals/EditContactModal";

import { addTrustedContact, contacts } from "@/components/services/trustedContacts";

interface ContactPersonsProps {
  setActiveRoute: (route: string) => void;
  currentUserEmail: string; // pass the logged-in user's email
}

function formatNumberGroups(value: string) {
  return value
    .toString()
    .replace(/\D/g, "")
    .replace(/(.{4})/g, "$1 ")
    .trim();
}

export default function ContactPersons({ setActiveRoute, currentUserEmail }: ContactPersonsProps) {
  const [showModal, setShowModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [reload, setReload] = useState(0);

  const [currentContact, setCurrentContact] = useState<TrustedContact[]>(contacts);

  // Filter contacts for current user
  const userContacts = contacts.filter(c => c.ownerEmail === currentUserEmail);

  const handleEdit = (index: number) => {
    setSelectedIndex(index);
    setShowEditModal(true);
  };

  const handleUpdate = (updated: TrustedContact) => {
    if (selectedIndex === null) return;

    // Get the original contact before edit
    const originalContact = userContacts[selectedIndex];

    // Find the index in the global array
    const globalIndex = contacts.findIndex(
      (c) =>
        c.ownerEmail === originalContact.ownerEmail &&
        c.email === originalContact.email &&
        c.contactNo === originalContact.contactNo
    );

    if (globalIndex !== -1) {
      // Update the global array
      contacts[globalIndex] = { ...updated, ownerEmail: currentUserEmail };

      // Update local state
      setCurrentContact(prev =>
        prev.map(c =>
          c.ownerEmail === originalContact.ownerEmail &&
            c.email === originalContact.email &&
            c.contactNo === originalContact.contactNo
            ? { ...updated, ownerEmail: currentUserEmail }
            : c
        )
      );

      setShowEditModal(false);
    }
  };


  const handleDelete = (targetContact: TrustedContact) => {
    const globalIndex = contacts.findIndex(
      (c) =>
        c.ownerEmail === targetContact.ownerEmail &&
        c.email === targetContact.email &&
        c.contactNo === targetContact.contactNo
    );

    if (globalIndex !== -1) {
      contacts.splice(globalIndex, 1);
      setReload(prev => prev + 1); // re-render
    }
    handleUpdateContact(targetContact)
  };


  const handleSave = (data: {
    name: string;
    relation: string;
    contactNo: string;
    email: string;
    latitude: number;
    longitude: number;
  }) => {
    const newContact = {
      ...data,
      ownerEmail: currentUserEmail,
      latitude: data.latitude ?? 0,
      longitude: data.longitude ?? 0,
    }
    addTrustedContact(newContact);

    setShowModal(false);

    handleUpdateContact(newContact);
  };

  const handleUpdateContact = (updateContact: TrustedContact) => {
    setCurrentContact(prev => prev.map(c =>
      c.email === updateContact.email && c.contactNo === updateContact.contactNo
        ? updateContact
        : c
    ));
  };



  return (
    <View style={{ flexDirection: 'column', gap: 14 }}>
      <Text style={{ color: '#fff', fontWeight: '700', fontSize: 25 }}>Trusted Contacts</Text>
      <Text style={{ color: '#9BB3D6', fontSize: 13 }}>
        Manage who gets notified in case of an emergency.
      </Text>

      <Pressable onPress={() => setShowModal(true)}>
        <View
          style={{
            flexDirection: 'row',
            gap: 12,
            backgroundColor: '#2EA8FF',
            alignSelf: 'flex-start',
            paddingHorizontal: 30,
            paddingVertical: 15,
            borderRadius: 14,
            shadowColor: "rgba(46, 168, 255, 0.4)",
            shadowOpacity: 1,
            shadowRadius: 20,
            shadowOffset: { width: 0, height: 5 },
            elevation: 16,
          }}
        >
          <Text style={{ color: "#fff", fontSize: 16, fontWeight: 'bold' }}>+</Text>
          <Text style={{ color: "#fff", fontSize: 16, fontWeight: 'bold' }}>Add Contact</Text>
        </View>
      </Pressable>

      <View style={{ flexDirection: 'column', gap: 20, marginTop: 10 }}>
        {userContacts.map((contact, index) => (
          <View
            key={index}
            style={{
              backgroundColor: '#0F2A52',
              padding: 20,
              flexDirection: 'column',
              borderRadius: 20,
              shadowColor: 'rgba(46, 168, 255, 0.5)',
              shadowOpacity: 0.2,
              shadowOffset: { width: 0, height: 1 },
              shadowRadius: 20,
              elevation: 12,
            }}
          >
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', gap: 15 }}>
              <View style={{ flexDirection: 'row', gap: 15 }}>
                <View style={{ backgroundColor: '#0A1A3A', padding: 10, borderRadius: 11 }}>
                  <UserIcon width={30} height={30} />
                </View>
                <View style={{ flexDirection: 'column', justifyContent: 'space-evenly' }}>
                  <Text style={{ color: '#fff', fontWeight: '600', fontSize: 15, letterSpacing: 0.4 }}>
                    {contact.name}
                  </Text>
                  <View style={{ backgroundColor: 'rgba(6, 182, 212, 0.1)', alignSelf: 'flex-start', paddingHorizontal: 14, paddingVertical: 1, borderRadius: 4 }}>
                    <Text style={{ color: '#22D3EE', fontWeight: '300', fontSize: 11 }}>{contact.relation}</Text>
                  </View>
                </View>
              </View>

              <View style={{ flexDirection: 'row', gap: 8 }}>
                <Pressable onPress={() => handleEdit(index)}>
                  <View style={{ padding: 8, alignItems: 'center', backgroundColor: '#0A1A3A', borderRadius: 8 }}>
                    <EditIcon />
                  </View>
                </Pressable>

                <Pressable onPress={() => handleDelete(contact)}>
                  <View style={{ padding: 8, alignItems: 'center', backgroundColor: '#0A1A3A', borderRadius: 8 }}>
                    <DeleteIcon />
                  </View>
                </Pressable>
              </View>
            </View>

            <View style={{ flexDirection: 'column', gap: 12, marginTop: 20 }}>
              <View style={{ flexDirection: 'row', gap: 13, alignItems: 'center' }}>
                <PhoneIcon />
                <Text style={{ color: '#9BB3D6', fontSize: 12 }}>{formatNumberGroups(contact.contactNo)}</Text>
              </View>
              <View style={{ flexDirection: 'row', gap: 13, alignItems: 'center' }}>
                <MailIcon />
                <Text style={{ color: '#9BB3D6', fontSize: 12 }}>{contact.email}</Text>
              </View>
            </View>
          </View>
        ))}
      </View>

      <AddContactModal visible={showModal} onClose={() => setShowModal(false)} onSave={handleSave} />
      <EditContactModal
        visible={showEditModal}
        contact={selectedIndex !== null ? userContacts[selectedIndex] : null}
        onClose={() => setShowEditModal(false)}
        onSave={handleUpdate}
      />
    </View>
  );
}
