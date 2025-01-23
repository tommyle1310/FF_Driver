import React, { useState } from 'react';
import { View, Text, Button, StyleSheet } from 'react-native';
import FFText from './FFText';

interface FFProgressBarProps {
  label: string;
  initialProgress?: number;
  onProgressChange?: (value: number) => void;
  progressFill?: string
}

const FFProgressBar: React.FC<FFProgressBarProps> = ({ label, initialProgress = 0, onProgressChange,    progressFill
 }) => {
  const [progress, setProgress] = useState<number>(initialProgress);

  const handleProgressChange = () => {
    // Increase progress by 10, maxing out at 100
    const newProgress = Math.min(progress + 10, 100);
    setProgress(newProgress);
    if (onProgressChange) {
      onProgressChange(newProgress); // Notify parent about the progress change
    }
  };

  return (
    <View style={styles.container}>
      {/* Label */}
      <FFText>{label}</FFText>

      {/* Outer container for the progress bar */}
      <View style={styles.progressBar}>
        {/* Inner container representing the progress (filled area) */}
        <View
          style={[
            progressFill ? {backgroundColor: progressFill, height: '100%', borderRadius: 4}: styles.progressFill,
            {
              width: `${progress}%`, // Dynamic width based on progress
            },
          ]}
        />
      </View>

      {/* Progress Percentage */}
      <FFText className='text-center m-4 text-xs'>{progress}%</FFText>

      {/* Button to increase progress */}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    padding: 16,
  },
  label: {
    fontSize: 18,
    color: '#333',
    marginBottom: 8,
  },
  progressBar: {
    width: '100%',
    height: 8,
    backgroundColor: '#e0e0e0', // Gray background color for the progress bar track
    borderRadius: 4, // Rounded corners for the bar
    overflow: 'hidden', // Ensures that the filled area doesn’t overflow the rounded corners
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#3498db', // Blue color for the progress fill
    borderRadius: 4, // Rounded corners for the fill
  },
  progressText: {
    textAlign: 'center',
    marginTop: 8,
    fontSize: 16,
    color: '#333',
  },
});

export default FFProgressBar;
