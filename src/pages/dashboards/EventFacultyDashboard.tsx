import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Sidebar } from '../../components/common/Sidebar';
import { Header } from '../../components/common/Header';
import { 
  Trophy, Lock, Unlock, Plus, AlertCircle, CheckCircle2, Award, FileText, Send,
  Calendar, MapPin, Clock, User, Users, CheckSquare, XSquare, Activity, ChevronRight,
  Download, Trash2, Settings, AlertTriangle, Play, Pause, RefreshCw, Shield, PlusCircle, MinusCircle, Edit
} from 'lucide-react';
import { apiFetch } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import { useEvents } from '../../contexts/EventsContext';
import { Participant, Fixture } from '../../types';

export const EventFacultyDashboard: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { eventId: paramEventId } = useParams();
  const { events } = useEvents();
  
  // Event isolation
  const activeEventId = paramEventId || user?.eventId || 'sports_football_boys';
  const eventMeta = events.find(e => e.id === activeEventId) || events[0] || {
    id: activeEventId,
    name: 'Event',
    category: 'SPORTS',
    rules: []
  };

  const isSports = eventMeta.category === 'SPORTS';

  const [eventData, setEventData] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'roster' | 'fixtures' | 'scoring' | 'standings' | 'reports' | 'logs'>('overview');
  
  // Modals & Messages
  const [showFixtureModal, setShowFixtureModal] = useState(false);
  const [showResultModal, setShowResultModal] = useState(false);
  const [showEditRequestModal, setShowEditRequestModal] = useState(false);
  const [actionMsg, setActionMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Live status form state
  const [venueName, setVenueName] = useState('');
  const [liveStatus, setLiveStatus] = useState<string>('SCHEDULED');
  const [delayMins, setDelayMins] = useState(0);
  const [delayReason, setDelayReason] = useState('');
  const [newOfficial, setNewOfficial] = useState('');
  const [officialsList, setOfficialsList] = useState<string[]>([]);

  // Roster verification edit state
  const [editingPartId, setEditingPartId] = useState<string | null>(null);
  const [jerseyNum, setJerseyNum] = useState('');
  const [rosterPos, setRosterPos] = useState<'ACTIVE' | 'SUBSTITUTE' | 'BENCH'>('ACTIVE');
  const [checkIn, setCheckIn] = useState<'PENDING' | 'CHECKED_IN' | 'NO_SHOW'>('CHECKED_IN');
  const [verifyState, setVerifyState] = useState<'VERIFIED' | 'REJECTED' | 'PENDING'>('VERIFIED');

  // Fixture CRUD states
  const [round, setRound] = useState('Quarter Finals');
  const [teamAId, setTeamAId] = useState('');
  const [teamBId, setTeamBId] = useState('');
  const [scheduledTime, setScheduledTime] = useState('11:00 AM');
  const [fixtureVenue, setFixtureVenue] = useState('Main Arena Court');
  const [scoreA, setScoreA] = useState(0);
  const [scoreB, setScoreB] = useState(0);
  const [fixtureStatus, setFixtureStatus] = useState<'SCHEDULED' | 'LIVE' | 'COMPLETED' | 'CANCELLED'>('SCHEDULED');
  const [editingFixtureId, setEditingFixtureId] = useState<string | null>(null);

  // Detailed Scoring State (Active Fixture)
  const [selectedScoringFixtureId, setSelectedScoringFixtureId] = useState<string | null>(null);
  const selectedFixture = eventData?.fixtures.find((f: any) => f.id === selectedScoringFixtureId);

  // Football Goals & Cards Form
  const [fbGoalScorer, setFbGoalScorer] = useState('');
  const [fbGoalAssist, setFbGoalAssist] = useState('');
  const [fbGoalTime, setFbGoalTime] = useState('15');
  const [fbGoalIsOwn, setFbGoalIsOwn] = useState(false);
  const [fbGoalIsPen, setFbGoalIsPen] = useState(false);
  
  const [fbCardPlayer, setFbCardPlayer] = useState('');
  const [fbCardType, setFbCardType] = useState<'YELLOW' | 'RED'>('YELLOW');
  const [fbCardTime, setFbCardTime] = useState('20');
  const [fbFoulsA, setFbFoulsA] = useState(0);
  const [fbFoulsB, setFbFoulsB] = useState(0);
  const [fbShootoutA, setFbShootoutA] = useState(0);
  const [fbShootoutB, setFbShootoutB] = useState(0);

  // Volleyball Sets & Rotation Form
  const [vbSetsA, setVbSetsA] = useState<number[]>([0, 0, 0]);
  const [vbSetsB, setVbSetsB] = useState<number[]>([0, 0, 0]);
  const [vbTimeoutsA, setVbTimeoutsA] = useState(0);
  const [vbTimeoutsB, setVbTimeoutsB] = useState(0);
  const [vbRotationA, setVbRotationA] = useState<string[]>(['', '', '', '', '', '']);
  const [vbRotationB, setVbRotationB] = useState<string[]>(['', '', '', '', '', '']);

  // Basketball Quarters Form
  const [bbQuartersA, setBbQuartersA] = useState<number[]>([0, 0, 0, 0]);
  const [bbQuartersB, setBbQuartersB] = useState<number[]>([0, 0, 0, 0]);
  const [bbTimeoutsA, setBbTimeoutsA] = useState(4);
  const [bbTimeoutsB, setBbTimeoutsB] = useState(4);
  const [bbFoulsA, setBbFoulsA] = useState(0);
  const [bbFoulsB, setBbFoulsB] = useState(0);

  // Tug of War pulls
  const [towPulls, setTowPulls] = useState<string[]>(['', '', '']);

  // Cultural judging states (3 Judges rating on criteria)
  const [culturalCriteriaScores, setCulturalCriteriaScores] = useState<Record<string, Record<string, number>>>({
    judge1: {}, judge2: {}, judge3: {}
  });

  // Debate scorecard states
  const [debateTopic, setDebateTopic] = useState('Proposition of AI in Education');
  const [debatePropSpeakers, setDebatePropSpeakers] = useState<{ name: string; score: number; time: number }[]>([
    { name: '', score: 0, time: 180 }, { name: '', score: 0, time: 180 }
  ]);
  const [debateOppSpeakers, setDebateOppSpeakers] = useState<{ name: string; score: number; time: number }[]>([
    { name: '', score: 0, time: 180 }, { name: '', score: 0, time: 180 }
  ]);

  // Treasure Hunt stats
  const [thStartTime, setThStartTime] = useState('10:00 AM');
  const [thEndTime, setThEndTime] = useState('11:30 AM');
  const [thCheckpoints, setThCheckpoints] = useState<string[]>([]);
  const [thPenalties, setThPenalties] = useState(0);
  const [thBonusPoints, setThBonusPoints] = useState(0);

  // Final Results locking Form
  const [winnerTeamId, setWinnerTeamId] = useState('');
  const [runnerUpTeamId, setRunnerUpTeamId] = useState('');
  const [secondRunnerUpTeamId, setSecondRunnerUpTeamId] = useState('');
  const [editReason, setEditReason] = useState('');

  // Fetch Event Roster, State, Fixtures
  const fetchEventData = async () => {
    setLoading(true);
    setErrorMsg(null);
    try {
      const res = await apiFetch<any>(`/events/${activeEventId}`);
      if (res.success) {
        setEventData(res);
        if (res.eventState) {
          setVenueName(res.eventState.venue);
          setLiveStatus(res.eventState.status);
          setDelayMins(res.eventState.delayMinutes);
          setDelayReason(res.eventState.delayReason || '');
          setOfficialsList(res.eventState.officials || []);
        }
        if (res.teams.length >= 2) {
          setTeamAId(res.teams[0].id);
          setTeamBId(res.teams[1].id);
          setWinnerTeamId(res.teams[0].id);
          setRunnerUpTeamId(res.teams[1].id);
        }
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to fetch event data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEventData();
  }, [activeEventId]);

  // Initialize detailed scoring state when scoring fixture is selected
  useEffect(() => {
    if (selectedFixture) {
      setScoreA(selectedFixture.scoreA || 0);
      setScoreB(selectedFixture.scoreB || 0);
      setFixtureStatus(selectedFixture.status);
      setFixtureVenue(selectedFixture.venue || 'Main Arena Court');
      setScheduledTime(selectedFixture.scheduledTime || '11:00 AM');
      setRound(selectedFixture.round || 'Quarter Finals');
      setTeamAId(selectedFixture.teamAId);
      setTeamBId(selectedFixture.teamBId);

      // Load event-specific scores
      if (activeEventId.includes('football')) {
        const stats = selectedFixture.sportsStats?.football || { goalsA: [], goalsB: [], cardsA: [], cardsB: [], foulsA: 0, foulsB: 0, shootoutA: 0, shootoutB: 0 };
        setFbFoulsA(stats.foulsA || 0);
        setFbFoulsB(stats.foulsB || 0);
        setFbShootoutA(stats.shootoutA || 0);
        setFbShootoutB(stats.shootoutB || 0);
      } else if (activeEventId.includes('volleyball')) {
        const stats = selectedFixture.sportsStats?.volleyball || { setsA: [0, 0, 0], setsB: [0, 0, 0], timeoutsA: 0, timeoutsB: 0, rotationA: ['', '', '', '', '', ''], rotationB: ['', '', '', '', '', ''] };
        setVbSetsA(stats.setsA || [0, 0, 0]);
        setVbSetsB(stats.setsB || [0, 0, 0]);
        setVbTimeoutsA(stats.timeoutsA || 0);
        setVbTimeoutsB(stats.timeoutsB || 0);
        setVbRotationA(stats.rotationA || ['', '', '', '', '', '']);
        setVbRotationB(stats.rotationB || ['', '', '', '', '', '']);
      } else if (activeEventId.includes('basketball')) {
        const stats = selectedFixture.sportsStats?.basketball || { quartersA: [0, 0, 0, 0], quartersB: [0, 0, 0, 0], timeoutsA: 4, timeoutsB: 4, foulsA: 0, foulsB: 0 };
        setBbQuartersA(stats.quartersA || [0, 0, 0, 0]);
        setBbQuartersB(stats.quartersB || [0, 0, 0, 0]);
        setBbTimeoutsA(stats.timeoutsA || 4);
        setBbTimeoutsB(stats.timeoutsB || 4);
        setBbFoulsA(stats.foulsA || 0);
        setBbFoulsB(stats.foulsB || 0);
      } else if (activeEventId.includes('tug_of_war')) {
        const stats = selectedFixture.sportsStats?.tugOfWar || { pullWinners: ['', '', ''] };
        setTowPulls(stats.pullWinners || ['', '', '']);
      } else if (activeEventId.includes('dance') || activeEventId.includes('music') || activeEventId.includes('open_mic')) {
        setCulturalCriteriaScores(selectedFixture.culturalJudges || { judge1: {}, judge2: {}, judge3: {} });
      } else if (activeEventId.includes('debate')) {
        const stats = selectedFixture.debateStats || { topic: 'Oxford Debate Topic', propSpeakers: [{ name: '', score: 0, time: 180 }], oppSpeakers: [{ name: '', score: 0, time: 180 }] };
        setDebateTopic(stats.topic || '');
        setDebatePropSpeakers(stats.propSpeakers || []);
        setDebateOppSpeakers(stats.oppSpeakers || []);
      } else if (activeEventId.includes('treasure')) {
        const stats = selectedFixture.treasureHuntStats || { startTime: '10:00 AM', endTime: '11:00 AM', checkpointsVisited: [], penaltiesMinutes: 0, bonusPoints: 0 };
        setThStartTime(stats.startTime || '10:00 AM');
        setThEndTime(stats.endTime || '11:00 AM');
        setThCheckpoints(stats.checkpointsVisited || []);
        setThPenalties(stats.penaltiesMinutes || 0);
        setThBonusPoints(stats.bonusPoints || 0);
      }
    }
  }, [selectedScoringFixtureId]);

  // Save Event Live Status Settings
  const handleSaveLiveStatus = async (customStatus?: string) => {
    setActionMsg(null);
    try {
      const res = await apiFetch<any>(`/events/${activeEventId}/live-status`, {
        method: 'POST',
        body: JSON.stringify({
          venue: venueName,
          status: customStatus || liveStatus,
          delayMinutes: delayMins,
          delayReason,
          officials: officialsList,
          user
        })
      });
      if (res.success) {
        setActionMsg('Live status configuration updated successfully!');
        if (customStatus) setLiveStatus(customStatus);
        fetchEventData();
      }
    } catch (err: any) {
      alert(`Error updating live status: ${err.message}`);
    }
  };

  // Add Official / Judge to list
  const handleAddOfficial = () => {
    if (!newOfficial.trim()) return;
    setOfficialsList([...officialsList, newOfficial.trim()]);
    setNewOfficial('');
  };

  // Remove Official from list
  const handleRemoveOfficial = (index: number) => {
    setOfficialsList(officialsList.filter((_, i) => i !== index));
  };

  // Save Participant verification roster status
  const handleSaveParticipantRoster = async (pId: string) => {
    setActionMsg(null);
    try {
      const res = await apiFetch<any>(`/events/${activeEventId}/roster/verify`, {
        method: 'POST',
        body: JSON.stringify({
          participantId: pId,
          jerseyNumber: jerseyNum,
          rosterStatus: rosterPos,
          checkInStatus: checkIn,
          verificationStatus: verifyState,
          user
        })
      });
      if (res.success) {
        setActionMsg('Roster checklist successfully saved!');
        setEditingPartId(null);
        fetchEventData();
      }
    } catch (err: any) {
      alert(`Error saving roster status: ${err.message}`);
    }
  };

  // Save Fixture Score/Operations (Unified CRUD)
  const handleSaveFixture = async (detailedPayload?: any) => {
    try {
      const bodyPayload = detailedPayload || {
        eventId: activeEventId,
        fixtureId: editingFixtureId || selectedScoringFixtureId,
        round,
        teamAId,
        teamBId,
        scheduledTime,
        venue: fixtureVenue,
        scoreA,
        scoreB,
        status: fixtureStatus,
        user
      };
      
      const res = await apiFetch<{ success: boolean; message?: string }>('/events/fixture', {
        method: 'POST',
        body: JSON.stringify(bodyPayload)
      });
      if (res.success) {
        setShowFixtureModal(false);
        setEditingFixtureId(null);
        fetchEventData();
        setActionMsg('Fixture data saved successfully!');
      }
    } catch (err: any) {
      alert(`Fixture error: ${err.message}`);
    }
  };

  // Submit Result & Lock Sheet
  const handleSubmitResult = async () => {
    if (!winnerTeamId) {
      alert('Select official Winner team.');
      return;
    }
    try {
      const res = await apiFetch<{ success: boolean; message: string }>('/events/submit-result', {
        method: 'POST',
        body: JSON.stringify({
          eventId: activeEventId,
          winnerTeamId,
          runnerUpTeamId,
          secondRunnerUpTeamId,
          user
        })
      });
      if (res.success) {
        setActionMsg(res.message);
        setShowResultModal(false);
        fetchEventData();
      }
    } catch (err: any) {
      alert(`Submission error: ${err.message}`);
    }
  };

  // Send Unlock / Edit Request
  const handleSendEditRequest = async () => {
    if (!editReason) {
      alert('Provide justification reason for edit request.');
      return;
    }
    try {
      const res = await apiFetch<{ success: boolean; message: string }>('/events/request-edit', {
        method: 'POST',
        body: JSON.stringify({
          eventId: activeEventId,
          reason: editReason,
          user
        })
      });
      if (res.success) {
        setActionMsg(res.message);
        setShowEditRequestModal(false);
        fetchEventData();
      }
    } catch (err: any) {
      alert(`Edit request error: ${err.message}`);
    }
  };

  // Dynamic football scorecard actions
  const addFootballGoal = (isTeamA: boolean) => {
    const goalsA = selectedFixture.sportsStats?.football?.goalsA || [];
    const goalsB = selectedFixture.sportsStats?.football?.goalsB || [];
    
    const goalObj = {
      scorerName: fbGoalScorer || 'Player Name',
      assistName: fbGoalAssist || undefined,
      time: fbGoalTime,
      ownGoal: fbGoalIsOwn,
      penalty: fbGoalIsPen
    };

    const newGoalsA = isTeamA ? [...goalsA, goalObj] : goalsA;
    const newGoalsB = !isTeamA ? [...goalsB, goalObj] : goalsB;
    const newScoreA = isTeamA ? scoreA + 1 : scoreA;
    const newScoreB = !isTeamA ? scoreB + 1 : scoreB;

    const payload = {
      eventId: activeEventId,
      fixtureId: selectedScoringFixtureId,
      scoreA: newScoreA,
      scoreB: newScoreB,
      status: fixtureStatus,
      sportsStats: {
        ...selectedFixture.sportsStats,
        football: {
          ...selectedFixture.sportsStats?.football,
          goalsA: newGoalsA,
          goalsB: newGoalsB,
          foulsA: fbFoulsA,
          foulsB: fbFoulsB,
          shootoutA: fbShootoutA,
          shootoutB: fbShootoutB
        }
      },
      user
    };

    setScoreA(newScoreA);
    setScoreB(newScoreB);
    handleSaveFixture(payload);
    setFbGoalScorer('');
    setFbGoalAssist('');
    setFbGoalIsOwn(false);
    setFbGoalIsPen(false);
  };

  const addFootballCard = (isTeamA: boolean) => {
    const cardsA = selectedFixture.sportsStats?.football?.cardsA || [];
    const cardsB = selectedFixture.sportsStats?.football?.cardsB || [];
    
    const cardObj = {
      playerName: fbCardPlayer || 'Player Name',
      type: fbCardType,
      time: fbCardTime
    };

    const newCardsA = isTeamA ? [...cardsA, cardObj] : cardsA;
    const newCardsB = !isTeamA ? [...cardsB, cardObj] : cardsB;

    const payload = {
      eventId: activeEventId,
      fixtureId: selectedScoringFixtureId,
      scoreA,
      scoreB,
      status: fixtureStatus,
      sportsStats: {
        ...selectedFixture.sportsStats,
        football: {
          ...selectedFixture.sportsStats?.football,
          cardsA: newCardsA,
          cardsB: newCardsB,
          foulsA: fbFoulsA,
          foulsB: fbFoulsB,
          shootoutA: fbShootoutA,
          shootoutB: fbShootoutB
        }
      },
      user
    };

    handleSaveFixture(payload);
    setFbCardPlayer('');
  };

  const handleSaveVolleyballScorecard = () => {
    const totalA = vbSetsA.reduce((sum, val) => sum + (val >= 25 ? 1 : 0), 0); // automated set calculator
    const totalB = vbSetsB.reduce((sum, val) => sum + (val >= 25 ? 1 : 0), 0);

    const payload = {
      eventId: activeEventId,
      fixtureId: selectedScoringFixtureId,
      scoreA: totalA,
      scoreB: totalB,
      status: fixtureStatus,
      sportsStats: {
        ...selectedFixture.sportsStats,
        volleyball: {
          setsA: vbSetsA,
          setsB: vbSetsB,
          timeoutsA: vbTimeoutsA,
          timeoutsB: vbTimeoutsB,
          rotationA: vbRotationA,
          rotationB: vbRotationB
        }
      },
      user
    };
    setScoreA(totalA);
    setScoreB(totalB);
    handleSaveFixture(payload);
  };

  const handleSaveBasketballScorecard = () => {
    const totalA = bbQuartersA.reduce((sum, val) => sum + val, 0);
    const totalB = bbQuartersB.reduce((sum, val) => sum + val, 0);

    const payload = {
      eventId: activeEventId,
      fixtureId: selectedScoringFixtureId,
      scoreA: totalA,
      scoreB: totalB,
      status: fixtureStatus,
      sportsStats: {
        ...selectedFixture.sportsStats,
        basketball: {
          quartersA: bbQuartersA,
          quartersB: bbQuartersB,
          timeoutsA: bbTimeoutsA,
          timeoutsB: bbTimeoutsB,
          foulsA: bbFoulsA,
          foulsB: bbFoulsB
        }
      },
      user
    };
    setScoreA(totalA);
    setScoreB(totalB);
    handleSaveFixture(payload);
  };

  const handleSaveTugOfWarScorecard = () => {
    const countA = towPulls.filter(w => w === 'A').length;
    const countB = towPulls.filter(w => w === 'B').length;

    const payload = {
      eventId: activeEventId,
      fixtureId: selectedScoringFixtureId,
      scoreA: countA,
      scoreB: countB,
      status: fixtureStatus,
      sportsStats: {
        ...selectedFixture.sportsStats,
        tugOfWar: {
          pullWinners: towPulls
        }
      },
      user
    };
    setScoreA(countA);
    setScoreB(countB);
    handleSaveFixture(payload);
  };

  const handleSaveCulturalJudgingScorecard = () => {
    // Average scores calculations
    const getCriteriaAvg = (criteria: string) => {
      let count = 0;
      let sum = 0;
      ['judge1', 'judge2', 'judge3'].forEach(j => {
        const val = culturalCriteriaScores[j]?.[criteria];
        if (val !== undefined && val !== null) {
          sum += val;
          count++;
        }
      });
      return count > 0 ? parseFloat((sum / count).toFixed(2)) : 0;
    };

    const criteriaList = activeEventId.includes('dance')
      ? ['creativity', 'synchronization', 'choreography', 'costume', 'theme', 'stage_usage', 'coordination', 'impression']
      : activeEventId.includes('music')
      ? ['vocal', 'rhythm', 'harmony', 'arrangement', 'coordination', 'creativity', 'presentation']
      : ['originality', 'delivery', 'engagement', 'creativity', 'content', 'presence', 'overall'];

    const totalAvg = criteriaList.reduce((sum, crit) => sum + getCriteriaAvg(crit), 0);
    const finalScore = parseFloat(totalAvg.toFixed(2));

    const payload = {
      eventId: activeEventId,
      fixtureId: selectedScoringFixtureId,
      scoreA: finalScore,
      scoreB: 0,
      status: fixtureStatus,
      culturalJudges: culturalCriteriaScores,
      user
    };
    setScoreA(finalScore);
    handleSaveFixture(payload);
  };

  const handleSaveDebateScorecard = () => {
    const sumProp = debatePropSpeakers.reduce((sum, s) => sum + s.score, 0);
    const sumOpp = debateOppSpeakers.reduce((sum, s) => sum + s.score, 0);

    const payload = {
      eventId: activeEventId,
      fixtureId: selectedScoringFixtureId,
      scoreA: sumProp,
      scoreB: sumOpp,
      status: fixtureStatus,
      debateStats: {
        topic: debateTopic,
        propSpeakers: debatePropSpeakers,
        oppSpeakers: debateOppSpeakers
      },
      user
    };
    setScoreA(sumProp);
    setScoreB(sumOpp);
    handleSaveFixture(payload);
  };

  const handleSaveTreasureHuntScorecard = () => {
    // Parse time diff
    let diffMins = 90;
    try {
      const getMins = (tStr: string) => {
        const parts = tStr.split(':');
        const hr = parseInt(parts[0]);
        const isPM = tStr.toLowerCase().includes('pm');
        const min = parseInt(parts[1].split(' ')[0]);
        return (hr === 12 ? (isPM ? 12 : 0) : hr + (isPM ? 12 : 0)) * 60 + min;
      };
      diffMins = getMins(thEndTime) - getMins(thStartTime);
    } catch (e) {}

    const calculatedScore = diffMins + thPenalties - thBonusPoints;

    const payload = {
      eventId: activeEventId,
      fixtureId: selectedScoringFixtureId,
      scoreA: calculatedScore,
      scoreB: 0,
      status: fixtureStatus,
      treasureHuntStats: {
        startTime: thStartTime,
        endTime: thEndTime,
        checkpointsVisited: thCheckpoints,
        penaltiesMinutes: thPenalties,
        bonusPoints: thBonusPoints
      },
      user
    };
    setScoreA(calculatedScore);
    handleSaveFixture(payload);
  };

  // CSV Report Exporter
  const handleExportCSV = (type: 'roster' | 'fixtures' | 'logs') => {
    let filename = `${activeEventId}_report.csv`;
    let csvContent = "data:text/csv;charset=utf-8,";
    
    if (type === 'roster') {
      filename = `${activeEventId}_roster_report.csv`;
      csvContent += "Participant Name,Class,Section,Jersey Number,Lineup Status,Check-in Status,ID Proof Number,Verification Status\n";
      eventData?.participants.forEach((p: Participant) => {
        csvContent += `"${p.name}","${p.className}","${p.section}","${p.jerseyNumber || 'N/A'}","${p.rosterStatus || 'ACTIVE'}","${p.checkInStatus || 'PENDING'}","${p.govtIdProof}","${p.verificationStatus}"\n`;
      });
    } else if (type === 'fixtures') {
      filename = `${activeEventId}_scorecard_fixtures.csv`;
      csvContent += "Round/Performance Slot,Team A / Performer,Team B,Score A,Score B,Venue,Time,Status\n";
      eventData?.fixtures.forEach((f: Fixture) => {
        csvContent += `"${f.round}","${f.teamAName}","${f.teamBName}","${f.scoreA || 0}","${f.scoreB || 0}","${f.venue}","${f.scheduledTime}","${f.status}"\n`;
      });
    } else {
      filename = `${activeEventId}_audit_trails.csv`;
      csvContent += "Timestamp,User,Role,Action,Details\n";
      const logs = eventData?.auditLogs || [];
      logs.forEach((log: any) => {
        csvContent += `"${log.timestamp}","${log.user}","${log.role}","${log.action}","${log.details}"\n`;
      });
    }

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const tabs = [
    { id: 'overview', label: 'Live Operations', icon: Activity },
    { id: 'roster', label: 'Roster & Verification', icon: Users },
    { id: 'fixtures', label: 'Schedule Order', icon: Calendar },
    { id: 'scoring', label: 'Scoring Console', icon: Trophy },
    { id: 'standings', label: 'Medals & Locking', icon: Award },
    { id: 'reports', label: 'Export Hub', icon: FileText },
    { id: 'logs', label: 'Audit Trail', icon: Shield }
  ] as const;

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden font-sans">
      <Sidebar currentRole={user?.role || 'faculty_football'} />

      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        <Header 
          title={`${eventMeta.name} — Faculty Dashboard`} 
          subtitle="Modular isolated scoreboard controls, live scheduling, and results manager." 
        />

        <main className="p-6 space-y-6 max-w-7xl mx-auto w-full">
          
          {/* Admin Switcher Console */}
          {(user?.role === 'admin' || user?.role === 'officials') && (
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center space-x-2 text-xs font-bold text-slate-700">
                <span>Active Event Dashboard:</span>
                <select
                  value={activeEventId}
                  onChange={(e) => navigate(`/dashboard/event/${e.target.value}`)}
                  className="px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-christ-navy focus:outline-none bg-white text-slate-800 font-semibold"
                >
                  {events.map((e) => (
                    <option key={e.id} value={e.id}>
                      {e.name} ({e.category})
                    </option>
                  ))}
                </select>
              </div>
              <span className="text-[10px] text-amber-600 font-bold uppercase tracking-wider bg-amber-50 px-2.5 py-1 rounded-full border border-amber-200">
                Admin Console — Switch Dashboards
              </span>
            </div>
          )}

          {/* Action Message Banner */}
          {actionMsg && (
            <div className="p-4 bg-emerald-50 border-l-4 border-emerald-500 text-emerald-800 text-xs font-medium rounded-r-xl flex justify-between items-center shadow-sm">
              <div className="flex items-center space-x-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>{actionMsg}</span>
              </div>
              <button onClick={() => setActionMsg(null)} className="font-bold text-emerald-700 hover:underline">Dismiss</button>
            </div>
          )}

          {/* Error Message Banner */}
          {errorMsg && (
            <div className="p-4 bg-rose-50 border-l-4 border-rose-500 text-rose-800 text-xs font-medium rounded-r-xl flex justify-between items-center shadow-sm">
              <div className="flex items-center space-x-2">
                <AlertCircle className="w-4 h-4 text-rose-600" />
                <span>{errorMsg}</span>
              </div>
              <button onClick={() => setErrorMsg(null)} className="font-bold text-rose-700 hover:underline">Dismiss</button>
            </div>
          )}

          {/* Locked Status Panel */}
          <div className={`p-4 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-sm ${
            eventData?.isLocked ? 'bg-amber-50 border-amber-200 text-amber-900' : 'bg-emerald-50 border-emerald-200 text-emerald-900'
          }`}>
            <div className="flex items-center space-x-3">
              {eventData?.isLocked ? <Lock className="w-6 h-6 text-amber-600 shrink-0" /> : <Unlock className="w-6 h-6 text-emerald-600 shrink-0" />}
              <div>
                <strong className="block text-sm font-serif">
                  {eventData?.isLocked ? 'OFFICIAL RESULT SHEET IS LOCKED' : 'SCORE SHEET ACTIVE FOR EDITING'}
                </strong>
                <p className="text-xs opacity-90">
                  {eventData?.isLocked 
                    ? 'Final results have been submitted. Scores cannot be modified unless Chief Admin approves an Edit Request.'
                    : 'Enter live match scores and submit official winners when all matches complete.'}
                </p>
              </div>
            </div>

            <div>
              {eventData?.isLocked ? (
                <button
                  disabled={!!eventData?.pendingEditRequest}
                  onClick={() => setShowEditRequestModal(true)}
                  className={`px-4 py-2 text-xs font-bold rounded-lg border shadow-sm transition-all ${
                    eventData?.pendingEditRequest 
                      ? 'bg-slate-200 text-slate-500 border-slate-300 cursor-not-allowed' 
                      : 'bg-amber-600 text-white hover:bg-amber-700 border-amber-600'
                  }`}
                >
                  {eventData?.pendingEditRequest ? 'Edit Request Pending Admin Review' : 'Request Unlock / Edit'}
                </button>
              ) : (
                <button
                  onClick={() => setShowResultModal(true)}
                  className="px-5 py-2 bg-christ-navy text-white text-xs font-bold rounded-lg hover:bg-christ-darkNavy shadow-md flex items-center space-x-2"
                >
                  <Trophy className="w-4 h-4 text-christ-gold" />
                  <span>Submit Final Results & Lock</span>
                </button>
              )}
            </div>
          </div>

          {/* Modular Navigation Tabs */}
          <div className="border-b border-slate-200 flex items-center space-x-1 overflow-x-auto pb-px">
            {tabs.map(t => {
              const Icon = t.icon;
              return (
                <button
                  key={t.id}
                  onClick={() => setActiveTab(t.id)}
                  className={`flex items-center space-x-2 px-4 py-2.5 text-xs font-bold rounded-t-lg transition-all border-b-2 ${
                    activeTab === t.id 
                      ? 'border-christ-navy text-christ-navy bg-white shadow-sm'
                      : 'border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-100/50'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{t.label}</span>
                </button>
              );
            })}
          </div>

          {/* TAB 1: Live Operations & Delay Status */}
          {activeTab === 'overview' && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              
              <div className="md:col-span-2 bg-white rounded-xl border border-slate-200 p-6 shadow-sm space-y-6">
                <div className="border-b pb-3">
                  <h3 className="font-bold text-christ-navy font-serif text-sm">Venue Allocation & Delay Tracker</h3>
                  <p className="text-xs text-slate-500">Coordinate delay parameters and publish live status on the homepage.</p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-semibold">
                  <div>
                    <label className="block font-bold text-slate-800 mb-1">Assigned Venue</label>
                    <input 
                      type="text" 
                      value={venueName} 
                      onChange={(e) => setVenueName(e.target.value)} 
                      className="w-full p-2 border rounded-lg focus:ring-1 focus:ring-christ-navy focus:outline-none" 
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-800 mb-1">Delay Duration (Minutes)</label>
                    <div className="flex items-center space-x-2">
                      <button type="button" onClick={() => setDelayMins(Math.max(0, delayMins - 5))} className="p-1 border rounded"><MinusCircle className="w-5 h-5 text-slate-500" /></button>
                      <input 
                        type="number" 
                        value={delayMins} 
                        onChange={(e) => setDelayMins(Number(e.target.value))} 
                        className="w-16 text-center p-2 border rounded-lg focus:ring-1 focus:ring-christ-navy focus:outline-none font-bold font-mono" 
                      />
                      <button type="button" onClick={() => setDelayMins(delayMins + 5)} className="p-1 border rounded"><PlusCircle className="w-5 h-5 text-slate-500" /></button>
                    </div>
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block font-bold text-slate-800 mb-1">Reason for Delay (Publicly Visible)</label>
                    <input 
                      type="text" 
                      placeholder="e.g. Inclement weather delaying first fixtures by 15 mins."
                      value={delayReason} 
                      onChange={(e) => setDelayReason(e.target.value)} 
                      className="w-full p-2 border rounded-lg focus:ring-1 focus:ring-christ-navy focus:outline-none" 
                    />
                  </div>
                </div>

                <div className="pt-4 flex items-center justify-between border-t text-xs">
                  <div className="flex space-x-2">
                    <button onClick={() => handleSaveLiveStatus('LIVE')} className="px-4 py-2 bg-emerald-600 text-white rounded-lg font-bold hover:bg-emerald-700">Start / Resume Event</button>
                    <button onClick={() => handleSaveLiveStatus('PAUSED')} className="px-4 py-2 bg-amber-600 text-white rounded-lg font-bold hover:bg-amber-700">Pause Event</button>
                    <button onClick={() => handleSaveLiveStatus('DELAYED')} className="px-4 py-2 bg-rose-600 text-white rounded-lg font-bold hover:bg-rose-700">Publish Delay Status</button>
                  </div>
                  <button onClick={() => handleSaveLiveStatus()} className="px-5 py-2 bg-christ-navy text-white rounded-lg font-bold hover:bg-christ-darkNavy">Save Config</button>
                </div>
              </div>

              <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm space-y-4">
                <h4 className="font-bold text-xs uppercase tracking-wider text-slate-800 font-serif border-b pb-2">Assigned Officials / Judges</h4>
                
                <div className="space-y-2 text-xs font-semibold">
                  <div className="flex space-x-2">
                    <input 
                      type="text" 
                      placeholder="Enter official's name..."
                      value={newOfficial}
                      onChange={(e) => setNewOfficial(e.target.value)}
                      className="flex-1 p-2 border rounded-lg focus:outline-none" 
                    />
                    <button onClick={handleAddOfficial} className="px-3 bg-christ-navy text-white rounded-lg font-bold">+</button>
                  </div>

                  <div className="divide-y border rounded-xl overflow-hidden bg-slate-50/50">
                    {officialsList.length === 0 ? (
                      <p className="p-3 text-center text-slate-500 font-normal">No officials assigned yet.</p>
                    ) : (
                      officialsList.map((off, index) => (
                        <div key={index} className="p-2.5 flex items-center justify-between font-semibold">
                          <span>{off}</span>
                          <button onClick={() => handleRemoveOfficial(index)} className="text-rose-500 hover:text-rose-700">✕</button>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>

            </div>
          )}

          {/* TAB 2: Roster & Verification Checklist */}
          {activeTab === 'roster' && (
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-christ-navy font-serif text-sm">Participant Roster & Verification Logs</h3>
                  <p className="text-xs text-slate-500">Verify registrations, check-in student attendance, and configure jersey numbers/substitutions.</p>
                </div>
                <button onClick={() => handleExportCSV('roster')} className="inline-flex items-center space-x-1.5 px-3 py-1.5 border border-slate-300 rounded-lg text-xs font-bold hover:bg-slate-50">
                  <Download className="w-4 h-4" />
                  <span>Export Roster CSV</span>
                </button>
              </div>

              <div className="overflow-x-auto text-xs">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 font-serif text-slate-600">
                      <th className="p-3.5 font-bold">Student Name</th>
                      <th className="p-3.5 font-bold">Class/Section</th>
                      <th className="p-3.5 font-bold">ID Credentials</th>
                      {isSports && <th className="p-3.5 font-bold">Jersey No.</th>}
                      {isSports && <th className="p-3.5 font-bold">Lineup Status</th>}
                      <th className="p-3.5 font-bold">Check-in Status</th>
                      <th className="p-3.5 font-bold">Verification</th>
                      <th className="p-3.5 font-bold text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-medium text-slate-800">
                    {eventData?.participants.map((p: Participant) => (
                      <tr key={p.id} className="hover:bg-slate-50/50">
                        <td className="p-3.5">
                          <strong className="text-slate-900 block">{p.name}</strong>
                          <span className="text-[10px] text-slate-400">ID: {p.id}</span>
                        </td>
                        <td className="p-3.5">{p.className} - {p.section}</td>
                        <td className="p-3.5 font-mono">{p.govtIdProof}</td>
                        
                        {isSports && (
                          <td className="p-3.5">
                            {editingPartId === p.id ? (
                              <input 
                                type="text" 
                                value={jerseyNum} 
                                onChange={(e) => setJerseyNum(e.target.value)} 
                                className="w-12 p-1 border rounded text-center" 
                              />
                            ) : (
                              p.jerseyNumber || 'N/A'
                            )}
                          </td>
                        )}

                        {isSports && (
                          <td className="p-3.5">
                            {editingPartId === p.id ? (
                              <select value={rosterPos} onChange={(e: any) => setRosterPos(e.target.value)} className="p-1 border rounded">
                                <option value="ACTIVE">ACTIVE</option>
                                <option value="SUBSTITUTE">SUBSTITUTE</option>
                                <option value="BENCH">BENCH</option>
                              </select>
                            ) : (
                              <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                p.rosterStatus === 'ACTIVE' ? 'bg-indigo-100 text-indigo-700' : 'bg-slate-100 text-slate-600'
                              }`}>
                                {p.rosterStatus || 'ACTIVE'}
                              </span>
                            )}
                          </td>
                        )}

                        <td className="p-3.5">
                          {editingPartId === p.id ? (
                            <select value={checkIn} onChange={(e: any) => setCheckIn(e.target.value)} className="p-1 border rounded">
                              <option value="PENDING">PENDING</option>
                              <option value="CHECKED_IN">CHECKED-IN</option>
                              <option value="NO_SHOW">NO-SHOW</option>
                            </select>
                          ) : (
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              p.checkInStatus === 'CHECKED_IN' ? 'bg-emerald-100 text-emerald-700' :
                              p.checkInStatus === 'NO_SHOW' ? 'bg-rose-100 text-rose-700' : 'bg-slate-100 text-slate-600'
                            }`}>
                              {p.checkInStatus || 'PENDING'}
                            </span>
                          )}
                        </td>

                        <td className="p-3.5">
                          {editingPartId === p.id ? (
                            <select value={verifyState} onChange={(e: any) => setVerifyState(e.target.value)} className="p-1 border rounded">
                              <option value="PENDING">PENDING</option>
                              <option value="VERIFIED">VERIFIED</option>
                              <option value="REJECTED">REJECTED</option>
                            </select>
                          ) : (
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              p.verificationStatus === 'VERIFIED' ? 'bg-emerald-100 text-emerald-700' :
                              p.verificationStatus === 'REJECTED' ? 'bg-rose-100 text-rose-700' : 'bg-amber-100 text-amber-700'
                            }`}>
                              {p.verificationStatus}
                            </span>
                          )}
                        </td>

                        <td className="p-3.5 text-right">
                          {editingPartId === p.id ? (
                            <div className="flex justify-end space-x-1.5">
                              <button onClick={() => setEditingPartId(null)} className="px-2.5 py-1 border rounded hover:bg-slate-50 font-bold">✕</button>
                              <button onClick={() => handleSaveParticipantRoster(p.id)} className="px-2.5 py-1 bg-christ-navy text-white rounded font-bold">Save</button>
                            </div>
                          ) : (
                            <button 
                              onClick={() => {
                                setEditingPartId(p.id);
                                setJerseyNum(p.jerseyNumber || '');
                                setRosterPos(p.rosterStatus || 'ACTIVE');
                                setCheckIn(p.checkInStatus || 'CHECKED_IN');
                                setVerifyState(p.verificationStatus);
                              }}
                              className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded font-bold"
                            >
                              Edit
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 3: Fixtures & Timeline Schedule */}
          {activeTab === 'fixtures' && (
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-christ-navy font-serif text-sm">Event Performance Schedule & Fixtures</h3>
                  <p className="text-xs text-slate-500">Organize knockout slots, venue shifts, and live timetables.</p>
                </div>
                {!eventData?.isLocked && (
                  <button
                    onClick={() => {
                      setEditingFixtureId(null);
                      setRound('Round 1');
                      setScoreA(0);
                      setScoreB(0);
                      setFixtureStatus('SCHEDULED');
                      setFixtureVenue(venueName || 'Main Arena Court');
                      setShowFixtureModal(true);
                    }}
                    className="inline-flex items-center space-x-1.5 px-3.5 py-2 bg-christ-gold text-christ-navy text-xs font-bold rounded-lg hover:bg-christ-lightGold shadow-christ-gold"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Create Schedule / Fixture</span>
                  </button>
                )}
              </div>

              {eventData?.fixtures.length === 0 ? (
                <div className="p-8 text-center text-xs text-slate-500">No performances or fixtures scheduled yet.</div>
              ) : (
                <div className="divide-y divide-slate-100 text-xs">
                  {eventData?.fixtures.map((fix: any) => (
                    <div key={fix.id} className="p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 hover:bg-slate-50 transition-colors font-semibold">
                      <div className="space-y-1">
                        <div className="flex items-center space-x-2">
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-christ-navy/10 text-christ-navy font-serif">
                            {fix.round}
                          </span>
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                            fix.status === 'LIVE' ? 'bg-rose-100 text-rose-700 animate-pulse' :
                            fix.status === 'COMPLETED' ? 'bg-emerald-100 text-emerald-700' :
                            'bg-slate-100 text-slate-600'
                          }`}>
                            ● {fix.status}
                          </span>
                        </div>
                        <h4 className="text-sm font-bold text-slate-900 font-serif">
                          {fix.teamAName} {isSports && <span className="text-christ-gold">VS</span>} {!isSports && "— Performance"} {fix.teamBName}
                        </h4>
                        <p className="text-[11px] text-slate-500">
                          Venue: {fix.venue} | Scheduled Time: {fix.scheduledTime}
                        </p>
                      </div>

                      <div className="flex items-center space-x-4">
                        <div className="bg-slate-900 text-white px-3 py-1.5 rounded-lg font-mono font-black text-sm shadow-inner">
                          {fix.scoreA || 0} {isSports && `- ${fix.scoreB || 0}`}
                        </div>

                        {!eventData?.isLocked && (
                          <button
                            onClick={() => {
                              setEditingFixtureId(fix.id);
                              setRound(fix.round);
                              setTeamAId(fix.teamAId);
                              setTeamBId(fix.teamBId);
                              setScoreA(fix.scoreA || 0);
                              setScoreB(fix.scoreB || 0);
                              setFixtureStatus(fix.status);
                              setFixtureVenue(fix.venue);
                              setScheduledTime(fix.scheduledTime);
                              setShowFixtureModal(true);
                            }}
                            className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 text-[10px] font-bold rounded-lg"
                          >
                            Update Slot
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 4: Event-Specific Scoring Panel */}
          {activeTab === 'scoring' && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              
              {/* Fixture Picker */}
              <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm space-y-3">
                <h4 className="font-bold text-xs uppercase tracking-wider text-slate-800 font-serif border-b pb-2">Select Active Match / Slot</h4>
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {eventData?.fixtures.map((f: Fixture) => (
                    <button
                      key={f.id}
                      onClick={() => setSelectedScoringFixtureId(f.id)}
                      className={`w-full text-left p-3 rounded-lg border text-xs font-semibold transition-all ${
                        selectedScoringFixtureId === f.id
                          ? 'border-christ-navy bg-christ-navy/5 text-christ-navy shadow-sm'
                          : 'border-slate-200 hover:bg-slate-50'
                      }`}
                    >
                      <div className="flex justify-between items-center mb-1">
                        <span className="font-mono text-[9px] px-1.5 py-0.5 rounded bg-slate-100 text-slate-600">{f.round}</span>
                        <span className={`text-[9px] font-bold ${f.status === 'LIVE' ? 'text-rose-600' : 'text-slate-500'}`}>{f.status}</span>
                      </div>
                      <p className="truncate text-slate-800">{f.teamAName} {isSports && 'VS'} {f.teamBName}</p>
                      <span className="text-[10px] text-slate-400 block mt-1">{f.venue} | {f.scheduledTime}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Scoring controls */}
              <div className="md:col-span-2 bg-white rounded-xl border border-slate-200 p-6 shadow-sm space-y-6">
                {!selectedScoringFixtureId ? (
                  <div className="p-8 text-center text-slate-400 text-xs font-medium">
                    ← Select a match or performance slot from the left to access event scorecard.
                  </div>
                ) : (
                  <div className="space-y-6 text-xs font-semibold">
                    <div className="border-b pb-3 flex items-center justify-between">
                      <div>
                        <h3 className="font-bold text-christ-navy font-serif text-sm">
                          Live Scorecard: {selectedFixture.teamAName} {isSports && 'VS'} {selectedFixture.teamBName}
                        </h3>
                        <p className="text-xs text-slate-500 font-normal">Live operational adjustments. Changes submit directly to persistent registers.</p>
                      </div>
                      <div className="flex items-center space-x-2">
                        <select 
                          value={fixtureStatus}
                          onChange={(e) => setFixtureStatus(e.target.value as any)}
                          className="px-2 py-1 border text-xs rounded-lg bg-white"
                        >
                          <option value="SCHEDULED">SCHEDULED</option>
                          <option value="LIVE">LIVE</option>
                          <option value="COMPLETED">COMPLETED</option>
                          <option value="CANCELLED">CANCELLED</option>
                        </select>
                      </div>
                    </div>

                    {/* DYNAMIC SCORING LOGIC ACCORDING TO EVENT */}
                    
                    {/* Football Scoring */}
                    {activeEventId.includes('football') && (
                      <div className="space-y-4">
                        {/* Football Scorer list */}
                        <div className="grid grid-cols-2 gap-4 bg-slate-50 p-4 rounded-xl border">
                          <div>
                            <strong className="text-christ-navy font-serif block border-b pb-1 mb-2">Team A Goals ({scoreA})</strong>
                            <div className="space-y-1 max-h-24 overflow-y-auto">
                              {(selectedFixture.sportsStats?.football?.goalsA || []).map((g: any, i: number) => (
                                <div key={i} className="p-1.5 bg-white border rounded font-mono">
                                  ⚽ {g.scorerName} ({g.time}') {g.ownGoal && '[Own Goal]'} {g.penalty && '[Pen]'}
                                </div>
                              ))}
                            </div>
                          </div>
                          <div>
                            <strong className="text-christ-navy font-serif block border-b pb-1 mb-2">Team B Goals ({scoreB})</strong>
                            <div className="space-y-1 max-h-24 overflow-y-auto">
                              {(selectedFixture.sportsStats?.football?.goalsB || []).map((g: any, i: number) => (
                                <div key={i} className="p-1.5 bg-white border rounded font-mono">
                                  ⚽ {g.scorerName} ({g.time}') {g.ownGoal && '[Own Goal]'} {g.penalty && '[Pen]'}
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>

                        {/* Add Goal widget */}
                        <div className="bg-slate-50 p-4 rounded-xl border space-y-3">
                          <strong className="block font-serif text-slate-800 text-xs">Add Live Match Event (Goal)</strong>
                          <div className="grid grid-cols-1 sm:grid-cols-4 gap-2">
                            <input type="text" placeholder="Scorer Name" value={fbGoalScorer} onChange={(e)=>setFbGoalScorer(e.target.value)} className="p-2 border rounded text-xs" />
                            <input type="text" placeholder="Assist Name (optional)" value={fbGoalAssist} onChange={(e)=>setFbGoalAssist(e.target.value)} className="p-2 border rounded text-xs" />
                            <input type="number" placeholder="Min" value={fbGoalTime} onChange={(e)=>setFbGoalTime(e.target.value)} className="p-2 border rounded text-xs" />
                            <div className="flex items-center space-x-2 text-[10px]">
                              <label className="flex items-center space-x-1"><input type="checkbox" checked={fbGoalIsOwn} onChange={(e)=>setFbGoalIsOwn(e.target.checked)} /> <span>Own</span></label>
                              <label className="flex items-center space-x-1"><input type="checkbox" checked={fbGoalIsPen} onChange={(e)=>setFbGoalIsPen(e.target.checked)} /> <span>Pen</span></label>
                            </div>
                          </div>
                          <div className="flex space-x-2">
                            <button onClick={()=>addFootballGoal(true)} className="flex-1 py-2 bg-christ-navy text-white rounded font-bold">+ Team A Goal</button>
                            <button onClick={()=>addFootballGoal(false)} className="flex-1 py-2 bg-christ-navy text-white rounded font-bold">+ Team B Goal</button>
                          </div>
                        </div>

                        {/* Fouls, Shootouts, Cards */}
                        <div className="grid grid-cols-2 gap-4">
                          <div className="bg-slate-50 p-4 rounded-xl border space-y-2">
                            <strong className="block font-serif">Shootout / Fouls</strong>
                            <div className="flex items-center justify-between">
                              <span>Shootout A:</span>
                              <input type="number" value={fbShootoutA} onChange={(e)=>setFbShootoutA(Number(e.target.value))} className="w-12 p-1 border rounded text-center font-bold font-mono" />
                            </div>
                            <div className="flex items-center justify-between">
                              <span>Shootout B:</span>
                              <input type="number" value={fbShootoutB} onChange={(e)=>setFbShootoutB(Number(e.target.value))} className="w-12 p-1 border rounded text-center font-bold font-mono" />
                            </div>
                            <div className="flex items-center justify-between">
                              <span>Fouls (A/B):</span>
                              <div className="flex space-x-1">
                                <input type="number" value={fbFoulsA} onChange={(e)=>setFbFoulsA(Number(e.target.value))} className="w-10 p-1 border rounded text-center font-mono" />
                                <input type="number" value={fbFoulsB} onChange={(e)=>setFbFoulsB(Number(e.target.value))} className="w-10 p-1 border rounded text-center font-mono" />
                              </div>
                            </div>
                          </div>

                          <div className="bg-slate-50 p-4 rounded-xl border space-y-2">
                            <strong className="block font-serif">Book Cards</strong>
                            <input type="text" placeholder="Player Name" value={fbCardPlayer} onChange={(e)=>setFbCardPlayer(e.target.value)} className="w-full p-2 border rounded text-xs" />
                            <div className="flex justify-between gap-2">
                              <select value={fbCardType} onChange={(e: any)=>setFbCardType(e.target.value)} className="p-1 border rounded text-xs bg-white">
                                <option value="YELLOW">YELLOW</option>
                                <option value="RED">RED</option>
                              </select>
                              <input type="number" placeholder="Min" value={fbCardTime} onChange={(e)=>setFbCardTime(e.target.value)} className="w-12 p-1 border rounded text-center font-mono text-xs" />
                            </div>
                            <div className="flex space-x-1">
                              <button onClick={()=>addFootballCard(true)} className="flex-1 py-1.5 bg-amber-500 text-white rounded text-[10px] font-bold">Book A</button>
                              <button onClick={()=>addFootballCard(false)} className="flex-1 py-1.5 bg-amber-500 text-white rounded text-[10px] font-bold">Book B</button>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Volleyball Scoring */}
                    {activeEventId.includes('volleyball') && (
                      <div className="space-y-4">
                        <div className="bg-slate-50 p-4 rounded-xl border space-y-3">
                          <strong className="block font-serif">Set Scores (Best of 3 sets to 25 pts)</strong>
                          <div className="grid grid-cols-3 gap-3">
                            {[0, 1, 2].map(idx => (
                              <div key={idx} className="p-2.5 bg-white border rounded-xl text-center space-y-1">
                                <span className="font-bold text-slate-500 text-[10px]">SET {idx+1}</span>
                                <div className="flex justify-center space-x-2 font-mono">
                                  <input 
                                    type="number" 
                                    value={vbSetsA[idx]} 
                                    onChange={(e) => {
                                      const newSets = [...vbSetsA];
                                      newSets[idx] = Number(e.target.value);
                                      setVbSetsA(newSets);
                                    }} 
                                    className="w-10 p-1 border rounded text-center font-bold" 
                                  />
                                  <span className="text-slate-400">:</span>
                                  <input 
                                    type="number" 
                                    value={vbSetsB[idx]} 
                                    onChange={(e) => {
                                      const newSets = [...vbSetsB];
                                      newSets[idx] = Number(e.target.value);
                                      setVbSetsB(newSets);
                                    }} 
                                    className="w-10 p-1 border rounded text-center font-bold" 
                                  />
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <div className="bg-slate-50 p-4 rounded-xl border space-y-2">
                            <strong className="block font-serif">Set Operations & Timeouts</strong>
                            <div className="flex items-center justify-between">
                              <span>Timeouts Left (Team A):</span>
                              <input type="number" value={vbTimeoutsA} onChange={(e)=>setVbTimeoutsA(Number(e.target.value))} className="w-12 p-1 border rounded text-center font-bold font-mono" />
                            </div>
                            <div className="flex items-center justify-between">
                              <span>Timeouts Left (Team B):</span>
                              <input type="number" value={vbTimeoutsB} onChange={(e)=>setVbTimeoutsB(Number(e.target.value))} className="w-12 p-1 border rounded text-center font-bold font-mono" />
                            </div>
                          </div>

                          <div className="bg-slate-50 p-4 rounded-xl border space-y-2">
                            <strong className="block font-serif">Active Rotations (Serve Toggles)</strong>
                            <p className="text-[10px] text-slate-500 font-normal">Track server lineup position (Server pos 1 is serving).</p>
                            <input 
                              type="text" 
                              placeholder="Team A server lineup..."
                              value={vbRotationA[0]} 
                              onChange={(e) => {
                                const newRot = [...vbRotationA];
                                newRot[0] = e.target.value;
                                setVbRotationA(newRot);
                              }} 
                              className="w-full p-2 border rounded text-xs" 
                            />
                            <input 
                              type="text" 
                              placeholder="Team B server lineup..."
                              value={vbRotationB[0]} 
                              onChange={(e) => {
                                const newRot = [...vbRotationB];
                                newRot[0] = e.target.value;
                                setVbRotationB(newRot);
                              }} 
                              className="w-full p-2 border rounded text-xs" 
                            />
                          </div>
                        </div>

                        <button onClick={handleSaveVolleyballScorecard} className="w-full py-2 bg-christ-navy text-white rounded-lg font-bold shadow-md">Save Volleyball Scorecard</button>
                      </div>
                    )}

                    {/* Basketball Scoring */}
                    {activeEventId.includes('basketball') && (
                      <div className="space-y-4">
                        <div className="bg-slate-50 p-4 rounded-xl border space-y-3">
                          <strong className="block font-serif">Quarter Scores Tally</strong>
                          <div className="grid grid-cols-4 gap-2">
                            {[0, 1, 2, 3].map(idx => (
                              <div key={idx} className="p-2.5 bg-white border rounded text-center space-y-1">
                                <span className="font-bold text-slate-500 text-[10px]">Q{idx+1}</span>
                                <div className="flex justify-center space-x-1 font-mono">
                                  <input 
                                    type="number" 
                                    value={bbQuartersA[idx]} 
                                    onChange={(e) => {
                                      const newQuarters = [...bbQuartersA];
                                      newQuarters[idx] = Number(e.target.value);
                                      setBbQuartersA(newQuarters);
                                    }} 
                                    className="w-8 p-0.5 border rounded text-center font-bold" 
                                  />
                                  <span className="text-slate-400">:</span>
                                  <input 
                                    type="number" 
                                    value={bbQuartersB[idx]} 
                                    onChange={(e) => {
                                      const newQuarters = [...bbQuartersB];
                                      newQuarters[idx] = Number(e.target.value);
                                      setBbQuartersB(newQuarters);
                                    }} 
                                    className="w-8 p-0.5 border rounded text-center font-bold" 
                                  />
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>

                        <div className="grid grid-cols-3 gap-3">
                          <div className="bg-slate-50 p-3 rounded-xl border text-center space-y-1">
                            <span className="font-bold text-slate-500 text-[10px]">Team Fouls A / B</span>
                            <div className="flex justify-center space-x-2 font-mono">
                              <input type="number" value={bbFoulsA} onChange={(e)=>setBbFoulsA(Number(e.target.value))} className="w-10 p-1 border rounded text-center font-bold" />
                              <input type="number" value={bbFoulsB} onChange={(e)=>setBbFoulsB(Number(e.target.value))} className="w-10 p-1 border rounded text-center font-bold" />
                            </div>
                          </div>

                          <div className="bg-slate-50 p-3 rounded-xl border text-center space-y-1">
                            <span className="font-bold text-slate-500 text-[10px]">Timeouts Left A / B</span>
                            <div className="flex justify-center space-x-2 font-mono">
                              <input type="number" value={bbTimeoutsA} onChange={(e)=>setBbTimeoutsA(Number(e.target.value))} className="w-10 p-1 border rounded text-center font-bold" />
                              <input type="number" value={bbTimeoutsB} onChange={(e)=>setBbTimeoutsB(Number(e.target.value))} className="w-10 p-1 border rounded text-center font-bold" />
                            </div>
                          </div>

                          <div className="bg-slate-50 p-3 rounded-xl border text-center flex flex-col justify-center items-center">
                            <span className="font-bold text-slate-600 block text-xs">Total Score</span>
                            <strong className="text-base text-christ-navy font-mono">
                              {bbQuartersA.reduce((s,v)=>s+v,0)} : {bbQuartersB.reduce((s,v)=>s+v,0)}
                            </strong>
                          </div>
                        </div>

                        <button onClick={handleSaveBasketballScorecard} className="w-full py-2 bg-christ-navy text-white rounded-lg font-bold shadow-md">Save Basketball Scorecard</button>
                      </div>
                    )}

                    {/* Tug of War Scoring */}
                    {activeEventId.includes('tug_of_war') && (
                      <div className="space-y-4">
                        <div className="bg-slate-50 p-4 rounded-xl border space-y-3">
                          <strong className="block font-serif">Tug of War Pull Tracker (Best of Three)</strong>
                          <div className="space-y-3">
                            {[0, 1, 2].map(pullIdx => (
                              <div key={pullIdx} className="flex items-center justify-between bg-white p-3 rounded-lg border">
                                <span className="font-bold text-slate-700">PULL ROUND {pullIdx+1} WINNER:</span>
                                <select 
                                  value={towPulls[pullIdx]} 
                                  onChange={(e) => {
                                    const newPulls = [...towPulls];
                                    newPulls[pullIdx] = e.target.value;
                                    setTowPulls(newPulls);
                                  }} 
                                  className="p-1 border rounded text-xs bg-white"
                                >
                                  <option value="">-- Declare Pull Winner --</option>
                                  <option value="A">{selectedFixture.teamAName}</option>
                                  <option value="B">{selectedFixture.teamBName}</option>
                                </select>
                              </div>
                            ))}
                          </div>
                        </div>

                        <button onClick={handleSaveTugOfWarScorecard} className="w-full py-2 bg-christ-navy text-white rounded-lg font-bold shadow-md">Declare Pull Winner Results</button>
                      </div>
                    )}

                    {/* Cultural Judging Matrix (Dance / Music / Open Mic) */}
                    {(activeEventId.includes('dance') || activeEventId.includes('music') || activeEventId.includes('open_mic')) && (
                      <div className="space-y-4">
                        <div className="bg-slate-50 p-4 rounded-xl border space-y-3">
                          <strong className="block font-serif">Judges Criterion Marks Matrix (0-10 Rating)</strong>
                          
                          <div className="grid grid-cols-4 gap-2 font-bold text-center border-b pb-1 font-serif text-slate-700 text-[10px]">
                            <span>Criterion Item</span>
                            <span>Judge 1</span>
                            <span>Judge 2</span>
                            <span>Judge 3</span>
                          </div>

                          {(activeEventId.includes('dance')
                            ? ['creativity', 'synchronization', 'choreography', 'costume', 'theme', 'stage_usage', 'coordination', 'impression']
                            : activeEventId.includes('music')
                            ? ['vocal', 'rhythm', 'harmony', 'arrangement', 'coordination', 'creativity', 'presentation']
                            : ['originality', 'delivery', 'engagement', 'creativity', 'content', 'presence', 'overall']
                          ).map(crit => (
                            <div key={crit} className="grid grid-cols-4 gap-2 items-center text-center font-medium bg-white p-1 rounded border">
                              <span className="capitalize text-left pl-2">{crit.replace('_', ' ')}</span>
                              {['judge1', 'judge2', 'judge3'].map(j => (
                                <input
                                  key={j}
                                  type="number"
                                  min="0"
                                  max="10"
                                  placeholder="0"
                                  value={culturalCriteriaScores[j]?.[crit] || ''}
                                  onChange={(e) => {
                                    const val = Number(e.target.value);
                                    if (val >= 0 && val <= 10) {
                                      setCulturalCriteriaScores({
                                        ...culturalCriteriaScores,
                                        [j]: {
                                          ...culturalCriteriaScores[j],
                                          [crit]: val
                                        }
                                      });
                                    }
                                  }}
                                  className="w-12 mx-auto p-1 border text-center font-bold font-mono"
                                />
                              ))}
                            </div>
                          ))}
                        </div>

                        <button onClick={handleSaveCulturalJudgingScorecard} className="w-full py-2 bg-christ-navy text-white rounded-lg font-bold shadow-md">Calculate Averages & Save Marks</button>
                      </div>
                    )}

                    {/* Debate Scorecard */}
                    {activeEventId.includes('debate') && (
                      <div className="space-y-4">
                        <div className="bg-slate-50 p-4 rounded-xl border space-y-3">
                          <strong className="block font-serif">Oxford Debate Panel</strong>
                          <div>
                            <label className="block font-bold mb-1">Debate Topic / Proposition Topic</label>
                            <input type="text" value={debateTopic} onChange={(e)=>setDebateTopic(e.target.value)} className="w-full p-2 border rounded text-xs" />
                          </div>

                          <div className="grid grid-cols-2 gap-4">
                            <div className="p-3 bg-white border rounded-xl space-y-3">
                              <strong className="block text-christ-navy border-b pb-1 font-serif text-[11px]">Proposition Speakers</strong>
                              {debatePropSpeakers.map((s, idx) => (
                                <div key={idx} className="space-y-1">
                                  <input type="text" placeholder={`Speaker ${idx+1} Name`} value={s.name} onChange={(e) => {
                                    const speakers = [...debatePropSpeakers];
                                    speakers[idx].name = e.target.value;
                                    setDebatePropSpeakers(speakers);
                                  }} className="w-full p-1.5 border rounded text-xs" />
                                  <div className="flex justify-between gap-1">
                                    <input type="number" placeholder="Score (0-100)" value={s.score || ''} onChange={(e) => {
                                      const speakers = [...debatePropSpeakers];
                                      speakers[idx].score = Number(e.target.value);
                                      setDebatePropSpeakers(speakers);
                                    }} className="w-1/2 p-1 border rounded text-center font-bold font-mono text-xs" />
                                    <input type="number" placeholder="Time (s)" value={s.time || ''} onChange={(e) => {
                                      const speakers = [...debatePropSpeakers];
                                      speakers[idx].time = Number(e.target.value);
                                      setDebatePropSpeakers(speakers);
                                    }} className="w-1/2 p-1 border rounded text-center font-mono text-xs" />
                                  </div>
                                </div>
                              ))}
                            </div>

                            <div className="p-3 bg-white border rounded-xl space-y-3">
                              <strong className="block text-christ-navy border-b pb-1 font-serif text-[11px]">Opposition Speakers</strong>
                              {debateOppSpeakers.map((s, idx) => (
                                <div key={idx} className="space-y-1">
                                  <input type="text" placeholder={`Speaker ${idx+1} Name`} value={s.name} onChange={(e) => {
                                    const speakers = [...debateOppSpeakers];
                                    speakers[idx].name = e.target.value;
                                    setDebateOppSpeakers(speakers);
                                  }} className="w-full p-1.5 border rounded text-xs" />
                                  <div className="flex justify-between gap-1">
                                    <input type="number" placeholder="Score (0-100)" value={s.score || ''} onChange={(e) => {
                                      const speakers = [...debateOppSpeakers];
                                      speakers[idx].score = Number(e.target.value);
                                      setDebateOppSpeakers(speakers);
                                    }} className="w-1/2 p-1 border rounded text-center font-bold font-mono text-xs" />
                                    <input type="number" placeholder="Time (s)" value={s.time || ''} onChange={(e) => {
                                      const speakers = [...debateOppSpeakers];
                                      speakers[idx].time = Number(e.target.value);
                                      setDebateOppSpeakers(speakers);
                                    }} className="w-1/2 p-1 border rounded text-center font-mono text-xs" />
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>

                        <button onClick={handleSaveDebateScorecard} className="w-full py-2 bg-christ-navy text-white rounded-lg font-bold shadow-md">Submit Debate Speaker Scores</button>
                      </div>
                    )}

                    {/* Treasure Hunt Scorecard */}
                    {activeEventId.includes('treasure') && (
                      <div className="space-y-4">
                        <div className="bg-slate-50 p-4 rounded-xl border space-y-3">
                          <strong className="block font-serif">Checkpoint Solved Tracking</strong>
                          <div className="grid grid-cols-2 gap-2">
                            {['clue_1', 'clue_2', 'clue_3', 'clue_4', 'clue_5'].map(cp => (
                              <label key={cp} className="flex items-center space-x-2 bg-white p-2 rounded border cursor-pointer font-semibold text-[10px]">
                                <input 
                                  type="checkbox" 
                                  checked={thCheckpoints.includes(cp)} 
                                  onChange={(e) => {
                                    if (e.target.checked) setThCheckpoints([...thCheckpoints, cp]);
                                    else setThCheckpoints(thCheckpoints.filter(c => c !== cp));
                                  }} 
                                />
                                <span className="uppercase">{cp.replace('_', ' ')} solved</span>
                              </label>
                            ))}
                          </div>

                          <div className="grid grid-cols-2 gap-3 pt-2">
                            <div>
                              <label className="block font-bold mb-1">Time Started</label>
                              <input type="text" value={thStartTime} onChange={(e)=>setThStartTime(e.target.value)} className="w-full p-2 border rounded text-xs" />
                            </div>
                            <div>
                              <label className="block font-bold mb-1">Time Finished</label>
                              <input type="text" value={thEndTime} onChange={(e)=>setThEndTime(e.target.value)} className="w-full p-2 border rounded text-xs" />
                            </div>
                          </div>

                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <label className="block font-bold mb-1">Penalty Minutes (+)</label>
                              <input type="number" value={thPenalties} onChange={(e)=>setThPenalties(Number(e.target.value))} className="w-full p-2 border rounded font-mono font-bold text-xs" />
                            </div>
                            <div>
                              <label className="block font-bold mb-1">Bonus Minutes (-)</label>
                              <input type="number" value={thBonusPoints} onChange={(e)=>setThBonusPoints(Number(e.target.value))} className="w-full p-2 border rounded font-mono font-bold text-xs" />
                            </div>
                          </div>
                        </div>

                        <button onClick={handleSaveTreasureHuntScorecard} className="w-full py-2 bg-christ-navy text-white rounded-lg font-bold shadow-md">Calculate Duration & Save Score</button>
                      </div>
                    )}

                  </div>
                )}
              </div>

            </div>
          )}

          {/* TAB 5: Standings & Results Locking */}
          {activeTab === 'standings' && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 font-semibold">
              
              {/* Standings table */}
              <div className="md:col-span-2 bg-white rounded-xl border border-slate-200 p-6 shadow-sm space-y-4">
                <h3 className="font-bold text-christ-navy font-serif text-sm border-b pb-2 flex items-center space-x-2">
                  <Award className="w-5 h-5 text-christ-gold" />
                  <span>Calculated Rankings & Medal Tally</span>
                </h3>

                <div className="divide-y text-xs">
                  {eventData?.teams.length === 0 ? (
                    <p className="p-4 text-center text-slate-500 font-normal">No teams registered to generate standings.</p>
                  ) : (
                    eventData?.teams
                      .map((t: any) => {
                        // calculate average score or total score from completed fixtures
                        const completedFixes = eventData.fixtures.filter((f: any) => f.status === 'COMPLETED' && (f.teamAId === t.id || f.teamBId === t.id));
                        let totalScore = 0;
                        completedFixes.forEach((f: any) => {
                          if (f.teamAId === t.id) totalScore += (f.scoreA || 0);
                          else totalScore += (f.scoreB || 0);
                        });
                        return {
                          ...t,
                          scoreSum: totalScore,
                          playedCount: completedFixes.length
                        };
                      })
                      .sort((a: any, b: any) => b.scoreSum - a.scoreSum)
                      .map((t: any, idx: number) => (
                        <div key={t.id} className="py-3 flex items-center justify-between font-semibold">
                          <div className="flex items-center space-x-3">
                            <span className="font-bold text-sm text-slate-400 font-serif w-6">#{idx+1}</span>
                            <div>
                              <strong className="text-slate-900 block text-xs">{t.institutionName}</strong>
                              <span className="text-[10px] text-slate-400 font-normal">{t.teamName} | Played: {t.playedCount} match(es)</span>
                            </div>
                          </div>
                          <div className="text-right">
                            <span className="text-sm font-black text-christ-navy font-mono">
                              {t.scoreSum} {isSports ? 'Pts' : 'Avg'}
                            </span>
                          </div>
                        </div>
                      ))
                  )}
                </div>
              </div>

              {/* Declared Winners lock box */}
              <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm space-y-4">
                <h4 className="font-bold text-xs uppercase tracking-wider text-slate-800 font-serif border-b pb-2">Submit Winners Sheet</h4>
                
                {eventData?.result ? (
                  <div className="space-y-4 text-xs">
                    <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl space-y-1.5 text-slate-800 font-semibold">
                      <span className="text-[9px] font-bold text-amber-700 block uppercase font-serif">★ 1st Place (Winner)</span>
                      <p className="text-xs font-bold text-slate-900">{eventData.result.winnerInstitutionName}</p>
                    </div>

                    {eventData.result.runnerUpInstitutionName && (
                      <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-1.5 text-slate-800 font-semibold">
                        <span className="text-[9px] font-bold text-slate-600 block uppercase font-serif">2nd Place (Runner Up)</span>
                        <p className="text-xs font-bold text-slate-900">{eventData.result.runnerUpInstitutionName}</p>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="space-y-4 text-xs text-slate-700">
                    <p className="text-[11px] text-slate-500 font-normal">Submit official winners to lock the scorecards.</p>
                    
                    <div>
                      <label className="block font-bold mb-1">Select Winner (1st) *</label>
                      <select value={winnerTeamId} onChange={(e)=>setWinnerTeamId(e.target.value)} className="w-full p-2 border rounded bg-white text-xs">
                        {eventData?.teams.map((t: any) => (
                          <option key={t.id} value={t.id}>{t.institutionName} ({t.teamName})</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block font-bold mb-1">Select Runner-up (2nd)</label>
                      <select value={runnerUpTeamId} onChange={(e)=>setRunnerUpTeamId(e.target.value)} className="w-full p-2 border rounded bg-white text-xs">
                        <option value="">None / N/A</option>
                        {eventData?.teams.map((t: any) => (
                          <option key={t.id} value={t.id}>{t.institutionName} ({t.teamName})</option>
                        ))}
                      </select>
                    </div>

                    <button 
                      onClick={handleSubmitResult}
                      className="w-full py-2.5 bg-christ-navy hover:bg-christ-darkNavy text-white rounded-lg font-bold shadow"
                    >
                      Lock Result Sheet
                    </button>
                  </div>
                )}
              </div>

            </div>
          )}

          {/* TAB 6: Reports & Exports Hub */}
          {activeTab === 'reports' && (
            <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm space-y-6 text-xs font-semibold">
              <div className="border-b pb-3">
                <h3 className="font-bold text-christ-navy font-serif text-sm">Reports & Export Center</h3>
                <p className="text-xs text-slate-500 font-normal">Download registration data, results, match scorecards, and audit logs.</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="p-4 border rounded-xl hover:border-christ-navy transition-all space-y-3 bg-slate-50/50">
                  <Users className="w-8 h-8 text-indigo-500" />
                  <strong className="block text-xs font-serif text-slate-900">Roster & Check-in Report</strong>
                  <p className="text-[11px] text-slate-500 font-normal">Comprehensive list of participants, jersey numbers, and check-in statuses.</p>
                  <button onClick={() => handleExportCSV('roster')} className="inline-flex items-center space-x-1.5 px-3 py-2 bg-christ-navy text-white text-xs font-bold rounded hover:bg-christ-darkNavy">
                    <Download className="w-4 h-4" />
                    <span>Download Roster CSV</span>
                  </button>
                </div>

                <div className="p-4 border rounded-xl hover:border-christ-navy transition-all space-y-3 bg-slate-50/50">
                  <Trophy className="w-8 h-8 text-amber-500" />
                  <strong className="block text-xs font-serif text-slate-900">Scorecard & Fixtures Report</strong>
                  <p className="text-[11px] text-slate-500 font-normal">Fixture schedule lists, match statuses, venues, and recorded points.</p>
                  <button onClick={() => handleExportCSV('fixtures')} className="inline-flex items-center space-x-1.5 px-3 py-2 bg-christ-navy text-white text-xs font-bold rounded hover:bg-christ-darkNavy">
                    <Download className="w-4 h-4" />
                    <span>Download Scores CSV</span>
                  </button>
                </div>

                <div className="p-4 border rounded-xl hover:border-christ-navy transition-all space-y-3 bg-slate-50/50">
                  <Shield className="w-8 h-8 text-emerald-500" />
                  <strong className="block text-xs font-serif text-slate-900">Audit Logs Trail Report</strong>
                  <p className="text-[11px] text-slate-500 font-normal">Every scorecard edit, check-in, or status change timestamped.</p>
                  <button onClick={() => handleExportCSV('logs')} className="inline-flex items-center space-x-1.5 px-3 py-2 bg-christ-navy text-white text-xs font-bold rounded hover:bg-christ-darkNavy">
                    <Download className="w-4 h-4" />
                    <span>Download Log Trail CSV</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* TAB 7: Audit Trail Logs */}
          {activeTab === 'logs' && (
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-christ-navy font-serif text-sm">Real-time Scoreboard Audit Trail</h3>
                  <p className="text-xs text-slate-500">Transaction logs of operations for compliance and dispute resolution.</p>
                </div>
                <button onClick={() => handleExportCSV('logs')} className="inline-flex items-center space-x-1.5 px-3 py-1.5 border border-slate-300 rounded-lg text-xs font-bold hover:bg-slate-50">
                  <Download className="w-4 h-4" />
                  <span>Download Logs CSV</span>
                </button>
              </div>

              <div className="overflow-x-auto text-[11px] font-medium text-slate-800">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50 border-b font-serif text-slate-600">
                      <th className="p-3">Timestamp</th>
                      <th className="p-3">User</th>
                      <th className="p-3">Role</th>
                      <th className="p-3">Action</th>
                      <th className="p-3">Log Details</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-mono">
                    {(eventData?.auditLogs || []).map((log: any) => (
                      <tr key={log.id} className="hover:bg-slate-50/50">
                        <td className="p-3 text-slate-500">{new Date(log.timestamp).toLocaleString()}</td>
                        <td className="p-3 font-bold text-slate-900">{log.user}</td>
                        <td className="p-3"><span className="px-2 py-0.5 rounded bg-slate-100 text-slate-600 uppercase text-[9px] font-bold">{log.role.replace(/_/g, ' ')}</span></td>
                        <td className="p-3"><span className="text-christ-navy font-bold">{log.action}</span></td>
                        <td className="p-3 text-slate-600 truncate max-w-sm font-normal">{log.details}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Modal dialogue for Create/Update Fixtures */}
          {showFixtureModal && (
            <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
              <div className="bg-white rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-2xl border border-slate-200 text-xs font-semibold">
                <div className="flex justify-between items-center border-b pb-3">
                  <h3 className="font-bold text-christ-navy font-serif text-base">{editingFixtureId ? 'Update Schedule Performance Slot' : 'Create Fixture Performance Slot'}</h3>
                  <button onClick={() => setShowFixtureModal(false)} className="text-slate-400 font-bold">✕</button>
                </div>

                <div className="space-y-3 text-xs font-semibold">
                  <div>
                    <label className="block font-bold text-slate-800 mb-1">Round / Performance Order Item *</label>
                    <input type="text" value={round} onChange={(e) => setRound(e.target.value)} className="w-full p-2 border rounded focus:outline-none" />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block font-bold text-slate-800 mb-1">Team A / Performer *</label>
                      <select value={teamAId} onChange={(e) => setTeamAId(e.target.value)} className="w-full p-2 border rounded bg-white text-xs">
                        {eventData?.teams.map((t: any) => (
                          <option key={t.id} value={t.id}>{t.institutionName} ({t.teamName})</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block font-bold text-slate-800 mb-1">Team B (For Sports VS matching)</label>
                      <select value={teamBId} onChange={(e) => setTeamBId(e.target.value)} className="w-full p-2 border rounded bg-white text-xs">
                        <option value="">None / Solo Performance</option>
                        {eventData?.teams.map((t: any) => (
                          <option key={t.id} value={t.id}>{t.institutionName} ({t.teamName})</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block font-bold text-slate-800 mb-1">Scheduled Time *</label>
                      <input type="text" value={scheduledTime} onChange={(e)=>setScheduledTime(e.target.value)} className="w-full p-2 border rounded text-xs" />
                    </div>
                    <div>
                      <label className="block font-bold text-slate-800 mb-1">Allocated Venue *</label>
                      <input type="text" value={fixtureVenue} onChange={(e)=>setFixtureVenue(e.target.value)} className="w-full p-2 border rounded text-xs" />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3 text-xs font-semibold">
                    <div>
                      <label className="block font-bold text-slate-800 mb-1">Score A / Marks</label>
                      <input type="number" value={scoreA} onChange={(e)=>setScoreA(Number(e.target.value))} className="w-full p-2 border rounded font-mono font-bold" />
                    </div>
                    <div>
                      <label className="block font-bold text-slate-800 mb-1">Score B (For Sports)</label>
                      <input type="number" value={scoreB} onChange={(e)=>setScoreB(Number(e.target.value))} className="w-full p-2 border rounded font-mono font-bold" />
                    </div>
                  </div>

                  <div>
                    <label className="block font-bold text-slate-800 mb-1">Status</label>
                    <select value={fixtureStatus} onChange={(e) => setFixtureStatus(e.target.value as any)} className="w-full p-2 border rounded bg-white text-xs">
                      <option value="SCHEDULED">SCHEDULED</option>
                      <option value="LIVE">LIVE</option>
                      <option value="COMPLETED">COMPLETED</option>
                      <option value="CANCELLED">CANCELLED</option>
                    </select>
                  </div>
                </div>

                <div className="flex justify-end space-x-2 pt-3 border-t">
                  <button onClick={() => setShowFixtureModal(false)} className="px-4 py-2 border rounded text-xs">Cancel</button>
                  <button onClick={() => handleSaveFixture()} className="px-5 py-2 bg-christ-navy text-white text-xs font-bold rounded">Save Schedule</button>
                </div>
              </div>
            </div>
          )}

          {/* Modal dialogue for Request Edit */}
          {showEditRequestModal && (
            <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
              <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl border border-slate-200 text-xs font-semibold font-sans">
                <div className="flex justify-between items-center border-b pb-3">
                  <h3 className="font-bold text-christ-navy font-serif text-base">Request Edit Permission</h3>
                  <button onClick={() => setShowEditRequestModal(false)} className="text-slate-400 font-bold">✕</button>
                </div>

                <p className="text-[11px] text-slate-500 font-normal">Provide description justification why you want to unlock result sheets.</p>
                <div>
                  <label className="block font-bold text-slate-800 mb-1">Justification Reason *</label>
                  <input type="text" value={editReason} onChange={(e)=>setEditReason(e.target.value)} className="w-full p-2 border rounded text-xs font-normal" placeholder="e.g. Need to adjust Set 3 scores in Volleyball due to typo." />
                </div>

                <div className="flex justify-end space-x-2 pt-3 border-t">
                  <button onClick={() => setShowEditRequestModal(false)} className="px-4 py-2 border rounded">Cancel</button>
                  <button onClick={handleSendEditRequest} className="px-5 py-2 bg-christ-navy text-white font-bold rounded">Send Request</button>
                </div>
              </div>
            </div>
          )}

        </main>
      </div>
    </div>
  );
};
