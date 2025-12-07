import { KinInputProps } from '@/types';
import { Text, TextInput, TouchableOpacity, View } from 'react-native';



export default function KinInput({
  icon: Icon,
  placeholder,
  value,
  onChangeText,
  error,
  rightIcon: RightIcon,
  onRightIconPress,
  ...textInputProps
}: KinInputProps) {
  return (
    <View className="mb-4">
      <View className={`flex-row items-center bg-kin-midnight rounded-2xl px-4 h-16 border ${error ? 'border-red-500' : 'border-kin-slate'}`}>
        <Icon color={error ? "#EF4444" : "#7077A1"} size={20} />
        <TextInput 
          className="flex-1 ml-3 font-outfit text-kin-white text-base"
          placeholder={placeholder}
          placeholderTextColor="#7077A1"
          value={value}
          onChangeText={onChangeText}
          {...textInputProps}
        />
        {RightIcon && onRightIconPress && (
          <TouchableOpacity onPress={onRightIconPress}>
            <RightIcon color="#7077A1" size={20} />
          </TouchableOpacity>
        )}
      </View>
      {error && <Text className="text-red-500 text-sm mt-1 ml-2 font-outfit">{error}</Text>}
    </View>
  );
}
