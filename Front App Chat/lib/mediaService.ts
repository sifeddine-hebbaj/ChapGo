import { BASE_URL, getToken } from './api';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import * as Location from 'expo-location';
import { Audio } from 'expo-av';
import { Platform } from 'react-native';
import * as FileSystem from 'expo-file-system';

export interface MediaUploadResult {
  id?: number;
  filename: string;
  originalName: string;
  url: string;
  type: 'image' | 'video' | 'audio' | 'document' | 'pdf';
  size: number;
}

async function uriToBlob(uri: string): Promise<Blob> {
  const response = await fetch(uri);
  const blob = await response.blob();
  return blob;
}

export async function uploadMedia(uri: string, type: string): Promise<MediaUploadResult> {
  const filename = `media_${Date.now()}.${(type && type.includes('/')) ? type.split('/')[1] : 'bin'}`;
  const form = new FormData();

  if (Platform.OS === 'web') {
    // On web, build a File from Blob
    const response = await fetch(uri);
    const blob = await response.blob();
    const webFile = new File([blob], filename, { type: blob.type || type || 'application/octet-stream' });
    form.append('file', webFile);
  } else {
    // On native, use RN style object { uri, name, type }
    const nativeFile = {
      uri: Platform.OS === 'ios' ? uri.replace('file://', '') : uri,
      name: filename,
      type: type || 'application/octet-stream',
    } as any;
    form.append('file', nativeFile);
  }

  console.log('Uploading file (platform-aware):', { uri, type, filename, platform: Platform.OS });

  const token = await getToken();
  const uploadResponse = await fetch(`${BASE_URL}/api/media/upload`, {
    method: 'POST',
    body: form,
    headers: {
      Accept: 'application/json',
      // IMPORTANT: do NOT set 'Content-Type' here; let fetch set the boundary
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });

  if (!uploadResponse.ok) {
    const errorText = await uploadResponse.text();
    console.error('Upload error:', errorText);
    throw new Error(`Upload failed: ${uploadResponse.status} - ${errorText}`);
  }

  const result = await uploadResponse.json();
  // Normalize response to always include usable URL
  const normalized: MediaUploadResult = {
    id: result.id,
    filename: result.filename || result.storedName || filename,
    originalName: result.originalName || result.name || filename,
    url: result.url || `${BASE_URL}/uploads/${result.filename || result.storedName || filename}`,
    type: (result.type || (type.startsWith('image') ? 'image' : type.startsWith('video') ? 'video' : type.startsWith('audio') ? 'audio' : (type === 'application/pdf' ? 'pdf' : 'document'))) as MediaUploadResult['type'],
    size: result.size || 0,
  };
  console.log('Upload success (normalized):', normalized);
  return normalized;
}

export async function testUpload(uri: string, type: string): Promise<any> {
  const filename = `test_${Date.now()}.${(type && type.includes('/')) ? type.split('/')[1] : 'bin'}`;
  const form = new FormData();

  if (Platform.OS === 'web') {
    const response = await fetch(uri);
    const blob = await response.blob();
    const webFile = new File([blob], filename, { type: blob.type || type || 'application/octet-stream' });
    form.append('file', webFile);
  } else {
    const nativeFile = {
      uri: Platform.OS === 'ios' ? uri.replace('file://', '') : uri,
      name: filename,
      type: type || 'application/octet-stream',
    } as any;
    form.append('file', nativeFile);
  }

  console.log('Testing upload (platform-aware):', { uri, type, filename, platform: Platform.OS });

  try {
    const token = await getToken();
    const testResponse = await fetch(`${BASE_URL}/api/media/test-upload`, {
      method: 'POST',
      body: form,
      headers: {
        Accept: 'application/json',
        // Do not set Content-Type
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    });

    const testResult = await testResponse.json();
    console.log('Test upload result:', testResult);
    return testResult;
  } catch (error) {
    console.error('Test upload error:', error);
    throw error;
  }
}

export async function requestMediaLibraryPermissions(): Promise<boolean> {
  const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
  return status === 'granted';
}

export async function requestLocationPermissions(): Promise<boolean> {
  const { status } = await Location.requestForegroundPermissionsAsync();
  return status === 'granted';
}

export async function requestAudioPermissions(): Promise<boolean> {
  const { status } = await Audio.requestPermissionsAsync();
  return status === 'granted';
}

export async function requestCameraPermissions(): Promise<boolean> {
  const { status } = await ImagePicker.requestCameraPermissionsAsync();
  return status === 'granted';
}

export async function takePhoto(): Promise<MediaUploadResult | null> {
  const hasPermission = await requestCameraPermissions();
  if (!hasPermission) {
    throw new Error('Permission caméra refusée');
  }

  const result = await ImagePicker.launchCameraAsync({
    mediaTypes: ImagePicker.MediaTypeOptions.Images,
    allowsEditing: true,
    aspect: [4, 3],
    quality: 0.8,
  });

  if (!result.canceled && result.assets && result.assets[0]) {
    const asset = result.assets[0];
    return uploadMedia(asset.uri, asset.type || 'image/jpeg');
  }

  return null;
}

export async function selectImage(): Promise<MediaUploadResult | null> {
  const hasPermission = await requestMediaLibraryPermissions();
  if (!hasPermission) {
    throw new Error('Permission galerie refusée');
  }

  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ImagePicker.MediaTypeOptions.Images,
    allowsEditing: true,
    aspect: [4, 3],
    quality: 0.8,
  });

  if (!result.canceled && result.assets && result.assets[0]) {
    const asset = result.assets[0];
    return uploadMedia(asset.uri, asset.type || 'image/jpeg');
  }

  return null;
}

