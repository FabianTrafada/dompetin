import { IconSymbol } from '@/components/ui/icon-symbol';
import { CURRENCIES, Currency } from '@/constants/currencies';
import { Colors } from '@/constants/theme';
import { useTheme } from '@/context/ThemeContext';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useEffect, useState } from 'react';
import { LayoutAnimation, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function SettingsScreen() {
  const { theme: userTheme, setTheme, colorScheme } = useTheme();
  const theme = Colors[colorScheme ?? 'light'];
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isCurrencyDropdownOpen, setIsCurrencyDropdownOpen] = useState(false);
  const [currency, setCurrency] = useState<Currency>(CURRENCIES.find(c => c.code === 'IDR') || CURRENCIES[0]);

  useEffect(() => {
    AsyncStorage.getItem('user-currency').then(json => {
      if (json) setCurrency(JSON.parse(json));
    });
  }, []);

  const options = [
    { label: 'System', value: 'system' },
    { label: 'Light', value: 'light' },
    { label: 'Dark', value: 'dark' },
  ] as const;

  const toggleDropdown = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setIsDropdownOpen(!isDropdownOpen);
  };

  const toggleCurrencyDropdown = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setIsCurrencyDropdownOpen(!isCurrencyDropdownOpen);
  };

  const handleSelect = (value: typeof options[number]['value']) => {
    setTheme(value);
    toggleDropdown();
  };

  const handleCurrencySelect = async (value: Currency) => {
    setCurrency(value);
    await AsyncStorage.setItem('user-currency', JSON.stringify(value));
    toggleCurrencyDropdown();
  };

  const currentLabel = options.find(o => o.value === userTheme)?.label ?? 'System';

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={[styles.header, { color: theme.text }]}>Settings</Text>
        
        <Text style={[styles.sectionHeader, { color: theme.text }]}>PREFERENCES</Text>
        <View style={[styles.section, { borderColor: theme.icon + '20', marginBottom: 24 }]}>
          <TouchableOpacity 
            style={styles.dropdownHeader} 
            onPress={toggleCurrencyDropdown}
            activeOpacity={0.7}
          >
            <Text style={[styles.optionLabel, { color: theme.text }]}>Currency</Text>
            <View style={styles.row}>
              <Text style={[styles.currentValue, { color: theme.icon }]}>{currency.flag} {currency.code}</Text>
              <IconSymbol 
                name={isCurrencyDropdownOpen ? "chevron.down" : "chevron.right"} 
                size={20} 
                color={theme.icon} 
                style={isCurrencyDropdownOpen ? { transform: [{ rotate: '180deg' }] } : undefined}
              />
            </View>
          </TouchableOpacity>

          {isCurrencyDropdownOpen && (
            <View style={styles.dropdownList}>
              {CURRENCIES.map((item) => (
                <TouchableOpacity
                  key={item.code}
                  style={[
                    styles.option,
                    { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: theme.icon + '20' }
                  ]}
                  onPress={() => handleCurrencySelect(item)}
                >
                  <Text style={[styles.optionLabel, { color: theme.text }]}>
                    {item.flag} {item.name} ({item.symbol})
                  </Text>
                  {currency.code === item.code && (
                    <IconSymbol name="checkmark" size={20} color={theme.tint} />
                  )}
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>

        <Text style={[styles.sectionHeader, { color: theme.text }]}>APPEARANCE</Text>
        <View style={[styles.section, { borderColor: theme.icon + '20' }]}>
          <TouchableOpacity 
            style={styles.dropdownHeader} 
            onPress={toggleDropdown}
            activeOpacity={0.7}
          >
            <Text style={[styles.optionLabel, { color: theme.text }]}>Theme</Text>
            <View style={styles.row}>
              <Text style={[styles.currentValue, { color: theme.icon }]}>{currentLabel}</Text>
              <IconSymbol 
                name={isDropdownOpen ? "chevron.down" : "chevron.right"} 
                size={20} 
                color={theme.icon} 
                style={isDropdownOpen ? { transform: [{ rotate: '180deg' }] } : undefined}
              />
            </View>
          </TouchableOpacity>

          {isDropdownOpen && (
            <View style={styles.dropdownList}>
              {options.map((option, index) => (
                <TouchableOpacity
                  key={option.value}
                  style={[
                    styles.option,
                    { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: theme.icon + '20' }
                  ]}
                  onPress={() => handleSelect(option.value)}
                >
                  <Text style={[styles.optionLabel, { color: theme.text }]}>
                    {option.label}
                  </Text>
                  {userTheme === option.value && (
                    <IconSymbol name="checkmark" size={20} color={theme.tint} />
                  )}
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: 20,
  },
  header: {
    fontSize: 34,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  sectionHeader: {
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 8,
    marginLeft: 16,
    opacity: 0.6,
    textTransform: 'uppercase',
  },
  section: {
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
  },
  dropdownHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  currentValue: {
    fontSize: 17,
  },
  dropdownList: {
    paddingLeft: 16,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    paddingRight: 16,
  },
  optionLabel: {
    fontSize: 17,
  },
});
