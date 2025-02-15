import { useState, useEffect } from "react";

// Type for the driver
interface Driver {
  _id: string;
  lat: number;
  lng: number;
}

// Type for the hook props
interface UseSearchNearbyDriversProps {
  selectedLocation: { lat: number; lng: number } | null;
  tomtomKey: string;
  nearbySearchRadius?: number; // Optional radius, default is 1000 meters
  totalDrivers?: number; // Optional total drivers, default is 5
  isCaptureDriverOnlyThisMoment?: boolean; // Flag to capture drivers only once
}

const useSearchNearbyDrivers = ({
  selectedLocation,
  tomtomKey,
  nearbySearchRadius = 1000,
  totalDrivers = 5,
  isCaptureDriverOnlyThisMoment = false,
}: UseSearchNearbyDriversProps) => {
  const [allDrivers, setAllDrivers] = useState<Driver[]>([]); // Stores all drivers
  const [nearbyDrivers, setNearbyDrivers] = useState<Driver[]>([]); // Stores nearby drivers
  const [hasCapturedDrivers, setHasCapturedDrivers] = useState(false); // Flag to track if drivers have been captured

  // Function to calculate distance between two coordinates (Haversine formula)
  const getDistance = (
    lat1: number,
    lng1: number,
    lat2: number,
    lng2: number
  ) => {
    const R = 6371; // Earth radius in kilometers
    const dLat = (lat2 - lat1) * (Math.PI / 180);
    const dlng = (lng2 - lng1) * (Math.PI / 180);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * (Math.PI / 180)) *
        Math.cos(lat2 * (Math.PI / 180)) *
        Math.sin(dlng / 2) *
        Math.sin(dlng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c * 1000; // Distance in meters
    return distance;
  };

  // Helper function to generate random driver locations with better scatter
  const getRandomDriverLocations = (
    centerLat: number,
    centerLng: number,
    radius: number,
    numDrivers: number
  ): Driver[] => {
    const drivers: Driver[] = [];
    const listDriverIdSample = [
      "DRI_1bcb34fa-ac9d-4611-b432-4e05586e137c",
      "DRI_ee4e115b-0d08-486b-a2a4-b3b28a18a052",
      "DRI_e27a2c61-5cb6-4672-9136-7d9296d30623",
      "DRI_170b74ef-ba48-40a5-bab6-ac9562eba7e3",
      "DRI_11d6bc82-3f2a-4ff9-9700-712c5907b788",
    ];

    // Make sure we don't try to generate more drivers than we have IDs for
    const count = Math.min(numDrivers, listDriverIdSample.length);

    for (let i = 0; i < count; i++) {
      const angle = Math.random() * 2 * Math.PI; // Random angle between 0 and 2π
      const distance = Math.random() * (radius + 1000); // Allow some drivers outside the radius (extra 1km)

      // Convert polar coordinates to latitude/longitude offsets
      const latOffset = (distance / 111300) * Math.sin(angle);
      const lngOffset =
        (distance / (111300 * Math.cos(centerLat * (Math.PI / 180)))) *
        Math.cos(angle);

      const driverLat = centerLat + latOffset;
      const driverLng = centerLng + lngOffset;

      // Store the generated driver
      drivers.push({
        _id: listDriverIdSample[i],
        lat: driverLat,
        lng: driverLng,
      });
    }

    return drivers;
  };

  // Function to fetch all drivers based on the selected location
  const getAllDrivers = (lat: number, lng: number) => {
    // Generate random driver positions inside and around the radius
    const drivers = getRandomDriverLocations(
      lat,
      lng,
      nearbySearchRadius + 1000,
      totalDrivers
    );

    // Set the all drivers in the state
    setAllDrivers(drivers);

    // Filter drivers that are inside the search radius
    const nearby = drivers.filter(
      (driver) =>
        getDistance(lat, lng, driver.lat, driver.lng) <= nearbySearchRadius
    );

    // Set the nearby drivers in the state
    setNearbyDrivers(nearby);
  };

  // Use effect to trigger fetching all drivers when selectedLocation changes or if capture flag is true
  useEffect(() => {
    if (
      selectedLocation &&
      isCaptureDriverOnlyThisMoment &&
      !hasCapturedDrivers
    ) {
      const { lat, lng } = selectedLocation;
      getAllDrivers(lat, lng);
      setHasCapturedDrivers(true); // Mark that drivers have been captured
    } else if (selectedLocation && !isCaptureDriverOnlyThisMoment) {
      const { lat, lng } = selectedLocation;
      getAllDrivers(lat, lng);
    }
  }, [selectedLocation, isCaptureDriverOnlyThisMoment]);

  // Return all drivers and nearby drivers
  return { allDrivers, nearbyDrivers };
};

export default useSearchNearbyDrivers;
