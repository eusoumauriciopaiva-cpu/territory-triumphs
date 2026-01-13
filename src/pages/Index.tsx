import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AuthProvider, useAuth } from '@/hooks/useAuth';
import { useProfile } from '@/hooks/useProfile';
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
import type { Conquest, RecordMode } from '@/types';

function AppContent() {
  const { user, loading: authLoading, signOut } = useAuth();
  const { profile, updateProfile } = useProfile();
  const { conquests, myConquests, addConquest } = useConquests();
  const { groups, myMemberships, createGroup, joinGroup, leaveGroup } = useGroups();

  const [showSplash, setShowSplash] = useState(true);
  const [activeTab, setActiveTab] = useState('feed');
  const [isRecordOpen, setIsRecordOpen] = useState(false);
  const [selectedConquest, setSelectedConquest] = useState<Conquest | null>(null);

  // Show splash screen only on first load
  useEffect(() => {
    const hasSeenSplash = sessionStorage.getItem('zonna_splash_seen');
    if (hasSeenSplash) {
      setShowSplash(false);
    }
  }, []);

  const handleSplashComplete = () => {
    sessionStorage.setItem('zonna_splash_seen', 'true');
    setShowSplash(false);
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

  return (
    <div className="h-screen flex flex-col overflow-hidden bg-background">
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
            {activeTab === 'feed' && <FeedScreen conquests={conquests} />}
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
