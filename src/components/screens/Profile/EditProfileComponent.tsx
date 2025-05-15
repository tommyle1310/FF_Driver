import { View, TouchableOpacity, StyleSheet, ScrollView } from "react-native";
import React, { useEffect, useState } from "react";
import FFAvatar from "../../FFAvatar";
import FFInputControl from "../../FFInputControl";
import axiosInstance from "@/src/utils/axiosConfig";
import { useDispatch, useSelector } from "@/src/store/types";
import { RootState } from "@/src/store/store";
import * as ImagePicker from "expo-image-picker";
import useUploadImage from "@/src/hooks/useUploadImage";
import {
  setAuthState,
  setAvatarInAsyncStorage,
  updateProfile,
} from "@/src/store/authSlice";
import FFSpinner from "../../FFSpinner";
import FFModal from "../../FFModal";
import FFText from "../../FFText";
import FFButton from "../../FFButton";
import { colors, spacing } from "@/src/theme";

interface ContactEmail {
  title: string;
  email: string;
  is_default: boolean;
}

interface ContactPhone {
  title: string;
  number: string;
  is_default: boolean;
}

const EditProfileComponent = () => {
  const {
    avatar,
    driverId,
    first_name,
    last_name,
    contact_email,
    contact_phone,
  } = useSelector((state: RootState) => state.auth);
  const dispatch = useDispatch();

  const [firstName, setFirstName] = useState(first_name || "");
  const [lastName, setLastName] = useState(last_name || "");
  const [contactEmails, setContactEmails] = useState<ContactEmail[]>(
    contact_email || [{ title: "Primary", email: "", is_default: true }]
  );
  const [contactPhones, setContactPhones] = useState<ContactPhone[]>(
    contact_phone || [{ title: "Primary", number: "", is_default: true }]
  );

  const [isLoading, setIsLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [modalMessage, setModalMessage] = useState("");
  const [modalType, setModalType] = useState<"success" | "error">("success");

  const {
    imageUri,
    setImageUri,
    uploadImage,
    responseData,
    loading: isUploading,
  } = useUploadImage("DRIVER", driverId || "");

  const showModal = (message: string, type: "success" | "error") => {
    setModalMessage(message);
    setModalType(type);
    setModalVisible(true);
  };

  const selectImage = async () => {
    try {
      let result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 1,
      });

      if (result && result.assets && result.assets.length > 0) {
        const asset = result.assets[0];
        setImageUri(asset.uri);
        await uploadImage(asset.uri);
      }
    } catch (error: any) {
      showModal(
        `Failed to select image: ${error.message || "Unknown error"}`,
        "error"
      );
    }
  };

  useEffect(() => {
    if (responseData?.avatar) {
      dispatch(setAvatarInAsyncStorage(responseData.avatar));
      showModal("Avatar updated successfully", "success");
    }
  }, [responseData]);

  const handleContactEmailsChange = (newEmails: ContactEmail[]) => {
    setContactEmails(newEmails);
  };

  const handleContactPhonesChange = (newPhones: ContactPhone[]) => {
    setContactPhones(newPhones);
  };

  const addContactEmail = () => {
    const newEmails = [
      ...contactEmails,
      { title: "", email: "", is_default: false },
    ];
    handleContactEmailsChange(newEmails);
  };

  const addContactPhone = () => {
    const newPhones = [
      ...contactPhones,
      { title: "", number: "", is_default: false },
    ];
    handleContactPhonesChange(newPhones);
  };

  const updateContactEmail = (
    index: number,
    field: keyof ContactEmail,
    value: string | ((prevValue: string) => string)
  ) => {
    const newEmails = [...contactEmails];
    const currentValue = newEmails[index][field];
    const newValue =
      typeof value === "function" ? value(currentValue as string) : value;
    newEmails[index] = { ...newEmails[index], [field]: newValue };
    handleContactEmailsChange(newEmails);
  };

  const updateContactPhone = (
    index: number,
    field: keyof ContactPhone,
    value: string | ((prevValue: string) => string)
  ) => {
    const newPhones = [...contactPhones];
    const currentValue = newPhones[index][field];
    const newValue =
      typeof value === "function" ? value(currentValue as string) : value;
    newPhones[index] = { ...newPhones[index], [field]: newValue };
    handleContactPhonesChange(newPhones);
  };

  const removeContactEmail = (index: number) => {
    const newEmails = contactEmails.filter((_, i) => i !== index);
    handleContactEmailsChange(newEmails);
  };

  const removeContactPhone = (index: number) => {
    const newPhones = contactPhones.filter((_, i) => i !== index);
    handleContactPhonesChange(newPhones);
  };

  const handleSubmit = async () => {
    try {
      setIsLoading(true);
      const response = await axiosInstance.patch(`/drivers/${driverId}`, {
        first_name: firstName,
        last_name: lastName,
        contact_email: contactEmails,
        contact_phone: contactPhones,
      });

      if (response.data.EC === 0) {
        await dispatch(
          updateProfile({
            first_name: firstName,
            last_name: lastName,
            contact_email: contactEmails,
            contact_phone: contactPhones,
          })
        );
        showModal("Profile updated successfully", "success");
      } else {
        showModal(response.data.EM || "Failed to update profile", "error");
      }
    } catch (error) {
      showModal("Failed to update profile", "error");
    } finally {
      setIsLoading(false);
    }
  };

  if (isUploading) {
    return <FFSpinner isVisible={isUploading} />;
  }

  return (
    <ScrollView>
      <View style={styles.container}>
        <View style={styles.avatarContainer}>
          <TouchableOpacity onPress={selectImage}>
            {imageUri ? (
              <FFAvatar onPress={selectImage} size={80} avatar={imageUri} />
            ) : (
              <FFAvatar onPress={selectImage} avatar={avatar?.url} size={80} />
            )}
          </TouchableOpacity>
        </View>

        <FFInputControl
          value={firstName}
          setValue={setFirstName}
          label="First Name"
          placeholder="Enter first name"
          error=""
        />
        <FFInputControl
          value={lastName}
          setValue={setLastName}
          label="Last Name"
          placeholder="Enter last name"
          error=""
        />

        <View style={styles.contactSection}>
          <FFText style={styles.sectionTitle}>Contact Emails</FFText>
          {contactEmails.map((email, index) => (
            <View key={index} style={styles.contactItem}>
              <FFInputControl
                value={email.title}
                setValue={(value) => updateContactEmail(index, "title", value)}
                label="Title"
                placeholder="e.g. Work, Home"
                error=""
              />
              <FFInputControl
                value={email.email}
                setValue={(value) => updateContactEmail(index, "email", value)}
                label="Email"
                placeholder="email@example.com"
                error=""
              />
              {index > 0 && (
                <TouchableOpacity
                  style={styles.removeButton}
                  onPress={() => removeContactEmail(index)}
                >
                  <FFText style={styles.removeButtonText}>Remove</FFText>
                </TouchableOpacity>
              )}
            </View>
          ))}
          <TouchableOpacity style={styles.addButton} onPress={addContactEmail}>
            <FFText style={styles.addButtonText}>+ Add Email</FFText>
          </TouchableOpacity>
        </View>

        <View style={styles.contactSection}>
          <FFText style={styles.sectionTitle}>Contact Phones</FFText>
          {contactPhones.map((phone, index) => (
            <View key={index} style={styles.contactItem}>
              <FFInputControl
                value={phone.title}
                setValue={(value) => updateContactPhone(index, "title", value)}
                label="Title"
                placeholder="e.g. Mobile, Work"
                error=""
              />
              <FFInputControl
                value={phone.number}
                setValue={(value) => updateContactPhone(index, "number", value)}
                label="Number"
                placeholder="(+84) XXXXXXXXX"
                error=""
              />
              {index > 0 && (
                <TouchableOpacity
                  style={styles.removeButton}
                  onPress={() => removeContactPhone(index)}
                >
                  <FFText style={styles.removeButtonText}>Remove</FFText>
                </TouchableOpacity>
              )}
            </View>
          ))}
          <TouchableOpacity style={styles.addButton} onPress={addContactPhone}>
            <FFText style={styles.addButtonText}>+ Add Phone</FFText>
          </TouchableOpacity>
        </View>

        <FFButton
          variant="primary"
          onPress={handleSubmit}
          style={styles.submitButton}
        >
          Update Profile
        </FFButton>
      </View>

      <FFModal visible={modalVisible} onClose={() => setModalVisible(false)}>
        <View style={styles.modalContent}>
          <FFText>{modalMessage}</FFText>
        </View>
      </FFModal>

      <FFSpinner isVisible={isLoading} isOverlay />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    elevation: 10,
    backgroundColor: colors.white,
    borderRadius: 12,
    marginBottom: spacing.xxxl,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    gap: spacing.md,
  },
  avatarContainer: {
    alignItems: "center",
  },
  contactSection: {
    gap: spacing.sm,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: spacing.xs,
  },
  contactItem: {
    gap: spacing.xs,
    paddingBottom: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  addButton: {
    padding: spacing.sm,
    backgroundColor: colors.backgroundSecondary,
    borderRadius: 8,
    alignItems: "center",
  },
  addButtonText: {
    color: colors.primary,
    fontWeight: "600",
  },
  removeButton: {
    alignSelf: "flex-end",
    padding: spacing.xs,
  },
  removeButtonText: {
    color: colors.error,
    fontSize: 14,
  },
  submitButton: {
    marginTop: spacing.md,
  },
  modalContent: {
    padding: spacing.md,
    borderRadius: 8,
    alignItems: "center",
  },
  modalText: {
    fontSize: 16,
    textAlign: "center",
  },
  errorText: {
    color: colors.error,
  },
});

export default EditProfileComponent;
