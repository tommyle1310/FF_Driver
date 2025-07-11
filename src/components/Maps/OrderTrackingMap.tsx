import React, { useState, useEffect } from "react";
import { View, StyleSheet, Text, Image, Dimensions } from "react-native";
import MapView, { Marker, Polyline, Region } from "react-native-maps";

interface Coordinate {
  latitude: number;
  longitude: number;
}

interface RouteInfo {
  restaurantLocation: { lat: number; lng: number };
  customerLocation: { lat: number; lng: number };
  color: string;
}

interface OrderTrackingMapProps {
  routes: RouteInfo[];
  driverLocation?: { lat: number; lng: number } | null;
  style?: any;
}

const OrderTrackingMap: React.FC<OrderTrackingMapProps> = ({
  routes,
  driverLocation,
  style,
}) => {
  const [routesData, setRoutesData] = useState<
    { coordinates: Coordinate[]; color: string }[]
  >([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const driverCoord: Coordinate | null = driverLocation
    ? {
        latitude: driverLocation.lat,
        longitude: driverLocation.lng,
      }
    : null;

  const getRouteFromTomTom = async (
    start: Coordinate,
    end: Coordinate
  ): Promise<Coordinate[]> => {
    const origin = `${start.latitude},${start.longitude}`;
    const destination = `${end.latitude},${end.longitude}`;
    const apiKey = "7zmNwV5XQGs5II7Z7KxIp9K551ZlFAwV";

    try {
      const response = await fetch(
        `https://api.tomtom.com/routing/1/calculateRoute/${origin}:${destination}/json?key=${apiKey}`
      );
      const data = await response.json();

      if (data.routes && data.routes.length > 0) {
        return data.routes[0].legs[0].points;
      } else {
        console.error("Error fetching route:", data);
        return [];
      }
    } catch (error) {
      console.error("Failed to fetch route from TomTom:", error);
      return [];
    }
  };

  useEffect(() => {
    if (routes && routes.length > 0) {
      setIsLoading(true);
      const fetchAllRoutes = async () => {
        const allRoutesData = await Promise.all(
          routes.map(async (route) => {
            const restaurantCoord = {
              latitude: route.restaurantLocation.lat,
              longitude: route.restaurantLocation.lng,
            };
            const customerCoord = {
              latitude: route.customerLocation.lat,
              longitude: route.customerLocation.lng,
            };
            const routeCoords = await getRouteFromTomTom(
              restaurantCoord,
              customerCoord
            );
            return { coordinates: routeCoords, color: route.color };
          })
        );
        setRoutesData(allRoutesData.filter((r) => r.coordinates.length > 0));
        setIsLoading(false);
      };
      fetchAllRoutes();
    } else {
      setRoutesData([]);
      setIsLoading(false);
    }
  }, [routes]);

  const calculateRegion = (): Region => {
    const allCoords = routes.flatMap((route) => [
      {
        latitude: route.restaurantLocation.lat,
        longitude: route.restaurantLocation.lng,
      },
      {
        latitude: route.customerLocation.lat,
        longitude: route.customerLocation.lng,
      },
    ]);
    if (driverCoord) {
      allCoords.push(driverCoord);
    }

    if (allCoords.length === 0) {
      return {
        latitude: 10.762622,
        longitude: 106.660172,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      };
    }

    const lats = allCoords.map((coord) => coord.latitude);
    const lngs = allCoords.map((coord) => coord.longitude);

    const minLat = Math.min(...lats);
    const maxLat = Math.max(...lats);
    const minLng = Math.min(...lngs);
    const maxLng = Math.max(...lngs);

    const latitude = (minLat + maxLat) / 2;
    const longitude = (minLng + maxLng) / 2;
    const latitudeDelta = Math.max((maxLat - minLat) * 1.5, 0.01);
    const longitudeDelta = Math.max((maxLng - minLng) * 1.5, 0.01);

    return {
      latitude,
      longitude,
      latitudeDelta,
      longitudeDelta,
    };
  };

  if (!routes || routes.length === 0) {
    return (
      <View style={[styles.container, style]}>
        <View style={styles.placeholder}>
          <Text style={styles.placeholderText}>No route data available.</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, style]}>
      <MapView
        style={styles.map}
        region={calculateRegion()}
        showsUserLocation={!driverCoord}
      >
        {routes.map((route, index) => (
          <React.Fragment key={index}>
            <Marker
              coordinate={{
                latitude: route.restaurantLocation.lat,
                longitude: route.restaurantLocation.lng,
              }}
              title={`Restaurant ${index + 1}`}
            >
              <Image
                source={{
                  uri: "https://res.cloudinary.com/dlavqnrlx/image/upload/v1738823719/y3enpxwt8ankdbourzse.png",
                }}
                style={styles.restaurantMarker}
              />
            </Marker>
            <Marker
              coordinate={{
                latitude: route.customerLocation.lat,
                longitude: route.customerLocation.lng,
              }}
              title={`Customer ${index + 1}`}
            >
              <Image
                source={{
                  uri: "https://res.cloudinary.com/dlavqnrlx/image/upload/v1738823283/ybntvkauzjijxexnsjh2.png",
                }}
                style={styles.customerMarker}
              />
            </Marker>
          </React.Fragment>
        ))}

        {driverCoord && (
          <Marker coordinate={driverCoord} title="Driver Location">
            <Image
              source={{
                uri: "https://res.cloudinary.com/dlavqnrlx/image/upload/v1738822195/p4l4v3g3fouypc7ycrqf.png",
              }}
              style={styles.driverMarker}
            />
          </Marker>
        )}

        {routesData.map(
          (routeData, index) =>
            routeData.coordinates.length > 0 && (
              <Polyline
                key={index}
                coordinates={routeData.coordinates}
                strokeColor={routeData.color}
                strokeWidth={4}
              />
            )
        )}
      </MapView>

      {isLoading && (
        <View style={styles.loadingOverlay}>
          <Text style={styles.loadingText}>Loading route(s)...</Text>
        </View>
      )}
    </View>
  );
};

const { width } = Dimensions.get("window");

const styles = StyleSheet.create({
  container: {
    borderRadius: 12,
    overflow: "hidden",
    backgroundColor: "#f5f5f5",
  },
  map: {
    width: "100%",
    height: 200,
  },
  placeholder: {
    height: 200,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f0f0f0",
  },
  placeholderText: {
    color: "#666",
    fontSize: 14,
  },
  restaurantMarker: {
    width: 35,
    height: 35,
  },
  customerMarker: {
    width: 35,
    height: 35,
  },
  driverMarker: {
    width: 30,
    height: 30,
  },
  loadingOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(255,255,255,0.8)",
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    color: "#666",
    fontSize: 14,
  },
});

export default OrderTrackingMap; 