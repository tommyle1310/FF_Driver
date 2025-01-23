import React from 'react';
import { View, Modal, ActivityIndicator, StyleSheet } from 'react-native';

interface SpinnerProps {
  isOverlay?: boolean; // Determines whether to show an overlay or not
  overlayColor?: string; // Color of the overlay (default: rgba(0, 0, 0, 0.5))
  isVisible: boolean; // Controls visibility of the spinner
}

const Spinner: React.FC<SpinnerProps> = ({
  isOverlay = true,
  overlayColor = 'rgba(0, 0, 0, 0.5)',
  isVisible,
}) => {
  if (!isVisible) return null;

  return (
    <Modal transparent={true} animationType="fade" visible={isVisible}>
      {isOverlay && (
        <View
          style={[styles.overlay, { backgroundColor: overlayColor }]}
        />
      )}
      <View style={styles.spinnerContainer}>
        <ActivityIndicator size="large" color="#63c550" />
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
  },
  spinnerContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    flex: 1,
  },
});

export default Spinner;
