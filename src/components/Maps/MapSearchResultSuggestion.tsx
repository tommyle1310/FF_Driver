import React, { useRef } from "react";
import {
  StyleSheet,
  View,
  TextInput,
  FlatList,
  Text,
  TouchableWithoutFeedback,
  Keyboard,
} from "react-native";
import MapSearchResultListItem from "./MapSearchResultListItem";

interface SuggestionsProps {
  placeholder: string;
  showList: boolean;
  suggestionListData: any[];
  onPressItem: (item: any) => void;
  handleSearchTextChange: (text: string) => void;
}

const MapSearchResultSuggestions: React.FC<SuggestionsProps> = (props) => {
  const searchInputRef = useRef<TextInput>(null);

  // Handle item press from suggestion list
  const handleOnPressItem = (item: any) => {
    searchInputRef.current?.blur(); // Remove focus from the search input
    props.onPressItem(item); // Trigger the callback on item press
  };

  // Close the suggestion list and dismiss keyboard when tapping outside
  const handleDismissSuggestions = () => {
    props.onPressItem(null); // Optionally you can pass null or any other callback to close the suggestions
    Keyboard.dismiss(); // Close the keyboard
  };

  return (
    <TouchableWithoutFeedback onPress={handleDismissSuggestions}>
      <View style={styles.suggestionListContainer}>
        <View style={styles.searchContainer}>
          {/* Search Input */}
          <TextInput
            ref={searchInputRef}
            style={styles.searchInput}
            placeholder={props.placeholder}
            onChangeText={props.handleSearchTextChange}
          />

          {/* Suggestion List */}
          {props.showList && (
            <FlatList
              style={styles.searchList}
              data={props.suggestionListData}
              keyExtractor={(item, index) => index.toString()}
              renderItem={({ item }) => (
                <MapSearchResultListItem
                  onPressItem={handleOnPressItem}
                  item={item}
                />
              )}
            />
          )}
        </View>
      </View>
    </TouchableWithoutFeedback>
  );
};

const styles = StyleSheet.create({
  suggestionListContainer: {
    width: "100%",
    position: "absolute", // Ensure the list container stays above the map
    top: 0, // Ensure it's placed at the top of the screen or map
    left: 0,
    right: 0,
    zIndex: 100, // High z-index to place the list above the map
  },
  searchContainer: {
    position: "absolute", // Position relative to suggestionListContainer
    top: 10, // Space from the top
    left: "5%", // Adjust for left margin
    right: "5%", // Adjust for right margin
    zIndex: 200, // Make sure it's above the map
  },
  searchInput: {
    height: 40,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#ccc",
    paddingLeft: 10,
    paddingRight: 10,
    backgroundColor: "white", // Background color to ensure visibility over the map
    zIndex: 2, // Ensure it stays above the map
  },
  searchList: {
    borderRadius: 10,
    elevation: 10,
    marginTop: 60, // Make space for the search input
    position: "absolute", // Absolutely positioned to float above the map
    top: 0, // Starts right below the search input
    left: 0,
    right: 0,
    maxHeight: 200, // Limit list height
    zIndex: 1, // Ensure it appears above other content on the map
  },
});

export default MapSearchResultSuggestions;
