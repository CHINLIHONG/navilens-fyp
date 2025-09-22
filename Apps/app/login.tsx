// FYP/app/app/login.tsx
import React, { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, Alert, StyleSheet } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { router } from "expo-router";

const API_BASE = "http://192.168.1.144:8000"; // replace with your LAN IP

export default function LoginScreen() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  async function handleRegister() {
    try {
      const form = new FormData();
      form.append("username", username);
      form.append("password", password);

      const r = await fetch(`${API_BASE}/api/register`, { method: "POST", body: form });
      if (!r.ok) {
        const err = await r.json();
        throw new Error(err.detail || "Register failed");
      }
      const json = await r.json();

      await AsyncStorage.setItem("user_id", String(json.id));
      await AsyncStorage.setItem("username", json.username);

      Alert.alert("Registered", `Welcome ${json.username}`);
      router.replace("/(tabs)");
    } catch (e: any) {
      Alert.alert("Error", e.message);
    }
  }

  async function handleLogin() {
    try {
      const form = new FormData();
      form.append("username", username);
      form.append("password", password);

      const r = await fetch(`${API_BASE}/api/login`, { method: "POST", body: form });
      if (!r.ok) {
        const err = await r.json();
        throw new Error(err.detail || "Login failed");
      }
      const json = await r.json();

      await AsyncStorage.setItem("user_id", String(json.id));
      await AsyncStorage.setItem("username", json.username);

      Alert.alert("Logged in", `Welcome back ${json.username}`);
      router.replace("/(tabs)");
    } catch (e: any) {
      Alert.alert("Error", e.message);
    }
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>NaviLens Login</Text>
      <TextInput
      placeholder="Enter username"
      value={username}
      onChangeText={setUsername}
      style={styles.input}
    />
    <TextInput
      placeholder="Enter password"
      value={password}
      onChangeText={setPassword}
      secureTextEntry
      style={styles.input}
    />
      
      <TouchableOpacity style={styles.btn} onPress={handleLogin}>
        <Text style={styles.btnText}>Login</Text>
      </TouchableOpacity>
      <TouchableOpacity style={[styles.btn, styles.btnAlt]} onPress={handleRegister}>
        <Text style={styles.btnText}>Register</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#0b0f14" },
  title: { fontSize: 24, fontWeight: "bold", marginBottom: 20, color: "white" },
  input: {
    backgroundColor: "#141a22",
    color: "white",
    padding: 12,
    borderRadius: 8,
    width: "80%",
    marginBottom: 15,
    borderWidth: 1,
    borderColor: "#333",
  },
  btn: {
    backgroundColor: "#2f6fed",
    padding: 12,
    borderRadius: 8,
    width: "80%",
    alignItems: "center",
    marginBottom: 10,
  },
  btnAlt: { backgroundColor: "#00a36c" },
  btnText: { color: "white", fontWeight: "700" },
});
