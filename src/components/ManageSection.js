import React, { useState, useEffect } from 'react';
import { UserPlus, Edit2, Trash2, Save, X, KeyRound, Download, AlertTriangle } from 'lucide-react';
import { translate } from '../i18n';
import { getAllUsers, addUser, updateUser, deleteUser, resetUserPasswordToDefault } from '../data/users.supabase';
import { supabase } from '../supabaseClient';

const ManageSection = ({ language = 'it', currentUser }) => {
  const t = (key) => translate(key, language);
  const isStudentRole = (role) => role === 'student';
  const getRoleLabel = (role) => {
    if (role === 'admin') return t('manage.admin');
    if (role === 'trainer') return t('manage.trainer');
    if (role === 'inspector') return t('manage.inspector');
    return t('manage.student');
  };
  const [usersList, setUsersList] = useState([]);
  const [selectedStudentIds, setSelectedStudentIds] = useState([]);
  const [editingUser, setEditingUser] = useState(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [bulkTrainerId, setBulkTrainerId] = useState('');
  const [bulkInspectorId, setBulkInspectorId] = useState('');
  const [auditLogEntries, setAuditLogEntries] = useState([]);
  const [showAudit, setShowAudit] = useState(false);
  const [newUser, setNewUser] = useState({
    name: '',
    role: 'student',
    trainerId: null,
    inspectorId: null,
    formationYear: 1,
    studentNumber: '',
    apprenticeshipStart: '',
    apprenticeshipEnd: ''
  });

  useEffect(() => {
    loadUsersList();
  }, []);

  useEffect(() => {
    const channel = supabase
      .channel('users-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'users' }, () => {
        loadUsersList();
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, []);

  const loadUsersList = async () => {
    try {
      const users = await getAllUsers();
      setUsersList(users);
    } catch (error) {
      console.error('Errore caricamento utenti da Supabase:', error);
      setUsersList([]);
    }
  };

  const trainerOptions = usersList.filter((u) => u.role === 'trainer');
  const inspectorOptions = usersList.filter((u) => u.role === 'inspector');
  const studentUsers = usersList.filter((u) => u.role === 'student');
  const filteredUsers = usersList.filter((u) => {
    const matchesQuery = !searchQuery.trim() ||
      u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (u.studentNumber || '').toLowerCase().includes(searchQuery.toLowerCase());

    const matchesRole = roleFilter === 'all' || u.role === roleFilter;
    return matchesQuery && matchesRole;
  });
  const allStudentsSelected = studentUsers.length > 0 && studentUsers.every((u) => selectedStudentIds.includes(u.id));
  const filteredCount = filteredUsers.length;
  const selectedCount = selectedStudentIds.length;

  useEffect(() => {
    if (!newUser.inspectorId && inspectorOptions.length > 0) {
      setNewUser((prev) => ({
        ...prev,
        inspectorId: prev.inspectorId || inspectorOptions[0].id
      }));
    }
  }, [inspectorOptions, newUser.inspectorId]);

  const handleAddUser = async () => {
    if (!newUser.name) {
      alert(t('manage.fillRequired'));
      return;
    }

    const fallbackTrainerId = trainerOptions[0]?.id || null;
    const fallbackInspectorId = inspectorOptions[0]?.id || null;
    const resolvedTrainerId = isStudentRole(newUser.role) ? (newUser.trainerId || fallbackTrainerId) : null;
    const resolvedInspectorId = isStudentRole(newUser.role) ? (newUser.inspectorId || fallbackInspectorId) : null;

    if (isStudentRole(newUser.role) && !resolvedInspectorId) {
      alert(t('manage.selectInspectorRequired'));
      return;
    }

    const userToAdd = {
      name: newUser.name,
      password: 'Abc123!',
      role: newUser.role,
      studentNumber: isStudentRole(newUser.role) ? newUser.studentNumber : null,
      trainerId: resolvedTrainerId,
      inspectorId: resolvedInspectorId,
      formationYear: isStudentRole(newUser.role) ? parseInt(newUser.formationYear) : null,
      apprenticeshipStart: isStudentRole(newUser.role) ? (newUser.apprenticeshipStart || null) : null,
      apprenticeshipEnd: isStudentRole(newUser.role) ? (newUser.apprenticeshipEnd || null) : null,
    };

    try {
      await addUser(userToAdd);
      await loadUsersList();
      setShowAddForm(false);
      setNewUser({
        name: '',
        role: 'student',
        trainerId: null,
        inspectorId: null,
        formationYear: 1,
        studentNumber: '',
        apprenticeshipStart: '',
        apprenticeshipEnd: ''
      });
    } catch (error) {
      alert('Errore durante l\'aggiunta utente: ' + error.message);
    }
  };

  const handleEditUser = (user) => {
    setEditingUser({ ...user });
  };

  const handleSaveEdit = async () => {
    const userToSave = { ...editingUser };
    if (!isStudentRole(userToSave.role)) {
      userToSave.studentNumber = null;
      userToSave.trainerId = null;
      userToSave.inspectorId = null;
      userToSave.formationYear = null;
      userToSave.apprenticeshipStart = null;
      userToSave.apprenticeshipEnd = null;
    } else if (!userToSave.inspectorId) {
      alert(t('manage.selectInspectorRequired'));
      return;
    }

    try {
      await updateUser(userToSave);
      await loadUsersList();
      setEditingUser(null);
    } catch (error) {
      alert('Errore durante il salvataggio: ' + error.message);
    }
  };

  const handleDeleteUser = async (userId) => {
    if (userId === currentUser.id) {
      alert(t('manage.cannotDeleteSelf'));
      return;
    }

    if (window.confirm(t('manage.confirmDelete'))) {
      try {
        await deleteUser(userId);
        await loadUsersList();
      } catch (error) {
        alert('Errore durante l\'eliminazione: ' + error.message);
      }
    }
  };

  const handleToggleStudentSelection = (userId) => {
    setSelectedStudentIds((prev) =>
      prev.includes(userId) ? prev.filter((id) => id !== userId) : [...prev, userId]
    );
  };

  const handleToggleSelectAllStudents = () => {
    if (allStudentsSelected) {
      setSelectedStudentIds([]);
      return;
    }
    setSelectedStudentIds(studentUsers.map((u) => u.id));
  };

  const handlePromoteSelectedStudents = () => {
    if (selectedStudentIds.length === 0) {
      alert(t('manage.promote.noneSelected'));
      return;
    }

    const confirmed = window.confirm(
      t('manage.promote.confirm').replace('{count}', String(selectedStudentIds.length))
    );
    if (!confirmed) return;

    Promise.all(selectedStudentIds.map(async (studentId) => {
      const student = usersList.find((u) => u.id === studentId && u.role === 'student');
      if (!student) return;

      const currentYear = Number(student.formationYear) || 1;
      const nextYear = Math.min(4, currentYear + 1);

      await updateUser({
        ...student,
        formationYear: nextYear
      });
    })).then(() => {
      setSelectedStudentIds([]);
      loadUsersList();
      alert(t('manage.promote.success').replace('{count}', String(selectedStudentIds.length)));
    });
  };

  const handleApplyBulkAssignment = () => {
    if (selectedStudentIds.length === 0) {
      alert(t('manage.promote.noneSelected'));
      return;
    }

    if (!bulkTrainerId && !bulkInspectorId) {
      alert(t('manage.bulkAssign.selectAtLeastOne'));
      return;
    }

    const confirmed = window.confirm(
      t('manage.bulkAssign.confirm').replace('{count}', String(selectedStudentIds.length))
    );
    if (!confirmed) return;

    Promise.all(selectedStudentIds.map(async (studentId) => {
      const student = usersList.find((u) => u.id === studentId && u.role === 'student');
      if (!student) return;

      const updatedStudent = {
        ...student,
        trainerId: bulkTrainerId ? Number(bulkTrainerId) : student.trainerId,
        inspectorId: bulkInspectorId ? Number(bulkInspectorId) : student.inspectorId
      };

      await updateUser(updatedStudent);
    })).then(() => {
      // addAdminAuditLogEntry lasciato locale per ora
      setSelectedStudentIds([]);
      setBulkTrainerId('');
      setBulkInspectorId('');
      loadUsersList();
      // loadAuditLogEntries();
      alert(t('manage.bulkAssign.success').replace('{count}', String(selectedStudentIds.length)));
    });
  };

  const handleResetPassword = async (userId, userName) => {
    if (window.confirm(t('manage.resetPasswordConfirm').replace('{name}', userName))) {
      const didReset = await resetUserPasswordToDefault(userId);
      if (didReset) {
        alert(t('manage.resetPasswordSuccess'));
      } else {
        alert(t('manage.resetPasswordError'));
      }
    }
  };

  const handleExportUsersCsv = () => {
    const headers = ['id', 'name', 'role', 'studentNumber', 'formationYear', 'trainerId', 'inspectorId'];
    const rows = filteredUsers.map(user => [
      user.id,
      user.name || '',
      user.role || '',
      user.studentNumber || '',
      user.formationYear || '',
      user.trainerId || '',
      user.inspectorId || ''
    ]);

    const escapeValue = (value) => `"${String(value ?? '').replace(/"/g, '""')}"`;
    const csvContent = [headers, ...rows].map((row) => row.map(escapeValue).join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.setAttribute('download', `users_export_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(link.href);
  };

  const handleCancelEdit = () => {
    setEditingUser(null);
  };

  const handleCancelAdd = () => {
    setShowAddForm(false);
    setNewUser({
      name: '',
      role: 'student',
      trainerId: null,
      inspectorId: null,
      formationYear: 1,
      studentNumber: '',
      apprenticeshipStart: '',
      apprenticeshipEnd: ''
    });
  };

  return (
    <div className="manage-section">
      <div className="section-header">
        <div>
          <h2>{t('manage.title')}</h2>
          <p className="manage-subtitle">
            {filteredCount} utenti visibili · {selectedCount} apprendisti selezionati
          </p>
        </div>
        <div className="manage-header-actions">
          <button
            className="btn-secondary"
            onClick={handleExportUsersCsv}
          >
            <Download size={18} />
            {t('manage.exportCsvUsers')}
          </button>
          <button 
            className="btn-primary"
            onClick={() => setShowAddForm(true)}
            disabled={showAddForm}
          >
            <UserPlus size={20} />
            {t('manage.addUser')}
          </button>
        </div>
      </div>

      <div className="card manage-controls-card">
        <div className="manage-controls-grid">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={t('manage.searchPlaceholder')}
            className="manage-search-input"
          />
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="manage-inline-select"
          >
            <option value="all">{t('manage.roleAll')}</option>
            <option value="student">{t('manage.student')}</option>
            <option value="inspector">{t('manage.inspector')}</option>
            <option value="trainer">{t('manage.trainer')}</option>
            <option value="admin">{t('manage.admin')}</option>
          </select>
          <button
            className="btn-secondary"
            onClick={handleToggleSelectAllStudents}
            disabled={studentUsers.length === 0}
          >
            {allStudentsSelected ? t('manage.selectNoneStudents') : t('manage.selectAllStudents')}
          </button>
          <button
            className="btn-primary"
            onClick={handlePromoteSelectedStudents}
            disabled={selectedCount === 0}
          >
            {t('manage.promoteSelected')}
          </button>
        </div>
      </div>

      <div className="card manage-bulk-card">
        <h3>{t('manage.bulkTitle')}</h3>
        <div className="manage-controls-grid">
        <select
          value={bulkTrainerId}
          onChange={(e) => setBulkTrainerId(e.target.value)}
          className="manage-inline-select"
        >
          <option value="">{t('manage.bulkAssignTrainer')}</option>
          {trainerOptions.map((trainer) => (
            <option key={trainer.id} value={trainer.id}>{trainer.name}</option>
          ))}
        </select>
        <select
          value={bulkInspectorId}
          onChange={(e) => setBulkInspectorId(e.target.value)}
          className="manage-inline-select"
        >
          <option value="">{t('manage.bulkAssignInspector')}</option>
          {inspectorOptions.map((inspector) => (
            <option key={inspector.id} value={inspector.id}>{inspector.name}</option>
          ))}
        </select>
        <button
          className="btn-secondary"
          onClick={handleApplyBulkAssignment}
          disabled={selectedCount === 0}
        >
          {t('manage.applyBulkAssign')}
        </button>
      </div>
      </div>

      {showAddForm && (
        <div className="user-form card">
          <h3>{t('manage.newUser')}</h3>
          <div className="form-grid">
        <div className="form-group">
              <label>{t('manage.name')} *</label>
              <input
                type="text"
                value={newUser.name}
                onChange={(e) => setNewUser({...newUser, name: e.target.value})}
                onKeyDown={(e) => { if (e.key === ' ') { e.stopPropagation(); } }}
                placeholder="Nome Cognome"
              />
            </div>
            <div className="form-group">
              <label>{t('manage.role')}</label>
              <select
                value={newUser.role}
                onChange={(e) => setNewUser({...newUser, role: e.target.value})}
              >
                <option value="student">{t('manage.student')}</option>
                <option value="inspector">{t('manage.inspector')}</option>
                <option value="trainer">{t('manage.trainer')}</option>
                <option value="admin">{t('manage.admin')}</option>
              </select>
            </div>
            {isStudentRole(newUser.role) && (
              <>
                <div className="form-group">
                  <label>{t('manage.trainer')}</label>
                  <select
                    value={newUser.trainerId || ''}
                    onChange={(e) => setNewUser({...newUser, trainerId: Number(e.target.value) || null})}
                  >
                    {trainerOptions.map((trainer) => (
                      <option key={trainer.id} value={trainer.id}>{trainer.name}</option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label>{t('manage.inspectorReference')}</label>
                  <select
                    value={newUser.inspectorId || ''}
                    onChange={(e) => setNewUser({...newUser, inspectorId: Number(e.target.value) || null})}
                  >
                    <option value="">{t('manage.selectInspector')}</option>
                    {inspectorOptions.map((inspector) => (
                      <option key={inspector.id} value={inspector.id}>{inspector.name}</option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label>{t('manage.studentNumber')}</label>
                  <input
                    type="text"
                    value={newUser.studentNumber}
                    onChange={(e) => setNewUser({...newUser, studentNumber: e.target.value})}
                    placeholder="APP001"
                  />
                </div>
                <div className="form-group">
                  <label>{t('manage.formationYear')}</label>
                  <select
                    value={newUser.formationYear}
                    onChange={(e) => setNewUser({...newUser, formationYear: e.target.value})}
                  >
                    <option value="1">1</option>
                    <option value="2">2</option>
                    <option value="3">3</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>{t('manage.apprenticeshipStart')}</label>
                  <input
                    type="text"
                    value={newUser.apprenticeshipStart}
                    onChange={(e) => setNewUser({...newUser, apprenticeshipStart: e.target.value})}
                    placeholder="01.08.2024"
                  />
                </div>
                <div className="form-group">
                  <label>{t('manage.apprenticeshipEnd')}</label>
                  <input
                    type="text"
                    value={newUser.apprenticeshipEnd}
                    onChange={(e) => setNewUser({...newUser, apprenticeshipEnd: e.target.value})}
                    placeholder="31.07.2027"
                  />
                </div>
              </>
            )}
          </div>
          <div className="form-actions">
            <button className="btn-secondary" onClick={handleCancelAdd}>
              <X size={18} />
              {t('manage.cancel')}
            </button>
            <button className="btn-primary" onClick={handleAddUser}>
              <Save size={18} />
              {t('manage.save')}
            </button>
          </div>
          <p className="info-text">{t('manage.defaultPassword')}: Abc123!</p>
        </div>
      )}

      <div className="users-list">
        {filteredUsers.map(user => (
          <div key={user.id} className={`user-card card role-card-${user.role}`}>
            {editingUser && editingUser.id === user.id ? (
              <div className="user-edit-form">
                <div className="form-grid">
                  <div className="form-group">
                    <label>{t('manage.name')}</label>
                    <input
                      type="text"
                      value={editingUser.name}
                      onChange={(e) => setEditingUser({...editingUser, name: e.target.value})}
                    />
                  </div>
                  <div className="form-group">
                    <label>{t('manage.role')}</label>
                    <select
                      value={editingUser.role}
                      onChange={(e) => setEditingUser({...editingUser, role: e.target.value})}
                    >
                      <option value="student">{t('manage.student')}</option>
                      <option value="inspector">{t('manage.inspector')}</option>
                      <option value="trainer">{t('manage.trainer')}</option>
                      <option value="admin">{t('manage.admin')}</option>
                    </select>
                  </div>
                  {isStudentRole(editingUser.role) && (
                    <>
                      <div className="form-group">
                        <label>{t('manage.trainer')}</label>
                        <select
                          value={editingUser.trainerId || ''}
                          onChange={(e) => setEditingUser({...editingUser, trainerId: Number(e.target.value) || null})}
                        >
                          {trainerOptions.map((trainer) => (
                            <option key={trainer.id} value={trainer.id}>{trainer.name}</option>
                          ))}
                        </select>
                      </div>
                      <div className="form-group">
                        <label>{t('manage.inspectorReference')}</label>
                        <select
                          value={editingUser.inspectorId || ''}
                          onChange={(e) => setEditingUser({...editingUser, inspectorId: Number(e.target.value) || null})}
                        >
                          <option value="">{t('manage.selectInspector')}</option>
                          {inspectorOptions.map((inspector) => (
                            <option key={inspector.id} value={inspector.id}>{inspector.name}</option>
                          ))}
                        </select>
                      </div>
                      <div className="form-group">
                        <label>{t('manage.studentNumber')}</label>
                        <input
                          type="text"
                          value={editingUser.studentNumber || ''}
                          onChange={(e) => setEditingUser({...editingUser, studentNumber: e.target.value})}
                        />
                      </div>
                      <div className="form-group">
                        <label>{t('manage.formationYear')}</label>
                        <select
                          value={editingUser.formationYear || 1}
                          onChange={(e) => setEditingUser({...editingUser, formationYear: parseInt(e.target.value)})}
                        >
                          <option value="1">1</option>
                          <option value="2">2</option>
                          <option value="3">3</option>
                          <option value="4">4</option>
                        </select>
                      </div>
                      <div className="form-group">
                        <label>{t('manage.apprenticeshipStart')}</label>
                        <input
                          type="text"
                          value={editingUser.apprenticeshipStart || ''}
                          onChange={(e) => setEditingUser({...editingUser, apprenticeshipStart: e.target.value})}
                        />
                      </div>
                      <div className="form-group">
                        <label>{t('manage.apprenticeshipEnd')}</label>
                        <input
                          type="text"
                          value={editingUser.apprenticeshipEnd || ''}
                          onChange={(e) => setEditingUser({...editingUser, apprenticeshipEnd: e.target.value})}
                        />
                      </div>
                    </>
                  )}
                </div>
                <div className="form-actions">
                  <button className="btn-secondary" onClick={handleCancelEdit}>
                    <X size={18} />
                    {t('manage.cancel')}
                  </button>
                  <button className="btn-primary" onClick={handleSaveEdit}>
                    <Save size={18} />
                    {t('manage.save')}
                  </button>
                </div>
              </div>
            ) : (
              <div className="user-card-body">
                <div className="user-card-header">
                  {user.role === 'student' && (
                    <input
                      type="checkbox"
                      className="user-card-checkbox"
                      checked={selectedStudentIds.includes(user.id)}
                      onChange={() => handleToggleStudentSelection(user.id)}
                      title={t('manage.selectStudentForPromotion')}
                    />
                  )}
                  <div className="user-card-identity">
                    <h3 className="user-card-name">
                      {user.name}
                      {user.mustChangePassword && (
                        <span
                          title={t('manage.mustChangePasswordWarning') || 'Usa ancora la password predefinita'}
                          style={{ marginLeft: '6px', verticalAlign: 'middle', color: '#e85d04' }}
                        >
                          <AlertTriangle size={15} />
                        </span>
                      )}
                      {user.role === 'student' && user.apprenticeshipEnd && new Date(user.apprenticeshipEnd) < new Date() && (
                        <span
                          title={t('manage.apprenticeshipExpiredWarning')}
                          style={{ marginLeft: '6px', verticalAlign: 'middle', color: '#dc2626' }}
                        >
                          <AlertTriangle size={15} />
                        </span>
                      )}
                    </h3>
                    <span className="user-card-username">@{user.username}</span>
                  </div>
                  <div className="user-card-aside">
                    <span className={`manage-role-badge role-${user.role}`}>{getRoleLabel(user.role)}</span>
                    <div className="user-actions">
                      <button
                        className="btn-icon btn-edit"
                        onClick={() => handleEditUser(user)}
                        title={t('manage.edit')}
                      >
                        <Edit2 size={16} />
                      </button>
                      <button
                        className="btn-icon btn-delete"
                        onClick={() => handleDeleteUser(user.id)}
                        title={t('manage.delete')}
                        disabled={user.id === currentUser.id}
                      >
                        <Trash2 size={16} />
                      </button>
                      <button
                        className="btn-icon btn-reset"
                        onClick={() => handleResetPassword(user.id, user.name)}
                        title={t('manage.resetPassword')}
                      >
                        <KeyRound size={16} />
                      </button>
                    </div>
                  </div>
                </div>
                <div className="manage-user-tags">
                  {user.studentNumber && <span className="manage-user-tag">{t('manage.studentNumber')}: {user.studentNumber}</span>}
                  {user.formationYear && <span className="manage-user-tag">{t('manage.formationYear')}: {user.formationYear}</span>}
                  {user.role === 'student' && user.inspectorId && (
                    <span className="manage-user-tag">
                      {t('manage.inspectorReference')}: {(inspectorOptions.find((inspector) => inspector.id === user.inspectorId) || {}).name || '-'}
                    </span>
                  )}
                  {user.apprenticeshipStart && <span className="manage-user-tag">{t('manage.apprenticeshipStart')}: {user.apprenticeshipStart}</span>}
                  {user.apprenticeshipEnd && <span className="manage-user-tag">{t('manage.apprenticeshipEnd')}: {user.apprenticeshipEnd}</span>}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="card manage-audit-card">
        <div className="manage-audit-header">
          <h3>{t('manage.auditTitle')}</h3>
          <button className="btn-secondary" onClick={() => setShowAudit((prev) => !prev)}>
            {showAudit ? t('manage.hide') : t('manage.show')}
          </button>
        </div>
        {showAudit && auditLogEntries.length === 0 ? (
          <p style={{ margin: 0, color: 'var(--text-secondary)' }}>{t('manage.auditEmpty')}</p>
        ) : null}
        {showAudit ? (
          <div className="manage-audit-list">
            {auditLogEntries.map((entry) => {
              const when = new Date(entry.timestamp).toLocaleString();
              const isReset = entry.action === 'password_reset';
              const eventLabel = isReset ? t('manage.auditPasswordReset') : t('manage.auditBulkAssign');
              const details = isReset
                ? `${entry.targetUserName || '-'} (${entry.targetUserId || '-'})`
                : `${(entry.studentIds || []).length} ${t('manage.student')}`;

              return (
                <div
                  key={entry.id}
                  className="manage-audit-item"
                >
                  <div style={{ fontWeight: 600 }}>{eventLabel}</div>
                  <div style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
                    {t('manage.auditBy')}: {entry.actorName || '-'} | {t('manage.auditWhen')}: {when}
                  </div>
                  <div style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>{details}</div>
                </div>
              );
            })}
          </div>
        ) : null}
      </div>
    </div>
  );
};

export default ManageSection;
