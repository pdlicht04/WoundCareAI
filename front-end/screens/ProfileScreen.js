// ================================
// 🧠 1️⃣ LOGIC & STATE
// ================================
import React, { useEffect, useState, useContext, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Image,
  TouchableOpacity,
  Modal,
  Alert,
  ActivityIndicator,
  Platform,
} from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import axios from "axios";
import { SERVER_URL } from "../config";
import { UserContext } from "../UserContext";
import { Feather } from "@expo/vector-icons";

export default function ProfileScreen() {
  const { user } = useContext(UserContext);

  // --- State ---
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [editModal, setEditModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);

  // ================================
  // 📦 Lấy dữ liệu lịch sử
  // ================================
  useFocusEffect(
    useCallback(() => {
      fetchHistory();
    }, [user])
  );

  const fetchHistory = async () => {
    if (!user?.token) return;
    setLoading(true);
    try {
      const res = await axios.get(`${SERVER_URL}/diagnoses/history`, {
        headers: { Authorization: `Bearer ${user.token}` },
      });
      // console.log("📦 Dữ liệu lịch sử:", res.data);
      setHistory(res.data);
    } catch (err) {
      console.error("❌ Lỗi tải lịch sử:", err.response?.data || err.message);
      Platform.OS === "web"
        ? window.alert("Không thể tải lịch sử.")
        : Alert.alert("Lỗi", "Không thể tải lịch sử.");
    } finally {
      setLoading(false);
    }
  };

  // ================================
  // ✏️ Cập nhật giá trị thật
  // ================================
  const handleSelectValue = async (value) => {
    if (!selectedItem) return;
    setEditModal(false);

    try {
      const formData = new FormData();
      formData.append("actual_result", value.replace(",", "."));

      await axios.patch(
        `${SERVER_URL}/diagnoses/${selectedItem.id}/feedback`,
        formData,
        {
          headers: {
            Authorization: `Bearer ${user.token}`,
            "Content-Type": "multipart/form-data",
          },
        }
      );

      // ✅ Cập nhật lại danh sách
      setHistory((prev) =>
        prev.map((item) =>
          item.id === selectedItem.id ? { ...item, actual_result: value } : item
        )
      );

      Platform.OS === "web"
        ? window.alert(`✅ Đã cập nhật pH = ${value}`)
        : Alert.alert("✅ Thành công", `Đã cập nhật pH = ${value}`);
    } catch (err) {
      console.error("❌ Lỗi cập nhật:", err.response?.data || err.message);
      Platform.OS === "web"
        ? window.alert("Cập nhật thất bại!")
        : Alert.alert("Lỗi", "Cập nhật thất bại!");
    }
  };

  // ================================
  // 🧩 Render từng item lịch sử
  // ================================
  const renderItem = ({ item }) => (
    <View style={styles.card}>
      <Image
        source={{
          uri: `${SERVER_URL}/${item.image_path.replace(/\\/g, "/")}`,
        }}
        style={styles.image}
      />
      <View style={{ flex: 1, marginLeft: 10 }}>
        <Text style={styles.text}>
          Dự đoán: <Text style={styles.bold}>{item.predicted_result}</Text>
        </Text>
        <Text style={styles.text}>
          Giá trị thật:{" "}
          <Text
            style={[
              styles.bold,
              { color: item.actual_result ? "#28a745" : "#888" },
            ]}
          >
            {item.actual_result || "Chưa có"}
          </Text>
        </Text>
        <Text style={styles.date}>
          {new Date(item.created_at).toLocaleString()}
        </Text>
      </View>
      <TouchableOpacity
        style={styles.editBtn}
        onPress={() => {
          setSelectedItem(item);
          setEditModal(true);
        }}
      >
        <Feather name="edit" size={18} color="#fff" />
      </TouchableOpacity>
    </View>
  );

  // ================================
  // 🖼️ 2️⃣ GIAO DIỆN (UI / JSX)
  // ================================
  return (
    <View style={styles.container}>
      {/* <Text style={styles.title}>📜 Lịch sử dự đoán</Text> */}

      {loading ? (
        <ActivityIndicator
          size="large"
          color="#007AFF"
          style={{ marginTop: 20 }}
        />
      ) : (
        <FlatList
          data={history}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderItem}
          contentContainerStyle={{ paddingBottom: 20 }}
        />
      )}

      {/* --- Modal chọn giá trị pH thật --- */}
      <Modal
        visible={editModal}
        transparent
        animationType="fade"
        onRequestClose={() => setEditModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modelBox}>
            <Text style={styles.modelTitle}>Chọn giá trị pH thật</Text>
            {[
              "4,0",
              "4,5",
              "5,0",
              "5,5",
              "6,0",
              "6,5",
              "7,0",
              "7,5",
              "8,0",
              "8,5",
              "9,0",
            ].map((value) => (
              <TouchableOpacity
                key={value}
                style={styles.modelItem}
                onPress={() => handleSelectValue(value)}
              >
                <Text style={styles.modelText}>{value}</Text>
              </TouchableOpacity>
            ))}

            <TouchableOpacity
              onPress={() => setEditModal(false)}
              style={[styles.modelItem, { marginTop: 5 }]}
            >
              <Text style={[styles.modelText, { color: "red" }]}>Hủy</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

// ================================
// 🎨 3️⃣ STYLE
// ================================
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f8f9fa", padding: 15 },
  title: {
    fontSize: 20,
    fontWeight: "700",
    color: "#007AFF",
    marginBottom: 10,
  },
  card: {
    flexDirection: "row",
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 10,
    marginVertical: 6,
    elevation: 2,
    alignItems: "center",
  },
  image: { width: 70, height: 70, borderRadius: 8 },
  text: { fontSize: 14, color: "#333" },
  bold: { fontWeight: "700" },
  date: { fontSize: 12, color: "#888", marginTop: 4 },
  editBtn: {
    backgroundColor: "#6f42c1",
    padding: 8,
    borderRadius: 8,
    marginLeft: 8,
  },

  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.3)",
    justifyContent: "center",
    alignItems: "center",
  },
  modelBox: {
    backgroundColor: "#fff",
    borderRadius: 16,
    width: "80%",
    padding: 20,
    elevation: 5,
  },
  modelTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#333",
    marginBottom: 12,
    textAlign: "center",
  },
  modelItem: {
    paddingVertical: 10,
    borderBottomWidth: 0.5,
    borderBottomColor: "#ccc",
  },
  modelText: { fontSize: 16, color: "#007AFF", textAlign: "center" },
});
