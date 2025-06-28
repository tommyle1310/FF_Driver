import { useEffect, useRef, useState } from "react";
import { useSelector } from "react-redux";
import type { RootState } from "../store/store";
import * as Location from "expo-location";
import LocationSocketManager from "./LocationSocketManager";
import NetInfo from "@react-native-community/netinfo";

interface LocationData {
  driver_location: { lng: number; lat: number };
  destination: { lng: number; lat: number };
}

interface LocationSocketResponse {
  success: boolean;
  message?: string;
  error?: string;
}

export const useLocationSocket = (driverId?: string) => {
  const { accessToken, userId } = useSelector((state: RootState) => state.auth);
  const { stages, current_state } = useSelector(
    (state: RootState) => state.currentDriverProgressStage
  );
  
  const [isLocationSocketConnected, setIsLocationSocketConnected] = useState(false);
  const [hasLocationPermission, setHasLocationPermission] = useState(false);
  const [currentLocation, setCurrentLocation] = useState<{
    lat: number;
    lng: number;
  } | null>(null);
  
  const locationIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const locationWatchRef = useRef<Location.LocationSubscription | null>(null);
  const emitQueueRef = useRef<LocationData[]>([]);
  
  // Get the destination from the LAST stage details (final destination)
  const getCurrentDestination = (): { lng: number; lat: number } | null => {
    if (!stages || stages.length === 0) return null;
    
    // Always get destination from the LAST stage (final destination)
    // For 1 order (5 stages): destination = 5th stage
    // For 2 orders (10 stages): destination = 10th stage  
    // For 3 orders (15 stages): destination = 15th stage
    const lastStage = stages[stages.length - 1];
    
    if (lastStage?.details?.location) {
      const location = lastStage.details.location;
      if (location.lat && location.lng) {
        console.log(`[LocationSocket] Using last stage (${stages.length}/${stages.length}) as destination:`, {
          stage: lastStage.state,
          location: { lat: location.lat, lng: location.lng }
        });
        return {
          lng: location.lng,
          lat: location.lat,
        };
      }
    }
    
    console.warn(`[LocationSocket] Last stage has no valid location data:`, {
      totalStages: stages.length,
      lastStageState: lastStage?.state,
      lastStageLocation: lastStage?.details?.location
    });
    
    return null;
  };

  // Check if driver has active orders/stages
  const hasActiveOrders = (): boolean => {
    if (!stages || stages.length === 0) return false;
    
    // Check if there are any stages that are not completed
    const hasActiveStages = stages.some(
      stage => stage.status === "in_progress" || stage.status === "pending"
    );
    
    return hasActiveStages && current_state !== null;
  };

  // Request location permissions
  const requestLocationPermission = async (): Promise<boolean> => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      
      if (status === "granted") {
        setHasLocationPermission(true);
        console.log("[LocationSocket] Location permission granted");
        return true;
      } else {
        console.warn("[LocationSocket] Location permission denied");
        setHasLocationPermission(false);
        return false;
      }
    } catch (error) {
      console.error("[LocationSocket] Error requesting location permission:", error);
      setHasLocationPermission(false);
      return false;
    }
  };

  // Get current device location
  const getCurrentLocation = async (): Promise<{ lat: number; lng: number } | null> => {
    if (!hasLocationPermission) {
      const granted = await requestLocationPermission();
      if (!granted) return null;
    }

    try {
      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });
      
      const { latitude, longitude } = location.coords;
      const locationData = { lat: latitude, lng: longitude };
      
      setCurrentLocation(locationData);
      return locationData;
    } catch (error) {
      console.error("[LocationSocket] Error getting current location:", error);
      return null;
    }
  };

  // Emit location update to server
  const emitLocationUpdate = async (): Promise<void> => {
    console.log('ever fall in this?')
    if (!LocationSocketManager.isConnected()) {
      console.log("[LocationSocket] Socket not connected, skipping location emit");
      return;
    }

    if (!hasActiveOrders()) {
      console.log("[LocationSocket] No active orders, skipping location emit");
      return;
    }

    const driverLocation = await getCurrentLocation();
    const destination = getCurrentDestination();

    if (!driverLocation) {
      console.warn("[LocationSocket] Cannot get driver location, skipping emit");
      return;
    }

    if (!destination) {
      console.warn("[LocationSocket] Cannot get destination, skipping emit");
      return;
    }

    const locationData: LocationData = {
      driver_location: {
        lng: driverLocation.lng,
        lat: driverLocation.lat,
      },
      destination: {
        lng: destination.lng,
        lat: destination.lat,
      },
    };

    console.log("[LocationSocket] Emitting updateDriverLocation:", locationData);

    LocationSocketManager.emit(
      "updateDriverLocation",
      locationData,
      (response: LocationSocketResponse) => {
        if (response.error) {
          console.error("[LocationSocket] Error in updateDriverLocation:", response.error);
        } else {
          console.log("[LocationSocket] Location update successful:", response.message);
        }
      }
    );
  };

  // Start location tracking interval
  const startLocationTracking = () => {
    if (locationIntervalRef.current) {
      clearInterval(locationIntervalRef.current);
    }

    console.log("[LocationSocket] Starting location tracking (5-second interval)");
    
    // Emit immediately
    emitLocationUpdate();
    
    // Then emit every 5 seconds
    locationIntervalRef.current = setInterval(() => {
      emitLocationUpdate();
    }, 5000);
  };

  // Stop location tracking
  const stopLocationTracking = () => {
    if (locationIntervalRef.current) {
      console.log("[LocationSocket] Stopping location tracking");
      clearInterval(locationIntervalRef.current);
      locationIntervalRef.current = null;
    }
  };

  // Initialize location socket connection
  useEffect(() => {
    if (!driverId || !accessToken || !userId) {
      console.log("[LocationSocket] Missing credentials, cleaning up");
      LocationSocketManager.cleanup();
      return;
    }

    LocationSocketManager.initialize(driverId, accessToken, userId);

    const handleConnect = () => {
      console.log("[LocationSocket] Connected to location server");
      setIsLocationSocketConnected(true);
      
      // Start location tracking when connected and has active orders
      if (hasActiveOrders()) {
        startLocationTracking();
      }
    };

    const handleConnectError = (error: any) => {
      console.error("[LocationSocket] Connection error:", {
        message: error.message,
        description: error.description,
        context: error.context,
      });
      setIsLocationSocketConnected(false);
    };

    const handleDisconnect = (reason: string) => {
      console.log("[LocationSocket] Disconnected, reason:", reason);
      setIsLocationSocketConnected(false);
      stopLocationTracking();
    };

    LocationSocketManager.on("connect", handleConnect);
    LocationSocketManager.on("connect_error", handleConnectError);
    LocationSocketManager.on("disconnect", handleDisconnect);

    // Network monitoring
    const unsubscribe = NetInfo.addEventListener((state) => {
      if (!state.isConnected || !state.isInternetReachable) {
        console.log("[LocationSocket] Network lost, disconnecting");
        LocationSocketManager.disconnect();
        setIsLocationSocketConnected(false);
        stopLocationTracking();
      }
    });

    return () => {
      console.log("[LocationSocket] Cleaning up location socket listeners");
      LocationSocketManager.off("connect", handleConnect);
      LocationSocketManager.off("connect_error", handleConnectError);
      LocationSocketManager.off("disconnect", handleDisconnect);
      unsubscribe();
      stopLocationTracking();
    };
  }, [driverId, accessToken, userId]);

  // Handle active orders changes
  useEffect(() => {
    if (!isLocationSocketConnected) return;

    if (hasActiveOrders()) {
      console.log("[LocationSocket] Active orders detected, starting location tracking");
      startLocationTracking();
    } else {
      console.log("[LocationSocket] No active orders, stopping location tracking");
      stopLocationTracking();
    }

    // Cleanup when component unmounts or dependencies change
    return () => {
      stopLocationTracking();
    };
  }, [isLocationSocketConnected, stages, current_state]);

  // Request location permission on mount
  useEffect(() => {
    requestLocationPermission();
  }, []);

  return {
    isLocationSocketConnected,
    hasLocationPermission,
    currentLocation,
    hasActiveOrders: hasActiveOrders(),
    getCurrentDestination,
    emitLocationUpdate,
  };
}; 