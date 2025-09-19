declare module 'expo-router' {
  import { ComponentType } from 'react';
  
  export interface RouterOptions {
    replace?: boolean;
  }
  
  export interface Router {
    push: (href: string | { pathname: string; params?: Record<string, any> }, options?: RouterOptions) => void;
    replace: (href: string | { pathname: string; params?: Record<string, any> }, options?: RouterOptions) => void;
    back: () => void;
    canGoBack: () => boolean;
    navigate: (href: string | { pathname: string; params?: Record<string, any> }) => void;
  }
  
  export const router: Router;
  
  export interface LinkProps {
    href: string;
    asChild?: boolean;
    replace?: boolean;
    push?: boolean;
    children?: React.ReactNode;
    style?: any;
    onPress?: () => void;
  }
  
  export const Link: ComponentType<LinkProps>;
  
  export interface StackScreenOptions {
    title?: string;
    headerShown?: boolean;
    headerTitle?: string;
    headerBackTitle?: string;
    headerStyle?: any;
    headerTitleStyle?: any;
    headerTintColor?: string;
    headerBackgroundColor?: string;
    presentation?: 'modal' | 'card' | 'transparentModal';
    animation?: 'slide_from_right' | 'slide_from_bottom' | 'fade' | 'flip' | 'none';
  }
  
  export interface StackProps {
    children?: React.ReactNode;
    screenOptions?: StackScreenOptions;
  }
  
  export const Stack: ComponentType<StackProps> & {
    Screen: ComponentType<{
      name: string;
      options?: StackScreenOptions;
      children?: React.ReactNode;
    }>;
  };
  
  export interface TabsProps {
    children?: React.ReactNode;
    screenOptions?: {
      title?: string;
      tabBarIcon?: (props: { focused: boolean; color: string; size: number }) => React.ReactNode;
      tabBarLabel?: string;
      headerShown?: boolean;
      tabBarStyle?: any;
      tabBarActiveTintColor?: string;
      tabBarInactiveTintColor?: string;
    };
  }
  
  export const Tabs: ComponentType<TabsProps> & {
    Screen: ComponentType<{
      name: string;
      options?: TabsProps['screenOptions'];
      children?: React.ReactNode;
    }>;
  };
  
  export function useLocalSearchParams<T = Record<string, string>>(): T;
  export function useGlobalSearchParams<T = Record<string, string>>(): T;
  export function useSegments(): string[];
  export function usePathname(): string;
}

declare module 'expo-image-picker' {
  export interface ImagePickerAsset {
    uri: string;
    width: number;
    height: number;
    type?: string;
    mimeType?: string;
    fileSize?: number;
    fileName?: string;
    duration?: number;
  }
  
  export interface ImagePickerResult {
    canceled: boolean;
    assets: ImagePickerAsset[] | undefined;
  }
  
  export interface ImagePickerOptions {
    mediaTypes?: MediaTypeOptions;
    allowsEditing?: boolean;
    aspect?: [number, number];
    quality?: number;
    allowsMultipleSelection?: boolean;
    selectionLimit?: number;
    videoMaxDuration?: number;
  }
  
  export enum MediaTypeOptions {
    All = 'All',
    Videos = 'Videos',
    Images = 'Images',
  }
  
  export function launchImageLibraryAsync(options?: ImagePickerOptions): Promise<ImagePickerResult>;
  export function launchCameraAsync(options?: ImagePickerOptions): Promise<ImagePickerResult>;
  export function requestMediaLibraryPermissionsAsync(): Promise<{ status: string }>;
  export function requestCameraPermissionsAsync(): Promise<{ status: string }>;
}

declare module 'expo-document-picker' {
  export interface DocumentPickerAsset {
    uri: string;
    name: string;
    size: number;
    mimeType: string;
  }
  
  export interface DocumentPickerResult {
    canceled: boolean;
    assets?: DocumentPickerAsset[];
  }
  
  export interface DocumentPickerOptions {
    type?: string | string[];
    copyToCacheDirectory?: boolean;
    multiple?: boolean;
  }
  
  export function getDocumentAsync(options?: DocumentPickerOptions): Promise<DocumentPickerResult>;
}

declare module 'expo-location' {
  export interface LocationObject {
    coords: {
      latitude: number;
      longitude: number;
      altitude?: number;
      accuracy?: number;
      altitudeAccuracy?: number;
      heading?: number;
      speed?: number;
    };
    timestamp: number;
  }
  
  export interface LocationOptions {
    accuracy?: number;
    enableHighAccuracy?: boolean;
    timeout?: number;
    maximumAge?: number;
  }
  
