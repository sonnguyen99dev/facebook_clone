import { Container, Stack } from "@mui/material";
import React, { useEffect, useState } from "react";
import "./Message.css";
import ChatBox from "./component/ChatBox";
import { useDispatch, useSelector } from "react-redux";
import { getFriends } from "../friend/friendSlice";
import useOnline from "../../hooks/onlineUser";
import useChat from "../../hooks/useChat";
import { useFetchLatestMessage } from "../../utils/fetchLastMessage";
import moment from "moment";
import {
  unreadNotificationsfnc,
  useFetchRecipientUser,
} from "../../utils/FetchRecipientUser";
import useAuth from "../../hooks/useAuth";

function Message() {
  const [filterName, setFilterName] = useState("");
  const [page, setPage] = useState(1);
  const [toUserId, setToUserId] = useState("");
  const [unreadNotifications, setUnreadNotifications] = useState([])

  const [users, setUsers] = useState([]);

  const { createChat, chats, currentChat, notifications } = useChat();
  const { onlineUsers } = useOnline();

  // check giờ cuối cùng nhắn tin
  const { latesMessage } = useFetchLatestMessage(currentChat);

  const { currentPageUsers, usersById } = useSelector((state) => state.friend);
  const dispatch = useDispatch();

  // hàm check tin nhắn chưa đọc từ socket
  const checkUnreadNotifications = (notifications) => {
    const data =  unreadNotificationsfnc(notifications);
    setUnreadNotifications(data)
  }
  
  useEffect(() => {
    notifications && checkUnreadNotifications(notifications)
  },[notifications])


  useEffect(() => {
    const updatedUsers = currentPageUsers.map((userId) => usersById[userId]);
    setUsers(updatedUsers);
  }, [currentPageUsers, usersById]);

  useEffect(() => {
    dispatch(getFriends({ filterName, page }));
  }, [filterName, page, dispatch]);

  // mở chats thì ở trạng thái đã xem
  useEffect(() => {
    toUserId !== "" && createChat({ toUserId });
    const dataUnreadNotificationsChatsOpen = unreadNotifications.filter((item) => item.recipientId !== toUserId)
    checkUnreadNotifications(dataUnreadNotificationsChatsOpen)
  }, [toUserId]);

  // check xem có bao nhiêu tin nhắn chưa đọc và update lại user khi mở chats
  useEffect(() => {
    const updatedUsers = users.map((user) => {
    const notificationCount = unreadNotifications.filter((item) => item.recipientId === user._id).length;
    return { ...user, notification: notificationCount };
    });
    setUsers(updatedUsers)
  }, [unreadNotifications,toUserId]);

  return (
    <Container>
      <Stack
        gap={4}
        className=""
        style={{ display: "flex", alignItems: "start", flexDirection: "row" }}
      >
        <Stack
          gap={3}
          className="messages_box"
          style={{
            paddingRight: "1rem",
            flexGrow: "0",
            display: "flex",
            flex: "1 1 auto",
            flexDirection: "column",
            alignSelf: "stretch",
          }}
        >
          <div style={{ cursor: "pointer" }}>
            {users?.map((item) => (
              <Stack
                key={item._id}
                gap={3}
                direction="row"
                role="button"
                className="user_card"
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  marginBottom: "20px",
                }}
                onClick={() => setToUserId(item?._id)}
              >
                <div style={{ display: "flex" }}>
                  <div>{/* <img src={avarter} height="35px" /> */}</div>
                  <div className="text_content">
                    <div className="name">{item?.name}</div>
                    <div className="text">
                      <span>{item?.jobTitle || "updating"}</span>
                    </div>
                  </div>
                </div>

                <div style={{ display: "flex", alignItems: "center" }}>
                  <div className="date">
                    {moment(latesMessage?.createdAt).calendar()}
                  </div>
                  <div
                    className={
                      item?.notification > 0 ? "this_user_notifications" : ""
                    }
                  >
                    {item?.notification > 0 ? item?.notification : ""}
                  </div>
                  <span
                    className={
                      onlineUsers?.some((user) => user?.userId === item?._id)
                        ? "user_online"
                        : ""
                    }
                  ></span>
                </div>
              </Stack>
            ))}
          </div>
        </Stack>
        <ChatBox />
      </Stack>
    </Container>
  );
}

export default Message;
