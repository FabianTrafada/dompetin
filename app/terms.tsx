import { IconSymbol } from '@/components/ui/icon-symbol';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function TermsScreen() {
  const colorScheme = useColorScheme();
  const theme = Colors[colorScheme ?? 'light'];
  const router = useRouter();
  const [accepted, setAccepted] = useState(false);

  const handleContinue = async () => {
    if (accepted) {
      try {
        await AsyncStorage.setItem('hasLaunched', 'true');
      } catch (e) {
        console.error('Failed to save onboarding status', e);
      }
      
      router.replace('/enjoy');
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <StatusBar style={colorScheme === 'dark' ? 'light' : 'dark'} />
      
      <ScrollView 
        style={styles.scrollView} 
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        <Text style={[styles.headerTitle, { color: theme.text }]}>
          Terms and Conditions Policy for Dompetin
        </Text>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>1. Acceptance of Terms</Text>
          <Text style={[styles.paragraph, { color: theme.icon }]}>
            By accessing or using Dompetin, you agree to be legally bound by these terms, our Privacy Policy and any other applicable policies. You must be at least 13 years old to use this app.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>2. Use of the App</Text>
          <View style={styles.bulletPoint}>
            <Text style={[styles.bullet, { color: theme.icon }]}>•</Text>
            <Text style={[styles.paragraph, { color: theme.icon }]}>
              <Text style={{ fontWeight: 'bold' }}>Personal Use Only: </Text>
              Dompetin is intended for personal financial tracking only. You may not use the app for any commercial purposes without written permission.
            </Text>
          </View>
          <View style={styles.bulletPoint}>
            <Text style={[styles.bullet, { color: theme.icon }]}>•</Text>
            <Text style={[styles.paragraph, { color: theme.icon }]}>
              <Text style={{ fontWeight: 'bold' }}>No Account Required: </Text>
              Dompetin does not require users to create an account or provide personal identification to use core features.
            </Text>
          </View>
          <View style={styles.bulletPoint}>
            <Text style={[styles.bullet, { color: theme.icon }]}>•</Text>
            <Text style={[styles.paragraph, { color: theme.icon }]}>
              <Text style={{ fontWeight: 'bold' }}>Offline & Minimal Data Collection: </Text>
              Your financial entries (e.g., expenses and incomes) are stored locally on your device unless you choose to export them. We do not associate this data with any identifiable personal information.
            </Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>3. OCR and Use of Google Vertex AI</Text>
          <Text style={[styles.paragraph, { color: theme.icon }]}>
            Important: By using Dompetin&quot;s receipt scanning (OCR) feature, you agree that the image content will be sent to third-party services for processing, specifically:
          </Text>
          <View style={styles.bulletPoint}>
            <Text style={[styles.bullet, { color: theme.icon }]}>•</Text>
            <Text style={[styles.paragraph, { color: theme.icon }]}>
              <Text style={{ fontWeight: 'bold' }}>Google Vertex AI: </Text>
              Used to extract meaningful insights from receipt images (e.g., transaction amount, date, category).
            </Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>4. Intellectual Property</Text>
          <View style={styles.bulletPoint}>
            <Text style={[styles.bullet, { color: theme.icon }]}>•</Text>
            <Text style={[styles.paragraph, { color: theme.icon }]}>
              The Dompetin name, logo, and all content in the app are the intellectual property of the developer and may not be used without permission.
            </Text>
          </View>
          <View style={styles.bulletPoint}>
            <Text style={[styles.bullet, { color: theme.icon }]}>•</Text>
            <Text style={[styles.paragraph, { color: theme.icon }]}>
              You retain ownership of the data you input into the app.
            </Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>5. Export and Backup</Text>
          <Text style={[styles.paragraph, { color: theme.icon }]}>
            Dompetin provides a feature for you to export your transaction data. You are responsible for managing and safeguarding your exported files.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>6. Limitation of Liability</Text>
          <View style={styles.bulletPoint}>
            <Text style={[styles.bullet, { color: theme.icon }]}>•</Text>
            <Text style={[styles.paragraph, { color: theme.icon }]}>
              Dompetin is provided &quot;as is&quot; without warranties of any kind.
            </Text>
          </View>
          <View style={styles.bulletPoint}>
            <Text style={[styles.bullet, { color: theme.icon }]}>•</Text>
            <Text style={[styles.paragraph, { color: theme.icon }]}>
              We are not responsible for any financial losses, inaccuracies, or damages arising from the use of the app or from data extraction errors.
            </Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>7. Updates and Modifications</Text>
          <Text style={[styles.paragraph, { color: theme.icon }]}>
            We may update these Terms and the app features at any time. Material changes to the Terms will be communicated through the app, and you may be required to accept them before continuing to use the service.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>8. Termination</Text>
          <Text style={[styles.paragraph, { color: theme.icon }]}>
            We reserve the right to suspend or terminate access to the app if you violate these Terms.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>9. Contact</Text>
          <Text style={[styles.paragraph, { color: theme.icon }]}>
            If you have any questions about these Terms, please reach out to:
          </Text>
          <Text style={[styles.link, { color: '#2196F3' }]}>
            dompetin.team@gmail.com
          </Text>
        </View>
      </ScrollView>

      <View style={[styles.footer, { backgroundColor: theme.background }]}>
        <TouchableOpacity 
          style={styles.checkboxContainer} 
          onPress={() => setAccepted(!accepted)}
          activeOpacity={0.7}
        >
          <View style={[styles.checkbox, accepted && styles.checkboxChecked]}>
            {accepted && <IconSymbol name="checkmark" size={14} color="#ffffff" />}
          </View>
          <Text style={[styles.checkboxLabel, { color: theme.text }]}>
            Accept terms and conditions
          </Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.button, !accepted && styles.buttonDisabled]} 
          onPress={handleContinue}
          disabled={!accepted}
        >
          <Text style={styles.buttonText}>Get Started</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  contentContainer: {
    padding: 24,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 32,
    textAlign: 'center',
    lineHeight: 32,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  paragraph: {
    fontSize: 16,
    lineHeight: 24,
  },
  bulletPoint: {
    flexDirection: 'row',
    marginBottom: 8,
    paddingLeft: 8,
  },
  bullet: {
    fontSize: 16,
    marginRight: 8,
    lineHeight: 24,
  },
  link: {
    fontSize: 16,
    lineHeight: 24,
    marginTop: 4,
    textDecorationLine: 'underline',
  },
  footer: {
    padding: 24,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.05)',
  },
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#000000',
    marginRight: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxChecked: {
    backgroundColor: '#000000',
    borderColor: '#000000',
  },
  checkboxLabel: {
    fontSize: 16,
    fontWeight: '500',
  },
  button: {
    backgroundColor: '#000000',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  buttonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
