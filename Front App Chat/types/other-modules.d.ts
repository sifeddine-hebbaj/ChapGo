declare module '@stomp/stompjs' {
  export interface StompConfig {
    brokerURL?: string;
    connectHeaders?: Record<string, string>;
    debug?: (str: string) => void;
    reconnectDelay?: number;
    heartbeatIncoming?: number;
    heartbeatOutgoing?: number;
    splitLargeFrames?: boolean;
    forceBinaryWSFrames?: boolean;
    appendMissingNULLonIncoming?: boolean;
    maxWebSocketChunkSize?: number;
    onConnect?: (frame: any) => void;
    onDisconnect?: (frame: any) => void;
    onStompError?: (frame: any) => void;
    onWebSocketClose?: (event: any) => void;
    onWebSocketError?: (event: any) => void;
    onUnhandledMessage?: (message: any) => void;
    onUnhandledReceipt?: (frame: any) => void;
    onUnhandledFrame?: (frame: any) => void;
    beforeConnect?: () => void;
    webSocketFactory?: () => WebSocket;
    logRawCommunication?: boolean;
    discardWebsocketOnCommFailure?: boolean;
  }

  export interface IMessage {
    command: string;
    headers: Record<string, string>;
    body: string;
    binaryBody?: Uint8Array;
    ack: (headers?: Record<string, string>) => void;
    nack: (headers?: Record<string, string>) => void;
  }

  export interface IPublishParams {
    destination: string;
    body?: string;
    binaryBody?: Uint8Array;
    headers?: Record<string, string>;
    skipContentLengthHeader?: boolean;
  }

  export interface IStompSocket {
    state: number;
    send: (data: string) => void;
    close: () => void;
  }

  export class Client {
    constructor(conf?: StompConfig);
    
    brokerURL?: string;
    stompVersions: string[];
    connectHeaders: Record<string, string>;
    disconnectHeaders: Record<string, string>;
    heartbeatIncoming: number;
    heartbeatOutgoing: number;
    splitLargeFrames: boolean;
    maxWebSocketChunkSize: number;
    forceBinaryWSFrames: boolean;
    appendMissingNULLonIncoming: boolean;
    reconnectDelay: number;
    maxReconnectAttempts: number;
    debug: (str: string) => void;
    logRawCommunication: boolean;
    discardWebsocketOnCommFailure: boolean;
    
    onConnect: (frame: any) => void;
    onDisconnect: (frame: any) => void;
    onStompError: (frame: any) => void;
    onWebSocketClose: (event: any) => void;
    onWebSocketError: (event: any) => void;
    onUnhandledMessage: (message: any) => void;
    onUnhandledReceipt: (frame: any) => void;
    onUnhandledFrame: (frame: any) => void;
    beforeConnect: () => void;
    
    webSocketFactory: () => WebSocket;
    
    connected: boolean;
    active: boolean;
    
    activate(): void;
    deactivate(options?: { force?: boolean }): void;
    forceDisconnect(): void;
    
    publish(params: IPublishParams): void;
    
    subscribe(
      destination: string,
      callback: (message: IMessage) => void,
      headers?: Record<string, string>
    ): { id: string; unsubscribe: () => void };
    
    unsubscribe(id: string, headers?: Record<string, string>): void;
    
    begin(transaction?: string): { id: string; commit: () => void; abort: () => void };
    commit(transaction: string): void;
    abort(transaction: string): void;
    
    ack(messageID: string, subscription: string, headers?: Record<string, string>): void;
    nack(messageID: string, subscription: string, headers?: Record<string, string>): void;
  }
}

declare module 'sockjs-client' {
  interface SockJSOptions {
    server?: string;
    sessionId?: number | (() => string);
    transports?: string | string[];
    timeout?: number;
    info?: {
      websocket?: boolean;
      cookie_needed?: boolean;
      origins?: string[];
      entropy?: number;
    };
  }

  interface SockJS extends EventTarget {
    readyState: number;
    protocol: string;
    url: string;
    binaryType: BinaryType;
    bufferedAmount: number;
    extensions: string;
    
    send(data: string | ArrayBufferLike | Blob | ArrayBufferView): void;
    close(code?: number, reason?: string): void;
    
    onopen: ((event: Event) => void) | null;
    onmessage: ((event: MessageEvent) => void) | null;
    onclose: ((event: CloseEvent) => void) | null;
    onerror: ((event: Event) => void) | null;
    