  export function getCurrentPositionAsync(options?: LocationOptions): Promise<LocationObject>;
  export function requestForegroundPermissionsAsync(): Promise<{ status: string }>;
  export function requestBackgroundPermissionsAsync(): Promise<{ status: string }>;
}

declare module 'expo-av' {
  export interface RecordingOptions {
    android?: {
      extension?: string;
      outputFormat?: number;
      audioEncoder?: number;
      sampleRate?: number;
      numberOfChannels?: number;
      bitRate?: number;
      maxFileSize?: number;
    };
    ios?: {
      extension?: string;
      outputFormat?: string;
      audioQuality?: number;
      sampleRate?: number;
      numberOfChannels?: number;
      bitRate?: number;
      linearPCMBitDepth?: number;
      linearPCMIsBigEndian?: boolean;
      linearPCMIsFloat?: boolean;
    };
    web?: {
      mimeType?: string;
      bitsPerSecond?: number;
    };
  }
  
  export class Sound {
    static createAsync(source: { uri: string } | number, initialStatus?: any, onPlaybackStatusUpdate?: (status: any) => void, downloadFirst?: boolean): Promise<{ sound: Sound; status: any }>;
    unloadAsync(): Promise<void>;
    playAsync(): Promise<void>;
    pauseAsync(): Promise<void>;
    getStatusAsync(): Promise<any>;
    setOnPlaybackStatusUpdate(callback?: (status: any) => void): void;
  }
  
  export namespace Audio {
    export class Recording {
      static createAsync(options?: RecordingOptions): Promise<{ recording: Recording }>;
      startAsync(): Promise<void>;
      stopAndUnloadAsync(): Promise<void>;
      getURI(): string | null;
      getStatusAsync(): Promise<any>;
    }
    
    export const RecordingOptionsPresets: {
      HIGH_QUALITY: RecordingOptions;
      LOW_QUALITY: RecordingOptions;
    };
    
    export function setAudioModeAsync(mode: {
      allowsRecordingIOS?: boolean;
      playsInSilentModeIOS?: boolean;
      staysActiveInBackground?: boolean;
      shouldDuckAndroid?: boolean;
      playThroughEarpieceAndroid?: boolean;
    }): Promise<void>;
    
    export function requestPermissionsAsync(): Promise<{ status: string }>;
  }
  
  export const Audio: {
    Sound: typeof Sound;
    Recording: typeof Audio.Recording;
    RecordingOptionsPresets: typeof Audio.RecordingOptionsPresets;
    setAudioModeAsync: typeof Audio.setAudioModeAsync;
    requestPermissionsAsync: typeof Audio.requestPermissionsAsync;
  };
}

declare module 'expo-haptics' {
  export enum ImpactFeedbackStyle {
    Light = 'light',
    Medium = 'medium',
    Heavy = 'heavy',
  }
  
  export enum NotificationFeedbackType {
    Success = 'success',
    Warning = 'warning',
    Error = 'error',
  }
  
  export function impactAsync(style?: ImpactFeedbackStyle): Promise<void>;
  export function notificationAsync(type?: NotificationFeedbackType): Promise<void>;
  export function selectionAsync(): Promise<void>;
}

declare module 'expo-blur' {
  import { ComponentType } from 'react';
  import { ViewProps } from 'react-native';
  
  export interface BlurViewProps extends ViewProps {
    intensity?: number;
    tint?: 'light' | 'dark' | 'default';
    experimentalBlurMethod?: 'dimezisBlurView' | 'none';
  }
  
  export const BlurView: ComponentType<BlurViewProps>;
}

declare module 'expo-linear-gradient' {
  import { ComponentType } from 'react';
  import { ViewProps } from 'react-native';
  
  export interface LinearGradientProps extends ViewProps {
    colors: string[];
    start?: { x: number; y: number };
    end?: { x: number; y: number };
    locations?: number[];
  }
  
  export const LinearGradient: ComponentType<LinearGradientProps>;
}

declare module 'expo-camera' {
  import { ComponentType } from 'react';
  import { ViewProps } from 'react-native';
  
  export interface CameraProps extends ViewProps {
    type?: number;
    flashMode?: number;
    autoFocus?: number;
    zoom?: number;
    whiteBalance?: number;
    focusDepth?: number;
    ratio?: string;
    pictureSize?: string;
    onCameraReady?: () => void;
    onMountError?: (error: any) => void;
    onBarCodeScanned?: (data: any) => void;
    barCodeScannerSettings?: any;
    useCamera2Api?: boolean;
  }
  
