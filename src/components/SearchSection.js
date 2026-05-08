import React, { useState, useMemo } from 'react';
import { Search, Filter, X, CheckCircle, Circle, Award } from 'lucide-react';
import { translate } from '../i18n';
import { trainingPlan, bloomLevels } from '../data/trainingPlan';

const SearchSection = ({ currentUser, language, progress, comments = {}, notifications, onNavigate }) => {
  const t = (key) => translate(key, language);
  
  const [searchQuery, setSearchQuery] = useState('');
  const [searchIn, setSearchIn] = useState({
    objectives: true,
    comments: true,
    notifications: true
  });
  const [filters, setFilters] = useState({
    status: 'all', // all, completed, notCompleted, approved
    field: 'all', // all, A, B, C, D
    bloomLevel: 'all', // all, C1-C6
    year: 'all' // all, 1, 2, 3
  });
  const [showFilters, setShowFilters] = useState(false);

  // Get all objectives with their full context
  const getAllObjectives = () => {
    const objectives = [];
    trainingPlan.competenceFields.forEach(field => {
      field.competencies.forEach(competency => {
        competency.objectives.forEach(objective => {
          objectives.push({
            ...objective,
            fieldId: field.id,
            fieldName: field.name,
            competencyId: competency.id,
            competencyName: competency.name,
            type: 'objective'
          });
        });
      });
    });
    return objectives;
  };

  // Get all comments for current user
  const getAllComments = () => {
    const result = [];
    const allObjectives = getAllObjectives();

    allObjectives.forEach(obj => {
      const comment = comments[obj.id];
      if (comment && (comment.student || comment.trainer)) {
        result.push({
          ...obj,
          studentComment: comment.student || '',
          trainerComment: comment.trainer || '',
          type: 'comment'
        });
      }
    });
    return result;
  };

  // Apply filters
  const applyFilters = (items) => {
    return items.filter(item => {
      // Status filter
      if (filters.status !== 'all') {
        const isCompleted = progress[item.id]?.completed || false;
        const isApproved = progress[item.id]?.approved || false;
        
        if (filters.status === 'completed' && !isCompleted) return false;
        if (filters.status === 'notCompleted' && isCompleted) return false;
        if (filters.status === 'approved' && !isApproved) return false;
      }

      // Field filter
      if (filters.field !== 'all' && item.fieldId !== filters.field) return false;

      // Bloom level filter
      if (filters.bloomLevel !== 'all' && item.level !== filters.bloomLevel) return false;

      // Year filter (based on module - simplified logic)
      if (filters.year !== 'all') {
        // This is a simplified implementation - you can enhance based on actual module-year mapping
        const yearNum = parseInt(filters.year);
        // For now, we'll just show all if year filter is selected
        // You can add more sophisticated year-based filtering logic here
      }

      return true;
    });
  };

  // Search results
  const searchResults = useMemo(() => {
    if (!searchQuery.trim()) return [];

    const query = searchQuery.toLowerCase();
    const results = [];

    // Search in objectives
    if (searchIn.objectives) {
      const objectives = applyFilters(getAllObjectives());
      objectives.forEach(obj => {
        const objectiveText = t(`objective.${obj.id}`).toLowerCase();
        const competencyName = obj.competencyName.toLowerCase();
        const fieldName = obj.fieldName.toLowerCase();
        
        if (objectiveText.includes(query) || 
            competencyName.includes(query) || 
            fieldName.includes(query) ||
            obj.id.toLowerCase().includes(query)) {
          results.push({
            ...obj,
            matchText: t(`objective.${obj.id}`),
            matchType: 'objective',
            score: objectiveText.includes(query) ? 3 : 1
          });
        }
      });
    }

    // Search in comments
    if (searchIn.comments) {
      const comments = applyFilters(getAllComments());
      comments.forEach(obj => {
        const studentComment = obj.studentComment.toLowerCase();
        const trainerComment = obj.trainerComment.toLowerCase();
        
        if (studentComment.includes(query) || trainerComment.includes(query)) {
          const matchText = studentComment.includes(query) 
            ? obj.studentComment 
            : obj.trainerComment;
          
          results.push({
            ...obj,
            matchText: matchText,
            matchType: 'comment',
            commentAuthor: studentComment.includes(query) ? 'student' : 'trainer',
            score: 2
          });
        }
      });
    }

    // Search in notifications
    if (searchIn.notifications) {
      notifications.forEach(notif => {
        const message = notif.message?.toLowerCase() || '';
        const objectiveId = notif.objectiveId?.toLowerCase() || '';
        
        if (message.includes(query) || objectiveId.includes(query)) {
          results.push({
            ...notif,
            matchText: notif.message,
            matchType: 'notification',
            score: 1,
            type: 'notification'
          });
        }
      });
    }

    // Sort by relevance score
    return results.sort((a, b) => b.score - a.score);
  }, [searchQuery, searchIn, filters, progress, notifications, language]);

  const handleClearFilters = () => {
    setFilters({
      status: 'all',
      field: 'all',
      bloomLevel: 'all',
      year: 'all'
    });
  };

  const handleResultClick = (result) => {
    if (result.matchType === 'notification') {
      onNavigate('inbox');
      return;
    }

    onNavigate('objectives', {
      objectiveId: result.id,
      fieldId: result.fieldId,
      competencyId: result.competencyId
    });
  };

  const getStatusIcon = (result) => {
    const isCompleted = progress[result.id]?.completed || false;
    const isApproved = progress[result.id]?.approved || false;
    
    if (isApproved) return <Award className="text-green-500" size={16} />;
    if (isCompleted) return <CheckCircle className="text-blue-500" size={16} />;
    return <Circle className="text-gray-400" size={16} />;
  };

  const highlightText = (text, query) => {
    if (!query.trim()) return text;
    
    const parts = text.split(new RegExp(`(${query})`, 'gi'));
    return parts.map((part, i) => 
      part.toLowerCase() === query.toLowerCase() 
        ? <mark key={i} className="bg-yellow-200 dark:bg-yellow-700">{part}</mark>
        : part
    );
  };

  return (
    <div className="search-section">
      {/* Header */}
      <div className="search-header">
        <div className="search-title-group">
          <Search size={32} className="search-icon-title" />
          <div>
            <h2 className="search-main-title">{t('search.title')}</h2>
            <p className="search-subtitle">
              {searchResults.length > 0 
                ? `${searchResults.length} ${t('search.resultsFound')}`
                : t('search.enterQuery')}
            </p>
          </div>
        </div>
        <button
          onClick={() => setShowFilters(!showFilters)}
          className={`filter-toggle-btn ${showFilters ? 'active' : ''}`}
        >
          <Filter size={18} />
          <span>{showFilters ? t('search.hideFilters') : t('search.showFilters')}</span>
        </button>
      </div>

      {/* Search Bar */}
      <div className="search-bar-container">
        <div className="search-bar-wrapper">
          <Search className="search-bar-icon" size={22} />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={t('search.placeholder')}
            className="search-input"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="search-clear-btn"
            >
              <X size={20} />
            </button>
          )}
        </div>
      </div>

      {/* Search In Options */}
      <div className="search-options-container">
        <div className="search-options-title">Cerca in:</div>
        <div className="search-options-grid">
          <label className="search-checkbox-label">
            <input
              type="checkbox"
              checked={searchIn.objectives}
              onChange={(e) => setSearchIn({ ...searchIn, objectives: e.target.checked })}
              className="search-checkbox"
            />
            <span className="checkbox-text">{t('search.inObjectives')}</span>
            <span className="checkbox-badge">{getAllObjectives().length}</span>
          </label>
          <label className="search-checkbox-label">
            <input
              type="checkbox"
              checked={searchIn.comments}
              onChange={(e) => setSearchIn({ ...searchIn, comments: e.target.checked })}
              className="search-checkbox"
            />
            <span className="checkbox-text">{t('search.inComments')}</span>
            <span className="checkbox-badge">{getAllComments().length}</span>
          </label>
          <label className="search-checkbox-label">
            <input
              type="checkbox"
              checked={searchIn.notifications}
              onChange={(e) => setSearchIn({ ...searchIn, notifications: e.target.checked })}
              className="search-checkbox"
            />
            <span className="checkbox-text">{t('search.inNotifications')}</span>
            <span className="checkbox-badge">{notifications.length}</span>
          </label>
        </div>
      </div>

      {/* Filters Panel */}
      {showFilters && (
        <div className="filters-panel">
          <div className="filters-header">
            <h3 className="filters-title">
              <Filter size={20} />
              {t('search.filters')}
            </h3>
            <button
              onClick={handleClearFilters}
              className="clear-filters-btn"
            >
              {t('search.clearFilters')}
            </button>
          </div>

          <div className="filters-grid">
            {/* Status Filter */}
            <div className="filter-group">
              <label className="filter-label">
                {t('search.filterStatus')}
              </label>
              <select
                value={filters.status}
                onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                className="filter-select"
              >
                <option value="all">{t('search.statusAll')}</option>
                <option value="completed">{t('search.statusCompleted')}</option>
                <option value="notCompleted">{t('search.statusNotCompleted')}</option>
                <option value="approved">{t('search.statusApproved')}</option>
              </select>
            </div>

            {/* Field Filter */}
            <div className="filter-group">
              <label className="filter-label">
                {t('search.filterField')}
              </label>
              <select
                value={filters.field}
                onChange={(e) => setFilters({ ...filters, field: e.target.value })}
                className="filter-select"
              >
                <option value="all">{t('search.fieldAll')}</option>
                <option value="A">{t('search.fieldA')}</option>
                <option value="B">{t('search.fieldB')}</option>
                <option value="C">{t('search.fieldC')}</option>
                <option value="D">{t('search.fieldD')}</option>
              </select>
            </div>

            {/* Bloom Level Filter */}
            <div className="filter-group">
              <label className="filter-label">
                {t('search.filterBloom')}
              </label>
              <select
                value={filters.bloomLevel}
                onChange={(e) => setFilters({ ...filters, bloomLevel: e.target.value })}
                className="filter-select"
              >
                <option value="all">{t('search.bloomAll')}</option>
                <option value="C1">C1 - {bloomLevels.C1.name}</option>
                <option value="C2">C2 - {bloomLevels.C2.name}</option>
                <option value="C3">C3 - {bloomLevels.C3.name}</option>
                <option value="C4">C4 - {bloomLevels.C4.name}</option>
                <option value="C5">C5 - {bloomLevels.C5.name}</option>
                <option value="C6">C6 - {bloomLevels.C6.name}</option>
              </select>
            </div>

            {/* Year Filter */}
            <div className="filter-group">
              <label className="filter-label">
                {t('search.filterYear')}
              </label>
              <select
                value={filters.year}
                onChange={(e) => setFilters({ ...filters, year: e.target.value })}
                className="filter-select"
              >
                <option value="all">{t('search.yearAll')}</option>
                <option value="1">{t('search.year1')}</option>
                <option value="2">{t('search.year2')}</option>
                <option value="3">{t('search.year3')}</option>
              </select>
            </div>
          </div>
        </div>
      )}

      {/* Results */}
      <div className="search-results-container">
        {searchResults.map((result, index) => (
          <div
            key={`${result.type}-${result.id || result.timestamp}-${index}`}
            onClick={() => handleResultClick(result)}
            className="search-result-card"
            style={{
              borderLeftColor: result.matchType === 'objective' ? '#3b82f6' :
                              result.matchType === 'comment' ? '#10b981' : '#f59e0b'
            }}
          >
            <div className="result-content">
              <div className="result-main">
                {/* Header */}
                <div className="result-header">
                  {result.matchType !== 'notification' && (
                    <div className="result-status-icon">
                      {getStatusIcon(result)}
                    </div>
                  )}
                  <span className="result-type-badge" style={{
                    backgroundColor: result.matchType === 'objective' ? '#dbeafe' :
                                   result.matchType === 'comment' ? '#d1fae5' : '#fed7aa'
                  }}>
                    {result.matchType === 'objective' && t('search.typeObjective')}
                    {result.matchType === 'comment' && t('search.typeComment')}
                    {result.matchType === 'notification' && t('search.typeNotification')}
                  </span>
                  <span className="result-divider">•</span>
                  <span className="result-id">
                    {result.id || result.objectiveId}
                  </span>
                  {result.level && (
                    <>
                      <span className="result-divider">•</span>
                      <span
                        className="result-bloom-badge"
                        style={{ 
                          backgroundColor: bloomLevels[result.level].color + '20',
                          color: bloomLevels[result.level].color
                        }}
                      >
                        {result.level}
                      </span>
                    </>
                  )}
                </div>

                {/* Field & Competency */}
                {result.fieldName && (
                  <div className="result-breadcrumb">
                    {result.fieldName} → {result.competencyName}
                  </div>
                )}

                {/* Match Text */}
                <div className="result-text">
                  {highlightText(result.matchText, searchQuery)}
                </div>

                {/* Comment Author Tag */}
                {result.matchType === 'comment' && (
                  <div className="result-tags">
                    <span className="result-comment-tag">
                      {result.commentAuthor === 'student' ? t('comments.student') : t('comments.trainer')}
                    </span>
                  </div>
                )}
              </div>

              {/* Arrow Icon */}
              <div className="result-arrow">
                →
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* No Results */}
      {searchQuery && searchResults.length === 0 && (
        <div className="no-results-container">
          <Search className="no-results-icon" size={64} />
          <p className="no-results-title">{t('search.noResults')}</p>
          <p className="no-results-subtitle">
            {t('search.tryDifferent')}
          </p>
        </div>
      )}

      {/* CSS for highlight animation */}
      <style>{`
        .search-section {
          padding: 2rem;
          max-width: 1400px;
          margin: 0 auto;
        }

        .search-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 2rem;
          flex-wrap: wrap;
          gap: 1rem;
        }

        .search-title-group {
          display: flex;
          align-items: center;
          gap: 1rem;
        }

        .search-icon-title {
          color: #3b82f6;
          min-width: 32px;
        }

        .search-main-title {
          font-size: 1.875rem;
          font-weight: 700;
          color: #3b82f6;
          margin: 0;
        }

        .search-subtitle {
          font-size: 0.875rem;
          color: #949ba8;
          margin: 0.25rem 0 0 0;
        }

        .filter-toggle-btn {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.75rem 1.5rem;
          background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
          color: white;
          border: none;
          border-radius: 12px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s ease;
          box-shadow: 0 4px 6px rgba(59, 130, 246, 0.2);
        }

        .filter-toggle-btn:hover {
          background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%);
          transform: translateY(-2px);
          box-shadow: 0 6px 12px rgba(59, 130, 246, 0.3);
        }

        .filter-toggle-btn.active {
          background: linear-gradient(135deg, #1d4ed8 0%, #1e40af 100%);
        }

        .search-bar-container {
          margin-bottom: 2rem;
        }

        .search-bar-wrapper {
          position: relative;
          max-width: 800px;
          margin: 0 auto;
        }

        .search-bar-icon {
          position: absolute;
          left: 1.25rem;
          top: 50%;
          transform: translateY(-50%);
          color: #9ca3af;
          pointer-events: none;
        }

        .search-input {
          width: 100%;
          padding: 1rem 3.5rem 1rem 3.5rem;
          font-size: 1.125rem;
          border: 2px solid #e5e7eb;
          border-radius: 16px;
          outline: none;
          transition: all 0.3s ease;
          background: white;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
        }

        .search-input:focus {
          border-color: #3b82f6;
          box-shadow: 0 4px 12px rgba(59, 130, 246, 0.15);
        }

        .search-input::placeholder {
          color: #9ca3af;
        }

        .search-clear-btn {
          position: absolute;
          right: 1rem;
          top: 50%;
          transform: translateY(-50%);
          background: #f3f4f6;
          border: none;
          border-radius: 8px;
          padding: 0.5rem;
          cursor: pointer;
          color: #6b7280;
          transition: all 0.2s ease;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .search-clear-btn:hover {
          background: #e5e7eb;
          color: #374151;
        }

        .search-options-container {
          background: linear-gradient(135deg, #f9fafb 0%, #f3f4f6 100%);
          padding: 1.5rem;
          border-radius: 16px;
          margin-bottom: 2rem;
          border: 1px solid #e5e7eb;
        }

        .search-options-title {
          font-weight: 600;
          color: #4b5563;
          margin-bottom: 1rem;
          font-size: 0.875rem;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }

        .search-options-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 1rem;
        }

        .search-checkbox-label {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          padding: 1rem;
          background: white;
          border-radius: 12px;
          cursor: pointer;
          transition: all 0.2s ease;
          border: 2px solid transparent;
        }

        .search-checkbox-label:hover {
          border-color: #3b82f6;
          box-shadow: 0 4px 8px rgba(59, 130, 246, 0.1);
        }

        .search-checkbox {
          width: 1.25rem;
          height: 1.25rem;
          accent-color: #3b82f6;
          cursor: pointer;
        }

        .checkbox-text {
          flex: 1;
          font-weight: 500;
          color: #374151;
        }

        .checkbox-badge {
          background: #3b82f6;
          color: white;
          padding: 0.25rem 0.625rem;
          border-radius: 12px;
          font-size: 0.75rem;
          font-weight: 600;
        }

        .filters-panel {
          background: white;
          border-radius: 16px;
          padding: 1.5rem;
          margin-bottom: 2rem;
          border: 2px solid #e5e7eb;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
          animation: slideDown 0.3s ease;
        }

        @keyframes slideDown {
          from {
            opacity: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .filters-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 1.5rem;
        }

        .filters-title {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          font-size: 1.125rem;
          font-weight: 600;
          color: #1f2937;
          margin: 0;
        }

        .clear-filters-btn {
          background: none;
          border: none;
          color: #3b82f6;
          font-weight: 600;
          cursor: pointer;
          padding: 0.5rem 1rem;
          border-radius: 8px;
          transition: all 0.2s ease;
        }

        .clear-filters-btn:hover {
          background: #eff6ff;
          color: #2563eb;
        }

        .filters-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 1.5rem;
        }

        .filter-group {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }

        .filter-label {
          font-weight: 600;
          font-size: 0.875rem;
          color: #374151;
        }

        .filter-select {
          padding: 0.75rem;
          border: 2px solid #e5e7eb;
          border-radius: 10px;
          background: white;
          color: #1f2937;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .filter-select:focus {
          outline: none;
          border-color: #3b82f6;
          box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
        }

        .filter-select:hover {
          border-color: #cbd5e1;
        }

        .search-results-container {
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }

        .search-result-card {
          background: white;
          border-radius: 12px;
          padding: 1.5rem;
          border-left: 4px solid;
          cursor: pointer;
          transition: all 0.3s ease;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
        }

        .search-result-card:hover {
          box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
          transform: translateY(-2px);
        }

        .result-content {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 1.5rem;
        }

        .result-main {
          flex: 1;
          min-width: 0;
        }

        .result-header {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          flex-wrap: wrap;
          margin-bottom: 0.75rem;
        }

        .result-status-icon {
          display: flex;
          align-items: center;
        }

        .result-type-badge {
          padding: 0.25rem 0.75rem;
          border-radius: 12px;
          font-size: 0.75rem;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }

        .result-divider {
          color: #d1d5db;
          font-weight: bold;
        }

        .result-id {
          font-weight: 600;
          color: #6b7280;
          font-size: 0.875rem;
        }

        .result-bloom-badge {
          padding: 0.25rem 0.625rem;
          border-radius: 8px;
          font-size: 0.75rem;
          font-weight: 700;
        }

        .result-breadcrumb {
          color: #6b7280;
          font-size: 0.875rem;
          margin-bottom: 0.5rem;
        }

        .result-text {
          color: #1f2937;
          font-size: 1rem;
          line-height: 1.5;
          margin-bottom: 0.75rem;
        }

        .result-text mark {
          background-color: #fef3c7;
          color: #92400e;
          padding: 0.125rem 0.25rem;
          border-radius: 4px;
          font-weight: 600;
        }

        .result-tags {
          display: flex;
          gap: 0.5rem;
        }

        .result-comment-tag {
          display: inline-flex;
          align-items: center;
          padding: 0.375rem 0.75rem;
          background: #d1fae5;
          color: #065f46;
          border-radius: 12px;
          font-size: 0.75rem;
          font-weight: 600;
        }

        .result-arrow {
          color: #9ca3af;
          font-size: 1.5rem;
          font-weight: 300;
          flex-shrink: 0;
        }

        .no-results-container {
          text-align: center;
          padding: 4rem 2rem;
        }

        .no-results-icon {
          margin: 0 auto 1.5rem;
          color: #d1d5db;
        }

        .no-results-title {
          font-size: 1.25rem;
          font-weight: 600;
          color: #374151;
          margin-bottom: 0.5rem;
        }

        .no-results-subtitle {
          color: #6b7280;
          font-size: 0.875rem;
        }

        @keyframes highlight-pulse {
          0%, 100% { background-color: transparent; }
          50% { background-color: rgba(59, 130, 246, 0.1); }
        }
        
        .highlight-pulse {
          animation: highlight-pulse 1s ease-in-out 2;
        }
      `}</style>
    </div>
  );
};

export default SearchSection;
