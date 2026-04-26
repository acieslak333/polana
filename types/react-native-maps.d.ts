// Minimal type declarations for react-native-maps.
// Run `npx expo install react-native-maps` to install the native module.
declare module 'react-native-maps' {
  import { ComponentType, ReactNode } from 'react';
  import { ViewStyle, StyleProp } from 'react-native';

  export const PROVIDER_GOOGLE: 'google';

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

  export interface MapViewProps {
    style?: StyleProp<ViewStyle>;
    provider?: 'google' | null;
    initialRegion?: Region;
    showsUserLocation?: boolean;
    showsMyLocationButton?: boolean;
    children?: ReactNode;
    accessibilityLabel?: string;
    [key: string]: unknown;
  }

  export interface MarkerProps {
    coordinate: LatLng;
    title?: string;
    description?: string;
    pinColor?: string;
    onPress?: () => void;
    children?: ReactNode;
    [key: string]: unknown;
  }

  export interface CalloutProps {
    children?: ReactNode;
    onPress?: () => void;
    tooltip?: boolean;
    [key: string]: unknown;
  }

  const MapView: ComponentType<MapViewProps>;
  export const Marker: ComponentType<MarkerProps>;
  export const Callout: ComponentType<CalloutProps>;
  export default MapView;
}
