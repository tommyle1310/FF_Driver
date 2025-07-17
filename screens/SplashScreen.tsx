import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated, Easing, Text, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing } from '@/src/theme'; // Ensure this is updated for customer app theme
import FFAvatar from '@/src/components/FFAvatar';
import { IMAGE_LINKS } from '@/src/assets/imageLinks';

interface SplashScreenProps {
  onFinish: () => void;
}

const FFSplashScreen: React.FC<SplashScreenProps> = ({ onFinish }) => {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;
  const moveUpAnim = useRef(new Animated.Value(20)).current;

  // For the loading dots
  const dot1Opacity = useRef(new Animated.Value(0.3)).current;
  const dot2Opacity = useRef(new Animated.Value(0.3)).current;
  const dot3Opacity = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    // Main logo animation
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
        easing: Easing.out(Easing.cubic),
      }),
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
        easing: Easing.out(Easing.back(1.5)),
      }),
      Animated.timing(moveUpAnim, {
        toValue: 0,
        duration: 800,
        useNativeDriver: true,
        easing: Easing.out(Easing.cubic),
      }),
    ]).start();

    // Animated dots
    const animateDots = () => {
      Animated.sequence([
        Animated.timing(dot1Opacity, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(dot2Opacity, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(dot3Opacity, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.parallel([
          Animated.timing(dot1Opacity, {
            toValue: 0.3,
            duration: 300,
            useNativeDriver: true,
          }),
          Animated.timing(dot2Opacity, {
            toValue: 0.3,
            duration: 300,
            useNativeDriver: true,
          }),
          Animated.timing(dot3Opacity, {
            toValue: 0.3,
            duration: 300,
            useNativeDriver: true,
          }),
        ]),
      ]).start(animateDots);
    };

    animateDots();

    // Finish splash screen after 2.5 seconds
    const timer = setTimeout(() => {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 500,
          useNativeDriver: true,
          easing: Easing.in(Easing.cubic),
        }),
        Animated.timing(scaleAnim, {
          toValue: 1.2,
          duration: 500,
          useNativeDriver: true,
        }),
      ]).start(() => {
        onFinish();
      });
    }, 2500);

    return () => clearTimeout(timer);
  }, [onFinish]);

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={[colors.white, colors.primary, colors.primary_dark]} // Adjusted for customer-friendly vibe
        style={styles.background}
        start={[0, 0]}
        end={[1, 1]}
      >
        <Animated.View
          style={[
            styles.logoContainer,
            {
              opacity: fadeAnim,
              transform: [
                { scale: scaleAnim },
                { translateY: moveUpAnim },
              ],
            },
          ]}
        >
          <View style={styles.iconContainer}>
            <FFAvatar avatar={
               IMAGE_LINKS?.APP_LOGO
            } />
          </View>
          <Text style={styles.appName}>Flashfood Delivery</Text>
          <Text style={styles.tagline}>
            Your trusted partner in delivering top-notch food
          </Text>
          
          <View style={styles.loadingContainer}>
            <Animated.View style={[styles.dot, { opacity: dot1Opacity }]} />
            <Animated.View style={[styles.dot, { opacity: dot2Opacity }]} />
            <Animated.View style={[styles.dot, { opacity: dot3Opacity }]} />
          </View>
        </Animated.View>
      </LinearGradient>
    </View>
  );
};

const { width, height } = Dimensions.get('window');

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  background: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconContainer: {
    padding: spacing.xs,
    borderRadius: 60,
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 10,
    marginBottom: 20,
  },
  appName: {
    fontSize: 32,
    fontWeight: 'bold',
    color: colors.white,
    marginBottom: 8,
  },
  tagline: {
    fontSize: 16,
    color: '#eee',
    marginBottom: 40,
  },
  loadingContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 20,
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.white, // Changed to accent color for consistency
    marginHorizontal: 5,
  },
});

export default FFSplashScreen;