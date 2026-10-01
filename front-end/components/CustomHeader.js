import { View, Text } from "react-native";

export default function CustomHeader({ title }) {
  return (
    <View
      style={{
        height: 60,
        backgroundColor: "#1976d2",
        justifyContent: "center",
        paddingLeft: 15,
      }}
    >
      <Text style={{ color: "#fff", fontSize: 18, fontWeight: "bold" }}>
        {title}
      </Text>
    </View>
  );
}
