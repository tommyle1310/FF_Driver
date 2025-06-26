import React from "react";
import { View, Text, StyleSheet } from "react-native";

interface WebMapProps {
  selectedDestination?: {
    lat: number;
    lng: number;
    name?: string;
    avatar?: { url?: string };
    type?: "PICKUP" | "DROPOFF";
  } | null;
}

const WebMap: React.FC<WebMapProps> = ({ selectedDestination }) => {
  return (
    <View style={styles.container}>
      <Text>Maps are not available in web version</Text>
      {selectedDestination && (
        <Text style={{ marginTop: 10, fontSize: 12 }}>
          Selected: {selectedDestination.name || "Destination"} 
          ({selectedDestination.lat.toFixed(4)}, {selectedDestination.lng.toFixed(4)})
        </Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f5f5f5",
  },
});

export default WebMap;
