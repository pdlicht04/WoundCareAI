import { NavigationContainer } from "@react-navigation/native";
import DrawerNavigator from "./navigation/DrawerNavigator";
import { UserProvider } from "./UserContext";

export default function App() {
  return (
    <UserProvider>
      <NavigationContainer>
        <DrawerNavigator />
      </NavigationContainer>
    </UserProvider>
  );
}
