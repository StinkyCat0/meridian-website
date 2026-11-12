// src/pages/auth/Dashboard/AdminChatRooms.jsx - Manage Chat Rooms (Admin Panel)
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Plus, Trash2, Edit2, Lock, Users, ArrowLeft, Save, X, 
  PanelLeftClose, Hash, MessageSquare 
} from 'lucide-react';

export default function AdminChatRooms() {
  const navigate = useNavigate();
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({ name: '', description: '', isReadOnly: false });
  const [editingRoom, setEditingRoom] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('meridian_token');
    if (!token) {
      navigate('/login');
      return;
    }

    fetch('https://meridianstudios.org/api/chat/rooms', {
      headers: { 'Authorization': `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) setRooms(data);
        else setError('Failed to load rooms');
      })
      .catch(() => setError('Network error'))
      .finally(() => setLoading(false));
  }, [navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem('meridian_token');
    
    try {
      const url = editingRoom 
        ? `https://meridianstudios.org/api/chat/rooms/${editingRoom.id}`
        : 'https://meridianstudios.org/api/chat/rooms';
      
      const method = editingRoom ? 'PUT' : 'POST';
      
      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      });
      
      if (!res.ok) throw new Error('Failed to save room');
      
      const savedRoom = await res.json();
      
      if (editingRoom) {
        setRooms(prev => prev.map(r => r.id === savedRoom.id ? savedRoom : r));
        setEditingRoom(null);
      } else {
        setRooms(prev => [...prev, savedRoom]);
      }
      
      setShowForm(false);
      setFormData({ name: '', description: '', isReadOnly: false });
    } catch (err) {
      setError('Failed to save room');
    }
  };

  const handleDelete = async (roomId) => {
    if (!window.confirm('Delete this room? All messages will be archived.')) return;
    
    const token = localStorage.getItem('meridian_token');
    try {
      const res = await fetch(`https://meridianstudios.org/api/chat/rooms/${roomId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (!res.ok) throw new Error('Failed to delete');
      
      setRooms(prev => prev.filter(r => r.id !== roomId));
    } catch (err) {
      setError('Failed to delete room');
    }
  };

  if (loading) return <div className="p-8 text-slate-400">Loading rooms...</div>;

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#1e3a5f] via-[#0f172a] to-[#1e293b] text-white flex">
      {/* Collapsible Sidebar */}
      <motion.aside
        initial={{ width: sidebarOpen ? 240 : 72 }}
        animate={{ width: sidebarOpen ? 240 : 72 }}
        className="border-r border-glass-border bg-sidebar-bg/80 backdrop-blur-xl flex flex-col overflow-hidden transition-all duration-300"
      >
        {/* Sidebar Header */}
        <div className="p-4 border-b border-glass-border flex items-center justify-between">
          {sidebarOpen ? (
            <>
              <h2 className="font-black uppercase tracking-tight text-sm">Admin</h2>
              <button 
                onClick={() => setSidebarOpen(false)}
                className="p-1.5 hover:bg-white/10 rounded-lg transition-colors"
              >
                <PanelLeftClose size={16} />
              </button>
            </>
          ) : (
            <button 
              onClick={() => setSidebarOpen(true)}
              className="p-1.5 hover:bg-white/10 rounded-lg transition-colors mx-auto"
            >
              <PanelLeftClose size={20} className="rotate-180" />
            </button>
          )}
        </div>

        {/* Nav Links */}
        <nav className="flex-1 overflow-y-auto p-2 space-y-1">
          <button
            onClick={() => navigate('/dashboard')}
            className="w-full text-left p-3 rounded-xl hover:bg-white/5 text-slate-300 hover:text-white transition-all flex items-center gap-3"
          >
            <ArrowLeft size={18} />
            {sidebarOpen && <span className="font-bold text-sm">Back to Dashboard</span>}
          </button>
          
          <button
            onClick={() => navigate('/dashboard/chat')}
            className="w-full text-left p-3 rounded-xl hover:bg-white/5 text-slate-300 hover:text-white transition-all flex items-center gap-3"
          >
            <MessageSquare size={18} />
            {sidebarOpen && <span className="font-bold text-sm">Chat Rooms</span>}
          </button>
          
          <button
            className="w-full text-left p-3 rounded-xl bg-chat-blue/20 border border-chat-blue/30 text-white transition-all flex items-center gap-3"
          >
            <Hash size={18} />
            {sidebarOpen && <span className="font-bold text-sm">Manage Channels</span>}
          </button>
        </nav>
      </motion.aside>

      {/* Main Content */}
      <main className="flex-1 p-6 sm:p-8 overflow-y-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-2xl font-black uppercase tracking-tight">Chat Channels</h1>
            <p className="text-slate-400 text-sm">Manage rooms, permissions, and settings</p>
          </div>
          <button 
            onClick={() => { setEditingRoom(null); setFormData({ name: '', description: '', isReadOnly: false }); setShowForm(true); }}
            className="flex items-center gap-2 px-4 py-2 bg-chat-blue hover:bg-chat-blue-light text-white rounded-lg font-bold text-sm transition-colors shadow-lg hover:shadow-chat-blue/25"
          >
            <Plus size={16} /> Add Channel
          </button>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-sm">
            {error}
          </div>
        )}

        {/* Room List */}
        <div className="grid gap-4">
          {rooms.map(room => (
            <motion.div
              key={room.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-glass-bg border border-glass-border rounded-2xl p-6 backdrop-blur-xl hover:border-chat-blue/30 transition-colors"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <Hash size={20} className="text-chat-blue-light" />
                    <h3 className="font-bold text-lg">#{room.name}</h3>
                    {room.isReadOnly && (
                      <span className="px-2 py-0.5 bg-amber-500/20 text-amber-400 text-[10px] font-bold uppercase tracking-wider rounded-full flex items-center gap-1">
                        <Lock size={10} /> Read-Only
                      </span>
                    )}
                  </div>
                  <p className="text-slate-400 text-sm mb-3">{room.description}</p>
                  <div className="flex items-center gap-4 text-[10px] text-slate-500 uppercase tracking-wider">
                    <span className="flex items-center gap-1">
                      <Users size={12} /> {room.memberCount || 0} members
                    </span>
                    <span>Created: {new Date(room.createdAt).toLocaleDateString()}</span>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  <button 
                    onClick={() => { setEditingRoom(room); setFormData(room); setShowForm(true); }}
                    className="p-2 hover:bg-white/10 rounded-lg transition-colors text-slate-400 hover:text-chat-blue-light"
                    title="Edit room"
                  >
                    <Edit2 size={16} />
                  </button>
                  <button 
                    onClick={() => handleDelete(room.id)}
                    className="p-2 hover:bg-red-500/20 rounded-lg transition-colors text-slate-400 hover:text-red-400"
                    title="Delete room"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Add/Edit Room Modal */}
        <AnimatePresence>
          {showForm && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[100] p-4"
            >
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-[#1e293b] border border-glass-border rounded-2xl p-6 w-full max-w-md backdrop-blur-xl shadow-glass-lg"
              >
                <div className="flex justify-between items-center mb-6">
                  <h2 className="font-black uppercase tracking-tight text-lg">
                    {editingRoom ? 'Edit Channel' : 'Add New Channel'}
                  </h2>
                  <button 
                    onClick={() => { setShowForm(false); setEditingRoom(null); setFormData({ name: '', description: '', isReadOnly: false }); }}
                    className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                  >
                    <X size={20} />
                  </button>
                </div>
                
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">
                      Channel Name
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full bg-white/5 border border-glass-border rounded-xl px-4 py-3 text-sm outline-none focus:border-chat-blue transition-colors placeholder:text-slate-500"
                      placeholder="e.g., project-alpha"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">
                      Description
                    </label>
                    <textarea
                      required
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      className="w-full bg-white/5 border border-glass-border rounded-xl px-4 py-3 text-sm outline-none focus:border-chat-blue transition-colors resize-none placeholder:text-slate-500"
                      rows={3}
                      placeholder="What is this channel for?"
                    />
                  </div>
                  
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.isReadOnly}
                      onChange={(e) => setFormData({ ...formData, isReadOnly: e.target.checked })}
                      className="w-4 h-4 rounded border-glass-border bg-white/5 text-chat-blue focus:ring-chat-blue"
                    />
                    <span className="text-sm text-slate-300">Read-only channel (no replies allowed)</span>
                  </label>
                  
                  <div className="flex gap-3 pt-4">
                    <button
                      type="button"
                      onClick={() => { setShowForm(false); setEditingRoom(null); setFormData({ name: '', description: '', isReadOnly: false }); }}
                      className="flex-1 py-3 bg-white/5 hover:bg-white/10 border border-glass-border rounded-xl font-bold text-sm transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="flex-1 py-3 bg-gradient-to-r from-chat-blue to-chat-blue-light hover:from-chat-blue-light hover:to-chat-blue text-white rounded-xl font-bold text-sm transition-all shadow-lg hover:shadow-chat-blue/25 flex items-center justify-center gap-2"
                    >
                      <Save size={16} /> {editingRoom ? 'Update' : 'Create'}
                    </button>
                  </div>
                </form>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}
