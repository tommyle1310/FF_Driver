import React, { useEffect, useState } from "react";
import { View, StyleSheet, Image, Alert, Text } from "react-native";
import MapView, { Marker, Polyline, Region } from "react-native-maps";
import * as Location from "expo-location"; // Import Expo's Location API

// Type for the route coordinate object
interface Coordinate {
  latitude: number;
  longitude: number;
}

interface MapWithCurrentLocationProps {
  selectedDestination?: {
    lat: number;
    lng: number;
    name?: string;
    avatar?: { url?: string };
    type?: "PICKUP" | "DROPOFF";
  } | null;
}

const MapWithCurrentLocation: React.FC<MapWithCurrentLocationProps> = ({
  selectedDestination,
}) => {
  const [userLocation, setUserLocation] = useState<{
    lat: number;
    lng: number;
  } | null>(null);
  const [routeCoordinates, setRouteCoordinates] = useState<Coordinate[]>([]);
  const [isLoadingRoute, setIsLoadingRoute] = useState<boolean>(false);
  const [routeError, setRouteError] = useState<string | null>(null);
  const [isTooFar, setIsTooFar] = useState<boolean>(false);

  // Calculate distance between two coordinates using Haversine formula
  const calculateDistance = (
    lat1: number, 
    lon1: number, 
    lat2: number, 
    lon2: number
  ): number => {
    const R = 6371; // Radius of the earth in km
    const dLat = deg2rad(lat2 - lat1);
    const dLon = deg2rad(lon2 - lon1);
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) * 
      Math.sin(dLon/2) * Math.sin(dLon/2); 
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)); 
    const distance = R * c; // Distance in km
    return distance;
  };
  
  const deg2rad = (deg: number): number => {
    return deg * (Math.PI/180);
  };

  // Function to get route from TomTom API
  const getRouteFromTomTom = async (
    start: Coordinate,
    end: Coordinate
  ): Promise<Coordinate[]> => {
    // Check if distance is reasonable for driving (< 300 km)
    const distance = calculateDistance(
      start.latitude, 
      start.longitude, 
      end.latitude, 
      end.longitude
    );
    
    console.log(`Distance between points: ${distance.toFixed(2)} km`);
    
    if (distance > 300) {
      console.warn("Distance too far for practical driving route:", distance);
      setRouteError(`Distance too far (${distance.toFixed(0)} km)`);
      setIsTooFar(true);
      // Return direct line for visualization
      return createDirectLineRoute(start, end);
    } else {
      setIsTooFar(false);
    }

    const origin = `${start.latitude},${start.longitude}`;
    const destination = `${end.latitude},${end.longitude}`;
    const apiKey = "7zmNwV5XQGs5II7Z7KxIp9K551ZlFAwV";

    try {
      // Add a timeout to prevent hanging requests
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);

      const response = await fetch(
        `https://api.tomtom.com/routing/1/calculateRoute/${origin}:${destination}/json?key=${apiKey}&routeType=fastest&travelMode=car&traffic=true`,
        { signal: controller.signal }
      );
      clearTimeout(timeoutId);

      const data = await response.json();

      if (data.routes && data.routes.length > 0) {
        const coordinates = data.routes[0].legs[0].points.map((point: any) => ({
          latitude: point.latitude,
          longitude: point.longitude,
        }));
        setRouteError(null);
        return coordinates;
      } else {
        console.error("Error fetching route:", data);
        setRouteError("No route found between these locations");
        
        // Create a fallback direct line route
        return createDirectLineRoute(start, end);
      }
    } catch (error) {
      console.error("Failed to fetch route from TomTom:", error);
      setRouteError("Error fetching route");
      
      // Create a fallback direct line route
      return createDirectLineRoute(start, end);
    }
  };

  // Create a direct line between two points as fallback
  const createDirectLineRoute = (start: Coordinate, end: Coordinate): Coordinate[] => {
    console.log("Creating direct line route as fallback");
    
    // Create a simple direct line with just start and end points
    return [
      { latitude: start.latitude, longitude: start.longitude },
      { latitude: end.latitude, longitude: end.longitude }
    ];
  };

  // Request and set the user's location when the component mounts
  useEffect(() => {
    const getLocation = async () => {
      try {
        // Ask for permission to access the location
        const { status } = await Location.requestForegroundPermissionsAsync(); // Request foreground permissions

        if (status === "granted") {
          // Get the current position
          const location = await Location.getCurrentPositionAsync({
            accuracy: Location.Accuracy.High,
          });
          const { latitude, longitude } = location.coords;
          setUserLocation({ lat: latitude, lng: longitude }); // Set the user's location
        } else {
          console.error("Permission to access location was denied");
          // Set default location for Vietnam
          setUserLocation({ lat: 10.781975, lng: 106.664512 });
        }
      } catch (error) {
        console.error("Error getting location:", error);
        // Set default location for Vietnam
        setUserLocation({ lat: 10.781975, lng: 106.664512 });
      }
    };

    getLocation(); // Call the function to get the location
  }, []);

  // Fetch route when destination is selected
  useEffect(() => {
    if (!userLocation || !selectedDestination) {
      setRouteCoordinates([]);
      setRouteError(null);
      setIsTooFar(false);
      return;
    }

    // Validate coordinates before fetching route
    if (
      !isValidCoordinate(userLocation.lat, userLocation.lng) ||
      !isValidCoordinate(selectedDestination.lat, selectedDestination.lng)
    ) {
      console.error("Invalid coordinates detected:", {
        user: userLocation,
        destination: selectedDestination,
      });
      setRouteError("Invalid coordinates");
      return;
    }

    const fetchRoute = async () => {
      setIsLoadingRoute(true);
      
      const start: Coordinate = {
        latitude: userLocation.lat,
        longitude: userLocation.lng,
      };
      
      const end: Coordinate = {
        latitude: selectedDestination.lat,
        longitude: selectedDestination.lng,
      };

      console.log("Fetching route from:", start, "to:", end);
      const route = await getRouteFromTomTom(start, end);
      setRouteCoordinates(route);
      setIsLoadingRoute(false);
    };

    fetchRoute();
  }, [userLocation, selectedDestination]);

  // Validate coordinates to prevent API errors
  const isValidCoordinate = (lat: number, lng: number): boolean => {
    return (
      lat !== 0 && 
      lng !== 0 && 
      !isNaN(lat) && 
      !isNaN(lng) && 
      Math.abs(lat) <= 90 && 
      Math.abs(lng) <= 180
    );
  };

  // Calculate the region for the map view
  const calculateRegion = (): Region => {
    if (!userLocation) {
      return {
        latitude: 10.781975,
        longitude: 106.664512,
        latitudeDelta: 0.005,
        longitudeDelta: 0.005,
      };
    }

    if (routeCoordinates.length === 0 || !selectedDestination) {
      return {
        latitude: userLocation.lat,
        longitude: userLocation.lng,
        latitudeDelta: 0.005,
        longitudeDelta: 0.005,
      };
    }

    // Calculate region to fit both user location and destination
    const start = { latitude: userLocation.lat, longitude: userLocation.lng };
    const end = { latitude: selectedDestination.lat, longitude: selectedDestination.lng };
    
    const minLat = Math.min(start.latitude, end.latitude);
    const maxLat = Math.max(start.latitude, end.latitude);
    const minLng = Math.min(start.longitude, end.longitude);
    const maxLng = Math.max(start.longitude, end.longitude);
    
    const latitude = (minLat + maxLat) / 2;
    const longitude = (minLng + maxLng) / 2;
    
    // Adjust zoom level based on distance
    let latitudeDelta = Math.max((maxLat - minLat) * 1.5, 0.005);
    let longitudeDelta = Math.max((maxLng - minLng) * 1.5, 0.005);
    
    // If distance is too large, limit the zoom to show just the user's location
    if (isTooFar) {
      return {
        latitude: userLocation.lat,
        longitude: userLocation.lng,
        latitudeDelta: 0.1,
        longitudeDelta: 0.1,
      };
    }

    return { latitude, longitude, latitudeDelta, longitudeDelta };
  };

  if (!userLocation) {
    return <View style={{ flex: 1 }} />; // Loading state while location is being fetched
  }

  return (
    <View style={{ flex: 1 }}>
      <MapView
        style={styles.map}
        region={calculateRegion()}
      >
        {/* Pin the user's current location */}
        <Marker
          coordinate={{
            latitude: userLocation.lat,
            longitude: userLocation.lng,
          }}
          title="Your Location"
        >
          <Image
            source={{
              uri: "https://res.cloudinary.com/dlavqnrlx/image/upload/v1738822195/p4l4v3g3fouypc7ycrqf.png",
            }}
            style={{ width: 30, height: 30 }} // Resize the image
          />
        </Marker>

        {/* Destination Marker */}
        {selectedDestination && isValidCoordinate(selectedDestination.lat, selectedDestination.lng) && (
          <Marker
            coordinate={{
              latitude: selectedDestination.lat,
              longitude: selectedDestination.lng,
            }}
            title={selectedDestination.name || "Destination"}
          >
            <Image
              source={{
                uri: selectedDestination.type === "PICKUP" 
                  ? "https://res.cloudinary.com/dlavqnrlx/image/upload/v1738823719/y3enpxwt8ankdbourzse.png"
                  : "https://res.cloudinary.com/dlavqnrlx/image/upload/v1738823283/ybntvkauzjijxexnsjh2.png",
              }}
              style={{ width: 40, height: 40 }}
            />
          </Marker>
        )}

        {/* Route Polyline */}
        {routeCoordinates.length > 0 && (
          <Polyline
            coordinates={routeCoordinates}
            strokeColor={isTooFar ? "#ff6b6b" : "#bf59fe"}
            strokeWidth={4}
            lineDashPattern={isTooFar ? [5, 5] : undefined}
          />
        )}
      </MapView>
      
      {/* Error message overlay */}
      {routeError && (
        <View style={styles.errorOverlay}>
          <Text style={styles.errorText}>{routeError}</Text>
          {isTooFar && (
            <Text style={styles.errorSubtext}>
              Destination is too far for driving directions
            </Text>
          )}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  map: {
    flex: 1,
  },
  errorOverlay: {
    position: 'absolute',
    top: 10,
    left: 10,
    right: 10,
    backgroundColor: 'rgba(0,0,0,0.7)',
    padding: 10,
    borderRadius: 5,
  },
  errorText: {
    color: 'white',
    fontWeight: 'bold',
    textAlign: 'center',
  },
  errorSubtext: {
    color: '#ff9999',
    fontSize: 12,
    textAlign: 'center',
    marginTop: 5,
  }
});

export default MapWithCurrentLocation;
