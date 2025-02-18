import { Platform } from "react-native";
import React from "react";
import WebMap from "./WebMap";

interface MapComponentProps {
  // Add any props your map components use
}

const MapWrapper: React.FC = () => {
  if (Platform.OS === "web") {
    return <WebMap />;
  }

  // Only import MapWithCurrentLocation on native platforms
  const MapWithCurrentLocation = require("./CurrentLocation").default;
  return <MapWithCurrentLocation />;
};

export default MapWrapper;
