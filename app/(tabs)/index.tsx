import { IconSymbol } from '@/components/ui/icon-symbol';
import { getCategoryEmoji } from '@/constants/categories';
import { Currency } from '@/constants/currencies';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useSummary, useTransactions } from '@/hooks/use-database';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';
import { BlurView } from 'expo-blur';
import { useRouter } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Animated, Dimensions, FlatList, Modal, NativeScrollEvent, NativeSyntheticEvent, Pressable, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const { width } = Dimensions.get('window');
const BOARD_WIDTH = width - 32;

export default function HomeScreen() {
  const router = useRouter();
  const scrollViewRef = useRef<ScrollView>(null);
  const scrollX = useRef(new Animated.Value(0)).current;
  const colorScheme = useColorScheme();
  const theme = Colors[colorScheme ?? 'light'];
  const [currentDate, setCurrentDate] = useState(new Date());
  const [currency, setCurrency] = useState<Currency | null>(null);
  const [isAmountVisible, setIsAmountVisible] = useState(true);
  const [mode, setMode] = useState<'expense' | 'income'>('expense');
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchVisible, setIsSearchVisible] = useState(false);
  const [isFilterVisible, setIsFilterVisible] = useState(false);
  const [isMonthPickerVisible, setIsMonthPickerVisible] = useState(false);
  const [filterType, setFilterType] = useState<'all' | 'expense' | 'income'>('all');
  const [filterCategories, setFilterCategories] = useState<string[]>([]);

  useEffect(() => {
    AsyncStorage.getItem('user-currency').then(json => {
      if (json) setCurrency(JSON.parse(json));
    });
  }, []);

  const getWeekRange = () => {
    const now = new Date();
    const start = new Date(now);
    start.setDate(start.getDate() - start.getDay() + (start.getDay() === 0 ? -6 : 1)); // Monday start
    start.setHours(0, 0, 0, 0);
    const end = new Date(start);
    end.setDate(end.getDate() + 6);
    end.setHours(23, 59, 59, 999);
    return { start: start.toISOString(), end: end.toISOString() };
  };

  const getMonthRange = (date: Date) => {
    const start = new Date(date.getFullYear(), date.getMonth(), 1);
    const end = new Date(date.getFullYear(), date.getMonth() + 1, 0);
    end.setHours(23, 59, 59, 999);
    return { start: start.toISOString(), end: end.toISOString() };
  };

  const weekRange = getWeekRange();
  const monthRange = getMonthRange(currentDate);

  const { expense: weeklyExpense, income: weeklyIncome, refresh: refreshWeekly } = useSummary(weekRange.start, weekRange.end);
  const { expense: monthlyExpense, income: monthlyIncome, refresh: refreshMonthly } = useSummary(monthRange.start, monthRange.end);
  const { transactions, refresh: refreshTransactions } = useTransactions(monthRange.start, monthRange.end);

  useFocusEffect(
    useCallback(() => {
      refreshWeekly();
      refreshMonthly();
      refreshTransactions();
    }, [refreshWeekly, refreshMonthly, refreshTransactions])
  );

  const changeMonth = (increment: number) => {
    const newDate = new Date(currentDate);
    newDate.setMonth(newDate.getMonth() + increment);
    setCurrentDate(newDate);
  };

  const handleScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const contentOffsetX = event.nativeEvent.contentOffset.x;
    const currentIndex = Math.round(contentOffsetX / BOARD_WIDTH);
    setMode(currentIndex === 0 ? 'expense' : 'income');
  };

  const scrollTo = (index: number) => {
    scrollViewRef.current?.scrollTo({ x: index * BOARD_WIDTH, animated: true });
  };

  const formatMonth = (date: Date) => {
    return date.toLocaleString('default', { month: 'long' }) + " '" + date.getFullYear().toString().slice(-2);
  };

  const formatCurrency = (amount: number) => {
    if (!currency) return amount.toLocaleString();
    return amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  const filteredTransactions = transactions.filter(transaction => {
    // Type filter
    if (filterType !== 'all' && transaction.type !== filterType) {
      return false;
    }

    // Category filter
    if (filterCategories.length > 0 && !filterCategories.includes(transaction.category)) {
      return false;
    }

    return true;
  });

  const searchResults = transactions.filter(transaction => {
    if (!searchQuery) return false;
    
    const query = searchQuery.toLowerCase();
    return (
      transaction.category.toLowerCase().includes(query) ||
      transaction.description.toLowerCase().includes(query) ||
      transaction.amount.toString().includes(query)
    );
  });

  const allCategories = Array.from(new Set(transactions.map(t => t.category)));

  const toggleCategoryFilter = (category: string) => {
    setFilterCategories(prev => 
      prev.includes(category) 
        ? prev.filter(c => c !== category)
        : [...prev, category]
    );
  };

  const clearFilters = () => {
    setFilterType('all');
    setFilterCategories([]);
  };

  const selectMonth = (monthOffset: number) => {
    const newDate = new Date();
    newDate.setMonth(newDate.getMonth() + monthOffset);
    setCurrentDate(newDate);
    setIsMonthPickerVisible(false);
  };

  const dot1Color = scrollX.interpolate({
    inputRange: [0, BOARD_WIDTH],
    outputRange: ['#ffffff', '#3a3a3c'],
    extrapolate: 'clamp',
  });

  const dot2Color = scrollX.interpolate({
    inputRange: [0, BOARD_WIDTH],
    outputRange: ['#3a3a3c', '#ffffff'],
    extrapolate: 'clamp',
  });

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      {/* Top Bar */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.iconButton} onPress={() => setIsSearchVisible(true)}>
          <IconSymbol name="magnifyingglass" size={24} color={theme.text} />
        </TouchableOpacity>

        <View style={styles.monthSelector}>
          <TouchableOpacity onPress={() => changeMonth(-1)} hitSlop={{top: 10, bottom: 10, left: 10, right: 10}}>
            <IconSymbol name="chevron.left" size={24} color={theme.text} />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => setIsMonthPickerVisible(true)}>
            <Text style={[styles.monthText, { color: theme.text }]}>
              {formatMonth(currentDate)}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => changeMonth(1)} hitSlop={{top: 10, bottom: 10, left: 10, right: 10}}>
            <IconSymbol name="chevron.right" size={24} color={theme.text} />
          </TouchableOpacity>
        </View>

        <TouchableOpacity style={styles.iconButton} onPress={() => setIsFilterVisible(true)}>
          <IconSymbol name="line.3.horizontal.decrease" size={24} color={theme.text} />
        </TouchableOpacity>
      </View>

      <FlatList
        data={filteredTransactions}
        keyExtractor={(item) => item.id?.toString() ?? ''}
        contentContainerStyle={styles.listContent}
        renderItem={({ item }) => (
          <TouchableOpacity 
            style={[styles.transactionItem, { backgroundColor: theme.background, borderBottomColor: theme.icon + '20' }]}
            onPress={() => router.push(`/transaction/${item.id}`)}
          >
            <View style={[styles.iconContainer, { backgroundColor: item.type === 'expense' ? '#ffebee' : '#e8f5e9' }]}>
              <Text style={{ fontSize: 20 }}>{getCategoryEmoji(item.category)}</Text>
            </View>
            <View style={styles.transactionDetails}>
              <Text style={[styles.transactionCategory, { color: theme.text }]}>{item.category}</Text>
              <Text style={[styles.transactionDescription, { color: theme.icon }]} numberOfLines={1}>
                {item.description}
              </Text>
            </View>
            <View style={styles.transactionAmountContainer}>
              <Text style={[
                styles.transactionAmount, 
                { color: item.type === 'expense' ? '#ef4444' : '#10b981' }
              ]}>
                {item.type === 'expense' ? '-' : '+'} {formatCurrency(item.amount)}
              </Text>
              <Text style={[styles.transactionDate, { color: theme.icon }]}>
                {new Date(item.date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })}
              </Text>
            </View>
          </TouchableOpacity>
        )}
        ListHeaderComponent={
          <View style={{ marginBottom: 32, position: 'relative' }}>
            <Animated.ScrollView 
              ref={scrollViewRef}
              horizontal 
              pagingEnabled 
              showsHorizontalScrollIndicator={false}
              onScroll={Animated.event(
                [{ nativeEvent: { contentOffset: { x: scrollX } } }],
                { useNativeDriver: false }
              )}
              scrollEventThrottle={16}
              onMomentumScrollEnd={handleScroll}
              contentContainerStyle={{ width: BOARD_WIDTH * 2 }}
              decelerationRate="fast"
              snapToInterval={BOARD_WIDTH}
            >
              {/* Expense Board */}
              <View style={[styles.bigBoard, { width: BOARD_WIDTH }]}>
                <Text style={styles.boardLabel}>Weekly Spending</Text>
                <View style={styles.amountContainer}>
                  <Text style={styles.currencySymbol}>{currency?.code}</Text>
                  <Text 
                    style={styles.amount} 
                    adjustsFontSizeToFit 
                    numberOfLines={1}
                    minimumFontScale={0.5}
                  >
                    {isAmountVisible ? formatCurrency(weeklyExpense) : '••••••'}
                  </Text>
                  <TouchableOpacity onPress={() => setIsAmountVisible(!isAmountVisible)} style={styles.eyeIcon}>
                    <IconSymbol 
                      name={isAmountVisible ? 'eye.slash' : 'eye'} 
                      size={20} 
                      color="#666" 
                    />
                  </TouchableOpacity>
                </View>
                <Text style={styles.monthlyTotal}>
                  Monthly Total {currency?.code} {isAmountVisible ? formatCurrency(monthlyExpense) : '••••••'}
                </Text>
              </View>

              {/* Income Board */}
              <View style={[styles.bigBoard, { width: BOARD_WIDTH, backgroundColor: '#1c1c1e' }]}>
                <Text style={[styles.boardLabel, { color: '#8e8e93' }]}>Weekly Income</Text>
                <View style={styles.amountContainer}>
                  <Text style={[styles.currencySymbol, { color: '#8e8e93' }]}>{currency?.code}</Text>
                  <Text 
                    style={styles.amount}
                    adjustsFontSizeToFit 
                    numberOfLines={1}
                    minimumFontScale={0.5}
                  >
                    {isAmountVisible ? formatCurrency(weeklyIncome) : '••••••'}
                  </Text>
                  <TouchableOpacity onPress={() => setIsAmountVisible(!isAmountVisible)} style={styles.eyeIcon}>
                    <IconSymbol 
                      name={isAmountVisible ? 'eye.slash' : 'eye'} 
                      size={20} 
                      color="#666" 
                    />
                  </TouchableOpacity>
                </View>
                <Text style={[styles.monthlyTotal, { color: '#8e8e93' }]}>
                  Monthly Total {currency?.code} {isAmountVisible ? formatCurrency(monthlyIncome) : '••••••'}
                </Text>
              </View>
            </Animated.ScrollView>

            <View style={styles.dotsContainer}>
              <Animated.View style={[styles.dot, { backgroundColor: dot1Color }]} />
              <Animated.View style={[styles.dot, { backgroundColor: dot2Color }]} />
            </View>
          </View>
        }
        ListEmptyComponent={
          <Text style={[styles.emptyText, { color: '#8E8E93' }]}>No transactions found</Text>
        }
      />

      {/* Search Modal */}
      <Modal
        visible={isSearchVisible}
        transparent
        animationType="fade"
        onRequestClose={() => {
          setIsSearchVisible(false);
          setSearchQuery('');
        }}
      >
        <BlurView intensity={20} style={StyleSheet.absoluteFill} tint={colorScheme === 'dark' ? 'dark' : 'light'}>
          <Pressable 
            style={StyleSheet.absoluteFill} 
            onPress={() => {
              setIsSearchVisible(false);
              setSearchQuery('');
            }} 
          />
          <SafeAreaView style={{ flex: 1, pointerEvents: 'box-none' }}>
            <View style={[styles.searchHeader, { backgroundColor: theme.background }]} pointerEvents="auto">
              <View style={[styles.searchBar, { backgroundColor: theme.icon + '10' }]}>
                <IconSymbol name="magnifyingglass" size={20} color={theme.icon} />
                <TextInput
                  style={[styles.searchInput, { color: theme.text }]}
                  placeholder="Search transactions..."
                  placeholderTextColor={theme.icon}
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                  autoFocus
                />
                {searchQuery.length > 0 && (
                  <TouchableOpacity onPress={() => setSearchQuery('')}>
                    <IconSymbol name="xmark.circle.fill" size={20} color={theme.icon} />
                  </TouchableOpacity>
                )}
              </View>
              <TouchableOpacity 
                onPress={() => {
                  setIsSearchVisible(false);
                  setSearchQuery('');
                }}
              >
                <Text style={{ color: '#007aff', fontSize: 16, marginLeft: 12 }}>Cancel</Text>
              </TouchableOpacity>
            </View>

            {searchResults.length > 0 ? (
              <View style={{ flexShrink: 1 }} pointerEvents="auto">
                <FlatList
                  data={searchResults}
                  keyExtractor={(item) => item.id?.toString() ?? ''}
                  contentContainerStyle={[styles.listContent, { paddingBottom: 20 }]}
                  keyboardShouldPersistTaps="handled"
                  renderItem={({ item }) => (
                    <TouchableOpacity 
                      style={[styles.transactionItem, { backgroundColor: theme.background, borderBottomColor: theme.icon + '20' }]}
                      onPress={() => {
                        setIsSearchVisible(false);
                        setSearchQuery('');
                        router.push(`/transaction/${item.id}`);
                      }}
                    >
                      <View style={[styles.iconContainer, { backgroundColor: item.type === 'expense' ? '#ffebee' : '#e8f5e9' }]}>
                        <Text style={{ fontSize: 20 }}>{getCategoryEmoji(item.category)}</Text>
                      </View>
                      <View style={styles.transactionDetails}>
                        <Text style={[styles.transactionCategory, { color: theme.text }]}>{item.category}</Text>
                        <Text style={[styles.transactionDescription, { color: theme.icon }]} numberOfLines={1}>
                          {item.description}
                        </Text>
                      </View>
                      <View style={styles.transactionAmountContainer}>
                        <Text style={[
                          styles.transactionAmount, 
                          { color: item.type === 'expense' ? '#ef4444' : '#10b981' }
                        ]}>
                          {item.type === 'expense' ? '-' : '+'} {formatCurrency(item.amount)}
                        </Text>
                        <Text style={[styles.transactionDate, { color: theme.icon }]}>
                          {new Date(item.date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })}
                        </Text>
                      </View>
                    </TouchableOpacity>
                  )}
                />
              </View>
            ) : searchQuery ? (
              <View style={{ padding: 20, alignItems: 'center' }} pointerEvents="none">
                <Text style={{ color: '#8E8E93', fontSize: 16 }}>No results found</Text>
              </View>
            ) : null}
          </SafeAreaView>
        </BlurView>
      </Modal>

      {/* Month Picker Modal */}
      <Modal
        visible={isMonthPickerVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setIsMonthPickerVisible(false)}
      >
        <TouchableOpacity 
          style={styles.modalOverlay} 
          activeOpacity={1}
          onPress={() => setIsMonthPickerVisible(false)}
        >
          <View style={[styles.modalContent, { backgroundColor: theme.background }]} onStartShouldSetResponder={() => true}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: theme.text }]}>Select Month</Text>
              <TouchableOpacity onPress={() => setIsMonthPickerVisible(false)}>
                <IconSymbol name="xmark" size={24} color={theme.text} />
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.modalScroll}>
              {Array.from({ length: 12 }, (_, i) => -5 + i).map(offset => {
                const date = new Date();
                date.setMonth(date.getMonth() + offset);
                const isSelected = 
                  date.getMonth() === currentDate.getMonth() && 
                  date.getFullYear() === currentDate.getFullYear();
                return (
                  <TouchableOpacity
                    key={offset}
                    style={[styles.monthOption, isSelected && styles.monthOptionSelected]}
                    onPress={() => selectMonth(offset)}
                  >
                    <Text style={[styles.monthOptionText, { color: theme.text }, isSelected && styles.monthOptionTextSelected]}>
                      {date.toLocaleString('default', { month: 'long', year: 'numeric' })}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Filter Modal */}
      <Modal
        visible={isFilterVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setIsFilterVisible(false)}
      >
        <BlurView intensity={20} style={StyleSheet.absoluteFill} tint={colorScheme === 'dark' ? 'dark' : 'light'}>
          <TouchableOpacity 
            style={styles.modalOverlay} 
            activeOpacity={1}
            onPress={() => setIsFilterVisible(false)}
          >
            <View style={[styles.modalContent, { backgroundColor: theme.background }]} onStartShouldSetResponder={() => true}>
              <View style={styles.modalHeader}>
                <Text style={[styles.modalTitle, { color: theme.text }]}>Filter Transactions</Text>
                <TouchableOpacity onPress={() => setIsFilterVisible(false)} style={styles.closeButton}>
                  <IconSymbol name="xmark" size={20} color={theme.icon} />
                </TouchableOpacity>
              </View>
              
              <ScrollView style={styles.modalScroll} showsVerticalScrollIndicator={false}>
                {/* Type Filter */}
                <View style={styles.filterSection}>
                  <Text style={[styles.filterLabel, { color: theme.text }]}>Transaction Type</Text>
                  <View style={styles.filterRow}>
                    {(['all', 'expense', 'income'] as const).map(type => (
                      <TouchableOpacity
                        key={type}
                        style={[
                          styles.filterChip, 
                          filterType === type ? styles.filterChipActive : { backgroundColor: theme.icon + '10' }
                        ]}
                        onPress={() => setFilterType(type)}
                      >
                        <Text style={[
                          styles.filterChipText, 
                          filterType === type ? styles.filterChipTextActive : { color: theme.text }
                        ]}>
                          {type === 'all' ? 'All' : type === 'expense' ? 'Expense' : 'Income'}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>

                <View style={[styles.separator, { backgroundColor: theme.icon + '20' }]} />

                {/* Category Filter */}
                <View style={styles.filterSection}>
                  <View style={styles.sectionHeader}>
                    <Text style={[styles.filterLabel, { color: theme.text, marginBottom: 0 }]}>Categories</Text>
                    {filterCategories.length > 0 && (
                      <TouchableOpacity onPress={() => setFilterCategories([])}>
                        <Text style={{ color: '#007aff', fontSize: 14 }}>Clear</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                  <View style={styles.filterRow}>
                    {allCategories.map(category => (
                      <TouchableOpacity
                        key={category}
                        style={[
                          styles.filterChip, 
                          filterCategories.includes(category) ? styles.filterChipActive : { backgroundColor: theme.icon + '10' }
                        ]}
                        onPress={() => toggleCategoryFilter(category)}
                      >
                        <Text style={{ marginRight: 6, fontSize: 16 }}>{getCategoryEmoji(category)}</Text>
                        <Text style={[
                          styles.filterChipText, 
                          filterCategories.includes(category) ? styles.filterChipTextActive : { color: theme.text }
                        ]}>
                          {category}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              </ScrollView>

              <View style={[styles.modalFooter, { borderTopColor: theme.icon + '20' }]}>
                <TouchableOpacity 
                  style={[styles.applyButton, { backgroundColor: theme.text }]} 
                  onPress={() => setIsFilterVisible(false)}
                >
                  <Text style={[styles.applyButtonText, { color: theme.background }]}>Apply Filters</Text>
                </TouchableOpacity>
                {(filterType !== 'all' || filterCategories.length > 0) && (
                  <TouchableOpacity 
                    style={styles.resetButton} 
                    onPress={clearFilters}
                  >
                    <Text style={[styles.resetButtonText, { color: theme.icon }]}>Reset All</Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          </TouchableOpacity>
        </BlurView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  iconButton: {
    padding: 8,
  },
  monthSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  monthText: {
    fontSize: 16,
    fontWeight: '600',
    minWidth: 120,
    textAlign: 'center',
  },
  listContent: {
    padding: 16,
    paddingBottom: 100,
  },
  bigBoard: {
    backgroundColor: '#1c1c1e',
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
  },
  boardLabel: {
    color: '#8e8e93',
    fontSize: 12,
    marginBottom: 8,
  },
  dotsContainer: {
    position: 'absolute',
    bottom: 12,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#3a3a3c',
  },
  activeDot: {
    backgroundColor: '#ffffff',
  },
  amountContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    maxWidth: '100%',
  },
  currencySymbol: {
    color: '#8e8e93',
    fontSize: 20,
    fontWeight: '500',
    marginRight: 8,
  },
  amount: {
    color: '#ffffff',
    fontSize: 36,
    fontWeight: 'bold',
    flexShrink: 1,
  },
  eyeIcon: {
    marginLeft: 6,
  },
  monthlyTotal: {
    color: '#8e8e93',
    fontSize: 14,
  },
  emptyText: {
    textAlign: 'center',
    marginTop: 40,
    fontSize: 16,
  },
  transactionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  transactionDetails: {
    flex: 1,
  },
  transactionCategory: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  transactionDescription: {
    fontSize: 14,
  },
  transactionAmountContainer: {
    alignItems: 'flex-end',
  },
  transactionAmount: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  transactionDate: {
    fontSize: 12,
  },
  searchHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#e5e5ea',
  },
  searchBar: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    padding: 0,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '85%',
    paddingBottom: 30,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: -2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 20,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#e5e5ea',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
  },
  closeButton: {
    padding: 4,
    backgroundColor: 'rgba(142, 142, 147, 0.12)',
    borderRadius: 16,
  },
  modalScroll: {
    paddingHorizontal: 24,
  },
  separator: {
    height: StyleSheet.hairlineWidth,
    marginVertical: 8,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  monthOption: {
    paddingVertical: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#e5e5ea',
  },
  monthOptionSelected: {
    backgroundColor: '#007aff10',
  },
  monthOptionText: {
    fontSize: 16,
  },
  monthOptionTextSelected: {
    color: '#007aff',
    fontWeight: '600',
  },
  filterSection: {
    paddingVertical: 20,
  },
  filterLabel: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  filterRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 100,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  filterChipActive: {
    backgroundColor: '#007aff',
    borderColor: '#007aff',
  },
  filterChipText: {
    fontSize: 14,
    fontWeight: '500',
  },
  filterChipTextActive: {
    color: '#fff',
    fontWeight: '600',
  },
  modalFooter: {
    padding: 24,
    paddingTop: 16,
    borderTopWidth: StyleSheet.hairlineWidth,
    gap: 12,
  },
  applyButton: {
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  applyButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  resetButton: {
    paddingVertical: 12,
    alignItems: 'center',
  },
  resetButtonText: {
    fontSize: 16,
    fontWeight: '500',
  },
});
