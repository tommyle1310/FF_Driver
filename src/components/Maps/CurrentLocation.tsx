import React, { useEffect, useState } from "react";
import { View, StyleSheet, Image } from "react-native";
import MapView, { Marker } from "react-native-maps";
import * as Location from "expo-location"; // Import Expo's Location API

const MapWithCurrentLocation: React.FC = () => {
  const [userLocation, setUserLocation] = useState<{
    lat: number;
    lng: number;
  } | null>(null);

  // Request and set the user's location when the component mounts
  useEffect(() => {
    const getLocation = async () => {
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
      }
    };

    getLocation(); // Call the function to get the location
  }, []);

  if (!userLocation) {
    return <View style={{ flex: 1 }} />; // Loading state while location is being fetched
  }

  return (
    <View style={{ flex: 1 }}>
      <MapView
        style={styles.map}
        region={{
          latitude: userLocation.lat,
          longitude: userLocation.lng,
          latitudeDelta: 0.005, // Zoom level
          longitudeDelta: 0.005, // Zoom level
        }}
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
      </MapView>
    </View>
  );
};

const styles = StyleSheet.create({
  map: {
    flex: 1,
  },
});

export default MapWithCurrentLocation;
