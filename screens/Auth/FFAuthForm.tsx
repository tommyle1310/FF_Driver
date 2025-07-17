// components/FFAuthForm.tsx
import React, { useRef, useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Pressable,
  StyleSheet,
  ScrollView,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import IconIonicons from "react-native-vector-icons/Ionicons";
import FFAvatar from "@/src/components/FFAvatar";
import { IMAGE_LINKS } from "@/src/assets/imageLinks";
import { colors, spacing } from "@/src/theme";
import FFText from "@/src/components/FFText";
import FFInputControl from "@/src/components/FFInputControl";

type FFAuthFormProps = {
  isSignUp: boolean;
  onSubmit: (basicInfo: any, vehicleInfo: any) => void;
  navigation?: any;
  error?: string;
  formErrors?: {
    general?: string;
    email?: string;
    password?: string;
    firstName?: string;
    lastName?: string;
    contactEmail?: string;
    contactPhone?: string;
    license_plate?: string;
    model?: string;
    color?: string;
  };
};

const FFAuthForm = ({
  isSignUp,
  onSubmit,
  navigation,
  formErrors,
  error,
}: FFAuthFormProps) => {
  // Basic Info State
  const [email, setEmail] = useState("tommy.flashfood@gmail.com");
  const [password, setPassword] = useState("000000");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);

  // Contact Info State
  const [newContactEmail, setNewContactEmail] = useState("");
  const [newContactTitle, setNewContactTitle] = useState("Main Contact");
  const [newPhoneTitle, setNewPhoneTitle] = useState("Main Contact");
  const [newContactPhone, setNewContactPhone] = useState("");
  const [contactEmail, setContactEmail] = useState<
    Array<{
      title: string;
      email: string;
      is_default: boolean;
    }>
  >([]);
  const [contactPhone, setContactPhone] = useState<
    Array<{
      title: string;
      number: string;
      is_default: boolean;
    }>
  >([]);

  // Vehicle Info State
  const [licensePlate, setLicensePlate] = useState("");
  const [model, setModel] = useState("");
  const [color, setColor] = useState("");
  const [activeTab, setActiveTab] = useState(0);

  const handleAddEmail = () => {
    if (newContactEmail && newContactTitle) {
      setContactEmail([
        ...contactEmail,
        {
          title: newContactTitle,
          email: newContactEmail,
          is_default: contactEmail.length === 0,
        },
      ]);
      setNewContactEmail("");
      setNewContactTitle(contactEmail.length === 0 ? "Main Contact" : "");
    }
  };

  const handleAddPhone = () => {
    if (newContactPhone && newPhoneTitle) {
      setContactPhone([
        ...contactPhone,
        {
          title: newPhoneTitle,
          number: newContactPhone,
          is_default: contactPhone.length === 0,
        },
      ]);
      setNewContactPhone("");
      setNewPhoneTitle(contactPhone.length === 0 ? "Main Contact" : "");
    }
  };

  const handleSubmit = () => {
    if (isSignUp) {
      // Prepare basic info with contacts
      const basicInfo = {
        email,
        password,
        first_name: firstName,
        last_name: lastName,
        contact_email:
          contactEmail.length > 0
            ? contactEmail
            : [
              {
                title: newContactTitle || "Main Contact",
                email: newContactEmail || email, // Use newContactEmail if available, otherwise fallback to main email
                is_default: true,
              },
            ],
        contact_phone:
          contactPhone.length > 0
            ? contactPhone
            : [
              {
                title: newPhoneTitle || "Main Contact",
                number: newContactPhone, // Use newContactPhone if available
                is_default: true,
              },
            ],
      };

      // Vehicle info
      const vehicleInfo = {
        vehicle: {
          license_plate: licensePlate,
          model: model,
          color: color,
        },
      };

      onSubmit(basicInfo, vehicleInfo);
    } else {
      // For login, just pass email and password directly
      onSubmit(email, password);
    }
  };

  const renderInputField = (
    label: string,
    value: string,
    onChangeText: (text: string) => void,
    placeholder: string,
    isSecure?: boolean,
    fieldError?: string
  ) => (
    <View style={styles.inputContainer}>
      <Text style={styles.inputLabel}>{label}</Text>
      <View
        style={[
          styles.inputWrapper,
          { borderColor: fieldError ? "red" : "#d1d1d1" },
        ]}
      >
        <TextInput
          autoCapitalize="none"
          placeholder={placeholder}
          value={value}
          onChangeText={onChangeText}
          secureTextEntry={isSecure && !isPasswordVisible}
          style={styles.inputField}
        />
        {isSecure && (
          <TouchableOpacity
            onPress={() => setIsPasswordVisible(!isPasswordVisible)}
            style={styles.iconButton}
          >
            <IconIonicons
              name={isPasswordVisible ? "eye-off" : "eye"}
              size={20}
            />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );

  const renderContactSection = () => (
    <View style={styles.contactSection}>
      <Text style={styles.contactTitle}>Contact Information</Text>

      {/* Email Contacts */}
      <View>
        <View style={styles.addContactRow}>
          <View style={styles.addContactInput}>
            {renderInputField(
              "Contact Title",
              newContactTitle,
              setNewContactTitle,
              "Main Contact"
            )}
            {renderInputField(
              "Contact Email",
              newContactEmail,
              setNewContactEmail,
              "contact@example.com",
              false,
              formErrors?.contactEmail
            )}
          </View>
        </View>

        {contactEmail.map((contact, index) => (
          <View key={index} style={styles.contactItem}>
            <Text style={styles.contactItemTitle}>{contact.title}</Text>
            <Text style={styles.contactItemValue}>{contact.email}</Text>
            {contact.is_default && (
              <Text style={styles.defaultBadge}>Default</Text>
            )}
          </View>
        ))}
      </View>

      {/* Phone Contacts */}
      <View style={{ marginTop: 16 }}>
        <View style={styles.addContactRow}>
          <View style={styles.addContactInput}>
            {renderInputField(
              "Contact Title",
              newPhoneTitle,
              setNewPhoneTitle,
              "Main Contact"
            )}
            {renderInputField(
              "Contact Phone",
              newContactPhone,
              setNewContactPhone,
              "+1234567890",
              false,
              formErrors?.contactPhone
            )}
          </View>
        </View>
        {contactPhone.map((contact, index) => (
          <View key={index} style={styles.contactItem}>
            <Text style={styles.contactItemTitle}>{contact.title}</Text>
            <Text style={styles.contactItemValue}>{contact.number}</Text>
            {contact.is_default && (
              <Text style={styles.defaultBadge}>Default</Text>
            )}
          </View>
        ))}
      </View>
    </View>
  );

  const renderBasicInfoTab = () => (
    <View style={styles.tabContent}>
      <FFInputControl
        value={email}
        setValue={setEmail}
        label="Email"
        error={formErrors?.email}

      />
      <FFInputControl
        value={password}
        setValue={setPassword}
        label="Password"
        error={formErrors?.password}
        secureTextEntry
      />
      <FFInputControl
        value={firstName}
        setValue={setFirstName}
        label="First Name"
        error={formErrors?.firstName}

      />
      <FFInputControl
        value={lastName}
        setValue={setLastName}
        label="Last Name"
        error={formErrors?.lastName}

      />
      {renderContactSection()}
    </View>
  );

  const renderVehicleInfoTab = () => (
    <View style={styles.tabContent}>
      <FFInputControl
        label="License Plate"
        value={licensePlate}
        setValue={setLicensePlate}
        placeholder="Enter vehicle license plate"
        error={formErrors?.license_plate}
      />
      <FFInputControl
        label="Model"
        value={model}
        setValue={setModel}
        placeholder="Enter vehicle model"
        error={formErrors?.model}
      />
      <FFInputControl
        label="Color"
        value={color}
        setValue={setColor}
        placeholder="Enter vehicle color"
        error={formErrors?.color}
      />
    </View>
  );

  const renderTabs = () => {
    const tabs = ["Basic Info", "Vehicle Info"];
    return (
      <View style={styles.tabsContainer}>
        {tabs.map((tab, index) => (
          <TouchableOpacity
            key={index}
            style={[styles.tab, activeTab === index && styles.activeTab]}
            onPress={() => setActiveTab(index)}
          >
            <Text
              style={[
                styles.tabText,
                activeTab === index && styles.activeTabText,
              ]}
            >
              {tab}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    );
  };
console.log('check err  generl', formErrors)
  const renderSignUpForm = () => (
    <View style={styles.container}>
      <View
        style={{
          position: "absolute",
          right: 0,
          left: 0,
          top: -40,

          transform: [{ translateX: "40%" }],
        }}
      >
        <FFAvatar avatar={IMAGE_LINKS.APP_LOGO} />
      </View>
      <Text style={styles.headerText}>Sign Up</Text>
      {formErrors?.general && (
        <View style={{ width: '100%', justifyContent: 'center', paddingTop: spacing.sm, borderRadius: spacing.sm, backgroundColor: colors.ligth_error, alignItems: 'center' }}>
          <FFText style={styles.generalErrorText}>{formErrors.general}</FFText>

        </View>
      )}
      <View style={styles.switchAuthContainer}>
        <Text style={styles.switchAuthText}>Already have an account?</Text>
        <TouchableOpacity onPress={() => navigation?.navigate("Login")}>
          <Text style={styles.switchAuthLink}>Log In</Text>
        </TouchableOpacity>
      </View>

      {renderTabs()}
      {activeTab === 0 ? renderBasicInfoTab() : renderVehicleInfoTab()}

      {/* {error && <Text style={styles.errorText}>{error}</Text>} */}

      <Pressable onPress={handleSubmit}>
        <LinearGradient
          colors={["#63c550", "#a3d98f"]}
          start={[0, 0]}
          end={[1, 0]}
          style={styles.button}
        >
          <Text style={styles.buttonText}>Sign Up</Text>
        </LinearGradient>
      </Pressable>
    </View>
  );
  console.log('ehckec err', formErrors)
  const renderLoginForm = () => (
    <View style={styles.container}>
      <View
        style={{
          position: "absolute",
          right: 0,
          left: 0,
          top: -40,

          transform: [{ translateX: "40%" }],
        }}
      >
        <FFAvatar avatar={IMAGE_LINKS.APP_LOGO} />
      </View>
      <Text style={styles.headerText}>Login</Text>
      {formErrors?.general && (
        <View style={{ width: '100%', justifyContent: 'center', paddingTop: spacing.sm, borderRadius: spacing.sm, backgroundColor: colors.ligth_error, alignItems: 'center' }}>
          <FFText style={styles.generalErrorText}>{formErrors.general}</FFText>
        </View>
      )}
      <View style={styles.switchAuthContainer}>
        <Text style={styles.switchAuthText}>Don't have an account?</Text>
        <TouchableOpacity onPress={() => navigation?.navigate("Signup")}>
          <Text style={styles.switchAuthLink}>Sign Up</Text>
        </TouchableOpacity>
      </View>
      <FFInputControl
        value={email}
        setValue={setEmail}
        label="Email"
        error={formErrors?.email}

      />
      <FFInputControl
        value={password}
        setValue={setPassword}
        label="Password"
        error={formErrors?.password}
        secureTextEntry
      />

      {/* {error && <Text style={styles.errorText}>{error}</Text>} */}

      <Pressable onPress={handleSubmit}>
        <LinearGradient
          colors={["#63c550", "#a3d98f"]}
          start={[0, 0]}
          end={[1, 0]}
          style={styles.button}
        >
          <Text style={styles.buttonText}>Log In</Text>
        </LinearGradient>
      </Pressable>
    </View>
  );

  return isSignUp ? renderSignUpForm() : renderLoginForm();
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: "white",
    padding: 16,
    marginVertical: spacing.xxl,
    borderRadius: 16,
    width: "90%",
    shadowColor: "#b5b3a1",
    shadowOpacity: 0.1,
    shadowRadius: 5,
    shadowOffset: { width: 0, height: 2 },
    gap: 16,
    position: 'relative',
    alignSelf: "center",
  },
  headerText: {
    fontSize: 24,
    fontWeight: "bold",
    textAlign: "center",
  },
  generalErrorText: {
    color: "red",
    textAlign: "center",
    marginBottom: spacing.sm,
    fontSize: 14,
  },
  switchAuthContainer: {
    flexDirection: "row",
    gap: 4,
    alignItems: "center",
    marginTop: 8,
  },
  switchAuthText: {
    fontSize: 14,
  },
  switchAuthLink: {
    color: "#63c550",
    fontWeight: "600",
  },
  tabsContainer: {
    flexDirection: "row",
    marginBottom: 16,
    borderRadius: 8,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#63c550",
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: "center",
    backgroundColor: "white",
  },
  activeTab: {
    backgroundColor: "#63c550",
  },
  tabText: {
    color: "#63c550",
    fontWeight: "600",
  },
  activeTabText: {
    color: "white",
  },
  tabContent: {
    gap: 16,
  },
  inputContainer: {
    gap: 4,
  },
  inputLabel: {
    fontSize: 14,
    color: "#333",
  },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderRadius: 8,
    marginTop: 4,
  },
  inputField: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    fontSize: 14,
    color: "#333",
  },
  iconButton: {
    padding: 10,
  },
  errorText: {
    color: "red",
    fontSize: 12,
    marginTop: 4,
  },
  button: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 5,
    marginTop: 16,
  },
  buttonText: {
    color: "white",
    fontSize: 18,
    fontWeight: "bold",
  },
  contactSection: {
    marginTop: 24,
    gap: 16,
  },
  contactTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#333",
    marginBottom: 8,
  },
  addContactRow: {
    gap: 8,
  },
  addContactInput: {
    flex: 1,
    gap: 8,
  },
  addButton: {
    backgroundColor: "#63c550",
    padding: 12,
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 8,
  },
  addButtonText: {
    color: "white",
    fontWeight: "600",
  },
  contactItem: {
    backgroundColor: "#f5f5f5",
    padding: 12,
    borderRadius: 8,
    marginTop: 8,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  contactItemTitle: {
    fontSize: 14,
    color: "#666",
    flex: 1,
  },
  contactItemValue: {
    fontSize: 14,
    color: "#333",
    flex: 2,
  },
  defaultBadge: {
    fontSize: 12,
    color: "#63c550",
    fontWeight: "600",
    marginLeft: 8,
  },
});

export default FFAuthForm;
