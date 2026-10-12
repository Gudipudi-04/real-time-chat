
import { useEffect, useState } from "react";
import { io } from "socket.io-client";
import "./App.css";
const socket = io("https://real-time-chat-server-okkd.onrender.com", { autoConnect: false });

export default function App() {
  const [username, setUsername] = useState("");
  const [joined, setJoined] = useState(false);
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState([]);
  const [users, setUsers] = useState([]);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    socket.on("connect", () => setConnected(true));
    socket.on("disconnect", () => setConnected(false));
    socket.on("chatMessage", (msg) =>
      setMessages((prev) => [...prev, { ...msg, type: "chat" }])
    );
    socket.on("systemMessage", (text) =>
      setMessages((prev) => [
        ...prev,
        { id: `${Date.now()}-${Math.random()}`, text, type: "system" },
      ])
    );
    socket.on("users", setUsers);

    return () => {
      socket.off("connect");
      socket.off("disconnect");
      socket.off("chatMessage");
      socket.off("systemMessage");
      socket.off("users");
    };
  }, []);

  function joinChat(e) {
    e.preventDefault();
    const name = username.trim();
    if (!name) return;
    if (!socket.connected) socket.connect();
    socket.emit("join", name);
    setUsername(name);
    setJoined(true);
  }

  function sendMessage(e) {
    e.preventDefault();
    if (!message.trim() || !socket.connected) return;
    socket.emit("chatMessage", message);
    setMessage("");
  }

  return (
    <main className="app">
      {!joined ? (
        <form className="join-card" onSubmit={joinChat}>
          <div className="logo">✦</div>
          <h1>ChatSpace</h1>
          <p>Your little corner of conversation.</p>
          <label htmlFor="username">Your display name</label>
          <input
            id="username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="Enter your name"
            maxLength={30}
            required
          />
          <button type="submit">Join the conversation →</button>
        </form>
      ) : (
        <section className="chat-card">
          <header className="topbar">
            <div className="brand">
              <div className="logo small">✦</div>
              <div>
                <h1>ChatSpace</h1>
                <p>{connected ? "● Connected" : "○ Connecting..."}</p>
              </div>
            </div>
            <div className="profile">{username.charAt(0).toUpperCase()}</div>
          </header>

          <div className="chat-layout">
            <aside className="sidebar">
              <h3>ONLINE MEMBERS</h3>
              {users.map((user, i) => (
                <div className="user" key={`${user}-${i}`}>
                  <span className="online-dot" />
                  {user}
                </div>
              ))}
            </aside>

            <div className="conversation">
              <div className="welcome">
                <span>✦</span>
                <h2>Welcome to the chat!</h2>
                <p>Say hello and start a conversation.</p>
              </div>

              <div className="messages">
                {messages.map((msg, i) =>
                  msg.type === "system" ? (
                    <p className="system-message" key={msg.id || i}>
                      {msg.text}
                    </p>
                  ) : (
                    <div
                      className={`message ${
                        msg.username === username ? "mine" : ""
                      }`}
                      key={msg.id || i}
                    >
                      <strong>{msg.username}</strong>
                      <p>{msg.text}</p>
                      <time>{msg.time}</time>
                    </div>
                  )
                )}
              </div>

              <form className="message-form" onSubmit={sendMessage}>
                <input
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Write a message..."
                  maxLength={1000}
                  disabled={!connected}
                />
                <button disabled={!connected || !message.trim()}>
                  Send ↑
                </button>
              </form>
            </div>
          </div>
        </section>
      )}
      <footer>ChatSpace · Made for good conversations</footer>
    </main>
  );
}
