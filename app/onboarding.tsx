import { IconSymbol } from '@/components/ui/icon-symbol';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useEffect, useState } from 'react';
import { Dimensions, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, { runOnJS, useAnimatedStyle, useSharedValue, withRepeat, withSpring, withTiming } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export default function OnboardingScreen() {
  const colorScheme = useColorScheme();
  const theme = Colors[colorScheme ?? 'light'];
  const router = useRouter();
  const [step, setStep] = useState(0);

  const translateX = useSharedValue(0);
  const arrowTranslateX = useSharedValue(0);

  useEffect(() => {
    arrowTranslateX.value = withRepeat(withTiming(-10, { duration: 800 }), -1, true);
  }, []);

  const navigateHome = () => {
    router.replace('/terms');
  };

  const panGesture = Gesture.Pan()
    .onUpdate((event) => {
      const baseTranslate = -step * SCREEN_WIDTH;
      const drag = event.translationX;
      
      // Limit drag based on step
      if (step === 0 && drag > 0) {
        // Resistance when dragging right on first step
        translateX.value = baseTranslate + drag * 0.3;
      } else if (step === 3 && drag < 0) {
         // Resistance when dragging left on last step
         translateX.value = baseTranslate + drag * 0.3;
      } else {
        translateX.value = baseTranslate + drag;
      }
    })
    .onEnd((event) => {
      const drag = event.translationX;
      
      if (step === 0) {
        if (drag < -100) {
          // Go to step 2
          translateX.value = withSpring(-SCREEN_WIDTH, { damping: 20, stiffness: 90 });
          runOnJS(setStep)(1);
        } else {
          // Stay on step 1
          translateX.value = withSpring(0, { damping: 20, stiffness: 90 });
        }
      } else if (step === 1) {
        if (drag < -100) {
          // Go to step 3
          translateX.value = withSpring(-2 * SCREEN_WIDTH, { damping: 20, stiffness: 90 });
          runOnJS(setStep)(2);
        } else if (drag > 100) {
          // Go back to step 1
          translateX.value = withSpring(0, { damping: 20, stiffness: 90 });
          runOnJS(setStep)(0);
        } else {
          // Stay on step 2
          translateX.value = withSpring(-SCREEN_WIDTH, { damping: 20, stiffness: 90 });
        }
      } else if (step === 2) {
        if (drag < -100) {
          // Go to step 4
          translateX.value = withSpring(-3 * SCREEN_WIDTH, { damping: 20, stiffness: 90 });
          runOnJS(setStep)(3);
        } else if (drag > 100) {
          // Go back to step 2
          translateX.value = withSpring(-SCREEN_WIDTH, { damping: 20, stiffness: 90 });
          runOnJS(setStep)(1);
        } else {
          // Stay on step 3
          translateX.value = withSpring(-2 * SCREEN_WIDTH, { damping: 20, stiffness: 90 });
        }
      } else if (step === 3) {
        if (drag > 100) {
          // Go back to step 3
          translateX.value = withSpring(-2 * SCREEN_WIDTH, { damping: 20, stiffness: 90 });
          runOnJS(setStep)(2);
        } else {
          // Stay on step 4
          translateX.value = withSpring(-3 * SCREEN_WIDTH, { damping: 20, stiffness: 90 });
        }
      }
    });

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ translateX: translateX.value }],
    };
  });

  const arrowAnimatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ translateX: arrowTranslateX.value }],
    };
  });

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <StatusBar style={colorScheme === 'dark' ? 'light' : 'dark'} />
      
      <GestureDetector gesture={panGesture}>
        <Animated.View style={[styles.sliderContainer, animatedStyle]}>
          
          {/* Step 1 */}
          <View style={styles.slide}>
            <View style={styles.header}>
              <View style={styles.titleRow}>
                <Text style={[styles.title, { color: theme.text, marginBottom: 0 }]}>Welcome to </Text>
                <View style={[styles.highlight, { backgroundColor: theme.text }]}>
                  <Text style={[styles.highlightText, { color: theme.background }]}>Dompetin</Text>
                  <View style={styles.sparkleContainer}>
                    <IconSymbol name="sparkles" size={24} color={theme.text} />
                  </View>
                  <View style={styles.sparkleContainerLeft}>
                    <IconSymbol name="sparkles" size={24} color={theme.text} />
                  </View>
                </View>
              </View>
              <Text style={[styles.subtitle, { color: theme.icon }]}>
                A better best friend is what your wallet deserves. Dompetin.
              </Text>
            </View>

            <View style={styles.illustrationContainer}>
              <Image
                source={require('@/assets/images/man-out-money_442409-909.avif')}
                style={styles.image}
                contentFit="contain"
              />
            </View>

            <View style={styles.footer}>
              <View style={styles.swipeContainer}>
                <Animated.View style={arrowAnimatedStyle}>
                  <IconSymbol name="arrow.left" size={16} color={theme.text} />
                </Animated.View>
                <Text style={[styles.swipeText, { color: theme.text }]}>swipe left to continue</Text>
              </View>
            </View>
          </View>

          {/* Step 2 */}
          <View style={styles.slide}>
            <View style={styles.header}>
              <View style={styles.titleRow}>
                <Text style={[styles.title, { color: theme.text, marginBottom: 0 }]}>Track your </Text>
                <View style={[styles.highlight, { 
                  transform: [{ rotate: '4deg' }],
                  backgroundColor: theme.text
                }]}>
                  <Text style={[styles.highlightText, { 
                    color: theme.background,
                    textDecorationLine: 'line-through',
                    textDecorationStyle: 'solid'
                  }]}>expenses</Text>
                </View>
                <Text style={[styles.title, { color: theme.text, marginBottom: 0 }]}> easily</Text>
              </View>
              <Text style={[styles.subtitle, { color: theme.icon }]}>
                Just snap your receipts — our AI reads them and logs everything for you
              </Text>
            </View>

            <View style={styles.illustrationContainer}>
              <Image
                source={require('@/assets/images/time-is-money_442409-920.jpg')}
                style={styles.image}
                contentFit="contain"
              />
            </View>

            <View style={styles.footer}>
              <View style={styles.swipeContainer}>
                <Animated.View style={arrowAnimatedStyle}>
                  <IconSymbol name="arrow.left" size={16} color={theme.text} />
                </Animated.View>
                <Text style={[styles.swipeText, { color: theme.text }]}>swipe left to continue</Text>
              </View>
            </View>
          </View>

          {/* Step 3 */}
          <View style={styles.slide}>
            <View style={styles.header}>
              <Text style={[styles.title, { color: theme.text }]}>Manage your activities smartly</Text>
              <Text style={[styles.subtitle, { color: theme.icon }]}>
                See where your money goes, set goals, and keep your spending under control
              </Text>
            </View>

            <View style={styles.illustrationContainer}>
              <Image
                source={require('@/assets/images/online-transaction-flat-style-design-vector-illustration-stock-illustration_357500-3466.avif')}
                style={styles.image}
                contentFit="contain"
              />
            </View>

            <View style={styles.footer}>
              <View style={styles.swipeContainer}>
                <Animated.View style={arrowAnimatedStyle}>
                  <IconSymbol name="arrow.left" size={16} color={theme.text} />
                </Animated.View>
                <Text style={[styles.swipeText, { color: theme.text }]}>swipe left to continue</Text>
              </View>
            </View>
          </View>

          {/* Step 4 */}
          <View style={styles.slide}>
            <View style={styles.header}>
              <Text style={[styles.title, { color: theme.text }]}>Visualize your progress</Text>
              <Text style={[styles.subtitle, { color: theme.icon }]}>
                Get clear insights and beautiful charts that make your financial journey easy
              </Text>
            </View>

            <View style={styles.illustrationContainer}>
              <Image
                source={require('@/assets/images/digital-business-illustration-guy-with-ratings-income-money_638892-3315.jpg')}
                style={styles.image}
                contentFit="contain"
              />
            </View>

            <View style={[styles.footer, { marginBottom: 14 }]}>
              <TouchableOpacity style={[styles.button, { backgroundColor: theme.text }]} onPress={navigateHome}>
                <Text style={[styles.buttonText, { color: theme.background }]}>Get Started</Text>
              </TouchableOpacity>
            </View>
          </View>

        </Animated.View>
      </GestureDetector>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    overflow: 'hidden',
  },
  sliderContainer: {
    flex: 1,
    flexDirection: 'row',
    width: SCREEN_WIDTH * 4,
  },
  slide: {
    width: SCREEN_WIDTH,
    flex: 1,
    padding: 24,
    justifyContent: 'space-between',
  },
  header: {
    marginTop: 80,
    alignItems: 'center',
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    flexWrap: 'wrap',
    justifyContent: 'center',
  },
  highlight: {
    backgroundColor: '#ffffff',
    transform: [{ rotate: '-5deg' }],
    paddingHorizontal: 6,
    paddingVertical: 2,
    marginLeft: 4,
    borderRadius: 4,
  },
  sparkleContainer: {
    position: 'absolute',
    top: -24,
    left: -16,
    transform: [{ scaleX: -1 }],
  },
  sparkleContainerLeft: {
    position: 'absolute',
    bottom: -24,
    right: -16,
  },
  highlightText: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#000000',
    fontFamily: 'sans-serif',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 16,
    fontFamily: 'sans-serif',
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
    paddingHorizontal: 20,
  },
  illustrationContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  image: {
    width: 300,
    height: 300,
  },
  footer: {
    marginBottom: 30,
    alignItems: 'center',
    width: '100%',
  },
  swipeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  swipeText: {
    fontSize: 14,
    fontWeight: '500',
  },
  button: {
    backgroundColor: '#000000',
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 12,
    width: '100%',
    alignItems: 'center',
  },
  buttonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
