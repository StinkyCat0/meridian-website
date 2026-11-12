// src/pages/auth/Dashboard/ChatRoom.jsx - Enhanced Chat with Hover Sidebar, Threading, Glass UI
import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { io } from 'socket.io-client';
import { motion } from 'framer-motion'; // ← Required for <motion.aside>
import { apiUrl, assetUrl, socketOrigin, getToken } from '../../../lib/api';
import { 
  Send, Paperclip, Smile, MoreVertical, Image as ImageIcon, 
  File as FileIcon, X, ChevronDown, Plus, Minus, Reply, 
  Edit2, Trash2, MessageSquare, Hash, PanelLeftClose, PanelLeftOpen,
  ArrowLeft, Settings, Users, Bell, Lock
} from 'lucide-react';

// Default rooms (will be replaced by API in production)
const DEFAULT_ROOMS = [
  { id: 'general', name: 'General', description: 'Main discussion', isReadOnly: false },
  { id: 'support', name: 'Support', description: 'Get help', isReadOnly: false },
  { id: 'random', name: 'Random', description: 'Off-topic chat', isReadOnly: false },
  { id: 'announcements', name: 'Announcements', description: 'Read-only updates', isReadOnly: true },
];

const REACTION_EMOJIS = ['👍', '❤️', '😂', '😮', '😢', '🎉', '🔥', '👀'];

