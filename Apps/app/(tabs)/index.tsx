// import React, { useEffect, useRef, useState } from 'react';
// import {
//   ActivityIndicator,
//   Alert,
//   Image,
//   KeyboardAvoidingView,
//   Platform,
//   SafeAreaView,
//   ScrollView,
//   StyleSheet,
//   Text,
//   TextInput,
//   TouchableOpacity,
//   View,
// } from 'react-native';
// import { CameraView, useCameraPermissions } from 'expo-camera';
// import { Audio } from 'expo-av';
// import * as Speech from 'expo-speech';

// // ✅ Update with your laptop LAN IP
// const API_BASE = 'http://192.168.1.144:8000';

// type CaptureResponse = {
//   id: number;
//   session_id: number;
//   timestamp: string;
//   mode: 'manual' | 'auto';
//   latency_sec: number;
//   caption: string;
//   objects?: Array<{ label: string; confidence: number; position: string }>;
//   image_url: string;
//   audio_url?: string | null;
// };

// export default function App() {
//   const [sessionId, setSessionId] = useState<string>('');
//   const [title, setTitle] = useState('Mobile Session');
//   const [mode, setMode] = useState<'manual' | 'auto'>('manual');
//   const [busy, setBusy] = useState(false);
//   const [last, setLast] = useState<CaptureResponse | null>(null);
//   const [history, setHistory] = useState<CaptureResponse[]>([]);
//   const [permission, requestPermission] = useCameraPermissions();
//   const [cameraReady, setCameraReady] = useState(false);

//   const cameraRef = useRef<CameraView | null>(null);
//   const soundRef = useRef<Audio.Sound | null>(null);
//   const autoTimer = useRef<ReturnType<typeof setInterval> | null>(null);

//   // Permissions + cleanup
//   useEffect(() => {
//     if (!permission) requestPermission();
//     return () => {
//       if (soundRef.current) soundRef.current.unloadAsync();
//       if (autoTimer.current) clearInterval(autoTimer.current);
//     };
//   }, [permission]);

//   // Warmup delay after camera mounts
//   useEffect(() => {
//     let timer = setTimeout(() => setCameraReady(true), 800); // ~0.8s delay
//     return () => clearTimeout(timer);
//   }, []);

//   async function newSession() {
//     try {
//       const form = new FormData();
//       form.append('title', title);
//       const r = await fetch(`${API_BASE}/api/sessions`, { method: 'POST', body: form });
//       if (!r.ok) throw new Error('Failed to create session');
//       const json = await r.json();
//       setSessionId(String(json.id));
//       Alert.alert('New session created', `ID: ${json.id}`);
//       loadHistory(String(json.id));
//     } catch (e: any) {
//       Alert.alert('Error', e.message || 'Could not create session');
//     }
//   }

//   async function loadHistory(id: string) {
//     try {
//       const r = await fetch(`${API_BASE}/api/captures?session_id=${id}`);
//       if (!r.ok) return;
//       const json = await r.json();
//       setHistory(json);
//     } catch {
//       // ignore
//     }
//   }

//   async function captureAndUpload() {
//     if (!sessionId) {
//       Alert.alert('Create a session first');
//       return;
//     }
//     if (!cameraRef.current || !cameraReady) {
//       Alert.alert('Camera not ready yet');
//       return;
//     }

//     setBusy(true);
//     try {
//       // ✅ Capture without flash or sound
//       const photo = await cameraRef.current.takePictureAsync({
//         quality: 0.7,
//         skipProcessing: true,
//       });

//       const form = new FormData();
//       form.append('file', { uri: photo.uri, name: 'frame.jpg', type: 'image/jpeg' } as any);
//       form.append('mode', mode);
//       form.append('session_id', sessionId);

//       const r = await fetch(`${API_BASE}/api/capture`, {
//         method: 'POST',
//         headers: { 'Content-Type': 'multipart/form-data' },
//         body: form,
//       });
//       if (!r.ok) throw new Error(`Upload failed (${r.status})`);
//       const json: CaptureResponse = await r.json();
//       setLast(json);
//       loadHistory(sessionId);

