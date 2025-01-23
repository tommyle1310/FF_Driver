import { useTheme } from '@/src/hooks/useTheme';
import React, { useState } from 'react';
import { View } from 'react-native';
import Svg, { Circle, Text as SvgText } from 'react-native-svg';
import FFText from './FFText';

interface FFCircularProgressBarProps {
  label: string;
  initialProgress?: number;
  size?: 'small' | 'medium' | 'large'; // Size variant: small, medium, large
  strokeWidth?: number; // The width of the progress stroke
  onProgressChange?: (value: number) => void;
  progressFill?: string;
}

const FFCircularProgressBar: React.FC<FFCircularProgressBarProps> = ({
  label,
  initialProgress = 0,
  size = 'medium', // Default to medium
  strokeWidth = 10,
  onProgressChange,
  progressFill
}) => {
  const { theme } = useTheme();

  // Text colors based on theme
  const textColor: string = theme === 'light' ? '#000' : '#fff';

  const [progress, setProgress] = useState<number>(initialProgress);

  // Sizes for small, medium, and large variants
  const sizes = {
    small: 50, // Small size: 50px
    medium: 100, // Medium size: 100px
    large: 150, // Large size: 150px
  };

  const currentSize = sizes[size]; // Dynamically choose size based on prop

  const radius = (currentSize - strokeWidth) / 2; // Radius of the circle
  const circumference = 2 * Math.PI * radius; // Circumference of the circle
  const strokeDashoffset = circumference - (progress / 100) * circumference; // This controls the fill

  const handleProgressChange = () => {
    const newProgress = Math.min(progress + 10, 100);
    setProgress(newProgress);
    if (onProgressChange) {
      onProgressChange(newProgress); // Notify parent about the progress change
    }
  };

  return (
    <View style={{ alignItems: 'center', justifyContent: 'center' }}>
      {/* Label */}
      <FFText>{label}</FFText>

      {/* SVG Circle for the progress bar */}
      <Svg width={currentSize} height={currentSize} viewBox={`0 0 ${currentSize} ${currentSize}`}>
        {/* Background Circle (Track) */}
        <Circle
          cx={currentSize / 2}
          cy={currentSize / 2}
          r={radius}
          stroke="#e0e0e0"
          strokeWidth={size=== 'small' ? 4 : 8}
          fill="none"
        />
        {/* Foreground Circle (Progress) */}
        <Circle
          cx={currentSize / 2}
          cy={currentSize / 2}
          r={radius}
          stroke={progressFill ? progressFill : '#3498db'} // Progress color
          strokeWidth={size=== 'small' ? 4 : 8}
          fill="none"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          transform={`rotate(-90 ${currentSize / 2} ${currentSize / 2})`} // Rotate by -90 degrees to start from the top
        />

        {/* Centered Text (Progress percentage) */}
        <SvgText
          x="45%"
          y="50%"
          textAnchor="middle"
          alignmentBaseline="middle"
          fontSize={size === 'small' ? '10' : "16"}
          fill={textColor}
        >
          {progress}%
        </SvgText>
      </Svg>
    </View>
  );
};

export default FFCircularProgressBar;