export default function ChatRoom() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [typingUsers, setTypingUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedRoom, setSelectedRoom] = useState('general');
  const [sidebarOpen, setSidebarOpen] = useState(true); // Manual toggle state
  const [isHoveringSidebar, setIsHoveringSidebar] = useState(false); // Hover state
  const [showEmojiPicker, setShowEmojiPicker] = useState(null);
  const [showFileUpload, setShowFileUpload] = useState(false);
  const [selectedAttachment, setSelectedAttachment] = useState(null);
  const [replyingTo, setReplyingTo] = useState(null);
  const [expandedThreads, setExpandedThreads] = useState({});
  const [messageMenuOpen, setMessageMenuOpen] = useState(null);
  
  const messagesEndRef = useRef(null);
  const socketRef = useRef(null);
  const fileInputRef = useRef(null);
  const sidebarRef = useRef(null);

  // Compute effective sidebar state: expanded if manually open OR hovering
  const isSidebarExpanded = sidebarOpen || isHoveringSidebar;

  useEffect(() => {
    const token = getToken();
    if (!token) {
      navigate('/login');
      return;
    }

    // Fetch user
    fetch(apiUrl('/auth/me'), {
      headers: { 'Authorization': `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(data => {
        if (!data._id) {
          navigate('/login');
          return;
        }
        setUser(data);
        connectSocket(token, data);
        fetchMessages(token, selectedRoom);
      })
      .catch(() => navigate('/login'))
      .finally(() => setLoading(false));

    // Close sidebar on mobile when clicking outside
    const handleClickOutside = (event) => {
      if (sidebarRef.current && !sidebarRef.current.contains(event.target) && window.innerWidth < 1024) {
        setSidebarOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      if (socketRef.current) {
        socketRef.current.emit('room:leave', selectedRoom);
        socketRef.current.disconnect();
      }
    };
  }, [navigate, selectedRoom]);

  const connectSocket = (token, userData) => {
    socketRef.current = io(socketOrigin(), {
      auth: { token },
      transports: ['websocket'],
    });

    socketRef.current.on('connect', () => {
      socketRef.current.emit('room:join', selectedRoom);
    });

    socketRef.current.on('message:new', (message) => {
      if (message.roomId === selectedRoom) {
        if (message.parentId) {
          setMessages(prev => prev.map(msg => 
            msg._id === message.parentId 
              ? { ...msg, replies: [...(msg.replies || []), message], replyCount: (msg.replyCount || 0) + 1 }
              : msg
          ));
        } else {
          setMessages(prev => [...prev, { ...message, replies: [] }]);
        }
        scrollToBottom();
      }
    });

    socketRef.current.on('message:updated', (updated) => {
      if (updated.roomId === selectedRoom) {
        setMessages(prev => prev.map(m => m._id === updated._id ? updated : m));
      }
    });

    socketRef.current.on('message:deleted', ({ id, roomId }) => {
      if (roomId === selectedRoom) {
        setMessages(prev => prev.filter(m => m._id !== id && m.parentId !== id));
      }
    });

    socketRef.current.on('typing:show', ({ username, roomId }) => {
      if (roomId === selectedRoom && username !== userData.name) {
        setTypingUsers(prev => [...new Set([...prev, username])]);
      }
    });

    socketRef.current.on('typing:hide', ({ username, roomId }) => {
      if (roomId === selectedRoom) {
        setTypingUsers(prev => prev.filter(u => u !== username));
      }
    });

    socketRef.current.on('reaction:updated', ({ messageId, reactions, roomId }) => {
      if (roomId === selectedRoom) {
        setMessages(prev => prev.map(m => m._id === messageId ? { ...m, reactions } : m));
      }
    });
  };

  const fetchMessages = async (token, roomId) => {
    try {
      const res = await fetch(apiUrl(`/chat/${roomId}/messages?includeReplies=true`), {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (Array.isArray(data)) {
        setMessages(data);
        scrollToBottom();
      }
    } catch (err) {
      setError('Failed to load messages');
    }
  };

  const sendMessage = async (e) => {
    e.preventDefault();
    if ((!newMessage.trim() && !selectedAttachment) || !user) return;

    const token = getToken();
    try {
      let attachment = selectedAttachment;
      
      if (selectedAttachment?.file) {
        const uploaded = await uploadAttachment(selectedAttachment.file, token);
        if (uploaded) attachment = uploaded;
        else return;
      }

      const messageData = {
        content: newMessage.trim(),
        attachments: attachment ? [attachment] : [],
        roomId: selectedRoom,
      };
      
      if (replyingTo) {
        messageData.parentId = replyingTo._id;
      }

      const tempId = `temp-${Date.now()}`;
      const tempMessage = {
        _id: tempId,
        roomId: selectedRoom,
        userId: user._id,
        username: user.name,
        content: messageData.content,
        attachments: messageData.attachments,
        parentId: messageData.parentId,
        createdAt: new Date().toISOString(),
        formattedTime: formatTime(new Date()),
        reactions: [],
        replies: [],
      };
      
      if (messageData.parentId) {
        setMessages(prev => prev.map(m => 
          m._id === messageData.parentId 
            ? { ...m, replies: [...(m.replies || []), tempMessage], replyCount: (m.replyCount || 0) + 1 }
            : m
        ));
      } else {
        setMessages(prev => [...prev, tempMessage]);
      }
      
      setNewMessage('');
      setSelectedAttachment(null);
      setReplyingTo(null);
      scrollToBottom();

      const url = messageData.parentId
        ? apiUrl(`/chat/messages/${messageData.parentId}/reply`)
        : apiUrl(`/chat/${selectedRoom}/messages`);
      
      const res = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(messageData)
      });

      if (!res.ok) {
        if (messageData.parentId) {
          setMessages(prev => prev.map(m => 
            m._id === messageData.parentId 
              ? { ...m, replies: m.replies?.filter(r => r._id !== tempId), replyCount: Math.max(0, (m.replyCount || 1) - 1) }
              : m
          ));
        } else {
          setMessages(prev => prev.filter(m => m._id !== tempId));
        }
        setError('Failed to send message');
      }
    } catch (err) {
      console.error('Send error:', err);
      setError('Network error');
    }
  };

  const uploadAttachment = async (file, token) => {
    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await fetch(apiUrl('/chat/upload'), {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: formData,
      });

      if (!res.ok) throw new Error('Upload failed');
      const data = await res.json();
      return data.attachment;
    } catch (err) {
      console.error('Upload error:', err);
      setError('Failed to upload file');
      return null;
    }
  };

  const handleReaction = async (messageId, emoji) => {
    const token = getToken();
    try {
      const res = await fetch(apiUrl(`/chat/messages/${messageId}/react`), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ emoji, roomId: selectedRoom })
      });

      if (!res.ok) throw new Error('Failed to add reaction');
      
      setMessages(prev => prev.map(msg => {
        if (msg._id === messageId) {
          const existing = msg.reactions?.find(r => r.emoji === emoji);
          const newReactions = existing 
            ? msg.reactions.map(r => r.emoji === emoji 
                ? { ...r, userIds: r.userIds.includes(user._id) 
                    ? r.userIds.filter(id => id !== user._id) 
                    : [...r.userIds, user._id] }
                : r)
            : [...(msg.reactions || []), { emoji, userIds: [user._id] }];
          return { ...msg, reactions: newReactions };
        }
        return msg;
      }));
    } catch (err) {
      console.error('Reaction error:', err);
    }
  };

  const handleTyping = (e) => {
    setNewMessage(e.target.value);
    if (socketRef.current?.connected) {
      socketRef.current.emit('typing:start', { roomId: selectedRoom, username: user?.name });
      clearTimeout(window.typingTimeout);
      window.typingTimeout = setTimeout(() => {
        socketRef.current.emit('typing:stop', { roomId: selectedRoom, username: user?.name });
      }, 2000);
    }
  };

  const handleFileSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'application/pdf'];
    if (!validTypes.includes(file.type)) {
      setError('Only images and PDFs are allowed');
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setError('File must be under 10MB');
      return;
    }

    const previewUrl = file.type.startsWith('image/') ? URL.createObjectURL(file) : null;
    
    setSelectedAttachment({
      url: URL.createObjectURL(file),
      filename: file.name,
      type: file.type.startsWith('image/') ? 'image' : 'file',
      size: file.size,
      previewUrl,
      file,
    });
    setShowFileUpload(false);
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const formatTime = (date) => {
    return new Date(date).toLocaleTimeString('en-US', { 
      hour: 'numeric', 
      minute: '2-digit',
      hour12: true 
    });
  };

  const formatFullTimestamp = (date) => {
    return new Date(date).toLocaleString('en-US', { 
      month: 'short', day: 'numeric',
      hour: 'numeric', minute: '2-digit',
      hour12: true 
    });
  };

  const formatFileSize = (bytes) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  const toggleThread = (messageId) => {
    setExpandedThreads(prev => ({
      ...prev,
      [messageId]: !prev[messageId]
    }));
  };

  if (loading) return <div className="min-h-screen bg-[#0f172a] flex items-center justify-center text-white">Loading chat...</div>;

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#1e3a5f] via-[#0f172a] to-[#1e293b] text-white font-sans flex">
      {/* Collapsible Sidebar with Hover-to-Expand */}
      <motion.aside
        ref={sidebarRef}
        initial={{ width: isSidebarExpanded ? 240 : 72 }}
        animate={{ width: isSidebarExpanded ? 240 : 72 }}
        transition={{ duration: 0.2, ease: "easeInOut" }}
        onMouseEnter={() => setIsHoveringSidebar(true)}
        onMouseLeave={() => setIsHoveringSidebar(false)}
        className="border-r border-glass-border bg-sidebar-bg/80 backdrop-blur-xl flex flex-col overflow-hidden"
      >
        {/* Sidebar Header */}
        <div className="p-4 border-b border-glass-border flex items-center justify-between">
          {isSidebarExpanded ? (
            <>
              <h2 className="font-black uppercase tracking-tight text-sm">Channels</h2>
              <button 
                onClick={() => setSidebarOpen(false)}
                className="p-1.5 hover:bg-white/10 rounded-lg transition-colors lg:hidden"
                title="Collapse sidebar"
              >
                <PanelLeftClose size={16} />
              </button>
            </>
          ) : (
            <button 
              onClick={() => setSidebarOpen(true)}
              className="p-1.5 hover:bg-white/10 rounded-lg transition-colors mx-auto"
              title="Expand sidebar"
            >
              <PanelLeftOpen size={20} />
            </button>
          )}
        </div>

        {/* Back to Dashboard */}
        <button
          onClick={() => navigate('/dashboard')}
          className={`p-3 hover:bg-white/5 transition-colors flex items-center gap-3 border-b border-glass-border ${
            !isSidebarExpanded ? 'justify-center' : ''
          }`}
        >
          <ArrowLeft size={18} className="text-chat-blue-light" />
          {isSidebarExpanded && <span className="font-bold text-sm text-chat-blue-light">Back to Dashboard</span>}
        </button>

        {/* Room List */}
        <nav className="flex-1 overflow-y-auto p-2 space-y-1">
          {DEFAULT_ROOMS.map(room => (
            <button
              key={room.id}
              onClick={() => {
                setSelectedRoom(room.id);
                if (window.innerWidth < 1024) setSidebarOpen(false);
              }}
              className={`w-full text-left p-3 rounded-xl transition-all flex items-center gap-3 ${
                selectedRoom === room.id 
                  ? 'bg-chat-blue/20 border border-chat-blue/30 text-white' 
                  : 'hover:bg-white/5 text-slate-300 hover:text-white'
              }`}
            >
              <Hash size={18} className="flex-shrink-0" />
              {isSidebarExpanded && (
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-sm truncate">{room.name}</p>
                  <p className="text-[10px] text-slate-400 truncate">{room.description}</p>
                </div>
              )}
              {room.isReadOnly && isSidebarExpanded && (
                <Lock size={12} className="text-amber-400 flex-shrink-0" />
              )}
            </button>
          ))}
          
          {/* Admin: Manage Rooms */}
          {user?.role === 'admin' && isSidebarExpanded && (
            <button
              onClick={() => navigate('/dashboard/chat/admin')}
              className="w-full text-left p-3 rounded-xl hover:bg-white/5 text-slate-400 hover:text-chat-blue transition-all flex items-center gap-3 mt-4 border-t border-glass-border pt-4"
            >
              <Settings size={18} />
              <span className="font-bold text-sm">Manage Channels</span>
            </button>
          )}
        </nav>

        {/* User Info */}
        {isSidebarExpanded && (
          <div className="p-4 border-t border-glass-border">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-chat-blue to-chat-blue-light flex items-center justify-center text-xs font-bold shadow-lg">
                {user?.name?.[0]?.toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-bold text-sm truncate">{user?.name}</p>
                <p className="text-[10px] text-slate-400 truncate">{user?.role}</p>
              </div>
            </div>
          </div>
        )}
      </motion.aside>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Chat Header */}
        <header className="border-b border-glass-border bg-glass-bg/60 backdrop-blur-xl sticky top-0 z-40">
          <div className="px-4 sm:px-6 py-3 sm:py-4 flex justify-between items-center">
            <div className="flex items-center gap-3">
              {/* Mobile sidebar toggle */}
              <button 
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="p-2 hover:bg-white/10 rounded-lg transition-colors lg:hidden"
              >
                {sidebarOpen ? <PanelLeftClose size={20} /> : <PanelLeftOpen size={20} />}
              </button>
              
              <div>
                <h1 className="font-black uppercase tracking-tight text-lg flex items-center gap-2">
                  <Hash size={18} className="text-chat-blue-light" />
                  {DEFAULT_ROOMS.find(r => r.id === selectedRoom)?.name}
                </h1>
                <p className="text-[10px] text-slate-400 uppercase tracking-widest">
                  {DEFAULT_ROOMS.find(r => r.id === selectedRoom)?.description}
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <span className="text-[10px] text-slate-500 hidden sm:inline">
                {messages.length} messages
              </span>
              <button className="p-2 hover:bg-white/10 rounded-lg transition-colors">
                <Bell size={18} className="text-slate-400" />
              </button>
            </div>
          </div>
        </header>

        {/* Messages */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
          {messages.map((msg) => (
            <div key={msg._id} className={`flex gap-3 ${msg.userId === user?._id ? 'flex-row-reverse' : ''}`}>
              {/* Avatar */}
              <div className="w-9 h-9 rounded-full bg-gradient-to-br from-chat-blue to-chat-blue-light flex items-center justify-center text-xs font-bold flex-shrink-0 shadow-lg">
                {msg.username?.[0]?.toUpperCase() || '?'}
              </div>
              
              <div className={`flex-1 ${msg.userId === user?._id ? 'text-right' : ''}`}>
                {/* Message Header with Timestamp */}
                <div className={`flex items-baseline gap-2 mb-1 ${msg.userId === user?._id ? 'justify-end' : ''}`}>
                  <span className="font-bold text-sm">{msg.username}</span>
                  <span className="text-[10px] text-slate-400" title={formatFullTimestamp(msg.createdAt)}>
                    {formatTime(msg.createdAt)}
                  </span>
                  {msg.edited && <span className="text-[9px] text-slate-500">(edited)</span>}
                </div>
                
                {/* Message Content */}
                <div className={`inline-block px-4 py-2.5 rounded-2xl backdrop-blur-sm ${
                  msg.userId === user?._id 
                    ? 'bg-chat-blue/80 text-white rounded-br-md border border-chat-blue-light/30 shadow-chat' 
                    : 'bg-white/10 text-slate-100 rounded-bl-md border border-glass-border'
                }`}>
                  {/* Reply Context */}
                  {msg.parentId && (
                    <div className="mb-2 pb-2 border-b border-white/10 text-[10px] text-slate-400 italic">
                      Replying to a message
                    </div>
                  )}
                  
                  {/* Attachments */}
                  {msg.attachments?.map((att, i) => (
                    <div key={i} className="mb-2">
                      {att.type === 'image' ? (
                        <img 
                          src={assetUrl(att.url || att.previewUrl)} 
                          alt={att.filename}
                          className="max-w-full rounded-lg cursor-pointer hover:opacity-90 transition-opacity border border-white/10"
                          onClick={() => window.open(assetUrl(att.url || att.previewUrl), '_blank')}
                        />
                      ) : (
                        <a 
                          href={assetUrl(att.url || att.previewUrl)} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="flex items-center gap-2 p-3 bg-white/5 rounded-lg hover:bg-white/10 transition-colors border border-glass-border"
                        >
                          <FileIcon size={16} className="text-chat-blue-light" />
                          <div className="text-sm text-left">
                            <p className="font-medium truncate max-w-[200px]">{att.filename}</p>
                            <p className="text-[10px] text-slate-400">{formatFileSize(att.size)}</p>
                          </div>
                        </a>
                      )}
                    </div>
                  ))}
                  
                  {/* Text Content */}
                  {msg.content && (
                    <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                  )}
                </div>
                
                {/* Message Actions (Three Dots Menu) */}
                <div className={`flex items-center gap-1 mt-1 ${msg.userId === user?._id ? 'justify-end' : ''}`}>
                  {/* Reactions */}
                  {msg.reactions?.length > 0 && (
                    <div className="flex flex-wrap gap-1 mr-2">
                      {msg.reactions.map((reaction, i) => (
                        <button
                          key={i}
                          onClick={() => handleReaction(msg._id, reaction.emoji)}
                          className={`px-2 py-0.5 rounded-full text-xs flex items-center gap-1 transition-colors backdrop-blur-sm ${
                            reaction.userIds?.includes(user?._id)
                              ? 'bg-chat-blue/50 text-white border border-chat-blue-light/30'
                              : 'bg-white/10 hover:bg-white/20 border border-glass-border'
                          }`}
                          title={`${reaction.userIds?.length} reaction${reaction.userIds?.length !== 1 ? 's' : ''}`}
                        >
                          {reaction.emoji} {reaction.userIds?.length}
                        </button>
                      ))}
                    </div>
                  )}
                  
                  {/* Three Dots Menu */}
                  <div className="relative">
                    <button
                      onClick={() => setMessageMenuOpen(messageMenuOpen === msg._id ? null : msg._id)}
                      className="p-1 hover:bg-white/10 rounded-lg transition-colors text-slate-400 hover:text-white"
                    >
                      <MoreVertical size={14} />
                    </button>
                    
                    {messageMenuOpen === msg._id && (
                      <div className="absolute bottom-full right-0 mb-2 w-48 bg-[#1e293b] border border-glass-border rounded-xl shadow-2xl z-50 overflow-hidden">
                        <button
                          onClick={() => { setReplyingTo(msg); setMessageMenuOpen(null); }}
                          className="w-full text-left px-4 py-2.5 hover:bg-white/5 transition-colors flex items-center gap-2 text-sm"
                        >
                          <Reply size={14} /> Reply
                        </button>
                        <button
                          onClick={() => setShowEmojiPicker(showEmojiPicker === msg._id ? null : msg._id)}
                          className="w-full text-left px-4 py-2.5 hover:bg-white/5 transition-colors flex items-center gap-2 text-sm"
                        >
                          <Smile size={14} /> React
                        </button>
                        {msg.userId === user?._id && (
                          <>
                            <button
                              onClick={() => { /* Edit logic */ setMessageMenuOpen(null); }}
                              className="w-full text-left px-4 py-2.5 hover:bg-white/5 transition-colors flex items-center gap-2 text-sm"
                            >
                              <Edit2 size={14} /> Edit
                            </button>
                            <button
                              onClick={() => { if(window.confirm('Delete this message?')) { /* Delete logic */ } setMessageMenuOpen(null); }}
                              className="w-full text-left px-4 py-2.5 hover:bg-red-500/20 transition-colors flex items-center gap-2 text-sm text-red-400"
                            >
                              <Trash2 size={14} /> Delete
                            </button>
                          </>
                        )}
                      </div>
                    )}
                  </div>
                </div>
                
                {/* Emoji Picker for Reactions */}
                {showEmojiPicker === msg._id && (
                  <div className="flex gap-1 mt-2 p-2 bg-[#1e293b]/90 backdrop-blur-sm rounded-lg border border-glass-border">
                    {REACTION_EMOJIS.map(emoji => (
                      <button
                        key={emoji}
                        onClick={() => {
                          handleReaction(msg._id, emoji);
                          setShowEmojiPicker(null);
                        }}
                        className="text-lg hover:scale-125 transition-transform"
                      >
                        {emoji}
                      </button>
                    ))}
                  </div>
                )}
                
                {/* Thread/Replies */}
                {msg.replies?.length > 0 && (
                  <div className="mt-2">
                    <button
                      onClick={() => toggleThread(msg._id)}
                      className="flex items-center gap-2 text-[10px] text-chat-blue-light hover:text-chat-blue transition-colors"
                    >
                      <MessageSquare size={12} />
                      {msg.replyCount} repl{msg.replyCount === 1 ? 'y' : 'ies'}
                      {expandedThreads[msg._id] ? <Minus size={12} /> : <Plus size={12} />}
                    </button>
                    
                    {expandedThreads[msg._id] && (
                      <div className="mt-2 ml-4 pl-4 border-l-2 border-glass-border space-y-3">
                        {msg.replies.map(reply => (
                          <div key={reply._id} className={`flex gap-2 ${reply.userId === user?._id ? 'flex-row-reverse' : ''}`}>
                            <div className="w-7 h-7 rounded-full bg-chat-blue/50 flex items-center justify-center text-[10px] font-bold flex-shrink-0">
                              {reply.username?.[0]?.toUpperCase()}
                            </div>
                            <div className={`flex-1 ${reply.userId === user?._id ? 'text-right' : ''}`}>
                              <div className={`inline-block px-3 py-1.5 rounded-lg text-xs backdrop-blur-sm ${
                                reply.userId === user?._id 
                                  ? 'bg-chat-blue/60 text-white rounded-br-md' 
                                  : 'bg-white/5 text-slate-200 rounded-bl-md border border-glass-border'
                              }`}>
                                <p className="font-bold text-[10px] mb-0.5">{reply.username}</p>
                                <p className="leading-relaxed">{reply.content}</p>
                              </div>
                              <p className="text-[9px] text-slate-500 mt-0.5" title={formatFullTimestamp(reply.createdAt)}>
                                {formatTime(reply.createdAt)}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          ))}
          
          {/* Typing Indicator */}
          {typingUsers.length > 0 && (
            <div className="text-[10px] text-slate-400 italic pl-12">
              {typingUsers.join(', ')} {typingUsers.length === 1 ? 'is' : 'are'} typing...
            </div>
          )}
          
          <div ref={messagesEndRef} />
        </main>

        {/* Reply Context Bar */}
        {replyingTo && (
          <div className="px-4 sm:px-6 py-2 bg-chat-blue/10 border-t border-chat-blue/30 flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm">
              <Reply size={14} className="text-chat-blue-light" />
              <span className="text-slate-300">Replying to <span className="font-bold">{replyingTo.username}</span></span>
              <button onClick={() => setReplyingTo(null)} className="p-1 hover:bg-white/10 rounded">
                <X size={14} />
              </button>
            </div>
          </div>
        )}

        {/* Message Input */}
        <form onSubmit={sendMessage} className="border-t border-glass-border bg-glass-bg/60 backdrop-blur-xl p-4">
          <div className="max-w-4xl mx-auto">
            {/* Attachment Preview */}
            {selectedAttachment && (
              <div className="mb-3 p-3 bg-white/5 rounded-xl border border-glass-border">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    {selectedAttachment.type === 'image' ? (
                      <img 
                        src={selectedAttachment.previewUrl} 
                        alt={selectedAttachment.filename}
                        className="w-12 h-12 rounded-lg object-cover border border-glass-border"
                      />
                    ) : (
                      <div className="w-12 h-12 rounded-lg bg-white/10 border border-glass-border flex items-center justify-center">
                        <FileIcon size={20} className="text-chat-blue-light" />
                      </div>
                    )}
                    <div>
                      <p className="text-sm font-medium truncate max-w-[200px]">{selectedAttachment.filename}</p>
                      <p className="text-[10px] text-slate-400">{formatFileSize(selectedAttachment.size)}</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setSelectedAttachment(null)}
                    className="p-1 hover:bg-white/10 rounded-full transition-colors"
                  >
                    <X size={16} />
                  </button>
                </div>
              </div>
            )}
            
            {/* Input Row */}
            <div className="flex gap-2 sm:gap-3">
              {/* File Upload */}
              <div className="relative">
                <button 
                  type="button"
                  onClick={() => setShowFileUpload(!showFileUpload)}
                  className="p-2.5 hover:bg-white/10 rounded-full transition-colors text-slate-400 hover:text-chat-blue-light"
                  title="Attach file"
                >
                  <Paperclip className="w-4 h-4 sm:w-5 sm:h-5" />
                </button>
                
                {showFileUpload && (
                  <div className="absolute bottom-full left-0 mb-2 bg-[#1e293b] border border-glass-border rounded-xl shadow-2xl p-2 z-50 min-w-[160px]">
                    <input
                      ref={fileInputRef}
                      type="file"
                      onChange={handleFileSelect}
                      className="hidden"
                      accept="image/*,.pdf"
                    />
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="flex items-center gap-2 px-3 py-2 hover:bg-white/5 rounded-lg transition-colors w-full text-left text-sm"
                    >
                      <ImageIcon size={14} /> Image
                    </button>
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="flex items-center gap-2 px-3 py-2 hover:bg-white/5 rounded-lg transition-colors w-full text-left text-sm"
                    >
                      <FileIcon size={14} /> PDF
                    </button>
                  </div>
                )}
              </div>
              
              {/* Message Input */}
              <input
                type="text"
                value={newMessage}
                onChange={handleTyping}
                placeholder={`Message #${DEFAULT_ROOMS.find(r => r.id === selectedRoom)?.name}...`}
                className="flex-1 bg-white/5 border border-glass-border rounded-full px-4 sm:px-5 py-2.5 sm:py-3 text-sm outline-none focus:border-chat-blue transition-colors placeholder:text-slate-500"
              />
              
              {/* Send Button */}
              <button
                type="submit"
                disabled={(!newMessage.trim() && !selectedAttachment)}
                className="p-2.5 sm:p-3 bg-gradient-to-r from-chat-blue to-chat-blue-light hover:from-chat-blue-light hover:to-chat-blue disabled:opacity-50 disabled:cursor-not-allowed rounded-full transition-all shadow-lg hover:shadow-chat-blue/25"
              >
                <Send className="w-4 h-4 text-white" />
              </button>
            </div>
            
            {/* Error Message */}
            {error && (
              <p className="mt-2 text-red-400 text-xs text-center">{error}</p>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}
