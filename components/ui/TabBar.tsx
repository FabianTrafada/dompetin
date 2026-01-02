import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { analyzeReceipt } from '@/services/ocr';
import { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { PlatformPressable } from '@react-navigation/elements';
import { useLinkBuilder } from '@react-navigation/native';
import { BlurView } from 'expo-blur';
import * as ImagePicker from 'expo-image-picker';
import { useState } from 'react';
import { ActivityIndicator, Alert, Modal, Pressable, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { IconSymbol } from './icon-symbol';

export function TabBar({ state, descriptors, navigation }: BottomTabBarProps) {
  const { buildHref } = useLinkBuilder();
  const colorScheme = useColorScheme();
  const theme = Colors[colorScheme ?? 'light'];
  const [isMenuVisible, setIsMenuVisible] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const focusedRoute = state.routes[state.index];
  const focusedDescriptor = descriptors[focusedRoute.key];
  const focusedOptions = focusedDescriptor.options;

  const handleUpload = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.5,
        base64: true,
      });

      if (!result.canceled) {
        setIsAnalyzing(true);
        const base64 = result.assets[0].base64;
        const uri = result.assets[0].uri;
        
        if (base64) {
          const data = await analyzeReceipt(base64);
          setIsAnalyzing(false);
          setIsMenuVisible(false);
          
          navigation.navigate('add', {
            mode: 'manual',
            initialImage: uri,
            initialAmount: data.amount?.toString(),
            initialMerchant: data.merchant,
            initialDate: data.date,
            initialCategory: data.category
          });
        }
      }
    } catch (e) {
      setIsAnalyzing(false);
      Alert.alert('Error', 'Failed to analyze receipt');
      console.error(e);
    }
  };

  if (focusedOptions.tabBarStyle && (focusedOptions.tabBarStyle as any).display === 'none') {
    return null;
  }

  return (
    <View style={styles.container}>
      <Modal
        transparent={true}
        visible={isMenuVisible}
        animationType="fade"
        onRequestClose={() => setIsMenuVisible(false)}
      >
        <Pressable style={styles.overlay} onPress={() => !isAnalyzing && setIsMenuVisible(false)}>
          <View style={[styles.menuContainer, { backgroundColor: theme.background }]}>
            {isAnalyzing ? (
              <View style={{ padding: 20, alignItems: 'center', gap: 12 }}>
                <ActivityIndicator size="large" color={theme.text} />
                <Text style={{ color: theme.text, fontWeight: '600' }}>Analyzing Receipt...</Text>
              </View>
            ) : (
              <>
                <TouchableOpacity 
                  style={styles.menuItem} 
                  onPress={() => { setIsMenuVisible(false); navigation.navigate('add', { mode: 'manual' }); }}
                >
                  <IconSymbol name="square.and.pencil" size={18} color={theme.text} />
                  <Text style={[styles.menuLabel, { color: theme.text }]}>Manual</Text>
                </TouchableOpacity>
                
                <View style={[styles.menuItem, { opacity: 0.5 }]}>
                  <IconSymbol name="arrow.up.doc" size={18} color={theme.text} />
                  <View>
                    <Text style={[styles.menuLabel, { color: theme.text, textDecorationLine: 'line-through' }]}>Upload</Text>
                    <Text style={{ fontSize: 10, color: theme.icon }}>In future development</Text>
                  </View>
                </View>

                <View style={[styles.menuItem, { opacity: 0.5 }]}>
                  <IconSymbol name="keyboard" size={18} color={theme.text} />
                  <View>
                    <Text style={[styles.menuLabel, { color: theme.text, textDecorationLine: 'line-through' }]}>Text Entry</Text>
                    <Text style={{ fontSize: 10, color: theme.icon }}>In future development</Text>
                  </View>
                </View>

                <View style={[styles.menuItem, { opacity: 0.5 }]}>
                  <IconSymbol name="person.2" size={18} color={theme.text} />
                  <View>
                    <Text style={[styles.menuLabel, { color: theme.text, textDecorationLine: 'line-through' }]}>Split Bill</Text>
                    <Text style={{ fontSize: 10, color: theme.icon }}>In future development</Text>
                  </View>
                </View>
              </>
            )}
          </View>
        </Pressable>
      </Modal>

      <View style={styles.shadowWrapper}>
        <BlurView 
          intensity={80}
          tint={colorScheme === 'dark' ? 'dark' : 'light'}
          style={[
            styles.tabBar, 
            { 
              borderColor: colorScheme === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)',
              borderWidth: 1,
              backgroundColor: colorScheme === 'dark' ? 'rgba(0,0,0,0.5)' : 'rgba(255,255,255,0.5)',
            }
          ]}
        >
          {state.routes.map((route, index) => {
          const { options } = descriptors[route.key];
          const isFocused = state.index === index;

          const onPress = () => {
            const event = navigation.emit({
              type: 'tabPress',
              target: route.key,
              canPreventDefault: true,
            });

            if (route.name === 'add') {
              setIsMenuVisible(true);
              return;
            }

            if (!isFocused && !event.defaultPrevented) {
              navigation.navigate(route.name, route.params);
            }
          };

          const onLongPress = () => {
            navigation.emit({
              type: 'tabLongPress',
              target: route.key,
            });
          };

          let iconName = 'house';
          if (route.name === 'index') iconName = 'house';
          else if (route.name === 'stats') iconName = 'chart.bar';
          else if (route.name === 'add') iconName = 'plus';
          else if (route.name === 'budget') iconName = 'dollarsign';
          else if (route.name === 'settings') iconName = 'gearshape';

          const isAddButton = route.name === 'add';

          return (
            <PlatformPressable
              key={route.key}
              href={buildHref(route.name, route.params)}
              accessibilityState={isFocused ? { selected: true } : {}}
              accessibilityLabel={options.tabBarAccessibilityLabel}
              testID={(options as any).tabBarTestID}
              onPress={onPress}
              onLongPress={onLongPress}
              style={styles.tabItem}
            >
              {isAddButton ? (
                <View style={[styles.addButtonInner, { backgroundColor: theme.text }]}>
                  <IconSymbol
                    name="plus"
                    size={24}
                    color={theme.background}
                  />
                </View>
              ) : (
                <IconSymbol
                  name={iconName as any}
                  size={28}
                  color={isFocused ? theme.text : theme.icon}
                  weight={isFocused ? 'bold' : 'regular'}
                />
              )}
            </PlatformPressable>
          );
        })}
        </BlurView>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 30,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  shadowWrapper: {
    width: '90%',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 8,
    borderRadius: 40,
  },
  tabBar: {
    flexDirection: 'row',
    borderRadius: 40,
    paddingVertical: 10,
    paddingHorizontal: 20,
    overflow: 'hidden',
    width: '100%',
    justifyContent: 'space-between',
    alignItems: 'center',
    height: 70,
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    height: '100%',
  },
  addButtonInner: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.2)',
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  menuContainer: {
    position: 'absolute',
    bottom: 110,
    width: 160,
    borderRadius: 12,
    padding: 4,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
    gap: 8,
  },
  menuLabel: {
    fontSize: 14,
    fontWeight: '500',
  },
});
