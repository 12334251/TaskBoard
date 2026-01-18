import { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { KeyboardAvoidingView } from "react-native-keyboard-controller";
import { supabase } from "../../../api/supabase";

export const LoginScreen = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const isValidEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
    return emailRegex.test(email);
  };

  const checkEmailExists = async (emailToCheck: string) => {
    try {
      const { data } = await supabase
        .from("profiles")
        .select("id")
        .eq("email", emailToCheck)
        .single();
      return !!data;
    } catch (err) {
      console.log("Error checking user:", err);
      return false;
    }
  };

  // Handle Sign In
  const onSignInPress = async () => {
    if (!email || !password) {
      Alert.alert("Error", "Please fill in both email and password.");
      return;
    }

    if (!isValidEmail(email)) {
      Alert.alert(
        "Invalid Email Format",
        "Enter valid email address or create your account",
      );
      return;
    }

    setLoading(true);

    const userExists = await checkEmailExists(email);

    if (!userExists) {
      setLoading(false);
      Alert.alert(
        "Account Not Found",
        "This email is not registered. Please create your account.",
      );
      return;
    }

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      Alert.alert("Wrong Password", "Please enter a valid password.");
    }

    setLoading(false);
  };

  // Handle Sign Up
  const onSignUpPress = async () => {
    if (!email || !password) {
      Alert.alert("Error", "Please fill in both email and password.");
      return;
    }

    if (!isValidEmail(email)) {
      Alert.alert("Error", "Please enter a valid email address.");
      return;
    }

    if (password.length < 6) {
      Alert.alert(
        "Invalid Password",
        "Password should be at least 6 characters long.",
      );
      return;
    }

    setLoading(true);

    const userExists = await checkEmailExists(email);
    if (userExists) {
      setLoading(false);
      Alert.alert("Error", "User already exists. Please login.");
      return;
    }

    const { error } = await supabase.auth.signUp({
      email,
      password,
    });

    if (error) {
      Alert.alert("Sign Up Error", error.message);
    } else {
      Alert.alert("Success", "Check your inbox for email verification!");
    }
    setLoading(false);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Task Board</Text>

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "padding"}
      >
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            placeholder="Email"
            value={email}
            onChangeText={(text) => setEmail(text.trim())}
            autoCapitalize="none"
            keyboardType="email-address"
          />
          <TextInput
            style={styles.input}
            placeholder="Password"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
          />
        </View>

        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={[styles.button, styles.primaryButton]}
            onPress={onSignInPress}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.buttonText}>Sign In</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.button, styles.secondaryButton]}
            onPress={onSignUpPress}
            disabled={loading}
          >
            <Text style={[styles.buttonText, styles.secondaryButtonText]}>
              Create Account
            </Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    padding: 20,
    backgroundColor: "#f5f5f5",
  },
  title: {
    fontSize: 32,
    fontWeight: "bold",
    marginBottom: 40,
    textAlign: "center",
    color: "#333",
  },
  inputContainer: { marginBottom: 20 },
  input: {
    backgroundColor: "white",
    padding: 15,
    borderRadius: 10,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#ddd",
  },
  buttonContainer: { gap: 10 },
  button: { padding: 15, borderRadius: 10, alignItems: "center" },
  primaryButton: { backgroundColor: "#007AFF" },
  secondaryButton: {
    backgroundColor: "transparent",
    borderWidth: 1,
    borderColor: "#007AFF",
  },
  buttonText: { color: "white", fontWeight: "600", fontSize: 16 },
  secondaryButtonText: { color: "#007AFF" },
});
