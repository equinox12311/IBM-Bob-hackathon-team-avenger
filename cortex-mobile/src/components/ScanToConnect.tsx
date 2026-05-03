/**
 * <ScanToConnect> — modal QR scanner that auto-pairs the app with a
 * cortex-api instance.
 *
 * The QR is produced by `make pair` (scripts/pair.py) and encodes:
 *
 *     {"v":1,"url":"http://192.168.1.213:8080","token":"..."}
 *
 * On scan we validate the payload, write it to AsyncStorage, run a health
 * check against /health, and call onSuccess(). If the camera permission
 * isn't granted we show a friendly request screen.
 */

import { Ionicons } from '@expo/vector-icons';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { useState } from 'react';
import { Alert, Modal, StyleSheet, Text, View } from 'react-native';

import { Button, Header, IconButton, StatusBanner } from './ui';
import { Radius, Spacing, Typography } from '../constants/theme';
import { useThemeMode } from '../hooks/useThemeMode';
import { checkApiHealth, setApiBase, setToken } from '../services/api';

export interface ScanToConnectProps {
  visible: boolean;
  onClose: () => void;
  onSuccess: (info: { url: string; version: string }) => void;
}

interface PairPayload {
  v: number;
  url: string;
  token: string;
}

function parsePayload(raw: string): PairPayload | null {
  try {
    const obj = JSON.parse(raw);
    if (
      typeof obj?.url === 'string' &&
      typeof obj?.token === 'string' &&
      obj.url.length > 0 &&
      obj.token.length > 0
    ) {
      return { v: obj.v ?? 1, url: obj.url, token: obj.token };
    }
  } catch { /* invalid JSON */ }
  return null;
}

export function ScanToConnect({ visible, onClose, onSuccess }: ScanToConnectProps) {
  const { Colors } = useThemeMode();
  const [permission, requestPermission] = useCameraPermissions();
  const [busy, setBusy] = useState(false);
  const [lastScanned, setLastScanned] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function onBarcode(data: string) {
    if (busy || data === lastScanned) return;
    setLastScanned(data);
    setBusy(true);
    setError(null);

    const payload = parsePayload(data);
    if (!payload) {
      setError('That QR code isn\'t a Cortex pairing payload. Run `make pair` from the repo root and try again.');
      setBusy(false);
      // Re-arm scan after a moment
      setTimeout(() => setLastScanned(null), 1500);
      return;
    }

    try {
      await setApiBase(payload.url);
      await setToken(payload.token);
      const r = await checkApiHealth();
      onSuccess({ url: payload.url, version: r.version });
    } catch (e: any) {
      setError(`Saved, but couldn't reach ${payload.url}.\n${String(e?.message ?? e)}`);
      setTimeout(() => setLastScanned(null), 1500);
    } finally {
      setBusy(false);
    }
  }

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="fullScreen"
      onRequestClose={onClose}
    >
      <View style={[s.root, { backgroundColor: Colors.surface }]}>
        <Header
          title="Scan to connect"
          eyebrow="one-click"
          right={<IconButton icon="close" size="sm" onPress={onClose} />}
        />

        {!permission ? (
          <View style={s.center}>
            <Text style={[Typography.body, { color: Colors.onSurface }]}>
              Loading camera…
            </Text>
          </View>
        ) : !permission.granted ? (
          <View style={s.center}>
            <View style={[s.lockIcon, { backgroundColor: Colors.primaryFixed }]}>
              <Ionicons name="qr-code" size={40} color={Colors.primary} />
            </View>
            <Text style={[Typography.h3, { color: Colors.onSurface, textAlign: 'center' }]}>
              Camera permission
            </Text>
            <Text style={[Typography.body, { color: Colors.onSurfaceVariant, textAlign: 'center', maxWidth: 320 }]}>
              We need camera access to scan the pairing QR printed by the API.
            </Text>
            <Button
              label="Allow camera"
              icon="camera"
              onPress={requestPermission}
              fullWidth
            />
          </View>
        ) : (
          <View style={s.cameraWrap}>
            <CameraView
              style={StyleSheet.absoluteFillObject}
              facing="back"
              barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
              onBarcodeScanned={(r) => onBarcode(r.data)}
            />

            {/* Reticle overlay */}
            <View style={s.overlay} pointerEvents="none">
              <View style={[s.reticle, { borderColor: Colors.onPrimary }]} />
            </View>

            {/* Footer banner */}
            <View style={s.footer}>
              {error ? (
                <StatusBanner tone="error" title="Couldn't pair" body={error} />
              ) : busy ? (
                <StatusBanner tone="info" title="Pairing…" body="Saving and verifying connection." />
              ) : (
                <StatusBanner
                  tone="info"
                  title="Run `make pair` on your Mac"
                  body="Hold the terminal QR up to your camera to connect."
                />
              )}
            </View>
          </View>
        )}
      </View>
    </Modal>
  );
}

const s = StyleSheet.create({
  root: { flex: 1 },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.xl,
    gap: Spacing.md,
  },
  lockIcon: {
    width: 96, height: 96, borderRadius: Radius.card,
    alignItems: 'center', justifyContent: 'center',
    marginBottom: Spacing.sm,
  },

  cameraWrap: { flex: 1, position: 'relative' },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
  },
  reticle: {
    width: 260,
    height: 260,
    borderRadius: Radius.card,
    borderWidth: 3,
    backgroundColor: 'transparent',
  },
  footer: {
    position: 'absolute',
    left: Spacing.md,
    right: Spacing.md,
    bottom: Spacing.xl,
  },
});
