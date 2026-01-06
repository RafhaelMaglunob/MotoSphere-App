import { useState } from "react";
import { View, Text, Pressable } from "react-native";

import UserIcon from "../../components/svg/ProfileIcon";
import MailIcon from "../../components/svg/MailIcon";
import PhoneIcon from "../../components/svg/PhoneIcon";

import { DeleteIcon } from "../../components/svg/DeleteIcon";
import { EditIcon } from "../../components/svg/EditIcon";

import { TrustedContact } from "../../components/services/types";
import AddContactModal from "@/components/modals/AddContactModal";
import EditContactModal from "@/components/modals/EditContactModal";

interface ContactPersonsProps {
  setActiveRoute: (route: string) => void;
  trustedContact: TrustedContact[];
}

function formatNumberGroups(value: string) {
  const digits = value.replace(/\D/g, ""); // remove non-digits
  const part1 = digits.slice(0, 4);
  const part2 = digits.slice(4, 7);
  const part3 = digits.slice(7, 11);

  let formatted = part1;
  if (part2) formatted += " " + part2;
  if (part3) formatted += " " + part3;

  return formatted;
}


export default function ContactPersons({ setActiveRoute, trustedContact }: ContactPersonsProps) {
  const [showModal, setShowModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);

  const handleEdit = (index: number) => {
    setSelectedIndex(index);
    setShowEditModal(true);
  };

  const handleUpdate = (updated: TrustedContact) => {
    if (selectedIndex === null) return;

    trustedContact[selectedIndex] = updated;
    setShowEditModal(false);
  };

  const handleDelete = (i: number) => {
    console.log(i)
  }
  const handleSave = () => {

  }

  return (
    <View style={{ flexDirection: 'column', gap: 14 }}>
      <Text
        style={{
          color: '#fff',
          fontWeight: '700',
          fontSize: 25
        }}
      >
        Trusted Contacts
      </Text>

      <Text
        style={{
          color: '#9BB3D6',
          fontSize: 13
        }}
      >
        Manage who gets notified in case of an emergency.
      </Text>

      <Pressable>
        <View
          style={{
            flexDirection: 'row',
            gap: 12,
            backgroundColor: '#2EA8FF',
            alignSelf: 'flex-start',
            paddingHorizontal: 30,
            paddingVertical: 15,
            borderRadius: 14,

            // IOS/PC
            shadowColor: "rgba(46, 168, 255, 0.4)",
            shadowOpacity: 1,
            shadowRadius: 20,
            shadowOffset: { width: 0, height: 5 },

            // Android
            elevation: 16,
          }}
        >
          <Text style={{ color: "#fff", fontSize: 16, fontWeight: 'bold' }}>+</Text>
          <Pressable
            onPress={() => setShowModal(true)}
          >
            <Text style={{ color: "#fff", fontSize: 16, fontWeight: 'bold' }}>Add Contact</Text>
          </Pressable>
        </View>
      </Pressable>

      <View style={{ flexDirection: 'column', gap: 20 }}>

        {/* Show all contacts */}
        {trustedContact.map((contact, index) => (
          <View
            key={index}
            style={{
              backgroundColor: '#0F2A52',
              padding: 20,
              flexDirection: 'column',
              borderRadius: 20,
              shadowColor: 'rgba(46, 168, 255, 0.5)',      // your color
              shadowOpacity: 0.2,          // 10% opacity
              shadowOffset: { width: 0, height: 1 },
              shadowRadius: 20,
              // Android shadow
              elevation: 12,
            }}
          >
            {/* Contacts Name and relation (Viewing) */}
            <View
              style={{
                flexDirection: 'row',
                justifyContent: 'space-between',
                gap: 15
              }}
            >
              {/* Contact Information */}
              <View
                style={{
                  flexDirection: 'row',
                  gap: 15
                }}
              >
                <View
                  style={{
                    backgroundColor: '#0A1A3A',
                    padding: 10,
                    alignSelf: 'flex-start',
                    borderRadius: 11
                  }}
                >
                  <UserIcon width={30} height={30} />
                </View>
                <View
                  style={{
                    flexDirection: 'column',
                    justifyContent: 'space-evenly'
                  }}
                >
                  <Text
                    style={{
                      color: '#fff',
                      fontWeight: '600',
                      fontSize: 15,
                      letterSpacing: 0.4
                    }}
                  >
                    {contact.name}
                  </Text>
                  <View
                    style={{
                      backgroundColor: 'rgba(6, 182, 212, 0.1)',
                      alignSelf: 'flex-start',
                      paddingHorizontal: 14,
                      paddingVertical: 1,
                      borderRadius: 4
                    }}
                  >
                    <Text
                      style={{ color: '#22D3EE', fontWeight: '300', fontSize: 11 }}
                    >
                      {contact.relation}
                    </Text>
                  </View>
                </View>
              </View>


              {/* Contact Information (Edit/Delete) action */}
              <View
                style={{
                  flexDirection: 'row',
                  gap: 8
                }}
              >
                {/* Edit */}
                <Pressable onPress={() => handleEdit(index)}>
                  <View
                    style={{
                      padding: 8,
                      alignItems: 'center',
                      backgroundColor: '#0A1A3A',
                      borderRadius: 8
                    }}
                  >
                    <EditIcon />
                  </View>
                </Pressable>

                {/* Delete */}
                <Pressable onPress={() => handleDelete(index)}>
                  <View
                    style={{
                      padding: 8,
                      alignItems: 'center',
                      backgroundColor: '#0A1A3A',
                      borderRadius: 8
                    }}
                  >
                    <DeleteIcon />
                  </View>
                </Pressable>
              </View>
            </View>

            {/* Contacts Email and Contact Number */}
            <View
              style={{
                flexDirection: 'column',
                gap: 12,
                marginTop: 20
              }}
            >
              {/* Contact */}
              <View
                style={{
                  flexDirection: 'row',
                  gap: 13,
                  alignItems: 'center'
                }}
              >
                <PhoneIcon />
                <Text style={{ color: '#9BB3D6', fontSize: 12 }}>
                  {formatNumberGroups(contact.contactNo)}
                </Text>
              </View>


              {/* Email */}
              <View
                style={{
                  flexDirection: 'row',
                  gap: 13,
                  alignItems: 'center'
                }}
              >
                <MailIcon />
                <Text style={{ color: '#9BB3D6', fontSize: 12 }}>
                  {contact.email}
                </Text>
              </View>
            </View>
          </View>
        ))}
      </View>

      <AddContactModal visible={showModal} onClose={() => setShowModal(false)} onSave={handleSave} />
      <EditContactModal
        visible={showEditModal}
        contact={selectedIndex !== null ? trustedContact[selectedIndex] : null}
        onClose={() => setShowEditModal(false)}
        onSave={handleUpdate}
      />
    </View>
  );
}
