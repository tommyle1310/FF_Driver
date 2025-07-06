import React from 'react';
import { View, Modal, StyleSheet, Text, Dimensions } from 'react-native';
import { borderRadius, colors } from '@/src/theme';
import { Image } from 'expo-image';

interface SpinnerProps {
  isOverlay?: boolean; // Determines whether to show an overlay or not
  overlayColor?: string; // Color of the overlay (default: rgba(0, 0, 0, 0.25))
  isVisible: boolean; // Controls visibility of the spinner
  text?: string; // Optional text to display below the spinner
  size?: 'small' | 'medium' | 'large'; // Size of the spinner
}

const Spinner: React.FC<SpinnerProps> = ({
  isOverlay = true,
  overlayColor = 'rgba(0, 0, 0, 0.25)',
  isVisible,
  text,
  size = 'large',
}) => {
  if (!isVisible) return null;

  // Size mapping
  const sizeMap = {
    small: 80,
    medium: 120,
    large: 160,
  };

  const gifSize = sizeMap[size];
  const { width, height } = Dimensions.get('window');

  return (
    <Modal transparent={true} animationType="fade" visible={isVisible}>
      {isOverlay && (
        <View
          style={[styles.overlay, { backgroundColor: overlayColor }]}
        />
      )}
      <View style={styles.spinnerContainer}>
        <View style={styles.loaderContainer}>
          <View style={styles.gifContainer}>
           <Image
        source={{ uri: 'https://res.cloudinary.com/dlavqnrlx/image/upload/v1751768409/osjdamw7lsu5wtwzpxdj.gif' }}
        style={{
          width: 100,
          height: 100,
          // borderRadius: size / 2,
          // borderWidth: 2,
          borderColor: '#ffffff',
        }}
        contentFit="cover"
        cachePolicy="memory-disk"
      />
          </View>
          
          {text && <Text style={styles.loadingText}>{text}</Text>}
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    backdropFilter: 'blur(3px)',
  },
  spinnerContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    flex: 1,
  },
  loaderContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
    borderRadius: 16,
  },
  gifContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.white,
    backdropFilter: 'blur(100px)',  
    borderRadius: borderRadius.avatar,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    fontWeight: '500',
    color: colors.white,
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
});

export default Spinner;
