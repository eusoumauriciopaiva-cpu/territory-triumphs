import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AuthProvider, useAuth } from '@/hooks/useAuth';
import { useProfile, usePublicProfile } from '@/hooks/useProfile';
import { useConquests } from '@/hooks/useConquests';
import { useGroups } from '@/hooks/useGroups';
import { useClanConquests } from '@/hooks/useClanConquests';
import { useProfiles } from '@/hooks/useProfiles';
import { useChallenges } from '@/hooks/useChallenges';
import { BottomNav } from '@/components/BottomNav';
import { FeedScreen } from '@/components/FeedScreen';
import { MapScreen } from '@/components/MapScreen';
import { ProfileScreen } from '@/components/ProfileScreen';
import { RecordingDashboard } from '@/components/RecordingDashboard';
import { AuthScreen } from '@/components/AuthScreen';
import { SplashScreen } from '@/components/SplashScreen';
import { MapScanner } from '@/components/MapScanner';
import { InvasionAlert, DuelPanel, checkInvasion } from '@/components/InvasionSystem';
import { VisitableProfile } from '@/components/VisitableProfile';
import { FollowersModal } from '@/components/FollowersModal';
import { ClanSystem } from '@/components/ClanSystem';
import { ClanProfile } from '@/components/ClanProfile';
import { SyncOverlay } from '@/components/SyncOverlay';
import { NotificationBell } from '@/components/NotificationBell';
import { TrackingNotificationBar } from '@/components/TrackingNotificationBar';
import { ConquestRegistrationModal } from '@/components/ConquestRegistrationModal';
import { useToast } from '@/hooks/use-toast';
import { useQueryClient } from '@tanstack/react-query';
import { useUnreadConflictCount } from '@/hooks/useConflicts';
import type { Conquest, Profile, Group } from '@/types';

