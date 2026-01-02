import { IconSymbol } from '@/components/ui/icon-symbol';
import { getCategoryEmoji } from '@/constants/categories';
import { Currency } from '@/constants/currencies';
import { Colors } from '@/constants/theme';
import { Budget } from '@/database/db';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useBudgetProgress, useBudgets, useCategories } from '@/hooks/use-database';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';
import { useCallback, useState } from 'react';
import {
    Alert,
    Dimensions,
    FlatList,
    Keyboard,
    Modal,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    TouchableWithoutFeedback,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const { width } = Dimensions.get('window');

function BudgetItem({ budget, currency, theme, onPress }: { budget: Budget; currency: Currency | null; theme: any; onPress: () => void }) {
  const spent = useBudgetProgress(budget.category, budget.period);
  const progress = Math.min(spent / budget.amount, 1);
  
  const getDaysLeft = () => {
    const now = new Date();
    if (budget.period === 'daily') return 'Ends today';
    if (budget.period === 'weekly') {
      const day = now.getDay();
      const daysLeft = 7 - (day === 0 ? 7 : day);
      return `${daysLeft} days left`;
    }
    if (budget.period === 'monthly') {
      const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0);
      const daysLeft = lastDay.getDate() - now.getDate();
      return `${daysLeft} days left`;
    }
    return '';
  };

  const formatCurrency = (amount: number) => {
    if (!currency) return amount.toLocaleString();
    // Compact format for large numbers
    if (amount >= 1000000) {
      return (amount / 1000000).toFixed(1) + 'M';
    }
    if (amount >= 1000) {
      return (amount / 1000).toFixed(1) + 'K';
    }
    return amount.toLocaleString();
  };

  return (
    <TouchableOpacity 
      style={[styles.budgetItem, { backgroundColor: theme.card }]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={styles.budgetHeader}>
        <View style={styles.budgetIconContainer}>
          <Text style={{ fontSize: 24 }}>{getCategoryEmoji(budget.category)}</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={[styles.budgetCategory, { color: theme.text }]}>{budget.category}</Text>
          <Text style={[styles.budgetSubtitle, { color: theme.icon }]}>
            {(progress * 100).toFixed(1)}% used · {getDaysLeft()}
          </Text>
        </View>
      </View>
      
      <View style={styles.budgetStats}>
        <Text style={[styles.budgetSpent, { color: theme.text }]}>
          Spent {currency?.code} {formatCurrency(spent)} / {formatCurrency(budget.amount)}
        </Text>
      </View>

      <View style={[styles.progressBarBg, { backgroundColor: theme.icon + '20' }]}>
        <View 
          style={[
            styles.progressBarFill, 
            { 
              width: `${progress * 100}%`,
              backgroundColor: progress >= 1 ? '#ef4444' : '#10b981'
            }
          ]} 
        />
      </View>
    </TouchableOpacity>
  );
}

export default function BudgetScreen() {
  const colorScheme = useColorScheme();
  const theme = Colors[colorScheme ?? 'light'];
  const [currency, setCurrency] = useState<Currency | null>(null);
  const { budgets, refresh, addBudget, updateBudget, deleteBudget } = useBudgets();
  const { categories } = useCategories('expense');
  
  // Wizard State
  const [isWizardOpen, setIsWizardOpen] = useState(false);
  const [wizardStep, setWizardStep] = useState(1);
  const [newBudget, setNewBudget] = useState<Partial<Budget>>({ period: 'monthly' });

  // Edit State
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedBudget, setSelectedBudget] = useState<Budget | null>(null);
  const [editAmount, setEditAmount] = useState('');
  const [editPeriod, setEditPeriod] = useState<'daily' | 'weekly' | 'monthly'>('monthly');

  useFocusEffect(
    useCallback(() => {
      AsyncStorage.getItem('user-currency').then(json => {
        if (json) setCurrency(JSON.parse(json));
      });
      refresh();
    }, [refresh])
  );

  const handleCreateBudget = async () => {
    if (newBudget.category && newBudget.amount && newBudget.period) {
      await addBudget(newBudget as Omit<Budget, 'id'>);
      setIsWizardOpen(false);
      setNewBudget({ period: 'monthly' });
      setWizardStep(1);
    }
  };

  const handleBudgetPress = (budget: Budget) => {
    setSelectedBudget(budget);
    setEditAmount(budget.amount.toString());
    setEditPeriod(budget.period);
    setIsEditModalOpen(true);
  };

  const handleUpdateBudget = async () => {
    if (selectedBudget && editAmount) {
      await updateBudget(selectedBudget.id, {
        amount: Number(editAmount),
        period: editPeriod
      });
      setIsEditModalOpen(false);
      setSelectedBudget(null);
    }
  };

  const handleDeleteBudget = () => {
    Alert.alert(
      "Delete Budget",
      "Are you sure you want to delete this budget?",
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: "Delete", 
          style: "destructive",
          onPress: async () => {
            if (selectedBudget) {
              await deleteBudget(selectedBudget.id);
              setIsEditModalOpen(false);
              setSelectedBudget(null);
            }
          }
        }
      ]
    );
  };

  const renderEditModal = () => (
    <Modal visible={isEditModalOpen} animationType="slide" presentationStyle="pageSheet">
      <SafeAreaView style={[styles.wizardContainer, { backgroundColor: theme.background }]}>
        <View style={styles.wizardHeader}>
          <TouchableOpacity onPress={() => setIsEditModalOpen(false)}>
            <Text style={{ color: theme.text, fontSize: 16 }}>Cancel</Text>
          </TouchableOpacity>
          <Text style={[styles.wizardTitle, { color: theme.text }]}>Edit Budget</Text>
          <TouchableOpacity onPress={handleUpdateBudget}>
            <Text style={{ color: theme.tint, fontSize: 16, fontWeight: '600' }}>Save</Text>
          </TouchableOpacity>
        </View>

        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <View style={styles.wizardContent}>
            <View style={{ alignItems: 'center', marginVertical: 24 }}>
              <View style={[styles.categoryIcon, { backgroundColor: theme.icon + '20', width: 64, height: 64, borderRadius: 32, marginBottom: 16 }]}>
                <Text style={{ fontSize: 32 }}>{selectedBudget ? getCategoryEmoji(selectedBudget.category) : ''}</Text>
              </View>
              <Text style={[styles.stepTitle, { color: theme.text, textAlign: 'center' }]}>
                {selectedBudget?.category}
              </Text>
            </View>

            <Text style={[styles.sectionHeader, { color: theme.text, marginTop: 0 }]}>AMOUNT</Text>
            <View style={[styles.amountInputContainer, { marginTop: 16, marginBottom: 32 }]}>
              <Text style={[styles.currencyPrefix, { color: theme.text }]}>{currency?.code || 'IDR'}</Text>
              <TextInput
                style={[styles.amountInput, { color: theme.text }]}
                keyboardType="numeric"
                returnKeyType="done"
                value={editAmount.replace(/\B(?=(\d{3})+(?!\d))/g, ".")}
                onChangeText={(text) => {
                  const cleanNumber = text.replace(/\./g, '');
                  if (!isNaN(Number(cleanNumber))) {
                    setEditAmount(cleanNumber);
                  }
                }}
              />
            </View>

            <Text style={[styles.sectionHeader, { color: theme.text }]}>PERIOD</Text>
            <View style={{ flexDirection: 'row', gap: 12, marginTop: 16 }}>
              {['daily', 'weekly', 'monthly'].map((period) => (
                <TouchableOpacity
                  key={period}
                  style={[
                    styles.optionButton,
                    { flex: 1, marginBottom: 0 },
                    editPeriod === period && { borderColor: theme.text, borderWidth: 2 }
                  ]}
                  onPress={() => setEditPeriod(period as any)}
                >
                  <Text style={[styles.optionText, { color: theme.text, textTransform: 'capitalize', textAlign: 'center' }]}>{period}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <View style={{ flex: 1 }} />
            
            <TouchableOpacity 
              style={[styles.continueButton, { backgroundColor: '#ef4444', marginTop: 24 }]}
              onPress={handleDeleteBudget}
            >
              <Text style={styles.continueButtonText}>Delete Budget</Text>
            </TouchableOpacity>
          </View>
        </TouchableWithoutFeedback>
      </SafeAreaView>
    </Modal>
  );

  const renderWizard = () => (
    <Modal visible={isWizardOpen} animationType="slide" presentationStyle="pageSheet">
      <SafeAreaView style={[styles.wizardContainer, { backgroundColor: theme.background }]}>
        <View style={styles.wizardHeader}>
          <TouchableOpacity onPress={() => {
            if (wizardStep > 1) setWizardStep(wizardStep - 1);
            else setIsWizardOpen(false);
          }}>
            <IconSymbol name="arrow.left" size={24} color={theme.text} />
          </TouchableOpacity>
          <Text style={[styles.wizardTitle, { color: theme.text }]}>
            {wizardStep === 1 ? 'Choose a category' : 
             wizardStep === 2 ? 'Set reset frequency' : 'Set amount'}
          </Text>
          <View style={{ width: 24 }} />
        </View>

        <View style={styles.progressDots}>
          {[1, 2, 3].map(step => (
            <View 
              key={step} 
              style={[
                styles.dot, 
                { backgroundColor: step === wizardStep ? theme.text : theme.icon + '40' },
                step === wizardStep && { width: 24 }
              ]} 
            />
          ))}
        </View>

        <View style={styles.wizardContent}>
          {wizardStep === 1 && (
            <>
              <Text style={[styles.stepTitle, { color: theme.text }]}>What do you want to budget for?</Text>
              <Text style={[styles.stepSubtitle, { color: theme.icon }]}>Pick a spending category to track.</Text>
              <FlatList
                data={categories}
                keyExtractor={item => item.id?.toString() || item.name}
                renderItem={({ item }) => (
                  <TouchableOpacity 
                    style={[
                      styles.categoryOption, 
                      newBudget.category === item.name && { backgroundColor: theme.icon + '10' }
                    ]}
                    onPress={() => setNewBudget({ ...newBudget, category: item.name })}
                  >
                    <View style={[styles.categoryIcon, { backgroundColor: item.color + '20' }]}>
                      <Text style={{ fontSize: 20 }}>{getCategoryEmoji(item.name)}</Text>
                    </View>
                    <Text style={[styles.categoryName, { color: theme.text }]}>{item.name}</Text>
                    {newBudget.category === item.name && (
                      <IconSymbol name="checkmark" size={20} color={theme.text} />
                    )}
                  </TouchableOpacity>
                )}
              />
              <TouchableOpacity 
                style={[styles.continueButton, !newBudget.category && styles.disabledButton]}
                disabled={!newBudget.category}
                onPress={() => setWizardStep(2)}
              >
                <Text style={styles.continueButtonText}>Continue</Text>
              </TouchableOpacity>
            </>
          )}

          {wizardStep === 2 && (
            <>
              <Text style={[styles.stepTitle, { color: theme.text }]}>How often should this budget reset?</Text>
              <Text style={[styles.stepSubtitle, { color: theme.icon }]}>Choose a timeframe that fits your spending habit.</Text>
              
              {['daily', 'weekly', 'monthly'].map((period) => (
                <TouchableOpacity
                  key={period}
                  style={[
                    styles.optionButton,
                    newBudget.period === period && { borderColor: theme.text, borderWidth: 2 }
                  ]}
                  onPress={() => setNewBudget({ ...newBudget, period: period as any })}
                >
                  <Text style={[styles.optionText, { color: theme.text, textTransform: 'capitalize' }]}>{period}</Text>
                </TouchableOpacity>
              ))}

              <View style={{ flex: 1 }} />
              <TouchableOpacity 
                style={styles.continueButton}
                onPress={() => setWizardStep(3)}
              >
                <Text style={styles.continueButtonText}>Continue</Text>
              </TouchableOpacity>
            </>
          )}

          {wizardStep === 3 && (
            <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
              <View style={{ flex: 1 }}>
                <Text style={[styles.stepTitle, { color: theme.text }]}>How much do you want to spend on {newBudget.category}?</Text>
                <Text style={[styles.stepSubtitle, { color: theme.icon }]}>Enter how much money to allocate.</Text>
                
                <View style={styles.amountInputContainer}>
                  <Text style={[styles.currencyPrefix, { color: theme.text }]}>{currency?.code || 'IDR'}</Text>
                  <TextInput
                    style={[styles.amountInput, { color: theme.text }]}
                    keyboardType="numeric"
                    returnKeyType="done"
                    placeholder="0"
                    placeholderTextColor={theme.icon}
                    value={newBudget.amount ? newBudget.amount.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".") : ''}
                    onChangeText={(text) => {
                      const cleanNumber = text.replace(/\./g, '');
                      if (!isNaN(Number(cleanNumber))) {
                        setNewBudget({ ...newBudget, amount: Number(cleanNumber) });
                      }
                    }}
                    autoFocus
                  />
                </View>

                <View style={{ flex: 1 }} />
                <TouchableOpacity 
                  style={[styles.continueButton, !newBudget.amount && styles.disabledButton]}
                  disabled={!newBudget.amount}
                  onPress={handleCreateBudget}
                >
                  <Text style={styles.continueButtonText}>Create budget</Text>
                </TouchableOpacity>
              </View>
            </TouchableWithoutFeedback>
          )}
        </View>
      </SafeAreaView>
    </Modal>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={styles.header}>
        <Text style={[styles.headerTitle, { color: theme.text }]}>Budget</Text>
        <TouchableOpacity onPress={() => setIsWizardOpen(true)} style={[styles.addButton, { backgroundColor: theme.icon + '20' }]}>
          <IconSymbol name="plus" size={20} color={theme.text} />
        </TouchableOpacity>
      </View>

      <FlatList
        data={budgets}
        keyExtractor={item => item.id?.toString() || ''}
        contentContainerStyle={styles.listContent}
        renderItem={({ item }) => (
          <BudgetItem 
            budget={item} 
            currency={currency} 
            theme={theme} 
            onPress={() => handleBudgetPress(item)}
          />
        )}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={[styles.emptyTitle, { color: theme.text }]}>No budgets set yet</Text>
            <Text style={[styles.emptySubtitle, { color: theme.icon }]}>
              Create a budget to track how much you plan to spend this week or month.
            </Text>
            <TouchableOpacity style={styles.createButton} onPress={() => setIsWizardOpen(true)}>
              <IconSymbol name="plus" size={20} color="#fff" />
              <Text style={styles.createButtonText}>Add your first budget</Text>
            </TouchableOpacity>
          </View>
        }
      />
      {renderWizard()}
      {renderEditModal()}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  sectionHeader: {
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 8,
    opacity: 0.6,
    textTransform: 'uppercase',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  addButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContent: {
    padding: 16,
    flexGrow: 1,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 8,
  },
  emptySubtitle: {
    textAlign: 'center',
    fontSize: 14,
    marginBottom: 24,
    lineHeight: 20,
  },
  createButton: {
    backgroundColor: '#000',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 24,
    gap: 8,
  },
  createButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
  },
  // Wizard Styles
  wizardContainer: {
    flex: 1,
  },
  wizardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  wizardTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  progressDots: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 24,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  wizardContent: {
    flex: 1,
    paddingHorizontal: 24,
  },
  stepTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  stepSubtitle: {
    fontSize: 16,
    marginBottom: 32,
  },
  categoryOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#e5e5ea',
  },
  categoryIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  categoryName: {
    fontSize: 16,
    fontWeight: '500',
    flex: 1,
  },
  continueButton: {
    backgroundColor: '#000',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 16,
  },
  disabledButton: {
    backgroundColor: '#e5e5ea',
  },
  continueButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  optionButton: {
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e5e5ea',
    marginBottom: 12,
  },
  optionText: {
    fontSize: 16,
    fontWeight: '500',
  },
  amountInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 48,
  },
  currencyPrefix: {
    fontSize: 24,
    fontWeight: '600',
    marginRight: 8,
  },
  amountInput: {
    fontSize: 48,
    fontWeight: 'bold',
    minWidth: 100,
  },
  // Budget Item Styles
  budgetItem: {
    padding: 16,
    borderRadius: 16,
    marginBottom: 16,
  },
  budgetHeader: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  budgetIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#f2f2f7',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  budgetCategory: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  budgetSubtitle: {
    fontSize: 12,
  },
  budgetStats: {
    marginBottom: 8,
  },
  budgetSpent: {
    fontSize: 14,
    fontWeight: '500',
  },
  progressBarBg: {
    height: 8,
    borderRadius: 4,
    width: '100%',
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 4,
  },
});
