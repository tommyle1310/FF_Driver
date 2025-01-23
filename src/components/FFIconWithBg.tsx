import React, { useState } from 'react';
import { Pressable, View } from 'react-native';
import Icon from 'react-native-vector-icons/FontAwesome';  // or another icon set
import { useTheme } from '@/src/hooks/useTheme';

interface FFIconWithBgProps {
  iconName: string; // Name of the icon
  size?: number; // Icon size
  backgroundColor?: string; // Background color of the small view
  iconColor?: string; // Icon color
  className?: string; // Optional Tailwind-like classes
}

const FFIconWithBg: React.FC<FFIconWithBgProps> = ({
  iconName,
  size = 32, // default icon size
  backgroundColor = 'bg-blue-500', // default background color
  iconColor = 'text-white', // default icon color
  className,
}) => {
  const { theme } = useTheme();
  const [pressed, setPressed] = useState(false);
  
    // Define gradient colors for the light and dark theme
    const gradientColors: readonly [string, string] =
      theme === "light"
        ? ["#ff7e5f", "#feb47b"] // Light theme gradient
        : ["#6a11cb", "#2575fc"]; // Dark theme gradient
  
    // Darker color versions for the pressed effect (optional)
    const darkenedGradientColors: readonly [string, string] =
      theme === "light"
        ? ["#e56c4a", "#d68f56"] // Darkened light theme gradient
        : ["#4c0f91", "#1e59a3"]; // Darkened dark theme gradient
  

  return (
    <Pressable
      onPressIn={() => setPressed(true)} // When press starts
      onPressOut={() => setPressed(false)} // When press ends
      style={{
        transform: [{ scale: pressed ? 0.95 : 1 }], // Apply scaling when pressed
        justifyContent: "center",
        alignItems: "center",
        width: size, height: size , 
         borderRadius: 8, padding: 2
      }}
      className={`${backgroundColor}  ${className}`} // Circle container
    >
      <Icon name={iconName} size={size / 1.8} color={ iconColor  } />
    </Pressable>
  );
};

export default FFIconWithBg;
