import React, { useState, useEffect } from "react";
import { View, Text, Pressable, Alert, FlatList } from "react-native";

import UserIcon from "../../components/svg/ProfileIcon";
import MailIcon from "../../components/svg/MailIcon";
import PhoneIcon from "../../components/svg/PhoneIcon";

import { DeleteIcon } from "../../components/svg/DeleteIcon";
import { EditIcon } from "../../components/svg/EditIcon";

import { TrustedContact } from "../../components/services/types";
import AddContactModal from "../../components/modals/AddContactModal";
import EditContactModal from "../../components/modals/EditContactModal";
import PendingContactRequestsModal from "../../components/modals/PendingContactRequestModal";

import {
  addTrustedContact,
  deleteTrustedContact,
  updateTrustedContact,
  getPendingContactRequests
} from '../../Backend/controller/trustedContact/trustedContactService';

interface ContactPersonsProps {
  setActiveRoute: (route: string) => void;
  trustedContact: TrustedContact[];
  currentUserEmail: string;
  currentUserUid: string;
  userRole: string;
  onRefreshContacts?: () => Promise<void>;
}

interface ExtendedTrustedContact extends TrustedContact {
  status?: 'pending' | 'accepted' | 'rejected';
}

function formatNumberGroups(value: string) {
  const digits = value.replace(/\D/g, "");

  if (digits.length <= 2) {
    return digits;
  } else if (digits.length <= 6) {
    return `${digits.slice(0, 4)} ${digits.slice(4)}`;
  } else {
    return `${digits.slice(0, 4)} ${digits.slice(4, 7)} ${digits.slice(7, 11)}`;
  }
}

const getStatusColor = (status?: string) => {
  switch (status) {
    case 'pending':
      return { bg: 'rgba(245, 158, 11, 0.15)', text: '#F59E0B', label: '⏳ Pending' };
    case 'accepted':
      return { bg: 'rgba(34, 197, 94, 0.15)', text: '#22C55E', label: '✓ Accepted' };
    case 'rejected':
      return { bg: 'rgba(239, 68, 68, 0.15)', text: '#EF4444', label: '✕ Rejected' };
    default:
      return { bg: 'rgba(6, 182, 212, 0.15)', text: '#06B6D4', label: '✓ Accepted' };
  }
};