//       // ✅ Play audio narration
//       if (soundRef.current) {
//         await soundRef.current.unloadAsync();
//         soundRef.current = null;
//       }
//       if (json.audio_url) {
//         const { sound } = await Audio.Sound.createAsync({ uri: `${API_BASE}${json.audio_url}` });
//         soundRef.current = sound;
//         await sound.playAsync();
//       } else {
//         Speech.speak(json.caption || 'No caption');
//       }
//     } catch (e: any) {
//       Alert.alert('Error', e.message || 'Upload error');
//     } finally {
//       setBusy(false);
//     }
//   }

//   function toggleMode() {
//     if (mode === 'manual') {
//       autoTimer.current = setInterval(() => {
//         if (!busy && cameraReady) captureAndUpload();
//       }, 10000);
//       setMode('auto');
//     } else {
//       if (autoTimer.current) clearInterval(autoTimer.current);
//       autoTimer.current = null;
//       setMode('manual');
//     }
//   }

//   if (!permission) return <View />;
//   if (!permission.granted) {
//     return (
//       <View style={styles.center}>
//         <Text style={{ color: 'white', marginBottom: 12 }}>We need camera permission</Text>
//         <TouchableOpacity onPress={requestPermission} style={styles.primaryBtn}>
//           <Text style={styles.primaryBtnText}>Grant Permission</Text>
//         </TouchableOpacity>
//       </View>
//     );
//   }

//   return (
//     <SafeAreaView style={styles.safe}>
//       <KeyboardAvoidingView behavior={Platform.select({ ios: 'padding', android: undefined })} style={styles.flex}>
//         <View style={styles.container}>
//           <Text style={styles.title}>Navi Lens</Text>
//           <Text style={styles.subtitle}>AI Scene Narrator</Text>

//           {/* Session Controls */}
//           <View style={styles.card}>
//             <Text style={styles.cardTitle}>Session</Text>
//             <View style={styles.row}>
//               <TextInput
//                 value={title}
//                 onChangeText={setTitle}
//                 placeholder="Session title"
//                 placeholderTextColor="#999"
//                 style={[styles.input, styles.flex]}
//               />
//               <TouchableOpacity style={styles.primaryBtn} onPress={newSession}>
//                 <Text style={styles.primaryBtnText}>New</Text>
//               </TouchableOpacity>
//             </View>
//             <TextInput
//               value={sessionId}
//               onChangeText={(v) => {
//                 setSessionId(v);
//                 if (v) loadHistory(v);
//               }}
//               placeholder="Session ID"
//               placeholderTextColor="#999"
//               keyboardType="number-pad"
//               style={styles.input}
//             />
//           </View>

//           {/* Camera Preview */}
//           <View style={styles.cameraWrapper}>
//             <CameraView style={styles.camera} facing="back" ref={cameraRef} />
//           </View>

//           {/* Action Bar */}
//           <View style={styles.actionBar}>
//             <TouchableOpacity
//               style={[styles.modeBtn, mode === 'auto' ? styles.modeBtnActive : null]}
//               onPress={toggleMode}
//             >
//               <Text style={[styles.modeBtnText, mode === 'auto' ? styles.modeBtnTextActive : null]}>
//                 Mode: {mode.toUpperCase()}
//               </Text>
//             </TouchableOpacity>
//             <TouchableOpacity
//               style={[styles.captureBtn, busy ? styles.captureBtnDisabled : null]}
//               onPress={captureAndUpload}
//               disabled={busy}
//             >
//               {busy ? <ActivityIndicator /> : <Text style={styles.captureBtnText}>Capture</Text>}
//             </TouchableOpacity>
//           </View>

