import { useRef, useState, useContext } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Animated,
  PanResponder,
  Dimensions,
  StyleSheet,
  Alert,
  Platform,
} from "react-native";
import axios from "axios";
import { useNavigation } from "@react-navigation/native";
import { UserContext } from "../UserContext";
import { SERVER_URL } from "../config"; // ✅ dùng biến từ config.js

const { width } = Dimensions.get("window");

// ✅ helper để hiển thị alert hoạt động cả web + mobile
const showAlert = (title, message) => {
  if (Platform.OS === "web") window.alert(`${title}\n${message}`);
  else Alert.alert(title, message);
};

export default function AccountScreen() {
  const [isLogin, setIsLogin] = useState(true);
  const translateX = useRef(new Animated.Value(0)).current;
  const indicatorX = useRef(new Animated.Value(0)).current;
  const { setUser } = useContext(UserContext);
  const navigation = useNavigation();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPw, setConfirmPw] = useState("");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);

  // 🧩 refs điều hướng giữa các ô input
  const loginPasswordRef = useRef();
  const registerEmailRef = useRef();
  const registerPasswordRef = useRef();
  const registerConfirmRef = useRef();

  // ============================
  // 🔹 Animation chuyển form
  // ============================
  const animateForms = (login) => {
    Animated.parallel([
      Animated.timing(translateX, {
        toValue: login ? 0 : -width,
        duration: 400,
        useNativeDriver: false, // ⚠️ phải để false cho web + layout width
      }),
      Animated.timing(indicatorX, {
        toValue: login ? 0 : width * 0.4,
        duration: 400,
        useNativeDriver: false,
      }),
    ]).start(() => setIsLogin(login));
  };

  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, g) =>
        Math.abs(g.dx) > 25 && Math.abs(g.dx) > Math.abs(g.dy),
      onPanResponderRelease: (_, g) => {
        if (g.dx < -50 && isLogin) animateForms(false);
        if (g.dx > 50 && !isLogin) animateForms(true);
      },
    })
  ).current;

  // ============================
  // 🔑 Đăng nhập
  // ============================
  const handleLogin = async () => {
    if (loading) return; // tránh bấm liên tục
    if (!email || !password)
      return showAlert("Lỗi", "Vui lòng nhập đầy đủ thông tin");

    try {
      setLoading(true);
      console.log("📡 Gửi request login...");
      const formData = new URLSearchParams();
      formData.append("username", email);
      formData.append("password", password);

      const res = await axios.post(`${SERVER_URL}/auth/login`, formData, {
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
      });

      console.log("✅ Đăng nhập response:", res.data);
      const { access_token, user } = res.data;

      setUser({
        email: user.email,
        token: access_token,
        name: user.name,
      });

      // showAlert("✅ Thành công", "Đăng nhập thành công!");
      navigation.navigate("Trang chủ");
    } catch (err) {
      console.error("❌ Login error:", err.response?.data || err.message);
      showAlert(
        "Đăng nhập thất bại",
        err.response?.data?.detail || "Lỗi không xác định"
      );
    } finally {
      setLoading(false);
    }
  };

  // ============================
  // 🧾 Đăng ký
  // ============================
  const handleRegister = async () => {
    if (loading) return;
    if (!email || !password || !confirmPw || !name)
      return showAlert("Lỗi", "Vui lòng nhập đầy đủ thông tin");
    if (password !== confirmPw)
      return showAlert("Lỗi", "Mật khẩu xác nhận không khớp");

    try {
      setLoading(true);
      console.log("📡 Gửi request register...");
      await axios.post(`${SERVER_URL}/auth/register`, {
        email,
        password,
        name,
      });
      // showAlert("✅ Thành công", "Tạo tài khoản thành công! Hãy đăng nhập.");
      animateForms(true);
    } catch (err) {
      console.error("❌ Register error:", err.response?.data || err.message);
      showAlert(
        "Đăng ký thất bại",
        err.response?.data?.detail || "Lỗi không xác định"
      );
    } finally {
      setLoading(false);
    }
  };

  // ============================
  // 🧱 Giao diện
  // ============================
  return (
    <View style={styles.container}>
      <View style={styles.innerContainer}>
        {/* Tabs */}
        <View style={styles.tabContainer}>
          <View style={styles.tabRow}>
            <TouchableOpacity
              style={styles.tab}
              onPress={() => animateForms(true)}
            >
              <Text style={[styles.tabText, isLogin && styles.activeText]}>
                Đăng nhập
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.tab}
              onPress={() => animateForms(false)}
            >
              <Text style={[styles.tabText, !isLogin && styles.activeText]}>
                Đăng ký
              </Text>
            </TouchableOpacity>
          </View>
          <Animated.View
            style={[
              styles.indicator,
              { transform: [{ translateX: indicatorX }] },
            ]}
          />
        </View>

        {/* Forms */}
        <View style={styles.sliderContainer}>
          <Animated.View
            style={[styles.formsContainer, { transform: [{ translateX }] }]}
          >
            {/* FORM ĐĂNG NHẬP */}
            <View style={styles.form} {...panResponder.panHandlers}>
              <TextInput
                style={styles.input}
                placeholder="Email"
                keyboardType="email-address"
                value={email}
                onChangeText={setEmail}
                returnKeyType="next"
                onSubmitEditing={() => loginPasswordRef.current.focus()}
                blurOnSubmit={false}
              />
              <TextInput
                style={styles.input}
                placeholder="Mật khẩu"
                secureTextEntry
                value={password}
                onChangeText={setPassword}
                ref={loginPasswordRef}
                returnKeyType="done"
                onSubmitEditing={handleLogin}
                blurOnSubmit={true}
              />
              <TouchableOpacity
                style={styles.button}
                onPress={handleLogin}
                disabled={loading}
              >
                <Text style={styles.buttonText}>
                  {loading ? "Đang đăng nhập..." : "Đăng nhập"}
                </Text>
              </TouchableOpacity>
            </View>

            {/* FORM ĐĂNG KÝ */}
            <View style={styles.form} {...panResponder.panHandlers}>
              <TextInput
                style={styles.input}
                placeholder="Họ và tên"
                value={name}
                onChangeText={setName}
                returnKeyType="next"
                onSubmitEditing={() => registerEmailRef.current.focus()}
                blurOnSubmit={false}
              />
              <TextInput
                style={styles.input}
                placeholder="Email"
                keyboardType="email-address"
                value={email}
                onChangeText={setEmail}
                ref={registerEmailRef}
                returnKeyType="next"
                onSubmitEditing={() => registerPasswordRef.current.focus()}
                blurOnSubmit={false}
              />
              <TextInput
                style={styles.input}
                placeholder="Mật khẩu"
                secureTextEntry
                value={password}
                onChangeText={setPassword}
                ref={registerPasswordRef}
                returnKeyType="next"
                onSubmitEditing={() => registerConfirmRef.current.focus()}
                blurOnSubmit={false}
              />
              <TextInput
                style={styles.input}
                placeholder="Xác nhận mật khẩu"
                secureTextEntry
                value={confirmPw}
                onChangeText={setConfirmPw}
                ref={registerConfirmRef}
                returnKeyType="done"
                onSubmitEditing={handleRegister}
                blurOnSubmit={true}
              />
              <TouchableOpacity
                style={styles.button}
                onPress={handleRegister}
                disabled={loading}
              >
                <Text style={styles.buttonText}>
                  {loading ? "Đang xử lý..." : "Đăng ký"}
                </Text>
              </TouchableOpacity>
            </View>
          </Animated.View>
        </View>
      </View>
    </View>
  );
}

