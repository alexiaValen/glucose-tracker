// mobile-app/src/screens/MessagingScreen.tsx
import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert,
  Image,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RouteProp } from '@react-navigation/native';
import type { RootStackParamList } from '../types/navigation';
import { messageService, Message } from '../services/message.service';
import { conversationService } from '../services/conversation.service';
import { useAuthStore } from '../stores/authStore';
import { colors } from '../theme/colors';

type MessagingScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'Messaging'>;
type MessagingScreenRouteProp = RouteProp<RootStackParamList, 'Messaging'>;

interface Props {
  navigation: MessagingScreenNavigationProp;
  route: MessagingScreenRouteProp;
}

interface AttachedFile {
  uri: string;
  name: string;
  type: string;
  size: number;
}

export default function MessagingScreen({ navigation, route }: Props) {
  const { userId, userName, conversationId } = route.params;
  const { user } = useAuthStore();
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [attachedFile, setAttachedFile] = useState<AttachedFile | null>(null);
  const [showAttachmentMenu, setShowAttachmentMenu] = useState(false);
  const scrollViewRef = useRef<ScrollView>(null);

  // Use conversationId (new) or userId (legacy)
  const isConversationMode = !!conversationId;

  useEffect(() => {
    loadMessages();

    // Mark messages as read
    if (isConversationMode && conversationId) {
      conversationService.markAsRead(conversationId);
    } else if (userId) {
      messageService.markAsRead(userId);
    }

    // Poll for new messages every 5 seconds
    const interval = setInterval(loadMessages, 5000);
    return () => clearInterval(interval);
  }, [conversationId, userId]);

  useEffect(() => {
    // Request permissions on mount
    (async () => {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        console.log('Camera roll permissions not granted');
      }
    })();
  }, []);

  const loadMessages = async () => {
    try {
      let data: Message[] = [];

      if (isConversationMode && conversationId) {
        // New conversation-based API
        data = await conversationService.getMessages(conversationId) as any;
      } else if (userId) {
        // Legacy direct message API
        data = await messageService.getMessages(userId);
      }

      setMessages(data);
      setIsLoading(false);

      setTimeout(() => {
        scrollViewRef.current?.scrollToEnd({ animated: true });
      }, 100);
    } catch (error) {
      console.error('Failed to load messages:', error);
      setIsLoading(false);
    }
  };

  const handlePickImage = async () => {
    setShowAttachmentMenu(false);
    
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.8,
      base64: false,
    });

    if (!result.canceled && result.assets[0]) {
      const asset = result.assets[0];
      setAttachedFile({
        uri: asset.uri,
        name: asset.fileName || 'image.jpg',
        type: 'image',
        size: asset.fileSize || 0,
      });
    }
  };

  const handleTakePhoto = async () => {
    setShowAttachmentMenu(false);

    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Camera permission is required to take photos');
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      const asset = result.assets[0];
      setAttachedFile({
        uri: asset.uri,
        name: `photo_${Date.now()}.jpg`,
        type: 'image',
        size: asset.fileSize || 0,
      });
    }
  };

  const handlePickDocument = async () => {
    setShowAttachmentMenu(false);

    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
        copyToCacheDirectory: true,
      });

      // Check if user canceled or selected a document
      if (!result.canceled && result.assets && result.assets.length > 0) {
        const asset = result.assets[0];
        setAttachedFile({
          uri: asset.uri,
          name: asset.name,
          type: 'document',
          size: asset.size || 0,
        });
      }
    } catch (error) {
      console.error('Error picking document:', error);
      Alert.alert('Error', 'Failed to select document');
    }
  };

  const removeAttachment = () => {
    setAttachedFile(null);
  };

  const handleSendMessage = async () => {
    if ((!newMessage.trim() && !attachedFile) || isSending) return;

    setIsSending(true);
    try {
      // For now, just send the message text
      // TODO: Implement file upload to Supabase Storage
      let messageText = newMessage.trim();
      
      if (attachedFile) {
        // Placeholder for file upload
        // In production, upload to Supabase Storage and get URL
        messageText += `\nðŸ“Ž [Attachment: ${attachedFile.name}]`;
      }

      let message;
      if (isConversationMode && conversationId) {
        // New conversation-based API
        message = await conversationService.sendMessage(conversationId, messageText) as any;
      } else if (userId) {
        // Legacy direct message API
        message = await messageService.sendMessage(userId, messageText);
      }
      if (message) setMessages([...messages, message]);
      setNewMessage('');
      setAttachedFile(null);
      
      // Scroll to bottom
      setTimeout(() => {
        scrollViewRef.current?.scrollToEnd({ animated: true });
      }, 100);
    } catch (error) {
      console.error('Failed to send message:', error);
      Alert.alert('Error', 'Failed to send message');
    } finally {
      setIsSending(false);
    }
  };

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));

    if (hours < 1) {
      const minutes = Math.floor(diff / (1000 * 60));
      return minutes < 1 ? 'Just now' : `${minutes}m ago`;
    }
    if (hours < 24) {
      return `${hours}h ago`;
    }
    return date.toLocaleDateString();
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  const getFileIcon = (type: string) => {
    switch (type) {
      case 'image': return 'ðŸ–¼ï¸';
      case 'document': return 'ðŸ“„';
      default: return 'ðŸ“Ž';
    }
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.sage} />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={styles.container}
      keyboardVerticalOffset={90}
    >
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Text style={styles.backText}>â† Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{userName}</Text>
        <View style={{ width: 60 }} />
      </View>

      {/* Messages */}
      <ScrollView
        ref={scrollViewRef}
        style={styles.messagesContainer}
        contentContainerStyle={styles.messagesContent}
        showsVerticalScrollIndicator={false}
      >
        {messages.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>No messages yet</Text>
            <Text style={styles.emptySubtext}>Start a conversation!</Text>
          </View>
        ) : (
          messages.map((message, index) => {
            const isOwnMessage = message.sender_id === user?.id;
            return (
              <View
                key={message.id || index}
                style={[
                  styles.messageRow,
                  isOwnMessage ? styles.ownMessageRow : styles.otherMessageRow,
                ]}
              >
                <View
                  style={[
                    styles.messageBubble,
                    isOwnMessage ? styles.ownMessageBubble : styles.otherMessageBubble,
                  ]}
                >
                  <Text
                    style={[
                      styles.messageText,
                      isOwnMessage ? styles.ownMessageText : styles.otherMessageText,
                    ]}
                  >
                    {message.message}
                  </Text>
                  <Text
                    style={[
                      styles.messageTime,
                      isOwnMessage ? styles.ownMessageTime : styles.otherMessageTime,
                    ]}
                  >
                    {formatTime(message.created_at)}
                  </Text>
                </View>
              </View>
            );
          })
        )}
      </ScrollView>

      {/* Attachment Preview */}
      {attachedFile && (
        <View style={styles.attachmentPreview}>
          <View style={styles.attachmentContent}>
            {attachedFile.type === 'image' ? (
              <Image source={{ uri: attachedFile.uri }} style={styles.attachmentImage} />
            ) : (
              <View style={styles.documentPreview}>
                <Text style={styles.documentIcon}>{getFileIcon(attachedFile.type)}</Text>
              </View>
            )}
            <View style={styles.attachmentInfo}>
              <Text style={styles.attachmentName} numberOfLines={1}>
                {attachedFile.name}
              </Text>
              <Text style={styles.attachmentSize}>{formatFileSize(attachedFile.size)}</Text>
            </View>
          </View>
          <TouchableOpacity onPress={removeAttachment} style={styles.removeButton}>
            <Text style={styles.removeButtonText}>âœ•</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Attachment Menu */}
      {showAttachmentMenu && (
        <View style={styles.attachmentMenu}>
          <TouchableOpacity style={styles.menuItem} onPress={handleTakePhoto}>
            <Text style={styles.menuIcon}>ðŸ“·</Text>
            <Text style={styles.menuText}>Take Photo</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.menuItem} onPress={handlePickImage}>
            <Text style={styles.menuIcon}>ðŸ–¼ï¸</Text>
            <Text style={styles.menuText}>Choose Photo</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.menuItem} onPress={handlePickDocument}>
            <Text style={styles.menuIcon}>ðŸ“„</Text>
            <Text style={styles.menuText}>Choose Document</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.menuItem, styles.menuItemCancel]} 
            onPress={() => setShowAttachmentMenu(false)}
          >
            <Text style={styles.menuTextCancel}>Cancel</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Input */}
      <View style={styles.inputContainer}>
        <TouchableOpacity
          style={styles.attachButton}
          onPress={() => setShowAttachmentMenu(!showAttachmentMenu)}
        >
          <Text style={styles.attachButtonText}>ðŸ“Ž</Text>
        </TouchableOpacity>
        <TextInput
          style={styles.input}
          placeholder="Type a message..."
          placeholderTextColor={colors.textLight}
          value={newMessage}
          onChangeText={setNewMessage}
          multiline
          maxLength={500}
        />
        <TouchableOpacity
          style={[
            styles.sendButton,
            (!newMessage.trim() && !attachedFile || isSending) && styles.sendButtonDisabled
          ]}
          onPress={handleSendMessage}
          disabled={(!newMessage.trim() && !attachedFile) || isSending}
        >
          <Text style={styles.sendButtonText}>
            {isSending ? '...' : 'Send'}
          </Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.cream,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.cream,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 60,
    paddingBottom: 16,
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  backButton: {
    width: 60,
  },
  backText: {
    color: colors.sage,
    fontSize: 16,
    fontWeight: '500',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.charcoal,
  },
  messagesContainer: {
    flex: 1,
  },
  messagesContent: {
    padding: 16,
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.textDark,
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: colors.textLight,
  },
  messageRow: {
    marginBottom: 12,
    flexDirection: 'row',
  },
  ownMessageRow: {
    justifyContent: 'flex-end',
  },
  otherMessageRow: {
    justifyContent: 'flex-start',
  },
  messageBubble: {
    maxWidth: '75%',
    borderRadius: 16,
    padding: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  ownMessageBubble: {
    backgroundColor: colors.sage,
    borderBottomRightRadius: 4,
  },
  otherMessageBubble: {
    backgroundColor: colors.white,
    borderBottomLeftRadius: 4,
  },
  messageText: {
    fontSize: 15,
    lineHeight: 20,
    marginBottom: 4,
  },
  ownMessageText: {
    color: colors.white,
  },
  otherMessageText: {
    color: colors.textDark,
  },
  messageTime: {
    fontSize: 11,
    fontWeight: '500',
  },
  ownMessageTime: {
    color: 'rgba(255,255,255,0.7)',
  },
  otherMessageTime: {
    color: colors.textLight,
  },

  // Attachment Preview
  attachmentPreview: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    marginHorizontal: 16,
    marginBottom: 8,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  attachmentContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  attachmentImage: {
    width: 50,
    height: 50,
    borderRadius: 8,
    marginRight: 12,
  },
  documentPreview: {
    width: 50,
    height: 50,
    borderRadius: 8,
    backgroundColor: colors.cream,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  documentIcon: {
    fontSize: 28,
  },
  attachmentInfo: {
    flex: 1,
  },
  attachmentName: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textDark,
    marginBottom: 2,
  },
  attachmentSize: {
    fontSize: 12,
    color: colors.textLight,
  },
  removeButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
  },
  removeButtonText: {
    fontSize: 16,
    color: colors.textLight,
    fontWeight: '600',
  },

  // Attachment Menu
  attachmentMenu: {
    backgroundColor: colors.white,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingVertical: 8,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 20,
  },
  menuItemCancel: {
    borderTopWidth: 1,
    borderTopColor: colors.border,
    justifyContent: 'center',
  },
  menuIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  menuText: {
    fontSize: 16,
    color: colors.textDark,
    fontWeight: '500',
  },
  menuTextCancel: {
    fontSize: 16,
    color: colors.textLight,
    fontWeight: '600',
  },

  // Input
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: colors.white,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  attachButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  attachButtonText: {
    fontSize: 24,
  },
  input: {
    flex: 1,
    minHeight: 40,
    maxHeight: 100,
    backgroundColor: colors.cream,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 15,
    color: colors.textDark,
  },
  sendButton: {
    marginLeft: 8,
    paddingHorizontal: 20,
    paddingVertical: 10,
    backgroundColor: colors.sage,
    borderRadius: 20,
    height: 40,
    justifyContent: 'center',
  },
  sendButtonDisabled: {
    backgroundColor: colors.lightSage,
    opacity: 0.5,
  },
  sendButtonText: {
    color: colors.white,
    fontSize: 15,
    fontWeight: '600',
  },
});