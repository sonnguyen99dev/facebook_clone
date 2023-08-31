import { createContext, useState } from "react";
import apiService from "../app/apiService";
import { useEffect } from "react";
import useAuth from "../hooks/useAuth";

export const ChatContext = createContext();

export const ChatContextProvider = ({ children }) => {
  const [messages, setMessages] = useState(null);
  const [chats, setChats] = useState(null);
  const [currentChat, setCurrentChat] = useState(null);
  const [newMessage, setNewMessage] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const { user, socket } = useAuth();
  // send message
  useEffect(() => {
    if (socket === null) return;
    // lấy người đang nhắn recipientId
    chats &&
      newMessage &&
      socket.emit("sendMessage", {
        ...newMessage,
        recipientId: chats?.to == user._id ? chats.to : chats?.from,
      });
  }, [newMessage]);

  useEffect(() => {
    if (socket === null) return;
    socket.on("getMessage", (res) => {
      if (chats?._id !== res.chatId) return;
      setMessages((prev) => [...prev, res]);
    });
    socket.on("getNotification", (res) => {
      const isChatOpen =
        chats === null
          ? false
          : (chats?.to || chats?.from) === res.recipientId
          ? true
          : false;
      if (isChatOpen) {
        setNotifications((prev) => [{ ...res, isRead: true }, ...prev]);
      } else {
        setNotifications((prev) => [res, ...prev]);
      }
    });
    return () => {
      socket.off("getMessage"); 
      socket.off("getNotification");
    };
  }, [socket, newMessage, chats]);

  useEffect(() => {
    const getUseChat = async () => {
      if (user?._id) {
        const response = await apiService.get(`/chat/${user._id}`);
        setCurrentChat(response.data);
      }
    };

    getUseChat();
  }, [user]);

  const createChat = async ({ toUserId }) => {
    const response = await apiService.post("/chat/request", { toUserId });
    setChats(response.data);
  };

  const getMessage = async ({ chatId }) => {
    const response = await apiService.get(`/message/${chatId}`);
    setMessages(response.data);
  };

  const createSendMessage = async ({ receiverId, chatId, text }) => {
    const response = await apiService.post("/message/send", {
      receiverId,
      chatId,
      text,
    });
    setNewMessage(response.data);
    setMessages((prev) => [...prev, response.data]);
  };
  return (
    <ChatContext.Provider
      value={{
        createSendMessage,
        createChat,
        getMessage,
        messages,
        chats,
        newMessage,
        currentChat,
        notifications,
      }}
    >
      {children}
    </ChatContext.Provider>
  );
};