// ============================
// 🎨 Styles
// ============================
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
  innerContainer: { alignItems: "center", paddingTop: 80 },
  tabContainer: { width: "80%", marginBottom: 30, position: "relative" },
  tabRow: { flexDirection: "row", justifyContent: "space-around" },
  tab: { flex: 1, alignItems: "center", paddingVertical: 10 },
  tabText: { fontSize: 18, fontWeight: "600", color: "#999" },
  activeText: { color: "#007AFF" },
  indicator: {
    position: "absolute",
    bottom: 0,
    left: "10%",
    width: "40%",
    height: 3,
    backgroundColor: "#007AFF",
    borderRadius: 3,
  },
  sliderContainer: { width, overflow: "hidden" },
  formsContainer: { flexDirection: "row", width: width * 2 },
  form: {
    width,
    alignItems: "center",
    justifyContent: "flex-start",
    paddingTop: 20,
  },
  input: {
    width: "80%",
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 10,
    padding: 12,
    marginBottom: 15,
    color: "#000",
  },
  button: {
    width: "80%",
    backgroundColor: "#007AFF",
    padding: 14,
    borderRadius: 10,
    alignItems: "center",
    marginTop: 10,
  },
  buttonText: { color: "#fff", fontSize: 16, fontWeight: "600" },
});
