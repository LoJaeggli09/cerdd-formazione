import React, { useRef } from 'react';
import { LayoutDashboard, Target, BarChart3, Settings, LogOut, Inbox, Users, Search, FileDown, Award } from 'lucide-react';
import { translate } from '../i18n';
import { useKeyboardNavigation, useFocusTrap, useAnnounce } from '../hooks/accessibility';

const SideMenu = ({ isOpen, onClose = () => {}, onLogout, onNavigate, currentView, language = 'it', isTrainer = false, isAdmin = false, unreadNotificationsCount = 0 }) => {
  const t = (key) => translate(key, language);
  const menuRef = useRef(null);
  const announce = useAnnounce();

  const menuItems = isAdmin ? [
    { icon: <LayoutDashboard size={20} />, label: t('menu.dashboard'), id: 'dashboard' },
    { icon: <Target size={20} />, label: t('objectives.title'), id: 'objectives' },
    { icon: <Award size={20} />, label: t('grading.title'), id: 'grading' },
    { icon: <BarChart3 size={20} />, label: t('progress.title'), id: 'statistics' },
    { icon: <FileDown size={20} />, label: t('export.title'), id: 'export' },
    { icon: <Users size={20} />, label: t('manage.title'), id: 'manage' },
    { icon: <Settings size={20} />, label: t('menu.settings'), id: 'settings' },
  ] : [
    { icon: <LayoutDashboard size={20} />, label: t('menu.dashboard'), id: 'dashboard' },
    { icon: <Target size={20} />, label: t('objectives.title'), id: 'objectives' },
    { icon: <Award size={20} />, label: t('grading.title'), id: 'grading' },
    { icon: <Search size={20} />, label: t('search.title'), id: 'search' },
    { icon: <BarChart3 size={20} />, label: t('progress.title'), id: 'statistics' },
    { icon: <FileDown size={20} />, label: t('export.title'), id: 'export' },
    { icon: <Inbox size={20} />, label: t('inbox.title'), id: 'inbox' },
    ...(isTrainer ? [{ icon: <Users size={20} />, label: t('manage.title'), id: 'manage' }] : []),
    { icon: <Settings size={20} />, label: t('menu.settings'), id: 'settings' },
  ];

  // Hook per la navigazione da tastiera
  useKeyboardNavigation(true, onClose, onNavigate, menuItems);

  // Hook per il focus trap
  useFocusTrap(menuRef, true);

  const handleMenuClick = (itemId, itemLabel) => {
    onNavigate(itemId);
    announce(`${t('menu.navigatedTo')} ${itemLabel}`, 'polite');
  };

  return (
    <div
      ref={menuRef}
      className="side-menu"
      role="navigation"
      aria-label={t('menu.navigation')}
    >
        <nav className="menu-nav" role="menu">
          {menuItems.map((item, index) => (
            <button
              key={`${item.id}-${index}`}
              className={`menu-item ${currentView === item.id ? 'active' : ''}`}
              onClick={() => handleMenuClick(item.id, item.label)}
              role="menuitem"
              aria-current={currentView === item.id ? 'page' : undefined}
              tabIndex={0}
            >
              {item.icon}
              <span>{item.label}</span>
              {item.id === 'inbox' && unreadNotificationsCount > 0 && (
                <span className="menu-notification-dot" aria-label={`${unreadNotificationsCount} notifiche non lette`} />
              )}
            </button>
          ))}
        </nav>

        <button
          className="logout-button"
          onClick={onLogout}
          aria-label={t('menu.logout')}
          tabIndex={isOpen ? 0 : -1}
        >
          <LogOut size={20} />
          <span>{t('menu.logout')}</span>
        </button>
      </div>
  );
};

export default SideMenu;
