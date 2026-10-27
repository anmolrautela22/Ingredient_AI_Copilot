import React, { useState } from 'react';
import {
  ActivityIndicator,
  Image,
  Platform,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { AlertTriangle, Camera, CheckCircle2, RefreshCcw } from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';

const LOGO_IMAGE = require('./assets/image.jpeg');
const API_URL = 'https://ingredientaicopilot-backend.vercel.app/api/analyze';

export default function App() {
  const [isDark, setIsDark] = useState(true);
  const [loading, setLoading] = useState(false);
  const [insight, setInsight] = useState(null);
  const [capturedImage, setCapturedImage] = useState(null);
  const [errorMessage, setErrorMessage] = useState('');

  const theme = isDark
    ? {
        background: '#0B0B0B',
        text: '#F5F5F5',
        muted: '#BCBCBC',
        surface: '#1E1E1E',
        surfaceAlt: '#292929',
        border: '#414141',
        accent: '#D9C5B2',
        accentText: '#0A0A0A',
        caution: '#A69586',
      }
    : {
        background: '#F5F1EA',
        text: '#26332B',
        muted: '#555555',
        surface: '#FFFFFF',
        surfaceAlt: '#EEE9E1',
        border: '#D6CEC3',
        accent: '#385C4A',
        accentText: '#FFFFFF',
        caution: '#775D4C',
      };

  const sendToBackend = async (base64Image) => {
    setLoading(true);
    setErrorMessage('');

    try {
      const response = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ base64Image }),
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(data.message || `Analysis failed (${response.status}).`);
      }

      setInsight(data);
    } catch (error) {
      setErrorMessage(error.message || 'Could not connect to the analysis service.');
    } finally {
      setLoading(false);
    }
  };

  const takePhotoAndAnalyze = async () => {
    setErrorMessage('');

    try {
      let result;

      if (Platform.OS === 'web') {
        // Open the browser's photo picker directly from the button press.
        result = await ImagePicker.launchImageLibraryAsync({
          mediaTypes: ['images'],
          quality: 0.35,
          base64: true,
        });
      } else {
        const permission = await ImagePicker.requestCameraPermissionsAsync();

        if (!permission.granted) {
          setErrorMessage('Camera access is required to scan a label.');
          return;
        }

        result = await ImagePicker.launchCameraAsync({
          allowsEditing: true,
          quality: 0.35,
          base64: true,
        });
      }

      if (result.canceled || !result.assets?.[0]) {
        return;
      }

      const image = result.assets[0];

      if (!image.base64) {
        setErrorMessage('The image could not be read. Please choose another photo.');
        return;
      }

      setCapturedImage(image.uri);
      await sendToBackend(image.base64);
    } catch (error) {
      setErrorMessage(error.message || 'Could not open the photo picker.');
    }
  };

  const analyzeAnother = () => {
    setInsight(null);
    setCapturedImage(null);
    setErrorMessage('');
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />

      <SafeAreaView style={styles.safeArea}>
        <View style={styles.toggleRow}>
          <TouchableOpacity
            onPress={() => setIsDark((current) => !current)}
            style={[
              styles.themeToggle,
              {
                backgroundColor: theme.surface,
                borderColor: theme.border,
              },
            ]}
          >
            <Text style={[styles.themeToggleText, { color: theme.text }]}>
              {isDark ? '☀ Light mode' : '☾ Dark mode'}
            </Text>
          </TouchableOpacity>
        </View>

        {!insight ? (
          <View style={styles.hero}>
            <Image source={LOGO_IMAGE} style={styles.logo} resizeMode="contain" />

            <Text style={[styles.title, { color: theme.text }]}>NutriScan</Text>
            <Text style={[styles.subtitle, { color: theme.muted }]}>
              Insightful ingredient analysis at your fingertips.
            </Text>

            <TouchableOpacity
              style={[styles.scanButton, { backgroundColor: theme.accent }]}
              onPress={takePhotoAndAnalyze}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color={theme.accentText} />
              ) : (
                <View style={styles.buttonContent}>
                  <Camera color={theme.accentText} size={20} />
                  <Text style={[styles.scanButtonText, { color: theme.accentText }]}>
                    Scan Label
                  </Text>
                </View>
              )}
            </TouchableOpacity>

            {!!errorMessage && (
              <Text style={styles.errorText}>{errorMessage}</Text>
            )}
          </View>
        ) : (
          <ScrollView
            style={styles.results}
            contentContainerStyle={styles.resultsContent}
            showsVerticalScrollIndicator={false}
          >
            {capturedImage && (
              <Image
                source={{ uri: capturedImage }}
                style={styles.previewImage}
                resizeMode="contain"
              />
            )}

            <Text style={[styles.verdict, { color: theme.text }]}>
              {insight.verdict}
            </Text>

            <Text style={[styles.confidence, { color: theme.accent }]}>
              AI Confidence:{' '}
              {(Number(insight.confidence_score ?? 0.8) * 100).toFixed(0)}%
            </Text>

            <View style={[styles.card, { backgroundColor: theme.surface }]}>
              <Text style={[styles.sectionTitle, { color: theme.muted }]}>
                ANALYSIS
              </Text>
              <Text style={[styles.body, { color: theme.text }]}>
                {insight.reasoning}
              </Text>
            </View>

            <View style={styles.infoRow}>
              <View style={[styles.infoCard, { backgroundColor: theme.surface }]}>
                <CheckCircle2 color={theme.accent} size={18} />
                <Text style={[styles.infoTitle, { color: theme.accent }]}>
                  BEST FOR
                </Text>
                <Text style={[styles.infoBody, { color: theme.text }]}>
                  {insight.suitability?.best_for?.join(', ') || 'General'}
                </Text>
              </View>

              <View style={[styles.infoCard, { backgroundColor: theme.surface }]}>
                <AlertTriangle color={theme.caution} size={18} />
                <Text style={[styles.infoTitle, { color: theme.caution }]}>
                  CAUTION
                </Text>
                <Text style={[styles.infoBody, { color: theme.text }]}>
                  {insight.suitability?.caution_for?.join(', ') || 'None'}
                </Text>
              </View>
            </View>

            <View style={[styles.card, { backgroundColor: theme.surface }]}>
              <Text style={[styles.sectionTitle, { color: theme.muted }]}>
                SUGAR CONTENT
              </Text>

              <View style={[styles.sugarBadge, { backgroundColor: theme.surfaceAlt }]}>
                <Text style={[styles.sugarLevel, { color: theme.accent }]}>
                  {insight.sugar_info?.level?.toUpperCase() || 'UNKNOWN'}
                </Text>
              </View>

              <Text style={[styles.body, { color: theme.text }]}>
                {insight.sugar_info?.explanation}
              </Text>
            </View>

            {!!insight.tradeoffs?.length && (
              <>
                <Text style={[styles.sectionTitle, styles.tradeoffHeading, { color: theme.muted }]}>
                  KEY TRADEOFFS
                </Text>

                {insight.tradeoffs.map((item, index) => (
                  <View
                    key={`${index}-${item.benefit}`}
                    style={[styles.card, { backgroundColor: theme.surface }]}
                  >
                    <Text style={[styles.body, { color: theme.accent }]}>
                      • {item.benefit}
                    </Text>
                    <Text style={[styles.body, { color: theme.text }]}>
                      • {item.concern}
                    </Text>
                  </View>
                ))}
              </>
            )}

            {!!errorMessage && (
              <Text style={styles.errorText}>{errorMessage}</Text>
            )}

            <TouchableOpacity onPress={analyzeAnother} style={styles.resetButton}>
              <RefreshCcw color={theme.accent} size={18} />
              <Text style={[styles.resetText, { color: theme.accent }]}>
                Analyze Another Product
              </Text>
            </TouchableOpacity>
          </ScrollView>
        )}
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  toggleRow: {
    alignItems: 'flex-end',
    paddingHorizontal: 16,
    paddingTop: 10,
  },
  themeToggle: {
    borderWidth: 1,
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 9,
  },
  themeToggleText: {
    fontWeight: '700',
  },
  hero: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 24,
  },
  logo: {
    width: 120,
    height: 120,
    marginBottom: 16,
  },
  title: {
    fontSize: 36,
    fontWeight: '800',
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 15,
    textAlign: 'center',
    marginTop: 10,
  },
  scanButton: {
    width: '100%',
    minHeight: 64,
    borderRadius: 16,
    marginTop: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  scanButtonText: {
    fontSize: 17,
    fontWeight: '800',
  },
  errorText: {
    color: '#D33A3A',
    textAlign: 'center',
    marginTop: 16,
    paddingHorizontal: 12,
  },
  results: {
    flex: 1,
  },
  resultsContent: {
    padding: 20,
    paddingBottom: 48,
  },
  previewImage: {
    width: '100%',
    height: 190,
    borderRadius: 16,
    marginBottom: 20,
    backgroundColor: '#FFFFFF',
  },
  verdict: {
    fontSize: 26,
    fontWeight: '800',
    lineHeight: 34,
  },
  confidence: {
    fontSize: 13,
    fontWeight: '700',
    marginTop: 8,
    marginBottom: 18,
  },
  card: {
    padding: 18,
    borderRadius: 18,
    marginBottom: 14,
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: '800',
    marginBottom: 10,
  },
  body: {
    fontSize: 15,
    lineHeight: 23,
  },
  infoRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 14,
  },
  infoCard: {
    flex: 1,
    alignItems: 'center',
    padding: 14,
    borderRadius: 18,
  },
  infoTitle: {
    fontSize: 11,
    fontWeight: '800',
    marginVertical: 7,
  },
  infoBody: {
    fontSize: 13,
    lineHeight: 19,
    textAlign: 'center',
  },
  sugarBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 7,
    marginBottom: 10,
  },
  sugarLevel: {
    fontSize: 11,
    fontWeight: '800',
  },
  tradeoffHeading: {
    marginTop: 4,
    marginLeft: 4,
  },
  resetButton: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    marginTop: 18,
    padding: 14,
  },
  resetText: {
    fontSize: 14,
    fontWeight: '700',
  },
});