    addEventListener<K extends keyof WebSocketEventMap>(type: K, listener: (this: WebSocket, ev: WebSocketEventMap[K]) => any, options?: boolean | AddEventListenerOptions): void;
    addEventListener(type: string, listener: EventListenerOrEventListenerObject, options?: boolean | AddEventListenerOptions): void;
    removeEventListener<K extends keyof WebSocketEventMap>(type: K, listener: (this: WebSocket, ev: WebSocketEventMap[K]) => any, options?: boolean | EventListenerOptions): void;
    removeEventListener(type: string, listener: EventListenerOrEventListenerObject, options?: boolean | EventListenerOptions): void;
    
    ping?(data?: any): void;
    pong?(data?: any): void;
    terminate?(): void;
    
    CONNECTING: number;
    OPEN: number;
    CLOSING: number;
    CLOSED: number;
  }

  interface SockJSClass {
    new (url: string, protocols?: string | string[], options?: SockJSOptions): SockJS;
    CONNECTING: number;
    OPEN: number;
    CLOSING: number;
    CLOSED: number;
  }

  const SockJS: SockJSClass;
  export = SockJS;
}

declare module 'react-native-url-polyfill' {
  export function polyfill(): void;
}

declare module 'react-native-webview' {
  import { ComponentType } from 'react';
  import { ViewProps } from 'react-native';
  
  export interface WebViewProps extends ViewProps {
    source?: {
      uri?: string;
      html?: string;
      baseUrl?: string;
      headers?: Record<string, string>;
      method?: string;
      body?: string;
    };
    onLoad?: (event: any) => void;
    onLoadEnd?: (event: any) => void;
    onLoadStart?: (event: any) => void;
    onError?: (event: any) => void;
    onMessage?: (event: any) => void;
    onNavigationStateChange?: (event: any) => void;
    onShouldStartLoadWithRequest?: (event: any) => boolean;
    injectedJavaScript?: string;
    injectedJavaScriptBeforeContentLoaded?: string;
    javaScriptEnabled?: boolean;
    domStorageEnabled?: boolean;
    startInLoadingState?: boolean;
    renderLoading?: () => React.ReactNode;
    renderError?: (errorDomain?: string, errorCode?: number, errorDesc?: string) => React.ReactNode;
    userAgent?: string;
    applicationNameForUserAgent?: string;
    allowsInlineMediaPlayback?: boolean;
    bounces?: boolean;
    overScrollMode?: 'always' | 'content' | 'never';
    contentInset?: { top?: number; left?: number; bottom?: number; right?: number };
    contentInsetAdjustmentBehavior?: 'automatic' | 'scrollableAxes' | 'never' | 'always';
    dataDetectorTypes?: string | string[];
    scrollEnabled?: boolean;
    geolocationEnabled?: boolean;
    allowUniversalAccessFromFileURLs?: boolean;
    allowFileAccessFromFileURLs?: boolean;
    originWhitelist?: string[];
    mixedContentMode?: 'never' | 'always' | 'compatibility';
    thirdPartyCookiesEnabled?: boolean;
    sharedCookiesEnabled?: boolean;
    textZoom?: number;
    pullToRefreshEnabled?: boolean;
    onContentProcessDidTerminate?: (event: any) => void;
    allowsLinkPreview?: boolean;
    showsHorizontalScrollIndicator?: boolean;
    showsVerticalScrollIndicator?: boolean;
    keyboardDisplayRequiresUserAction?: boolean;
    hideKeyboardAccessoryView?: boolean;
    allowsBackForwardNavigationGestures?: boolean;
    incognito?: boolean;
    allowFileAccess?: boolean;
    saveFormDataDisabled?: boolean;
    cacheEnabled?: boolean;
    pagingEnabled?: boolean;
    allowsProtectedMedia?: boolean;
    useSharedProcessPool?: boolean;
    textInteractionEnabled?: boolean;
    mediaCapturePermissionGrantType?: 'prompt' | 'grant' | 'deny' | 'grantIfSameHostElsePrompt' | 'grantIfSameHostElseDeny';
    autoManageStatusBarEnabled?: boolean;
    setSupportMultipleWindows?: boolean;
    basicAuthCredential?: {
      username: string;
      password: string;
    };
    enableApplePay?: boolean;
    forceDarkOn?: boolean;
    minimumFontSize?: number;
    downloadingMessage?: string;
    lackPermissionToDownloadMessage?: string;
    urlPrefixesForDefaultIntent?: string[];
    onOpenWindow?: (event: any) => void;
    onPermissionRequest?: (event: any) => void;
    onScroll?: (event: any) => void;
    onHttpError?: (event: any) => void;
    onRenderProcessGone?: (event: any) => void;
    nestedScrollEnabled?: boolean;
    onContentSizeChange?: (event: any) => void;
    onCustomMenuSelection?: (event: any) => void;
    customMenuItems?: Array<{
      label: string;
      key: string;
    }>;
    webviewDebuggingEnabled?: boolean;
    onShouldStartLoadWithRequestCallback?: (shouldStart: boolean) => void;
  }
  
