import { IconSymbol } from '@/components/ui/icon-symbol';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useEffect } from 'react';
import { Dimensions, StyleSheet, Text, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, { runOnJS, useAnimatedStyle, useSharedValue, withRepeat, withSpring, withTiming } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export default function EnjoyScreen() {
  const colorScheme = useColorScheme();
  const theme = Colors[colorScheme ?? 'light'];
  const router = useRouter();
  
  const translateX = useSharedValue(0);
  const arrowTranslateX = useSharedValue(0);

  useEffect(() => {
    arrowTranslateX.value = withRepeat(withTiming(-10, { duration: 800 }), -1, true);
  }, []);

  const navigateNext = () => {
    router.replace('/currency');
  };

  const panGesture = Gesture.Pan()
    .onUpdate((event) => {
      const drag = event.translationX;
      if (drag < 0) {
        translateX.value = drag;
      } else {
        translateX.value = drag * 0.3; // Resistance
      }
    })
    .onEnd((event) => {
      const drag = event.translationX;
      if (drag < -100) {
        translateX.value = withSpring(-SCREEN_WIDTH, { damping: 20, stiffness: 90 });
        runOnJS(navigateNext)();
      } else {
        translateX.value = withSpring(0, { damping: 20, stiffness: 90 });
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
        <Animated.View style={[styles.content, animatedStyle]}>
          <View style={styles.header}>
            <Text style={[styles.title, { color: theme.text }]}>Enjoy Dompetin</Text>
            <Text style={[styles.subtitle, { color: theme.icon }]}>
              Your journey to financial freedom starts here. We&quot;re excited to help you manage your money better.
            </Text>
          </View>

          <View style={styles.centerContent}>
             <IconSymbol name="sparkles" size={80} color={theme.text} />
          </View>

          <View style={styles.footer}>
            <View style={styles.swipeContainer}>
              <Animated.View style={arrowAnimatedStyle}>
                <IconSymbol name="arrow.left" size={16} color={theme.text} />
              </Animated.View>
              <Text style={[styles.swipeText, { color: theme.text }]}>swipe left to continue</Text>
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
  },
  content: {
    flex: 1,
    padding: 24,
    justifyContent: 'space-between',
  },
  header: {
    marginTop: 80,
    alignItems: 'center',
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 16,
  },
  subtitle: {
    fontSize: 18,
    textAlign: 'center',
    lineHeight: 26,
    paddingHorizontal: 20,
  },
  centerContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
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
});
