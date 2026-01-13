import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AuthProvider, useAuth } from '@/hooks/useAuth';
import { useProfile, usePublicProfile } from '@/hooks/useProfile';
import { useConquests } from '@/hooks/useConquests';
import { useGroups } from '@/hooks/useGroups';
import { BottomNav } from '@/components/BottomNav';
import { FeedScreen } from '@/components/FeedScreen';
import { MapScreen } from '@/components/MapScreen';
import { GroupsScreen } from '@/components/GroupsScreen';
import { ProfileScreen } from '@/components/ProfileScreen';
import { RecordingDashboard } from '@/components/RecordingDashboard';
import { AuthScreen } from '@/components/AuthScreen';
import { SplashScreen } from '@/components/SplashScreen';
import { MapScanner } from '@/components/MapScanner';
import { InvasionAlert, DuelPanel, checkInvasion } from '@/components/InvasionSystem';
import { VisitableProfile } from '@/components/VisitableProfile';
import type { Conquest, RecordMode, Profile } from '@/types';

function AppContent() {
  const { user, loading: authLoading, signOut } = useAuth();
  const { profile, updateProfile } = useProfile();
  const { conquests, myConquests, addConquest, isLoading: conquestsLoading } = useConquests();
  const { groups, myMemberships, createGroup, joinGroup, leaveGroup } = useGroups();

  const [showSplash, setShowSplash] = useState(true);
  const [activeTab, setActiveTab] = useState('feed');
  const [isRecordOpen, setIsRecordOpen] = useState(false);
  const [selectedConquest, setSelectedConquest] = useState<Conquest | null>(null);
  const [isScanning, setIsScanning] = useState(false);

  // Invasion detection state
  const [invasionAlert, setInvasionAlert] = useState<{
    visible: boolean;
    conquest: Conquest | null;
  }>({ visible: false, conquest: null });
  
  // Duel mode state
  const [duelMode, setDuelMode] = useState<{
    active: boolean;
    opponent: Profile | null;
  }>({ active: false, opponent: null });

  // Visitable profile state
  const [visitingProfile, setVisitingProfile] = useState<Profile | null>(null);

  // Fetch opponent profile for invasion/duel
  const { data: invasionOwnerProfile } = usePublicProfile(invasionAlert.conquest?.user_id || null);

  // Show splash screen only on first load
  useEffect(() => {
    const hasSeenSplash = sessionStorage.getItem('zonna_splash_seen');
    if (hasSeenSplash) {
      setShowSplash(false);
    }
  }, []);

  // Scanning animation when loading conquests
  useEffect(() => {
    if (user && conquestsLoading) {
      setIsScanning(true);
    } else {
      // Keep scanning for a bit after load completes
      const timer = setTimeout(() => setIsScanning(false), 1500);
      return () => clearTimeout(timer);
    }
  }, [user, conquestsLoading]);

  const handleSplashComplete = () => {
    sessionStorage.setItem('zonna_splash_seen', 'true');
    setShowSplash(false);
  };

  const handleFinishConquest = async (data: { 
    path: [number, number][]; 
    area: number; 
    distance: number;
    duration: number;
    mode: RecordMode;
  }) => {
    try {
      await addConquest.mutateAsync({
        path: data.path,
        area: data.area,
        distance: data.distance,
      });
    } catch (error) {
      console.error('Failed to save conquest:', error);
    }
  };

  const handleShowOnMap = (conquest: Conquest) => {
    setSelectedConquest(conquest);
    setActiveTab('map');
  };

  const handlePositionUpdate = useCallback((position: [number, number]) => {
    if (!user || !profile) return;
    
    // Check for invasion
    const invaded = checkInvasion(position, conquests, user.id, []);
    if (invaded && invaded.user_id !== invasionAlert.conquest?.user_id) {
      setInvasionAlert({ visible: true, conquest: invaded });
    }
  }, [user, profile, conquests, invasionAlert.conquest?.user_id]);

  const handleDismissInvasion = () => {
    setInvasionAlert({ visible: false, conquest: null });
  };

  const handleStartDuel = () => {
    if (invasionOwnerProfile) {
      setDuelMode({ active: true, opponent: invasionOwnerProfile });
      setInvasionAlert({ visible: false, conquest: null });
    }
  };

  const handleCloseDuel = () => {
    setDuelMode({ active: false, opponent: null });
  };

  const handleVisitProfile = (profileToVisit: Profile) => {
    setVisitingProfile(profileToVisit);
  };

  const handleChallengeFromProfile = () => {
    if (visitingProfile) {
      setDuelMode({ active: true, opponent: visitingProfile });
      setVisitingProfile(null);
    }
  };

  if (showSplash) {
    return <SplashScreen onComplete={handleSplashComplete} />;
  }

  if (authLoading) {
    return (
      <div className="h-screen flex items-center justify-center bg-background">
        <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) {
    return <AuthScreen />;
  }

  return (
    <div className="h-screen flex flex-col overflow-hidden bg-background">
      {/* Map Scanner Animation */}
      <MapScanner isScanning={isScanning} />

      {/* Invasion Alert */}
      <InvasionAlert
        isVisible={invasionAlert.visible}
        ownerName={invasionOwnerProfile?.name || 'Desconhecido'}
        ownerProfile={invasionOwnerProfile || undefined}
        onDismiss={handleDismissInvasion}
        onChallenge={handleStartDuel}
      />

      {/* Duel Panel */}
      {duelMode.active && profile && duelMode.opponent && (
        <DuelPanel
          isOpen={duelMode.active}
          onClose={handleCloseDuel}
          currentUser={profile}
          opponent={duelMode.opponent}
          currentUserConquests={myConquests}
          opponentConquests={conquests.filter(c => c.user_id === duelMode.opponent?.user_id)}
        />
      )}

      {/* Visitable Profile Modal */}
      {visitingProfile && (
        <VisitableProfile
          isOpen={!!visitingProfile}
          onClose={() => setVisitingProfile(null)}
          profile={visitingProfile}
          onChallenge={handleChallengeFromProfile}
        />
      )}

      <main className="flex-1 overflow-hidden relative">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.15, ease: 'easeOut' }}
            className="h-full w-full"
          >
            {activeTab === 'feed' && (
              <FeedScreen conquests={conquests} />
            )}
            {activeTab === 'map' && (
              <MapScreen 
                conquests={conquests}
                selectedConquest={selectedConquest}
                onSelectConquest={setSelectedConquest}
              />
            )}
            {activeTab === 'groups' && (
              <GroupsScreen 
                groups={groups}
                myMemberships={myMemberships}
                onCreateGroup={(name) => createGroup.mutate(name)}
                onJoinGroup={(id) => joinGroup.mutate(id)}
                onLeaveGroup={(id) => leaveGroup.mutate(id)}
              />
            )}
            {activeTab === 'profile' && (
              <ProfileScreen 
                profile={profile}
                history={myConquests}
                onUpdateProfile={(updates) => updateProfile.mutate(updates)}
                onShowOnMap={handleShowOnMap}
                onSignOut={signOut}
              />
            )}
          </motion.div>
        </AnimatePresence>
      </main>

      <BottomNav
        activeTab={activeTab}
        setActiveTab={(tab) => {
          setActiveTab(tab);
          if (tab !== 'map') setSelectedConquest(null);
        }}
        onRecordClick={() => setIsRecordOpen(true)}
      />

      <AnimatePresence>
        {isRecordOpen && (
          <RecordingDashboard
            isOpen={isRecordOpen}
            onClose={() => setIsRecordOpen(false)}
            onFinish={handleFinishConquest}
            conquestCount={myConquests.length}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

export default function Index() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