//           {/* Last Result */}
//           {last && (
//             <View style={styles.card}>
//               <Text style={styles.cardTitle}>Last Result</Text>
//               <Text style={styles.meta}>
//                 Latency: {last.latency_sec}s • Mode: {last.mode}
//               </Text>
//               <Text style={styles.caption}>
//                 <Text style={styles.captionLabel}>Caption: </Text>
//                 {last.caption}
//               </Text>
//               {last.objects && last.objects.length ? (
//                 <Text style={styles.meta}>Objects: {JSON.stringify(last.objects)}</Text>
//               ) : null}
//               <Image source={{ uri: `${API_BASE}${last.image_url}` }} style={styles.preview} />
//             </View>
//           )}

//           {/* History */}
//           {history.length > 0 && (
//             <View style={styles.card}>
//               <Text style={styles.cardTitle}>History</Text>
//               <ScrollView style={{ maxHeight: 240 }}>
//                 {history
//                   .slice()
//                   .reverse()
//                   .map((h) => (
//                     <View key={h.id} style={styles.historyItem}>
//                       <Text style={styles.historyTime}>
//                         {new Date(h.timestamp).toLocaleString()}
//                       </Text>
//                       <Text style={styles.historyMeta}>
//                         Mode: {h.mode} • {h.latency_sec}s
//                       </Text>
//                       <Text numberOfLines={2} style={styles.historyCaption}>
//                         {h.caption}
//                       </Text>
//                     </View>
//                   ))}
//               </ScrollView>
//             </View>
//           )}

//           <Text style={styles.tip}>
//             Tip: phone & server on same Wi-Fi. Set API_BASE to your laptop IP.
//           </Text>
//         </View>
//       </KeyboardAvoidingView>
//     </SafeAreaView>
//   );
// }

// const styles = StyleSheet.create({
//   safe: { flex: 1, backgroundColor: '#0b0f14' },
//   flex: { flex: 1 },
//   container: { flex: 1, paddingHorizontal: 16, paddingTop: 8 },
//   title: { fontSize: 24, fontWeight: '800', color: '#e6edf3' },
//   subtitle: { fontSize: 14, color: '#9fb0c0', marginBottom: 12 },

//   card: {
//     backgroundColor: '#141a22',
//     borderRadius: 12,
//     padding: 12,
//     borderWidth: 1,
//     borderColor: '#1f2833',
//     marginBottom: 12,
//   },
//   cardTitle: { color: '#e6edf3', fontWeight: '700', marginBottom: 8 },
//   row: { flexDirection: 'row', alignItems: 'center' },

//   input: {
//     backgroundColor: '#0f141a',
//     color: '#e6edf3',
//     borderWidth: 1,
//     borderColor: '#26303c',
//     borderRadius: 10,
//     paddingHorizontal: 12,
//     paddingVertical: Platform.select({ ios: 12, android: 8 }),
//     marginBottom: 10,
//     marginRight: 10,
//   },

//   primaryBtn: {
//     backgroundColor: '#2f6fed',
//     paddingHorizontal: 14,
//     paddingVertical: 12,
//     borderRadius: 10,
//   },
//   primaryBtnText: { color: 'white', fontWeight: '700' },

//   cameraWrapper: {
//     height: 300,
//     borderRadius: 12,
//     overflow: 'hidden',
//     marginBottom: 12,
//   },
//   camera: { flex: 1 },

//   actionBar: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     backgroundColor: '#141a22',
//     borderRadius: 12,
//     borderWidth: 1,
//     borderColor: '#1f2833',
//     padding: 10,
//     marginBottom: 12,
//     justifyContent: 'space-between',
//   },
//   modeBtn: {
//     paddingHorizontal: 12,
//     paddingVertical: 10,
//     borderRadius: 10,
//     borderWidth: 1,
//     borderColor: '#26303c',
//     backgroundColor: '#0f141a',
//   },
//   modeBtnActive: { backgroundColor: '#204bba', borderColor: '#204bba' },
//   modeBtnText: { color: '#cbd6e2', fontWeight: '700' },
//   modeBtnTextActive: { color: 'white' },

