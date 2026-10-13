import { Routes, Route } from 'react-router-dom';
import { Layout } from './components/Layout';
import { TodayView } from './pages/TodayView';
import { RewardTimer } from './pages/RewardTimer';
import { StatsView } from './pages/StatsView';
import { PointsView } from './pages/PointsView';
import { BadgesView } from './pages/BadgesView';

function App() {
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<TodayView />} />
        <Route path="/timer/:planId" element={<RewardTimer />} />
        <Route path="/stats" element={<StatsView />} />
        <Route path="/points" element={<PointsView />} />
        <Route path="/badges" element={<BadgesView />} />
      </Routes>
    </Layout>
  );
}

export default App;