  export const Camera: ComponentType<CameraProps> & {
    Constants: {
      Type: {
        back: number;
        front: number;
      };
      FlashMode: {
        on: number;
        off: number;
        auto: number;
        torch: number;
      };
      AutoFocus: {
        on: number;
        off: number;
      };
      WhiteBalance: {
        auto: number;
        sunny: number;
        cloudy: number;
        shadow: number;
        incandescent: number;
        fluorescent: number;
      };
    };
  };
  
  export function requestCameraPermissionsAsync(): Promise<{ status: string }>;
}

declare module 'expo-secure-store' {
  export function setItemAsync(key: string, value: string, options?: any): Promise<void>;
  export function getItemAsync(key: string, options?: any): Promise<string | null>;
  export function deleteItemAsync(key: string, options?: any): Promise<void>;
  export function isAvailableAsync(): Promise<boolean>;
}

declare module 'expo-web-browser' {
  export interface WebBrowserOpenOptions {
    controlsColor?: string;
    dismissButtonStyle?: 'done' | 'close' | 'cancel';
    readerMode?: boolean;
    showTitle?: boolean;
    toolbarColor?: string;
    secondaryToolbarColor?: string;
    enableBarCollapsing?: boolean;
    showInRecents?: boolean;
    createTask?: boolean;
  }
  
  export function openBrowserAsync(url: string, options?: WebBrowserOpenOptions): Promise<any>;
  export function dismissBrowser(): Promise<any>;
  export function warmUpAsync(browserPackage?: string): Promise<any>;
  export function coolDownAsync(browserPackage?: string): Promise<any>;
}

declare module 'expo-linking' {
  export function openURL(url: string): Promise<void>;
  export function canOpenURL(url: string): Promise<boolean>;
  export function getInitialURL(): Promise<string | null>;
  export function addEventListener(type: string, handler: (event: any) => void): void;
  export function removeEventListener(type: string, handler: (event: any) => void): void;
  export function parse(url: string): any;
  export function createURL(path: string, options?: any): string;
}

declare module 'expo-font' {
  export function loadAsync(fontMap: Record<string, any>): Promise<void>;
  export function isLoaded(fontFamily: string): boolean;
  export function isLoading(fontFamily: string): boolean;
}

declare module 'expo-constants' {
  export interface Constants {
    appOwnership: string;
    debugMode: boolean;
    deviceName?: string;
    deviceYearClass?: number;
    experienceUrl: string;
    expoVersion: string;
    installationId: string;
    isDetached: boolean;
    isDevice: boolean;
    linkingUri: string;
    manifest: any;
    platform: {
      ios?: any;
      android?: any;
      web?: any;
    };
    sessionId: string;
    statusBarHeight: number;
    systemFonts: string[];
    systemVersion?: string;
  }
  
  const constants: Constants;
  export default constants;
}

declare module 'expo-auth-session' {
  export interface AuthRequest {
    makeRedirectUri: (options?: any) => string;
    promptAsync: (options?: any) => Promise<any>;
  }
  
  export function useAuthRequest(config: any, discovery?: any): [AuthRequest | null, any, () => void];
  export function makeRedirectUri(options?: any): string;
  export function useAutoDiscovery(issuerOrDiscoveryDocument: string): any;
}

declare module 'expo-status-bar' {
  import { ComponentType } from 'react';
  
  export interface StatusBarProps {
    style?: 'auto' | 'inverted' | 'light' | 'dark';
    backgroundColor?: string;
    translucent?: boolean;
    hidden?: boolean;
    networkActivityIndicatorVisible?: boolean;
    animated?: boolean;
  }
  
  export const StatusBar: ComponentType<StatusBarProps>;
}

declare module 'expo-splash-screen' {
  export function preventAutoHideAsync(): Promise<boolean>;
  export function hideAsync(): Promise<boolean>;
  export function setOptions(options: any): void;
}

declare module 'expo-symbols' {
  import { ComponentType } from 'react';
  import { ViewProps } from 'react-native';
  
  export interface SymbolViewProps extends ViewProps {
    name: string;
    size?: number;
    type?: 'monochrome' | 'hierarchical' | 'palette' | 'multicolor';
    tintColor?: string;
    colors?: string[];
    weight?: 'ultraLight' | 'thin' | 'light' | 'regular' | 'medium' | 'semibold' | 'bold' | 'heavy' | 'black';
    scale?: 'small' | 'medium' | 'large';
    variableValue?: number;
    fallback?: React.ReactNode;
  }
  
  export const SymbolView: ComponentType<SymbolViewProps>;
}

declare module 'expo-system-ui' {
  export function setBackgroundColorAsync(color: string): Promise<void>;
  export function getBackgroundColorAsync(): Promise<string>;
}