export async function selectVideo(): Promise<MediaUploadResult | null> {
  const hasPermission = await requestMediaLibraryPermissions();
  if (!hasPermission) {
    throw new Error('Permission galerie refusée');
  }

  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ImagePicker.MediaTypeOptions.Videos,
    allowsEditing: true,
    quality: 0.8,
  });

  if (!result.canceled && result.assets && result.assets[0]) {
    const asset = result.assets[0];
    return uploadMedia(asset.uri, asset.type || 'video/mp4');
  }

  return null;
}

export async function selectDocument(): Promise<MediaUploadResult | null> {
  const result = await DocumentPicker.getDocumentAsync({
    type: '*/*',
    copyToCacheDirectory: true,
  });

  if (!result.canceled && result.assets && result.assets[0]) {
    const asset = result.assets[0];
    return uploadMedia(asset.uri, asset.mimeType || 'application/octet-stream');
  }

  return null;
}

export async function getCurrentLocation(): Promise<{latitude: number, longitude: number} | null> {
  const hasPermission = await requestLocationPermissions();
  if (!hasPermission) {
    throw new Error('Permission localisation refusée');
  }

  const location = await Location.getCurrentPositionAsync({});
  return {
    latitude: location.coords.latitude,
    longitude: location.coords.longitude,
  };
}

export async function startAudioRecording(): Promise<Audio.Recording> {
  const hasPermission = await requestAudioPermissions();
  if (!hasPermission) {
    throw new Error('Permission audio refusée');
  }

  await Audio.setAudioModeAsync({
    allowsRecordingIOS: true,
    playsInSilentModeIOS: true,
  });

  const { recording } = await Audio.Recording.createAsync(
    Audio.RecordingOptionsPresets.HIGH_QUALITY
  );

  return recording;
}

export async function stopAudioRecording(recording: Audio.Recording): Promise<MediaUploadResult | null> {
  await recording.stopAndUnloadAsync();
  const uri = recording.getURI();
  
  if (uri) {
    return uploadMedia(uri, 'audio/m4a');
  }

  return null;
}
