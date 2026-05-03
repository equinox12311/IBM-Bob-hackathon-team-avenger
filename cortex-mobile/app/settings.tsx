import { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, Alert, StyleSheet } from 'react-native';
import { Colors } from '../src/constants/theme';
import { useThemeMode, type ThemeMode } from '../src/hooks/useThemeMode';
import { getApiBase, setApiBase, getToken, setToken, checkApiHealth } from '../src/services/api';

export default function SettingsPage() {
  const [apiBaseInput, setApiBaseInput] = useState('');
  const [tokenInput, setTokenInput] = useState('');
  const [healthStatus, setHealthStatus] = useState<string | null>(null);
  const [healthOk, setHealthOk] = useState<boolean | null>(null);
  const { mode: themeMode, scheme, setMode } = useThemeMode();

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    const base = await getApiBase();
    const tok = await getToken();
    setApiBaseInput(base);
    setTokenInput(tok);
  };

  const saveApiBase = async () => {
    try {
      const trimmed = apiBaseInput.trim();
      if (!trimmed) {
        Alert.alert('Error', 'API base URL cannot be empty');
        return;
      }
      await setApiBase(trimmed);
      Alert.alert('Success', 'API base URL saved');
    } catch (error) {
      Alert.alert('Error', 'Failed to save API base URL');
    }
  };

  const saveToken = async () => {
    try {
      const trimmed = tokenInput.trim();
      if (!trimmed) {
        Alert.alert('Error', 'Token cannot be empty');
        return;
      }
      await setToken(trimmed);
      Alert.alert('Success', 'Token saved');
    } catch (error) {
      Alert.alert('Error', 'Failed to save token');
    }
  };

  const testConnection = async () => {
    setHealthStatus(null);
    setHealthOk(null);
    try {
      const result = await checkApiHealth();
      setHealthOk(true);
      setHealthStatus(`✅ Connected - ${result.status} (v${result.version})`);
    } catch (error) {
      setHealthOk(false);
      setHealthStatus(`❌ Failed: ${error}`);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>⚙️ Settings</Text>
        <Text style={styles.subtitle}>Configure your Cortex connection</Text>
      </View>

      {/* API Base URL Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>API Configuration</Text>
        
        <View style={styles.inputGroup}>
          <Text style={styles.label}>API Base URL</Text>
          <TextInput
            style={styles.input}
            value={apiBaseInput}
            onChangeText={setApiBaseInput}
            placeholder="http://192.168.10.8:8080"
            placeholderTextColor={Colors.outline}
            autoCapitalize="none"
            autoCorrect={false}
          />
          <Text style={styles.helperText}>
            Your local network IP address and port
          </Text>
        </View>

        <TouchableOpacity style={styles.primaryButton} onPress={saveApiBase}>
          <Text style={styles.primaryButtonText}>💾 Save API URL</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.secondaryButton} onPress={testConnection}>
          <Text style={styles.secondaryButtonText}>🔍 Test Connection</Text>
        </TouchableOpacity>

        {healthStatus && (
          <View style={[
            styles.statusBox,
            { backgroundColor: healthOk ? '#e8f5e9' : Colors.errorContainer }
          ]}>
            <Text style={[
              styles.statusText,
              { color: healthOk ? Colors.success : Colors.error }
            ]}>
              {healthStatus}
            </Text>
          </View>
        )}
      </View>

      {/* Appearance */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Appearance</Text>
        <Text style={styles.helperText}>
          Currently rendering in {scheme} mode.
        </Text>
        <View style={appearanceStyles.row}>
          {(['system', 'light', 'dark'] as ThemeMode[]).map((m) => {
            const active = themeMode === m;
            return (
              <TouchableOpacity
                key={m}
                style={[
                  appearanceStyles.btn,
                  active && appearanceStyles.btnActive,
                ]}
                onPress={() => setMode(m)}
              >
                <Text
                  style={[
                    appearanceStyles.btnText,
                    active && appearanceStyles.btnTextActive,
                  ]}
                >
                  {m === 'system' ? 'Match system' : m === 'light' ? 'Light' : 'Dark'}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      {/* Token Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Authentication</Text>
        
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Bearer Token</Text>
          <TextInput
            style={styles.input}
            value={tokenInput}
            onChangeText={setTokenInput}
            placeholder="Enter your DIARY_TOKEN"
            placeholderTextColor={Colors.outline}
            secureTextEntry
            autoCapitalize="none"
            autoCorrect={false}
          />
          <Text style={styles.helperText}>
            Get this from your .env file (DIARY_TOKEN)
          </Text>
        </View>

        <TouchableOpacity style={styles.primaryButton} onPress={saveToken}>
          <Text style={styles.primaryButtonText}>🔐 Save Token</Text>
        </TouchableOpacity>
      </View>

      {/* Info Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>ℹ️ Setup Instructions</Text>
        <View style={styles.infoBox}>
          <Text style={styles.infoText}>
            1. Start the API server on your PC:{'\n'}
            <Text style={styles.codeText}>cd src/cortex-api && python -m cortex_api</Text>
          </Text>
          <Text style={styles.infoText}>
            {'\n'}2. Find your PC's local IP:{'\n'}
            <Text style={styles.codeText}>ipconfig (Windows) or ifconfig (Mac/Linux)</Text>
          </Text>
          <Text style={styles.infoText}>
            {'\n'}3. Enter the IP and port above (e.g., http://192.168.10.8:8080)
          </Text>
          <Text style={styles.infoText}>
            {'\n'}4. Get your token from the .env file and enter it above
          </Text>
          <Text style={styles.infoText}>
            {'\n'}5. Test the connection to verify everything works
          </Text>
        </View>
      </View>

      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

const appearanceStyles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 12,
  },
  btn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 100,
    borderWidth: 1,
    borderColor: Colors.outlineVariant,
    backgroundColor: Colors.surfaceContainerLowest,
    alignItems: 'center',
  },
  btnActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  btnText: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.onSurfaceVariant,
  },
  btnTextActive: { color: '#fff' },
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    padding: 20,
    paddingTop: 60,
    backgroundColor: Colors.primary,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: 'white',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.9)',
  },
  section: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: Colors.outlineVariant,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.onSurface,
    marginBottom: 16,
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.onSurface,
    marginBottom: 8,
  },
  input: {
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.outlineVariant,
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    color: Colors.onSurface,
  },
  helperText: {
    fontSize: 12,
    color: Colors.onSurfaceVariant,
    marginTop: 4,
  },
  primaryButton: {
    backgroundColor: Colors.primary,
    padding: 14,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 12,
  },
  primaryButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  secondaryButton: {
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.primary,
    padding: 14,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 12,
  },
  secondaryButtonText: {
    color: Colors.primary,
    fontSize: 16,
    fontWeight: '600',
  },
  statusBox: {
    padding: 12,
    borderRadius: 8,
    marginTop: 8,
  },
  statusText: {
    fontSize: 14,
    fontWeight: '500',
  },
  infoBox: {
    backgroundColor: Colors.surface,
    padding: 16,
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: Colors.primary,
  },
  infoText: {
    fontSize: 14,
    color: Colors.onSurface,
    lineHeight: 22,
  },
  codeText: {
    fontFamily: 'monospace',
    fontSize: 12,
    color: Colors.primary,
    backgroundColor: 'rgba(15, 98, 254, 0.1)',
    padding: 2,
  },
});

// Made with Bob
