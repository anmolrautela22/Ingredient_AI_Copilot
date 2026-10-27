import React, { useState } from 'react';
import { 
  StyleSheet, Text, View, TouchableOpacity, ScrollView, 
  ActivityIndicator, SafeAreaView, Alert, Image, 
  StatusBar, ImageBackground 
} from 'react-native';
import { RefreshCcw, Camera, CheckCircle2, AlertTriangle } from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';

// Define assets at the top level
const BG_IMAGE = require('./assets/bg.jpeg');
const LOGO_IMAGE = require('./assets/image.jpeg');

export default function App() {
  const [loading, setLoading] = useState(false);
  const [insight, setInsight] = useState(null);
  const [capturedImage, setCapturedImage] = useState(null);

  const takePhotoAndAnalyze = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission Denied', 'Camera access is required.');
      return;
    }
    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      quality: 0.15, 
      base64: true,
    });
    if (!result.canceled) {
      const base64Image = result.assets[0].base64;
      setCapturedImage(result.assets[0].uri);
      sendToBackend(base64Image);
    }
  };

  const sendToBackend = async (base64Data) => {
    setLoading(true);
    try {
      const response = await fetch('https://ingredient-ai-copilot.vercel.app/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ base64Image: base64Data }),
      });
      const data = await response.json();
      if (response.ok) setInsight(data);
      else Alert.alert("Analysis Failed", data.message || "Error reading label.");
    } catch (error) {
      Alert.alert("Connection Error", "Check if your Backend is running.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      
      {/* 1. The Background Layer */}
      <ImageBackground 
        source={BG_IMAGE} 
        style={StyleSheet.absoluteFillObject}
        imageStyle={styles.bgImageStyle}
      />

      {/* 2. The Content Layer */}
      <SafeAreaView style={styles.contentContainer}>
        <View style={styles.mainOverlay}>
          {!insight ? (
            <View style={styles.hero}>
              <View style={styles.logoWrapper}>
                <Image source={LOGO_IMAGE} style={styles.mainLogo} resizeMode="contain" />
              </View>
              <Text style={styles.title}>NutriScan</Text>
              <Text style={styles.subtitle}>Insightful ingredient analysis at your fingertips.</Text>
              
              <TouchableOpacity style={styles.btn} onPress={takePhotoAndAnalyze} disabled={loading}>
                {loading ? <ActivityIndicator color="#0A0A0A" /> : (
                  <View style={styles.btnContent}>
                    <Camera color="#0A0A0A" size={20} />
                    <Text style={styles.btnText}>Scan Label</Text>
                  </View>
                )}
              </TouchableOpacity>
            </View>
          ) : (
            <ScrollView contentContainerStyle={styles.resultView} showsVerticalScrollIndicator={false}>
              {capturedImage && <Image source={{ uri: capturedImage }} style={styles.previewImage} />}
              
              <Text style={styles.verdict}>{insight.verdict}</Text>
              
              <View style={styles.confidenceRow}>
                 <Text style={styles.intentNote}>AI Confidence: {(Number(insight?.confidence_score ?? 0.8) * 100).toFixed(0)}%</Text>
              </View>

              {/* CARD: ANALYSIS */}
              <View style={styles.card}>
                <Text style={styles.label}>ANALYSIS</Text>
                <Text style={styles.body}>{insight.reasoning}</Text>
              </View>

              {/* CARDS: SUITABILITY */}
              <View style={styles.suitabilityContainer}>
                <View style={styles.suitabilityCard}>
                   <CheckCircle2 color="#D9C5B2" size={16} />
                   <Text style={styles.suitabilityTitle}>BEST FOR</Text>
                   <Text style={styles.suitabilityList}>
                     {insight.suitability?.best_for?.join(", ") || "General"}
                   </Text>
                </View>
                <View style={styles.suitabilityCard}>
                   <AlertTriangle color="#A69586" size={16} />
                   <Text style={styles.suitabilityTitle}>CAUTION</Text>
                   <Text style={styles.suitabilityList}>
                     {insight.suitability?.caution_for?.join(", ") || "None"}
                   </Text>
                </View>
              </View>

              {/* CARD: SUGAR CONTENT */}
              <View style={styles.card}>
                <Text style={styles.label}>SUGAR CONTENT</Text>
                <View style={styles.sugarBadge}>
                    <Text style={styles.sugarLevelText}>{insight.sugar_info?.level?.toUpperCase()}</Text>
                </View>
                <Text style={styles.body}>{insight.sugar_info?.explanation}</Text>
              </View>

              {/* SECTION: TRADEOFFS */}
              <Text style={[styles.label, {marginTop: 15, marginLeft: 5}]}>KEY TRADEOFFS</Text>
              {insight.tradeoffs?.map((item, index) => (
                <View key={index} style={styles.tradeoffBox}>
                  <Text style={styles.benefit}>• {item.benefit}</Text>
                  <Text style={styles.concern}>• {item.concern}</Text>
                </View>
              ))}

              <TouchableOpacity onPress={() => {setInsight(null); setCapturedImage(null);}} style={styles.reset}>
                <RefreshCcw color="#555" size={18} />
                <Text style={styles.resetT}>Analyze Another Product</Text>
              </TouchableOpacity>
            </ScrollView>
          )}
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  contentContainer: { flex: 1 },
  bgImageStyle: { 
    opacity: 0.6, 
    resizeMode: 'cover' 
  },
  mainOverlay: { flex: 1, backgroundColor: 'rgba(0, 0, 0, 0.3)' },
  hero: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 40 },
  logoWrapper: { width: 140, height: 140, marginBottom: 20 },
  mainLogo: { width: '100%', height: '100%' },
  title: { color: '#D9C5B2', fontSize: 38, fontWeight: '800' },
  subtitle: { color: '#BCBCBC', textAlign: 'center', marginTop: 12, fontSize: 14 },
  btn: { backgroundColor: '#D9C5B2', paddingVertical: 18, borderRadius: 12, marginTop: 40, width: '100%' },
  btnContent: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10 },
  btnText: { fontWeight: '800', fontSize: 16, color: '#0A0A0A' },
  resultView: { padding: 20 },
  previewImage: { width: '100%', height: 160, borderRadius: 16, marginBottom: 20 },
  verdict: { color: '#F5F5F5', fontSize: 28, fontWeight: '800' },
  confidenceRow: { marginBottom: 20 },
  intentNote: { color: '#D9C5B2', fontSize: 12, fontWeight: '700' },
  card: { backgroundColor: 'rgba(30, 30, 30, 0.9)', padding: 20, borderRadius: 20, marginBottom: 15 },
  suitabilityContainer: { flexDirection: 'row', gap: 12, marginBottom: 15 },
  suitabilityCard: { flex: 1, backgroundColor: 'rgba(30, 30, 30, 0.9)', padding: 15, borderRadius: 20, alignItems: 'center' },
  suitabilityTitle: { color: '#D9C5B2', fontSize: 10, fontWeight: '800', marginVertical: 6 },
  suitabilityList: { color: '#A0A0A0', fontSize: 12, textAlign: 'center' },
  tradeoffBox: { backgroundColor: 'rgba(30, 30, 30, 0.9)', padding: 18, borderRadius: 18, marginBottom: 10 },
  label: { color: '#999', fontSize: 11, fontWeight: '800', marginBottom: 10 },
  body: { color: '#BCBCBC', fontSize: 15, lineHeight: 24 },
  sugarBadge: { backgroundColor: '#444', alignSelf: 'flex-start', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 6, marginBottom: 10 },
  sugarLevelText: { color: '#D9C5B2', fontSize: 10, fontWeight: '700' },
  benefit: { color: '#D9C5B2', fontSize: 14, marginBottom: 6 },
  concern: { color: '#888', fontSize: 14 },
  reset: { flexDirection: 'row', justifyContent: 'center', gap: 8, marginTop: 30, paddingBottom: 60 },
  resetT: { color: '#777', fontSize: 14 }
});
