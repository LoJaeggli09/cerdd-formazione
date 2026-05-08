// Grading system data management
// Grades are stored in localStorage with keys like `grades_${studentId}`
// Each grade entry has: id, grade (0-6), studentComment, trainerComment, date, objectiveId (optional)

// Module tests are stored in localStorage with keys like `moduleTests_${studentId}_${moduleId}`
// Each test entry has: id, notes, comments, date

export const saveGrade = (studentId, gradeData) => {
  const key = `grades_${studentId}`;
  const existingGrades = loadGrades(studentId);
  const newGrade = {
    id: Date.now().toString(),
    subject: gradeData.subject || 'cultureGeneral',
    grade: parseFloat(gradeData.grade),
    studentComment: gradeData.studentComment || '',
    trainerComment: gradeData.trainerComment || '',
    date: new Date().toISOString(),
    objectiveId: gradeData.objectiveId || null
  };

  existingGrades.push(newGrade);
  localStorage.setItem(key, JSON.stringify(existingGrades));
  return newGrade;
};

export const loadGrades = (studentId) => {
  const key = `grades_${studentId}`;
  const stored = localStorage.getItem(key);
  if (!stored) return [];
  
  try {
    return JSON.parse(stored);
  } catch (e) {
    return [];
  }
};

export const updateGrade = (studentId, gradeId, updatedData) => {
  const grades = loadGrades(studentId);
  const index = grades.findIndex(g => g.id === gradeId);
  if (index === -1) return false;

  grades[index] = {
    ...grades[index],
    ...updatedData,
    subject: updatedData.subject || grades[index].subject || 'cultureGeneral',
    grade: parseFloat(updatedData.grade)
  };
  localStorage.setItem(`grades_${studentId}`, JSON.stringify(grades));
  return true;
};

export const deleteGrade = (studentId, gradeId) => {
  const grades = loadGrades(studentId);
  const filtered = grades.filter(g => g.id !== gradeId);
  localStorage.setItem(`grades_${studentId}`, JSON.stringify(filtered));
  return true;
};

export const getAverageGrade = (studentId) => {
  const grades = loadGrades(studentId);
  if (grades.length === 0) return null;
  
  const sum = grades.reduce((acc, g) => acc + g.grade, 0);
  return (sum / grades.length).toFixed(1);
};

export const getModuleAverage = (studentId, moduleId) => {
  const tests = loadModuleTests(studentId, moduleId);
  const scores = tests
    .map((test) => Number(test.score))
    .filter((score) => !Number.isNaN(score));
  if (scores.length === 0) return null;
  const sum = scores.reduce((acc, score) => acc + score, 0);
  return (sum / scores.length).toFixed(1);
};

export const getTotalAverage = (studentId) => {
  const gradeScores = loadGrades(studentId)
    .map((g) => Number(g.grade))
    .filter((score) => !Number.isNaN(score));

  const moduleScores = getAllModules()
    .flatMap((moduleId) => loadModuleTests(studentId, moduleId))
    .map((test) => Number(test.score))
    .filter((score) => !Number.isNaN(score));

  const allScores = [...gradeScores, ...moduleScores];
  if (allScores.length === 0) return null;
  const sum = allScores.reduce((acc, score) => acc + score, 0);
  return (sum / allScores.length).toFixed(1);
};

// Module Tests functions
export const saveModuleTest = (studentId, moduleId, testData) => {
  const key = `moduleTests_${studentId}_${moduleId}`;
  const existingTests = loadModuleTests(studentId, moduleId);
  const newTest = {
    id: Date.now().toString(),
    notes: testData.notes || '',
    comments: testData.comments || '',
    score: testData.score !== undefined ? parseFloat(testData.score) : null,
    date: new Date().toISOString()
  };

  existingTests.push(newTest);
  localStorage.setItem(key, JSON.stringify(existingTests));
  return newTest;
};

export const loadModuleTests = (studentId, moduleId) => {
  const key = `moduleTests_${studentId}_${moduleId}`;
  const stored = localStorage.getItem(key);
  if (!stored) return [];
  
  try {
    return JSON.parse(stored);
  } catch (e) {
    return [];
  }
};

export const updateModuleTest = (studentId, moduleId, testId, updatedData) => {
  const tests = loadModuleTests(studentId, moduleId);
  const index = tests.findIndex(t => t.id === testId);
  if (index === -1) return false;

  tests[index] = {
    ...tests[index],
    ...updatedData,
    score: updatedData.score !== undefined ? parseFloat(updatedData.score) : tests[index].score
  };
  localStorage.setItem(`moduleTests_${studentId}_${moduleId}`, JSON.stringify(tests));
  return true;
};

export const deleteModuleTest = (studentId, moduleId, testId) => {
  const tests = loadModuleTests(studentId, moduleId);
  const filtered = tests.filter(t => t.id !== testId);
  localStorage.setItem(`moduleTests_${studentId}_${moduleId}`, JSON.stringify(filtered));
  return true;
};

// Get all unique modules from training plan
export const getAllModules = () => {
  const { trainingPlan } = require('./trainingPlan');
  const modules = new Set();
  
  trainingPlan.competenceFields.forEach(field => {
    field.competencies.forEach(competency => {
      competency.objectives.forEach(objective => {
        objective.modules.forEach(module => {
          modules.add(module);
        });
      });
    });
  });
  
  return Array.from(modules).sort();
};

// Get module details (competencies and objectives)
export const getModuleDetails = (moduleId) => {
  const { trainingPlan } = require('./trainingPlan');
  const details = {
    id: moduleId,
    competencies: [],
    field: null
  };

  trainingPlan.competenceFields.forEach(field => {
    field.competencies.forEach(competency => {
      const relevantObjectives = competency.objectives.filter(objective => 
        objective.modules.includes(moduleId)
      );
      
      if (relevantObjectives.length > 0) {
        details.field = field;
        details.competencies.push({
          ...competency,
          objectives: relevantObjectives
        });
      }
    });
  });

  return details;
};