import React, { useEffect, useState } from "react";
import { Slot, useRouter, useSegments } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { ActivityIndicator, View } from "react-native";

export default function RootLayout() {
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<string | null>(null);
  const [checked, setChecked] = useState(false);
  const router = useRouter();
  const segments = useSegments();

  useEffect(() => {
    const checkUser = async () => {
      const stored = await AsyncStorage.getItem("user_id");
      setUser(stored);
      setLoading(false);
    };
    checkUser();
  }, []);

  useEffect(() => {
    if (loading || checked) return;

    const inTabs = segments[0] === "(tabs)";

    if (!user && inTabs) {
      router.replace("/login");
      setChecked(true);
    } else if (user && !inTabs) {
      router.replace("/(tabs)");
      setChecked(true);
    }
  }, [user, loading, segments]);

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator />
      </View>
    );
  }

  return <Slot />;
}
