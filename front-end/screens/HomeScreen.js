import { useState, useContext } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  StyleSheet,
  ActivityIndicator,
  Alert,
  Dimensions,
  Modal,
  Platform,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import axios from "axios";
import { SERVER_URL } from "../config";
import { Feather, MaterialCommunityIcons } from "@expo/vector-icons";
import ImageViewer from "react-native-image-zoom-viewer";
import { UserContext } from "../UserContext";

const { height } = Dimensions.get("window");

export default function HomeScreen() {
  const { user } = useContext(UserContext);
  const [selectedImage, setSelectedImage] = useState(null);
  const [croppedImage, setCroppedImage] = useState(null);
  const [prediction, setPrediction] = useState("");
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [zoomImages, setZoomImages] = useState([]);
  const [modelModal, setModelModal] = useState(false);
  const [selectedModel, setSelectedModel] = useState("ResNet50");
  const [resultDetailVisible, setResultDetailVisible] = useState(false);
  const [feedbackModal, setFeedbackModal] = useState(false);
  const [realValue, setRealValue] = useState(null);

  const resetState = () => {
    setSelectedImage(null);
    setCroppedImage(null);
    setPrediction("");
    setLoading(false);
    setModalVisible(false);
    setZoomImages([]);
    setModelModal(false);
    setSelectedModel("ResNet50");
    setResultDetailVisible(false);
    setFeedbackModal(false);
    setRealValue(null);
  };

  const openZoom = (uri) => {
    setZoomImages([{ url: uri }]);
    setModalVisible(true);
  };

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 1,
    });
    if (!result.canceled) {
      setSelectedImage(result.assets[0].uri);
      setPrediction("");
      setCroppedImage(null);
    }
  };

  const takePhoto = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("Quyền bị từ chối", "Ứng dụng cần quyền sử dụng camera!");
      return;
    }
    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 1,
    });
    if (!result.canceled) {
      setSelectedImage(result.assets[0].uri);
      setPrediction("");
      setCroppedImage(null);
    }
  };

  const uploadAndPredict = async () => {
    if (!selectedImage) {
      Alert.alert("Thông báo", "Chưa chọn ảnh!");
      return;
    }
    setLoading(true);
    try {
      const formData = new FormData();
      if (Platform.OS === "web") {
        const response = await fetch(selectedImage);
        const blob = await response.blob();
        formData.append("file", blob, "image.jpg");
      } else {
        formData.append("file", {
          uri: selectedImage,
          name: "image.jpg",
          type: "image/jpeg",
        });
      }

      const res = await axios.post(`${SERVER_URL}/api/predict`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      setCroppedImage(res.data.cropped_image);
      setPrediction(res.data.predicted_class);
      // setPrediction(res.data.predicted_class.replace(".", ","));
    } catch (error) {
      console.log("❌ Upload error:", error.response?.data || error.message);
      Alert.alert("Lỗi", JSON.stringify(error.response?.data || error.message));
    } finally {
      setLoading(false);
    }
  };

  const saveResult = async () => {
    if (!selectedImage || !prediction) {
      Alert.alert(
        "Thiếu thông tin",
        "Bạn cần chọn ảnh và dự đoán trước khi lưu!"
      );
      return;
    }

    if (!user?.token) {
      Alert.alert("Chưa đăng nhập", "Vui lòng đăng nhập để lưu kết quả!");
      return;
    }

    try {
      setLoading(true);
      const formData = new FormData();
      if (Platform.OS === "web") {
        // ⚠️ Trên web, cần chuyển uri thành blob thực tế
        const response = await fetch(selectedImage);
        const blob = await response.blob();
        formData.append("file", blob, "image.jpg");
      } else {
        // 📱 Native (Android/iOS)
        formData.append("file", {
          uri: selectedImage,
          name: "image.jpg",
          type: "image/jpeg",
        });
      }
      formData.append("result", prediction.toString());
      // formData.append("confidence", "0.95");
      if (realValue) {
        formData.append(
          "actual_result",
          realValue.toString().replace(",", ".")
        );
      }
      const res = await axios.post(`${SERVER_URL}/diagnoses/upload`, formData, {
        headers: {
          "Content-Type": "multipart/form-data",
          Authorization: `Bearer ${user.token}`,
        },
      });

      console.log("✅ Lưu thành công:", res.data);
      if (Platform.OS === "web") {
        window.alert("✅ Kết quả đã được lưu thành công!");
      } else {
        Alert.alert("✅ Thành công", "Kết quả đã được lưu!");
      }

      resetState();
    } catch (err) {
      console.error("❌ Lỗi lưu:", err.response?.data || err.message);
      Alert.alert(
        "Lỗi khi lưu",
        JSON.stringify(err.response?.data || err.message)
      );
    } finally {
      setLoading(false);
    }
  };

  const getPHInfo = (pH) => {
    const value = parseFloat(pH);
    if (isNaN(value)) return null;

    if (value <= 5.0)
      return {
        viem: "Viêm thấp, môi trường acid ức chế vi khuẩn",
        dacDiem: "Tăng tổng hợp collagen, angiogenesis, biểu mô hóa",
        hoiPhuc: "Hồi phục nhanh, tỉ lệ phục hồi cao",
        luuY: "Quá acid có thể gây đau rát, thường do điều trị bằng dung dịch acid nhẹ",
      };
    if (value >= 5.5 && value <= 6.0)
      return {
        viem: "Viêm mức nhẹ",
        dacDiem: "Vết thương sạch, ít dịch rỉ, hoạt động tế bào mạnh",
        hoiPhuc: "Lành tốt, tiến trình hồi phục thuận lợi",
        luuY: "Đây là vùng pH lý tưởng cho liền thương",
      };
    if (value > 6.0 && value <= 7.0)
      return {
        viem: "Viêm trung bình",
        dacDiem: "Vết thương bán mạn tính, có thể có vi khuẩn cư trú",
        hoiPhuc: "Hồi phục chậm hơn, nguy cơ kéo dài thời gian điều trị",
        luuY: "Nhiều vết thương cấp ban đầu có pH ở mức này",
      };
    if (value > 7.0 && value <= 7.5)
      return {
        viem: "Viêm vừa đến cao",
        dacDiem:
          "Vết thương mạn tính bắt đầu xuất hiện, có dịch rỉ, chậm biểu mô hóa",
        hoiPhuc: "Tỉ lệ phục hồi trung bình–thấp, nguy cơ nhiễm khuẩn",
        luuY: "Cần theo dõi và hỗ trợ điều trị bằng dressing chuyên biệt",
      };
    if (value > 7.5 && value <= 8.5)
      return {
        viem: "Viêm cao, có thể nhiễm khuẩn",
        dacDiem:
          "Vết loét mạn, hoại tử, dịch rỉ nhiều, vi khuẩn phát triển tốt",
        hoiPhuc: "Rất khó hồi phục, thời gian kéo dài, dễ bội nhiễm",
        luuY: "Cần giảm pH bằng dressing hoặc điều trị hỗ trợ",
      };
    if (value > 8.5)
      return {
        viem: "Viêm nặng, nhiễm trùng rõ",
        dacDiem: "Môi trường kiềm mạnh, vi khuẩn Gram- phát triển, mô hoại tử",
        hoiPhuc: "Hầu như không hồi phục nếu không can thiệp tích cực",
        luuY: "Thường gặp ở loét mạn tính lâu năm",
      };
    return null;
  };

  return (
    <View style={styles.container}>
      {/* --- Hàng nút chọn ảnh --- */}
      <View style={styles.buttonRow}>
        <TouchableOpacity style={styles.iconButton} onPress={pickImage}>
          <Feather name="image" size={20} color="#fff" />
          <Text style={styles.btnText}>Chọn ảnh</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.iconButton} onPress={takePhoto}>
          <Feather name="camera" size={20} color="#fff" />
          <Text style={styles.btnText}>Chụp ảnh</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.iconButton, { backgroundColor: "#6f42c1" }]}
          onPress={() => setModelModal(true)}
        >
          <Feather name="cpu" size={20} color="#fff" />
          <Text style={styles.btnText}>Chọn mô hình</Text>
        </TouchableOpacity>
      </View>

      {/* --- Ảnh gốc --- */}
      <TouchableOpacity
        style={styles.imageBox}
        onPress={() => selectedImage && openZoom(selectedImage)}
        activeOpacity={0.8}
      >
        {selectedImage ? (
          <Image source={{ uri: selectedImage }} style={styles.image} />
        ) : (
          <Text style={styles.placeholderText}>Ảnh gốc</Text>
        )}
      </TouchableOpacity>

      {/* --- Gửi dự đoán --- */}
      <View style={styles.predictRow}>
        <Text style={styles.modelLabel}>Mô hình: {selectedModel}</Text>
        <TouchableOpacity
          style={[styles.predictButton, loading && { backgroundColor: "#ccc" }]}
          onPress={uploadAndPredict}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <>
              <MaterialCommunityIcons
                name="rocket-launch"
                size={20}
                color="#fff"
              />
              <Text style={styles.predictText}>Gửi để dự đoán</Text>
            </>
          )}
        </TouchableOpacity>
      </View>

      {/* --- Ảnh sau xử lý --- */}
      <TouchableOpacity
        style={styles.imageBox}
        onPress={() => croppedImage && openZoom(croppedImage)}
        activeOpacity={0.8}
      >
        {croppedImage ? (
          <Image source={{ uri: croppedImage }} style={styles.image} />
        ) : (
          <Text style={styles.placeholderText}>Ảnh sau xử lý</Text>
        )}
      </TouchableOpacity>

      {/* --- Kết quả --- */}
      {prediction ? (
        <View style={styles.resultRow}>
          <TouchableOpacity
            style={styles.resultCard}
            onPress={() => setResultDetailVisible(true)}
          >
            <Text style={styles.resultText}>
              Kết quả dự đoán:{" "}
              <Text style={styles.resultValue}>
                {realValue ?? prediction.replace(".", ",")}
              </Text>
            </Text>
          </TouchableOpacity>

          {user && (
            <TouchableOpacity style={styles.saveButton} onPress={saveResult}>
              <Feather name="save" size={18} color="#fff" />
              <Text style={styles.saveText}>Lưu kết quả</Text>
            </TouchableOpacity>
          )}
        </View>
      ) : null}

      {/* --- Modal zoom ảnh --- */}
      <Modal visible={modalVisible} transparent={true}>
        <ImageViewer
          imageUrls={zoomImages}
          enableSwipeDown
          onSwipeDown={() => setModalVisible(false)}
        />
      </Modal>

      {/* --- Modal chọn mô hình --- */}
      <Modal
        visible={modelModal}
        transparent
        animationType="fade"
        onRequestClose={() => setModelModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modelBox}>
            <Text style={styles.modelTitle}>Chọn mô hình dự đoán</Text>
            {["ResNet50"].map((model) => (
              <TouchableOpacity
                key={model}
                style={styles.modelItem}
                onPress={() => {
                  setSelectedModel(model);
                  setModelModal(false);
                }}
              >
                <Text style={styles.modelText}>{model}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </Modal>

      {/* --- Modal chi tiết kết quả --- */}
      <Modal
        visible={resultDetailVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setResultDetailVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.resultDetailBox}>
            {/* Nút đóng góc phải */}
            <TouchableOpacity
              style={styles.closeButtonTop}
              onPress={() => setResultDetailVisible(false)}
            >
              <Feather name="x" size={20} color="#fff" />
            </TouchableOpacity>

            <Text style={styles.resultTitle}>Thông tin dự đoán</Text>
            <Text style={styles.resultLine}>
              Kết quả dự đoán:{" "}
              <Text style={styles.resultValue}>
                pH = {realValue ?? prediction.replace(".", ",")}
              </Text>
            </Text>
            <Text style={styles.resultLine}>
              Mô hình: <Text style={styles.resultValue}>{selectedModel}</Text>
            </Text>

            {getPHInfo(realValue ?? prediction) && (
              <>
                <Text style={styles.resultLine}>
                  Mức độ viêm:{" "}
                  <Text style={styles.resultValue}>
                    {getPHInfo(realValue ?? prediction).viem}
                  </Text>
                </Text>
                <Text style={styles.resultLine}>
                  Đặc điểm vết thương: {"\n"}
                  <Text style={styles.resultValue}>
                    {getPHInfo(realValue ?? prediction).dacDiem}
                  </Text>
                </Text>
                <Text style={styles.resultLine}>
                  Xu hướng hồi phục: {"\n"}
                  <Text style={styles.resultValue}>
                    {getPHInfo(realValue ?? prediction).hoiPhuc}
                  </Text>
                </Text>
                <Text style={styles.resultLine}>
                  Lưu ý: {"\n"}
                  <Text style={styles.resultValue}>
                    {getPHInfo(realValue ?? prediction).luuY}
                  </Text>
                </Text>
              </>
            )}

            <View style={styles.resultDetailButtons}>
              {user && (
                <>
                  <TouchableOpacity
                    style={styles.modalBtn}
                    onPress={saveResult}
                  >
                    <Feather name="save" size={18} color="#fff" />
                    <Text style={styles.modalBtnText}>Lưu kết quả</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.modalBtn, { backgroundColor: "#6f42c1" }]}
                    onPress={() => {
                      // setResultDetailVisible(false);
                      setFeedbackModal(true);
                    }}
                  >
                    <Feather name="edit-3" size={18} color="#fff" />
                    <Text style={styles.modalBtnText}>Góp ý</Text>
                  </TouchableOpacity>
                </>
              )}
            </View>
          </View>
        </View>
      </Modal>

      {/* --- Modal góp ý --- */}
      <Modal
        visible={feedbackModal}
        transparent
        animationType="fade"
        onRequestClose={() => setFeedbackModal(false)}
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
                onPress={() => {
                  setFeedbackModal(false);
                  setRealValue(value);
                  Alert.alert(
                    "Cảm ơn góp ý!",
                    `Giá trị thật bạn chọn là pH = ${value}`
                  );
                }}
              >
                <Text style={styles.modelText}>{value}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f6f8fa", padding: 15 },
  buttonRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    alignItems: "center",
    columnGap: 12,
    rowGap: 10,
    marginBottom: 15,
  },
  iconButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#007AFF",
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 10,
    gap: 6,
    minWidth: "30%",
    justifyContent: "center",
  },
  btnText: { color: "#fff", fontWeight: "600", fontSize: 14 },
  imageBox: {
    width: "100%",
    height: height * 0.28,
    backgroundColor: "#e9edf2",
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
    marginVertical: 8,
    borderWidth: 1.5,
    borderColor: "#000",
  },
  image: {
    width: "100%",
    height: "100%",
    borderRadius: 14,
    resizeMode: "contain",
  },
  placeholderText: { color: "#888", fontSize: 16, fontStyle: "italic" },
  predictRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    width: "100%",
    marginVertical: 8,
  },
  modelLabel: { fontSize: 15, color: "#333", fontWeight: "600" },
  predictButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#28a745",
    paddingVertical: 10,
    paddingHorizontal: 18,
    borderRadius: 12,
    gap: 8,
  },
  predictText: { color: "#fff", fontSize: 15, fontWeight: "600" },
  resultRow: {
    flexDirection: "row",
    alignItems: "center",
    width: "100%",
    justifyContent: "space-between",
    marginTop: 12,
  },
  resultCard: {
    backgroundColor: "#fff",
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 12,
    elevation: 3,
    alignSelf: "flex-start",
  },
  resultText: { fontSize: 15, fontWeight: "600", color: "#333" },
  resultValue: { color: "#28a745", fontWeight: "700" },
  saveButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#007AFF",
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 12,
    alignSelf: "flex-end",
  },
  saveText: { color: "#fff", fontWeight: "600", fontSize: 14, marginLeft: 6 },
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
  resultDetailBox: {
    backgroundColor: "#fff",
    borderRadius: 16,
    width: "85%",
    padding: 20,
    elevation: 6,
  },
  resultTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#333",
    marginBottom: 10,
    textAlign: "center",
  },
  resultLine: { fontSize: 15, color: "#444", marginBottom: 6 },
  resultDetailButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 15,
  },
  modalBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#007AFF",
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 14,
    gap: 6,
  },
  modalBtnText: { color: "#fff", fontWeight: "600", fontSize: 14 },
  closeButtonTop: {
    position: "absolute",
    top: 10,
    right: 10,
    backgroundColor: "#dc3545",
    borderRadius: 20,
    padding: 6,
    zIndex: 10,
  },
});
