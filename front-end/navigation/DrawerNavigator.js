import { useContext } from "react";
import {
  createDrawerNavigator,
  DrawerContentScrollView,
  DrawerItem,
} from "@react-navigation/drawer";
import { View, Text } from "react-native";
import { Feather, MaterialIcons } from "@expo/vector-icons";

import HomeScreen from "../screens/HomeScreen";
import AccountScreen from "../screens/AccountScreen";
import ProfileScreen from "../screens/ProfileScreen";
import { UserContext } from "../UserContext";

const Drawer = createDrawerNavigator();

function CustomDrawerContent(props) {
  const { user, setUser } = useContext(UserContext);

  return (
    <DrawerContentScrollView {...props}>
      {/* Header */}
      <View style={{ padding: 20, borderBottomWidth: 1, borderColor: "#ccc" }}>
        <Text style={{ fontSize: 18, fontWeight: "600", color: "#007AFF" }}>
          {user ? `Xin chào, ${user.name}!` : "BioCare AI"}
        </Text>
      </View>

      {/* Mục Trang chủ */}
      <DrawerItem
        label="Trang chủ"
        labelStyle={{ fontSize: 16 }}
        icon={({ color, size }) => (
          <Feather name="home" size={size} color={color} />
        )}
        onPress={() => props.navigation.navigate("Trang chủ")}
      />

      {/* Mục Tài khoản / Hồ sơ */}
      {user ? (
        <DrawerItem
          label="Lịch sử dự đoán"
          labelStyle={{ fontSize: 16 }}
          icon={({ color, size }) => (
            <Feather name="user-check" size={size} color={color} />
          )}
          onPress={() => props.navigation.navigate("Lịch sử dự đoán")}
        />
      ) : (
        <DrawerItem
          label="Tài khoản"
          labelStyle={{ fontSize: 16 }}
          icon={({ color, size }) => (
            <Feather name="user" size={size} color={color} />
          )}
          onPress={() => props.navigation.navigate("Tài khoản")}
        />
      )}

      {/* Nút đăng xuất chỉ hiện khi user có */}
      {user && (
        <DrawerItem
          label="Đăng xuất"
          labelStyle={{ fontSize: 16, color: "red" }}
          icon={({ size }) => (
            <MaterialIcons name="logout" size={size} color="red" />
          )}
          onPress={() => {
            props.navigation.navigate("Trang chủ");
            setUser(null);
          }}
        />
      )}
    </DrawerContentScrollView>
  );
}

export default function DrawerNavigator() {
  const { user } = useContext(UserContext);

  return (
    <Drawer.Navigator
      initialRouteName="Trang chủ"
      drawerContent={(props) => <CustomDrawerContent {...props} />}
      screenOptions={{
        headerTintColor: "#007AFF",
        drawerActiveTintColor: "#007AFF",
        drawerLabelStyle: { fontSize: 16 },
      }}
    >
      <Drawer.Screen
        name="Trang chủ"
        component={HomeScreen}
        options={{
          drawerIcon: ({ color, size }) => (
            <Feather name="home" size={size} color={color} />
          ),
        }}
      />

      <Drawer.Screen
        name={user ? "Lịch sử dự đoán" : "Tài khoản"}
        component={user ? ProfileScreen : AccountScreen}
        options={{
          drawerIcon: ({ color, size }) => (
            <Feather
              name={user ? "user-check" : "user"}
              size={size}
              color={color}
            />
          ),
        }}
      />
    </Drawer.Navigator>
  );
}
