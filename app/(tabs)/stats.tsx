import { IconSymbol } from '@/components/ui/icon-symbol';
import { getCategoryEmoji } from '@/constants/categories';
import { Currency } from '@/constants/currencies';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useStats, useSummary } from '@/hooks/use-database';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Dimensions, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const { width } = Dimensions.get('window');

export default function StatsScreen() {
  const colorScheme = useColorScheme();
  const theme = Colors[colorScheme ?? 'light'];
  const [currentDate, setCurrentDate] = useState(new Date());
  const [currency, setCurrency] = useState<Currency | null>(null);
  const [categoryMode, setCategoryMode] = useState<'income' | 'expense'>('expense');

  useFocusEffect(
    useCallback(() => {
      AsyncStorage.getItem('user-currency').then(json => {
        if (json) setCurrency(JSON.parse(json));
      });
    }, [])
  );

  const getMonthRange = (date: Date) => {
    const start = new Date(date.getFullYear(), date.getMonth(), 1);
    const end = new Date(date.getFullYear(), date.getMonth() + 1, 0);
    end.setHours(23, 59, 59, 999);
    return { start: start.toISOString(), end: end.toISOString() };
  };

  const { start, end } = getMonthRange(currentDate);
  
  // Last month range
  const lastMonthDate = new Date(currentDate);
  lastMonthDate.setMonth(lastMonthDate.getMonth() - 1);
  const { start: startLast, end: endLast } = getMonthRange(lastMonthDate);

  const { income, expense, balance, refresh: refreshSummary } = useSummary(start, end);
  const { income: lastIncome, expense: lastExpense, balance: lastBalance, refresh: refreshLastSummary } = useSummary(startLast, endLast);
  
  const { dailyStats, categoryIncome, categoryExpense, refresh: refreshStats } = useStats(start, end);

  useFocusEffect(
    useCallback(() => {
      refreshSummary();
      refreshLastSummary();
      refreshStats();
    }, [refreshSummary, refreshLastSummary, refreshStats])
  );

  const changeMonth = (increment: number) => {
    const newDate = new Date(currentDate);
    newDate.setMonth(newDate.getMonth() + increment);
    setCurrentDate(newDate);
  };

  const formatCurrency = (amount: number) => {
    if (!currency) return amount.toLocaleString();
    return amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  const formatCompactNumber = (number: number) => {
    const formatter = Intl.NumberFormat('en', { notation: 'compact' });
    return formatter.format(number);
  };

  const formatMonth = (date: Date) => {
    return date.toLocaleString('default', { month: 'short' });
  };

  const calculatePercentageChange = (current: number, previous: number) => {
    if (previous === 0) {
      return current === 0 ? 0 : 100;
    }
    return ((current - previous) / Math.abs(previous)) * 100;
  };

  const formatPercentage = (percentage: number) => {
    const sign = percentage >= 0 ? '+' : '';
    return `${sign}${percentage.toFixed(0)}%`;
  };

  // Chart Data Preparation
  const daysInMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate();
  const chartData = Array.from({ length: daysInMonth }, (_, i) => {
    const day = i + 1;
    const date = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    const dateStr = `${year}-${month}-${d}`;
    const stat = dailyStats.find(s => s.day === dateStr);
    return {
      day,
      value: (stat?.income || 0) - (stat?.expense || 0),
    };
  });

  const maxIncome = Math.max(...chartData.map(d => d.value > 0 ? d.value : 0), 100); // Default to 100 if no data
  const maxExpense = Math.max(...chartData.map(d => d.value < 0 ? Math.abs(d.value) : 0), 100);

  const scrollViewRef = useRef<ScrollView>(null);

  useEffect(() => {
    if (scrollViewRef.current) {
      setTimeout(() => {
        const now = new Date();
        const isCurrentMonth = 
          currentDate.getMonth() === now.getMonth() && 
          currentDate.getFullYear() === now.getFullYear();

        if (isCurrentMonth) {
          const day = now.getDate();
          // Scroll to show the current day, with some context (3 days before)
          const x = Math.max(0, (day - 3) * 44);
          scrollViewRef.current?.scrollTo({ x, animated: false });
        } else {
          // For past/future months, start at the beginning
          scrollViewRef.current?.scrollTo({ x: 0, animated: false });
        }
      }, 100);
    }
  }, [currentDate, dailyStats]);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={[styles.headerTitle, { color: theme.text }]}>Insights</Text>

        {/* Month Selector */}
        <View style={styles.monthSelector}>
          <TouchableOpacity onPress={() => changeMonth(-1)} style={[styles.arrowButton, { backgroundColor: theme.icon + '20' }]}>
            <IconSymbol name="chevron.left" size={20} color={theme.text} />
          </TouchableOpacity>
          <Text style={[styles.monthText, { color: theme.text }]}>{formatMonth(currentDate)}</Text>
          <TouchableOpacity onPress={() => changeMonth(1)} style={[styles.arrowButton, { backgroundColor: theme.icon + '20' }]}>
            <IconSymbol name="chevron.right" size={20} color={theme.text} />
          </TouchableOpacity>
          
          <View style={{ flex: 1 }} />
          <TouchableOpacity style={styles.periodButton}>
            <Text style={[styles.periodText, { color: theme.text }]}>Month</Text>
            <IconSymbol name="chevron.down" size={12} color={theme.text} />
          </TouchableOpacity>
        </View>

        {/* Summary Cards */}
        <View style={styles.cardsContainer}>
          <View style={[styles.card, { borderColor: theme.icon + '20' }]}>
            <View style={[styles.cardIcon, { backgroundColor: theme.icon + '20' }]}>
              <IconSymbol name="chart.line.uptrend.xyaxis" size={20} color={theme.text} />
            </View>
            <Text style={[styles.cardLabel, { color: theme.icon }]}>Total cashflow</Text>
            <Text style={[styles.cardAmount, { color: '#10b981' }]}>
              {currency?.code} {formatCurrency(income + expense)}
            </Text>
            <Text style={[styles.cardChange, { color: '#10b981' }]}>
              {formatPercentage(calculatePercentageChange(income + expense, lastIncome + lastExpense))} vs last month
            </Text>
          </View>

          <View style={[styles.card, { borderColor: theme.icon + '20' }]}>
            <View style={[styles.cardIcon, { backgroundColor: theme.icon + '20' }]}>
              <Text style={{ fontSize: 20, color: theme.text }}>$</Text>
            </View>
            <Text style={[styles.cardLabel, { color: theme.icon }]}>Net balance</Text>
            <Text style={[styles.cardAmount, { color: '#10b981' }]}>
              {currency?.code} {formatCurrency(balance)}
            </Text>
            <Text style={[styles.cardChange, { color: '#10b981' }]}>
              {formatPercentage(calculatePercentageChange(balance, lastBalance))} vs last month
            </Text>
          </View>
        </View>

        {/* Income/Expense Summary */}
        <View style={styles.summaryRow}>
          <View>
            <Text style={[styles.summaryLabel, { color: theme.icon }]}>{formatMonth(currentDate)} incomes</Text>
            <Text style={[styles.summaryValue, { color: theme.text }]}>
              {currency?.code} {formatCurrency(income)}
            </Text>
          </View>
          <View style={{ alignItems: 'flex-end' }}>
            <Text style={[styles.summaryLabel, { color: theme.icon }]}>{formatMonth(currentDate)} expenses</Text>
            <Text style={[styles.summaryValue, { color: theme.text }]}>
              {currency?.code} {formatCurrency(expense)}
            </Text>
          </View>
        </View>

        {/* Daily Cash Flow Chart */}
        <View style={[styles.chartCard, { borderColor: theme.icon + '20' }]}>
          <Text style={[styles.chartTitle, { color: theme.text }]}>Daily Cash Flow</Text>
          <View style={styles.chartRow}>
            {/* Y-Axis Labels */}
            <View style={styles.yAxis}>
              <Text style={[styles.yAxisLabel, { color: theme.icon }]}>{formatCompactNumber(maxIncome)}</Text>
              <View style={{ flex: 1 }} />
              <Text style={[styles.yAxisLabel, { color: theme.icon }]}>0</Text>
              <View style={{ flex: 1 }} />
              <Text style={[styles.yAxisLabel, { color: theme.icon }]}>{formatCompactNumber(maxExpense)}</Text>
              <View style={{ height: 24 }} /> 
            </View>

            {/* Chart Content */}
            <View style={{ flex: 1 }}>
              {/* Grid Lines */}
              <View style={[styles.gridLine, { top: 0, borderTopColor: theme.icon + '20' }]} />
              <View style={[styles.gridLine, { top: '50%', marginTop: -12, borderTopColor: theme.icon + '20', borderStyle: 'solid' }]} />
              <View style={[styles.gridLine, { bottom: 24, borderTopColor: theme.icon + '20' }]} />

              <ScrollView 
                ref={scrollViewRef}
                horizontal 
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.chartScrollContent}
              >
                {chartData.map((data, index) => {
                  const maxBarHeight = 80;
                  const isPositive = data.value >= 0;
                  const height = isPositive 
                    ? (data.value / maxIncome) * maxBarHeight 
                    : (Math.abs(data.value) / maxExpense) * maxBarHeight;
                  
                  return (
                    <View key={index} style={styles.barWrapper}>
                      <View style={styles.barContainer}>
                        <View style={styles.barHalfTop}>
                          {isPositive && data.value !== 0 && (
                            <View style={[
                              styles.bar, 
                              { 
                                height: Math.max(height, 2), 
                                backgroundColor: '#10b981',
                                borderBottomLeftRadius: 0,
                                borderBottomRightRadius: 0,
                              }
                            ]} />
                          )}
                        </View>
                        <View style={styles.barHalfBottom}>
                          {!isPositive && data.value !== 0 && (
                            <View style={[
                              styles.bar, 
                              { 
                                height: Math.max(height, 2), 
                                backgroundColor: '#ef4444',
                                borderTopLeftRadius: 0,
                                borderTopRightRadius: 0,
                              }
                            ]} />
                          )}
                        </View>
                      </View>
                      <View style={styles.rulerContainer}>
                        <View style={[styles.rulerTick, { backgroundColor: theme.icon + '50' }]} />
                        <Text style={[styles.barLabel, { color: theme.icon }]}>{data.day}</Text>
                      </View>
                    </View>
                  );
                })}
              </ScrollView>
            </View>
          </View>
        </View>

        {/* Spending by Category */}
        <Text style={[styles.sectionTitle, { color: theme.text }]}>Spending by category</Text>
        <View style={[styles.segmentControl, { backgroundColor: theme.icon + '20' }]}>
          <TouchableOpacity 
            style={[styles.segmentButton, categoryMode === 'income' && styles.segmentActive]}
            onPress={() => setCategoryMode('income')}
          >
            <Text style={[styles.segmentText, categoryMode === 'income' && { color: '#000' }]}>Income</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.segmentButton, categoryMode === 'expense' && styles.segmentActive]}
            onPress={() => setCategoryMode('expense')}
          >
            <Text style={[styles.segmentText, categoryMode === 'expense' && { color: '#000' }]}>Expense</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.categoryList}>
          {(categoryMode === 'income' ? categoryIncome : categoryExpense).length === 0 ? (
            <Text style={[styles.emptyText, { color: theme.icon }]}>No data available</Text>
          ) : (
            (categoryMode === 'income' ? categoryIncome : categoryExpense).map((item, index) => (
              <View key={index} style={[styles.categoryItem, { borderBottomColor: theme.icon + '20' }]}>
                <View style={styles.categoryIcon}>
                  <Text style={{ fontSize: 20 }}>{getCategoryEmoji(item.category)}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 }}>
                    <Text style={[styles.categoryName, { color: theme.text }]}>{item.category}</Text>
                    <Text style={[styles.categoryAmount, { color: theme.text }]}>
                      {currency?.code || 'IDR'} {formatCurrency(item.total)}
                    </Text>
                  </View>
                  <View style={[styles.progressBarBg, { backgroundColor: theme.icon + '20' }]}>
                    <View 
                      style={[
                        styles.progressBarFill, 
                        { 
                          width: `${(item.total / (categoryMode === 'income' ? income : expense)) * 100}%`,
                          backgroundColor: categoryMode === 'income' ? '#10b981' : '#ef4444'
                        }
                      ]} 
                    />
                  </View>
                </View>
              </View>
            ))
          )}
        </View>

        <Text style={[styles.sectionTitle, { color: theme.text, marginTop: 32 }]}>Category breakdown</Text>
        <View style={{ alignItems: 'center', padding: 32 }}>
           <Text style={[styles.emptyText, { color: theme.icon }]}>No data available</Text>
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
    padding: 16,
    paddingBottom: 100,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 24,
  },
  monthSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
  },
  arrowButton: {
    padding: 8,
    borderRadius: 20,
    marginRight: 8,
  },
  monthText: {
    fontSize: 18,
    fontWeight: '600',
    marginRight: 8,
  },
  periodButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  periodText: {
    fontSize: 16,
  },
  cardsContainer: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24,
  },
  card: {
    flex: 1,
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
  },
  cardIcon: {
    width: 32,
    height: 32,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  cardLabel: {
    fontSize: 12,
    marginBottom: 4,
  },
  cardAmount: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  cardChange: {
    fontSize: 10,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  summaryLabel: {
    fontSize: 14,
    marginBottom: 4,
  },
  summaryValue: {
    fontSize: 16,
    fontWeight: '600',
  },
  chartCard: {
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 32,
    height: 300,
  },
  chartTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 24,
  },
  chartRow: {
    flexDirection: 'row',
    height: 200, // Fixed height for the chart area
  },
  yAxis: {
    width: 40,
    justifyContent: 'space-between',
    paddingRight: 8,
    paddingBottom: 24, // Align with ruler height
  },
  yAxisLabel: {
    fontSize: 10,
    textAlign: 'right',
  },
  gridLine: {
    position: 'absolute',
    left: 0,
    right: 0,
    borderTopWidth: 1,
    borderStyle: 'dashed',
    zIndex: 0,
  },
  chartScrollContent: {
    flexGrow: 1,
    flexDirection: 'row',
    paddingRight: 16,
  },
  barWrapper: {
    width: 44,
    alignItems: 'center',
    zIndex: 1,
  },
  barContainer: {
    flex: 1,
    width: '100%',
    alignItems: 'center',
  },
  barHalfTop: {
    flex: 1,
    width: '100%',
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  barHalfBottom: {
    flex: 1,
    width: '100%',
    justifyContent: 'flex-start',
    alignItems: 'center',
  },
  bar: {
    width: 8,
    borderRadius: 4,
    minHeight: 2,
  },
  rulerContainer: {
    height: 24,
    alignItems: 'center',
    justifyContent: 'flex-start',
    width: '100%',
    borderTopWidth: 1,
    borderTopColor: 'rgba(150, 150, 150, 0.1)',
  },
  rulerTick: {
    width: 1,
    height: 4,
    marginBottom: 2,
  },
  barLabel: {
    fontSize: 10,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
  },
  segmentControl: {
    flexDirection: 'row',
    padding: 4,
    borderRadius: 8,
    marginBottom: 24,
  },
  segmentButton: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: 6,
  },
  segmentActive: {
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  segmentText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#8e8e93',
  },
  categoryList: {
    gap: 16,
  },
  categoryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingBottom: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  categoryIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f2f2f7',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  categoryName: {
    fontSize: 16,
    fontWeight: '500',
  },
  categoryAmount: {
    fontSize: 16,
    fontWeight: '600',
  },
  progressBarBg: {
    height: 6,
    borderRadius: 3,
    width: '100%',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 3,
  },
  emptyText: {
    textAlign: 'center',
    fontSize: 14,
    marginTop: 20,
  },
});
