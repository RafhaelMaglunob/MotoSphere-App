import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Image,
  ScrollView,
  ActivityIndicator,
  Alert,
  StatusBar,
  SafeAreaView,
  TextInput,
} from 'react-native';
import { WebView } from 'react-native-webview';

// ─── Types ────────────────────────────────────────────────────────────────────

interface Device {
  id: string;
  name: string;
  type: string;
  status: 'online' | 'offline' | 'scanning';
  streamUrl: string;
  snapshotUrl: string;
  location?: string;
  ip: string;
  authToken?: string;
  ownerEmail?: string;
}

// ─── Discovery Config ─────────────────────────────────────────────────────────

const PI_PORT = 5000;
const PING_TIMEOUT_MS = 2500;
const AUTH_EMAIL_KEY = 'piCamEmail';
const AUTH_TOKEN_KEY = 'piCamToken';

/**
 * Common hostnames and subnets to probe.
 * Covers Android hotspot (192.168.43.x), iPhone hotspot (172.20.10.x),
 * and standard home networks (192.168.1.x / 192.168.0.x).
 */
const MDNS_HOSTNAMES = [
  'raspberrypi.local',
  'raspberrypi2.local',
  'picam.local',
];

const HOTSPOT_SUBNETS = [
  '192.168.43', // Android default hotspot
  '172.20.10',  // iPhone default hotspot
  '192.168.1',  // Common home router
  '192.168.0',  // Common home router alt
  '10.0.0',     // Some routers
];

// Only scan a slice of the subnet (the Pi usually gets a low IP on hotspot)
const SCAN_RANGE_START = 1;
const SCAN_RANGE_END   = 20;

// ─── Helpers ──────────────────────────────────────────────────────────────────

function buildUrls(host: string) {
  const base = `http://${host}:${PI_PORT}`;
  return {
    ping:     `${base}/ping`,
    stream:   `${base}/stream`,
    snapshot: `${base}/snapshot.jpg`,
    login:    `${base}/auth/login`,
    status:   `${base}/status`,
  };
}

async function pingHost(host: string): Promise<boolean> {
  const { ping } = buildUrls(host);
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), PING_TIMEOUT_MS);
  try {
    const res = await fetch(ping, { method: 'GET', signal: controller.signal });
    clearTimeout(timer);
    return res.ok || res.status === 200;
  } catch {
    clearTimeout(timer);
    return false;
  }
}

