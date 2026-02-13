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
      streamUrl: 'http://192.168.87.248:5000/stream',
      snapshotUrl: 'http://192.168.87.248:5000/snapshot.jpg',
      location: 'Living Room',
    },
  ]);

  const [selectedDevice, setSelectedDevice] = useState<Device | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [viewMode, setViewMode] = useState<'stream' | 'snapshot'>('stream');
  const webViewRef = useRef<WebView>(null);

  const handleDeviceSelect = (device: Device) => {
    if (device.status === 'online') {
      setSelectedDevice(device);
      setIsLoading(true);
      setViewMode('stream');
    } else {
      Alert.alert('Device Offline', 'This device is currently offline.');
    }
  };

  const handleCloseStream = () => {
    setSelectedDevice(null);
    setIsLoading(false);
  };

  const refreshStream = () => {
    if (webViewRef.current) {
      webViewRef.current.reload();
      setIsLoading(true);
    }
  };

  const switchToSnapshot = () => {
    setViewMode('snapshot');
  };

  const switchToStream = () => {
    setViewMode('stream');
    setIsLoading(true);
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
        </style>
      </head>
      <body>
        <div class="loading" id="loading">Loading stream...</div>
        <img id="stream" src="${streamUrl}?t=${Date.now()}" alt="Stream" style="display:none;">
        <script>
          const img = document.getElementById('stream');
          const loading = document.getElementById('loading');
          
          img.onload = function() {
            loading.style.display = 'none';
            img.style.display = 'block';
            window.ReactNativeWebView.postMessage('loaded');
          };
          
          img.onerror = function() {
            loading.textContent = 'Reconnecting...';
            setTimeout(() => {
              img.src = '${streamUrl}?t=' + Date.now();
            }, 2000);
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
            disabled={device.status === 'offline'}
            activeOpacity={0.7}
          >
            <View style={styles.deviceCardHeader}>
              <View style={styles.deviceInfo}>
                <Text style={styles.deviceName}>{device.name}</Text>
                {device.location && (
                  <Text style={styles.deviceLocation}>{device.location}</Text>
                )}
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
                  }
                }}
                onError={(syntheticEvent) => {
                  const { nativeEvent } = syntheticEvent;
                  console.error('WebView error: ', nativeEvent);
                  setIsLoading(false);
                  Alert.alert('Stream Error', 'Failed to load stream. Please check your connection.');
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
                      Alert.alert('Error', 'Failed to load snapshot');
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#374151',
  },
  deviceStatusText: {
    fontSize: 12,
    color: '#6b7280',
  },
  deviceAction: {
    fontSize: 12,
    color: '#10b981',
    fontWeight: '600',
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