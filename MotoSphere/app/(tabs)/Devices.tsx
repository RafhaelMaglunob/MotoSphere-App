import React, { useState, useRef } from 'react';
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

interface Device {
  id: string;
  name: string;
  type: string;
  status: 'online' | 'offline';
  streamUrl: string;
  snapshotUrl?: string;
  location?: string;
}

export default function Devices() {
  const [devices, setDevices] = useState<Device[]>([
    {
      id: '1',
      name: 'Raspberry Pi Camera',
      type: 'Camera',
      status: 'online',
      // ⭐ You can use .local domain here!
      streamUrl: 'http://raspberrypi.local:5000/stream',
      snapshotUrl: 'http://raspberrypi.local:5000/snapshot.jpg',
      location: 'Living Room',
    },
    // Example with IP address (for comparison)
    // {
    //   id: '2',
    //   name: 'Pi Camera 2',
    //   type: 'Camera',
    //   status: 'online',
    //   streamUrl: 'http://192.168.1.100:5000/stream',
    //   snapshotUrl: 'http://192.168.1.100:5000/snapshot.jpg',
    //   location: 'Bedroom',
    // },
  ]);

  const [selectedDevice, setSelectedDevice] = useState<Device | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [viewMode, setViewMode] = useState<'stream' | 'snapshot'>('stream');
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const webViewRef = useRef<WebView>(null);

  const handleDeviceSelect = (device: Device) => {
    if (device.status === 'online') {
      setSelectedDevice(device);
      setConnectionError(null);
      setIsLoading(true);
      setViewMode('stream');
    } else {
      Alert.alert('Device Offline', 'This device is currently offline.');
    }
  };

  const handleCloseStream = () => {
    setSelectedDevice(null);
    setIsLoading(false);
    setConnectionError(null);
  };

  const refreshStream = () => {
    if (webViewRef.current) {
      webViewRef.current.reload();
      setIsLoading(true);
      setConnectionError(null);
    }
  };

  const switchToSnapshot = () => {
    setViewMode('snapshot');
    setConnectionError(null);
  };

  const switchToStream = () => {
    setViewMode('stream');
    setIsLoading(true);
    setConnectionError(null);
  };

  // ⭐ Test connection to device
  const testConnection = async (device: Device) => {
    try {
      setIsLoading(true);
      
      // Create AbortController for timeout (React Native doesn't support fetch timeout)
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);
      
      const response = await fetch(device.snapshotUrl || device.streamUrl, {
        method: 'HEAD',
        signal: controller.signal,
      });
      
      clearTimeout(timeoutId);
      
      if (response.ok || response.status === 200) {
        Alert.alert('✅ Connection Success', `Successfully connected to ${device.name}`);
        // Update device status if it was offline
        if (device.status === 'offline') {
          const updatedDevices = devices.map(d =>
            d.id === device.id ? { ...d, status: 'online' as const } : d
          );
          setDevices(updatedDevices);
        }
      }
    } catch (error: any) {
      let errorMessage = error.message;
      
      // Handle specific error types
      if (error.name === 'AbortError') {
        errorMessage = 'Connection timeout (5 seconds)';
      }
      
      Alert.alert(
        '❌ Connection Failed',
        `Could not reach ${device.name}.\n\nError: ${errorMessage}\n\nMake sure:\n1. Device is powered on\n2. Device is on same WiFi network\n3. Hostname is correct (${device.streamUrl})`
      );
    } finally {
      setIsLoading(false);
    }
  };

  // Generate HTML for WebView to display MJPEG stream
  const generateStreamHTML = (streamUrl: string) => {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body {
            background: #000;
            display: flex;
            justify-content: center;
            align-items: center;
            min-height: 100vh;
            overflow: hidden;
          }
          img {
            width: 100%;
            height: auto;
            display: block;
          }
          .loading {
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            color: #10b981;
            font-family: monospace;
            font-size: 16px;
            text-align: center;
          }
          .error {
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            color: #ef4444;
            font-family: monospace;
            font-size: 14px;
            text-align: center;
            max-width: 80%;
          }
        </style>
      </head>
      <body>
        <div class="loading" id="loading">Loading stream...</div>
        <img id="stream" src="${streamUrl}?t=${Date.now()}" alt="Stream" style="display:none;">
        <script>
          const img = document.getElementById('stream');
          const loading = document.getElementById('loading');
          let retryCount = 0;
          const maxRetries = 3;
          
          img.onload = function() {
            loading.style.display = 'none';
            img.style.display = 'block';
            retryCount = 0;
            window.ReactNativeWebView.postMessage('loaded');
          };
          
          img.onerror = function() {
            retryCount++;
            if (retryCount < maxRetries) {
              loading.textContent = 'Reconnecting... (' + retryCount + '/' + maxRetries + ')';
              setTimeout(() => {
                img.src = '${streamUrl}?t=' + Date.now();
              }, 2000);
            } else {
              loading.style.display = 'none';
              const error = document.createElement('div');
              error.className = 'error';
              error.textContent = 'Failed to load stream.\\nCheck if device is online.';
              document.body.appendChild(error);
              window.ReactNativeWebView.postMessage('error');
            }
          };
        </script>
      </body>
      </html>
    `;
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#111827" />
      
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Devices</Text>
        <Text style={styles.headerSubtitle}>
          {devices.filter((d) => d.status === 'online').length} / {devices.length} Online
        </Text>
      </View>

      {/* Device List */}
      <ScrollView 
        style={styles.scrollView} 
        contentContainerStyle={styles.deviceList}
        showsVerticalScrollIndicator={false}
      >
        {devices.map((device) => (
          <TouchableOpacity
            key={device.id}
            style={[
              styles.deviceCard,
              device.status === 'offline' && styles.deviceCardOffline,
            ]}
            onPress={() => handleDeviceSelect(device)}
            onLongPress={() => testConnection(device)}
            delayLongPress={500}
            disabled={device.status === 'offline'}
            activeOpacity={0.7}
          >
            <View style={styles.deviceCardHeader}>
              <View style={styles.deviceInfo}>
                <Text style={styles.deviceName}>{device.name}</Text>
                {device.location && (
                  <Text style={styles.deviceLocation}>{device.location}</Text>
                )}
                <Text style={styles.deviceUrl}>{device.streamUrl}</Text>
              </View>
              <View style={styles.deviceStatus}>
                <View
                  style={[
                    styles.statusDot,
                    device.status === 'online' ? styles.statusOnline : styles.statusOffline,
                  ]}
                />
                <Text style={styles.deviceType}>{device.type}</Text>
              </View>
            </View>
            <View style={styles.deviceCardFooter}>
              <Text style={styles.deviceStatusText}>
                Status: {device.status}
              </Text>
              {device.status === 'online' && (
                <Text style={styles.deviceAction}>Tap to view →</Text>
              )}
              <Text style={styles.deviceHint}>Long press to test</Text>
            </View>
          </TouchableOpacity>
        ))}
        
        {/* Add Device Button */}
        <TouchableOpacity
          style={styles.addDeviceCard}
          onPress={() => Alert.alert('Add Device', 'Feature coming soon!')}
          activeOpacity={0.7}
        >
          <Text style={styles.addDeviceIcon}>+</Text>
          <Text style={styles.addDeviceText}>Add New Device</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Stream Viewer Modal */}
      <Modal
        visible={selectedDevice !== null}
        animationType="slide"
        onRequestClose={handleCloseStream}
        presentationStyle="fullScreen"
      >
        <SafeAreaView style={styles.modalContainer}>
          <StatusBar barStyle="light-content" backgroundColor="#000" />
          
          {/* Modal Header */}
          <View style={styles.modalHeader}>
            <View style={styles.modalHeaderLeft}>
              <View style={styles.liveDot} />
              <View style={styles.modalHeaderText}>
                <Text style={styles.modalTitle}>{selectedDevice?.name}</Text>
                {selectedDevice?.location && (
                  <Text style={styles.modalSubtitle}>{selectedDevice.location}</Text>
                )}
              </View>
            </View>
            <TouchableOpacity onPress={handleCloseStream} style={styles.closeButton}>
              <Text style={styles.closeButtonText}>✕</Text>
            </TouchableOpacity>
          </View>

          {/* Controls */}
          <View style={styles.controls}>
            <TouchableOpacity
              style={[styles.controlButton, viewMode === 'stream' && styles.controlButtonActive]}
              onPress={switchToStream}
            >
              <Text style={[
                styles.controlButtonText,
                viewMode === 'stream' && styles.controlButtonTextActive
              ]}>
                📹 Stream
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[styles.controlButton, viewMode === 'snapshot' && styles.controlButtonActive]}
              onPress={switchToSnapshot}
            >
              <Text style={[
                styles.controlButtonText,
                viewMode === 'snapshot' && styles.controlButtonTextActive
              ]}>
                📷 Snapshot
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.controlButton} 
              onPress={refreshStream}
            >
              <Text style={styles.controlButtonText}>↻</Text>
            </TouchableOpacity>
          </View>

          {/* Connection Error Alert */}
          {connectionError && (
            <View style={styles.errorBanner}>
              <Text style={styles.errorBannerText}>⚠️ {connectionError}</Text>
            </View>
          )}

          {/* Stream View */}
          <View style={styles.streamContainer}>
            {isLoading && (
              <View style={styles.loadingOverlay}>
                <ActivityIndicator size="large" color="#10b981" />
                <Text style={styles.loadingText}>Loading stream...</Text>
              </View>
            )}

            {viewMode === 'stream' && selectedDevice ? (
              <WebView
                ref={webViewRef}
                source={{ html: generateStreamHTML(selectedDevice.streamUrl) }}
                style={styles.webView}
                onLoadStart={() => setIsLoading(true)}
                onLoadEnd={() => setIsLoading(false)}
                onMessage={(event) => {
                  if (event.nativeEvent.data === 'loaded') {
                    setIsLoading(false);
                  } else if (event.nativeEvent.data === 'error') {
                    setIsLoading(false);
                    setConnectionError('Unable to connect to device. Check hostname and network.');
                  }
                }}
                onError={(syntheticEvent) => {
                  const { nativeEvent } = syntheticEvent;
                  console.error('WebView error: ', nativeEvent);
                  setIsLoading(false);
                  setConnectionError('Stream connection failed. Try refreshing.');
                }}
                mediaPlaybackRequiresUserAction={false}
                allowsInlineMediaPlayback={true}
                javaScriptEnabled={true}
                domStorageEnabled={true}
                originWhitelist={['*']}
                mixedContentMode="always"
              />
            ) : (
              selectedDevice?.snapshotUrl && (
                <ScrollView
                  style={styles.snapshotScroll}
                  contentContainerStyle={styles.snapshotScrollContent}
                  maximumZoomScale={3}
                  minimumZoomScale={1}
                  showsVerticalScrollIndicator={false}
                >
                  <Image
                    source={{ uri: `${selectedDevice.snapshotUrl}?t=${Date.now()}` }}
                    style={styles.snapshotImage}
                    resizeMode="contain"
                    onLoadStart={() => setIsLoading(true)}
                    onLoadEnd={() => setIsLoading(false)}
                    onError={() => {
                      setIsLoading(false);
                      setConnectionError('Failed to load snapshot');
                    }}
                  />
                </ScrollView>
              )
            )}
          </View>

          {/* Footer */}
          <View style={styles.modalFooter}>
            <Text style={styles.footerText}>640x480 @ 20fps</Text>
            <Text style={styles.footerText}>Quality: 40</Text>
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

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#111827',
  },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 20,
    backgroundColor: '#1f2937',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 8,
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#9ca3af',
  },
  scrollView: {
    flex: 1,
  },
  deviceList: {
    padding: 20,
  },
  deviceCard: {
    backgroundColor: '#1f2937',
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#374151',
  },
  deviceCardOffline: {
    opacity: 0.5,
  },
  deviceCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  deviceInfo: {
    flex: 1,
  },
  deviceName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 4,
  },
  deviceLocation: {
    fontSize: 14,
    color: '#9ca3af',
    marginBottom: 4,
  },
  deviceUrl: {
    fontSize: 12,
    color: '#6b7280',
    fontFamily: 'monospace',
  },
  deviceStatus: {
    alignItems: 'flex-end',
  },
  statusDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginBottom: 8,
  },
  statusOnline: {
    backgroundColor: '#10b981',
  },
  statusOffline: {
    backgroundColor: '#ef4444',
  },
  deviceType: {
    fontSize: 12,
    color: '#6b7280',
  },
  deviceCardFooter: {
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#374151',
  },
  deviceStatusText: {
    fontSize: 12,
    color: '#6b7280',
    marginBottom: 4,
  },
  deviceAction: {
    fontSize: 12,
    color: '#10b981',
    fontWeight: '600',
    marginBottom: 4,
  },
  deviceHint: {
    fontSize: 11,
    color: '#6b7280',
    fontStyle: 'italic',
  },
  addDeviceCard: {
    backgroundColor: '#1f2937',
    borderRadius: 12,
    padding: 30,
    marginBottom: 16,
    borderWidth: 2,
    borderColor: '#374151',
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
  },
  addDeviceIcon: {
    fontSize: 32,
    color: '#10b981',
    marginBottom: 8,
  },
  addDeviceText: {
    fontSize: 14,
    color: '#9ca3af',
    fontWeight: '600',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#000',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#1f2937',
  },
  modalHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  modalHeaderText: {
    marginLeft: 12,
  },
  liveDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#10b981',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
  },
  modalSubtitle: {
    fontSize: 14,
    color: '#9ca3af',
    marginTop: 2,
  },
  closeButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#374151',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 12,
  },
  closeButtonText: {
    fontSize: 20,
    color: '#fff',
    fontWeight: 'bold',
  },
  controls: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: '#1f2937',
    gap: 8,
  },
  controlButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 12,
    backgroundColor: '#374151',
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  controlButtonActive: {
    backgroundColor: '#10b981',
  },
  controlButtonText: {
    color: '#9ca3af',
    fontSize: 13,
    fontWeight: '600',
  },
  controlButtonTextActive: {
    color: '#fff',
  },
  errorBanner: {
    backgroundColor: 'rgba(239, 68, 68, 0.2)',
    borderBottomWidth: 1,
    borderBottomColor: '#ef4444',
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  errorBannerText: {
    color: '#fca5a5',
    fontSize: 13,
    fontWeight: '500',
  },
  streamContainer: {
    flex: 1,
    backgroundColor: '#000',
    position: 'relative',
  },
  webView: {
    flex: 1,
    backgroundColor: '#000',
  },
  snapshotScroll: {
    flex: 1,
  },
  snapshotScrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  snapshotImage: {
    width: '100%',
    height: '100%',
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  loadingText: {
    color: '#10b981',
    marginTop: 12,
    fontSize: 14,
    fontWeight: '500',
  },
  modalFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: '#1f2937',
  },
  footerText: {
    fontSize: 12,
    color: '#9ca3af',
  },
  liveIndicatorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  liveIndicatorDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#10b981',
    marginRight: 6,
  },
  liveIndicator: {
    fontSize: 12,
    color: '#10b981',
    fontWeight: '700',
  },
});