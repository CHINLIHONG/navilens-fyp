// FYP/app/app/(tabs)/history.tsx
import { useState, useCallback } from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Image,
  TouchableOpacity,
  Alert,
  RefreshControl,
  ActivityIndicator,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useFocusEffect } from "@react-navigation/native";

const API_BASE = "http://192.168.1.144:8000";

type Capture = {
  id: number;
  timestamp: string;
  mode: string;
  caption: string;
  image_url: string;
  latency_sec: number;
};

export default function HistoryScreen() {
  const [captures, setCaptures] = useState<Capture[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchHistory = useCallback(async () => {
    try {
      const userId = await AsyncStorage.getItem("user_id");
      if (!userId) {
        setLoading(false);
        return;
      }

      const sessionsRes = await fetch(`${API_BASE}/api/sessions?user_id=${userId}`);
      const sessions = await sessionsRes.json();

      if (sessions.length > 0) {
        let allCaptures: Capture[] = [];
        for (const s of sessions) {
          const capturesRes = await fetch(`${API_BASE}/api/captures?session_id=${s.id}`);
          const data = await capturesRes.json();
          allCaptures = allCaptures.concat(data);
        }
        allCaptures.sort(
          (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
        );
        setCaptures(allCaptures);
      } else {
        setCaptures([]);
      }
    } catch (e) {
      console.error("Failed to load history:", e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  // Auto-refresh when tab is focused
  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      fetchHistory();
    }, [fetchHistory])
  );

  // Pull-to-refresh
  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchHistory();
  }, [fetchHistory]);

  async function sendFeedback(captureId: number, label: string) {
    try {
      const form = new FormData();
      form.append("capture_id", String(captureId));
      form.append("error_type", label);
      form.append("notes", "");
      const r = await fetch(`${API_BASE}/api/errors`, { method: "POST", body: form });
      if (!r.ok) throw new Error("Failed to send feedback");
      Alert.alert("Thank you", "Your feedback has been recorded.");
    } catch (e: any) {
      Alert.alert("Error", e.message || "Feedback failed");
    }
  }

  const feedbackOptions = [
    { label: "Useful 👍", value: "Useful" },
    { label: "Wrong Object ❌", value: "Wrong Object" },
    { label: "Missing Detail 🔍", value: "Missing Detail" },
    { label: "Gibberish 🤯", value: "Gibberish" },
    { label: "Too Slow 🐢", value: "Too Slow" },
  ];

  return (
    <View style={styles.container}>
      <Text style={styles.title}>History</Text>

      {loading ? (
        <View style={styles.loadingBox}>
          <ActivityIndicator size="large" color="#2f6fed" />
          <Text style={styles.loadingText}>Loading history...</Text>
        </View>
      ) : (
        <ScrollView
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#e6edf3" />
          }
        >
          {captures.length === 0 ? (
            <Text style={styles.empty}>No history yet.</Text>
          ) : (
            captures.map((c) => (
              <View key={c.id} style={styles.item}>
                <Text style={styles.time}>{new Date(c.timestamp).toLocaleString()}</Text>
                <Text style={styles.meta}>
                  Mode: {c.mode} • {c.latency_sec}s
                </Text>
                <Text style={styles.caption}>{c.caption}</Text>
                <Image
                  source={{ uri: `${c.image_url}?t=${Date.now()}` }}
                  style={styles.preview}
                />

                {/* Feedback buttons */}
                <Text style={[styles.captionLabel, { marginTop: 8 }]}>Feedback</Text>
                <View style={styles.feedbackRow}>
                  {feedbackOptions.map((f) => (
                    <TouchableOpacity
                      key={f.value}
                      onPress={() => sendFeedback(c.id, f.value)}
                      style={styles.feedbackBtn}
                    >
                      <Text style={styles.feedbackText}>{f.label}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            ))
          )}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0b0f14", padding: 16 },
  title: { color: "#e6edf3", fontSize: 20, fontWeight: "700", marginBottom: 12 },
  loadingBox: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 40,
  },
  loadingText: { marginTop: 10, color: "#9fb0c0" },
  empty: { color: "#9fb0c0", textAlign: "center", marginTop: 20 },
  item: {
    borderBottomColor: "#1f2833",
    borderBottomWidth: 1,
    paddingVertical: 12,
  },
  time: { color: "#9fb0c0", marginBottom: 2 },
  meta: { color: "#9fb0c0", marginBottom: 2 },
  caption: { color: "#e6edf3", marginBottom: 6 },
  captionLabel: { color: "#9fb0c0" },
  preview: { width: "100%", height: 180, borderRadius: 8, marginTop: 6 },
  feedbackRow: { flexDirection: "row", flexWrap: "wrap", marginTop: 6 },
  feedbackBtn: {
    borderWidth: 1,
    borderColor: "#2f6fed",
    borderRadius: 6,
    paddingVertical: 4,
    paddingHorizontal: 8,
    marginRight: 6,
    marginBottom: 6,
  },
  feedbackText: { color: "#e6edf3", fontSize: 12 },
});
