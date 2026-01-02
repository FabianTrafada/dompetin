import { IconSymbol } from '@/components/ui/icon-symbol';
import { getCategoryEmoji } from '@/constants/categories';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useTransaction } from '@/hooks/use-database';
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { Alert, Image, Modal, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const TransactionDetailScreen = () => {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const colorScheme = useColorScheme();
  const theme = Colors[colorScheme ?? 'light'];
  const { transaction, loading, deleteTransaction, refresh } = useTransaction(Number(id));
  const [showImageModal, setShowImageModal] = useState(false);

  useFocusEffect(
    useCallback(() => {
      refresh();
    }, [refresh])
  );

  const handleDelete = () => {
    Alert.alert(
      'Delete Transaction',
      'Are you sure you want to delete this transaction?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete', 
          style: 'destructive', 
          onPress: async () => {
            await deleteTransaction();
            router.back();
          }
        },
      ]
    );
  };

  const handleEdit = () => {
    router.push(`/transaction/edit/${id}`);
  };

  if (loading || !transaction) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <IconSymbol name="arrow.left" size={24} color={theme.text} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: theme.text }]}>Transaction Detail</Text>
          <View style={{ width: 40 }} />
        </View>
        <View style={styles.loadingContainer}>
          <Text style={{ color: theme.text }}>Loading...</Text>
        </View>
      </SafeAreaView>
    );
  }

  const formatCurrency = (amount: number) => {
    return amount.toLocaleString('id-ID', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <IconSymbol name="arrow.left" size={24} color={theme.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.text }]}>Transaction Detail</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {/* Main Info */}
        <View style={styles.mainInfo}>
          <View style={[styles.iconContainer, { backgroundColor: transaction.type === 'expense' ? '#ffebee' : '#e8f5e9' }]}>
            <Text style={styles.emoji}>{getCategoryEmoji(transaction.category)}</Text>
          </View>
          
          <Text style={[styles.merchantName, { color: theme.text }]}>
            {transaction.description.split(' - ')[0] || transaction.category}
          </Text>
          
          <Text style={[styles.subtitle, { color: theme.icon }]}>
            {transaction.type.charAt(0).toUpperCase() + transaction.type.slice(1)} • {transaction.category}
          </Text>

          <View style={styles.amountContainer}>
            <Text style={[styles.currencyLabel, { color: theme.icon }]}>IDR</Text>
            <Text style={[styles.amount, { color: theme.text }]}>
              {formatCurrency(transaction.amount)}
            </Text>
          </View>
        </View>

        <View style={[styles.divider, { backgroundColor: theme.icon + '20' }]} />

        {/* Details */}
        <View style={styles.detailsSection}>
          <View style={styles.detailItem}>
            <Text style={[styles.detailLabel, { color: theme.icon }]}>Date</Text>
            <Text style={[styles.detailValue, { color: theme.text }]}>
              {formatDate(transaction.date)}
            </Text>
          </View>

          <View style={styles.detailItem}>
            <Text style={[styles.detailLabel, { color: theme.icon }]}>Description</Text>
            <Text style={[styles.detailValue, { color: theme.text }]}>
              {transaction.description.includes(' - ') 
                ? transaction.description.split(' - ')[1] 
                : '-'}
            </Text>
          </View>

          <View style={styles.detailItem}>
            <Text style={[styles.detailLabel, { color: theme.icon }]}>Image</Text>
            <View style={styles.imageContainer}>
              {transaction.image ? (
                <TouchableOpacity onPress={() => setShowImageModal(true)} style={styles.imageWrapper}>
                  <Image 
                    source={{ uri: transaction.image }} 
                    style={styles.transactionImage} 
                    resizeMode="cover"
                  />
                  <View style={styles.tapOverlay}>
                    <IconSymbol name="eye.fill" size={20} color="#fff" />
                    <Text style={styles.tapText}>Tap to view</Text>
                  </View>
                </TouchableOpacity>
              ) : (
               <View style={[styles.imagePlaceholder, { backgroundColor: theme.icon + '10' }]}>
                  <Text style={{ color: theme.icon }}>No image attached</Text>
               </View>
              )}
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Image Modal */}
      <Modal
        visible={showImageModal}
        transparent={true}
        onRequestClose={() => setShowImageModal(false)}
      >
        <View style={styles.modalContainer}>
          <TouchableOpacity 
            style={styles.closeButton} 
            onPress={() => setShowImageModal(false)}
          >
            <IconSymbol name="xmark.circle.fill" size={30} color="#fff" />
          </TouchableOpacity>
          {transaction.image && (
            <Image 
              source={{ uri: transaction.image }} 
              style={styles.fullImage} 
              resizeMode="contain"
            />
          )}
        </View>
      </Modal>

      {/* Footer */}
      <View style={[styles.footer, { backgroundColor: theme.background, borderTopColor: theme.icon + '20' }]}>
        <View style={styles.footerButtons}>
          <TouchableOpacity 
            style={[styles.actionButton, { backgroundColor: '#ff3b30', width: 50 }]} 
            onPress={handleDelete}
          >
            <IconSymbol name="trash.fill" size={20} color="#fff" />
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.actionButton, styles.editButton, { backgroundColor: theme.text }]}
            onPress={handleEdit}
          >
            <Text style={[styles.editButtonText, { color: theme.background }]}>Edit Transaction</Text>
          </TouchableOpacity>
        </View>
      </View>
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
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    padding: 24,
  },
  mainInfo: {
    alignItems: 'center',
    marginBottom: 24,
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  emoji: {
    fontSize: 40,
  },
  merchantName: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    marginBottom: 24,
  },
  amountContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  currencyLabel: {
    fontSize: 16,
    fontWeight: '600',
    marginTop: 8,
    marginRight: 4,
  },
  amount: {
    fontSize: 40,
    fontWeight: 'bold',
  },
  divider: {
    height: 1,
    width: '100%',
    marginBottom: 24,
  },
  detailsSection: {
    gap: 24,
  },
  detailItem: {
    gap: 8,
  },
  detailLabel: {
    fontSize: 14,
  },
  detailValue: {
    fontSize: 16,
    fontWeight: '500',
  },
  imageContainer: {
    marginTop: 8,
  },
  imageWrapper: {
    position: 'relative',
    borderRadius: 12,
    overflow: 'hidden',
  },
  tapOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0,0,0,0.6)',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 8,
    gap: 8,
  },
  tapText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  transactionImage: {
    width: '100%',
    height: 200,
    borderRadius: 12,
  },
  imagePlaceholder: {
    width: '100%',
    height: 200,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButton: {
    position: 'absolute',
    top: 50,
    right: 20,
    zIndex: 1,
  },
  fullImage: {
    width: '100%',
    height: '80%',
  },
  footer: {
    padding: 20,
    borderTopWidth: 1,
  },
  footerButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  actionButton: {
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  editButton: {
    flex: 1,
  },
  editButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default TransactionDetailScreen;
