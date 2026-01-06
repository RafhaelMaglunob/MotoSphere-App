import React, { useState, useEffect } from "react";
import { Modal, View, Text, TextInput, Pressable, StyleSheet, Platform } from "react-native";
import * as Location from "expo-location";
import MapView, { Marker } from "react-native-maps";

interface AddContactModalProps {
  visible: boolean;
  onClose: () => void;
  onSave: (data: any) => void; // you can type properly
}

export default function AddContactModal({ visible, onClose, onSave }: AddContactModalProps) {
  const [name, setName] = useState("");
  const [relation, setRelation] = useState("");
  const [contactNo, setContactNo] = useState("");
  const [email, setEmail] = useState("");
  
  const handleSave = () => {
    onSave({ name, relation, contactNo, email });
    // Reset
    setName(""); setRelation(""); setContactNo(""); setEmail("");
    onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.overlay}>
        <View style={styles.modal}>
          <Text style={styles.title}>Add Contact</Text>

          <TextInput
            placeholder="Name"
            placeholderTextColor="#888"
            style={styles.input}
            value={name}
            onChangeText={setName}
          />
          <TextInput
            placeholder="Relation"
            placeholderTextColor="#888"
            style={styles.input}
            value={relation}
            onChangeText={setRelation}
          />
          <TextInput
            placeholder="Contact No"
            placeholderTextColor="#888"
            style={styles.input}
            value={contactNo}
            onChangeText={setContactNo}
            keyboardType="phone-pad"
          />
          <TextInput
            placeholder="Email"
            placeholderTextColor="#888"
            style={styles.input}
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
          />

          <View style={{ flexDirection: "row", gap: 10, justifyContent: "space-between", marginTop: 10 }}>
            <Pressable style={styles.btn} onPress={onClose}>
              <Text style={styles.btnText}>Cancel</Text>
            </Pressable>
            <Pressable style={styles.btn} onPress={handleSave}>
              <Text style={styles.btnText}>Save</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.6)",
    justifyContent: "center",
    alignItems: "center",
  },
  modal: {
    width: "90%",
    backgroundColor: "#0F2A52",
    borderRadius: 12,
    padding: 20,
  },
  title: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#fff",
    marginBottom: 15,
  },
  input: {
    backgroundColor: "#07121f",
    color: "#fff",
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: Platform.OS === "ios" ? 14 : 12,
    marginBottom: 10,
  },
  btn: {
    backgroundColor: "#2EA8FF",
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderRadius: 8,
    flex: 1,
    alignItems: "center",
  },
  btnText: {
    color: "#fff",
    fontWeight: "bold",
  },
});
