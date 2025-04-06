import FFButton from "@/src/components/FFButton";
import FFModal from "@/src/components/FFModal";
import FFSafeAreaView from "@/src/components/FFSafeAreaView";
import Spinner from "@/src/components/FFSpinner";
import FFText from "@/src/components/FFText";
import { RootState } from "@/src/store/store";
import { useSelector } from "@/src/store/types";
import axiosInstance from "@/src/utils/axiosConfig";
import IconAntDesign from "react-native-vector-icons/AntDesign";
import IconMaterialIcons from "react-native-vector-icons/MaterialIcons";

import moment from "moment"; // Import moment for date formatting
import { useEffect, useState } from "react";
import {
  Image,
  StyleSheet,
  TouchableOpacity,
  View,
  Linking,
} from "react-native";
import { ScrollView } from "react-native-gesture-handler";
import { IMAGE_LINKS } from "@/src/assets/imageLinks";
import { limitMaxCharacters } from "@/src/utils/functions";
import FFScreenTopSection from "@/src/components/FFScreenTopSection";
import { StackNavigationProp } from "@react-navigation/stack";
import { SidebarStackParamList } from "@/src/navigation/AppNavigator";
import { useNavigation } from "@react-navigation/native";
import * as IntentLauncher from "expo-intent-launcher";

type HomeRestaurantSreenNavigationProp = StackNavigationProp<
  SidebarStackParamList,
  "MyWallet"
>;

