declare module 'react-native-maps' {
  import React, { Component } from 'react';
  import { ViewStyle, ViewProps } from 'react-native';

  export interface Region {
    latitude: number;
    longitude: number;
    latitudeDelta: number;
    longitudeDelta: number;
  }

  export interface LatLng {
    latitude: number;
    longitude: number;
  }

  export interface MapEvent<T = {}> {
    nativeEvent: T & {
      coordinate: LatLng;
      position: {
        x: number;
        y: number;
      };
    };
  }

  export interface MapViewProps extends ViewProps {
    style?: ViewStyle;
    initialRegion?: Region;
    region?: Region;
    scrollEnabled?: boolean;
    zoomEnabled?: boolean;
    pitchEnabled?: boolean;
    rotateEnabled?: boolean;
    showsUserLocation?: boolean;
    followsUserLocation?: boolean;
    showsMyLocationButton?: boolean;
    showsPointsOfInterest?: boolean;
    showsCompass?: boolean;
    showsScale?: boolean;
    showsBuildings?: boolean;
    showsTraffic?: boolean;
    showsIndoors?: boolean;
    showsIndoorLevelPicker?: boolean;
    mapType?: 'standard' | 'satellite' | 'hybrid' | 'terrain' | 'none' | 'mutedStandard';
    onRegionChange?: (region: Region) => void;
    onRegionChangeComplete?: (region: Region) => void;
    onPress?: (event: MapEvent) => void;
    onLongPress?: (event: MapEvent) => void;
    onMarkerPress?: (event: MapEvent) => void;
    onMarkerSelect?: (event: MapEvent) => void;
    onMarkerDeselect?: (event: MapEvent) => void;
    children?: React.ReactNode;
  }

  export interface MarkerProps {
    coordinate: LatLng;
    title?: string;
    description?: string;
    image?: any;
    pinColor?: string;
    anchor?: { x: number; y: number };
    calloutAnchor?: { x: number; y: number };
    flat?: boolean;
    identifier?: string;
    rotation?: number;
    draggable?: boolean;
    onPress?: (event: MapEvent) => void;
    onSelect?: (event: MapEvent) => void;
    onDeselect?: (event: MapEvent) => void;
    onCalloutPress?: (event: MapEvent) => void;
    onDragStart?: (event: MapEvent) => void;
    onDrag?: (event: MapEvent) => void;
    onDragEnd?: (event: MapEvent) => void;
    children?: React.ReactNode;
  }

  export default class MapView extends Component<MapViewProps> {
    animateToRegion(region: Region, duration?: number): void;
    animateToCoordinate(coordinate: LatLng, duration?: number): void;
    fitToElements(animated?: boolean): void;
    fitToSuppliedMarkers(markers: string[], animated?: boolean): void;
    fitToCoordinates(coordinates: LatLng[], options?: {
      edgePadding?: {
        top?: number;
        right?: number;
        bottom?: number;
        left?: number;
      };
      animated?: boolean;
    }): void;
  }
  
  export class Marker extends Component<MarkerProps> {
    showCallout(): void;
    hideCallout(): void;
    animateMarkerToCoordinate(coordinate: LatLng, duration?: number): void;
  }
}
