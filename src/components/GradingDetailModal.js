import React, { useState } from 'react';
import { Modal, Box, Typography, Button, TextField, IconButton, List, ListItem, ListItemText, Divider, Chip } from '@mui/material';
import { Star, MessageSquare, Edit, Trash2, Save, X, Plus } from 'lucide-react';
import { translate } from '../i18n';

const GradingDetailModal = ({
  open,
  onClose,
  item,
  itemType, // 'subject' or 'module'
  studentId,
  language = 'it',
  userRole = 'student',
  isTrainer = false,
  isReadOnly = false,
  onSaveGrade,
  onSaveTest,
  onDeleteGrade,
  onDeleteTest,
  grades = [],
  tests = [],
  average,
  moduleDetails = null
}) => {
  const t = (key) => translate(key, language);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [formData, setFormData] = useState({
    grade: '',
    score: '',
    studentComment: '',
    trainerComment: '',
    comments: ''
  });

  const canEdit = !isReadOnly && ((userRole === 'student' && !isTrainer) || isTrainer);

  const resetForm = () => {
    setFormData({
      grade: '',
      score: '',
      studentComment: '',
      trainerComment: '',
      comments: ''
    });
    setEditingItem(null);
    setShowAddForm(false);
  };

  const handleEdit = (item) => {
    setEditingItem(item);
    if (itemType === 'subject') {
      setFormData({
        grade: item.grade.toString(),
        studentComment: item.studentComment || '',
        trainerComment: item.trainerComment || '',
        comments: ''
      });
    } else {
      setFormData({
        grade: '',
        score: (item.score || '').toString(),
        studentComment: '',
        trainerComment: '',
        comments: item.comments || ''
      });
    }
    setShowAddForm(true);
  };

  const handleSave = () => {
    if (itemType === 'subject') {
      const gradeValue = parseFloat(formData.grade);
      if (Number.isNaN(gradeValue) || gradeValue < 0 || gradeValue > 6) {
        alert(t('grading.gradeRange') || 'Grade must be between 0 and 6');
        return;
      }
      onSaveGrade({
        subject: item.key,
        grade: gradeValue,
        studentComment: formData.studentComment,
        trainerComment: formData.trainerComment
      }, editingItem);
    } else {
      const scoreValue = parseFloat(formData.score);
      if (Number.isNaN(scoreValue) || scoreValue < 0 || scoreValue > 6) {
        alert(t('moduleTests.scoreRange') || 'Score must be between 0 and 6');
        return;
      }
      onSaveTest(item, {
        score: scoreValue,
        comments: formData.comments
      }, editingItem);
    }
    resetForm();
  };

  const renderStars = (grade) => {
    const stars = [];
    for (let i = 1; i <= 6; i++) {
      stars.push(
        <Star
          key={i}
          size={16}
          className={i <= grade ? 'text-yellow-500 fill-yellow-500' : 'text-gray-300'}
        />
      );
    }
    return stars;
  };

  const modalStyle = {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    width: '90%',
    maxWidth: 800,
    maxHeight: '90vh',
    bgcolor: 'background.paper',
    boxShadow: 24,
    p: 4,
    borderRadius: 2,
    overflow: 'auto'
  };

  return (
    <Modal open={open} onClose={onClose}>
      <Box sx={modalStyle}>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
          <Typography variant="h5" component="h2">
            {itemType === 'subject' ? item.label : `${t('moduleTests.module')} ${item}`}
          </Typography>
          <IconButton onClick={onClose}>
            <X size={24} />
          </IconButton>
        </Box>

        {/* Module/Subject Details */}
        {itemType === 'module' && moduleDetails && (
          <Box mb={3}>
            <Typography variant="h6" gutterBottom>
              {t('moduleTests.moduleContents') || 'Contenuti del Modulo'}
            </Typography>
            {moduleDetails.field && (
              <Box mb={2}>
                <Typography variant="subtitle1" color="primary">
                  {moduleDetails.field.name}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {moduleDetails.field.description}
                </Typography>
              </Box>
            )}
            {moduleDetails.competencies.map((competency, idx) => (
              <Box key={idx} mb={2}>
                <Typography variant="subtitle2" sx={{ fontWeight: 'bold' }}>
                  {competency.name}
                </Typography>
                <List dense>
                  {competency.objectives.map((objective) => (
                    <ListItem key={objective.id}>
                      <ListItemText
                        primary={objective.text}
                        secondary={`Livello: ${objective.level}`}
                      />
                    </ListItem>
                  ))}
                </List>
              </Box>
            ))}
            <Divider sx={{ my: 2 }} />
          </Box>
        )}

        {/* Average */}
        {average && (
          <Box display="flex" alignItems="center" mb={3}>
            <Typography variant="h6" sx={{ mr: 2 }}>
              {t('grading.average')}: {average}
            </Typography>
            <Box display="flex">
              {renderStars(Math.round(parseFloat(average)))}
            </Box>
          </Box>
        )}

        {/* Grades/Tests List */}
        <Box mb={3}>
          <Typography variant="h6" gutterBottom>
            {itemType === 'subject' ? t('grading.grades') || 'Valutazioni' : t('moduleTests.title')}
          </Typography>
          <List>
            {(itemType === 'subject' ? grades : tests).map((item, index) => (
              <ListItem key={item.id || index} divider>
                <ListItemText
                  primary={
                    <Box display="flex" alignItems="center" gap={2}>
                      {itemType === 'subject' ? (
                        <>
                          <Typography variant="body1" sx={{ fontWeight: 'bold' }}>
                            {item.grade}
                          </Typography>
                          <Box display="flex">
                            {renderStars(Math.round(item.grade))}
                          </Box>
                        </>
                      ) : (
                        <>
                          <Typography variant="body1" sx={{ fontWeight: 'bold' }}>
                            {item.score || 'N/A'}
                          </Typography>
                          {item.score && (
                            <Box display="flex">
                              {renderStars(Math.round(item.score))}
                            </Box>
                          )}
                        </>
                      )}
                      <Typography variant="body2" color="text.secondary">
                        {new Date(item.date).toLocaleDateString(language === 'it' ? 'it-IT' : language === 'en' ? 'en-US' : language === 'de' ? 'de-DE' : 'fr-FR')}
                      </Typography>
                    </Box>
                  }
                  secondary={
                    <Box>
                      {item.studentComment && (
                        <Box mt={1}>
                          <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                            <MessageSquare size={14} style={{ marginRight: 4, verticalAlign: 'middle' }} />
                            {t('grading.studentComment')}:
                          </Typography>
                          <Typography variant="body2">{item.studentComment}</Typography>
                        </Box>
                      )}
                      {item.trainerComment && (
                        <Box mt={1}>
                          <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                            <MessageSquare size={14} style={{ marginRight: 4, verticalAlign: 'middle' }} />
                            {t('grading.trainerComment')}:
                          </Typography>
                          <Typography variant="body2">{item.trainerComment}</Typography>
                        </Box>
                      )}
                    </Box>
                  }
                />
                {canEdit && (
                  <Box>
                    <IconButton
                      size="small"
                      onClick={() => handleEdit(item)}
                    >
                      <Edit size={16} />
                    </IconButton>
                    <IconButton
                      size="small"
                      onClick={() => itemType === 'subject' ? onDeleteGrade(item.id) : onDeleteTest(item, item.id)}
                    >
                      <Trash2 size={16} />
                    </IconButton>
                  </Box>
                )}
              </ListItem>
            ))}
          </List>
        </Box>

        {/* Add Form */}
        {canEdit && (
          <Box>
            {!showAddForm ? (
              <Button
                variant="contained"
                startIcon={<Plus />}
                onClick={() => setShowAddForm(true)}
              >
                {itemType === 'subject' ? t('grading.addGrade') : t('moduleTests.createTest')}
              </Button>
            ) : (
              <Box sx={{ mt: 2, p: 2, border: '1px solid #ddd', borderRadius: 1 }}>
                <Typography variant="h6" gutterBottom>
                  {editingItem ? (itemType === 'subject' ? t('grading.editGrade') : t('moduleTests.editTest')) : (itemType === 'subject' ? t('grading.addGrade') : t('moduleTests.createTest'))}
                </Typography>
                <Box display="flex" flexDirection="column" gap={2}>
                  {itemType === 'subject' ? (
                    <TextField
                      label={t('grading.gradeRange')}
                      type="number"
                      inputProps={{ min: 0, max: 6, step: 0.1 }}
                      value={formData.grade}
                      onChange={(e) => setFormData({ ...formData, grade: e.target.value })}
                      fullWidth
                    />
                  ) : (
                    <TextField
                      label={t('moduleTests.scoreRange')}
                      type="number"
                      inputProps={{ min: 0, max: 6, step: 0.1 }}
                      value={formData.score}
                      onChange={(e) => setFormData({ ...formData, score: e.target.value })}
                      fullWidth
                    />
                  )}

                  {(userRole === 'student' || editingItem) && itemType === 'subject' && (
                    <TextField
                      label={t('grading.studentComment')}
                      multiline
                      rows={2}
                      value={formData.studentComment}
                      onChange={(e) => setFormData({ ...formData, studentComment: e.target.value })}
                      fullWidth
                    />
                  )}

                  {(isTrainer || editingItem) && itemType === 'subject' && (
                    <TextField
                      label={t('grading.trainerComment')}
                      multiline
                      rows={2}
                      value={formData.trainerComment}
                      onChange={(e) => setFormData({ ...formData, trainerComment: e.target.value })}
                      fullWidth
                    />
                  )}

                  {itemType === 'module' && (
                    <>
                      <TextField
                        label={t('moduleTests.testComments')}
                        multiline
                        rows={2}
                        value={formData.comments}
                        onChange={(e) => setFormData({ ...formData, comments: e.target.value })}
                        fullWidth
                      />
                    </>
                  )}

                  <Box display="flex" gap={1}>
                    <Button variant="contained" startIcon={<Save />} onClick={handleSave}>
                      {t('grading.save')}
                    </Button>
                    <Button variant="outlined" startIcon={<X />} onClick={resetForm}>
                      {t('button.cancel')}
                    </Button>
                  </Box>
                </Box>
              </Box>
            )}
          </Box>
        )}
      </Box>
    </Modal>
  );
};

export default GradingDetailModal;