//   captureBtn: {
//     backgroundColor: '#00a36c',
//     paddingHorizontal: 16,
//     paddingVertical: 12,
//     borderRadius: 10,
//   },
//   captureBtnDisabled: { opacity: 0.6 },
//   captureBtnText: { color: 'white', fontWeight: '800' },

//   meta: { color: '#9fb0c0', marginBottom: 6 },
//   caption: { color: '#e6edf3', marginBottom: 6 },
//   captionLabel: { color: '#9fb0c0' },
//   preview: { width: '100%', height: 220, borderRadius: 10, marginTop: 8 },

//   historyItem: {
//     borderBottomWidth: 1,
//     borderBottomColor: '#1f2833',
//     paddingVertical: 8,
//   },
//   historyTime: { color: '#9fb0c0', marginBottom: 2 },
//   historyMeta: { color: '#9fb0c0', marginBottom: 2 },
//   historyCaption: { color: '#e6edf3' },

//   tip: { color: '#6f8191', marginTop: 4, marginBottom: 12, textAlign: 'center' },
//   center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#0b0f14' },
// });

import React, { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import { Audio } from "expo-av";
import * as Speech from "expo-speech";
import { Camera } from "expo-camera";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";

const API_BASE = "http://192.168.1.144:8000";

type CaptureResponse = {
  id: number;
  session_id: number;
  timestamp: string;
  mode: "manual" | "auto";
  latency_sec: number;
  caption: string;
  image_url: string;
};

export default function CaptureScreen() {
  const [sessionId, setSessionId] = useState<string>("");
  const [title, setTitle] = useState("Mobile Session");
  const [mode, setMode] = useState<"manual" | "auto">("manual");
  const [busy, setBusy] = useState(false);
  const [last, setLast] = useState<CaptureResponse | null>(null);
  const [history, setHistory] = useState<CaptureResponse[]>([]);
  const soundRef = useRef<Audio.Sound | null>(null);
  const autoTimer = useRef<ReturnType<typeof setInterval> | null>(null);
  const router = useRouter();

  useEffect(() => {
    (async () => {
      await ImagePicker.requestCameraPermissionsAsync();
      await ImagePicker.requestMediaLibraryPermissionsAsync();
      await Audio.requestPermissionsAsync();
      await Camera.requestCameraPermissionsAsync();

      const userId = await AsyncStorage.getItem("user_id");
      if (!userId) {
        router.replace("/login");
      }
    })();
    return () => {
      if (soundRef.current) soundRef.current.unloadAsync();
      if (autoTimer.current) clearInterval(autoTimer.current);
    };
  }, []);

  async function newSession() {
    try {
      const userId = await AsyncStorage.getItem("user_id");
      if (!userId) {
        Alert.alert("Error", "Please log in first");
        return;
      }
      const form = new FormData();
      form.append("title", title);
      form.append("user_id", userId);
      const r = await fetch(`${API_BASE}/api/sessions`, { method: "POST", body: form });
      if (!r.ok) throw new Error("Failed to create session");
      const json = await r.json();
      setSessionId(String(json.id));
      Alert.alert("New session created", `ID: ${json.id}`);
      loadHistory(String(json.id));
    } catch (e: any) {
      Alert.alert("Error", e.message || "Could not create session");
    }
  }

  async function loadHistory(id: string) {
    try {
      const r = await fetch(`${API_BASE}/api/captures?session_id=${id}`);
      if (!r.ok) return;
      const json = await r.json();
      setHistory(json);
    } catch {}
  }

  async function pickAndUpload() {
    if (!sessionId) {
      Alert.alert("Create a session first");
      return;
    }
    setBusy(true);
    try {
      const res = await ImagePicker.launchCameraAsync({ quality: 0.7, base64: false });
      if (res.canceled) {
        setBusy(false);
        return;
      }
      const asset = res.assets[0];

      const form = new FormData();
      form.append("file", { uri: asset.uri, name: "frame.jpg", type: "image/jpeg" } as any);
      form.append("mode", mode);
      form.append("session_id", sessionId);

      const r = await fetch(`${API_BASE}/api/capture`, {
        method: "POST",
        body: form,
      });
      if (!r.ok) {
        const err = await r.text();
        throw new Error(`Upload failed: ${err}`);
      }
      const json: CaptureResponse = await r.json();
      setLast(json);
      loadHistory(sessionId);

      if (soundRef.current) {
        await soundRef.current.unloadAsync();
        soundRef.current = null;
      }
      Speech.speak(json.caption || "No caption");
    } catch (e: any) {
      Alert.alert("Error", e.message || "Upload error");
    } finally {
      setBusy(false);
    }
  }

  function toggleMode() {
    if (mode === "manual") {
      autoTimer.current = setInterval(() => {
        if (!busy) pickAndUpload();
      }, 10000);
      setMode("auto");
    } else {
      if (autoTimer.current) clearInterval(autoTimer.current);
      autoTimer.current = null;
      setMode("manual");
    }
  }

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

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView
        behavior={Platform.select({ ios: "padding", android: undefined })}
        style={styles.flex}
      >
        <View style={styles.container}>
          <Text style={styles.title}>Navi Lens</Text>
          <Text style={styles.subtitle}>AI Scene Narrator</Text>

          <View style={styles.card}>
            <Text style={styles.cardTitle}>Session</Text>
            <View style={styles.row}>
              <TextInput
                value={title}
                onChangeText={setTitle}
                placeholder="Session title"
                placeholderTextColor="#999"
                style={[styles.input, styles.flex]}
              />
              <TouchableOpacity style={styles.primaryBtn} onPress={newSession}>
                <Text style={styles.primaryBtnText}>New</Text>
              </TouchableOpacity>
            </View>
            <TextInput
              value={sessionId}
              onChangeText={(v) => {
                setSessionId(v);
                if (v) loadHistory(v);
              }}
              placeholder="Session ID"
              placeholderTextColor="#999"
              keyboardType="number-pad"
              style={styles.input}
            />
          </View>

          <View style={styles.actionBar}>
            <TouchableOpacity
              style={[styles.modeBtn, mode === "auto" ? styles.modeBtnActive : null]}
              onPress={toggleMode}
            >
              <Text style={[styles.modeBtnText, mode === "auto" ? styles.modeBtnTextActive : null]}>
                Mode: {mode.toUpperCase()}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.captureBtn, busy ? styles.captureBtnDisabled : null]}
              onPress={pickAndUpload}
              disabled={busy}
            >
              {busy ? <ActivityIndicator /> : <Text style={styles.captureBtnText}>Capture</Text>}
            </TouchableOpacity>
          </View>

          {last && (
            <View style={styles.card}>
              <Text style={styles.cardTitle}>Last Result</Text>
              <Text style={styles.meta}>
                Latency: {last.latency_sec}s • Mode: {last.mode}
              </Text>
              <Text style={styles.caption}>
                <Text style={styles.captionLabel}>Description: </Text>
                {last.caption}
              </Text>
              {/* ✅ Cache-busting */}
              <Image source={{ uri: `${last.image_url}?t=${Date.now()}` }} style={styles.preview} />

              <Text style={[styles.captionLabel, { marginTop: 10 }]}>Was this helpful?</Text>
              <View style={{ flexDirection: "row", flexWrap: "wrap", marginTop: 6 }}>
                {[
                  { label: "Useful 👍", value: "Useful" },
                  { label: "Wrong Object ❌", value: "Wrong Object" },
                  { label: "Missing Detail 🔍", value: "Missing Detail" },
                  { label: "Gibberish 🤯", value: "Gibberish" },
                  { label: "Too Slow 🐢", value: "Too Slow" },
                ].map((f) => (
                  <TouchableOpacity
                    key={f.value}
                    onPress={() => sendFeedback(last.id, f.value)}
                    style={styles.feedbackBtn}
                  >
                    <Text style={styles.feedbackText}>{f.label}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )}

          {history.length > 0 && (
            <View style={styles.card}>
              <Text style={styles.cardTitle}>History</Text>
              <ScrollView style={{ maxHeight: 240 }}>
                {history
                  .slice()
                  .reverse()
                  .map((h) => (
                    <View key={h.id} style={styles.historyItem}>
                      <Text style={styles.historyTime}>
                        {new Date(h.timestamp).toLocaleString()}
                      </Text>
                      <Text style={styles.historyMeta}>
                        Mode: {h.mode} • {h.latency_sec}s
                      </Text>
                      <Text numberOfLines={2} style={styles.historyCaption}>
                        {h.caption}
                      </Text>
                      {/* ✅ Cache-busting */}
                      <Image source={{ uri: `${h.image_url}?t=${Date.now()}` }} style={styles.historyThumb} />

                      <Text style={[styles.captionLabel, { marginTop: 6 }]}>Feedback</Text>
                      <View style={{ flexDirection: "row", flexWrap: "wrap", marginTop: 6 }}>
                        {[
                          { label: "Useful 👍", value: "Useful" },
                          { label: "Wrong Object ❌", value: "Wrong Object" },
                          { label: "Missing Detail 🔍", value: "Missing Detail" },
                          { label: "Gibberish 🤯", value: "Gibberish" },
                          { label: "Too Slow 🐢", value: "Too Slow" },
                        ].map((f) => (
                          <TouchableOpacity
                            key={f.value}
                            onPress={() => sendFeedback(h.id, f.value)}
                            style={styles.feedbackBtn}
                          >
                            <Text style={styles.feedbackText}>{f.label}</Text>
                          </TouchableOpacity>
                        ))}
                      </View>
                    </View>
                  ))}
              </ScrollView>
            </View>
          )}
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#0b0f14" },
  flex: { flex: 1 },
  container: { flex: 1, paddingHorizontal: 16, paddingTop: 8 },
  title: { fontSize: 24, fontWeight: "800", color: "#e6edf3" },
  subtitle: { fontSize: 14, color: "#9fb0c0", marginBottom: 12 },
  card: {
    backgroundColor: "#141a22",
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: "#1f2833",
    marginBottom: 12,
  },
  cardTitle: { color: "#e6edf3", fontWeight: "700", marginBottom: 8 },
  row: { flexDirection: "row", alignItems: "center" },
  input: {
    backgroundColor: "#0f141a",
    color: "#e6edf3",
    borderWidth: 1,
    borderColor: "#26303c",
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: Platform.select({ ios: 12, android: 8 }),
    marginBottom: 10,
    marginRight: 10,
  },
  primaryBtn: {
    backgroundColor: "#2f6fed",
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 10,
  },
  primaryBtnText: { color: "white", fontWeight: "700" },
  actionBar: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#141a22",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#1f2833",
    padding: 10,
    marginBottom: 12,
    justifyContent: "space-between",
  },
  modeBtn: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#26303c",
    backgroundColor: "#0f141a",
  },
  modeBtnActive: { backgroundColor: "#204bba", borderColor: "#204bba" },
  modeBtnText: { color: "#cbd6e2", fontWeight: "700" },
  modeBtnTextActive: { color: "white" },
  captureBtn: {
    backgroundColor: "#00a36c",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 10,
  },
  captureBtnDisabled: { opacity: 0.6 },
  captureBtnText: { color: "white", fontWeight: "800" },
  meta: { color: "#9fb0c0", marginBottom: 6 },
  caption: { color: "#e6edf3", marginBottom: 6 },
  captionLabel: { color: "#9fb0c0" },
  preview: { width: "100%", height: 220, borderRadius: 10, marginTop: 8 },
  historyItem: {
    borderBottomWidth: 1,
    borderBottomColor: "#1f2833",
    paddingVertical: 8,
  },
  historyTime: { color: "#9fb0c0", marginBottom: 2 },
  historyMeta: { color: "#9fb0c0", marginBottom: 2 },
  historyCaption: { color: "#e6edf3" },
  historyThumb: { width: "100%", height: 140, borderRadius: 8, marginTop: 6 },
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
