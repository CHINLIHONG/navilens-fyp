// FYP/app/App.tsx
import { useEffect } from "react";
import { router } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";

export default function App() {
  useEffect(() => {
    const bootstrap = async () => {
      try {
        const user = await AsyncStorage.getItem("username");
        if (user) {
          router.replace("/(tabs)");  // ✅ go to tabs
        } else {
          router.replace("/login");   // ✅ go to login
        }
      } catch (e) {
        console.error("Error loading user session:", e);
        router.replace("/login");
      }
    };

    bootstrap();
  }, []);

  return null; // Nothing here — expo-router takes over
}
