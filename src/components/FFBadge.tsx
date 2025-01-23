import { View, Text, Pressable } from "react-native";
import React from "react";

type FFBadgeProps = {
  title: string;
  backgroundColor?: string;
  rounded?: 'sm' | 'md' | 'lg' | 'full';
  textColor?: string;
  onPress?: () => void
};

const FFBadge: React.FC<FFBadgeProps> = ({ title, backgroundColor = "blue", rounded = 'full', textColor='blue', onPress=()=>{} }) => {
  // Map rounded value to proper radius values
  const roundedMap = {
    sm: 4,
    md: 8,
    lg: 12,
    full: 9999,  // To create fully rounded badge
  };

  return (
    <Pressable 
      style={{
        backgroundColor, 
        borderRadius: roundedMap[rounded], 
        paddingHorizontal: 6,
        paddingVertical: 4,
      }} 
      // className="px-2 py-1 self-start"
      onPress={onPress}
    >
      <Text style={{color: textColor}} className=" font-bold">{title}</Text>
    </Pressable>
  );
};

export default FFBadge;
