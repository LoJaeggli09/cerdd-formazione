import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Inbox, Check, X, AlertCircle, Search, Filter, Bell, CheckCheck, Trash2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { translate } from '../i18n';
import { getAllNotifications, deleteNotification, markNotificationAsRead, markAllNotificationsAsRead, deleteReadNotifications, approveObjective } from '../data/notifications.supabase';
import { supabase } from '../supabaseClient';

const InboxSection = ({ language, currentUser, selectedStudent = null, isTrainer = false, isReadOnly = false, onNotificationsUpdated }) => {
  const [notifications, setNotifications] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [showUnreadOnly, setShowUnreadOnly] = useState(false);
  const [stats, setStats] = useState(null);
  const [dbError, setDbError] = useState(null);
  
  const t = (key) => translate(key, language);

  // Ref sempre aggiornato per evitare stale closure nella subscription
  const loadNotificationsRef = useRef(null);

  const loadNotifications = useCallback(async () => {
    if (!currentUser?.id) return;
    try {
      const allNotifs = await getAllNotifications();
      setDbError(null);
      // Filtra solo le notifiche dell'utente corrente (la casella è globale, non per studente)
      let filtered = allNotifs.filter(n => String(n.user_id) === String(currentUser.id));
      if (searchTerm) filtered = filtered.filter(n => (n.title || '').toLowerCase().includes(searchTerm.toLowerCase()));
      if (filterType !== 'all') filtered = filtered.filter(n => n.type === filterType);
      if (showUnreadOnly) filtered = filtered.filter(n => !n.read);
      setNotifications(filtered);
    } catch (error) {
      setNotifications([]);
      setDbError(error.message || String(error));
      console.error('Errore caricamento notifiche da Supabase:', error);
    }
  }, [currentUser, searchTerm, filterType, showUnreadOnly]);

  // Aggiorna sempre il ref con la versione più recente
  loadNotificationsRef.current = loadNotifications;

  // Ricarica quando cambiano i filtri o l'utente
  useEffect(() => {
    loadNotifications();
  }, [loadNotifications]);

  // Subscription realtime + polling ogni 10s come fallback
  useEffect(() => {
    if (!currentUser?.id) return;
    const channelName = `inbox-notif-${currentUser.id}`;
    const channel = supabase
      .channel(channelName)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'notifications' }, () => {
        loadNotificationsRef.current?.();
      })
      .subscribe();
    // Polling fallback: se il realtime non funziona, aggiorna ogni 10 secondi
    const pollInterval = setInterval(() => { loadNotificationsRef.current?.(); }, 10000);
    return () => {
      supabase.removeChannel(channel);
      clearInterval(pollInterval);
    };
  }, [currentUser?.id]);

  const notifyNotificationsUpdated = () => {
    if (typeof onNotificationsUpdated === 'function') {
      onNotificationsUpdated();
    }
    window.dispatchEvent(new Event('notifications-updated'));
  };

  const handleConfirm = async (notificationId) => {
    if (isReadOnly) return;
    const notification = notifications.find(n => n.id === notificationId);
    if (notification && isTrainer && notification.studentId && notification.objectiveId) {
      try {
        await approveObjective(
          notification.studentId,
          notification.objectiveId,
          currentUser.name || currentUser.username || 'Formatore',
          currentUser.id
        );
      } catch (err) {
        console.error('Errore durante approvazione obiettivo:', err);
      }
    }
    deleteNotification(notificationId).catch(console.error);
    await loadNotifications();
    notifyNotificationsUpdated();
  };

  const handleDismiss = (notificationId) => {
    if (isReadOnly) return;
    deleteNotification(notificationId).catch(console.error);
    loadNotifications();
    notifyNotificationsUpdated();
  };

  const handleMarkAsRead = (notificationId) => {
    if (isReadOnly) return;
    markNotificationAsRead(notificationId).catch(console.error);
    loadNotifications();
    notifyNotificationsUpdated();
  };

  const handleMarkAllAsRead = () => {
    if (isReadOnly) return;
    markAllNotificationsAsRead(currentUser.id).catch(console.error);
    loadNotifications();
    notifyNotificationsUpdated();
  };

  const handleDeleteRead = () => {
    if (isReadOnly) return;
    deleteReadNotifications(currentUser.id).catch(console.error);
    loadNotifications();
    notifyNotificationsUpdated();
  };

  return (
    <div style={{
      padding: '20px',
      maxWidth: '1200px',
      margin: '0 auto'
    }}>
      {dbError && (
        <div style={{
          backgroundColor: '#fef2f2',
          border: '1px solid #fca5a5',
          borderRadius: '8px',
          padding: '12px 16px',
          marginBottom: '16px',
          color: '#dc2626',
          fontSize: '13px'
        }}>
          <strong>Errore DB:</strong> {dbError}
        </div>
      )}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: '20px',
        flexWrap: 'wrap',
        gap: '16px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <Inbox size={32} color="#1a3a52" />
          <h2 style={{ margin: 0, color: '#1a3a52' }}>{t('inbox.title')}</h2>
          {stats && stats.unread > 0 && (
            <span className="notification-badge">{stats.unread}</span>
          )}
        </div>

        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          <button
            className="inbox-action-btn"
            onClick={handleMarkAllAsRead}
            disabled={isReadOnly || !notifications.some(n => !n.read)}
          >
            <CheckCheck size={16} />
            Segna tutte lette
          </button>
          <button
            className="inbox-action-btn"
            onClick={handleDeleteRead}
            disabled={isReadOnly || !stats || stats.unread === stats.total}
          >
            <Trash2 size={16} />
            Elimina lette
          </button>
        </div>
      </div>

      <div className="inbox-filters">
        <div className="inbox-search-box">
          <Search size={18} />
          <input
            type="text"
            placeholder="Cerca notifiche..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="inbox-filter-row">
          <label>
            <input
              type="checkbox"
              checked={showUnreadOnly}
              onChange={(e) => setShowUnreadOnly(e.target.checked)}
            />
            Solo non lette
          </label>

          <select value={filterType} onChange={(e) => setFilterType(e.target.value)}>
            <option value="all">Tutti i tipi</option>
            <option value="completion">Completamento</option>
            <option value="approval">Approvazione</option>
            <option value="urgent">Urgente</option>
            <option value="info">Informazione</option>
            <option value="reminder">Promemoria</option>
          </select>
        </div>
      </div>

      {notifications.length === 0 ? (
        <div style={{
          textAlign: 'center',
          padding: '60px 20px',
          color: '#6b7280',
          backgroundColor: '#f9fafb',
          borderRadius: '12px',
          border: '2px dashed #d1d5db'
        }}>
          <Inbox size={48} color="#d1d5db" style={{ marginBottom: '16px' }} />
          <p style={{ fontSize: '16px', margin: 0 }}>{t('inbox.empty')}</p>
        </div>
      ) : (
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '16px'
        }}>
          {notifications.map(notification => (
            <div
              key={notification.id}
              style={{
                backgroundColor: '#ffffff',
                borderRadius: '12px',
                padding: '20px',
                boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
                border: '2px solid #3b82f6',
                transition: 'all 0.3s ease'
              }}
            >
              <div style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: '16px'
              }}>
                <div style={{
                  backgroundColor: '#eff6ff',
                  borderRadius: '50%',
                  padding: '12px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <AlertCircle size={24} color="#3b82f6" />
                </div>
                
                <div style={{ flex: 1 }}>
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'flex-start',
                    marginBottom: '12px'
                  }}>
                    <div>
                      <h3 style={{ 
                        margin: '0 0 8px 0', 
                        color: '#1a3a52',
                        fontSize: '16px',
                        fontWeight: '600'
                      }}>
                        {notification.studentName}
                      </h3>
                      <p style={{ 
                        margin: 0, 
                        color: '#6b7280',
                        fontSize: '14px',
                        lineHeight: '1.5'
                      }}>
                        {notification.type === 'approval' 
                          ? t('inbox.approved').replace('{trainer}', notification.studentName).replace('{objective}', notification.objectiveId)
                          : t('inbox.message').replace('{objective}', notification.objectiveId)
                        }
                      </p>
                    </div>
                    <span style={{
                      fontSize: '12px',
                      color: '#9ca3af',
                      whiteSpace: 'nowrap',
                      marginLeft: '16px'
                    }}>
                      {new Date(notification.timestamp).toLocaleDateString(language === 'it' ? 'it-IT' : 'en-US')}
                    </span>
                  </div>
                  
                  <div style={{
                    display: 'flex',
                    gap: '10px',
                    marginTop: '16px'
                  }}>
                    {isTrainer && notification.type === 'completion' ? (
                      <>
                        <button
                          onClick={() => handleConfirm(notification.id)}
                          style={{
                            padding: '8px 16px',
                            fontSize: '13px',
                            fontWeight: '600',
                            backgroundColor: '#10b981',
                            color: '#ffffff',
                            border: 'none',
                            borderRadius: '6px',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px',
                            transition: 'all 0.2s ease'
                          }}
                          onMouseOver={(e) => e.target.style.backgroundColor = '#059669'}
                          onMouseOut={(e) => e.target.style.backgroundColor = '#10b981'}
                        >
                          <Check size={16} />
                          {t('inbox.confirm')}
                        </button>
                        
                        <button
                          onClick={() => handleDismiss(notification.id)}
                          style={{
                            padding: '8px 16px',
                            fontSize: '13px',
                            fontWeight: '600',
                            backgroundColor: '#ef4444',
                            color: '#ffffff',
                            border: 'none',
                            borderRadius: '6px',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px',
                            transition: 'all 0.2s ease'
                          }}
                          onMouseOver={(e) => e.target.style.backgroundColor = '#dc2626'}
                          onMouseOut={(e) => e.target.style.backgroundColor = '#ef4444'}
                        >
                          <X size={16} />
                          {t('inbox.dismiss')}
                        </button>
                      </>
                    ) : (
                      <button
                        onClick={() => handleDismiss(notification.id)}
                        disabled={isReadOnly}
                        style={{
                          padding: '8px 16px',
                          fontSize: '13px',
                          fontWeight: '600',
                          backgroundColor: '#3b82f6',
                          color: '#ffffff',
                          border: 'none',
                          borderRadius: '6px',
                          cursor: isReadOnly ? 'not-allowed' : 'pointer',
                          opacity: isReadOnly ? 0.6 : 1,
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px',
                          transition: 'all 0.2s ease'
                        }}
                        onMouseOver={(e) => e.target.style.backgroundColor = '#2563eb'}
                        onMouseOut={(e) => e.target.style.backgroundColor = '#3b82f6'}
                      >
                        <Check size={16} />
                        {t('inbox.markRead')}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default InboxSection;