export default function ContactPersons({
  setActiveRoute,
  trustedContact,
  currentUserEmail,
  currentUserUid,
  userRole,
  onRefreshContacts
}: ContactPersonsProps) {
  const [showModal, setShowModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showPendingModal, setShowPendingModal] = useState(false);
  const [selectedContact, setSelectedContact] = useState<ExtendedTrustedContact | null>(null);
  const [contacts, setContacts] = useState<ExtendedTrustedContact[]>([]);
  const [pendingOutgoing, setPendingOutgoing] = useState<ExtendedTrustedContact[]>([]);
  const [pendingCount, setPendingCount] = useState(0);
  const [declinedNotification, setDeclinedNotification] = useState<string | null>(null);

  // Update contacts when trustedContact prop changes
  useEffect(() => {
    console.log('📊 ContactPersons - Props:', {
      trustedContactCount: trustedContact.length,
      currentUserEmail,
      currentUserUid,
      userRole,
      trustedContacts: trustedContact
    });
    
    // Separate accepted and pending outgoing requests
    const accepted = trustedContact.filter(c => c.status !== 'pending' && c.status !== 'rejected');
    const pending = trustedContact.filter(c => c.status === 'pending');
    
    setContacts(accepted);
    setPendingOutgoing(pending);
  }, [trustedContact]);

  // Load pending requests count on mount and when modal closes
  useEffect(() => {
    if (userRole.toLowerCase() === 'rider') {
      loadPendingCount();
    }
  }, [currentUserUid, userRole]);

  // Auto-dismiss declined notification after 4 seconds
  useEffect(() => {
    if (declinedNotification) {
      const timer = setTimeout(() => {
        setDeclinedNotification(null);
      }, 4000);
      return () => clearTimeout(timer);
    }
  }, [declinedNotification]);

  const loadPendingCount = async () => {
    try {
      const requests = await getPendingContactRequests(currentUserUid);
      setPendingCount(requests.length);
    } catch (err) {
      console.error("Failed to load pending count:", err);
    }
  };

  const getDisplayContacts = (): Array<{
    name: string;
    relation: string;
    contactNo: string;
    email: string;
    originalContact: ExtendedTrustedContact;
  }> => {
    const isRider = userRole.toLowerCase() === 'rider';

    return contacts.map(c => {
      return {
        name: c.name,
        relation: c.relation,
        contactNo: c.contactNo,
        email: isRider ? c.email : c.contactEmail,
        originalContact: c
      };
    });
  };

  const displayContacts = getDisplayContacts();
  const displayPendingOutgoing = pendingOutgoing.map(c => ({
    name: c.name,
    relation: c.relation,
    contactNo: c.contactNo,
    email: c.email,
    status: c.status,
    originalContact: c
  }));

  const handleEdit = (contact: ExtendedTrustedContact) => {
    setSelectedContact(contact);
    setShowEditModal(true);
  };

  const handleUpdate = async (updated: {
    relation: string;
    email: string;
  }) => {
    if (!selectedContact?.id) return;

    try {
      await updateTrustedContact(selectedContact.id, currentUserUid, {
        relation: updated.relation,
        email: updated.email
      });

      setShowEditModal(false);
      setSelectedContact(null);

      Alert.alert('Success', 'Contact updated successfully');
      console.log('✅ Contact updated and data refreshed');
    } catch (err: any) {
      console.error('❌ Failed to update contact:', err);
      Alert.alert('Error', err.message || 'Failed to update contact');
    }
  };

  const handleDelete = async (contact: ExtendedTrustedContact) => {
    if (!contact.id) return;

    Alert.alert(
      'Delete Contact',
      `Are you sure you want to remove ${contact.name}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteTrustedContact(contact.id!, currentUserUid);

              Alert.alert('Success', 'Contact deleted successfully');
              console.log('✅ Contact deleted and data refreshed');
            } catch (err: any) {
              console.error('❌ Failed to delete contact:', err);
              Alert.alert('Error', err.message || 'Failed to delete contact');
            }
          }
        }
      ]
    );
  };

  const handleSave = async (data: {
    email: string;
    relation: string;
  }) => {
    try {
      await addTrustedContact(
        currentUserUid,
        currentUserEmail,
        data,
        userRole
      );

      setShowModal(false);
      loadPendingCount();

      console.log('✅ Contact added and data refreshed');
    } catch (err: any) {
      console.error('❌ Failed to save contact:', err);
      throw err;
    }
  };

  const handlePendingModalClose = () => {
    setShowPendingModal(false);
    loadPendingCount();
  };

  const handleTrustedContactsRefresh = async () => {
    console.log('🔄 Refreshing trusted contacts after request action...');
    if (onRefreshContacts) {
      await onRefreshContacts();
    }
  };

  const handleRequestRejected = (requesterName: string) => {
    setDeclinedNotification(`${requesterName}'s contact request was declined`);
  };

  return (
    <View style={{ flexDirection: 'column', gap: 14 }}>

      <Text style={{ color: '#fff', fontWeight: '700', fontSize: 25 }}>Trusted Contacts</Text>
      <Text style={{ color: '#9BB3D6', fontSize: 13 }}>
        {userRole.toLowerCase() === 'rider'
          ? 'Manage who gets notified in case of an emergency.'
          : 'View riders who have added you as their emergency contact.'}
      </Text>

      {/* Declined Notification */}
      {declinedNotification && (
        <View
          style={{
            backgroundColor: 'rgba(239, 68, 68, 0.15)',
            borderLeftWidth: 4,
            borderLeftColor: '#EF4444',
            borderRadius: 8,
            padding: 12,
          }}
        >
          <Text style={{ color: '#FCA5A5', fontSize: 13, fontWeight: '500' }}>
            ⚠️ {declinedNotification}
          </Text>
        </View>
      )}

      {userRole.toLowerCase() === 'rider' && (
        <View style={{ flexDirection: 'row', gap: 10 }}>
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

          {pendingCount > 0 && (
            <Pressable onPress={() => setShowPendingModal(true)}>
              <View
                style={{
                  flexDirection: 'row',
                  gap: 8,
                  backgroundColor: '#F59E0B',
                  alignSelf: 'flex-start',
                  paddingHorizontal: 20,
                  paddingVertical: 15,
                  borderRadius: 14,
                  shadowColor: "rgba(245, 158, 11, 0.4)",
                  shadowOpacity: 1,
                  shadowRadius: 20,
                  shadowOffset: { width: 0, height: 5 },
                  elevation: 16,
                }}
              >
                <Text style={{ color: "#fff", fontSize: 14, fontWeight: 'bold' }}>
                  📬 {pendingCount}
                </Text>
                <Text style={{ color: "#fff", fontSize: 14, fontWeight: 'bold' }}>
                  Request{pendingCount > 1 ? 's' : ''}
                </Text>
              </View>
            </Pressable>
          )}
        </View>
      )}

      {/* Pending Outgoing Requests Section */}
      {displayPendingOutgoing.length > 0 && (
        <View style={{ flexDirection: 'column', gap: 10 }}>
          <Text style={{ color: '#F59E0B', fontWeight: '600', fontSize: 14 }}>
            ⏳ Pending Requests ({displayPendingOutgoing.length})
          </Text>
          
          <View style={{
            backgroundColor: '#0F2A52',
            borderRadius: 12,
            overflow: 'hidden',
            borderLeftWidth: 4,
            borderLeftColor: '#F59E0B'
          }}>
            {displayPendingOutgoing.map((contact, index) => {
              const statusColor = getStatusColor(contact.status);
              return (
                <View
                  key={contact.originalContact.id || index}
                  style={{
                    padding: 12,
                    borderBottomWidth: index < displayPendingOutgoing.length - 1 ? 1 : 0,
                    borderBottomColor: '#1E293B'
                  }}
                >
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                    <View style={{ flex: 1 }}>
                      <Text style={{ color: '#fff', fontWeight: '600', fontSize: 14, marginBottom: 2 }}>
                        {contact.name}
                      </Text>
                      <Text style={{ color: '#9BB3D6', fontSize: 11 }}>
                        {contact.email}
                      </Text>
                    </View>
                    
                    <View
                      style={{
                        backgroundColor: statusColor.bg,
                        paddingHorizontal: 12,
                        paddingVertical: 6,
                        borderRadius: 6,
                        marginLeft: 10
                      }}
                    >
                      <Text style={{ color: statusColor.text, fontSize: 11, fontWeight: '600' }}>
                        {statusColor.label}
                      </Text>
                    </View>
                  </View>
                </View>
              );
            })}
          </View>
        </View>
      )}

      {/* Active Trusted Contacts Section */}
      <View style={{ flexDirection: 'column', gap: 20, marginTop: 10 }}>
        {displayContacts.length === 0 ? (
          <View style={{ padding: 40, alignItems: 'center' }}>
            <Text style={{ color: '#9BB3D6', textAlign: 'center' }}>
              {userRole.toLowerCase() === 'rider'
                ? 'No emergency contacts added yet. Add your first contact to get started.'
                : 'No riders have added you as their emergency contact yet.'}
            </Text>
          </View>
        ) : (
          displayContacts.map((contact, index) => (
            <View
              key={contact.originalContact.id || index}
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
                borderLeftWidth: 4,
                borderLeftColor: '#22C55E'
              }}
            >
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', gap: 15 }}>
                <View style={{ flexDirection: 'row', gap: 15, flex: 1 }}>
                  <View style={{ backgroundColor: '#0A1A3A', padding: 10, borderRadius: 11 }}>
                    <UserIcon width={30} height={30} />
                  </View>
                  <View style={{ flexDirection: 'column', justifyContent: 'space-evenly', flex: 1 }}>
                    <Text style={{ color: '#fff', fontWeight: '600', fontSize: 15, letterSpacing: 0.4 }}>
                      {contact.name}
                    </Text>
                    <View style={{ backgroundColor: 'rgba(6, 182, 212, 0.1)', alignSelf: 'flex-start', paddingHorizontal: 14, paddingVertical: 1, borderRadius: 4 }}>
                      <Text style={{ color: '#22D3EE', fontWeight: '300', fontSize: 11 }}>{contact.relation}</Text>
                    </View>
                  </View>
                </View>

                <View style={{ flexDirection: 'row', gap: 8 }}>
                  {userRole.toLowerCase() === 'rider' && (
                    <>
                      <Pressable onPress={() => handleEdit(contact.originalContact)}>
                        <View style={{ padding: 8, alignItems: 'center', backgroundColor: '#0A1A3A', borderRadius: 8 }}>
                          <EditIcon />
                        </View>
                      </Pressable>

                      <Pressable onPress={() => handleDelete(contact.originalContact)}>
                        <View style={{ padding: 8, alignItems: 'center', backgroundColor: '#0A1A3A', borderRadius: 8 }}>
                          <DeleteIcon />
                        </View>
                      </Pressable>
                    </>
                  )}
                </View>
              </View>

              <View style={{ flexDirection: 'column', gap: 12, marginTop: 20 }}>
                <View style={{ flexDirection: 'row', gap: 13, alignItems: 'center' }}>
                  <PhoneIcon />
                  <Text style={{ color: '#9BB3D6', fontSize: 12 }}>
                    {contact.contactNo ? formatNumberGroups(contact.contactNo) : 'No phone number'}
                  </Text>
                </View>
                <View style={{ flexDirection: 'row', gap: 13, alignItems: 'center' }}>
                  <MailIcon />
                  <Text style={{ color: '#9BB3D6', fontSize: 12 }}>{contact.email}</Text>
                </View>
              </View>

              {/* Status Badge */}
              <View style={{ marginTop: 12, alignSelf: 'flex-start' }}>
                <View style={{
                  backgroundColor: 'rgba(34, 197, 94, 0.15)',
                  paddingHorizontal: 10,
                  paddingVertical: 4,
                  borderRadius: 4
                }}>
                  <Text style={{ color: '#22C55E', fontSize: 10, fontWeight: '600' }}>✓ ACCEPTED</Text>
                </View>
              </View>
            </View>
          ))
        )}
      </View>

      {userRole.toLowerCase() === 'rider' && (
        <>
          <AddContactModal
            visible={showModal}
            onClose={() => setShowModal(false)}
            onSave={handleSave}
          />
          <EditContactModal
            visible={showEditModal}
            contact={selectedContact}
            onClose={() => {
              setShowEditModal(false);
              setSelectedContact(null);
            }}
            onSave={handleUpdate}
          />
          <PendingContactRequestsModal
            visible={showPendingModal}
            onClose={handlePendingModalClose}
            currentUserUid={currentUserUid}
            onRequestUpdated={loadPendingCount}
            onRequestRejected={handleRequestRejected}
            onTrustedContactsRefresh={handleTrustedContactsRefresh}
          />
        </>
      )}
    </View>
  );
}