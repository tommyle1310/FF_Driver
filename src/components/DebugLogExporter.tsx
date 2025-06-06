import React, { useState } from 'react';
import { View, Alert, Share } from 'react-native';
import FFButton from './FFButton';
import FFText from './FFText';
import { debugLogger } from '../utils/debugLogger';

const DebugLogExporter: React.FC = () => {
  const [isExporting, setIsExporting] = useState(false);

  const exportLogs = async () => {
    try {
      setIsExporting(true);
      const logs = await debugLogger.exportLogs();
      
      // Try to share the logs
      await Share.share({
        message: logs,
        title: 'Debug Logs',
      });
    } catch (error) {
      Alert.alert('Error', 'Failed to export logs: ' + error);
    } finally {
      setIsExporting(false);
    }
  };

  const clearLogs = async () => {
    Alert.alert(
      'Clear Logs',
      'Are you sure you want to clear all debug logs?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear',
          style: 'destructive',
          onPress: async () => {
            await debugLogger.clearLogs();
            Alert.alert('Success', 'Logs cleared successfully');
          },
        },
      ]
    );
  };

  return (
    <View style={{ padding: 16, gap: 12 }}>
      <FFText fontWeight="bold">Debug Tools</FFText>
      
      <FFButton
        onPress={exportLogs}
        disabled={isExporting}
        variant="primary"
      >
        {isExporting ? 'Exporting...' : 'Export Debug Logs'}
      </FFButton>
      
      <FFButton
        onPress={clearLogs}
        variant="secondary"
      >
        Clear Logs
      </FFButton>
    </View>
  );
};

export default DebugLogExporter;