  export const WebView: ComponentType<WebViewProps>;
  export default WebView;
}

declare module '@react-navigation/native' {
  import { ComponentType } from 'react';
  
  export interface NavigationContainerProps {
    children: React.ReactNode;
    theme?: any;
    linking?: any;
    fallback?: React.ReactNode;
    documentTitle?: {
      enabled?: boolean;
      formatter?: (options: any, route: any) => string;
    };
    onReady?: () => void;
    onStateChange?: (state: any) => void;
    initialState?: any;
    independent?: boolean;
  }
  
  export const NavigationContainer: ComponentType<NavigationContainerProps>;
  
  export interface NavigationProp<T = any> {
    navigate: (name: string, params?: any) => void;
    goBack: () => void;
    reset: (state: any) => void;
    setParams: (params: any) => void;
    dispatch: (action: any) => void;
    canGoBack: () => boolean;
    isFocused: () => boolean;
    addListener: (type: string, callback: (e: any) => void) => () => void;
    removeListener: (type: string, callback: (e: any) => void) => void;
    getParent: (id?: string) => NavigationProp | undefined;
    getState: () => any;
  }
  
  export interface RouteProp<T = any> {
    key: string;
    name: string;
    params?: T;
    path?: string;
  }
  
  export function useNavigation<T = NavigationProp>(): T;
  export function useRoute<T = RouteProp>(): T;
  export function useFocusEffect(callback: () => void | (() => void)): void;
  export function useIsFocused(): boolean;
  export function useNavigationState<T>(selector: (state: any) => T): T;
}

declare module '@react-navigation/bottom-tabs' {
  import { ComponentType } from 'react';
  
  export interface BottomTabNavigationOptions {
    title?: string;
    tabBarLabel?: string | ((props: { focused: boolean; color: string }) => React.ReactNode);
    tabBarIcon?: (props: { focused: boolean; color: string; size: number }) => React.ReactNode;
    tabBarBadge?: string | number;
    tabBarBadgeStyle?: any;
    tabBarAccessibilityLabel?: string;
    tabBarTestID?: string;
    tabBarActiveTintColor?: string;
    tabBarInactiveTintColor?: string;
    tabBarActiveBackgroundColor?: string;
    tabBarInactiveBackgroundColor?: string;
    tabBarHideOnKeyboard?: boolean;
    tabBarItemStyle?: any;
    tabBarLabelStyle?: any;
    tabBarIconStyle?: any;
    tabBarStyle?: any;
    tabBarBackground?: () => React.ReactNode;
    tabBarButton?: (props: any) => React.ReactNode;
    headerShown?: boolean;
    unmountOnBlur?: boolean;
    freezeOnBlur?: boolean;
    lazy?: boolean;
  }
  
  export interface BottomTabNavigatorProps {
    initialRouteName?: string;
    screenOptions?: BottomTabNavigationOptions | ((props: any) => BottomTabNavigationOptions);
    backBehavior?: 'firstRoute' | 'initialRoute' | 'order' | 'history' | 'none';
    tabBar?: (props: any) => React.ReactNode;
    children: React.ReactNode;
  }
  
  export interface BottomTabScreenProps {
    name: string;
    component?: ComponentType<any>;
    children?: (props: any) => React.ReactNode;
    options?: BottomTabNavigationOptions | ((props: any) => BottomTabNavigationOptions);
    initialParams?: any;
    getId?: (props: any) => string;
    listeners?: any;
  }
  
  export function createBottomTabNavigator(): {
    Navigator: ComponentType<BottomTabNavigatorProps>;
    Screen: ComponentType<BottomTabScreenProps>;
  };
}