async function loginToDevice(host: string, email: string): Promise<string | null> {
  const { login } = buildUrls(host);
  try {
    const res = await fetch(login, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    });
    const data = await res.json();
    if (res.ok && data.token) return data.token as string;
    return null;
  } catch {
    return null;
  }
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function Devices() {
  const [devices, setDevices]               = useState<Device[]>([]);
  const [scanning, setScanning]             = useState(false);
  const [scanProgress, setScanProgress]     = useState(0);
  const [scanTotal, setScanTotal]           = useState(0);
  const [selectedDevice, setSelectedDevice] = useState<Device | null>(null);
  const [viewMode, setViewMode]             = useState<'stream' | 'snapshot'>('stream');
  const [isLoading, setIsLoading]           = useState(false);
  const [connectionError, setConnectionError] = useState<string | null>(null);

  // Auth state
  const [authEmail, setAuthEmail]         = useState('');
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [pendingDevice, setPendingDevice] = useState<Device | null>(null);
  const [authError, setAuthError]         = useState('');

  const webViewRef = useRef<WebView>(null);
  const scanCancelled = useRef(false);

  // ── Discovery ──────────────────────────────────────────────────────────────

  const addOrUpdateDevice = useCallback((device: Device) => {
    setDevices(prev => {
      const exists = prev.find(d => d.ip === device.ip);
      if (exists) {
        return prev.map(d => d.ip === device.ip ? { ...d, ...device } : d);
      }
      return [...prev, device];
    });
  }, []);

  const probeHost = useCallback(async (host: string, label?: string) => {
    const alive = await pingHost(host);
    if (!alive) return;

    const urls = buildUrls(host);
    const device: Device = {
      id:          host,
      name:        label ?? `Pi Camera (${host})`,
      type:        'Camera',
      status:      'online',
      ip:          host,
      streamUrl:   urls.stream,
      snapshotUrl: urls.snapshot,
      location:    'Hotspot',
    };
    addOrUpdateDevice(device);
  }, [addOrUpdateDevice]);

  const runDiscovery = useCallback(async () => {
    scanCancelled.current = false;
    setScanning(true);
    setScanProgress(0);

    // Build full probe list
    const probes: Array<{ host: string; label: string }> = [];

    // 1) mDNS hostnames first (fast, usually works on same WiFi)
    for (const hostname of MDNS_HOSTNAMES) {
      probes.push({ host: hostname, label: `Pi (${hostname})` });
    }

    // 2) IP scan across all subnets
    for (const subnet of HOTSPOT_SUBNETS) {
      for (let i = SCAN_RANGE_START; i <= SCAN_RANGE_END; i++) {
        probes.push({ host: `${subnet}.${i}`, label: `Pi Camera (${subnet}.${i})` });
      }
    }

    setScanTotal(probes.length);

    // Run probes in small concurrent batches so it's fast but not overwhelming
    const BATCH = 8;
    for (let i = 0; i < probes.length; i += BATCH) {
      if (scanCancelled.current) break;
      const batch = probes.slice(i, i + BATCH);
      await Promise.all(batch.map(p => probeHost(p.host, p.label)));
      setScanProgress(Math.min(i + BATCH, probes.length));
    }

    setScanning(false);
  }, [probeHost]);

  // Auto-scan on mount
  useEffect(() => {
    runDiscovery();
    return () => { scanCancelled.current = true; };
  }, []);

  // ── Auth flow ──────────────────────────────────────────────────────────────

  const handleDevicePress = (device: Device) => {
    if (device.status !== 'online') {
      Alert.alert('Device Offline', 'This device is not reachable right now.');
      return;
    }
    // If we already have a token for this device, open stream directly
    if (device.authToken) {
      openStream(device);
      return;
    }
    // Otherwise prompt for auth
    setPendingDevice(device);
    setAuthEmail('');
    setAuthError('');
    setShowAuthModal(true);
  };

  const handleLogin = async () => {
    if (!pendingDevice) return;
    if (!authEmail.trim()) { setAuthError('Enter your email'); return; }
    setAuthError('');
    setIsLoading(true);

    const token = await loginToDevice(pendingDevice.ip, authEmail.trim());
    setIsLoading(false);

    if (!token) {
      setAuthError('Login failed. Check email or device link.');
      return;
    }

    const updated: Device = { ...pendingDevice, authToken: token, ownerEmail: authEmail.trim() };
    addOrUpdateDevice(updated);
    setShowAuthModal(false);
    openStream(updated);
  };

  const openStream = (device: Device) => {
    setSelectedDevice(device);
    setConnectionError(null);
    setIsLoading(true);
    setViewMode('stream');
  };

  // ── Stream HTML ────────────────────────────────────────────────────────────

  const generateStreamHTML = (device: Device) => {
    const authHeader = device.authToken ? `Bearer ${device.authToken}` : '';
    return `<!DOCTYPE html>
<html>
<head>
  <meta name="viewport" content="width=device-width,initial-scale=1,maximum-scale=1,user-scalable=no">
  <style>
    *{margin:0;padding:0;box-sizing:border-box}
    body{background:#000;display:flex;justify-content:center;align-items:center;min-height:100vh}
    img{width:100%;height:auto;display:block}
    #msg{position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);
         color:#10b981;font-family:monospace;font-size:16px;text-align:center}
    #err{display:none;position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);
         color:#ef4444;font-family:monospace;font-size:14px;text-align:center;max-width:80%}
  </style>
</head>
<body>
  <div id="msg">Connecting to stream...</div>
  <div id="err">Stream unavailable.<br>Check device connection.</div>
  <img id="s" style="display:none">
  <script>
    const img = document.getElementById('s');
    const msg = document.getElementById('msg');
    const err = document.getElementById('err');
    let retries = 0;

    function load() {
      // For authenticated streams we fetch the frame via XHR and display as blob URL
      ${authHeader ? `
      fetch('${device.streamUrl}?t='+Date.now(), {
        headers: { Authorization: '${authHeader}' }
      }).then(r => {
        if (!r.ok) throw new Error('auth failed');
        return r.blob();
      }).then(blob => {
        const url = URL.createObjectURL(blob);
        img.src = url;
        img.style.display='block';
        msg.style.display='none';
        window.ReactNativeWebView && window.ReactNativeWebView.postMessage('loaded');
      }).catch(() => {
        if (++retries < 4) {
          msg.textContent = 'Retrying... (' + retries + '/3)';
          setTimeout(load, 2000);
        } else {
          msg.style.display='none';
          err.style.display='block';
          window.ReactNativeWebView && window.ReactNativeWebView.postMessage('error');
        }
      });
      ` : `
      img.onload = () => {
        msg.style.display='none';
        img.style.display='block';
        retries=0;
        window.ReactNativeWebView && window.ReactNativeWebView.postMessage('loaded');
      };
      img.onerror = () => {
        if (++retries < 4) {
          msg.textContent = 'Retrying... (' + retries + '/3)';
          setTimeout(() => { img.src='${device.streamUrl}?t='+Date.now(); }, 2000);
        } else {
          msg.style.display='none';
          err.style.display='block';
          window.ReactNativeWebView && window.ReactNativeWebView.postMessage('error');
        }
      };
      img.src = '${device.streamUrl}?t='+Date.now();
      `}
    }
    load();
  </script>
</body>
</html>`;
  };

  // ── Render helpers ─────────────────────────────────────────────────────────

  const progressPct = scanTotal > 0 ? Math.round((scanProgress / scanTotal) * 100) : 0;

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#111827" />

      {/* ── Header ── */}
      <View style={styles.header}>
        <View style={styles.headerRow}>
          <Text style={styles.headerTitle}>Devices</Text>
          <TouchableOpacity
            style={[styles.scanBtn, scanning && styles.scanBtnActive]}
            onPress={scanning ? () => { scanCancelled.current = true; setScanning(false); } : runDiscovery}
          >
            {scanning
              ? <ActivityIndicator size="small" color="#10b981" />
              : <Text style={styles.scanBtnText}>⟳ Scan</Text>}
          </TouchableOpacity>
        </View>

        {/* Scan progress bar */}
        {scanning && (
          <View style={styles.progressWrap}>
            <View style={[styles.progressBar, { width: `${progressPct}%` as any }]} />
            <Text style={styles.progressText}>
              Scanning network… {progressPct}%
            </Text>
          </View>
        )}

        <Text style={styles.headerSubtitle}>
          {scanning
            ? `Probing ${scanTotal} addresses…`
            : `${devices.filter(d => d.status === 'online').length} device(s) found on hotspot`}
        </Text>
      </View>

      {/* ── Device list ── */}
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.deviceList} showsVerticalScrollIndicator={false}>
        {devices.length === 0 && !scanning && (
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>📡</Text>
            <Text style={styles.emptyTitle}>No devices found</Text>
            <Text style={styles.emptyText}>
              Make sure your Raspberry Pi is connected to this phone's hotspot and the PiCAM server is running, then tap Scan.
            </Text>
            <TouchableOpacity style={styles.retryScanBtn} onPress={runDiscovery}>
              <Text style={styles.retryScanText}>Retry Scan</Text>
            </TouchableOpacity>
          </View>
        )}

        {devices.map(device => (
          <TouchableOpacity
            key={device.id}
            style={[styles.deviceCard, device.status !== 'online' && styles.deviceCardOffline]}
            onPress={() => handleDevicePress(device)}
            activeOpacity={0.75}
          >
            <View style={styles.deviceCardHeader}>
              <View style={styles.deviceInfo}>
                <Text style={styles.deviceName}>{device.name}</Text>
                <Text style={styles.deviceUrl}>{device.ip}:{PI_PORT}</Text>
                {device.ownerEmail && (
                  <Text style={styles.deviceEmail}>{device.ownerEmail}</Text>
                )}
              </View>
              <View style={styles.deviceRight}>
                <View style={[styles.statusDot, device.status === 'online' ? styles.statusOnline : styles.statusOffline]} />
                <Text style={styles.deviceType}>{device.type}</Text>
              </View>
            </View>

            <View style={styles.deviceCardFooter}>
              <Text style={styles.deviceStatusText}>
                {device.status === 'online' ? '● Connected' : '○ Unreachable'}
              </Text>
              {device.status === 'online' && (
                <Text style={styles.deviceAction}>
                  {device.authToken ? 'Tap to stream →' : 'Tap to sign in →'}
                </Text>
              )}
            </View>
          </TouchableOpacity>
        ))}

        {/* Manual add (fallback) */}
        <TouchableOpacity
          style={styles.addDeviceCard}
          onPress={() => {
            Alert.prompt(
              'Add device manually',
              'Enter IP address or hostname (e.g. 192.168.43.5)',
              (ip) => {
                if (ip?.trim()) probeHost(ip.trim(), `Pi Camera (${ip.trim()})`);
              },
              'plain-text',
            );
          }}
          activeOpacity={0.7}
        >
          <Text style={styles.addDeviceIcon}>+</Text>
          <Text style={styles.addDeviceText}>Add device manually</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* ── Auth modal ── */}
      <Modal visible={showAuthModal} animationType="fade" transparent onRequestClose={() => setShowAuthModal(false)}>
        <View style={styles.authOverlay}>
          <View style={styles.authModal}>
            <Text style={styles.authTitle}>Sign in to {pendingDevice?.name}</Text>
            <Text style={styles.authSub}>{pendingDevice?.ip}</Text>
            <TextInput
              style={styles.authInput}
              placeholder="owner@email.com"
              placeholderTextColor="#6b7280"
              keyboardType="email-address"
              autoCapitalize="none"
              value={authEmail}
              onChangeText={setAuthEmail}
              onSubmitEditing={handleLogin}
            />
            {authError ? <Text style={styles.authError}>{authError}</Text> : null}
            <View style={styles.authButtons}>
              <TouchableOpacity style={styles.authCancel} onPress={() => setShowAuthModal(false)}>
                <Text style={styles.authCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.authConfirm} onPress={handleLogin} disabled={isLoading}>
                {isLoading
                  ? <ActivityIndicator size="small" color="#000" />
                  : <Text style={styles.authConfirmText}>Sign In</Text>}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* ── Stream modal ── */}
      <Modal
        visible={selectedDevice !== null}
        animationType="slide"
        onRequestClose={() => setSelectedDevice(null)}
        presentationStyle="fullScreen"
      >
        <SafeAreaView style={styles.modalContainer}>
          <StatusBar barStyle="light-content" backgroundColor="#000" />

          <View style={styles.modalHeader}>
            <View style={styles.modalHeaderLeft}>
              <View style={styles.liveDot} />
              <View>
                <Text style={styles.modalTitle}>{selectedDevice?.name}</Text>
                <Text style={styles.modalSubtitle}>{selectedDevice?.ip}</Text>
              </View>
            </View>
            <TouchableOpacity onPress={() => setSelectedDevice(null)} style={styles.closeButton}>
              <Text style={styles.closeButtonText}>✕</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.controls}>
            <TouchableOpacity
              style={[styles.controlButton, viewMode === 'stream' && styles.controlButtonActive]}
              onPress={() => { setViewMode('stream'); setIsLoading(true); setConnectionError(null); }}
            >
              <Text style={[styles.controlButtonText, viewMode === 'stream' && styles.controlButtonTextActive]}>📹 Stream</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.controlButton, viewMode === 'snapshot' && styles.controlButtonActive]}
              onPress={() => { setViewMode('snapshot'); setIsLoading(true); setConnectionError(null); }}
            >
              <Text style={[styles.controlButtonText, viewMode === 'snapshot' && styles.controlButtonTextActive]}>📷 Snapshot</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.controlButton} onPress={() => { webViewRef.current?.reload(); setIsLoading(true); setConnectionError(null); }}>
              <Text style={styles.controlButtonText}>↻</Text>
            </TouchableOpacity>
          </View>

          {connectionError && (
            <View style={styles.errorBanner}>
              <Text style={styles.errorBannerText}>⚠️ {connectionError}</Text>
            </View>
          )}

          <View style={styles.streamContainer}>
            {isLoading && (
              <View style={styles.loadingOverlay}>
                <ActivityIndicator size="large" color="#10b981" />
                <Text style={styles.loadingText}>Connecting…</Text>
              </View>
            )}

            {viewMode === 'stream' && selectedDevice ? (
              <WebView
                ref={webViewRef}
                source={{ html: generateStreamHTML(selectedDevice) }}
                style={styles.webView}
                onLoadStart={() => setIsLoading(true)}
                onLoadEnd={() => setIsLoading(false)}
                onMessage={e => {
                  if (e.nativeEvent.data === 'loaded') setIsLoading(false);
                  if (e.nativeEvent.data === 'error') {
                    setIsLoading(false);
                    setConnectionError('Could not reach stream. Is the Pi on this hotspot?');
                  }
                }}
                onError={() => { setIsLoading(false); setConnectionError('WebView failed. Try refreshing.'); }}
                mediaPlaybackRequiresUserAction={false}
                allowsInlineMediaPlayback
                javaScriptEnabled
                domStorageEnabled
                originWhitelist={['*']}
                mixedContentMode="always"
              />
            ) : (
              selectedDevice?.snapshotUrl && (
                <ScrollView style={styles.snapshotScroll} contentContainerStyle={styles.snapshotScrollContent}>
                  <Image
                    source={{
                      uri: `${selectedDevice.snapshotUrl}?t=${Date.now()}`,
                      headers: selectedDevice.authToken
                        ? { Authorization: `Bearer ${selectedDevice.authToken}` }
                        : {},
                    }}
                    style={styles.snapshotImage}
                    resizeMode="contain"
                    onLoadStart={() => setIsLoading(true)}
                    onLoadEnd={() => setIsLoading(false)}
                    onError={() => { setIsLoading(false); setConnectionError('Snapshot failed'); }}
                  />
                </ScrollView>
              )
            )}
          </View>

          <View style={styles.modalFooter}>
            <Text style={styles.footerText}>1280×720 HD @ 30fps</Text>
            <Text style={styles.footerText}>JPEG 95</Text>
            <View style={styles.liveIndicatorContainer}>
              <View style={styles.liveIndicatorDot} />
              <Text style={styles.liveIndicator}>LIVE</Text>
            </View>
          </View>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#111827' },

  header: { paddingHorizontal: 20, paddingTop: 20, paddingBottom: 14, backgroundColor: '#1f2937' },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  headerTitle: { fontSize: 28, fontWeight: 'bold', color: '#fff' },
  headerSubtitle: { fontSize: 13, color: '#9ca3af', marginTop: 4 },

  scanBtn: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 8, borderWidth: 1, borderColor: '#374151', minWidth: 80, alignItems: 'center', justifyContent: 'center' },
  scanBtnActive: { borderColor: '#10b981' },
  scanBtnText: { color: '#10b981', fontWeight: '600', fontSize: 14 },

  progressWrap: { height: 4, backgroundColor: '#374151', borderRadius: 2, marginTop: 8, overflow: 'hidden' },
  progressBar: { height: 4, backgroundColor: '#10b981', borderRadius: 2 },
  progressText: { position: 'absolute', right: 0, top: 6, fontSize: 10, color: '#6b7280' },

  scrollView: { flex: 1 },
  deviceList: { padding: 20 },

  emptyState: { alignItems: 'center', paddingVertical: 48, paddingHorizontal: 24 },
  emptyIcon: { fontSize: 48, marginBottom: 16 },
  emptyTitle: { fontSize: 18, fontWeight: '600', color: '#fff', marginBottom: 8 },
  emptyText: { fontSize: 14, color: '#9ca3af', textAlign: 'center', lineHeight: 22 },
  retryScanBtn: { marginTop: 24, paddingHorizontal: 28, paddingVertical: 12, backgroundColor: '#10b981', borderRadius: 8 },
  retryScanText: { color: '#000', fontWeight: '700', fontSize: 14 },

  deviceCard: { backgroundColor: '#1f2937', borderRadius: 12, padding: 18, marginBottom: 14, borderWidth: 1, borderColor: '#374151' },
  deviceCardOffline: { opacity: 0.45 },
  deviceCardHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
  deviceInfo: { flex: 1 },
  deviceName: { fontSize: 17, fontWeight: '600', color: '#fff', marginBottom: 4 },
  deviceUrl: { fontSize: 12, color: '#6b7280', fontFamily: 'monospace', marginBottom: 2 },
  deviceEmail: { fontSize: 12, color: '#10b981' },
  deviceRight: { alignItems: 'flex-end' },
  statusDot: { width: 10, height: 10, borderRadius: 5, marginBottom: 6 },
  statusOnline: { backgroundColor: '#10b981' },
  statusOffline: { backgroundColor: '#ef4444' },
  deviceType: { fontSize: 12, color: '#6b7280' },
  deviceCardFooter: { flexDirection: 'row', justifyContent: 'space-between', paddingTop: 12, borderTopWidth: 1, borderTopColor: '#374151' },
  deviceStatusText: { fontSize: 12, color: '#6b7280' },
  deviceAction: { fontSize: 12, color: '#10b981', fontWeight: '600' },

  addDeviceCard: { backgroundColor: '#1f2937', borderRadius: 12, padding: 28, marginBottom: 14, borderWidth: 2, borderColor: '#374151', borderStyle: 'dashed', alignItems: 'center' },
  addDeviceIcon: { fontSize: 28, color: '#10b981', marginBottom: 6 },
  addDeviceText: { fontSize: 14, color: '#9ca3af', fontWeight: '600' },

  authOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'center', alignItems: 'center' },
  authModal: { backgroundColor: '#1f2937', borderRadius: 16, padding: 24, width: '85%', borderWidth: 1, borderColor: '#374151' },
  authTitle: { fontSize: 18, fontWeight: '700', color: '#fff', marginBottom: 4 },
  authSub: { fontSize: 12, color: '#6b7280', fontFamily: 'monospace', marginBottom: 16 },
  authInput: { backgroundColor: '#111827', borderWidth: 1, borderColor: '#374151', borderRadius: 8, padding: 12, color: '#fff', fontSize: 14, marginBottom: 8 },
  authError: { fontSize: 12, color: '#ef4444', marginBottom: 8 },
  authButtons: { flexDirection: 'row', gap: 10, marginTop: 8 },
  authCancel: { flex: 1, paddingVertical: 12, borderRadius: 8, borderWidth: 1, borderColor: '#374151', alignItems: 'center' },
  authCancelText: { color: '#9ca3af', fontWeight: '600' },
  authConfirm: { flex: 1, paddingVertical: 12, borderRadius: 8, backgroundColor: '#10b981', alignItems: 'center' },
  authConfirmText: { color: '#000', fontWeight: '700' },

  modalContainer: { flex: 1, backgroundColor: '#000' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 14, backgroundColor: '#1f2937' },
  modalHeaderLeft: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  liveDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: '#10b981', marginRight: 12 },
  modalTitle: { fontSize: 17, fontWeight: '600', color: '#fff' },
  modalSubtitle: { fontSize: 12, color: '#9ca3af', fontFamily: 'monospace' },
  closeButton: { width: 34, height: 34, borderRadius: 17, backgroundColor: '#374151', justifyContent: 'center', alignItems: 'center', marginLeft: 12 },
  closeButtonText: { fontSize: 18, color: '#fff', fontWeight: 'bold' },

  controls: { flexDirection: 'row', paddingHorizontal: 16, paddingVertical: 10, backgroundColor: '#1f2937', gap: 8 },
  controlButton: { flex: 1, paddingVertical: 10, backgroundColor: '#374151', borderRadius: 8, alignItems: 'center' },
  controlButtonActive: { backgroundColor: '#10b981' },
  controlButtonText: { color: '#9ca3af', fontSize: 13, fontWeight: '600' },
  controlButtonTextActive: { color: '#fff' },

  errorBanner: { backgroundColor: 'rgba(239,68,68,0.15)', borderBottomWidth: 1, borderBottomColor: '#ef4444', paddingHorizontal: 20, paddingVertical: 10 },
  errorBannerText: { color: '#fca5a5', fontSize: 13 },

  streamContainer: { flex: 1, backgroundColor: '#000', position: 'relative' },
  webView: { flex: 1, backgroundColor: '#000' },
  snapshotScroll: { flex: 1 },
  snapshotScrollContent: { flexGrow: 1, justifyContent: 'center', alignItems: 'center' },
  snapshotImage: { width: '100%', height: '100%' },

  loadingOverlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.85)', justifyContent: 'center', alignItems: 'center', zIndex: 10 },
  loadingText: { color: '#10b981', marginTop: 12, fontSize: 14, fontWeight: '500' },

  modalFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 12, backgroundColor: '#1f2937' },
  footerText: { fontSize: 12, color: '#9ca3af' },
  liveIndicatorContainer: { flexDirection: 'row', alignItems: 'center' },
  liveIndicatorDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#10b981', marginRight: 6 },
  liveIndicator: { fontSize: 12, color: '#10b981', fontWeight: '700' },
});