const PaymentMethodScreen = () => {
  const navigation = useNavigation<HomeRestaurantSreenNavigationProp>();
  const [isShowAddPaymentModal, setIsShowAddPaymentModal] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [transactions, setTransactions] = useState([]); // State to store transaction data

  const { fWalletId, balance } = useSelector((state: RootState) => state.auth);

  const handleAddPaymentMethod = () => {
    setIsShowAddPaymentModal(true);
  };

  const fetchTransactions = async () => {
    setIsLoading(true);
    try {
      const response = await axiosInstance.get(
        `/fwallets/history/${fWalletId}`
      );
      const { EC, EM, data } = response.data;

      if (EC === 0) {
        setTransactions(data); // Store transactions in state
      }
    } catch (error) {
      console.log("Error fetching transactions:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTransactions();
  }, [fWalletId]);

  const getTransactionTag = (transaction: {
    transaction_type: string;
    source: string;
    destination: string;
  }) => {
    if (transaction.transaction_type === "PURCHASE") {
      return transaction.destination === fWalletId ? "Received" : "Transferred";
    }
    return transaction.source === fWalletId ? "Sent" : "Received";
  };

  const openFWallet = async () => {
    try {
      await IntentLauncher.startActivityAsync("android.intent.action.MAIN", {
        packageName: "com.tommyle1310.FWallet",
        className: "com.tommyle1310.FWallet.MainActivity", // Chỉ định activity chính xác
      });
      console.log("Mở app thành công");
    } catch (error) {
      console.log("Lỗi: ", error);
    }
  };

  return (
    <FFSafeAreaView>
      <FFScreenTopSection title="Payment methods" navigation={navigation} />
      <Spinner isVisible={isLoading} isOverlay />

      <ScrollView contentContainerStyle={styles.container}>
        {/* Balance Section */}
        <View style={styles.balanceContainer}>
          <View>
            <FFText fontSize="lg" fontWeight="600" style={styles.balanceText}>
              My Balance
            </FFText>
            <FFText fontSize="lg" fontWeight="700">
              ${balance}
            </FFText>
          </View>
          <FFButton
            onPress={openFWallet}
            style={styles.topUpButton}
            isLinear
            className="flex-row items-center gap-2"
          >
            <IconAntDesign name="plus" size={16} color="#fff" />
            <FFText style={{ color: "#fff" }}>Top Up</FFText>
          </FFButton>
        </View>

        {/* Payment Methods Section */}
        <View style={styles.section}>
          <FFText fontSize="lg" fontWeight="600" style={styles.sectionTitle}>
            Payment Method
          </FFText>
          <TouchableOpacity
            style={styles.addPaymentButton}
            onPress={handleAddPaymentMethod}
          >
            <IconAntDesign name="plus" size={16} color="#4c9f3a" />
          </TouchableOpacity>
        </View>
        <View style={styles.paymentMethodCard}>
          <Image
            source={{
              uri: IMAGE_LINKS.DEFAULT_LOGO,
            }}
            style={styles.cardImage}
          />
          <FFText fontSize="md" fontWeight="500">
            FWallet
          </FFText>
          <FFText fontSize="sm" style={styles.cardNumber}>
            {limitMaxCharacters(fWalletId || "", 20)}
          </FFText>
        </View>

        {/* Transaction History Section */}
        <View style={styles.section}>
          <FFText fontSize="lg" fontWeight="600" style={styles.sectionTitle}>
            Transaction History
          </FFText>
        </View>
        {transactions.slice(0, 10).map(
          (
            transaction: {
              transaction_type: string;
              destination: string;
              id: string;
              timestamp: number;
              source: string;
              amount: string;
            },
            index
          ) => (
            <View key={transaction.id} style={styles.transactionItem}>
              <IconMaterialIcons
                name={
                  transaction.transaction_type === "PURCHASE"
                    ? "shopping-cart"
                    : "account-balance-wallet"
                }
                size={24}
                color={
                  transaction.destination === fWalletId ? "#4c9f3a" : "#f44336"
                }
                style={styles.transactionIcon}
              />
              <View style={styles.transactionDetails}>
                <FFText fontSize="md" fontWeight="500">
                  {transaction.transaction_type === "PURCHASE"
                    ? "Purchase"
                    : "Transfer"}
                </FFText>
                <FFText fontSize="sm" style={styles.transactionDate}>
                  {moment.unix(transaction.timestamp).format("MMM DD, YYYY")}
                </FFText>
              </View>
              <View style={styles.transactionAmountContainer}>
                <FFText
                  fontSize="md"
                  fontWeight="600"
                  style={{
                    color:
                      transaction.destination === fWalletId
                        ? "#4c9f3a"
                        : "#f44336",
                  }}
                >
                  {transaction.destination === fWalletId ? "+" : "-"}$
                  {parseFloat(transaction.amount).toFixed(2)}
                </FFText>
                <FFText
                  fontSize="sm"
                  style={{
                    color:
                      transaction.destination === fWalletId
                        ? "#4c9f3a"
                        : "#f44336",
                  }}
                >
                  {getTransactionTag(transaction)}
                </FFText>
              </View>
            </View>
          )
        )}
      </ScrollView>

      {/* Add Payment Method Modal */}
      <FFModal
        visible={isShowAddPaymentModal}
        onClose={() => setIsShowAddPaymentModal(false)}
      >
        <FFText fontSize="lg" fontWeight="600" style={{ textAlign: "center" }}>
          Add Payment Method
        </FFText>
        {/* Add your form or logic for adding a payment method */}
      </FFModal>
    </FFSafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
  },
  balanceContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 24,
    padding: 16,
    borderRadius: 8,
    backgroundColor: "#f5f5f5",
  },
  balanceText: {
    color: "#888",
  },
  topUpButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  section: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  sectionTitle: {
    color: "#333",
  },
  addPaymentButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: "#e8f5e9",
  },
  paymentMethodCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderRadius: 8,
    backgroundColor: "#fff",
    marginBottom: 16,
    elevation: 2,
  },
  cardImage: {
    width: 40,
    height: 40,
    marginRight: 16,
  },
  cardNumber: {
    color: "#888",
    marginLeft: "auto",
  },
  transactionItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderRadius: 8,
    backgroundColor: "#fff",
    marginBottom: 8,
    elevation: 1,
  },
  transactionIcon: {
    marginRight: 16,
  },
  transactionDetails: {
    flex: 1,
  },
  transactionDate: {
    color: "#888",
  },
  transactionAmountContainer: {
    alignItems: "flex-end",
  },
});

export default PaymentMethodScreen;
