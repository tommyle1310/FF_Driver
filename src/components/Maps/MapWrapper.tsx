import { Platform } from "react-native";
import React from "react";
import WebMap from "./WebMap";

interface MapWrapperProps {
  selectedDestination?: {
    lat: number;
    lng: number;
    name?: string;
    avatar?: { url?: string };
    type?: "PICKUP" | "DROPOFF";
  } | null;
}

const MapWrapper: React.FC<MapWrapperProps> = ({ selectedDestination }) => {
  if (Platform.OS === "web") {
    return <WebMap selectedDestination={selectedDestination} />;
  }

  // Only import MapWithCurrentLocation on native platforms
  const MapWithCurrentLocation = require("./CurrentLocation").default;
  return <MapWithCurrentLocation selectedDestination={selectedDestination} />;
};

export default MapWrapper;
