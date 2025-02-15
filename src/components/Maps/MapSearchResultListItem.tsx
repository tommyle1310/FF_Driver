import React from "react";
import { StyleSheet, View, Text, TouchableOpacity } from "react-native";
import IconEntypo from "react-native-vector-icons/Entypo";
import MapSearchResultSuggestions from "./MapSearchResultSuggestion";

const MapSearchResultListItem = (props: any) => {
  return (
    <TouchableOpacity onPress={() => props.onPressItem(props.item)}>
      <View style={styles.searchListItem}>
        <IconEntypo name={"location-pin"} style={styles.icon} />
        <View>
          <Text style={styles.searchListItemTitle}>{props.item.p1}</Text>
          {props.item.p2 && props.item.p3 && (
            <Text>
              {props.item.p2}, {props.item.p3}
            </Text>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  searchListItem: {
    flexDirection: "row",
    padding: 10,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#ddd",
  },
  searchListItemTitle: {
    fontWeight: "bold",
  },
  icon: {
    marginRight: 10,
  },
});

export default MapSearchResultListItem;
