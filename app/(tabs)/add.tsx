import { IconSymbol } from '@/components/ui/icon-symbol';
import { getCategoryEmoji } from '@/constants/categories';
import { Colors } from '@/constants/theme';
import { Category } from '@/database/db';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useCategories, useTransactions } from '@/hooks/use-database';
import { analyzeReceipt } from '@/services/ocr';
import DateTimePicker from '@react-native-community/datetimepicker';
import * as ImagePicker from 'expo-image-picker';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Image,
    KeyboardAvoidingView,
    Modal,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function AddScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const colorScheme = useColorScheme();
  const theme = Colors[colorScheme ?? 'light'];
  
  const [type, setType] = useState<'income' | 'expense'>('expense');
  const [amount, setAmount] = useState(params.initialAmount ? String(params.initialAmount) : '');
  const [date, setDate] = useState(params.initialDate ? new Date(String(params.initialDate)) : new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [merchant, setMerchant] = useState(params.initialMerchant ? String(params.initialMerchant) : '');
  const [description, setDescription] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [image, setImage] = useState<string | null>(params.initialImage ? String(params.initialImage) : null);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [isScanning, setIsScanning] = useState(false);

  const { categories } = useCategories(type);
  const { addTransaction } = useTransactions();

  useEffect(() => {
    if (params.initialCategory && categories.length > 0 && !selectedCategory) {
      const match = categories.find(c => 
        c.name.toLowerCase() === String(params.initialCategory).toLowerCase() ||
        String(params.initialCategory).toLowerCase().includes(c.name.toLowerCase())
      );
      if (match) setSelectedCategory(match);
    }
  }, [params.initialCategory, categories]);

  useEffect(() => {
    // Reset category when type changes if the selected category doesn't match the type
    if (selectedCategory && selectedCategory.type !== type) {
      setSelectedCategory(null);
    }
  }, [type]);

  const handleSave = async () => {
    if (!amount || parseFloat(amount) === 0) {
      Alert.alert('Error', 'Please enter a valid amount');
      return;
    }
    if (!selectedCategory) {
      Alert.alert('Error', 'Please select a category');
      return;
    }

    try {
      await addTransaction({
        type,
        amount: parseFloat(amount),
        category: selectedCategory.name,
        description: merchant && description ? `${merchant} - ${description}` : merchant || description,
        date: date.toISOString(),
        image: image || undefined,
      });
      handleClear();
      router.back();
    } catch (e) {
      console.error(e);
      Alert.alert('Error', 'Failed to save transaction');
    }
  };

  const handleClear = () => {
    setAmount('');
    setMerchant('');
    setDescription('');
    setSelectedCategory(null);
    setImage(null);
    setDate(new Date());
  };

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.5,
      base64: true,
    });

    if (!result.canceled) {
      setImage(result.assets[0].uri);
      handleAnalyze(result.assets[0].base64);
    } else if (params.mode === 'upload') {
      // If cancelled in upload mode, go back
      router.back();
    }
  };

  const handleAnalyze = async (base64: string | null | undefined) => {
    if (!base64) return;
    
    setIsScanning(true);
    try {
      const data = await analyzeReceipt(base64);
      
      if (data.amount) setAmount(data.amount.toString());
      if (data.merchant) setMerchant(data.merchant);
      if (data.date) setDate(new Date(data.date));
      
      if (data.category) {
        // Try to find a matching category
        const match = categories.find(c => 
          c.name.toLowerCase() === data.category?.toLowerCase() ||
          data.category?.toLowerCase().includes(c.name.toLowerCase())
        );
        if (match) setSelectedCategory(match);
      }
    } catch (e) {
      Alert.alert('Scan Failed', 'Could not extract data from receipt. Please enter details manually.');
      console.error(e);
    } finally {
      setIsScanning(false);
    }
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  };

  const formatAmount = (value: string) => {
    if (!value) return '';
    // Remove existing dots to get raw number
    const rawValue = value.replace(/\./g, '');
    // Add dots back
    return rawValue.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  };

  const handleAmountChange = (text: string) => {
    // Remove non-numeric characters except dot (though we handle dot separately)
    // Actually, for this simple case, let's just strip everything that isn't a digit
    const numericValue = text.replace(/[^0-9]/g, '');
    setAmount(numericValue);
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        {isScanning && (
          <View style={[styles.loadingOverlay, { backgroundColor: theme.background + 'CC' }]}>
            <ActivityIndicator size="large" color={theme.text} />
            <Text style={[styles.loadingText, { color: theme.text }]}>Scanning Receipt...</Text>
          </View>
        )}

        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <IconSymbol name="arrow.left" size={24} color={theme.text} />
          </TouchableOpacity>
          
          <View style={styles.segmentContainer}>
            <TouchableOpacity 
              style={[styles.segmentButton, type === 'income' && styles.segmentActive]}
              onPress={() => setType('income')}
            >
              <Text style={[styles.segmentText, type === 'income' && styles.segmentTextActive]}>Income</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.segmentButton, type === 'expense' && styles.segmentActive]}
              onPress={() => setType('expense')}
            >
              <Text style={[styles.segmentText, type === 'expense' && styles.segmentTextActive]}>Expense</Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity onPress={handleClear}>
            <Text style={[styles.clearText, { color: theme.text }]}>Clear All</Text>
          </TouchableOpacity>
        </View>

        <ScrollView contentContainerStyle={styles.content}>
          {/* Amount Section */}
          <View style={styles.amountSection}>
            <View style={styles.currencyRow}>
              <Text style={[styles.currencyLabel, { color: theme.icon }]}>IDR</Text>
              <IconSymbol name="chevron.down" size={16} color={theme.icon} />
              <TextInput
                style={[styles.amountInput, { color: theme.text }]}
                value={formatAmount(amount)}
                onChangeText={handleAmountChange}
                keyboardType="numeric"
                placeholder="0"
                placeholderTextColor={theme.icon}
              />
            </View>
            
            <TouchableOpacity 
              style={[styles.dateButton, { borderColor: theme.icon + '40' }]}
              onPress={() => setShowDatePicker(true)}
            >
              <IconSymbol name="calendar" size={20} color={theme.text} />
              <Text style={[styles.dateText, { color: theme.text }]}>{formatDate(date)}</Text>
            </TouchableOpacity>
          </View>

          {showDatePicker && (
            <DateTimePicker
              value={date}
              mode="date"
              display={Platform.OS === 'ios' ? 'spinner' : 'default'}
              onChange={(event, selectedDate) => {
                setShowDatePicker(false);
                if (selectedDate) setDate(selectedDate);
              }}
            />
          )}

          {/* Form Fields */}
          <View style={styles.form}>
            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: theme.text }]}>Merchant Name</Text>
              <TextInput
                style={[styles.input, { color: theme.text, borderColor: theme.icon + '40', backgroundColor: theme.background }]}
                placeholder="Enter a merchant name"
                placeholderTextColor={theme.icon}
                value={merchant}
                onChangeText={setMerchant}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: theme.text }]}>Description</Text>
              <TextInput
                style={[styles.input, { color: theme.text, borderColor: theme.icon + '40', backgroundColor: theme.background }]}
                placeholder="Enter a description"
                placeholderTextColor={theme.icon}
                value={description}
                onChangeText={setDescription}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: theme.text }]}>Category</Text>
              <TouchableOpacity
                style={[styles.input, styles.selectInput, { borderColor: theme.icon + '40', backgroundColor: theme.background }]}
                onPress={() => setShowCategoryModal(true)}
              >
                <Text style={{ color: selectedCategory ? theme.text : theme.icon }}>
                  {selectedCategory ? `${getCategoryEmoji(selectedCategory.name)} ${selectedCategory.name}` : 'Pick a category'}
                </Text>
                <IconSymbol name="chevron.down" size={20} color={theme.icon} />
              </TouchableOpacity>
            </View>

            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: theme.text }]}>Image</Text>
              <TouchableOpacity
                style={[styles.input, styles.selectInput, { borderColor: theme.icon + '40', backgroundColor: theme.background }]}
                onPress={pickImage}
              >
                <Text style={{ color: image ? theme.text : theme.icon }}>
                  {image ? 'Image selected' : 'Upload an image'}
                </Text>
                <IconSymbol name="arrow.up.doc" size={20} color={theme.text} />
              </TouchableOpacity>
              {image && (
                <Image source={{ uri: image }} style={styles.previewImage} />
              )}
            </View>
          </View>
        </ScrollView>

        {/* Footer */}
        <View style={[styles.footer, { backgroundColor: theme.background, borderTopColor: theme.icon + '20' }]}>
          <TouchableOpacity 
            style={[styles.saveButton, { backgroundColor: theme.text }]} 
            onPress={handleSave}
          >
            <Text style={[styles.saveButtonText, { color: theme.background }]}>Save transaction</Text>
          </TouchableOpacity>
        </View>

        {/* Category Modal */}
        <Modal
          visible={showCategoryModal}
          animationType="slide"
          presentationStyle="pageSheet"
          onRequestClose={() => setShowCategoryModal(false)}
        >
          <View style={[styles.modalContainer, { backgroundColor: theme.background }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: theme.text }]}>Select Category</Text>
              <TouchableOpacity onPress={() => setShowCategoryModal(false)}>
                <Text style={styles.closeButton}>Close</Text>
              </TouchableOpacity>
            </View>
            <ScrollView contentContainerStyle={styles.categoryList}>
              {categories.map((cat) => (
                <TouchableOpacity
                  key={cat.id}
                  style={[styles.categoryItem, { borderBottomColor: theme.icon + '20' }]}
                  onPress={() => {
                    setSelectedCategory(cat);
                    setShowCategoryModal(false);
                  }}
                >
                  <View style={[styles.categoryIcon, { backgroundColor: cat.type === 'expense' ? '#ffebee' : '#e8f5e9' }]}>
                    <Text style={{ fontSize: 20 }}>{getCategoryEmoji(cat.name)}</Text>
                  </View>
                  <Text style={[styles.categoryName, { color: theme.text }]}>{cat.name}</Text>
                  {selectedCategory?.id === cat.id && (
                    <IconSymbol name="checkmark" size={20} color="#007aff" />
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </Modal>
      </KeyboardAvoidingView>
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
  backButton: {
    padding: 8,
  },
  segmentContainer: {
    flexDirection: 'row',
    backgroundColor: '#e5e5ea',
    borderRadius: 8,
    padding: 2,
  },
  segmentButton: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 6,
  },
  segmentActive: {
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 1,
    elevation: 2,
  },
  segmentText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#8e8e93',
  },
  segmentTextActive: {
    color: '#000',
    fontWeight: '600',
  },
  clearText: {
    fontSize: 14,
    fontWeight: '500',
  },
  content: {
    padding: 20,
  },
  amountSection: {
    alignItems: 'center',
    marginBottom: 32,
  },
  currencyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  currencyLabel: {
    fontSize: 16,
    fontWeight: '500',
    marginRight: 4,
  },
  amountInput: {
    fontSize: 48,
    fontWeight: 'bold',
    marginLeft: 8,
    minWidth: 60,
  },
  dateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    gap: 8,
  },
  dateText: {
    fontSize: 14,
    fontWeight: '500',
  },
  form: {
    gap: 20,
  },
  inputGroup: {
    gap: 8,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
  },
  input: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    fontSize: 16,
  },
  selectInput: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  previewImage: {
    width: '100%',
    height: 200,
    borderRadius: 12,
    marginTop: 8,
  },
  footer: {
    padding: 20,
    borderTopWidth: 1,
  },
  saveButton: {
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  saveButtonText: {
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
  categoryList: {
    padding: 20,
  },
  categoryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    gap: 16,
  },
  categoryIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f2f2f7',
    justifyContent: 'center',
    alignItems: 'center',
  },
  categoryName: {
    fontSize: 16,
    flex: 1,
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    fontWeight: '600',
  },
});
