// FYP/app/app/profile.tsx
import React from "react";
import { View, Text, TouchableOpacity, Alert, StyleSheet } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { router } from "expo-router";

export default function ProfileScreen() {
  async function handleLogout() {
    await AsyncStorage.clear();
    Alert.alert("Logged out", "See you next time!");
    router.replace("/login");   // go back to login screen
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Profile</Text>
      <TouchableOpacity style={styles.btn} onPress={handleLogout}>
        <Text style={styles.btnText}>Logout</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#0b0f14" },
  title: { fontSize: 24, fontWeight: "bold", marginBottom: 20, color: "white" },
  btn: {
    backgroundColor: "#e63946",
    padding: 12,
    borderRadius: 8,
    width: "80%",
    alignItems: "center",
  },
  btnText: { color: "white", fontWeight: "700" },
});
