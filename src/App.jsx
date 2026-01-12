import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import Curriculum from './components/Curriculum';
import Dashboard from './components/Dashboard';
import Library from './components/Library';
import QuestionBank from './components/QuestionBank';
import PearlPool from './components/PearlPool';
import Settings from './components/Settings';
import PomodoroTimer from './components/PomodoroTimer';
import Analytics from './components/Analytics';
import MistakeBox from './components/MistakeBox';
import Planner from './components/Planner';

// Fitness Module Imports
import FitnessDashboard from './components/FitnessDashboard';
import WorkoutSchedule from './components/WorkoutSchedule';
import ProgressLog from './components/ProgressLog';
import SupplementStack from './components/SupplementStack';
import NutritionLog from './components/NutritionLog';
import Finance from './components/Finance';
import FinanceNewsHub from './components/FinanceNewsHub';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Dashboard />} />
          <Route path="planner" element={<Planner />} />
          <Route path="curriculum" element={<Curriculum />} />
          <Route path="analytics" element={<Analytics />} />
          <Route path="mistakes" element={<MistakeBox />} />
          <Route path="library" element={<Library />} />
          <Route path="pearls" element={<PearlPool />} />
          <Route path="questions" element={<QuestionBank />} />
          <Route path="pomodoro" element={<PomodoroTimer />} />
          <Route path="settings" element={<Settings />} />

          {/* Fitness & Health Module Routes */}
          <Route path="fitness">
            <Route index element={<FitnessDashboard />} />
            <Route path="schedule" element={<WorkoutSchedule />} />
            <Route path="progress" element={<ProgressLog />} />
            <Route path="supplements" element={<SupplementStack />} />
            <Route path="nutrition" element={<NutritionLog />} />
          </Route>

          {/* Finance & Investment Module Routes */}
          <Route path="finance">
            <Route index element={<Navigate to="portfolio" replace />} />
            <Route path="portfolio" element={<Finance />} />
            <Route path="studio" element={<FinanceNewsHub />} />
          </Route>
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