function AppContent() {
  const { user, loading: authLoading, signOut } = useAuth();
  const { profile, updateProfile } = useProfile();
  const { conquests, myConquests, addConquest, isLoading: conquestsLoading } = useConquests();
  const { groups, myMemberships, createGroup, joinGroup, leaveGroup } = useGroups();
  const { data: clanConquests = [] } = useClanConquests();
  const { data: allProfiles = [] } = useProfiles();
  const { createChallenge, pendingChallenges } = useChallenges();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [showSplash, setShowSplash] = useState(true);
  const [activeTab, setActiveTab] = useState('feed');
  const [isRecordOpen, setIsRecordOpen] = useState(false);
  const [selectedConquest, setSelectedConquest] = useState<Conquest | null>(null);
  const [isScanning, setIsScanning] = useState(false);

  // Sync overlay for clan join
  const [syncOverlay, setSyncOverlay] = useState<{ visible: boolean; clanName: string }>({
    visible: false,
    clanName: '',
  });

  // Clan profile modal
  const [viewingClan, setViewingClan] = useState<Group | null>(null);

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
  const [followersModal, setFollowersModal] = useState<{
    isOpen: boolean;
    userId: string;
    type: 'followers' | 'following';
  }>({ isOpen: false, userId: '', type: 'followers' });

  // Conquest registration modal state
  const [conquestRegistration, setConquestRegistration] = useState<{
    isOpen: boolean;
    conquestId: string;
    stats: { area: number; distance: number; duration: number };
  }>({
    isOpen: false,
    conquestId: '',
    stats: { area: 0, distance: 0, duration: 0 },
  });

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
    mode: 'dominio';
  }) => {
    try {
      const result = await addConquest.mutateAsync({
        path: data.path,
        area: data.area,
        distance: data.distance,
      });
      
      // Open conquest registration modal
      if (result?.id) {
        setConquestRegistration({
          isOpen: true,
          conquestId: result.id,
          stats: { area: data.area, distance: data.distance, duration: data.duration },
        });
      }
    } catch (error) {
      console.error('Failed to save conquest:', error);
    }
  };

  const handleConquestRegistrationComplete = () => {
    setConquestRegistration({ isOpen: false, conquestId: '', stats: { area: 0, distance: 0, duration: 0 } });
    queryClient.invalidateQueries({ queryKey: ['conquest-posts'] });
    setIsRecordOpen(false);
  };

  const handleShowOnMap = (conquest: Conquest) => {
    setSelectedConquest(conquest);
    setActiveTab('map');
  };

  const handlePositionUpdate = useCallback((position: [number, number]) => {
    if (!user || !profile) return;
    
    // Check for invasion - only against clan members' conquests (Fog of War)
    const invaded = checkInvasion(position, clanConquests, user.id, []);
    if (invaded && invaded.user_id !== invasionAlert.conquest?.user_id) {
      setInvasionAlert({ visible: true, conquest: invaded });
    }
  }, [user, profile, clanConquests, invasionAlert.conquest?.user_id]);

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

  const handleVisitProfile = (userId: string) => {
    const foundProfile = allProfiles.find(p => p.user_id === userId);
    if (foundProfile) {
      setVisitingProfile(foundProfile);
    }
  };

  const handleViewProfileFromFeed = (profile: Profile) => {
    setVisitingProfile(profile);
  };

  const handleShowFollowers = () => {
    if (visitingProfile) {
      setFollowersModal({ isOpen: true, userId: visitingProfile.user_id, type: 'followers' });
    }
  };

  const handleShowFollowing = () => {
    if (visitingProfile) {
      setFollowersModal({ isOpen: true, userId: visitingProfile.user_id, type: 'following' });
    }
  };

  const handleViewProfileFromFollowers = (profile: Profile) => {
    setFollowersModal({ isOpen: false, userId: '', type: 'followers' });
    setVisitingProfile(profile);
  };

  const handleJoinGroup = async (groupId: string) => {
    const group = groups.find(g => g.id === groupId);
    if (group) {
      setSyncOverlay({ visible: true, clanName: group.name });
    }
    await joinGroup.mutateAsync(groupId);
  };

  const handleSyncComplete = () => {
    setSyncOverlay({ visible: false, clanName: '' });
  };

  const handleViewClan = (groupId: string) => {
    const group = groups.find(g => g.id === groupId);
    if (group) {
      setViewingClan(group);
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

  // Use clan conquests for map (Fog of War - only see clan members' territories)
  const visibleConquests = conquests;

  return (
    <div className="h-screen flex flex-col overflow-hidden bg-background">
      {/* Notification Bell Header */}
      <div className="fixed top-0 right-0 z-40 safe-top pr-4 pt-4">
        <NotificationBell />
      </div>

      {/* Sync Overlay */}
      <SyncOverlay
        isVisible={syncOverlay.visible}
        clanName={syncOverlay.clanName}
        onComplete={handleSyncComplete}
      />

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
          onShowFollowers={handleShowFollowers}
          onShowFollowing={handleShowFollowing}
        />
      )}

      {/* Followers Modal */}
      <FollowersModal
        isOpen={followersModal.isOpen}
        onClose={() => setFollowersModal({ isOpen: false, userId: '', type: 'followers' })}
        userId={followersModal.userId}
        type={followersModal.type}
        onViewProfile={handleViewProfileFromFollowers}
      />

      {/* Clan Profile Modal */}
      <ClanProfile
        group={viewingClan}
        isOpen={!!viewingClan}
        onClose={() => setViewingClan(null)}
        onViewMember={handleVisitProfile}
      />

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
              <FeedScreen onViewProfile={handleViewProfileFromFeed} />
            )}
            {activeTab === 'map' && (
              <MapScreen 
                conquests={visibleConquests}
                selectedConquest={selectedConquest}
                onSelectConquest={setSelectedConquest}
              />
            )}
            {activeTab === 'groups' && (
              <ClanSystem 
                groups={groups}
                myMemberships={myMemberships}
                profiles={allProfiles}
                onCreateGroup={(name) => createGroup.mutate(name)}
                onJoinGroup={handleJoinGroup}
                onLeaveGroup={(id) => leaveGroup.mutate(id)}
                onViewProfile={handleVisitProfile}
                onViewClan={handleViewClan}
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
            trailColor={(profile as any)?.trail_color || '#FF4F00'}
          />
        )}
      </AnimatePresence>

      {/* Conquest Registration Modal */}
      <ConquestRegistrationModal
        isOpen={conquestRegistration.isOpen}
        onClose={handleConquestRegistrationComplete}
        onComplete={handleConquestRegistrationComplete}
        conquestId={conquestRegistration.conquestId}
        stats={conquestRegistration.stats}
      />
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
