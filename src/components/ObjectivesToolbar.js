import React, { useState } from 'react';
import { Search, Filter, SortAsc, CheckSquare, Trash2, Move } from 'lucide-react';

const ObjectivesToolbar = ({ onSearch, onFilter, onSort, onBulkAction, selectedCount = 0 }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [sortBy, setSortBy] = useState('id');

  const handleSearchChange = (value) => {
    setSearchTerm(value);
    onSearch(value);
  };

  const handleFilterChange = (value) => {
    setFilterStatus(value);
    onFilter(value);
  };

  const handleSortChange = (value) => {
    setSortBy(value);
    onSort(value);
  };

  return (
    <div className="objectives-toolbar">
      <div className="toolbar-search">
        <Search size={18} />
        <input
          type="text"
          placeholder="Cerca obiettivi per ID o descrizione..."
          value={searchTerm}
          onChange={(e) => handleSearchChange(e.target.value)}
        />
      </div>

      <div className="toolbar-controls">
        <div className="toolbar-filter">
          <Filter size={16} />
          <select value={filterStatus} onChange={(e) => handleFilterChange(e.target.value)}>
            <option value="all">Tutti gli stati</option>
            <option value="completed">Completati</option>
            <option value="in-progress">In corso</option>
            <option value="not-started">Non iniziati</option>
          </select>
        </div>

        <div className="toolbar-sort">
          <SortAsc size={16} />
          <select value={sortBy} onChange={(e) => handleSortChange(e.target.value)}>
            <option value="id">ID</option>
            <option value="description">Descrizione</option>
            <option value="status">Stato</option>
            <option value="competence">Campo competenza</option>
          </select>
        </div>
      </div>

      {selectedCount > 0 && (
        <div className="toolbar-bulk-actions">
          <span className="bulk-count">{selectedCount} selezionati</span>
          <button
            className="bulk-action-btn complete"
            onClick={() => onBulkAction('complete')}
          >
            <CheckSquare size={16} />
            Completa selezionati
          </button>
          <button
            className="bulk-action-btn incomplete"
            onClick={() => onBulkAction('incomplete')}
          >
            <CheckSquare size={16} />
            Segna incompleti
          </button>
        </div>
      )}
    </div>
  );
};

export default ObjectivesToolbar;
