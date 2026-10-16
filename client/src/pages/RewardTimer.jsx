import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Timer } from '../components/Timer';
import { useTimer } from '../hooks/useTimer';
import { useQuest } from '../context/QuestContext';
import { useUser } from '../context/UserContext';
import * as rewardSessionApi from '../api/rewardSessions';
import { ArrowLeft, Trophy } from 'lucide-react';

export function RewardTimer() {
  const { planId } = useParams();
  const navigate = useNavigate();
  const { dailyPlans, refreshDailyPlans } = useQuest();
  const { refreshUser } = useUser();
  const [plan, setPlan] = useState(null);
  const [finished, setFinished] = useState(false);
  const [result, setResult] = useState(null);

  useEffect(() => {
    refreshDailyPlans();
  }, [refreshDailyPlans]);

  useEffect(() => {
    const found = dailyPlans.find(p => p.id === planId);
    if (found) setPlan(found);
  }, [dailyPlans, planId]);

  const totalSeconds = plan ? plan.quest.daily_limit_minutes * 60 - (plan.used_seconds || 0) : 0;

  const handleComplete = async (elapsedSeconds) => {
    if (!plan || elapsedSeconds <= 0) return;
    try {
      const res = await rewardSessionApi.createRewardSession(plan.id, elapsedSeconds);
      setResult(res);
      setFinished(true);
      await refreshDailyPlans();
      await refreshUser();
    } catch (err) {
      console.error(err);
      alert('结束享受失败');
    }
  };

  const { remaining, elapsed, running, start, pause, stop } = useTimer(
    totalSeconds,
    handleComplete
  );

  const handleStop = async () => {
    const elapsedSeconds = stop();
    await handleComplete(elapsedSeconds);
  };

  // 暂停/进行中返回：把本次已享受时长落库（不结算积分），保持可休息时长连续
  const handleBack = async () => {
    if (elapsed > 0) {
      pause();
      try {
        await rewardSessionApi.recordRewardUsage(plan.id, elapsed);
        await refreshDailyPlans();
      } catch (err) {
        console.error(err);
      }
    }
    navigate('/');
  };

  if (!plan) {
    return (
      <div className="text-center py-12 text-slate-400">
        加载中或关卡不存在
      </div>
    );
  }

  if (finished) {
    return (
      <div className="max-w-md mx-auto text-center space-y-6 py-12">
        <div className="w-20 h-20 mx-auto bg-emerald-100 rounded-full flex items-center justify-center">
          <Trophy size={36} className="text-emerald-600" />
        </div>
        <h2 className="text-2xl font-bold text-slate-800">奖励享受完成！</h2>
        <p className="text-slate-600">
          本次享受了 {Math.floor((result?.duration_seconds || 0) / 60)} 分钟，
          获得 {result?.earned_points || 0} 积分
        </p>
        <button
          onClick={() => navigate('/')}
          className="px-6 py-2 bg-violet-600 text-white rounded-lg hover:bg-violet-700"
        >
          返回今日关卡
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-xl mx-auto space-y-6">
      <button
        onClick={handleBack}
        className="flex items-center gap-1 text-slate-500 hover:text-slate-700"
      >
        <ArrowLeft size={16} /> 返回
      </button>

      <div className="text-center">
        <h1 className="text-2xl font-bold text-slate-800">{plan.quest.name}</h1>
        <p className="text-slate-500 text-sm mt-1">{plan.quest.description}</p>
      </div>

      <Timer
        remaining={remaining}
        elapsed={elapsed}
        running={running}
        onStart={start}
        onPause={pause}
        onStop={handleStop}
        label={`时长 ${plan.quest.daily_limit_minutes} 分钟`}
      />

      <div className="text-center text-sm text-slate-400">
        建议全情投入，结束后将获得奖励积分
      </div>
    </div>
  );
}
