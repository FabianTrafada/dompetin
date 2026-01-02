import { IconSymbol } from '@/components/ui/icon-symbol';
import { CURRENCIES, Currency } from '@/constants/currencies';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useCallback, useMemo, useRef, useState } from 'react';
import { Dimensions, FlatList, Modal, Platform, Pressable, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import ConfettiCannon from 'react-native-confetti-cannon';
import { Gesture, GestureDetector, GestureHandlerRootView } from 'react-native-gesture-handler';
import Animated, { FadeIn, FadeOut, runOnJS, SlideInDown, SlideOutDown, useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

const CurrencyItem = React.memo(({ item, isSelected, onPress, theme, colorScheme }: { 
  item: Currency, 
  isSelected: boolean, 
  onPress: (c: Currency) => void,
  theme: any,
  colorScheme: any
}) => (
  <TouchableOpacity 
    style={[
      styles.item, 
      { borderBottomColor: colorScheme === 'dark' ? '#38383a' : '#c6c6c8' }
    ]}
    onPress={() => onPress(item)}
  >
    <View style={styles.itemLeft}>
      <Text style={styles.flag}>{item.flag}</Text>
      <View>
        <Text style={[styles.code, { color: theme.text }]}>{item.code}</Text>
        <Text style={[styles.name, { color: theme.icon }]}>{item.name}</Text>
      </View>
    </View>
    {isSelected && (
      <IconSymbol name="checkmark" size={20} color="#007aff" />
    )}
  </TouchableOpacity>
));
CurrencyItem.displayName = 'CurrencyItem';

const CurrencySelectionHeader = ({ theme, onClose }: any) => (
  <View style={styles.modalHeader}>
    <Text style={[styles.modalTitle, { color: theme.text }]}>Select Currency</Text>
    <TouchableOpacity onPress={onClose}>
      <Text style={styles.closeButton}>Close</Text>
    </TouchableOpacity>
  </View>
);

const CurrencySelectionBody = ({ theme, colorScheme, search, setSearch, filteredCurrencies, renderItem }: any) => (
  <View style={{flex: 1}}>
    <View style={[styles.searchContainer, { backgroundColor: colorScheme === 'dark' ? '#1c1c1e' : '#f2f2f7' }]}>
      <IconSymbol name="magnifyingglass" size={20} color={theme.icon} />
      <TextInput
        style={[styles.searchInput, { color: theme.text }]}
        placeholder="Search currency"
        placeholderTextColor={theme.icon}
        value={search}
        onChangeText={setSearch}
      />
    </View>

    <FlatList
      data={filteredCurrencies}
      keyExtractor={(item) => item.code}
      contentContainerStyle={styles.listContent}
      renderItem={renderItem}
      initialNumToRender={15}
      maxToRenderPerBatch={15}
      windowSize={5}
    />
  </View>
);

export default function CurrencyScreen() {
  const colorScheme = useColorScheme();
  const theme = Colors[colorScheme ?? 'light'];
  const router = useRouter();
  const [search, setSearch] = useState('');
  const [selectedCurrency, setSelectedCurrency] = useState<Currency | null>(CURRENCIES[0]);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const confettiRef = useRef<ConfettiCannon>(null);
  const translateY = useSharedValue(0);

  const filteredCurrencies = useMemo(() => CURRENCIES.filter(c => 
    c.name.toLowerCase().includes(search.toLowerCase()) || 
    c.code.toLowerCase().includes(search.toLowerCase())
  ), [search]);

  const handleSelect = useCallback((currency: Currency) => {
    setSelectedCurrency(currency);
    setIsModalVisible(false);
  }, []);

  const renderItem = useCallback(({ item }: { item: Currency }) => (
    <CurrencyItem 
      item={item} 
      isSelected={selectedCurrency?.code === item.code} 
      onPress={handleSelect}
      theme={theme}
      colorScheme={colorScheme}
    />
  ), [selectedCurrency, handleSelect, theme, colorScheme]);

  const closeModal = useCallback(() => {
    setIsModalVisible(false);
    translateY.value = 0;
  }, [translateY]);

  const pan = Gesture.Pan()
    .onChange((e) => {
      if (e.translationY > 0) {
        translateY.value = e.translationY;
      }
    })
    .onEnd((e) => {
      if (e.translationY > 150 || e.velocityY > 500) {
        runOnJS(closeModal)();
      } else {
        translateY.value = withSpring(0);
      }
    });

  const sheetStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }]
  }));

  const handleGetStarted = async () => {
    if (!selectedCurrency) return;

    try {
      await AsyncStorage.setItem('user-currency', JSON.stringify(selectedCurrency));
      await AsyncStorage.setItem('hasLaunched', 'true');
      
      confettiRef.current?.start();
      
      setTimeout(() => {
        router.replace('/(tabs)');
      }, 3000);
    } catch (e) {
      console.error('Failed to save currency', e);
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <StatusBar style={colorScheme === 'dark' ? 'light' : 'dark'} />
      
      <View style={styles.content}>
        <View style={styles.header}>
          <Text style={[styles.title, { color: theme.text }]}>Almost there!</Text>
          <Text style={[styles.subtitle, { color: theme.icon }]}>
            Select your preferred currency to get started.
          </Text>
        </View>

        <View style={styles.form}>
          <Text style={[styles.label, { color: theme.text }]}>Currency</Text>
          <TouchableOpacity 
            style={[styles.selectButton, { backgroundColor: colorScheme === 'dark' ? '#1c1c1e' : '#f2f2f7' }]}
            onPress={() => setIsModalVisible(true)}
          >
            {selectedCurrency ? (
              <View style={styles.selectedCurrency}>
                <Text style={styles.flag}>{selectedCurrency.flag}</Text>
                <Text style={[styles.currencyCode, { color: theme.text }]}>{selectedCurrency.code}</Text>
                <Text style={[styles.currencyName, { color: theme.icon }]}>- {selectedCurrency.name}</Text>
              </View>
            ) : (
              <Text style={[styles.placeholder, { color: theme.icon }]}>Select Currency</Text>
            )}
            <IconSymbol name="chevron.down" size={20} color={theme.icon} />
          </TouchableOpacity>
        </View>

        <View style={styles.footer}>
          <TouchableOpacity 
            style={[
              styles.button, 
              !selectedCurrency && styles.buttonDisabled,
              { backgroundColor: selectedCurrency ? theme.text : theme.icon }
            ]} 
            onPress={handleGetStarted}
            disabled={!selectedCurrency}
          >
            <Text style={[styles.buttonText, { color: theme.background }]}>Get Started</Text>
          </TouchableOpacity>
        </View>
      </View>

      <Modal
        visible={isModalVisible}
        transparent={Platform.OS === 'android'}
        animationType={Platform.OS === 'android' ? 'none' : 'slide'}
        presentationStyle={Platform.OS === 'android' ? 'overFullScreen' : 'pageSheet'}
        onRequestClose={closeModal}
      >
        {Platform.OS === 'android' ? (
          <GestureHandlerRootView style={{flex: 1}}>
            <Pressable style={StyleSheet.absoluteFill} onPress={closeModal}>
              <Animated.View 
                style={[StyleSheet.absoluteFill, {backgroundColor: 'rgba(0,0,0,0.5)'}]} 
                entering={FadeIn} 
                exiting={FadeOut} 
              />
            </Pressable>
            <Animated.View 
              style={[styles.androidSheet, {backgroundColor: theme.background}, sheetStyle]}
              entering={SlideInDown}
              exiting={SlideOutDown}
            >
              <GestureDetector gesture={pan}>
                <View>
                  <View style={styles.dragHandleContainer}>
                    <View style={styles.dragHandle} />
                  </View>
                  <CurrencySelectionHeader theme={theme} onClose={closeModal} />
                </View>
              </GestureDetector>
              <CurrencySelectionBody 
                theme={theme}
                colorScheme={colorScheme}
                search={search}
                setSearch={setSearch}
                filteredCurrencies={filteredCurrencies}
                renderItem={renderItem}
              />
            </Animated.View>
          </GestureHandlerRootView>
        ) : (
          <View style={[styles.modalContainer, { backgroundColor: theme.background }]}>
            <CurrencySelectionHeader theme={theme} onClose={closeModal} />
            <CurrencySelectionBody 
              theme={theme}
              colorScheme={colorScheme}
              search={search}
              setSearch={setSearch}
              filteredCurrencies={filteredCurrencies}
              renderItem={renderItem}
            />
          </View>
        )}
      </Modal>

      <ConfettiCannon
        count={200}
        origin={{x: Dimensions.get('window').width / 2, y: -20}}
        autoStart={false}
        ref={confettiRef}
        fadeOut={true}
      />
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
  },
  header: {
    marginTop: 40,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  subtitle: {
    fontSize: 18,
    lineHeight: 26,
  },
  form: {
    marginTop: 40,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  selectButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderRadius: 12,
  },
  selectedCurrency: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  placeholder: {
    fontSize: 16,
  },
  currencyCode: {
    fontSize: 16,
    fontWeight: '600',
  },
  currencyName: {
    fontSize: 16,
  },
  footer: {
    marginBottom: 20,
    marginTop: 'auto',
  },
  button: {
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  modalContainer: {
    flex: 1,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  closeButton: {
    fontSize: 17,
    color: '#007aff',
    fontWeight: '600',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    margin: 20,
    marginTop: 0,
    padding: 12,
    borderRadius: 10,
    gap: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 17,
  },
  listContent: {
    paddingHorizontal: 20,
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  itemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  flag: {
    fontSize: 32,
  },
  code: {
    fontSize: 17,
    fontWeight: '600',
  },
  name: {
    fontSize: 14,
    marginTop: 2,
  },
  androidSheet: {
    height: '90%',
    marginTop: 'auto',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    overflow: 'hidden',
  },
  dragHandleContainer: {
    alignItems: 'center',
    paddingVertical: 10,
  },
  dragHandle: {
    width: 40,
    height: 5,
    backgroundColor: 'rgba(128,128,128,0.4)',
    borderRadius: 2.5,
  },
});
